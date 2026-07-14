#Requires -Version 5.1
<#
.SYNOPSIS
    Event-driven Bee watcher - listens to `bee stream` and triggers bee sync
    when conversations complete.

.DESCRIPTION
    Reads bee stream --json line by line. When a conversation-complete or
    update-conversation event fires, debounces for 30 seconds and then runs
    bee sync to pull the latest captures into the vault.

    Auto-reconnects if the stream drops. Runs indefinitely.

    Layer 2 companion to bee-sync-scheduled.ps1 (Layer 1). Both are safe to
    run together; the watcher gets you near-real-time updates while the
    scheduled task guarantees nothing's ever more than 15 min stale.

.NOTES
    Install with scripts/install-bee-watcher-autostart.ps1 so it starts at
    login. Logs to %LOCALAPPDATA%\bee-sync\bee-watcher.log.
#>

$ErrorActionPreference = 'Continue'

# Load vault path and sentinel dir from config
$ConfigFile = Join-Path $env:LOCALAPPDATA 'bee-sync\config.ps1'
if (-not (Test-Path $ConfigFile)) {
    $LogDir = Join-Path $env:LOCALAPPDATA 'bee-sync'
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
    Add-Content -Path (Join-Path $LogDir 'bee-watcher.log') `
        -Value ("[{0}] FATAL config missing at {1}. Run install-bee-watcher-autostart.ps1 or install-bee-sync-task.ps1 first." -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $ConfigFile)
    exit 1
}
. $ConfigFile    # defines $VaultRaw; optionally $SentinelDir

# Default SentinelDir if not set in config. When the script lives inside a Kiro
# workspace at <workspace>/scripts/, default to <workspace>/.kiro/bee-inbox/.
if (-not $SentinelDir) {
    # CONDITIONAL: generalize to .agent-inbox/<consumer>/ when a 2nd event consumer appears (see CLAUDE.md)
    $SentinelDir = Join-Path (Split-Path -Parent $PSScriptRoot) '.kiro\bee-inbox'
}

$LogDir          = Join-Path $env:LOCALAPPDATA 'bee-sync'
$LogFile         = Join-Path $LogDir 'bee-watcher.log'
$HashCache       = Join-Path $LogDir 'seen-hashes.json'   # convId -> last-fired hash (shared with Layer 1)
$StuckFile       = Join-Path $LogDir 'stuck-captures.json'
$DebounceSeconds = 30

# Shared completeness gate (Test-BeeCaptureReady) - same file the scheduled sync uses,
# so both layers apply an identical "COMPLETED + settled" rule and can't drift.
. (Join-Path $PSScriptRoot 'bee-lib.ps1')

# Events that should trigger a sync
$TriggerEvents = @(
    'update-conversation',    # conversation marked complete or updated
    'new-conversation'        # a new conversation began (sync on start too, in case it completes while we're debouncing)
)

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }

function Write-WatcherLog {
    param([string]$Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -Path $LogFile -Value "[$timestamp] $Message"
}

function Trim-WatcherLog {
    if (Test-Path $LogFile) {
        $lines = Get-Content $LogFile -Tail 1000
        Set-Content -Path $LogFile -Value $lines -Encoding UTF8
    }
}

# Single-instance guard. The watcher is an infinite loop holding one `bee stream`
# connection; a second copy would fight the first over the stream and double-fire syncs.
# Whatever starts us (a BeeStreamWatcher keepalive task, an HKCU\Run login entry, or a
# manual launch) MUST NOT be able to stack. Bail out if another powershell.exe is already
# launched with -File pointing at THIS script. We match `-File ... <scriptname>` (with
# optional surrounding quotes) rather than the bare filename, so a `-Command` invocation
# that merely mentions the script (e.g. a status probe) is not mistaken for a watcher and
# does not cause a real watcher to false-exit. Own PID is excluded.
try {
    $selfName = [System.IO.Path]::GetFileName($PSCommandPath)   # bee-stream-watcher.ps1
    $filePattern = '-File\s+"?[^"]*' + [regex]::Escape($selfName)
    $others = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction Stop |
        Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -and $_.CommandLine -match $filePattern })
    if ($others.Count -gt 0) {
        $otherPids = ($others | ForEach-Object { $_.ProcessId }) -join ', '
        Write-WatcherLog "SKIP another watcher already running (pid=$otherPids); this instance (pid=$PID) exiting"
        Trim-WatcherLog
        exit 0
    }
} catch {
    # If the instance check itself fails (e.g. CIM unavailable), don't block startup -
    # log it and continue. Worst case we fall back to prior behavior.
    Write-WatcherLog "WARN single-instance check failed: $($_.Exception.Message); continuing"
}

# Resolve the bee CLI
$beeCmd = Join-Path $env:APPDATA 'npm\bee.cmd'
if (-not (Test-Path $beeCmd)) {
    try { $beeCmd = (Get-Command bee -ErrorAction Stop).Source }
    catch {
        Write-WatcherLog "FATAL bee CLI not found in PATH or %APPDATA%\npm\. Install with: npm install -g @beeai/cli"
        exit 1
    }
}

Write-WatcherLog "START bee-stream-watcher pid=$PID bee=$beeCmd"

# Track pending sync state across restarts of the inner stream loop
$pendingSync = $false
$lastTriggerTime = [DateTime]::MinValue

while ($true) {
    $stderrSrcId = $null
    $process = $null
    try {
        # Start bee stream as a child process and read stdout line-by-line
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $beeCmd
        $psi.Arguments = 'stream --json'
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $process = [System.Diagnostics.Process]::Start($psi)
        Write-WatcherLog "CONNECTED stream pid=$($process.Id)"

        # Drain stderr asynchronously. Two reasons: (1) if we never read the stderr
        # pipe and bee stream writes to it, the OS pipe buffer fills and bee blocks on
        # write -- a plausible cause of the exit=1 flapping. (2) When the stream DOES
        # drop, we want the reason in the log instead of a bare exit code. We read
        # stdout synchronously (below) and stderr via an event handler on the same
        # process -- .NET supports mixing one sync + one async reader.
        $stderrLines = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
        $stderrSrcId = "beeStderr_$($process.Id)"
        Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -SourceIdentifier $stderrSrcId -MessageData $stderrLines -Action {
            if (-not [string]::IsNullOrWhiteSpace($EventArgs.Data)) { [void]$Event.MessageData.Add($EventArgs.Data) }
        } | Out-Null
        $process.BeginErrorReadLine()

        while (-not $process.HasExited) {
            # Non-blocking-ish read: check for a line, also check debounce timer
            if (-not $process.StandardOutput.EndOfStream) {
                $line = $process.StandardOutput.ReadLine()
                if ([string]::IsNullOrWhiteSpace($line)) { continue }

                try {
                    $evt = $line | ConvertFrom-Json -ErrorAction Stop
                    $eventName = $evt.event

                    if ($TriggerEvents -contains $eventName) {
                        $pendingSync = $true
                        $lastTriggerTime = Get-Date
                        $convId = if ($evt.data.id) { $evt.data.id } else { '?' }
                        Write-WatcherLog "TRIGGER event=$eventName conv=$convId (debouncing ${DebounceSeconds}s)"
                    }
                    elseif ($eventName -eq 'connected') {
                        Write-WatcherLog "READY stream connected"
                    }
                } catch {
                    # Non-JSON line; bee stream occasionally emits status text. Ignore.
                }
            } else {
                Start-Sleep -Milliseconds 500
            }

            # Debounce: if a trigger is pending and enough time has passed, run sync
            if ($pendingSync) {
                $elapsed = (Get-Date) - $lastTriggerTime
                if ($elapsed.TotalSeconds -ge $DebounceSeconds) {
                    Write-WatcherLog "SYNC starting"
                    $syncOutput = & $beeCmd sync --output $VaultRaw 2>&1 | Out-String
                    if ($LASTEXITCODE -eq 0) {
                        Write-WatcherLog "SYNC ok"

                        # Load hash cache (shared with Layer 1)
                        $cache = @{}
                        $cacheExisted = Test-Path $HashCache
                        if ($cacheExisted) {
                            try {
                                $cachedObj = Get-Content $HashCache -Raw | ConvertFrom-Json
                                foreach ($prop in $cachedObj.PSObject.Properties) { $cache[$prop.Name] = $prop.Value }
                            } catch { $cache = @{}; $cacheExisted = $false }
                        }

                        # Fire a sentinel only for READY captures (COMPLETED + settled) whose
                        # content hash differs from the last hash we fired - same gate as Layer 1.
                        $currentFiles = Get-ChildItem $VaultRaw -Recurse -File -Filter "*.md" -ErrorAction SilentlyContinue |
                            Where-Object { $_.FullName -match '\\conversations\\' }
                        $toFire = @()
                        foreach ($f in $currentFiles) {
                            $convId = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
                            $hash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
                            if ((Test-BeeCaptureReady -Path $f.FullName).Status -eq 'ready') {
                                if (-not $cache.ContainsKey($convId) -or $cache[$convId] -ne $hash) {
                                    $toFire += [pscustomobject]@{ File = $f; ConvId = $convId; Hash = $hash }
                                }
                            }
                        }

                        # First-run guard - seed ready captures' current hashes, emit nothing.
                        if (-not $cacheExisted) {
                            foreach ($f in $currentFiles) {
                                if ((Test-BeeCaptureReady -Path $f.FullName).Status -eq 'ready') {
                                    $cache[[System.IO.Path]::GetFileNameWithoutExtension($f.Name)] = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
                                }
                            }
                            ($cache | ConvertTo-Json -Compress) | Set-Content -Path $HashCache -Encoding UTF8
                            Write-WatcherLog "SEED hash cache seeded with $($cache.Count) ready conversations (no sentinels on first run)"
                        } elseif ($toFire) {
                            if (-not (Test-Path $SentinelDir)) {
                                New-Item -ItemType Directory -Force -Path $SentinelDir | Out-Null
                            }
                            foreach ($item in $toFire) {
                                $convId = $item.ConvId
                                $f = $item.File
                                $sentinelPath = Join-Path $SentinelDir "$convId.sentinel.md"
                                $sentinelBody = @"
---
source: bee-watcher
conversation_id: $convId
raw_path: $($f.FullName)
written_at: $(Get-Date -Format 'o')
auto_process: true
---

# Bee capture ready for processing

New or updated raw capture detected: conversation **$convId**

**Read the raw file at:** ``$($f.FullName)``

Process per the ``bee-processing`` steering rules and auto-write all outputs (tasks, meeting notes, people notes) without prompting. Delete this sentinel file when processing is complete.
"@
                                Set-Content -Path $sentinelPath -Value $sentinelBody -Encoding UTF8
                                Write-WatcherLog "SENTINEL wrote $convId"
                                $cache[$convId] = $item.Hash
                            }
                            ($cache | ConvertTo-Json -Compress) | Set-Content -Path $HashCache -Encoding UTF8
                        }
                    } else {
                        Write-WatcherLog "SYNC failed exit=$LASTEXITCODE"
                        Write-WatcherLog $syncOutput.Trim()
                    }
                    $pendingSync = $false
                    Trim-WatcherLog
                }
            }
        }

        # Stream exited. Give the async stderr reader a moment to flush, then log
        # the exit code AND whatever bee wrote to stderr so the drop reason is visible.
        Start-Sleep -Milliseconds 200
        $exitCode = $process.ExitCode
        $reason = ''
        if ($stderrLines -and $stderrLines.Count -gt 0) {
            $reason = ' reason: ' + (($stderrLines | Select-Object -Last 5) -join ' | ')
        }
        Write-WatcherLog "DISCONNECTED stream exit=$exitCode;$reason reconnecting in 10s"
    }
    catch {
        Write-WatcherLog "ERROR $($_.Exception.Message); reconnecting in 10s"
    }
    finally {
        # Tear down the stderr event subscription so subscriptions don't accumulate
        # across reconnects (each loop registers a new one).
        if ($stderrSrcId) {
            Unregister-Event -SourceIdentifier $stderrSrcId -ErrorAction SilentlyContinue
            Get-Event -SourceIdentifier $stderrSrcId -ErrorAction SilentlyContinue | Remove-Event -ErrorAction SilentlyContinue
        }
        if ($process) { try { $process.Dispose() } catch {} }
    }

    Start-Sleep -Seconds 10
}
