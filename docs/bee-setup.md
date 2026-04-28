# Bee Lifelog Integration

> **What it gives you:** Your [Bee](https://bee.computer) wearable captures conversations throughout the day. This integration pipes those captures into Obsidian, where Claude (or Kiro) cleans them up, redacts sensitive content, and organizes them into stack-ranked tasks, structured meeting notes, and a growing set of bios of the people you work with.
>
> **Difficulty:** Moderate — install one CLI, paste a system prompt, optionally set up a background watcher.
>
> **Prerequisites:** A Bee device and account, Node.js installed (you already have this from the main setup), an Obsidian vault configured with the GTD folder structure.

---

## How It Works

```
Bee wearable
   │
   ▼  (background watcher runs `bee stream`)
<vault>/05 Reference/Bee/_raw/                ← raw captures, never edited
   │
   ▼  (Claude Desktop "Bee Processor" project OR Kiro hook)
<vault>/00 Inbox/Bee/                         ← stack-ranked tasks per meeting
<vault>/05 Reference/[EMPLOYER]/Meeting Notes/ ← cleaned work meeting summaries (common case)
<vault>/05 Reference/Meeting Notes/           ← cleaned personal meeting summaries
<vault>/People/<name>.md                      ← structured, evolving bios
```

Two agents are involved:

- **Bee Processor** — a dedicated Claude Desktop project with its own focused system prompt. Its only job is processing raw captures into the three output folders.
- **GTD Assistant** — your main project. Reads the processed outputs like any other inbox or reference material. Never touches `_raw/`.

The two communicate through the vault. No direct handoff, no cross-prompt contamination.

Replace `[EMPLOYER]` below with your actual employer folder name (e.g. `Amazon`). If you don't want the work/personal split, skip the employer subfolder and route everything to `05 Reference/Meeting Notes/`.

---

## Step 1: Install the Bee CLI

```bash
npm install -g @beeai/cli
bee login
```

Verify it works:

```bash
bee status
bee today
```

You should see your Bee profile and today's brief.

---

## Step 2: Create the Bee folders in your vault

In Obsidian (or your file explorer), create these folders inside your vault:

```
00 Inbox/
  Bee/                          ← will be auto-populated with task files
05 Reference/
  Bee/
    _raw/                       ← where sync output lands
  Meeting Notes/                ← cleaned *personal* meeting summaries land here
  [EMPLOYER]/                   ← (e.g. Amazon)
    Meeting Notes/              ← cleaned *work* meeting summaries land here
```

Most captures will be work-related. If you're not using this for work, you can skip the `[EMPLOYER]/Meeting Notes/` folder — the processor will fall back to the personal Meeting Notes folder.

The `People/` folder should already exist from the main setup.

---

## Step 3: First sync (manual)

Before wiring up automation, run a sync manually to confirm the plumbing works. Replace the path with your actual vault location:

**Mac:**
```bash
bee sync --output "$HOME/path/to/your/vault/05 Reference/Bee/_raw"
```

**Windows (PowerShell):**
```powershell
bee sync --output "C:\Users\YOUR_USERNAME\path\to\your\vault\05 Reference\Bee\_raw"
```

You should see `facts.md`, `todos.md`, and a `conversations/` directory appear in `_raw/`. Open one of the conversation files in Obsidian to confirm it's readable.

### Heads-up on raw transcripts

As of this writing, the Bee CLI export does not include speaker diarization — every utterance is labeled `Unknown:`. The processor handles this by inferring speakers from context and flagging the limitation in each meeting note. Expect this to improve as Bee ships diarization.

---

## Step 4: Create the Bee Processor project in Claude Desktop

1. Open Claude Desktop
2. Left sidebar → **Projects** → **Create Project**
3. Name it **Bee Processor**
4. Click **Set custom instructions**
5. Open [`system-prompt-bee-processor.md`](../system-prompt-bee-processor.md) in this repo
6. Copy everything below the `---` line
7. Paste it into the project's custom instructions
8. Replace `[YOUR_NAME]`, `[VAULT_PATH]`, and `[EMPLOYER]` with your own info
9. Save

Test it: open a chat in the Bee Processor project and say:

> Process the most recent capture in my Bee raw folder.

The processor should read one raw file, propose three output files (tasks, meeting notes, people), and wait for your confirmation before writing.

---

## Step 5: Teach the GTD Assistant about Bee outputs

Your main GTD project already has instructions for processing `00 Inbox/`. It needs a small update to recognize the Bee subfolder and the Meeting Notes references.

1. Open your main GTD project in Claude Desktop
2. Edit the custom instructions
3. Make sure it's up to date with the latest [`system-prompt.md`](../system-prompt.md) in this repo — the Bee section is already included

You don't need to do anything else. The GTD Assistant reads the already-processed outputs; it never touches raw captures.

---

## Step 6: Automated sync (Windows)

This repo ships PowerShell scripts that give you two layers of sync automation on Windows:

- **Layer 1 -- scheduled sync every 15 min.** Simple, boring, reliable safety net. Your vault is never more than 15 minutes behind.
- **Layer 2 -- event-driven watcher.** Listens to `bee stream --json` and triggers a targeted sync within ~30 seconds of each conversation completing.

Both are safe to run together. Install them from a PowerShell prompt:

```powershell
# From the repo root
.\scripts\install-bee-sync-task.ps1          # Layer 1 - prompts for your _raw path on first run
.\scripts\install-bee-watcher-autostart.ps1  # Layer 2 - reuses the Layer 1 config
```

See [`scripts/README.md`](../scripts/README.md) for full details, verification commands, logs, and uninstall steps. The scripts require no admin/UAC elevation.

### Mac and Linux

Reference scripts for cron and `launchd` are planned. For now, the simplest Mac setup:

```bash
crontab -e
# Add:
*/15 * * * * /usr/local/bin/bee sync --output "$HOME/path/to/vault/05 Reference/Bee/_raw" > /dev/null 2>&1
```

For event-driven on Mac/Linux, run `bee stream --json` into a debounced shell script managed by `launchd` or `systemd --user`. PRs welcome.


## Kiro users: automatic processing via hook

If you use [Kiro](https://kiro.ai) alongside Claude Desktop, this repo includes a hook that auto-processes new Bee captures the moment they land in `_raw/`.

The hook lives at `.kiro/hooks/bee-process-new-capture.kiro.hook` and fires on `fileCreated` events matching `**/05 Reference/Bee/_raw/**/*.md`. It follows the processing rules in `.kiro/steering/bee-processing.md`, which mirror the Claude Desktop system prompt.

With Kiro open, you don't need to manually trigger the Bee Processor — Kiro handles it in the background and proposes the output files for your confirmation. See [`.kiro/README.md`](../.kiro/README.md) for how to wire this into your Kiro workspace.

---

## Ad-hoc queries

Once captures are flowing, you can ask the GTD Assistant natural-language questions that read across meeting notes and people bios:

> "I met with Trag last week about a new hackathon — remind me what some of the ideas were?"

> "What's the pattern with how Sarah makes decisions? I've got a tricky pitch coming up."

> "Pull up every meeting from the last two weeks where we discussed the Q2 roadmap."

The assistant searches the Meeting Notes folders and the relevant `People/` notes via the Obsidian MCP. No direct connection to Bee's live API required — the processed markdown is the source.

---

## Privacy & redaction

Bee records conversations. The redaction policy in the Bee Processor system prompt uses judgment (not keyword matching) to exclude:

- Intimate, romantic, or sexual content
- Personal medical information
- Family-private matters involving minors or finances
- Third parties who clearly didn't consent to being recorded

If a capture is entirely personal, the Processor writes nothing and notes the skip. Raw captures stay in `_raw/` — you can delete them manually if you want them gone entirely.

**The `_raw/` folder contains unfiltered lifelog data. Treat it accordingly:**
- Don't sync `_raw/` to cloud-backed Obsidian plugins you don't trust
- Consider excluding it from any git-backed vault sync
- If you share your vault across devices, decide whether `_raw/` should travel with it
