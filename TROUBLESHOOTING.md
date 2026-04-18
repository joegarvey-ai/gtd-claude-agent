# Troubleshooting

Common issues and how to fix them. If your problem isn't listed here, [open an issue](https://github.com/joegarvey-ai/gtd-claude-agent/issues) on GitHub and we'll help.

---

## "Claude Desktop doesn't show the hammer icon"

The hammer (or wrench) icon appears near the text input area when Claude has tool connections available. If you don't see it:

**1. Is Node.js installed?**

Open Terminal (Mac: press **Cmd + Space**, type **Terminal**, press **Enter**) or Command Prompt (Windows: click **Start**, type **cmd**, press **Enter**) and type:

```
node --version
```

- If you see a version number like `v22.x.x` → Node.js is installed, move to the next check.
- If you see "command not found" or "'node' is not recognized" → Node.js isn't installed. Go back to Step 3 in your setup guide ([Mac](SETUP-MAC.md#step-3-install-nodejs) / [Windows](SETUP-WINDOWS.md#step-3-install-nodejs)).

**2. Did you fully quit and reopen Claude Desktop?**

Closing the window is NOT the same as quitting the app. Claude Desktop must be fully quit and reopened after you save the settings file.

- **Mac:** Click **Claude** in the menu bar → **Quit Claude** (or press **Cmd + Q**)
- **Windows:** Right-click the Claude icon in the system tray (bottom-right corner near the clock) → **Quit**. If you can't find it, press **Ctrl + Shift + Esc** to open Task Manager, find Claude, right-click → **End task**.

Then reopen Claude Desktop.

**3. Is the settings file in the right place?**

> **Easiest way to find (and open) the file:** In Claude Desktop, go to **Settings → Developer → Edit Config**. This opens the config file in your default editor and creates it if it doesn't exist yet.

**Fallback — Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
Note: `~/Library` is hidden by default. Use Finder → **Go → Go to Folder** (⌘⇧G) and paste the path.

**Fallback — Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
Paste this into the address bar in File Explorer.

The file must be named **exactly** `claude_desktop_config.json` — not `claude_desktop_config.json.txt` or anything else.

⚠️ **Windows users:** Make sure file extensions are visible. In File Explorer, click **View** → check **File name extensions**. If your file is actually named `claude_desktop_config.json.txt`, rename it to remove the `.txt`.

**4. Is the settings file formatted correctly?**

Open the file and check:
- Every opening `{` has a matching closing `}`
- Every opening `[` has a matching closing `]`
- Every piece of text is wrapped in straight quotes `"` — not curly "smart quotes"
- There are no extra commas at the end of lists

⚠️ **Windows users:** Did you double every backslash in your vault path? `C:\Users\...` must become `C:\\Users\\...` in the settings file.

The easiest fix: copy the example from your setup guide fresh and just replace the vault path.

---

## "Claude says it can't access my vault" or "can't find files"

**1. Is the vault path correct in your settings file?**

You can test the path yourself:

- **Mac:** Open Terminal (press **Cmd + Space**, type **Terminal**, press **Enter**) and type:
  ```
  ls "YOUR_VAULT_PATH_HERE"
  ```
  Replace `YOUR_VAULT_PATH_HERE` with the path from your settings file. If it shows your folders (00 Inbox, 01 Next Actions, etc.), the path is correct.

- **Windows:** Open Command Prompt (click Start, type **cmd**, press Enter) and type:
  ```
  dir "YOUR_VAULT_PATH_HERE"
  ```
  Replace `YOUR_VAULT_PATH_HERE` with the path from your settings file (**use single backslashes here**, not doubled). If it shows your folders, the path is correct.

**2. Are you an iCloud user on Mac?**

The iCloud vault path is tricky. It's NOT in your regular iCloud Drive folder. The actual path includes a hidden folder:

```
/Users/YOUR_USERNAME/Library/Mobile Documents/iCloud~md~obsidian/Documents/YOUR_VAULT_NAME
```

Note the `Library/Mobile Documents/iCloud~md~obsidian/` part — this is where Apple actually stores iCloud Obsidian data, even though it doesn't appear in the normal iCloud Drive folder in Finder.

**3. Do any folder or vault names contain apostrophes?**

Claude can't read folders with apostrophes (') in the name. If your vault is called `Joe's Notes` or you have a folder called `Mom's Recipes`, rename them to remove the apostrophe (`Joes Notes`, `Moms Recipes`).

**4. Did you change the vault location after setting up?**

If you moved your vault folder or renamed it, the path in your settings file is now wrong. Update the path in the settings file and restart Claude Desktop.

---

## "My notes don't sync to my phone"

**iPhone or iPad:**
- Your vault MUST be stored in iCloud for automatic sync.
- If you originally created the vault somewhere else, you'll need to move it into iCloud. See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md) for instructions.
- Make sure Obsidian is installed on your iPhone/iPad from the App Store. It should automatically detect your iCloud vault.

