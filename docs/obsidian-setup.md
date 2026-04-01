# Obsidian Setup

## What Obsidian is

[Obsidian](https://obsidian.md/) is a free note-taking app that stores everything as plain text files on your computer. Unlike cloud-based apps, your notes live in a regular folder on your Mac — which is exactly what makes it perfect for this setup.

Because the files are just text, Claude can read and write to them directly. Think of it as giving Claude access to your notebook.

## Why Obsidian is the GTD backbone

In this system, Obsidian is where all your tasks, projects, and reference material live. It's the single source of truth for your GTD workflow:

- **Capture** happens in the Inbox folder
- **Organize** happens when Claude (or you) moves items to the right folder
- **Reflect** happens during weekly reviews, when Claude reads across all folders

Other tools (Gmail, Calendar, Drive) feed into this system, but Obsidian is home base.

---

## Recommended folder structure

Create these folders inside your Obsidian vault:

```
00 Inbox/
01 Next Actions/
   ├── Deep Work/
   └── Quick Wins/
02 Personal Projects/
03 Family & Personal Planning/
04 Someday Maybe/
05 Reference/
06 Waiting For/
People/
```

### What each folder is for

**00 Inbox/**
The catch-all. Dump anything here — a task, an idea, a link, a half-formed thought. The whole point is to capture without deciding. Claude processes this folder when you ask.

**01 Next Actions / Deep Work/**
Tasks that need real focus. These take 30 minutes or more and benefit from uninterrupted time. Examples: writing a proposal, building a feature, deep research.

**01 Next Actions / Quick Wins/**
Tasks you can finish in under 30 minutes. Examples: reply to an email, book an appointment, review a short document.

**02 Personal Projects/**
Multi-step efforts with a clear end goal. Each project file should describe the outcome and list remaining steps. The key GTD rule: every active project must have at least one next action in the `01 Next Actions/` folder.

**03 Family & Personal Planning/**
Household logistics, meal planning, family schedules, shared to-dos. Anything that involves coordinating with others at home.

**04 Someday Maybe/**
Ideas you're interested in but not committing to right now. Travel plans, books to read, skills to learn, side projects. Review this during weekly reviews to see if anything should become active.

**05 Reference/**
Information you want to keep but don't need to act on. Meeting notes, articles, documentation, how-to guides. If you'd search for it later, it goes here.

**06 Waiting For/**
Anything you're waiting on someone else to complete. Always include: who you're waiting on, what you're waiting for, and when you asked. Claude checks this during weekly reviews to flag stale items.

**People/**
Notes about key people you interact with. This is where you create your own personal context file (see below).

---

## Setting up iCloud sync

iCloud sync lets your Obsidian vault stay up to date across your Mac, iPhone, and iPad.

**On your Mac:**
When creating a new vault in Obsidian, choose to store it inside your iCloud Drive folder. Obsidian will handle the rest.

If you already have a vault and want to move it to iCloud, see [Obsidian's sync documentation](https://help.obsidian.md/Getting+started/Sync+your+notes+across+devices) for detailed instructions.

**Where iCloud vaults live on your Mac:**
Your vault will be at a path like:
```
/Users/[YOUR_USERNAME]/Library/Mobile Documents/iCloud~md~obsidian/Documents/[YOUR_VAULT_NAME]
```

This is the path you'll use in the Claude Desktop config file.

---

## How Claude accesses your vault

Claude connects to your Obsidian vault through something called a "filesystem MCP server." In plain English: you tell Claude Desktop where your vault folder is, and Claude can then read and write files in it — like a very smart note-taking assistant.

This connection is set up in your `claude_desktop_config.json` file (covered in [SETUP.md](../SETUP.md)). The relevant part looks like this:

```json
"obsidian": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/Users/[YOUR_USERNAME]/Library/Mobile Documents/iCloud~md~obsidian/Documents"
  ]
}
```

Replace `[YOUR_USERNAME]` with your Mac username. Claude will then have access to all vaults stored in your iCloud Obsidian folder.

**What Claude can do:**
- Read any file in your vault
- Create new files
- Edit existing files
- Move files between folders
- List folder contents

**What Claude can't do:**
- Access files outside the folder you specified
- Delete files permanently (files go to trash)
- Access Obsidian's app settings — only your note files

---

## Recommended: Create a personal context file

Create a file called `[YourName].md` in the `People/` folder. This is a file Claude reads to understand who you are, what you care about, and how you like to work.

Include things like:
- Your name and role
- Your top priorities right now
- How you prefer to communicate (brief vs. detailed, formal vs. casual)
- Any recurring commitments or routines
- What "done" looks like for you

This file makes Claude a much better assistant because it has context about you beyond just the current conversation.

Example:

```markdown
# Sarah Chen

## Role
Product manager at a mid-size SaaS company. Also freelance writing on the side.

## Current priorities
- Ship the Q2 roadmap by April 15
- Finish draft of blog series on product thinking
- Train for a half marathon (race in June)

## How I work
- I like brief answers. If I need more detail, I'll ask.
- Morning is for deep work. Don't suggest scheduling meetings before noon.
- I review tasks on Sunday evenings.

## Communication
- Default to bullet points over paragraphs
- Be honest if something looks stuck or poorly planned
```
