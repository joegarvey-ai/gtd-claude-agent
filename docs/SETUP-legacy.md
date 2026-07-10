> **This file has been replaced.** See [SETUP-MAC.md](../SETUP-MAC.md) or [SETUP-WINDOWS.md](../SETUP-WINDOWS.md) for current setup guides.

# Setup Guide (Legacy)

This guide walks you through everything you need to get your GTD Claude Agent running. No coding experience required — just follow each step.

---

## Step 1: Install Claude Desktop

> **What you're doing:** Installing the app that Claude runs in on your Mac.
> **Why it matters:** Claude Desktop is where you'll chat with your assistant and where all the tool connections live.

1. Go to [claude.ai/download](https://claude.ai/download)
2. Download the Mac version
3. Open the installer and drag Claude to your Applications folder
4. Open Claude Desktop and sign in with your Claude account

You'll need a **Claude Pro or Max subscription** to use the features in this project. If you don't have one yet, you can upgrade at [claude.ai/upgrade](https://claude.ai/upgrade).

---

## Step 2: Install Node.js

> **What you're doing:** Installing a small piece of software that some of Claude's tool connections need to run.
> **Why it matters:** MCP servers (the bridges between Claude and your tools) are built on Node.js. You won't write any code — you just need it installed.

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the big green **LTS** (Long Term Support) button to download
3. Open the installer and click Next through each screen — the defaults are fine
4. When it's done, you can close the installer

To verify it worked, open Terminal (search for "Terminal" in Spotlight) and paste this:

```bash
node --version
```

You should see a version number like `v22.x.x`. If you do, you're good.

---

## Step 3: Set up your Obsidian vault

> **What you're doing:** Creating the note-taking system that serves as your GTD backbone.
> **Why it matters:** Obsidian stores your tasks, projects, and reference material as simple text files. Claude reads and writes to these files directly.

1. Download [Obsidian](https://obsidian.md/) if you haven't already
2. Open Obsidian and create a new vault. Name it whatever you like (e.g., "GTD" or "Brain")
3. **Recommended:** Store the vault in iCloud so it syncs across devices. When Obsidian asks where to save the vault, choose a location inside your iCloud Drive folder.

Now create the following folder structure inside your vault:

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

Here's what each folder is for:

| Folder | Purpose |
|--------|---------|
| **00 Inbox** | Where you dump everything — thoughts, tasks, links, ideas. Claude processes this. |
| **01 Next Actions / Deep Work** | Tasks that need focused time (30+ minutes, no distractions) |
| **01 Next Actions / Quick Wins** | Tasks you can knock out in under 30 minutes |
| **02 Personal Projects** | Multi-step efforts with a clear end goal |
| **03 Family & Personal Planning** | Meal plans, household tasks, family logistics |
| **04 Someday Maybe** | Ideas you're not acting on now but don't want to forget |
| **05 Reference** | Information you might need later but isn't actionable |
| **06 Waiting For** | Things you're waiting on someone else to complete |
| **People** | Notes about key people in your life — context Claude can reference |

**Recommended:** Create a file called `[YourName].md` in the People folder with any personal context you want Claude to always know — your role, priorities, communication preferences, etc.

For detailed Obsidian setup guidance, see [docs/obsidian-setup.md](docs/obsidian-setup.md).

---

## Step 4: Configure claude_desktop_config.json

> **What you're doing:** Telling Claude Desktop how to connect to your tools.
> **Why it matters:** This configuration file is how Claude knows where your Obsidian vault is and how to access Google Drive. Without it, Claude can't reach your tools.

The configuration file is a settings file that Claude Desktop reads when it starts up. You need to find it, open it, and paste in your settings.

### Find and open the file

1. Open **Finder**
2. In the menu bar, click **Go → Go to Folder...**
3. Paste this path and press Enter:

```
~/Library/Application Support/Claude/
```

4. Look for a file called `claude_desktop_config.json`. If it doesn't exist yet, you'll create it.
5. Open it in TextEdit (right-click → Open With → TextEdit) or any text editor

### Add your configuration

Copy the contents of [`claude_desktop_config.example.json`](claude_desktop_config.example.json) from this repo and paste it into your config file.

You'll need to replace the placeholder values:
- `[YOUR_USERNAME]` — your Mac username (the name of your home folder)
- `[YOUR_GOOGLE_CLIENT_ID]` and `[YOUR_GOOGLE_CLIENT_SECRET]` — from the Google Drive setup (next step)

**Important:** Save the file, then **restart Claude Desktop** for changes to take effect.

---

## Step 5: Connect Google Drive

> **What you're doing:** Setting up a secure connection between Claude and your Google Drive.
> **Why it matters:** This lets Claude read your documents, create new ones, and work with spreadsheets.

This is the most involved step because Google requires you to create credentials. Don't worry — you only do this once.

Follow the guide: **[docs/google-drive-setup.md](docs/google-drive-setup.md)**

---

## Step 6: Connect Gmail, Calendar, and GitHub

> **What you're doing:** Connecting three more tools using Claude's built-in connector system.
> **Why it matters:** These connections let Claude manage your email, calendar, and GitHub repos.

Unlike Google Drive, these three use Claude Desktop's built-in Connectors — no config file editing needed.

Follow the guide: **[docs/gmail-calendar-github-setup.md](docs/gmail-calendar-github-setup.md)**

---

## Step 7: Add your system prompt

> **What you're doing:** Giving Claude its instructions — who it is, what it knows, and how it should behave.
> **Why it matters:** The system prompt is what turns Claude from a general AI into *your* personal GTD assistant.

1. Open the file [`system-prompt.md`](system-prompt.md) from this repo
2. Read through it and replace all the `[PLACEHOLDER]` values with your own information
3. In Claude Desktop, go to **Settings → Profile**
4. Paste your customized system prompt into the **Custom Instructions** field
5. Click **Save**

Claude will now use these instructions in every new conversation.

For tips on customizing the prompt further, see [docs/customizing-your-system-prompt.md](docs/customizing-your-system-prompt.md).

---

## Step 8: Test it

> **What you're doing:** Making sure everything works.
> **Why it matters:** A quick test now saves debugging later.

Open a new conversation in Claude Desktop and try these prompts:

**Test Obsidian access:**
```
Can you read my Obsidian inbox and tell me what's in there?
```

**Test Google Drive:**
```
List my recent Google Drive documents.
```

**Test Gmail:**
```
Check my Gmail inbox and summarize the top 5 unread messages.
```

**Test Calendar:**
```
What's on my calendar for this week?
```

**Test GitHub:**
```
List my recent GitHub repos.
```

**Test the full GTD flow:**
```
Process my Obsidian inbox — for each item, suggest where it should go and why.
```

If any of these fail, check that:
- Claude Desktop has been restarted since you edited the config file
- Your OAuth credentials are correct (for Google Drive)
- The connectors show as "Connected" in Settings → Connectors (for Gmail, Calendar, GitHub)

---

## You're done!

Your GTD Claude Agent is now set up. Start by dumping a few tasks into your Obsidian inbox, then ask Claude to process them. The more you use it, the more natural the workflow becomes.

For ongoing tips and community support, check the [Issues](https://github.com/joegarvey-ai/personal-assistant-kit/issues) tab on this repo.
