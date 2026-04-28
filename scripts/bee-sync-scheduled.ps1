#Requires -Version 5.1
<#
.SYNOPSIS
    Scheduled bee sync — pulls Bee lifelog captures into the Obsidian vault.

.DESCRIPTION
    Runs `bee sync` on a schedule (typically every 15 min via Task Scheduler).
    Logs to %LOCALAPPDATA%\bee-sync\bee-sync.log. Silent on success, writes
    stderr on failure.

.NOTES
    Called by the scheduled task created by scripts/install-bee-sync-task.ps1.
    The vault path is stored in %LOCALAPPDATA%\bee-sync\config.ps1 — re-run
    the installer to change it, or edit the config file directly.
#>

$ErrorActionPreference = 'Continue'

# Load vault path and sentinel dir from config
$ConfigFile = Join-Path $env:LOCALAPPDATA 'bee-sync\config.ps1'
if (-not (Test-Path $ConfigFile)) {
    $LogDir = Join-Path $env:LOCALAPPDATA 'bee-sync'
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
    Add-Content -Path (Join-Path $LogDir 'bee-sync.log') `
        -Value ("[{0}] FATAL config missing at {1}. Run install-bee-sync-task.ps1 to generate it." -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $ConfigFile)
    exit 1
}
. $ConfigFile    # defines $VaultRaw; optionally $SentinelDir

# Default SentinelDir if not set in config. When running inside a Kiro workspace,
# the Kiro hook expects sentinels under <workspace>/.kiro/bee-inbox/. Default here
# assumes the script is inside <workspace>/scripts/ and walks one level up.
if (-not $SentinelDir) {
    $SentinelDir = Join-Path (Split-Path -Parent $PSScriptRoot) '.kiro\bee-inbox'
}

$LogDir    = Join-Path $env:LOCALAPPDATA 'bee-sync'
$LogFile   = Join-Path $LogDir 'bee-sync.log'
$HashCache = Join-Path $LogDir 'seen-hashes.json'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

try {
    # Resolve bee CLI — installed globally via npm, typically at %APPDATA%\npm\bee.cmd
    $beeCmd = Join-Path $env:APPDATA 'npm\bee.cmd'
    if (-not (Test-Path $beeCmd)) {
        # Fallback to PATH lookup
        $beeCmd = (Get-Command bee -ErrorAction Stop).Source
    }

    $output = & $beeCmd sync --output $VaultRaw 2>&1 | Out-String

    if ($LASTEXITCODE -eq 0) {
        Add-Content -Path $LogFile -Value "[$timestamp] OK sync completed"

        # Load the hash cache (content-based change detection — file timestamps lie because
        # bee sync rewrites every file every run even when content hasn't changed).
        $cache = @{}
        $cacheExisted = Test-Path $HashCache
        if ($cacheExisted) {
            try {
                $cachedObj = Get-Content $HashCache -Raw | ConvertFrom-Json
                foreach ($prop in $cachedObj.PSObject.Properties) { $cache[$prop.Name] = $prop.Value }
            } catch {
                # Cache corrupt — treat as first run
                $cache = @{}
                $cacheExisted = $false
            }
        }

        # Find conversations whose content has changed (or are brand new)
        $changed = @()
        $currentFiles = Get-ChildItem $VaultRaw -Recurse -File -Filter "*.md" -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match '\\conversations\\' }

        foreach ($f in $currentFiles) {
            $convId = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
            $hash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
            if (-not $cache.ContainsKey($convId) -or $cache[$convId] -ne $hash) {
                $changed += $f
                $cache[$convId] = $hash
            }
        }

        # Persist updated cache
        ($cache | ConvertTo-Json -Compress) | Set-Content -Path $HashCache -Encoding UTF8

        # First-run guard: if the cache didn't exist before, seed it silently — don't flood
        # sentinels for every historical conversation that was already processed.
        if (-not $cacheExisted) {
            Add-Content -Path $LogFile -Value "[$timestamp] SEED hash cache seeded with $($currentFiles.Count) existing conversations (no sentinels emitted on first run)"
        } elseif ($changed) {
            if (-not (Test-Path $SentinelDir)) {
                New-Item -ItemType Directory -Force -Path $SentinelDir | Out-Null
            }
            foreach ($f in $changed) {
                $convId = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
                $sentinelPath = Join-Path $SentinelDir "$convId.sentinel.md"
                $sentinelBody = @"
---
source: bee-scheduled-sync
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
                Add-Content -Path $LogFile -Value "[$timestamp] SENTINEL wrote $convId"
            }
        }
    } else {
        Add-Content -Path $LogFile -Value "[$timestamp] FAIL exit=$LASTEXITCODE"
        Add-Content -Path $LogFile -Value $output
    }
} catch {
    Add-Content -Path $LogFile -Value "[$timestamp] ERROR $($_.Exception.Message)"
}

# Trim log to most recent 500 lines to prevent runaway growth
if (Test-Path $LogFile) {
    $lines = Get-Content $LogFile -Tail 500
    Set-Content -Path $LogFile -Value $lines -Encoding UTF8
}
