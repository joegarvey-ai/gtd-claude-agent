#Requires -Version 5.1
<#
.SYNOPSIS
    Scheduled bee sync — pulls Bee lifelog captures into the Obsidian vault.

.DESCRIPTION
    Runs `bee sync` on a schedule (typically every 15 min via Task Scheduler).
    Logs to %LOCALAPPDATA%\bee-sync\bee-sync.log.

    Reads the vault path from %LOCALAPPDATA%\bee-sync\config.ps1.
    If that file doesn't exist yet, run scripts/install-bee-sync-task.ps1 first —
    it will prompt you for the path and generate the config.

.NOTES
    Layer 1 of a two-layer sync setup. Pair with bee-stream-watcher.ps1 (Layer 2)
    for near-real-time event-driven sync. See docs/bee-setup.md.
#>

$ErrorActionPreference = 'Continue'

# Load vault path from config
$ConfigFile = Join-Path $env:LOCALAPPDATA 'bee-sync\config.ps1'
if (-not (Test-Path $ConfigFile)) {
    $LogDir = Join-Path $env:LOCALAPPDATA 'bee-sync'
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
    Add-Content -Path (Join-Path $LogDir 'bee-sync.log') `
        -Value ("[{0}] FATAL config missing at {1}. Run install-bee-sync-task.ps1 to generate it." -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $ConfigFile)
    exit 1
}
. $ConfigFile    # defines $VaultRaw

$LogDir   = Join-Path $env:LOCALAPPDATA 'bee-sync'
$LogFile  = Join-Path $LogDir 'bee-sync.log'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

try {
    # Resolve bee CLI — typically at %APPDATA%\npm\bee.cmd after `npm install -g @beeai/cli`
    $beeCmd = Join-Path $env:APPDATA 'npm\bee.cmd'
    if (-not (Test-Path $beeCmd)) {
        $beeCmd = (Get-Command bee -ErrorAction Stop).Source
    }

    $output = & $beeCmd sync --output $VaultRaw 2>&1 | Out-String

    if ($LASTEXITCODE -eq 0) {
        Add-Content -Path $LogFile -Value "[$timestamp] OK sync completed"
    } else {
        Add-Content -Path $LogFile -Value "[$timestamp] FAIL exit=$LASTEXITCODE"
        Add-Content -Path $LogFile -Value $output
    }
} catch {
    Add-Content -Path $LogFile -Value "[$timestamp] ERROR $($_.Exception.Message)"
}

# Trim log to most recent 500 lines
if (Test-Path $LogFile) {
    $lines = Get-Content $LogFile -Tail 500
    Set-Content -Path $LogFile -Value $lines -Encoding UTF8
}
