#Requires -Version 5.1
<#
.SYNOPSIS
    Event-driven Bee watcher — listens to `bee stream` and triggers bee sync
    when conversations complete.

.DESCRIPTION
    Reads `bee stream --json` line by line. When a conversation-complete or
    update-conversation event fires, debounces for 30 seconds and runs
    `bee sync` to pull the latest captures into the vault.

    Auto-reconnects if the stream drops. Runs indefinitely.

    Layer 2 of a two-layer sync setup. Pair with bee-sync-scheduled.ps1 (Layer 1)
    as a safety net; both are safe to run together. Layer 2 gets you near-real-time
    updates, Layer 1 guarantees nothing is more than 15 min stale.

.NOTES
    Install with scripts/install-bee-watcher-autostart.ps1 so it starts at login.
    Logs to %LOCALAPPDATA%\bee-sync\bee-watcher.log.
#>

$ErrorActionPreference = 'Continue'

# Load vault path from config
$ConfigFile = Join-Path $env:LOCALAPPDATA 'bee-sync\config.ps1'
if (-not (Test-Path $ConfigFile)) {
    $LogDir = Join-Path $env:LOCALAPPDATA 'bee-sync'
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
    Add-Content -Path (Join-Path $LogDir 'bee-watcher.log') `
        -Value ("[{0}] FATAL config missing at {1}. Run install-bee-watcher-autostart.ps1 or install-bee-sync-task.ps1 first." -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $ConfigFile)
    exit 1
}
. $ConfigFile    # defines $VaultRaw

$LogDir   = Join-Path $env:LOCALAPPDATA 'bee-sync'
$LogFile  = Join-Path $LogDir 'bee-watcher.log'
$DebounceSeconds = 30

# Events that should trigger a sync
$TriggerEvents = @(
    'update-conversation',    # conversation marked complete or updated
    'new-conversation'        # a new conversation began
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

# Resolve the bee CLI
$beeCmd = Join-Path $env:APPDATA 'npm\bee.cmd'
if (-not (Test-Path $beeCmd)) {
    try { $beeCmd = (Get-Command bee -ErrorAction Stop).Source }
    catch {
        Write-WatcherLog "FATAL bee CLI not found. Install with: npm install -g @beeai/cli"
        exit 1
    }
}

Write-WatcherLog "START bee-stream-watcher pid=$PID bee=$beeCmd"

$pendingSync = $false
$lastTriggerTime = [DateTime]::MinValue

while ($true) {
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $beeCmd
        $psi.Arguments = 'stream --json'
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $process = [System.Diagnostics.Process]::Start($psi)
        Write-WatcherLog "CONNECTED stream pid=$($process.Id)"

        while (-not $process.HasExited) {
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
                    # Non-JSON line; ignore
                }
            } else {
                Start-Sleep -Milliseconds 500
            }

            if ($pendingSync) {
                $elapsed = (Get-Date) - $lastTriggerTime
                if ($elapsed.TotalSeconds -ge $DebounceSeconds) {
                    Write-WatcherLog "SYNC starting"
                    $syncOutput = & $beeCmd sync --output $VaultRaw 2>&1 | Out-String
                    if ($LASTEXITCODE -eq 0) {
                        Write-WatcherLog "SYNC ok"
                    } else {
                        Write-WatcherLog "SYNC failed exit=$LASTEXITCODE"
                        Write-WatcherLog $syncOutput.Trim()
                    }
                    $pendingSync = $false
                    Trim-WatcherLog
                }
            }
        }

        $exitCode = $process.ExitCode
        Write-WatcherLog "DISCONNECTED stream exit=$exitCode; reconnecting in 10s"
    }
    catch {
        Write-WatcherLog "ERROR $($_.Exception.Message); reconnecting in 10s"
    }

    Start-Sleep -Seconds 10
}
