# Kiro Automation for GTD Claude Agent

This directory contains [Kiro](https://kiro.ai) workspace configuration that complements the Claude Desktop setup. If you use Kiro alongside Claude Desktop, dropping this folder into your workspace gives you automatic background processing of Bee captures.

If you don't use Kiro, you can ignore this directory entirely — the Claude Desktop flow documented in the main README works standalone.

---

## What's in here

- **`steering/bee-processing.md`** — A Kiro steering file that mirrors the Bee Processor system prompt. When Kiro sees a new raw Bee capture, it follows these rules to redact and route the content.
- **`hooks/bee-process-new-capture.kiro.hook`** — A `fileCreated` hook that auto-triggers the processing workflow whenever a new file lands in `05 Reference/Bee/_raw/` in your Obsidian vault.

---

## How this fits with your local Kiro setup

Your real Kiro config (MCP servers, personal steering rules with your vault path baked in, etc.) lives at **`~/.kiro/`** on your user profile — not inside this repo. That's intentional:

- `~/.kiro/` — your personal, machine-specific config. Never commit.
- `.kiro/` in this repo — portable, placeholder-based scaffolding that any fork can use.

When you clone or pull this repo, copy or symlink the `.kiro/steering/bee-processing.md` and `.kiro/hooks/*.kiro.hook` into your actual workspace's `.kiro/` directory. Kiro picks them up automatically.

---

## Customizing for your setup

The steering file uses `[EMPLOYER]` as a placeholder for your employer folder under `05 Reference/`. Replace it with your actual employer name (e.g. `Amazon`) once, or delete the work/personal split entirely if you only want one meeting notes folder.

The hook file pattern is `**/05 Reference/Bee/_raw/**/*.md`. That matches any vault rooted anywhere — you don't need to change it.

---

## Why two prompts (Claude Desktop + Kiro)?

Same rules, two consumers. The Claude Desktop `Bee Processor` project handles the workflow when you're actively chatting. The Kiro hook handles it in the background while you're doing something else. Both produce identical outputs in your vault.

If you only use one of them, you're still covered — pick whichever matches your workflow.
