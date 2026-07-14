# Using the kit day to day

You have finished setup. This guide shows you what to type.

It walks a normal day with the assistant, gives you a copy-paste prompt library grouped by scenario, covers the highest-value workflows end to end, and sets honest expectations. Read it once, keep it open for the first week, and you will not need it after that.

Everything here uses the real trigger phrases and behavior built into the assistant (see `system-prompt.md` and the `.claude/` agents). The transcripts are illustrative: your exact wording and output will vary. Names and content are generic samples.

One rule underpins all of it: **the assistant proposes, you approve.** It reads freely to gather context, but it shows you anything it would send, post, or write to your vault and waits for your yes. (The Bee meeting auto-processor is the one flow that writes a batch of notes directly, so it can drain a backlog unattended.)

---

## Before your first prompt

**Where do you type?** Wherever you set up the assistant. This kit runs on any of three clients, and you installed one of them:

- **Claude Desktop** - you pasted `system-prompt.md` into Settings, Profile, Custom Instructions. You type in a normal Claude chat.
- **Claude Code** - you run it in a terminal in the repo folder. You type at the prompt, and you also get slash commands like `/process-bee-inbox`.
- **Kiro** - you type in Kiro's chat; it auto-loads its steering files.

Most prompts below work in all three. A few are **Claude Code only** (the Bee meeting pipeline and any `/slash-command`); those are labeled. If a capability seems missing, check which client you are in. `CLAUDE.md` (the "Which contract governs" section) is the authority.

**Run this first.** Before you trust it with your morning, sanity-check that it read your configuration:

```
what do you know about my system and how I work?
```

It should describe your setup, your tools, and your preferences. If it cannot, revisit setup before going further.

**A note on connections.** Prompts that touch email, calendar, or chat only work for the sources you connected during setup. If a source is not connected, the assistant says so and skips it rather than guessing. See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) to add one.

---

## Your system at a glance

The assistant organizes your work with **GTD (Getting Things Done)**: everything you capture flows into an inbox, gets clarified into a next action, and lands in the right folder so you can trust the system instead of your memory.

Your **vault** is your Obsidian folder of markdown notes. The assistant reads and writes here. It is organized into a few buckets, and when you process your inbox the assistant routes each item into one of them:

- **Inbox** - raw captures, not yet sorted. Everything starts here.
- **Next Actions** - things to do (split into Deep Work and Quick Wins).
- **Projects** - multi-step efforts with a defined outcome.
- **Someday Maybe** - not now, but not forgotten.
- **Reference** - keep, but no action needed.
- **Waiting For** - delegated or blocked; tracks who owes you what, since when.
- **Family and Personal Planning** - household and family logistics.
- **People** - a living note per person you work with (how they communicate and decide).

New to the folder layout? The README's "The methodology" section shows the full structure.

---

## Day in the life

A normal Tuesday morning, start to finish.

**You type:**

```
start my day
```

**The assistant runs its daily triage, in order, and comes back with something like:**

```
Here is your triage for 2026-05-12. Proposing the plan below; say the word and I will write it to your daily-plan folder.

Email (needs a reply today):
  1. [Manager] - wants your headcount number before the 2pm staffing review (reply)
  2. Vendor - renewal quote, no rush (defer)
  FYI: two newsletters, skipped.

Calendar:
  - 09:30 Team standup - no prep
  - 14:00 Staffing review - PREP: bring the headcount number from [Manager]'s email
  - First meeting 09:30. Deep Work block open 10:00 to 13:30.

Chat:
  - 1 DM from [Teammate] asking for the roadmap link. Draft reply queued for your review.

Top 3 for today:
  1. Send [Manager] the headcount number (gates the 2pm review)
  2. Use the 10:00 to 13:30 block for the Q3 roadmap draft (your only deep-work window this week)
  3. Reply to [Teammate] with the roadmap link (30 seconds, unblocks them)

Write the plan note?
```

