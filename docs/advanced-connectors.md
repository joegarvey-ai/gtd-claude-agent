# Advanced Connectors

You've got the basics running (Obsidian + Gmail + Calendar). Here's how to add more power by connecting additional tools.

---

## Bee Lifelog

> **Difficulty:** Moderate — install a CLI and paste a system prompt, no API keys required
> **What it gives you:** Your [Bee](https://bee.computer) wearable's conversation captures flow into Obsidian, where a dedicated Claude project cleans them up and organizes them into tasks, meeting notes, and evolving people bios

### Setup

Follow the full guide: **[bee-setup.md](bee-setup.md)**

The short version:
1. Install the Bee CLI: `npm install -g @beeai/cli`
2. Authenticate: `bee login`
3. Create `00 Inbox/Bee/`, `05 Reference/Bee/_raw/`, `05 Reference/Meeting Notes/`, and (optional) `05 Reference/[EMPLOYER]/Meeting Notes/` folders in your vault
4. Run `bee sync --output "<vault>/05 Reference/Bee/_raw"` (manually at first, scheduled later)
5. Create a dedicated **Bee Processor** project in Claude Desktop with the prompt from [`system-prompt-bee-processor.md`](../system-prompt-bee-processor.md)

### What the Bee Processor does

- Reads raw captures from `05 Reference/Bee/_raw/`
- Applies a judgment-based redaction policy (excludes intimate, medical, family-private, non-consenting third-party content)
- Produces stack-ranked tasks in `00 Inbox/Bee/`
- Produces cleaned meeting summaries in `05 Reference/[EMPLOYER]/Meeting Notes/` (work) or `05 Reference/Meeting Notes/` (personal)
- Creates and updates structured People notes (Role & Context, Communication Style, Decision-Making Pattern, Collaboration Notes, Recent Topics, Open Threads)

### What the main GTD Assistant does

- Processes `00 Inbox/Bee/` tasks like any other inbox item
- Reads Meeting Notes and People notes for context during weekly reviews and ad-hoc queries
- Never touches raw captures directly — that's the Bee Processor's job

### Kiro users

If you use [Kiro](https://kiro.ai) alongside Claude Desktop, this repo includes a `.kiro/` directory with steering and hook files that auto-process new captures in the background. See [`.kiro/README.md`](../.kiro/README.md).

---

## Google Drive

> **Difficulty:** Developer-level — requires creating credentials in the Google Cloud Console
> **What it gives you:** Claude can read and write your Google Docs and Sheets

Google Drive requires a more involved setup because Google requires you to create OAuth credentials. This is a one-time process, but it involves navigating Google's developer console.

### Setup

Follow the full guide: **[google-drive-setup.md](google-drive-setup.md)**

The short version:
1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive, Docs, and Sheets APIs
3. Configure an OAuth consent screen
4. Create OAuth 2.0 credentials (Client ID and Client Secret)
5. Add the Google Docs MCP server to your settings file

### What changes in your settings file

You'll add a `google-docs` section alongside your existing `obsidian` section. See [claude_desktop_config.advanced.example.json](../claude_desktop_config.advanced.example.json) for the full example.

### What Claude can do with Google Drive

- Read and search documents
- Create new documents and spreadsheets
- Edit existing documents
- Read spreadsheet data
- Add rows and format cells

---

## GitHub

> **Difficulty:** Easy — just click and authorize
> **What it gives you:** Claude can manage your repos, issues, and pull requests

GitHub uses Claude's built-in Connectors — no settings file editing needed.

### Setup

1. Go to [claude.ai](https://claude.ai) in your browser
2. Click your **profile icon** → **Settings**
3. Look for **Connectors** or **Connected Apps**
4. Find **GitHub** and click **Connect**
5. You'll be redirected to GitHub — click **Authorize**
6. GitHub will show as "Connected"

### What Claude can do with GitHub

- List and search your repositories
- Read files and code
- Create, read, and comment on issues
- Create and review pull requests
- View commit history and diffs
- Search code across repos

### What Claude can't do

- Push code or merge PRs without your explicit approval
- Delete repositories
- Change repo settings

---

## Slack

> **Difficulty:** Easy to connect, but needs workspace admin approval
> **What it gives you:** Claude can read and send Slack messages

### Setup

1. Go to [claude.ai](https://claude.ai) in your browser
2. Click your **profile icon** → **Settings**
3. Look for **Connectors** or **Connected Apps**
4. Find **Slack** and click **Connect**
5. Select your Slack workspace
6. Click **Allow**

⚠️ **Note:** Your Slack workspace admin may need to approve the Claude integration before you can connect. If you click Connect and get an error about permissions, ask your workspace admin to approve Claude in the Slack admin settings.

### What Claude can do with Slack

- Read messages in channels you have access to
- Send messages to channels
- Search message history
- Read and respond to direct messages

---

## Outlook (email)

> **Difficulty:** Varies — requires an Outlook MCP server, which is typically a third-party package; may not be available at all enterprises
> **What it gives you:** Claude can read and draft Outlook email (Microsoft 365 / Exchange) — the equivalent of the Gmail connector for corporate environments

Unlike Gmail (which is a built-in Claude Desktop connector — zero config), Outlook requires:

1. An Outlook/Microsoft-Graph MCP server package installed via `npx` or similar
2. OAuth credentials from your Microsoft 365 tenant (typically requires admin approval at your company)
3. Adding the server to your `claude_desktop_config.json`

**Reality check:** If your company tightly controls Microsoft Graph app registrations, you may not be able to set this up without IT involvement. Gmail works out-of-the-box for personal accounts; Outlook at a Fortune-500 employer typically does not.

Search the [MCP server registry](https://github.com/modelcontextprotocol/servers) or [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) for the current recommended Outlook package — options change frequently.

---

## Readwise

> **Difficulty:** Easy — just need your Readwise access token
> **What it gives you:** Claude can access your highlights and reading notes from Readwise

### Setup

1. Go to [readwise.io/access_token](https://readwise.io/access_token) and copy your access token
2. In Claude, you can use the Readwise connector if available in your Connectors settings, or add it as a custom MCP server

### What Claude can do with Readwise

- Search your highlights
- Read your notes and annotations
- Surface relevant highlights during conversations

---

## Adding Multiple Connectors

You can use all of these at once. Your settings file can include multiple tool connections, and Claude's built-in Connectors (Gmail, Calendar, GitHub, Slack) all work alongside them.

For a full settings file example with Obsidian + Google Drive, see [claude_desktop_config.advanced.example.json](../claude_desktop_config.advanced.example.json).

Built-in Connectors (Gmail, Calendar, GitHub, Slack) are configured separately through [claude.ai](https://claude.ai) → Settings → Connectors and don't need to be in the settings file.

---

## About the advanced example file

The file [claude_desktop_config.advanced.example.json](../claude_desktop_config.advanced.example.json) contains the MCP servers that require local setup:

- **Obsidian** — via filesystem access
- **Google Drive** — via OAuth credentials (requires Google Cloud Console setup; see [google-drive-setup.md](google-drive-setup.md))

Gmail, Google Calendar, and GitHub are **not** configured in that file. They use Claude Desktop's built-in Connectors instead — see [gmail-calendar-github-setup.md](gmail-calendar-github-setup.md).

### To use the advanced example file

1. Copy it to your Claude Desktop config location:
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
2. Replace all `[PLACEHOLDER]` values with your actual information.
3. Restart Claude Desktop.
