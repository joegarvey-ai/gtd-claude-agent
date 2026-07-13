# Kiro Automation for GTD Claude Agent

> **Bee hooks are deprecated (moved to Claude Code).** The two Bee hooks in `hooks/` are
> disabled (`enabled: false`). Bee processing now runs on **Claude Code** via the
> `bee-processor` subagent (`.claude/agents/bee-processor.md`), the `/process-bee-inbox`
> command, and the scheduled `scripts/run-bee-process.ps1` runner. See the main
> [`CLAUDE.md`](../CLAUDE.md) ("Bee processing on Claude Code") and
> [`docs/bee-setup.md`](../docs/bee-setup.md). This directory is kept for the shared
> processing rules (`steering/bee-processing.md`, still used by both runtimes), the
> sentinel inbox (`bee-inbox/`, still where the sync drops sentinels), and as a reference
> for anyone still running the pipeline under Kiro. The rest of this file describes that
> legacy Kiro path.

This directory contains [Kiro](https://kiro.ai) workspace configuration. Historically, if you used Kiro alongside Claude Desktop, dropping this folder into your workspace gave you **near-hands-off** Bee capture processing — new meetings flow from your wearable into clean, structured Obsidian notes. An auto-hook attempted this on its own (best-effort — Kiro hooks only fire while the workspace is open), and a one-click manual command ("process my Bee inbox") drained anything the auto-hook missed.

If you don't use Kiro, ignore the hooks here — the Claude Code consumer is the supported path, and the Claude Desktop flow documented in the main README works standalone.

---

## What's in here

- **`steering/bee-processing.md`** — The Kiro steering file that mirrors the Bee Processor system prompt. Auto-includes when Kiro sees files in `.kiro/bee-inbox/` (the sentinel folder).
- **`hooks/bee-sentinel-auto-process.kiro.hook`** — A `fileCreated` hook on `.kiro/bee-inbox/*.sentinel.md` that triggers best-effort auto-processing.
- **`hooks/bee-process-inbox.kiro.hook`** — A `userTriggered` manual command ("process my Bee inbox") that drains all pending sentinels in one pass. Reliable fallback for when the auto-hook doesn't fire.
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
   ▼ Kiro fileCreated hook fires (best-effort) — or you run "process my Bee inbox" manually
   │
   ▼ per sentinel: idempotency guard (skip if already processed) → skip if capture still CAPTURING
   │              → read raw file → process per steering → write outputs to vault → delete sentinel
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
- This is expected sometimes — the auto-hook is best-effort (Kiro hooks only fire while the workspace is open, and background writes don't always trigger them).
- **Fix: run the manual command** — click the `bee-process-inbox` hook in Kiro, or say "process my Bee inbox." It drains all pending sentinels in one pass.
- Check both hooks show enabled: `.kiro/hooks/bee-sentinel-auto-process.kiro.hook` and `.kiro/hooks/bee-process-inbox.kiro.hook` should each have `"enabled": true`.

**First-run floods you with sentinels:**
- The sync scripts seed their hash cache on first run with no sentinel output. If you saw a flood, you may have deleted `seen-hashes.json`. Run `bee sync` once manually, let it seed, then resume normal operation.

**Sentinels never get written but `bee sync` is working:**
- Check `%LOCALAPPDATA%\bee-sync\config.ps1` — does it have a `$SentinelDir` line? If not, re-run an installer, or add it manually:
  ```powershell
  $SentinelDir = 'C:\path\to\your\workspace\.kiro\bee-inbox'
  ```
