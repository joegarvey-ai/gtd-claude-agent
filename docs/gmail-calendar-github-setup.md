# Gmail, Calendar & GitHub Setup

These three tools connect to Claude using **Connectors** — a built-in feature of Claude Desktop that handles the connection for you. No config files, no credentials to manage, no terminal commands. Just click and authorize.

---

## Where to find Connectors

1. Open **Claude Desktop**
2. Click your profile icon or go to **Settings**
3. Look for **Connectors** (sometimes called "Integrations" depending on your version)
4. You'll see a list of available services you can connect

---

## Gmail

> **What you're doing:** Giving Claude permission to read and interact with your email.
> **Why it matters:** This lets Claude triage your inbox, search for messages, and draft replies — without you having to copy-paste anything.

### How to connect
1. In the Connectors section, find **Gmail**
2. Click **Connect**
3. A Google sign-in window will open — sign in with your Google account
4. Review the permissions and click **Allow**
5. You'll see Gmail listed as "Connected"

### What Claude can do with Gmail
- Read and search your email messages
- Read full email threads
- Draft new emails (Claude writes them, you review before sending)
- List your email labels and folders
- View your Gmail profile information

### What Claude can't do
- Send emails without your approval — Claude creates drafts, you send them
- Delete emails
- Modify your Gmail settings

---

## Google Calendar

> **What you're doing:** Giving Claude access to your calendar so it can check your schedule and create events.
> **Why it matters:** This lets Claude tell you what's coming up, find free time for focused work, and schedule new events.

### How to connect
1. In the Connectors section, find **Google Calendar**
2. Click **Connect**
3. Sign in with your Google account and click **Allow**
4. You'll see Google Calendar listed as "Connected"

### What Claude can do with Calendar
- List your calendars
- View upcoming events
- Find available time slots
- Create new events
- Update existing events
- Respond to event invitations (accept, decline, tentative)
- Delete events (with your approval)
- Find meeting times that work across calendars

### What Claude can't do
- Accept invitations without asking you first
- Modify calendar settings or sharing permissions

---

## GitHub

> **What you're doing:** Connecting Claude to your GitHub account so it can work with your repos and issues.
> **Why it matters:** This lets Claude create issues, read code, manage pull requests, and help with development workflows.

### How to connect
1. In the Connectors section, find **GitHub**
2. Click **Connect**
3. You'll be redirected to GitHub to authorize the connection
4. Review the permissions and click **Authorize**
5. You'll see GitHub listed as "Connected"

**Technical note:** The GitHub connector uses a remote managed server (no local installation needed). Everything runs through Claude's secure connection.

### What Claude can do with GitHub
- List and search your repositories
- Read files and code in repos
- Create, read, and comment on issues
- Create and review pull requests
- Manage branches
- View commit history and diffs
- Search code across repos

### What Claude can't do
- Push code or merge PRs without your explicit approval
- Delete repositories
- Change repo settings or permissions

---

## Verifying everything works

After connecting all three, try these in a new Claude conversation:

**Gmail test:**
```
Summarize my 5 most recent unread emails.
```

**Calendar test:**
```
What's on my calendar for the rest of today?
```

**GitHub test:**
```
List my most recently updated GitHub repositories.
```

If any of these don't work:
- Go back to Settings → Connectors and check that each shows as "Connected"
- Try disconnecting and reconnecting the service
- Make sure you authorized with the correct account (especially if you have multiple Google accounts)

---

## Updating or disconnecting

If you ever need to change which account is connected or revoke access:

1. Go to **Settings → Connectors**
2. Find the service you want to change
3. Click **Disconnect**
4. Reconnect with a different account if needed

Disconnecting removes Claude's access immediately. You can always reconnect later.
