# Bee Sync Automation Scripts (Windows)

Two-layer automation that keeps your Obsidian vault in sync with Bee lifelog captures and — optionally — auto-triggers Kiro processing via sentinel files.

## What's in here

| Script | What it does |
|--------|--------------|
| `bee-sync-scheduled.ps1` | The Layer 1 worker. Runs `bee sync`, detects genuinely-changed conversations via content hash, writes sentinel files to trigger Kiro, and logs the result. Invoked by a scheduled task every 15 minutes. |
| `bee-stream-watcher.ps1` | The Layer 2 worker. Listens to `bee stream --json` and triggers a targeted sync within ~30s of each conversation completing (30-second debounce). Auto-reconnects on stream drops. Writes the same sentinel files as Layer 1. |
| `install-bee-sync-task.ps1` | One-shot installer for Layer 1. Prompts for your vault path on first run, auto-detects your Kiro workspace if present, creates a per-user scheduled task — no admin required. |
| `install-bee-watcher-autostart.ps1` | One-shot installer for Layer 2. Reuses the Layer 1 config. Registers the watcher to auto-start at login via `HKCU\...\Run`. |

Both installers share a single config file at `%LOCALAPPDATA%\bee-sync\config.ps1`.

## Why two layers?

- **Layer 1** (scheduled sync every 15 min) is a reliable safety net. If your network flakes or Bee's stream API hiccups, your vault is still guaranteed to be at most 15 minutes behind.
- **Layer 2** (event-driven watcher) gives near-real-time updates — meetings appear in your vault within ~30 seconds of completing.

Safe to run together. Most of the time Layer 2 writes new data first; Layer 1 runs as a no-op when nothing's changed.

## Sentinel files: the Kiro hook bridge

The sync scripts don't just populate your vault's `_raw/` folder. They also drop a small sentinel file into `<your-workspace>/.kiro/bee-inbox/<conversation-id>.sentinel.md` whenever a genuinely new or updated conversation is detected (via SHA256 content comparison, not timestamps — since `bee sync` rewrites files every run even when content hasn't changed).

Why this matters: Kiro `fileCreated` hooks only watch files inside your workspace folder. Your Obsidian vault lives elsewhere (usually iCloud or OneDrive). The sentinel file is the in-workspace marker that fires the hook. The hook reads the sentinel's frontmatter to find the raw file path in the vault, processes it, and deletes the sentinel.

Sentinel frontmatter:

```yaml
---
source: bee-watcher                    # or bee-scheduled-sync
conversation_id: 7775991
raw_path: C:\...\_raw\conversations\2026-04-28\7775991.md
written_at: 2026-04-28T12:33:45-07:00
auto_process: true
---
```

If you're not using Kiro, sentinels still get written (they're harmless) but nothing processes them. Delete `.kiro/bee-inbox/*.sentinel.md` periodically or leave them — they're tiny.

## Setup

From a PowerShell prompt in this folder (inside the gtd-claude-agent workspace):

```powershell
# Layer 1. First run prompts for your vault path and auto-detects the Kiro sentinel folder.
.\install-bee-sync-task.ps1

# Layer 2 (event-driven watcher, starts at login). Reuses Layer 1 config.
.\install-bee-watcher-autostart.ps1

# Start Layer 2 right now without waiting for next login (one-liner printed by the installer).
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

- `%LOCALAPPDATA%\bee-sync\bee-sync.log` — Layer 1 scheduled syncs + sentinel writes
- `%LOCALAPPDATA%\bee-sync\bee-watcher.log` — Layer 2 stream events, triggered syncs, sentinel writes
- `%LOCALAPPDATA%\bee-sync\seen-hashes.json` — content-hash cache so only truly-new conversations trigger sentinels

Both logs auto-trim to the most recent 500–1000 lines.

## First-run behavior

On the first run after a fresh install (or if you delete `seen-hashes.json`), the scripts seed the hash cache from your existing `_raw/` folder without emitting any sentinels. This prevents a flood of triggers on first boot. The next sync that actually detects changed content will emit its first sentinel.

## Uninstall

```powershell
# Remove Layer 1
schtasks /Delete /TN BeeSync15Min /F

# Remove Layer 2 auto-start
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'BeeStreamWatcher'

# Kill a running watcher
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'bee-stream-watcher' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# Optional: remove config, logs, and hash cache entirely
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\bee-sync"
```

## Mac and Linux equivalents

Not shipped yet. Rough mapping:

- **Layer 1**: cron or `launchd` running `bee sync --output /path/to/vault/_raw`, plus a small wrapper that checks SHA256 hashes and drops sentinels into `<workspace>/.kiro/bee-inbox/`
- **Layer 2**: `bee stream --json | jq 'select(.event == "update-conversation")'` piped into a debounced sync, managed by `launchd` (Mac) or `systemd --user` (Linux)

PRs welcome.
