# Personal Assistant Kit

An open-source system that turns an AI assistant into a personal chief of staff — one that reads your notes, triages your email, processes your meetings, and manages your task system. You stay in control; it handles the admin work.

Built on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), so it works with any MCP-capable assistant: [Claude Desktop](https://claude.ai/download), [Kiro](https://kiro.dev), or whatever comes next.

---

## What this actually saves you

**The daily grind that eats your morning:**
- Sorting through inbox captures and deciding what goes where
- Reading email, flagging the 3 that matter, drafting replies
- Checking your calendar and figuring out what to prep for
- Writing status updates for your PM tool

**The weekly maintenance that slips when you're busy:**
- Reviewing your full task system for stale items and missing next actions
- Catching commitments you made in meetings that never became tasks
- Auditing waiting-for items that haven't moved

**The meeting overhead that compounds:**
- Turning a 30-minute conversation into structured notes, tasks, and follow-ups
- Remembering who said what, who committed to what, and what the unresolved tensions were
- Building a living profile of how each person communicates, decides, and collaborates

All of this happens through your existing tools (Obsidian, email, calendar, Slack) with a single rule: **the assistant proposes, you approve.** Nothing sends, posts, or deletes without your explicit say-so.

---

## Who this is for

You're a good fit if you:

- Spend more time managing work than doing work
- Have 5+ meetings a day and can't remember Tuesday by Thursday
- Use (or want to use) a local notes app like Obsidian as your productivity system
- Want AI to handle the organizational scaffolding, not make your decisions

You don't need to be technical. The setup guides assume no coding experience. You do need about 30 minutes for initial setup and a willingness to keep your notes in markdown files.

---

## What's in the kit

### Core (works out of the box after setup)

| Capability | What it does |
|-----------|-------------|
| **Inbox processing** | Reads captures in Obsidian and routes each one: Next Action, Project, Someday Maybe, Waiting For, or Reference |
| **Email triage** | Reads your inbox, surfaces priority items, drafts replies for your review |
| **Calendar awareness** | Checks events, finds availability, creates meetings |
| **Weekly review** | Walks through your entire system — flags stale items, missing next actions, and forgotten commitments |

### Advanced (patterns for power users)

| Capability | What it does | Docs |
|-----------|-------------|------|
| **Meeting pipeline** | Wearable (Bee) captures → structured meeting notes + stack-ranked tasks + evolving People bios, with privacy redaction | [docs/bee-setup.md](docs/bee-setup.md) |
| **Weekly status automation** | Reads tasks from your PM tool, drafts status updates per task, writes them back after approval | [`.kiro/hooks/weekly-status-update.kiro.hook`](.kiro/hooks/weekly-status-update.kiro.hook) |
| **Enterprise tools** | Corporate email (Outlook), Slack in draft-mode, internal wikis via WSL — with graduated trust levels | [docs/enterprise-mcp-patterns.md](docs/enterprise-mcp-patterns.md) |
| **Operational frameworks** | Generate scoring models, escalation protocols, RACI charts, and capacity planning systems from structured requirements | [`.kiro/specs/operational-framework-example/`](.kiro/specs/operational-framework-example/) |
| **Vault sync** | Write-back script for when your Obsidian vault lives outside the workspace (iCloud, OneDrive, Dropbox) | [`scripts/apply-bee-outputs.template.ps1`](scripts/apply-bee-outputs.template.ps1) |

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│                     Your AI Assistant                         │
│              (Claude Desktop, Kiro, or any MCP client)        │
├─────────────────────────────────────────────────────────────┤
│                   Model Context Protocol                      │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Obsidian │  Email   │ Calendar │  Slack   │  PM Tool / etc  │
│  (vault) │          │          │ (drafts) │                 │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
```

**MCP** is the layer that gives your assistant hands. Instead of just generating text, it can read your notes, check your inbox, look at your calendar, and write back — all through a standardized protocol.

**The system prompt** tells the assistant how to think about your system: what the folder structure means, how to process inbox items, how to run a weekly review, and what your communication preferences are.

**Kiro hooks** (optional) add background automation: processing meeting captures the moment they land, running scheduled syncs, or drafting status updates on a trigger.

**The human-in-the-loop rule** means the assistant gathers context freely (reads are auto-approved) but always asks before taking action that's visible to others (sends, posts, deletes require your confirmation).

---

## The methodology

The kit is structured around [Getting Things Done (GTD)](https://gettingthingsdone.com/) — a system for managing commitments without keeping them in your head. You don't need to have read the book. Here's what matters:

1. **Capture** — Everything goes into an inbox. Don't organize it yet.
2. **Clarify** — For each item: is it actionable? What's the next physical step?
3. **Organize** — Put it where it belongs based on what it is and when you need it.
4. **Reflect** — Review the system regularly so you trust it.
5. **Engage** — Work from the system, not from memory.

The assistant handles steps 2-4 for you. You capture (step 1) and decide what to work on (step 5). The vault structure mirrors these stages:

```
00 Inbox/                  ← Everything enters here
01 Next Actions/           ← Things to do (Deep Work / Quick Wins)
02 Personal Projects/      ← Multi-step efforts with a defined outcome
03 Family & Personal/      ← Household logistics, family coordination
04 Someday Maybe/          ← Not now, but not forgotten
05 Reference/              ← Keep but don't act on
06 Waiting For/            ← Blocked on someone else
People/                    ← Living bios of people you work with
```

---

## Getting started

### What you need

| Tool | Purpose | Cost |
|------|---------|------|
| [Claude Desktop](https://claude.ai/download) or [Kiro](https://kiro.dev) | The AI assistant that reads the system prompt and connects to your tools | Claude Pro: $20/month |
| [Obsidian](https://obsidian.md/) | Local markdown notes — your GTD vault | Free |
| [Node.js](https://nodejs.org/) | Runs the MCP server that connects the assistant to your vault | Free |

### Setup (about 30 minutes)

Pick your platform:

- **Mac** → [SETUP-MAC.md](SETUP-MAC.md)
- **Windows** → [SETUP-WINDOWS.md](SETUP-WINDOWS.md)

Problems? → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Optional add-ons

| Add-on | What it connects | Guide |
|--------|-----------------|-------|
| Gmail + Calendar | Read/draft email, manage events | [docs/gmail-calendar-github-setup.md](docs/gmail-calendar-github-setup.md) |
| Google Drive | Read and write Google Docs | [docs/google-drive-setup.md](docs/google-drive-setup.md) |
| Bee wearable | Auto-processed meeting recordings | [docs/bee-setup.md](docs/bee-setup.md) |
| Corporate tools | Outlook, Slack, internal wikis | [docs/enterprise-mcp-patterns.md](docs/enterprise-mcp-patterns.md) |

---

## Example: what a processed meeting looks like

When a Bee recording finishes, the pipeline produces three outputs:

**Tasks** (`00 Inbox/Bee/2026-05-07_weekly-sync_tasks.md`):
```markdown
- [ ] **Complete audit of expanded-scope products** — scope resourcing needs before May 27 meeting
- [ ] **Implement time-boxing defaults in Close the Loop** — 30-60 day rolling window; gate leadership rollout on this
- [ ] **Follow up with Grace on beta testing** — integrate Common Room data source this month
```

**Meeting notes** (`05 Reference/Meeting Notes/2026-05-07_weekly-sync.md`):
```markdown
# Weekly Team Sync — 2026-05-07

## Topic Summary
Weekly sync covering team transitions, engagement strategy, and infrastructure planning...

## Key Decisions
- Stakeholder roadshow targeted for June
- Data consistency concerns gate leadership rollout of new tool

## Things to Keep in Mind
- New engineers took over from Pedro; latency issues resolved
- Promotion review deadline May 21 for 6-7 cases
```

**People notes** (`People/Will McHenry.md`):
```markdown
## Communication Style
Warm and personable in 1:1 settings. Opens with genuine personal connection before work.
Receptive to boundaries — doesn't push when told "not yet."

## Decision-Making Pattern
Seeks alignment before advocacy. Integrates rather than competes.
```

All of this is generated automatically, with privacy redaction applied. Personal/medical/family content is excluded. You review and route the tasks like any other inbox item.

---

## Customizing

The system prompt is designed to be forked. Key files to make yours:

| File | What to customize |
|------|-------------------|
| `system-prompt.md` | Your name, vault path, communication preferences, domain-specific context |
| `system-prompt-bee-processor.md` | Your name, vault path (if using Bee) |
| `.kiro/steering/bee-processing.md` | Your employer name for meeting note paths |
| `.kiro/hooks/weekly-status-update.kiro.hook` | Your PM tool, project ID, team name |

See [docs/customizing-your-system-prompt.md](docs/customizing-your-system-prompt.md) for detailed guidance.

---

## Built by

**[Joe Garvey](https://github.com/joegarvey-ai)** — Head of Developer Technology

Other projects in this stack:
- **[SpendSense](https://github.com/joegarvey-ai/spendsense)** — Self-hosted personal finance automation

---

## License

MIT — fork it, make it yours, share what you build.
