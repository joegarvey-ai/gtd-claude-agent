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
   ▼  (scheduled sync every 15 min + optional bee stream watcher)
<vault>/<raw folder>/                       ← raw captures, never edited
   │
   ▼  writes a sentinel → <workspace>/.kiro/bee-inbox/<id>.sentinel.md
   │
   ▼  (Claude Code consumer — primary — OR the Claude Desktop "Bee Processor" project)
<vault>/<tasks folder>/                      ← stack-ranked tasks per meeting
<vault>/<meeting notes folder>/              ← cleaned meeting summaries
<vault>/<people folder>/<name>.md            ← structured, evolving bios
```

The output folders are yours to choose; the Claude Code consumer reads them from
`.claude/bee-paths.local.json` (see "Automatic processing on Claude Code" below).

Two agents are involved:

- **Bee Processor** — on Claude Code this is the `bee-processor` subagent (`.claude/agents/bee-processor.md`), driven by the `/process-bee-inbox` command or the scheduled `run-bee-process.ps1` runner. On Claude Desktop it is a dedicated project with the `system-prompt-bee-processor.md` instructions. Either way its only job is turning raw captures into the three outputs.
- **GTD Assistant** — your main project. Reads the processed outputs like any other inbox or reference material. Never touches the raw folder.

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
  <Employer>/                   ← your employer's name, e.g. Acme
    Meeting Notes/              ← cleaned *work* meeting summaries land here
```

Most captures will be work-related. If you're not using this for work, you can skip the `<Employer>/Meeting Notes/` folder — the processor uses judgment and will fall back to the personal Meeting Notes folder.

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

## Step 6: Automatic sync (the real-time piece)

Running `bee sync` manually is fine for trying it out, but the real win is having captures flow into Obsidian automatically as meetings end. On **Windows**, this repo ships the scripts to do it — a two-layer design in `scripts/` (see [`scripts/README.md`](../scripts/README.md)):

- **Layer 1 — scheduled sync (`scripts/install-bee-sync-task.ps1`):** installs the `BeeSync15Min` task, which runs `bee-sync-scheduled.ps1` every 15 minutes. On first run it prompts for your vault's raw folder and stores it in `%LOCALAPPDATA%\bee-sync\config.ps1`. This is the reliable safety net.
- **Layer 2 — event-driven watcher (`scripts/install-bee-watcher-autostart.ps1`):** installs `bee-stream-watcher.ps1` to start at login. It reads `bee stream --json` and triggers a targeted sync ~30s after each conversation completes, for near-real-time updates. Reuses the Layer 1 config.

Both layers write a sentinel into `.kiro/bee-inbox/` for each genuinely new, completed capture (SHA256 content check + a COMPLETED-and-settled completeness gate), which the Claude Code consumer then processes (next section).

**PowerShell authoring note (for anyone editing these scripts):** save them with **CRLF line endings and clean ASCII only** (no em dashes or smart quotes), and don't wrap native commands like `schtasks` in `$ErrorActionPreference='Stop'` — check `$LASTEXITCODE` instead. A prior install broke because a script was saved LF-only with em dashes, which PowerShell 5.1 fails to parse; the task then dispatched but the script never ran.

### Mac / Linux

Reference scripts aren't shipped for Mac/Linux yet. The rough mapping (cron or launchd/systemd running `bee sync`, plus a small sentinel-writer) is in [`scripts/README.md`](../scripts/README.md); the `bee stream` event shape is in the [Bee Realtime docs](https://docs.bee.computer/docs/realtime).

---

## Automatic processing on Claude Code (primary)

The processing half runs on **Claude Code**. The sync scripts write a sentinel into
`.kiro/bee-inbox/` when a capture lands; a Claude Code consumer drains the sentinels into
your vault. This works even when your vault lives **outside** the repo (common with
iCloud/OneDrive-synced vaults) — Claude Code's file tools write directly to the vault.

```
bee sync → writes raw to vault → writes sentinel to .kiro/bee-inbox/
    → BeeProcess30Min task runs run-bee-process.ps1 → claude -p '/process-bee-inbox'
      (or you run /process-bee-inbox yourself)
    → the bee-processor subagent, for each pending sentinel:
        idempotency guard (skip if bee_conversation_id already in vault)
        completeness gate (skip partial/sparse; leave its sentinel)
        redact, draft tasks / meeting note / People notes
        write the outputs directly to the vault
        delete the sentinel — only after outputs land
```

### One-time setup

1. **Point the consumer at your vault folders.** Copy `.claude/bee-paths.example.json` to
   `.claude/bee-paths.local.json` (gitignored) and set the vault-relative folders:
   `raw_subpath`, `tasks_dir`, `meeting_notes_dir`, `people_dir`, and optional
   `voice_observations_file`. Set `collapse_work_personal_split` to `true` to route every
   meeting note to one folder, or `false` to keep a work/personal split. The vault root is
   derived from each sentinel's `raw_path`, so you never store an absolute path here.
2. **Manual path (reliable):** in a Claude Code session opened in the repo, run
   `/process-bee-inbox` (or say "process my Bee inbox"). It drains all pending sentinels in
   one pass.
3. **Scheduled path:** run `scripts/install-bee-process-task.ps1` to install the
   `BeeProcess30Min` task, which runs the manual command headlessly every 30 minutes. It
   early-outs cheaply when no sentinels are pending. Requires `claude` on your WSL PATH.

Feature notes:
- **Idempotency guard** — a capture already written to the vault (matched by
  `bee_conversation_id`) is skipped, not duplicated.
- **Completeness gate** — an in-progress or still-enriching capture is left for the next
  sync/run to re-fire when complete.
- **Append-mode People notes** — existing bios are updated, not overwritten.
- **Batch processing** — multiple sentinels handled in a single pass.

The consumer follows the processing rules in `.kiro/steering/bee-processing.md` (the rules
file is shared; only the runtime changed).

## Kiro users (deprecated path)

The two Kiro Bee hooks (`.kiro/hooks/bee-sentinel-auto-process.kiro.hook` and
`bee-process-inbox.kiro.hook`) are **disabled** — the maintainer moved to the Claude Code
consumer above. They remain in the repo, `enabled: false`, only as a reference if you still
run this pipeline under Kiro. The old Kiro/MCP flow staged outputs to
`.kiro/bee-inbox/_output/` and used `scripts/apply-bee-outputs.template.ps1` for the
last-mile write because Kiro couldn't write outside the workspace; Claude Code writes to the
vault directly, so that staging step is gone.

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
