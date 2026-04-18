# Google Drive Setup

This guide walks you through connecting Claude to your Google Drive. It involves creating a small "app" in Google's system that gives Claude permission to read and write your documents.

**Don't worry** — this isn't a real app that other people will use. It's a personal connection just for you. Google requires this process for security reasons, and you only need to do it once.

---

## Phase 1: Create a Google Cloud Project

> **What you're doing:** Creating a container in Google's system to hold your connection settings.
> **Why it matters:** Google organizes everything into "projects." You need one to set up the Drive connection.

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Sign in with the Google account you want Claude to access
3. At the top of the page, click the project dropdown (it might say "Select a project" or show an existing project name)
4. Click **New Project**
5. Name it something like `Claude Assistant` or `Personal MCP`
6. Leave the organization and location fields as they are
7. Click **Create**
8. Wait a moment, then make sure your new project is selected in the dropdown at the top

---

## Phase 2: Enable the Google Drive API

> **What you're doing:** Turning on Google Drive access for your project.
> **Why it matters:** Google keeps all its services turned off by default. You need to explicitly enable the ones you want to use.

1. In the Google Cloud Console, click the hamburger menu (three horizontal lines) in the top left
2. Go to **APIs & Services → Library**
3. Search for **Google Drive API**
4. Click on it, then click **Enable**
5. Also search for and enable **Google Docs API** and **Google Sheets API** (these let Claude work with documents and spreadsheets)

---

## Phase 3: Configure the OAuth Consent Screen

> **What you're doing:** Telling Google what your "app" is and who can use it.
> **Why it matters:** This is Google asking "What app is trying to access your Drive?" You're creating a personal app just for yourself. It's a security step — Google wants to know that *you* authorized this access.

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**
2. Click **Get started** or **Configure consent screen**
3. For **App name**, enter something like `Claude Personal Assistant`
4. For **User support email**, select your email
5. For **Developer contact information**, enter your email again
6. Click **Save and Continue**
7. On the **Scopes** screen, click **Add or Remove Scopes**
8. Search for and add these scopes:
   - `Google Drive API` — `.../auth/drive` (full Drive access)
   - `Google Docs API` — `.../auth/documents` (read/write documents)
   - `Google Sheets API` — `.../auth/spreadsheets` (read/write spreadsheets)
9. Click **Update**, then **Save and Continue**
10. On the **Test users** screen, click **Add Users** and add your own email address
11. Click **Save and Continue**, then **Back to Dashboard**

**Important:** Your app will be in "Testing" mode. This is fine — it means only the email addresses you added as test users (yours) can use it. You don't need to publish it.

---

## Phase 4: Create OAuth 2.0 Credentials

> **What you're doing:** Generating the Client ID and Client Secret — two pieces of text that identify your connection.
> **Why it matters:** These are like a username and password for the connection between Claude and Google. You'll paste them into your config file.

1. In the left sidebar, go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. For **Application type**, select **Desktop app**
4. For **Name**, enter `Claude Desktop` or anything you'll recognize
5. Click **Create**
6. A popup will show your **Client ID** and **Client Secret**
7. **Copy both of these and save them somewhere safe** (a note, a password manager, etc.)
8. Click **OK**

Your Client ID looks something like: `123456789-abcdef.apps.googleusercontent.com`
Your Client Secret looks something like: `GOCSPX-abcdefghijk`

---

## Phase 5: Add credentials to your config file

> **What you're doing:** Putting your credentials into Claude Desktop's configuration so it can connect to Drive.
> **Why it matters:** This is the final step that links everything together.

1. Open your `claude_desktop_config.json` file — pick your OS: [SETUP-MAC.md](../SETUP-MAC.md) or [SETUP-WINDOWS.md](../SETUP-WINDOWS.md) for how to find it
2. Find the `google-docs` section
3. Replace `[YOUR_GOOGLE_CLIENT_ID]` with your actual Client ID
4. Replace `[YOUR_GOOGLE_CLIENT_SECRET]` with your actual Client Secret

It should look like this (with your real values):

```json
"google-docs": {
  "command": "npx",
  "args": [
    "-y",
    "@a-bonus/google-docs-mcp"
  ],
  "env": {
    "GOOGLE_CLIENT_ID": "123456789-abcdef.apps.googleusercontent.com",
    "GOOGLE_CLIENT_SECRET": "GOCSPX-abcdefghijk"
  }
}
```

5. Save the file
6. **Restart Claude Desktop**

The first time Claude tries to access Google Drive, a browser window will open asking you to sign in and grant permission. This is the one-time authorization step. Click through and allow access.

---

## Troubleshooting

### "Access token expired" or Claude can't reach Drive

Google's testing mode tokens expire after **7 days**. When this happens:

1. Delete the `token.json` file if one was created in your home directory or the MCP server's directory
2. Restart Claude Desktop
3. Claude will prompt you to re-authorize — sign in again in the browser

This is a known limitation of Google's testing mode. If you find it annoying, you can publish your app (move it out of testing mode), but that requires a review process from Google. For most people, re-authorizing once a week is simpler.

### "This app isn't verified" warning

When authorizing for the first time, Google may show a scary-looking warning saying the app isn't verified. This is expected — your personal app hasn't gone through Google's review process, and it doesn't need to.

1. Click **Advanced**
2. Click **Go to [your app name] (unsafe)** — it's not actually unsafe, it's your own app
3. Click **Allow** to grant the permissions

### Claude says it can't find the Google Drive tools

- Make sure you've restarted Claude Desktop after editing the config file
- Check that the `google-docs` section in your config file has no typos
- Make sure Node.js is installed (run `node --version` in Terminal)
