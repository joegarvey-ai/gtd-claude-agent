# Bee Lifelog Integration

> **What it gives you:** Your [Bee](https://bee.computer) wearable captures conversations throughout the day. This integration pipes those captures into Obsidian, where Claude (or Kiro) cleans them up, redacts sensitive content, and organizes them into tasks, meeting notes, and a growing set of structured bios of the people you work with.
>
> **Difficulty:** Moderate — install one CLI, paste a system prompt, optionally set up a background watcher.
>
> **Prerequisites:** A Bee device + account, Node.js installed (you already have this from the main setup), an Obsidian vault configured with the GTD folder structure.

---

## How It Works

```
Bee wearable
   │
   ▼  (background watcher runs `bee stream`)
<vault>/05 Reference/Bee/_raw/             ← raw captures, never edited
   │
   ▼  (Claude Desktop "Bee Processor" project OR Kiro)
<vault>/00 Inbox/Bee/                      ← stack-ranked tasks per meeting
<vault>/05 Reference/Amazon/Meeting Notes/ ← cleaned work meeting summaries (common case)
<vault>/05 Reference/Meeting Notes/        ← cleaned personal meeting summaries
<vault>/People/<name>.md                   ← structured, evolving bios
```

Two agents are involved:

- **Bee Processor** — a dedicated Claude Desktop project with its own focused system prompt. Its only job is processing raw captures into the three output folders.
- **GTD Assistant** — your main project. Reads the processed outputs like any other inbox or reference material. Never touches `_raw/`.

The two communicate through the vault. No direct handoff, no cross-prompt contamination.

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
  Amazon/                       ← (or your employer's name)
    Meeting Notes/              ← cleaned *work* meeting summaries land here
```

Most captures will be work-related. If you're not using this for work, you can skip the `Amazon/Meeting Notes/` folder — the processor uses judgment and will fall back to the personal Meeting Notes folder.

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

You should see `facts.md`, `todos.md`, and a `daily/` directory appear in `_raw/`. Open one of the conversation files in Obsidian to confirm it's readable.

---

## Step 4: Create the Bee Processor project in Claude Desktop

1. Open Claude Desktop
2. Left sidebar → **Projects** → **Create Project**
3. Name it **Bee Processor**
4. Click **Set custom instructions**
5. Open [`system-prompt-bee-processor.md`](../system-prompt-bee-processor.md) in this repo
6. Copy everything below the `---` line
7. Paste it into the project's custom instructions
8. Replace `[YOUR_NAME]` and `[VAULT_PATH]` with your own info
9. Save

Test it: open a chat in the Bee Processor project and say:

> Process the most recent capture in my Bee raw folder.

The processor should read one raw file, propose three output files (tasks, meeting notes, people), and wait for your confirmation before writing.

---

## Step 5: Teach the GTD Assistant about Bee outputs

Your main GTD project already has instructions for processing `00 Inbox/`. It needs a small update to recognize the Bee subfolder and the Meeting Notes reference.

1. Open your main GTD project in Claude Desktop
2. Edit the custom instructions
3. Make sure it's up to date with the latest [`system-prompt.md`](../system-prompt.md) in this repo — the Bee section is already included

You don't need to do anything else. The GTD Assistant reads the already-processed outputs; it never touches raw captures.

---

## Step 6: Event-driven sync (the real-time piece)

Running `bee sync` manually is fine for trying it out, but the real win is having captures flow into Obsidian automatically as meetings end.

The Bee CLI has a `bee stream` command that emits live events. When a conversation completes, you can trigger a targeted sync of just that conversation.

### Option A — Simple: scheduled polling

If you want something minimal, schedule `bee sync` to run every 15 minutes.

**Mac (cron):**
```bash
crontab -e
# Add:
*/15 * * * * /usr/local/bin/bee sync --output "$HOME/path/to/vault/05 Reference/Bee/_raw" > /dev/null 2>&1
```

**Windows (Task Scheduler):**

Create a scheduled task that runs this PowerShell command every 15 minutes:
```powershell
bee sync --output "C:\Users\YOUR_USERNAME\path\to\vault\05 Reference\Bee\_raw"
```

### Option B — Event-driven: `bee stream` watcher

A small watcher script runs `bee stream --json` in the background. When it sees an `update-conversation` event marking a conversation as complete, it runs a targeted sync.

A reference watcher script is planned for a future release of this repo. In the meantime, you can write your own — the event shape is documented in the [Bee Realtime docs](https://docs.bee.computer/docs/realtime).

---

## Kiro users: automatic processing via hooks

If you use [Kiro](https://kiro.ai) alongside Claude Desktop, this repo includes two hooks for Bee processing:

### Basic hook: `bee-process-new-capture.kiro.hook`

Fires on `fileCreated` events matching `**/05 Reference/Bee/_raw/**/*.md`. Good if your vault is inside the Kiro workspace. Kiro processes the capture and proposes output files for your confirmation.

### Advanced hook: `bee-sentinel-auto-process.kiro.hook` (recommended)

Uses a sentinel-based pattern for when your vault lives **outside** the Kiro workspace (common with iCloud/OneDrive-synced vaults on Windows):

```
bee sync → writes raw to vault → writes sentinel to .kiro/bee-inbox/
    → Kiro hook fires on sentinel creation
    → stages raw capture into workspace for reading
    → processes (redaction, tasks, notes, people)
    → writes outputs to .kiro/bee-inbox/_output/
    → runs sync script to copy outputs to vault (with append-mode for existing People notes)
    → deletes sentinel and cleans staging
```

Key improvements over the basic hook:
- **Staging pattern** — works even when the vault is on a different drive or in a cloud-synced folder
- **Append-mode People notes** — updates existing bios without overwriting prior content
- **Partial capture handling** — detects in-progress recordings and re-fires when complete
- **Batch processing** — handles multiple sentinels in a single pass
- **Voice Analysis (4th output)** — optionally updates a Writing Style Guide note with communication patterns observed in transcripts

The sentinel hook works with the vault sync script at `scripts/apply-bee-outputs.template.ps1`. See that file for configuration instructions.

Both hooks follow the processing rules in `.kiro/steering/bee-processing.md`.

---

## Ad-hoc queries

Once captures are flowing, you can ask the GTD Assistant natural-language questions that read across meeting notes and people bios:

> "I met with Trag last week about a new hackathon — remind me what some of the ideas were?"

> "What's the pattern with how Sarah makes decisions? I've got a tricky pitch coming up."

> "Pull up every meeting from the last two weeks where we discussed the Q2 roadmap."

The assistant searches `05 Reference/Meeting Notes/` and the relevant `People/` notes via the Obsidian MCP. No direct connection to Bee's live API required — the processed markdown is the source.

---

## Privacy & redaction

Bee records conversations. The redaction policy in the Bee Processor system prompt uses judgment (not keyword matching) to exclude:

- Intimate/romantic/sexual content
- Personal medical information
- Family-private matters involving minors or finances
- Third parties who clearly didn't consent to being recorded

If a capture is entirely personal, the Processor writes nothing and notes the skip. Raw captures stay in `_raw/` — you can delete them manually if you want them gone entirely.

**The `_raw/` folder contains unfiltered lifelog data. Treat it accordingly:**
- Don't sync `_raw/` to cloud-backed Obsidian plugins you don't trust
- Consider excluding it from any git-backed vault sync
- If you share your vault across devices, decide whether `_raw/` should travel with it
