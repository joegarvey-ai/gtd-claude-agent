# Enterprise MCP Patterns

> **What this covers:** Connecting Claude Desktop or Kiro to corporate tools — email, Slack, internal search — via the Model Context Protocol. These patterns work on Windows (WSL) and Mac and assume your organization uses SSO, OAuth, or token-based auth.
>
> **Prerequisites:** A working GTD Claude Agent setup (vault + filesystem MCP). Familiarity with your company's authentication method.

---

## Why This Exists

The base GTD setup connects Claude to Obsidian (local files). That's enough for personal productivity. But if you work at a company with corporate email, internal wikis, Slack, and a project management tool, you want Claude to read and draft across all of those — with guardrails.

This doc covers four patterns:

1. **WSL MCP server** — Running a Linux MCP binary from Windows via WSL
2. **OAuth-based MCP with writes** — Corporate email/calendar with write capabilities
3. **Draft-mode Slack** — Read channels and DMs, but all outbound goes to a draft compose box
4. **Shared auth troubleshooting** — Cookie/credential sharing between Windows and WSL

---

## Pattern 1: WSL MCP Server

**When to use:** Your MCP server binary is only available as a Linux binary (common for internal corporate tools), but you're running Claude Desktop or Kiro on Windows.

### How it works

Claude Desktop/Kiro launches `wsl` as the MCP command, which shells into your WSL distro and executes the Linux binary. The MCP protocol runs over stdio — it doesn't care that it's crossing a WSL boundary.

### Configuration

