# GTD Claude Agent

A personal AI assistant that lives in Claude Desktop, knows your task system, and connects to your real tools — Google Drive, Gmail, Calendar, GitHub, and Obsidian.

Built on [GTD (Getting Things Done)](https://gettingthingsdone.com/) principles: capture everything, clarify what it means, organize it where it belongs, reflect regularly, and engage with confidence.

---

## What this is

This is an open-source starter kit for building your own AI-powered personal assistant using [Claude](https://claude.ai) and the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

MCP is what lets Claude talk to your actual tools — read your notes, check your calendar, draft emails, and more. Think of it as giving Claude hands instead of just a brain.

You get:
- A ready-to-use system prompt built around GTD methodology
- Configuration files to connect Claude to your tools
- Step-by-step setup guides written for non-developers

Once set up, Claude becomes a personal assistant that understands your task system and can take action across your tools — with your approval.

---

## What it does

- **Processes your inbox** — Reads captures in Obsidian and routes them to the right folder (Next Actions, Projects, Someday Maybe, etc.)
- **Manages email** — Triages your Gmail inbox, drafts replies, and flags what needs attention
- **Handles your calendar** — Checks upcoming events, finds free time, and creates new events
- **Works with your documents** — Reads and writes to Google Drive docs and spreadsheets
- **Interacts with GitHub** — Creates issues, reads repos, and helps manage development work
- **Runs weekly reviews** — Walks through your whole system to make sure nothing is slipping through the cracks

---

## What you need

| Tool | What it is | Cost |
|------|-----------|------|
| [Claude Pro or Max](https://claude.ai/upgrade) | The AI subscription that powers everything | Paid |
| [Claude Desktop](https://claude.ai/download) | The app Claude runs in on your Mac | Free |
| [Obsidian](https://obsidian.md/) | A note-taking app that stores files locally (iCloud sync recommended) | Free |
| Google account | For Gmail, Calendar, and Drive access | Free |
| GitHub account | For repo and issue management | Free |
| [Node.js](https://nodejs.org/) | Required to run some MCP connections (just install it, you won't need to write code) | Free |

---

## What Claude does vs. what you do

| Claude handles | You handle |
|---------------|-----------|
| Reading and writing notes in your Obsidian vault | Setting up MCP connections (one-time, guided below) |
| Drafting emails and sorting your inbox | Creating OAuth credentials for Google (one-time) |
| Routing tasks to the right GTD folder | Reviewing drafts before Claude sends anything |
| Surfacing what's due, stale, or forgotten | Approving any action that posts, sends, or deletes |
| Running weekly reviews across all your tools | Deciding your priorities — Claude helps, you choose |
| Reading and summarizing documents | Maintaining your Obsidian vault structure |

**The key rule: Claude proposes, you approve.** Nothing gets sent, posted, or deleted without your say-so.

---

## Getting started

Follow the step-by-step guide in **[SETUP.md](SETUP.md)** — it walks through everything from installing Claude Desktop to running your first prompt.

---

## Built by

**Joe Garvey** — Head of Developer Technology

This repo is part of a broader personal productivity stack that also includes:

- **[SpendSense](https://github.com/joegarvey-ai/spendsense)** — Self-hosted personal finance automation
- **PlateMatch** — Workout tracking and recomposition analytics *(coming soon)*

Both are independently useful and can be integrated with this assistant.

---

## License

MIT — fork it, make it yours, share what you build.
