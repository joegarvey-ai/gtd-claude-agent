#Requires -Version 5.1
<#
.SYNOPSIS
    Headless run of the calendar-prep agent via Claude Code.

.DESCRIPTION
    Reference runner produced by the "add a new agent" playbook (docs/add-an-agent.md)
    as the worked calendar-prep example. Runs Claude Code non-interactively (-p) from the
    repo so the project's CLAUDE.md, subagents, and commands load, executes /calendar-prep,
    and lets the calendar-prep subagent write per-meeting prep notes into the Obsidian vault.

    The digest target lives in the Obsidian vault, outside the project cwd, so the run
    passes --add-dir for the vault to grant that write, plus --permission-mode acceptEdits
    so no prompt blocks the unattended run. It does NOT use --dangerously-skip-permissions
    (writes stay scoped to the allowed tools).

    NOT YET LIVE: this runner is a reference scaffold. Promoting calendar-prep to a live
    scheduled Tier-0 job is gated on its eval suite passing on Sonnet (see the two gates in
    docs/add-an-agent.md). Do not install a scheduled task from this until then.

.NOTES
    Logs to %LOCALAPPDATA%\personal-assistant-kit\calendar-prep.log.
    Claude Code runs inside WSL on this machine, so the task shells in via wsl.
#>

$ErrorActionPreference = 'Continue'

$LogDir  = Join-Path $env:LOCALAPPDATA 'personal-assistant-kit'
$LogFile = Join-Path $LogDir 'calendar-prep.log'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

# Project dir as a WSL path (the workspace lives on the Windows desktop, mounted at /mnt/c).
$projWsl = '/mnt/c/Users/joegarve/Desktop/gtd-claude-agent-main'

# Vault dir as a WSL path. Prep notes land in the Obsidian vault, OUTSIDE the project cwd,
# so the run needs --add-dir to grant write access there. WSL form of the Windows vault path.
$vaultWsl = '/mnt/c/Users/joegarve/iCloudDrive/iCloud~md~obsidian'

# Tightly-scoped tools. This set MUST match the calendar-prep agent frontmatter (tools:)
# exactly (the tool-parity gate in docs/add-an-agent.md). Read + Write + Glob + Grep only;
# no calendar-write, no send, no skip-all-permissions.
$allowed = @(
    'Read', 'Write', 'Glob', 'Grep'
) -join ' '

# Build the WSL command. cd into the project so CLAUDE.md/agents/commands load. Grant the
# vault dir with --add-dir so the agent can write prep notes outside the repo, and redirect
# stdin from /dev/null (last token, so bash binds it to the claude call) so a headless run
# cannot hang waiting on a TTY the scheduled task never provides.
$claude = '/home/joegarve/.toolbox/bin/claude'
$inner  = "cd '$projWsl' && $claude -p '/calendar-prep' --permission-mode acceptEdits --allowedTools $allowed --add-dir '$vaultWsl' < /dev/null"

Add-Content -Path $LogFile -Value "[$ts] START calendar-prep"
try {
    $out = & wsl.exe -e bash -lc $inner 2>&1 | Out-String
    Add-Content -Path $LogFile -Value $out.Trim()
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] DONE exit=$LASTEXITCODE"
} catch {
    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR $($_.Exception.Message)"
}

# Trim log to last 500 lines.
if (Test-Path $LogFile) {
    $lines = Get-Content $LogFile -Tail 500
    Set-Content -Path $LogFile -Value $lines -Encoding UTF8
}
