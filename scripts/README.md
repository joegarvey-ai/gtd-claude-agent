# Bee Sync Automation Scripts (Windows)

Two-layer Windows automation for keeping your Obsidian vault in sync with your Bee lifelogger, without manual `bee sync` calls.

## What's in here

| Script | What it does |
|--------|--------------|
| `bee-sync-scheduled.ps1` | The Layer 1 worker. Runs `bee sync` once and logs the result. Invoked by a scheduled task every 15 minutes. |
| `bee-stream-watcher.ps1` | The Layer 2 worker. Listens to `bee stream --json` and triggers a targeted `bee sync` when a conversation completes (30-second debounce). Auto-reconnects on stream drops. |
| `install-bee-sync-task.ps1` | One-shot installer for Layer 1. Creates a per-user scheduled task — no admin required. |
| `install-bee-watcher-autostart.ps1` | One-shot installer for Layer 2. Registers the watcher to auto-start at login via `HKCU\...\Run`. |

Both installers share a single config file at `%LOCALAPPDATA%\bee-sync\config.ps1` — the first one you run will prompt for your vault's `_raw` folder path and write it there.

## Why two layers?

- **Layer 1** (scheduled sync every 15 min) is a dumb but reliable safety net. If your network flakes or Bee's stream API has a hiccup, you're still guaranteed the vault is never more than 15 minutes behind.
- **Layer 2** (event-driven watcher) gives you near-real-time updates — meetings appear in your vault within ~30 seconds of completing.

They're safe to run together. Most of the time Layer 2 is what actually writes new data; Layer 1 runs a no-op when nothing's changed.

## Setup

From a PowerShell prompt in this folder:

```powershell
# Install Layer 1 (scheduled 15-min sync). First run will prompt for your vault path.
.\install-bee-sync-task.ps1

# Install Layer 2 (event-driven watcher, starts at login). Reuses the config from Layer 1.
.\install-bee-watcher-autostart.ps1

# Start Layer 2 right now without waiting for next login (one-liner in the installer output).
```

Verify both are running:

```powershell
# Layer 1 — next scheduled run
schtasks /Query /TN BeeSync15Min /FO LIST

# Layer 2 — is the watcher process alive?
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'bee-stream-watcher' }
```

## Logs

- `%LOCALAPPDATA%\bee-sync\bee-sync.log` — Layer 1 (one line per scheduled sync attempt)
- `%LOCALAPPDATA%\bee-sync\bee-watcher.log` — Layer 2 (stream events and triggered syncs)

Both logs auto-trim to the most recent 500–1000 lines.

## Uninstall

```powershell
# Remove Layer 1
schtasks /Delete /TN BeeSync15Min /F

# Remove Layer 2 auto-start
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'BeeStreamWatcher'

# Kill a running watcher instance
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'bee-stream-watcher' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# Optional: remove config and logs entirely
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\bee-sync"
```

## Mac and Linux equivalents

Not included yet. The rough mapping:

- **Layer 1**: cron or `launchd` running `bee sync --output /path/to/vault/05 Reference/Bee/_raw`
- **Layer 2**: a shell/Node script that pipes `bee stream --json | jq` into a debounced sync call, managed by `launchd` (Mac) or `systemd --user` (Linux)

PRs welcome.
