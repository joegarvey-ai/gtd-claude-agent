#Requires -Version 5.1
<#
.SYNOPSIS
    Installs the Bee stream watcher to auto-start at login (Layer 2, per-user).

.DESCRIPTION
    Adds a registry entry under HKCU:\Software\Microsoft\Windows\CurrentVersion\Run
    so the watcher starts when this user logs in. No UAC elevation required.

    Reuses the vault path config at %LOCALAPPDATA%\bee-sync\config.ps1. If that
    config doesn't exist yet, this script will prompt for it (same as the
    Layer 1 installer) and auto-detect the sentinel folder if present.

    The watcher itself loops forever with auto-reconnect logic.

    TWO WAYS TO KEEP THE WATCHER RUNNING (pick one; do not run both):

    1. HKCU\Run login entry (what this script installs). Simplest. The watcher
       starts once when you log in. If it ever crashes mid-day, it stays down until
       your next login.

    2. A repeating "keepalive" scheduled task (more resilient; recommended if you
       want mid-day crash recovery). Create a per-user task that runs the watcher
       every few minutes; because the watcher self-guards against duplicates (it
       exits immediately if another -File instance of itself is already running),
       the repeated ticks are harmless no-ops while it is up, and they relaunch it
       within minutes if it died. Windows reports SCHED_E_ALREADY_RUNNING (0x800710E0)
       on the ticks that find it alive -- that is expected, not an error. Example:
         schtasks /Create /TN BeeStreamWatcher /F /SC MINUTE /MO 5 `
           /TR 'wscript.exe "<repo>\scripts\bee-watcher-silent.vbs"'
       (Use a .vbs silent launcher, mirroring bee-sync-silent.vbs, to avoid a window
       flash on each tick. This installer does not create the task; the command above
       is the recipe.)

    Either way the watcher's single-instance guard means you will never end up with
    two live watchers fighting over the same `bee stream`.
#>

$ErrorActionPreference = 'Stop'

$runKey        = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$valueName     = 'BeeStreamWatcher'
$scriptDir     = Split-Path -Parent $PSCommandPath
$watcherScript = Join-Path $scriptDir 'bee-stream-watcher.ps1'

if (-not (Test-Path $watcherScript)) {
    Write-Error "Cannot find $watcherScript."
    exit 1
}

# Ensure config exists (shared with Layer 1)
$configDir  = Join-Path $env:LOCALAPPDATA 'bee-sync'
$configFile = Join-Path $configDir 'config.ps1'
if (-not (Test-Path $configDir)) { New-Item -ItemType Directory -Force -Path $configDir | Out-Null }

if (-not (Test-Path $configFile)) {
    Write-Host ""
    Write-Host "=== First-time setup ==="
    Write-Host "Enter the full path to your Obsidian vault's Bee raw folder."
    Write-Host ""
    $vaultPath = Read-Host "Vault _raw path"
    if ([string]::IsNullOrWhiteSpace($vaultPath)) {
        Write-Error "No path provided. Exiting."
        exit 1
    }
    if (-not (Test-Path $vaultPath)) {
        Write-Warning "Path does not exist yet: $vaultPath"
    }

    $workspaceRoot = Split-Path -Parent $scriptDir
    $kiroWorkspaceDir = Join-Path $workspaceRoot '.kiro'
    $sentinelDir = ''
    if (Test-Path $kiroWorkspaceDir) {
        $sentinelDir = Join-Path $kiroWorkspaceDir 'bee-inbox'
        New-Item -ItemType Directory -Force -Path $sentinelDir | Out-Null
        Write-Host "Detected Kiro workspace. Sentinels will land at: $sentinelDir"
    }

    $configLines = @(
        "# Auto-generated. Edit to change paths."
        "`$VaultRaw = '$vaultPath'"
    )
    if ($sentinelDir) {
        $configLines += "`$SentinelDir = '$sentinelDir'"
    }
    Set-Content -Path $configFile -Value ($configLines -join "`r`n") -Encoding UTF8
    Write-Host "Config saved: $configFile"
}

$command = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $watcherScript + '"'

if (-not (Test-Path $runKey)) { New-Item -Path $runKey -Force | Out-Null }
Set-ItemProperty -Path $runKey -Name $valueName -Value $command

Write-Host "Auto-start installed: HKCU\...\Run\$valueName"
Write-Host "Starts at your next login."
Write-Host ""
Write-Host "Note: this is the login-entry approach. For mid-day crash recovery, you can"
Write-Host "instead use a repeating keepalive scheduled task (see this script's header)."
Write-Host "Do not run both. The watcher self-guards against duplicate instances either way."
Write-Host ""
Write-Host "Logs: $configDir\bee-watcher.log"
Write-Host ""
Write-Host "Start it now (without waiting for next login):"
Write-Host "    Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','$watcherScript'"
Write-Host ""
Write-Host "Stop it:"
Write-Host "    Get-CimInstance Win32_Process -Filter `"Name='powershell.exe'`" | Where-Object { `$_.CommandLine -match 'bee-stream-watcher' } | ForEach-Object { Stop-Process -Id `$_.ProcessId -Force }"
Write-Host ""
Write-Host "Uninstall:"
Write-Host "    Remove-ItemProperty -Path '$runKey' -Name '$valueName'"
