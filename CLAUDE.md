# CLAUDE.md — Personal Assistant Kit

This file is the master contract for any AI agent operating in this project. If you're an agent that just entered this workspace — read this first, in full, before doing anything.

---

## What this project is

An open-source scaffolding system that turns an MCP-capable AI assistant into a personal chief of staff. It connects to real tools (notes, email, calendar, Slack, PM tools) and manages the user's task system following GTD (Getting Things Done) methodology.

The system is **human-in-the-loop by design.** Nothing sends, posts, or deletes without explicit user approval.

---

## Agent roles

This system has distinct agent roles. Each role has a defined scope, defined inputs/outputs, and hard boundaries on what it does NOT do.

### GTD Assistant (primary)

**System prompt:** `system-prompt.md`
**Kiro steering:** `.kiro/steering/gtd-assistant.md` (local override, gitignored)
**Scope:** General task management, email triage, calendar, inbox processing, weekly reviews, ad-hoc queries.

**Does:**
- Reads and routes inbox items to GTD folders
- Triages email, drafts replies, flags priorities
- Runs weekly reviews (stale items, missing next actions, unresolved meeting threads)
- Answers natural-language queries about meetings, people, and commitments
- Reads processed Bee outputs (`00 Inbox/Bee/`, `05 Reference/Meeting Notes/`, `People/`)

**Does NOT:**
- Process raw Bee captures (that's the Bee Processor's job)
- Write to `05 Reference/Bee/_raw/` (immutable)
- Send email, post messages, or delete anything without user confirmation
- Make priority decisions — it surfaces and suggests, the user decides

---

### Bee Processor

**System prompt:** `system-prompt-bee-processor.md`
**Kiro steering:** `.kiro/steering/bee-processing.md`
**Kiro hook:** `.kiro/hooks/bee-sentinel-auto-process.kiro.hook`
**Scope:** Ingesting raw Bee lifelog captures and producing structured outputs.

**Does:**
- Reads raw captures from `05 Reference/Bee/_raw/`
- Applies redaction policy (judgment-based, not keyword matching)
- Produces three outputs: tasks, meeting notes, People notes
- Optionally updates Writing Style Guide with voice analysis (4th output)
- Handles partial captures (CAPTURING state) gracefully