In your MCP config (`.kiro/settings/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "internal-tools": {
      "command": "wsl",
      "args": [
        "-d", "[YOUR_WSL_DISTRO]",
        "--",
        "[PATH_TO_BINARY]"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace:
- `[YOUR_WSL_DISTRO]` — your WSL distribution name (e.g., `Ubuntu`, `Debian`)
- `[PATH_TO_BINARY]` — full Linux path to the MCP binary (e.g., `/home/user/.local/bin/my-mcp-server`)

### Pre-launch commands

If the binary needs setup before running (permissions, env vars, daemon checks), wrap it in bash:

```json
{
  "command": "wsl",
  "args": [
    "-d", "[YOUR_WSL_DISTRO]",
    "--",
    "bash", "-c",
    "chmod 600 ~/.auth/cookie 2>/dev/null; exec [PATH_TO_BINARY]"
  ]
}
```

This pattern is useful when:
- A cookie file needs exact permissions (600) before the binary reads it
- An auth daemon needs to be checked/started
- Environment variables need to be exported

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP server disconnects immediately | Check WSL is running: `wsl --list --verbose` — distro should be `Running` |
| "Command not found" | Verify the binary path exists inside WSL: `wsl -d [DISTRO] ls -la [PATH]` |
| Binary exits with auth error | Re-authenticate (see Pattern 4 below) |
| Timeout on first connection | Some binaries do a SAML/OAuth exchange on startup — increase timeout or pre-authenticate |

---

## Pattern 2: OAuth-Based MCP with Writes

**When to use:** Corporate email (Outlook, Gmail) or calendar where you want Claude to read AND draft/send — with explicit write enablement.

### How it works

The MCP server handles OAuth token exchange with your corporate identity provider. On first use, it opens a browser for SSO login. After that, tokens are cached and refreshed automatically.

### Configuration

```json
{
  "mcpServers": {
    "corporate-email": {
      "command": "wsl",
      "args": [
        "-d", "[YOUR_WSL_DISTRO]",
        "--",
        "[PATH_TO_EMAIL_MCP_BINARY]"
      ],
      "env": {
        "EMAIL_MCP_ENABLE_WRITES": "true"
      },
      "disabled": false,
      "autoApprove": [
        "email_inbox",
        "email_read",
        "email_search"
      ]
    }
  }
}
```

### Key decisions

**Which operations to auto-approve:**

Auto-approve read operations — these happen frequently and are low-risk:
- `email_inbox` — list inbox messages
- `email_read` — read a specific message
- `email_search` — search by query

Do NOT auto-approve write operations — keep human-in-the-loop for:
- `email_send` — actually sending email
- `email_reply` — replying to a thread
- `calendar_create` — booking meetings
- `calendar_delete` — removing events

This means Claude can freely read your inbox but always asks before sending.

**Enabling writes:**

Writes are opt-in via an environment variable. Without it, the MCP server operates in read-only mode. This is a safety net — if you remove the env var, all write operations will fail gracefully.

### First-use flow

1. Start Claude Desktop/Kiro with the MCP configured
2. Ask Claude something that triggers the email tool (e.g., "check my inbox")
3. A browser window opens for SSO — complete the login
4. Tokens are cached in your WSL home directory (typically `~/.config/[mcp-name]/`)
5. Subsequent sessions use cached tokens until they expire

---

## Pattern 3: Draft-Mode Slack

**When to use:** You want Claude to read Slack channels and DMs for context, but all outbound messages should be staged as drafts for manual review — never auto-posted.

### How it works

The Slack MCP server has an `ENFORCE_DRAFTS` mode. When enabled, any "send message" tool call doesn't actually post to Slack — it saves the content to your Slack compose box as a draft. You then manually review and send (or discard) from the Slack app.

### Configuration

```json
{
  "mcpServers": {
    "slack": {
      "command": "wsl",
      "args": [
        "-d", "[YOUR_WSL_DISTRO]",
        "--",
        "bash", "-c",
        "chmod 600 ~/.auth/cookie 2>/dev/null; exec [PATH_TO_SLACK_MCP_BINARY]"
      ],
      "env": {
        "ENFORCE_DRAFTS": "true"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Why drafts matter

Claude is good at composing messages but imperfect at tone, timing, and audience awareness. Draft mode means:
- Claude can draft a Slack reply based on full thread context
- You review the draft in Slack before it goes out
- No accidental messages to the wrong channel
- No accidental escalation of tone

**Do not set `autoApprove` for Slack tools** — even reads benefit from visibility so you know what context Claude is pulling from.

### Auth pattern

Most corporate Slack MCP servers authenticate via your corporate SSO cookie → SAML exchange → temporary Slack user token. The token is ephemeral and refreshes automatically. The cookie file often needs exact `600` permissions, which the `chmod` pre-launch command handles.

---

## Pattern 4: Shared Auth / Cookie Troubleshooting

**When to use:** Your MCP server authenticates via a cookie or credential file that's shared between Windows and WSL.

### The symlink pattern

If your auth tool writes credentials to a Windows path (e.g., `C:\Users\you\.auth\`) and your MCP binary reads from the Linux path (e.g., `/home/you/.auth/`), create a symlink inside WSL:

```bash
# Inside WSL
ln -sf /mnt/c/Users/[YOUR_USERNAME]/.auth ~/.auth
```

Now both Windows tools and Linux MCP binaries read/write the same credential file. Refreshing auth from either side updates both.

### Permission issues on Windows-backed files

WSL mounts Windows drives with metadata that controls Linux file permissions. Some auth tools require exact permissions (e.g., `chmod 600` on a cookie file). Without proper WSL mount options, permissions may reset on every access.

**Fix:** Add to `/etc/wsl.conf` inside your WSL distro:

```ini
[automount]
options = "metadata,umask=22,fmask=11"
```

Then restart WSL (`wsl --shutdown` from PowerShell). This preserves Linux-style permissions on Windows-mounted files.

### Common troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `AUTH_COOKIE_INVALID` | Cookie permissions too open | `chmod 600 ~/.auth/cookie` inside WSL |
| Auth works in Windows but not WSL | Symlink missing or broken | Recreate: `ln -sf /mnt/c/Users/you/.auth ~/.auth` |
| Auth expires every few hours | Token refresh not running | Re-run your auth tool from Windows (it writes to the shared path) |
| MCP works Monday, fails Tuesday | Weekend cookie expiry | Re-authenticate Monday morning before first MCP use |
| Binary works manually but not from Kiro/Claude | PATH not set in MCP config | Add explicit PATH to the `env` block in your MCP config |

### Auth refresh pattern

Many corporate auth tools have a CLI command to refresh credentials (e.g., `auth-refresh --force`). Run this:
- From Windows PowerShell (preferred — no VPN requirement on some tools)
- Before your first MCP interaction of the day
- Whenever you see auth errors in Claude/Kiro

Because of the symlink, running refresh from Windows updates the credential for both Windows and WSL simultaneously.

---

## Putting It All Together

A full corporate setup might have 4 MCP servers:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "[NODE_PATH]/npx.cmd",
      "args": ["-y", "obsidian-mcp", "[VAULT_PATH]"],
      "env": {
        "PATH": "[NODE_PATH];[SYSTEM_PATH]"
      },
      "autoApprove": ["list-available-vaults", "search-vault", "create-directory", "create-note"]
    },
    "internal-tools": {
      "command": "wsl",
      "args": ["-d", "[DISTRO]", "--", "[INTERNAL_MCP_PATH]"],
      "autoApprove": ["search", "read_wiki", "list_tasks"]
    },
    "corporate-email": {
      "command": "wsl",
      "args": ["-d", "[DISTRO]", "--", "[EMAIL_MCP_PATH]"],
      "env": { "EMAIL_MCP_ENABLE_WRITES": "true" },
      "autoApprove": ["email_inbox", "email_read", "email_search"]
    },
    "slack": {
      "command": "wsl",
      "args": ["-d", "[DISTRO]", "--", "bash", "-c", "chmod 600 ~/.auth/cookie 2>/dev/null; exec [SLACK_MCP_PATH]"],
      "env": { "ENFORCE_DRAFTS": "true" },
      "autoApprove": []
    }
  }
}
```

### Layered trust model

| Layer | Trust Level | Examples |
|-------|-------------|---------|
| Auto-approve reads | High trust — frequent, low-risk | Listing inbox, searching wiki, listing tasks |
| Prompt before writes | Medium trust — human reviews | Sending email, creating events, updating task status |
| Draft mode | Low trust — human executes | Slack messages, public posts, anything visible to others |
| Never auto-approve | Requires explicit confirmation | Deleting things, modifying permissions, sending to large audiences |

This graduated approach means Claude can gather context freely (reads) while you maintain control over anything that leaves your machine (writes).
