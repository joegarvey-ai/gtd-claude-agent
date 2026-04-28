# Mac Setup Guide

> **Time needed:** About 30 minutes
> **Difficulty:** No coding required — just downloading apps and copying text

---

## Before You Start

You'll need:
- A Mac computer
- An iPhone or iPad (if you want to access your notes on your phone — not required)
- A Claude Pro or Max subscription ($20/month at [claude.ai/upgrade](https://claude.ai/upgrade))

---

## Step 1: Download and Set Up Obsidian

### Install Obsidian

1. Go to [obsidian.md](https://obsidian.md/)
2. Click **Download for macOS**
3. Open the downloaded file and drag Obsidian to your Applications folder
4. Open Obsidian from your Applications folder

### Create Your Vault

> **What's a vault?** It's just a folder on your computer where your notes live. Obsidian calls it a "vault" but it's really just a regular folder full of text files. This is where all your tasks, projects, and reference material will be stored.

When Obsidian opens for the first time, it will ask you to create or open a vault.

1. Click **Create new vault**
2. Give it a name like `GTD` or `Brain` or `Notes`

⚠️ **Important:** Don't use apostrophes (') in your vault name or any folder names. Claude can't read folders with apostrophes in the name. So use `Joes Notes` instead of `Joe's Notes`.

**Now choose where to save it based on your phone situation:**

**Do you want to access your notes on your iPhone or iPad?**
- **Yes →** Choose **Store in iCloud** when Obsidian asks where to save the vault. This syncs your notes automatically to all your Apple devices.
  - On your iPhone or iPad: Install Obsidian from the App Store. When you open it, it will automatically find your iCloud vault.

**Do you have an Android phone instead?**
- **Yes →** Create the vault anywhere on your Mac for now (your Documents folder is fine). You'll need a separate sync method for Android. See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md) for your options.

**No phone sync needed?**
- Create the vault anywhere on your Mac. Your Documents folder works great.

### Create Your Folder Structure

Now you need to create folders inside your vault. These folders are the backbone of your GTD system — each one has a specific purpose.

In Obsidian, right-click in the left sidebar and choose **New folder** to create each of these:

```
00 Inbox
01 Next Actions
02 Personal Projects
03 Family & Personal Planning
04 Someday Maybe
05 Reference
06 Waiting For
People
```

Then inside the `01 Next Actions` folder, create two more folders:
- `Deep Work`
- `Quick Wins`

(Right-click on `01 Next Actions` → **New folder**)

Here's what each folder is for:

| Folder | What goes here |
|--------|---------------|
| **00 Inbox** | Dump everything here — tasks, ideas, links, thoughts. Claude processes this folder for you. |
| **01 Next Actions / Deep Work** | Tasks that need focused time (30+ minutes, no distractions) |
| **01 Next Actions / Quick Wins** | Tasks you can knock out in under 30 minutes |
| **02 Personal Projects** | Bigger efforts with multiple steps and a clear end goal |
| **03 Family & Personal Planning** | Meal plans, household tasks, family logistics |
| **04 Someday Maybe** | Ideas you're not acting on now but don't want to forget |
| **05 Reference** | Information you might need later but isn't something to do |
| **06 Waiting For** | Things you're waiting on someone else to complete |
| **People** | Notes about key people in your life — context Claude can reference |

### Create Your Personal Context File

This step helps Claude understand who you are so it can give you better help.

1. In Obsidian, click on the **People** folder in the left sidebar
2. Right-click and choose **New note**
3. Name it your first name (for example, `Joe.md` or `Sarah.md`)
4. Add some basic information about yourself:
   - Your name
   - Your job or role
   - What you're focused on right now
   - How you like to communicate (brief and to the point? detailed? casual?)

This helps Claude understand you better over time. You can always update it later.

---

## Step 2: Download Claude Desktop

1. Go to [claude.ai/download](https://claude.ai/download)
2. Click **Download for Mac**
3. Open the downloaded file and drag Claude to your Applications folder
4. Open Claude Desktop and sign in with your Anthropic account
5. If you don't have a Pro or Max subscription yet, upgrade at [claude.ai/upgrade](https://claude.ai/upgrade)

---

## Step 3: Install Node.js

> **What is this?** Node.js is a small program that runs in the background. Claude Desktop needs it to connect to your Obsidian vault. You install it once and never think about it again.

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the big green **LTS** button to download
3. Open the downloaded file and click **Continue** through every screen — the default settings are fine
4. When it says the installation is complete, click **Close**

**To verify it worked:**

5. Open Terminal on your Mac. Here's how:
   - Press **Cmd + Space** on your keyboard (this opens Spotlight search)
   - Type **Terminal**
   - Press **Enter**
6. A window with a black or white background will appear. Paste this line and press **Enter**:

   ```
   node --version
   ```

7. You should see something like `v22.x.x` (the exact numbers don't matter)

✅ If you see a version number, Node.js is installed. You can close Terminal.

⚠️ If you see "command not found," try closing Terminal, opening it again, and running the command one more time. If it still doesn't work, restart your Mac and try again. If that still doesn't work, reinstall Node.js from step 1.

---

## Step 4: Connect Claude Desktop to Obsidian

> **What's happening here:** You're creating a small settings file that tells Claude Desktop where your notes are. This is the most technical step — just follow it exactly and you'll be fine.

### Find your Obsidian vault path

You need the exact location of your vault folder on your Mac. This is called the "path."

**If you stored your vault in iCloud (for iPhone/iPad sync):**

Your path is probably:

```
/Users/YOUR_MAC_USERNAME/Library/Mobile Documents/iCloud~md~obsidian/Documents/YOUR_VAULT_NAME
```

To find your Mac username: open Terminal (press **Cmd + Space**, type **Terminal**, press **Enter**) and type `whoami` then press **Enter**. Whatever it shows is your username.

So if your username is `johndoe` and your vault is called `GTD`, your full path would be:

```
/Users/johndoe/Library/Mobile Documents/iCloud~md~obsidian/Documents/GTD
```

**If you stored your vault somewhere else (like your Documents folder):**

1. Open **Finder**
2. Navigate to your vault folder
3. Right-click the vault folder
4. Hold down the **Option** key on your keyboard — you'll see the menu change
5. Click **Copy "folder name" as Pathname**
6. That's your path. Paste it somewhere so you can use it in a minute.

### Create the settings file

> **Easiest way:** In Claude Desktop, go to **Settings → Developer → Edit Config**. This opens the config file in your default editor and creates it if it doesn't exist yet. If that works for you, skip to step 6 below.

If **Edit Config** isn't available in your version of Claude Desktop, use the fallback below.

**Fallback — Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
Note: `~/Library` is hidden by default. Use Finder → **Go → Go to Folder** (⌘⇧G) and paste the path.

1. Open **Finder**
2. In the menu bar at the top of the screen, click **Go**
3. Click **Go to Folder...**
4. Paste this path and press **Enter**:

   ```
   ~/Library/Application Support/Claude/
   ```

   (This is the same as `/Users/YOUR_MAC_USERNAME/Library/Application Support/Claude/`)

5. Look for a file called `claude_desktop_config.json`

   - **If the file exists:** Right-click it → **Open With** → **TextEdit**
   - **If the file doesn't exist:** That's normal. Follow these steps to create it:
     1. Open **TextEdit** (press **Cmd + Space**, type **TextEdit**, press **Enter**)
     2. Before typing anything, click **Format** in the menu bar → **Make Plain Text** (this is important — the file won't work if it's saved as "rich text")
     3. Leave it blank for now — you'll paste content in the next step
     4. Click **File** → **Save** (or press **Cmd + S**)
     5. Navigate to the same folder: `~/Library/Application Support/Claude/`
     6. Name the file exactly: `claude_desktop_config.json`
     7. If TextEdit asks about the extension, click **Use .json**

6. Paste this into the file, replacing everything that's already there:

```
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "PASTE_YOUR_VAULT_PATH_HERE"
      ]
    }
  }
}
```

> **About this package:** This uses the standard filesystem MCP server pointed at your Obsidian vault. Your vault is just a folder of markdown files, so Claude can read and write notes through this server without needing an Obsidian-specific package.
>
> **Multi-vault tip:** If you have more than one vault and want Claude to see all of them, you can point the path at the parent folder (e.g. `/Users/johndoe/Library/Mobile Documents/iCloud~md~obsidian/Documents`) instead of a specific vault.

7. Replace `PASTE_YOUR_VAULT_PATH_HERE` with your actual vault path from the previous step. **Keep the quotes around it.**

   For example, if your vault is in iCloud and your username is `johndoe` and your vault is called `GTD`, it would look like:

```
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/johndoe/Library/Mobile Documents/iCloud~md~obsidian/Documents/GTD"
      ]
    }
  }
}
```

8. Save the file (**Cmd + S**)
9. **Fully quit Claude Desktop** — this is important. Don't just close the window. Instead:
   - Click **Claude** in the menu bar at the very top of your screen
   - Click **Quit Claude**
   - Or press **Cmd + Q**
10. Reopen Claude Desktop

### Verify it worked

Look for a small 🔨 hammer icon in the Claude Desktop chat window, near the text input area at the bottom. If you see it, Obsidian is connected. Click it to see the available tools.

✅ If you see the hammer icon, Claude can access your Obsidian vault.

⚠️ If you don't see the hammer icon, check the [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## Step 5: Set Up Your Claude Project

> **What's a Project?** It's a space in Claude where you can give the AI persistent instructions so it understands your system every time you chat. Think of it like a briefing document that Claude reads before every conversation.

1. Open Claude Desktop or go to [claude.ai](https://claude.ai) in your browser
2. In the left sidebar, click **Projects**
3. Click **Create Project**
4. Name it something like `Personal Assistant` or `GTD Assistant`
5. Click **Set custom instructions** (or look for a section called "Custom Instructions" or "Project Instructions")
6. Now you need the system prompt from this repo. Go to [github.com/joegarvey-ai/gtd-claude-agent/blob/main/system-prompt.md](https://github.com/joegarvey-ai/gtd-claude-agent/blob/main/system-prompt.md)
7. Copy everything **below** the `---` line (that's the horizontal line after the first few lines of instructions)
8. Paste it into the custom instructions box
9. Replace all the `[BRACKETED]` placeholders with your own info:
   - `[YOUR_NAME]` → your first name
   - `[VAULT_PATH]` → the same vault path from Step 4
   - `[YOUR_USERNAME]` → your Mac username (the one from `whoami`)
10. The sections at the bottom (Meal Planning, Fitness, Writing & Career, Finance) are optional. Delete any that don't apply to you, or fill them in if they do.
11. Save the project

---

## Step 6: Connect Gmail and Google Calendar

These are built-in connections in Claude — no settings files needed. Just click and authorize.

1. Go to [claude.ai](https://claude.ai) in your browser
2. Click your **profile icon** (bottom of the left sidebar) → **Settings**
3. Look for **Connectors** or **Connected Apps** or **Integrations** (the name varies by version)
4. Find **Gmail** and click **Connect** → sign in with your Google account and click **Allow**
5. Find **Google Calendar** and click **Connect** → sign in and click **Allow**

✅ Both should now show as "Connected."

---

## Step 7: Test It

Open your Project in Claude Desktop (or at claude.ai) and try these prompts one at a time:

**Test 1 — Obsidian access:**
> What's in my Obsidian inbox?

**Test 2 — Creating a note:**
> Create a note in my inbox called "Test task" with the content "This is a test"

**Test 3 — Calendar:**
> What's on my calendar this week?

**Test 4 — Email:**
> Check my email for anything urgent

✅ If all four work, you're fully set up! Start by dumping a few tasks into your Obsidian inbox, then ask Claude to process them.

⚠️ If something doesn't work, check the [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## What's Next

- **Daily use:** Dump tasks and ideas into your `00 Inbox` folder in Obsidian, then ask Claude to process your inbox
- **Weekly reviews:** Ask Claude to run a weekly review — it will check all your folders and flag anything that needs attention
- **Advanced connections:** Want to connect your Bee lifelogger, Google Drive, GitHub, or Slack? See [docs/advanced-connectors.md](docs/advanced-connectors.md)
- **Customize your system:** Want to tweak how Claude works for you? See [docs/customizing-your-system-prompt.md](docs/customizing-your-system-prompt.md)
- **Sync options:** Need to sync your notes to Android or another device? See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md)