**Does NOT:**
- Edit files in `_raw/` (immutable source of truth)
- Route tasks to GTD folders (that's inbox processing, handled by the GTD Assistant)
- Make judgments about task priority beyond stack-ranking within a single meeting
- Process anything outside `_raw/` — it's a single-purpose pipeline

**Handoff:** Bee Processor writes to `00 Inbox/Bee/`. GTD Assistant picks up those files during inbox processing. No direct communication between agents — the vault IS the interface.

---

### Status Updater

**Kiro hook:** `.kiro/hooks/weekly-status-update.kiro.hook`
**Scope:** Drafting and writing weekly status updates to a PM tool.

**Does:**
- Fetches tasks from the configured PM tool (sprint-scoped)
- Drafts status updates per task based on available context
- Flags tasks with no context rather than fabricating status
- Writes approved updates back to the PM tool

**Does NOT:**
- Post comments (only updates the status/weekly-update field)
- Write updates without explicit user approval
- Guess status for unknown tasks — it asks

---

## Vault contract

The Obsidian vault is the shared state between all agents. These rules are inviolable.

### Folder semantics

| Folder | Purpose | Who writes here |
|--------|---------|-----------------|
| `00 Inbox/` | Raw captures awaiting processing | User, Bee Processor (to `00 Inbox/Bee/`) |
| `01 Next Actions/Deep Work/` | Tasks requiring 30+ min focused effort | GTD Assistant (after user approval) |
| `01 Next Actions/Quick Wins/` | Tasks completable in <30 min | GTD Assistant (after user approval) |
| `02 Personal Projects/` | Multi-step efforts with a defined outcome | GTD Assistant (after user approval) |
| `03 Family & Personal Planning/` | Household logistics, family coordination | GTD Assistant (after user approval) |
| `04 Someday Maybe/` | Ideas — not active, not forgotten | GTD Assistant (after user approval) |
| `05 Reference/` | Information to keep, not act on | GTD Assistant, Bee Processor |
| `05 Reference/Bee/_raw/` | Immutable raw Bee captures | Bee sync scripts ONLY. Never edited by any agent. |
| `05 Reference/Meeting Notes/` | Cleaned personal meeting summaries | Bee Processor |
| `05 Reference/[EMPLOYER]/Meeting Notes/` | Cleaned work meeting summaries | Bee Processor |
| `06 Waiting For/` | Blocked on someone else | GTD Assistant (after user approval) |
| `People/` | Structured bios of key people | Bee Processor |

### Immutability rules

- **`05 Reference/Bee/_raw/`** — NEVER read by the GTD Assistant, NEVER edited by any agent. Only the Bee sync scripts write here. The Bee Processor reads but does not modify.
- **People notes** — append/refine only. Never overwrite existing content. Use the append-mode pattern when updating via scripts.
- **Meeting notes** — once written, treated as immutable reference. Corrections go in a new note or as a comment at the bottom.

### File naming conventions

| File type | Pattern | Example |
|-----------|---------|---------|
| Bee tasks | `YYYY-MM-DD_<slug>_tasks.md` | `2026-05-07_weekly-sync_tasks.md` |
| Meeting notes | `YYYY-MM-DD_<slug>.md` | `2026-05-07_1on1-sarah.md` |
| People notes | `<First Last>.md` | `Sarah Chen.md` |
| Sentinel files | `<conversation-id>.sentinel.md` | `7946776.sentinel.md` |

### Frontmatter schema

All Bee-generated files include this frontmatter:

```yaml
---
source: bee
meeting_date: YYYY-MM-DD
meeting_slug: <2-4 lowercase hyphenated words>
bee_conversation_id: <numeric ID>
created: <ISO 8601 timestamp>
---
```

People notes use:

```yaml
---
source: bee-initialized
created: <ISO 8601 timestamp>
last_updated: <ISO 8601 timestamp>
---
```

---

## Safety invariants

These rules apply to ALL agents in ALL contexts. No exceptions.

### Human-in-the-loop

| Action type | Trust level | Behavior |
|-------------|-------------|----------|
| Read (vault, email, calendar, Slack) | Auto-approved | Agent reads freely to gather context |
| Write to vault (new files) | Propose first | Show file path + preview, wait for confirmation. Exception: Bee auto-process mode writes directly. |
| Write to vault (modify existing) | Propose first | Show the change, wait for confirmation |
| Send (email, Slack message, calendar invite) | Always confirm | Show full draft, recipient, and context. Never auto-send. |
| Delete (files, events, messages) | Always confirm | Explain what will be deleted and why. |
| Status update writes | Batch approval | Draft all updates, present as a batch, write only after explicit approval per-task or "approve all" |

### Redaction policy (Bee Processor)

Apply judgment, not keyword matching. Exclude:
- **Intimate** — romantic, sexual, private partner-only conversation
- **Personal/medical** — health conditions, medications, therapy
- **Family-private** — parenting disputes, family finances, anything about minors
- **Third-party-sensitive** — people who clearly didn't consent to recording

When in doubt, exclude. Do not paraphrase redacted content — omit entirely. If the entire capture is private, write nothing and note the skip.

### What agents must never do

- Fabricate information (meetings that didn't happen, tasks that weren't mentioned, status that wasn't observed)
- Access `_raw/` from the GTD Assistant role
- Send, post, or delete without user confirmation
- Override a user decision (if the user routes an item differently than suggested, that's final)
- Store credentials, tokens, or secrets in any file tracked by git
- Commit files matching `.gitignore` exclusions

---

## MCP architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistant                              │
│              (Claude Desktop / Kiro / any MCP client)         │
├─────────────────────────────────────────────────────────────┤
│                   Model Context Protocol                      │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Obsidian │  Email   │ Calendar │  Slack   │  PM Tool        │
│  (vault) │ (OAuth)  │ (OAuth)  │ (drafts) │  (API)          │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
```

### MCP servers

| Server | Purpose | Config location |
|--------|---------|-----------------|
| `obsidian-mcp` | Read/write vault files | `.kiro/settings/mcp.json` (gitignored) |
| Email MCP | Corporate or Gmail email | `.kiro/settings/mcp.json` |
| Slack MCP | Read channels/DMs, draft messages (ENFORCE_DRAFTS mode) | `.kiro/settings/mcp.json` |
| PM tool MCP | Task management (Taskei, Jira, Linear, etc.) | `.kiro/settings/mcp.json` |

### Trust model

| Operation | Auto-approve | Require confirmation |
|-----------|-------------|---------------------|
| List/search vault | Yes | — |
| Read vault file | Yes | — |
| Create vault note | Yes (Bee auto-process) | Yes (GTD processing) |
| Read email/inbox | Yes | — |
| Send email | — | Always |
| Read Slack | — | Confirm which channel |
| Post Slack | — | Always (draft mode) |
| Read tasks | Yes | — |
| Update task status | — | After batch approval |

---

## Kiro hooks

Hooks provide event-driven automation. They fire on file events or user triggers.

| Hook | Trigger | What it does |
|------|---------|-------------|
| `bee-sentinel-auto-process` | `fileCreated` on `.kiro/bee-inbox/*.sentinel.md` | Processes new Bee captures: stage → redact → produce outputs → sync to vault → cleanup |
| `weekly-status-update` | `userTriggered` | Fetches tasks, drafts status updates, writes after approval |
| `bee-process-new-capture` (basic) | `fileCreated` on `**/05 Reference/Bee/_raw/**` | Simpler hook for when vault is inside workspace |

### Sentinel-based processing flow

```
bee sync → raw capture to vault → sentinel to .kiro/bee-inbox/
    → hook fires
    → stage raw to _staging/ (workspace-local copy for reading)
    → process (redaction, slug generation, output drafting)
    → write outputs to _output/ (mirroring vault structure)
    → run sync script (copy to vault, append People notes)
    → delete sentinel, clean _staging/ and _output/
```

---

## File map

```
personal-assistant-kit/
├── CLAUDE.md                          ← You are here
├── README.md                          ← Public-facing docs
├── system-prompt.md                   ← GTD Assistant system prompt (generic, [BRACKETED])
├── system-prompt-bee-processor.md     ← Bee Processor system prompt (generic)
├── claude_desktop_config.example.json ← Basic MCP config example
├── claude_desktop_config.advanced.example.json
├── .kiro/
│   ├── bee-inbox/                     ← Sentinel processing state (gitignored contents)
│   │   └── .gitkeep
│   ├── hooks/
│   │   ├── bee-sentinel-auto-process.kiro.hook
│   │   ├── bee-process-new-capture.kiro.hook
│   │   └── weekly-status-update.kiro.hook
│   ├── steering/
│   │   └── bee-processing.md          ← Bee processing rules (genericized)
│   └── specs/
│       └── operational-framework-example/  ← Template for non-code Kiro specs
├── scripts/
│   ├── apply-bee-outputs.template.ps1 ← Vault write-back script
│   ├── bee-stream-watcher.ps1         ← Real-time Bee event watcher
│   ├── bee-sync-scheduled.ps1         ← Scheduled Bee sync (every 15 min)
│   ├── bee-sync-silent.vbs            ← Silent launcher for scheduled task
│   ├── install-bee-sync-task.ps1      ← Installs Windows scheduled task
│   └── install-bee-watcher-autostart.ps1
├── docs/
│   ├── bee-setup.md
│   ├── enterprise-mcp-patterns.md
│   ├── obsidian-setup.md
│   ├── obsidian-sync-options.md
│   ├── gmail-calendar-github-setup.md
│   ├── google-drive-setup.md
│   ├── advanced-connectors.md
│   └── customizing-your-system-prompt.md
├── SETUP-MAC.md
├── SETUP-WINDOWS.md
└── TROUBLESHOOTING.md
```

---

## Development guidelines

### When modifying system prompts

- Keep `[BRACKETED]` placeholders for user-specific values
- Don't add employer-specific, person-specific, or tool-specific content to tracked files
- Test changes against the eval suite (Phase 2 — coming)
- The system prompt is the behavioral contract; changes to it change agent behavior

### When adding new hooks

- Define the trigger clearly (fileCreated, userTriggered, scheduled)
- Document what the hook reads, what it writes, and what it deletes
- Respect the vault contract — don't write to folders outside the hook's designated scope
- Add a corresponding entry to this CLAUDE.md's hooks table

### When adding new MCP servers

- Document the auth pattern in `docs/enterprise-mcp-patterns.md`
- Define which operations are auto-approved vs. require confirmation
- Add to the trust model table above
- Add the server to the file map

### Commit conventions

- Commit messages: imperative mood, lead with what changes (not "Updated X")
- Don't commit `.kiro/settings/mcp.json`, vault paths, credentials, or local-only content
- Check `.gitignore` before staging — sensitive content should never reach git history

---

## What's next (roadmap)

| Phase | Status | What it delivers |
|-------|--------|-----------------|
| 1. CLAUDE.md + agent architecture | **Done** | This file — the system contract |
| 2. Evals | **Done** | Functional tests: `evals/` — 28 cases across 4 suites (inbox, Bee, review, status) |
| 3. Observability | **Done** | `observability/` — structured logs, traces, cost metering, drift detection. Auto-integrated with eval runner. |
| 4. Execution hooks | Planned | Schema validation, continuation gates, redaction validators, idempotency guards |
| 5. Subagent routing | Planned | Model tiering (Haiku/Sonnet/Opus), parallel processing, dedicated subagents |
| 6. Bundled infrastructure | Planned | Docker/devcontainer, config generator, mock MCP for offline testing |
