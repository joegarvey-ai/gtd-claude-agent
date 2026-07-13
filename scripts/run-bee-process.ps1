#Requires -Version 5.1
<#
.SYNOPSIS
    Scheduled headless runner for the Claude Code Bee consumer.

.DESCRIPTION
    Runs `claude -p '/process-bee-inbox'` unattended to drain pending Bee sentinels
    into the Obsidian vault. This is the Claude Code replacement for the retired Kiro
    bee-sentinel auto-hook: the PowerShell sync (Layer 1 / Layer 2) writes sentinels;
    this runner processes them on a cadence.

    The `claude` CLI is installed inside WSL, not on Windows, so this script invokes it
    through `wsl.exe`. It cd's into the repo (so Claude picks up .claude/agents and
    .claude/commands) and passes --add-dir for the vault so the agent can write outputs
    that live outside the repo. --permission-mode acceptEdits lets the batch write and
    delete sentinels without an interactive prompt; the agent itself is scoped to
    Read/Write/Glob/Grep/Bash and has no send/ticket/email tools.

    Logs to %LOCALAPPDATA%\bee-sync\bee-process.log (beside the sync logs). Skips the
    Claude call entirely when no sentinels are pending, so it is cheap to run often.

.NOTES
    Install with scripts/install-bee-process-task.ps1 (every 30 min by default).
    Native commands (wsl.exe) are checked via $LASTEXITCODE; $ErrorActionPreference is
    left at 'Continue' so a native non-zero exit does not throw silently.

    Requires: the repo cloned on a path reachable from WSL, and `claude` on the WSL PATH.
    Set $RepoDirWin below (or via %LOCALAPPDATA%\bee-sync\bee-process-config.ps1) to this
    repo's Windows path. The vault path is read from the shared bee-sync config.ps1.
#>

$ErrorActionPreference = 'Continue'

$LogDir  = Join-Path $env:LOCALAPPDATA 'bee-sync'
$LogFile = Join-Path $LogDir 'bee-process.log'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }

function Write-ProcLog {
    param([string]$Message)
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -Path $LogFile -Value "[$ts] $Message"
}

# Repo dir (Windows path). Default to this script's parent's parent (the repo root when
# the script lives at <repo>/scripts/). Override in bee-process-config.ps1 if needed.
$RepoDirWin  = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# Optional per-machine override + vault path. The shared sync config defines $VaultRaw;
# the vault root is its parent up to (and excluding) '05 Reference\Bee\_raw'.
$ProcConfig  = Join-Path $LogDir 'bee-process-config.ps1'
if (Test-Path $ProcConfig) { . $ProcConfig }   # may set $RepoDirWin

# Derive the vault root from $VaultRaw by stripping the raw subpath. The raw subpath is
# read from the consumer's path map (.claude/bee-paths.local.json -> raw_subpath) so this
# stays correct if the vault layout changes; fall back to the historical marker otherwise.
$SyncConfig  = Join-Path $LogDir 'config.ps1'
$VaultRootWin = $null
if (Test-Path $SyncConfig) {
    . $SyncConfig    # defines $VaultRaw
    if ($VaultRaw) {
        $rawSub = $null
        $pathMap = Join-Path $RepoDirWin '.claude\bee-paths.local.json'
        if (Test-Path $pathMap) {
            try { $rawSub = (Get-Content $pathMap -Raw | ConvertFrom-Json).raw_subpath } catch {}
        }
        $marker = if ($rawSub) { '\' + ($rawSub -replace '/', '\') } else { '\05 Reference\Bee\_raw' }
        $idx = $VaultRaw.IndexOf($marker)
        if ($idx -gt 0) { $VaultRootWin = $VaultRaw.Substring(0, $idx) }
        else { $VaultRootWin = Split-Path -Parent $VaultRaw }
    }
}

# Cheap early-out: nothing to do if no sentinels are pending. Saves spinning up Claude.
$sentinelDir = Join-Path $RepoDirWin '.kiro\bee-inbox'
$pending = @()
if (Test-Path $sentinelDir) {
    $pending = @(Get-ChildItem -Path $sentinelDir -Filter '*.sentinel.md' -File -ErrorAction SilentlyContinue)
}
if ($pending.Count -eq 0) {
    Write-ProcLog "SKIP no pending sentinels"
    if (Test-Path $LogFile) { Set-Content -Path $LogFile -Value (Get-Content $LogFile -Tail 500) -Encoding UTF8 }
    exit 0
}

Write-ProcLog "START $($pending.Count) sentinel(s) pending; invoking claude -p /process-bee-inbox"

# Translate the Windows repo + vault paths to WSL form for the wsl.exe invocation.
function ConvertTo-WslPath {
    param([string]$WinPath)
    if (-not $WinPath) { return $null }
    $wp = $WinPath -replace '\\', '/'
    if ($wp -match '^([A-Za-z]):(.*)$') {
        $drive = $matches[1].ToLower()
        return "/mnt/$drive$($matches[2])"
    }
    return $wp
}

$repoWsl  = ConvertTo-WslPath $RepoDirWin
$vaultWsl = ConvertTo-WslPath $VaultRootWin

# Resolve claude's PATH. A scheduled task launches WSL with a NON-interactive shell, so
# ~/.bashrc (which is where the toolbox/npm installs usually add claude to PATH) is NOT
# sourced -- `bash -lc 'claude ...'` would fail with "command not found". Prepend the
# common install bins so claude resolves regardless. Override via $BeeClaudeBinDirs in
# bee-process-config.ps1 (colon-separated WSL dirs) if claude lives elsewhere.
if (-not $BeeClaudeBinDirs) {
    $BeeClaudeBinDirs = '$HOME/.toolbox/bin:$HOME/.local/bin:$HOME/bin:$HOME/.aim/mcp-servers'
}

# Build the bash command run inside WSL. Prepend the bin dirs, cd into the repo so .claude/
# is discovered, add the vault dir so the agent may write outside the repo, and redirect
# stdin from /dev/null so claude does not wait on stdin in a headless run.
$addDir = if ($vaultWsl) { " --add-dir '$vaultWsl'" } else { '' }
$bashCmd = "export PATH=`"$BeeClaudeBinDirs`:`$PATH`"; cd '$repoWsl' && claude -p '/process-bee-inbox' --permission-mode acceptEdits$addDir < /dev/null"

$output = & wsl.exe -e bash -lc $bashCmd 2>&1 | Out-String
$exit = $LASTEXITCODE

if ($exit -eq 0) {
    $remaining = @(Get-ChildItem -Path $sentinelDir -Filter '*.sentinel.md' -File -ErrorAction SilentlyContinue).Count
    Write-ProcLog "OK claude run complete; $remaining sentinel(s) remaining"
    $tail = ($output.Trim() -split "`n" | Select-Object -Last 3) -join ' | '
    if ($tail) { Write-ProcLog "  summary: $tail" }
} else {
    Write-ProcLog "FAIL claude exit=$exit"
    Write-ProcLog $output.Trim()
}

# Trim log to the most recent 500 lines.
if (Test-Path $LogFile) {
    Set-Content -Path $LogFile -Value (Get-Content $LogFile -Tail 500) -Encoding UTF8
}
