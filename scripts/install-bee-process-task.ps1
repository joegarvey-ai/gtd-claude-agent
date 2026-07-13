#Requires -Version 5.1
<#
.SYNOPSIS
    One-shot installer for the "BeeProcess30Min" scheduled task - the Claude Code
    Bee consumer that replaces the retired Kiro auto-hook.

.DESCRIPTION
    Creates a user-level scheduled task that runs run-bee-process.ps1 every 30 minutes
    while you're logged in. That script invokes `claude -p '/process-bee-inbox'` inside
    WSL to drain pending Bee sentinels into your vault. No UAC elevation required.

    Runs through bee-process-silent.vbs (via wscript.exe) for a hidden, no-flash launch
    and single-level quoting - same pattern as the Layer 1 sync task.

    Cadence: 30 min by default. The sync (BeeSync15Min) writes sentinels every 15 min;
    this drains them every 30. run-bee-process.ps1 early-outs cheaply when nothing is
    pending, so a frequent cadence is fine. To chain it right after each sync instead,
    add a `& run-bee-process.ps1` call at the end of bee-sync-scheduled.ps1 rather than
    installing this task.

.NOTES
    Uses schtasks.exe. Native commands are checked via $LASTEXITCODE; $ErrorActionPreference
    stays 'Continue' (it does not trap native exit codes).
#>

$ErrorActionPreference = 'Continue'

$taskName    = 'BeeProcess30Min'
$scriptDir   = Split-Path -Parent $PSCommandPath
$procScript  = Join-Path $scriptDir 'run-bee-process.ps1'
$launcherVbs = Join-Path $scriptDir 'bee-process-silent.vbs'
$intervalMin = 30

if (-not (Test-Path $procScript)) {
    Write-Error "Cannot find $procScript."
    exit 1
}
if (-not (Test-Path $launcherVbs)) {
    Write-Error "Cannot find $launcherVbs (the silent launcher). It ships alongside this installer."
    exit 1
}

# Sanity check: warn (don't fail) if WSL or claude isn't reachable yet.
$wslOk = $false
try {
    $probe = & wsl.exe -e bash -lc 'command -v claude' 2>&1
    if ($LASTEXITCODE -eq 0 -and $probe) { $wslOk = $true }
} catch {}
if ($wslOk) {
    Write-Host "Verified: claude is on the WSL PATH ($($probe.Trim()))."
} else {
    Write-Warning "Could not confirm 'claude' on the WSL PATH. The task will still install;"
    Write-Warning "ensure `claude` runs inside `wsl.exe -e bash -lc 'claude --version'` before relying on it."
}

# /Create /F overwrites; no pre-delete needed. wscript.exe "<launcher>" - one quoted path.
$command = 'wscript.exe "' + $launcherVbs + '"'
$startTime = (Get-Date).AddMinutes(2).ToString('HH:mm')

$result = & schtasks.exe /Create /TN $taskName /TR $command /SC MINUTE /MO $intervalMin /ST $startTime /F 2>&1
$createExit = $LASTEXITCODE
Write-Host $result

if ($createExit -ne 0) {
    Write-Error "schtasks /Create failed (exit $createExit). Task not installed."
    exit 1
}

Write-Host ""
Write-Host "Installed: $taskName"
Write-Host "Runs every $intervalMin minutes via: $command"
Write-Host "Logs: $env:LOCALAPPDATA\bee-sync\bee-process.log"
Write-Host ""
Write-Host "Smoke test (run it now, then check the log):"
Write-Host "    schtasks /Run /TN $taskName"
Write-Host "    Get-Content `"$env:LOCALAPPDATA\bee-sync\bee-process.log`" -Tail 5"
Write-Host ""
Write-Host "Uninstall:"
Write-Host "    schtasks /Delete /TN $taskName /F"
