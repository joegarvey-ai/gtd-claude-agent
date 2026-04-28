# Kiro Automation for GTD Claude Agent

This directory contains [Kiro](https://kiro.ai) workspace configuration that complements the Claude Desktop setup. If you use Kiro alongside Claude Desktop, dropping this folder into your workspace gives you **fully hands-off** Bee capture processing — new meetings flow from your wearable into clean, structured Obsidian notes with no prompting.

If you don't use Kiro, ignore this directory. The Claude Desktop flow documented in the main README works standalone.

---

## What's in here

- **`steering/bee-processing.md`** — The Kiro steering file that mirrors the Bee Processor system prompt. Auto-includes when Kiro sees files in `.kiro/bee-inbox/` (the sentinel folder).
- **`hooks/bee-process-new-capture.kiro.hook`** — A `fileCreated` hook on `.kiro/bee-inbox/*.sentinel.md` that triggers auto-processing.
- **`bee-inbox/`** — Where the sync scripts drop sentinel files. Empty by default (just a `.gitkeep`).

---

## How the automation actually works

```
Bee wearable
   │
   ▼ (scripts/bee-stream-watcher.ps1 running in background, or scripts/bee-sync-scheduled.ps1 on a 15-min timer)
   │
   ▼ bee sync → <vault>/05 Reference/Bee/_raw/ (outside the workspace)
   │
   ▼ SHA256 content check — skips if nothing actually changed
   │
   ▼ writes sentinel → <workspace>/.kiro/bee-inbox/<id>.sentinel.md
   │
   ▼ Kiro fileCreated hook fires
   │
   ▼ Kiro reads sentinel → reads raw file from vault path → processes per steering → writes outputs to vault → deletes sentinel
   │
   ▼ 00 Inbox/Bee/*.md  +  05 Reference/[EMPLOYER]/Meeting Notes/*.md  +  People/<name>.md (created/updated)
```

The sentinel pattern exists because Kiro hooks only watch files inside the workspace — your Obsidian vault usually lives in iCloud or OneDrive outside the workspace. The sync scripts write a tiny in-workspace marker that points at the real raw file.

---

## How this fits with your local Kiro setup

Your real Kiro config (MCP servers, personal steering with your vault path, etc.) lives at **`~/.kiro/`** on your user profile — not inside this repo. That's intentional:

- `~/.kiro/` — your personal, machine-specific config. Never commit.
- `.kiro/` in this repo — portable, placeholder-based scaffolding that any fork can use.

When you clone or pull this repo, copy or symlink `.kiro/steering/bee-processing.md` and `.kiro/hooks/*.kiro.hook` into your actual workspace's `.kiro/` directory. Kiro picks them up automatically.

---

## Setup (Windows)

From a PowerShell prompt in the repo root:

```powershell
.\scripts\install-bee-sync-task.ps1          # Layer 1, prompts for your _raw path on first run
.\scripts\install-bee-watcher-autostart.ps1  # Layer 2, event-driven
```

The installers auto-detect this `.kiro/bee-inbox/` folder and configure sentinel writes automatically.

See [`scripts/README.md`](../scripts/README.md) for full details.

---

## Customizing for your setup

The steering file uses `[EMPLOYER]` as a placeholder for your employer folder under `05 Reference/`. Replace it with your actual employer name (e.g. `Amazon`), or delete the work/personal split entirely if you only want one meeting notes folder.

The hook fires on `.kiro/bee-inbox/*.sentinel.md` — no path change needed, it's workspace-relative.

---

## Why two prompts (Claude Desktop + Kiro)?

Same rules, two consumers. The Claude Desktop `Bee Processor` project handles the workflow when you're actively chatting. The Kiro hook handles it in the background via sentinel files while you're doing something else. Both produce identical outputs in your vault.

If you only use one of them, you're still covered — pick whichever matches your workflow.

---

## Troubleshooting

**Sentinel files pile up in `.kiro/bee-inbox/` and don't get processed:**
- Is Kiro open? The hook only fires while Kiro is running.
- Does your Kiro hook show as enabled? Check the `.kiro/hooks/bee-process-new-capture.kiro.hook` file has `"enabled": true`.
- Manually ask Kiro to "process any sentinel files in `.kiro/bee-inbox/`" to catch up.

**First-run floods you with sentinels:**
- The sync scripts seed their hash cache on first run with no sentinel output. If you saw a flood, you may have deleted `seen-hashes.json`. Run `bee sync` once manually, let it seed, then resume normal operation.

**Sentinels never get written but `bee sync` is working:**
- Check `%LOCALAPPDATA%\bee-sync\config.ps1` — does it have a `$SentinelDir` line? If not, re-run an installer, or add it manually:
  ```powershell
  $SentinelDir = 'C:\path\to\your\workspace\.kiro\bee-inbox'
  ```
