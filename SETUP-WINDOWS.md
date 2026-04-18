# Windows Setup Guide

> **Time needed:** About 30 minutes
> **Difficulty:** No coding required — just downloading apps and copying text

---

## Before You Start

You'll need:
- A Windows computer (Windows 10 or 11)
- An iPhone, iPad, or Android phone (if you want to access your notes on your phone — not required)
- A Claude Pro or Max subscription ($20/month at [claude.ai/upgrade](https://claude.ai/upgrade))

---

## Step 1: Download and Set Up Obsidian

### Install Obsidian

1. Go to [obsidian.md](https://obsidian.md/)
2. Click **Download for Windows**
3. Open the downloaded installer and follow the prompts to install
4. Open Obsidian when the installation is complete

### Create Your Vault

> **What's a vault?** It's just a folder on your computer where your notes live. Obsidian calls it a "vault" but it's really just a regular folder full of text files. This is where all your tasks, projects, and reference material will be stored.

When Obsidian opens for the first time, it will ask you to create or open a vault.

1. Click **Create new vault**
2. Give it a name like `GTD` or `Brain` or `Notes`

⚠️ **Important:** Don't use apostrophes (') in your vault name or any folder names. Claude can't read folders with apostrophes in the name. So use `Joes Notes` instead of `Joe's Notes`.

**Now choose where to save it based on your phone situation:**

**Do you want to access your notes on your iPhone or iPad?**
- **Yes →** You'll need to install **iCloud for Windows** first. Here's how:
  1. Open the **Microsoft Store** (search for it in the Start menu)
  2. Search for **iCloud**
  3. Click **Get** or **Install** to download iCloud for Windows
  4. Open iCloud for Windows and sign in with your Apple ID
  5. Make sure **iCloud Drive** is checked/enabled
  6. Now when creating your vault in Obsidian, save it inside your iCloud Drive folder. The path will be something like: `C:\Users\YOUR_USERNAME\iCloud Drive\Obsidian\YOUR_VAULT_NAME`
  7. On your iPhone or iPad: Install Obsidian from the App Store. When you open it, it will automatically find your iCloud vault.

**Do you have an Android phone instead?**
- **Yes →** You have a couple of options:
  - **Easy option:** Save your vault inside your **OneDrive** folder (usually at `C:\Users\YOUR_USERNAME\OneDrive\Obsidian\YOUR_VAULT_NAME`). Then on your Android phone, install Obsidian and use the free community plugin called "Remotely Save" or the "FolderSync" app to sync from OneDrive.
  - See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md) for detailed setup steps.

**No phone sync needed?**
- Save the vault in your Documents folder. When Obsidian asks where to create the vault, navigate to `C:\Users\YOUR_USERNAME\Documents` and create it there.

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

---

## Step 2: Download Claude Desktop

1. Go to [claude.ai/download](https://claude.ai/download)
2. Click **Download for Windows**
3. Open the downloaded installer and follow the prompts
4. Open Claude Desktop and sign in with your Anthropic account
5. If you don't have a Pro or Max subscription yet, upgrade at [claude.ai/upgrade](https://claude.ai/upgrade)

---

## Step 3: Install Node.js

> **What is this?** Node.js is a small program that runs in the background. Claude Desktop needs it to connect to your Obsidian vault. You install it once and never think about it again.

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the big green **LTS** button to download
3. Open the downloaded file and click **Next** through every screen — the default settings are fine
4. Click **Install**, then **Finish** when it's done

**To verify it worked:**

5. Open Command Prompt on your Windows computer. Here's how:
   - Click the **Start** button (or press the **Windows key** on your keyboard)
   - Type **cmd**
   - Click **Command Prompt** when it appears
6. A black window will appear. Type this and press **Enter**:

   ```
   node --version
   ```

7. You should see something like `v22.x.x` (the exact numbers don't matter)

✅ If you see a version number, Node.js is installed. You can close Command Prompt.

⚠️ If you see "'node' is not recognized," close Command Prompt, open it again, and try one more time. If it still doesn't work, restart your computer and try again. If that still doesn't work, reinstall Node.js from step 1.

---

## Step 4: Connect Claude Desktop to Obsidian

> **What's happening here:** You're creating a small settings file that tells Claude Desktop where your notes are. This is the most technical step — just follow it exactly and you'll be fine.

### Find your Obsidian vault path

You need the exact location of your vault folder on your computer. This is called the "path."

**If your vault is in your Documents folder:**

Your path is probably:

```
C:\Users\YOUR_USERNAME\Documents\YOUR_VAULT_NAME
```

To find your Windows username: open Command Prompt (click Start, type **cmd**, press Enter) and type `whoami` then press **Enter**. It will show something like `COMPUTERNAME\johndoe` — the part after the `\` is your username.

So if your username is `johndoe` and your vault is called `GTD`, your full path would be:

```
C:\Users\johndoe\Documents\GTD
```

**If your vault is in iCloud (for iPhone sync):**

Your path is probably:

```
C:\Users\YOUR_USERNAME\iCloud Drive\Obsidian\YOUR_VAULT_NAME
```

**If your vault is in OneDrive (for Android sync):**

Your path is probably:

```
C:\Users\YOUR_USERNAME\OneDrive\Obsidian\YOUR_VAULT_NAME
```

**Not sure where your vault is?** Open File Explorer, navigate to your vault folder, and click in the address bar at the top — it will show you the full path. Copy it.

### Create the settings file

> **Easiest way:** In Claude Desktop, go to **Settings → Developer → Edit Config**. This opens the config file in your default editor and creates it if it doesn't exist yet. If that works for you, skip to step 5 below.

If **Edit Config** isn't available in your version of Claude Desktop, use the fallback below.

**Fallback — Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
Paste this into the address bar in File Explorer.

1. Press **Win + R** on your keyboard (hold the Windows key and press R). A small "Run" box will appear.
2. Type this and press **Enter**:

   ```
   %APPDATA%\Claude
   ```

3. A File Explorer window will open.
   - **If the Claude folder exists:** Great, you're in the right place.
   - **If you get an error saying the folder doesn't exist:** Go to `%APPDATA%` instead (press Win + R, type `%APPDATA%`, press Enter), then right-click → **New** → **Folder** and name it `Claude`. Open the new folder.

4. Look for a file called `claude_desktop_config.json`

   - **If the file exists:** Right-click it → **Open with** → **Notepad**
   - **If the file doesn't exist:** That's normal. Follow these steps to create it:
     1. Right-click in the empty space in the folder
     2. Click **New** → **Text Document**
     3. A new file will appear. **Rename it to exactly:** `claude_desktop_config.json`
        - You need to replace the entire name including `.txt`. If Windows asks "Are you sure you want to change the file extension?" click **Yes**.
        - If you can't see file extensions: click **View** at the top of File Explorer → check **File name extensions**
     4. Right-click the new file → **Open with** → **Notepad**

5. Paste this into the file, replacing everything that's already there:

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
> **Multi-vault tip:** If you have more than one vault and want Claude to see all of them, you can point the path at the parent folder (e.g. `C:\\Users\\johndoe\\Documents`) instead of a specific vault.

6. Replace `PASTE_YOUR_VAULT_PATH_HERE` with your actual vault path from the previous step. **Keep the quotes around it.**

> ⚠️ **CRITICAL — Windows backslash rule:** In this settings file, every backslash (`\`) in your path must be **doubled** (`\\`). This is because the settings file format treats a single backslash as a special character.
>
> **Your path in File Explorer:**
> `C:\Users\johndoe\Documents\GTD`
>
> **Your path in the settings file (backslashes doubled):**
> `C:\\Users\\johndoe\\Documents\\GTD`

   Here's a complete example of what the file should look like:

```
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\johndoe\\Documents\\GTD"
      ]
    }
  }
}
```

   And here's an example for an iCloud vault:

```
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\johndoe\\iCloud Drive\\Obsidian\\GTD"
      ]
    }
  }
}
```

7. Save the file (**Ctrl + S**)
8. **Fully quit Claude Desktop** — this is important. Don't just close the window. Instead:
   - Right-click the Claude icon in the **system tray** (the small icons area in the bottom-right of your taskbar, near the clock)
   - Click **Quit** or **Exit**
   - If you can't find it in the system tray: press **Ctrl + Shift + Esc** to open Task Manager, find Claude in the list, right-click it, and click **End task**
9. Reopen Claude Desktop

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
   - `[VAULT_PATH]` → the same vault path from Step 4 (**use regular single backslashes here**, not doubled — the doubling is only for the settings file)
   - `[YOUR_USERNAME]` → your Windows username
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
- **Advanced connections:** Want to connect Google Drive, GitHub, or Slack? See [docs/advanced-connectors.md](docs/advanced-connectors.md)
- **Customize your system:** Want to tweak how Claude works for you? See [docs/customizing-your-system-prompt.md](docs/customizing-your-system-prompt.md)
- **Sync options:** Need to sync your notes to Android or another device? See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md)