**You type:**

```
yes, and draft that reply to [Teammate]
```

The assistant writes the dated plan to your daily-plan folder and drafts the reply for you to review. Nothing was sent. You now have one page that turns several scattered inboxes into a plan, and you spent about 90 seconds on it.

Later, after a meeting, you capture a loose thought:

```
capture this: follow up with legal on the vendor contract before end of month
```

The assistant proposes adding it to your inbox and drops it in on your confirmation. At the end of the day (or the start of the next), you run `process my inbox` and it proposes where each captured item should go. You confirm, and your system is current again.

---

## Prompt library

Copy these directly. Each is grouped by what you are trying to do.

### Daily triage

```
start my day
```
Runs the full triage (email, calendar, chat) into one dated plan. Also responds to "daily triage", "morning triage", "help me get organized".

```
just triage my email
```
Runs only the email step: surfaces what needs a reply, what implies an action, what is FYI.

```
what is on my calendar today and what do I need to prep for?
```
Reads today's events, flags prep, conflicts, and missing agendas, and points out your free blocks.

```
check my chat for anything that needs a response
```
Triages unread DMs and mentions, drafts replies for anything that clearly needs one. Never posts. (Needs a chat connection, e.g. Slack, configured during setup; optional.)

### Inbox and capture

```
capture this: <your thought, task, or link>
```
Gets something out of your head fast. The assistant proposes adding it to your inbox and writes it on your confirmation.

```
what is in my Obsidian inbox?
```
Lists your current inbox items without moving anything. (Say "Obsidian inbox" so it does not have to ask which inbox you mean.)

```
process my inbox
```
Walks each inbox item (including auto-generated Bee tasks), proposes a destination for each (Quick Win, Deep Work, Project, Someday Maybe, Reference, Waiting For, or Family), and moves them on your confirmation.

```
process my inbox, but only the quick wins
```
Same routine, scoped. The assistant handles scope hints like this.

### Email

```
what emails need a reply from me today?
```
Surfaces reply-needed messages with sender, the ask, and a suggested disposition (reply / delegate / defer).

```
draft a reply to <sender> saying <the gist>
```
Writes a draft in your voice for review. It does not send.

```
summarize this thread and tell me if it needs a reply
```
Condenses a long thread and gives you a recommended next step.

```
turn <that email> into a next action
```
Extracts the commitment as a task and proposes where it should be routed.

### Calendar

```
do I have a free block for deep work today?
```
Finds open windows suitable for focused work.

```
what should I prepare for my meetings tomorrow?
```
Reviews upcoming events and tells you what to pre-read, bring, or decide.

```
book 30 minutes with <person> on Thursday afternoon
```
Proposes a calendar event. Creating it is a write, so it asks before booking.

```
reschedule my afternoon around a new 3pm meeting
```
Proposes how to shift your day to fit a new commitment. You approve any changes.

### Weekly review

```
run my weekly review
```
Walks the full review: stale Waiting For items, projects missing a next action, Someday Maybe items to activate, meeting commitments with no task, a summary of what you finished, and a proposed top 3 for next week.

```
what is stale in my system?
```
Flags Waiting For items with no movement and projects that have gone quiet.

```
what did I commit to in meetings that never became a task?
```
Scans your meeting notes for commitments that have no matching next action.

### People and meetings

```
what do I know about <person>?
```
Reads their People note (working style, decision pattern, open threads) and summarizes.

```
what did we decide with <person> last week?
```
Searches recent meeting notes and surfaces the decisions and open items.

```
process my Bee inbox
```
**(Claude Code, and only if you set up Bee.)** Drains pending meeting captures into tasks, meeting notes, and People notes, with privacy redaction. The `/process-bee-inbox` command does the same.

### Ad-hoc

```
what is on my plate right now?
```
Pulls your active next actions and current projects into one view.

```
what am I waiting on?
```
Lists your Waiting For items with who and since when.