**Android:**
- iCloud doesn't work with Android devices. You have other options:
  - **Obsidian Sync** ($4/month) — Obsidian's built-in sync service. Easiest option.
  - **Remotely Save plugin** (free) — A community plugin that syncs through various cloud services.
- See [docs/obsidian-sync-options.md](docs/obsidian-sync-options.md) for detailed setup instructions.

**Windows + iPhone:**
- You must install **iCloud for Windows** from the Microsoft Store.
- Your vault must be saved inside the iCloud Drive folder on your Windows computer.
- See [SETUP-WINDOWS.md](SETUP-WINDOWS.md#step-1-download-and-set-up-obsidian) for detailed steps.

---

## "The settings file doesn't exist"

That's completely normal on a fresh installation of Claude Desktop. The file isn't created automatically — you create it yourself.

> **Easiest way:** In Claude Desktop, go to **Settings → Developer → Edit Config**. This opens the config file in your default editor and creates it if it doesn't exist yet.

If **Edit Config** isn't available in your version of Claude Desktop, follow the settings file creation steps in your setup guide:
- **Mac:** [SETUP-MAC.md → Step 4](SETUP-MAC.md#step-4-connect-claude-desktop-to-obsidian)
- **Windows:** [SETUP-WINDOWS.md → Step 4](SETUP-WINDOWS.md#step-4-connect-claude-desktop-to-obsidian)

The file locations are:
- **Fallback — Mac:** `/Users/YOUR_USERNAME/Library/Application Support/Claude/claude_desktop_config.json`
  - Shortcut: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Note: `~/Library` is hidden by default. Use Finder → **Go → Go to Folder** (⌘⇧G) and paste the path.
- **Fallback — Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
  - Full path is usually: `C:\Users\YOUR_USERNAME\AppData\Roaming\Claude\claude_desktop_config.json`
  - Paste `%APPDATA%\Claude` into the address bar in File Explorer.

---

## "I get an error when Claude Desktop starts" or "Claude Desktop crashes on startup"

This is almost always caused by a formatting mistake in the settings file. The settings file format is very picky — one missing comma, one wrong quote, or one mismatched bracket will break it.

**Common mistakes to check for:**

1. **Smart quotes instead of straight quotes:** The file needs straight quotes `"like this"` — not curly quotes "like this." If you typed the file by hand or copy-pasted from a word processor, the quotes may have been converted to smart quotes.

   ⚠️ **Mac TextEdit users:** Make sure you set the file to **Plain Text** before editing. Go to **Format** → **Make Plain Text**. Rich text mode adds invisible formatting that breaks the file.

2. **Missing or extra commas:** Every item in a list needs a comma after it, EXCEPT the last one. No trailing commas.

3. **Mismatched brackets:** Every `{` needs a `}`, every `[` needs a `]`.

4. **Windows backslash issue:** Every `\` in a file path must be doubled to `\\`.

**The easiest fix:** Start over. Copy the example from your setup guide ([Mac](SETUP-MAC.md#step-4-connect-claude-desktop-to-obsidian) / [Windows](SETUP-WINDOWS.md#step-4-connect-claude-desktop-to-obsidian)) and just replace the vault path.

**Want to check if your file is valid?** Copy the entire contents of your settings file and paste it into [jsonlint.com](https://jsonlint.com). Click "Validate JSON" — it will tell you exactly where the error is.

---

## "Gmail or Calendar isn't connected"

Gmail and Google Calendar connect through [claude.ai](https://claude.ai) in your browser, NOT through the settings file. They're separate from the Obsidian connection.

**To connect or reconnect:**

1. Go to [claude.ai](https://claude.ai) in your browser
2. Click your **profile icon** → **Settings**
3. Look for **Connectors** or **Connected Apps** or **Integrations**
4. Make sure Gmail and Google Calendar both show as **Connected**
5. If they show as disconnected, click **Connect** and authorize with your Google account

**If they're connected but not working:**

- Try using your Project through [claude.ai](https://claude.ai) in the browser instead of Claude Desktop. Some connector features work better in the browser.
- Try disconnecting and reconnecting the service (in Settings → Connectors).
- Make sure you authorized with the correct Google account (especially if you have multiple Google accounts).

---

## "I connected everything but Claude doesn't know about my GTD system"

This means the system prompt (the instructions that tell Claude about your setup) isn't loaded. Check:

1. Did you create a **Project** and paste the system prompt into its custom instructions? See Step 5 in your setup guide.
2. Are you chatting **inside the Project**? Starting a regular chat outside the Project won't include the instructions. Make sure you see your Project name at the top of the conversation.
3. Did you replace the `[BRACKETED]` placeholders with your actual information? If Claude sees `[VAULT_PATH]` instead of your real path, it won't know where to look.

---

## Still stuck?

[Open an issue](https://github.com/joegarvey-ai/gtd-claude-agent/issues) on GitHub and describe:
- What step you're on
- What you expected to happen
- What actually happened
- Whether you're on Mac or Windows

We'll help you get unstuck.