```
what is the status of my <project name> project?
```
Summarizes a project's current state and its next action.

```
what should I work on right now?
```
Suggests from your system based on what is active and, if you ask it to, your available time.

---

## Top use cases, end to end

### 1. Morning daily triage to a written plan

- **Trigger:** `start my day`
- **What happens:** the assistant reads your email, today's calendar, and your chat, in order. It surfaces reply-needed mail, meeting prep, and DMs that need a response, then synthesizes a top 3.
- **Where output lands:** a dated note in your daily-plan folder, written only after you approve the proposed plan.
- **What you do next:** work from the plan. It sits in your inbox, so you process it like any other item once the day is done.

### 2. A meeting becomes tasks and notes automatically

- **Trigger:** `process my Bee inbox` (or the `/process-bee-inbox` command), in Claude Code, if you use the Bee meeting pipeline.
- **What happens:** each finished capture is redacted (personal, medical, and family content is excluded), then turned into three outputs: stack-ranked tasks, a cleaned meeting note, and updated People bios for the high-signal participants (fly-by attendees are skipped).
- **Where output lands:** tasks in your Bee tasks folder, notes in your meeting-notes folder, bios in People. Each processed capture is closed out so it is never double-processed.
- **What you do next:** run `process my inbox` to route the new tasks into your folders like any other captures.

### 3. Weekly review that catches what slipped

- **Trigger:** `run my weekly review`
- **What happens:** the assistant checks Waiting For for stale items, confirms every active project has a next action, scans Someday Maybe for anything to activate, and reads the week's meeting notes for commitments you made that never became tasks. It ends with what you completed and a proposed top 3.
- **Where output lands:** presented in chat as a structured summary. Any tasks it proposes creating are written only on your confirmation.
- **What you do next:** accept the caught commitments as new tasks, and carry the top 3 into next week.

### 4. Email triage to drafted replies

- **Trigger:** `what emails need a reply from me today?` then `draft a reply to <sender>`
- **What happens:** the assistant ranks your inbox by what needs you, extracts any action items, and writes draft replies in your voice.
- **Where output lands:** drafts, shown in chat (or saved to your email drafts if your connector supports it). Nothing is sent.
- **What you do next:** review each draft, edit if needed, and send it yourself.

---

## What to expect, and what not to expect

**It proposes, you approve.** Reads are automatic so it can gather context. Anything that writes to your vault, sends an email, posts a message, or deletes something is shown to you first and waits for your explicit yes. You are always the approval gate.

**It surfaces and suggests, it does not decide.** It will rank your priorities and recommend a top 3, but the call is yours. If you route an item differently than it suggested, that is final.

**It will not make things up.** If it does not have context for a task or a status, it flags the gap. If something looks stuck or neglected in a review, it says so.

**Meeting captures are redacted.** The Bee pipeline excludes intimate, medical, and family-private content, and drops a capture entirely if the whole thing is personal. It uses judgment rather than keyword matching.

**Calendar Prep is a reference scaffold, not a live job yet.** The `calendar-prep` agent shipped in this repo as a worked example of the add-an-agent pattern. It does not run on a schedule until its eval suite passes. Treat it as a template to learn from. (See [docs/add-an-agent.md](add-an-agent.md).)

**Behavior depends on which client you run.** See "Before your first prompt" above. Claude Desktop reads the pasted prompt; Claude Code uses the `.claude/` subagents and slash commands and runs the Bee automation; Kiro reads its steering files.

**If it does something you did not want:** nothing writes or sends without your approval, so there is little to undo. Correct it in plain language ("no, route that to Reference instead") and it adjusts.

---

## Where to go next

- Make the assistant yours: [docs/customizing-your-system-prompt.md](customizing-your-system-prompt.md)
- Add your own agent: [docs/add-an-agent.md](add-an-agent.md)
- Set up the meeting pipeline: [docs/bee-setup.md](bee-setup.md)
- Something not working: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
