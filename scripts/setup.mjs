#!/usr/bin/env node

/**
 * Personal Assistant Kit — Interactive Setup
 *
 * Generates all configuration files by asking a few questions.
 * Run: node scripts/setup.mjs
 */

import { createInterface } from "readline";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { homedir, platform } from "os";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const ROOT = resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "..");
const isMac = platform() === "darwin";
const isWindows = platform() === "win32";

console.log("");
console.log("╔══════════════════════════════════════════════╗");
console.log("║     Personal Assistant Kit — Setup Wizard    ║");
console.log("╚══════════════════════════════════════════════╝");
console.log("");
console.log("This will generate your configuration files.");
console.log("You can re-run this anytime to update settings.");
console.log("");

// --- Gather info ---

const name = await ask("Your first name: ");
const fullName = await ask("Your full name (for People note): ");

console.log("");
console.log("Where is your Obsidian vault?");
if (isMac) {
  console.log("  Typical iCloud path: ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/VaultName");
}
if (isWindows) {
  console.log("  Typical iCloud path: C:\\Users\\you\\iCloudDrive\\iCloud~md~obsidian");
  console.log("  Typical local path:  C:\\Users\\you\\Documents\\ObsidianVault");
}
const vaultPath = await ask("Vault path: ");

console.log("");
console.log("What AI client are you using?");
console.log("  1. Claude Desktop");
console.log("  2. Kiro");
console.log("  3. Both");
const clientChoice = await ask("Choice (1/2/3): ");

let employer = "";
console.log("");
const hasEmployer = await ask("Do you want a separate work meeting notes folder? (y/n): ");
if (hasEmployer.toLowerCase() === "y") {
  employer = await ask("Employer/org name (used in folder path): ");
}

console.log("");
const hasBee = await ask("Do you use a Bee wearable? (y/n): ");

console.log("");
console.log("─────────────────────────────────────────");
console.log("Generating configuration...");
console.log("");

// --- Generate system prompt ---

let systemPrompt = readFileSync(resolve(ROOT, "system-prompt.md"), "utf-8");
systemPrompt = systemPrompt.replace(/\[YOUR_NAME\]/g, name);
systemPrompt = systemPrompt.replace(/\[VAULT_PATH\]/g, vaultPath);

const systemPromptPath = resolve(ROOT, "system-prompt.generated.md");
writeFileSync(systemPromptPath, systemPrompt);
console.log(`✓ System prompt → system-prompt.generated.md`);

// --- Generate Bee processor prompt (if using Bee) ---

if (hasBee.toLowerCase() === "y") {
  let beePrompt = readFileSync(resolve(ROOT, "system-prompt-bee-processor.md"), "utf-8");
  beePrompt = beePrompt.replace(/\[YOUR_NAME\]/g, name);
  beePrompt = beePrompt.replace(/\[VAULT_PATH\]/g, vaultPath);

  const beePromptPath = resolve(ROOT, "system-prompt-bee-processor.generated.md");
  writeFileSync(beePromptPath, beePrompt);
  console.log(`✓ Bee processor prompt → system-prompt-bee-processor.generated.md`);
}

// --- Generate Claude Desktop config ---

if (clientChoice === "1" || clientChoice === "3") {
  const escapedVault = isWindows
    ? vaultPath.replace(/\\/g, "\\\\")
    : vaultPath;

  const npxCmd = isWindows ? "C:\\\\Program Files\\\\nodejs\\\\npx.cmd" : "npx";
  const npxArgs = isWindows
    ? `["-y", "obsidian-mcp", "${escapedVault}"]`
    : `["-y", "obsidian-mcp", "${escapedVault}"]`;

  const config = {
    mcpServers: {
      obsidian: {
        command: npxCmd,
        args: JSON.parse(npxArgs),
        ...(isWindows && {
          env: {
            PATH: "C:\\Program Files\\nodejs;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0;C:\\WINDOWS\\System32;%PATH%",
          },
        }),
        disabled: false,
        autoApprove: ["list-available-vaults", "search-vault"],
      },
    },
  };

  const configPath = resolve(ROOT, "claude_desktop_config.generated.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✓ Claude Desktop config → claude_desktop_config.generated.json`);

  // Tell them where to put it
  console.log("");
  if (isMac) {
    console.log("  Copy this file to: ~/Library/Application Support/Claude/claude_desktop_config.json");
  } else if (isWindows) {
    console.log("  Copy this file to: %APPDATA%\\Claude\\claude_desktop_config.json");
    console.log("  Or use Claude Desktop → Settings → Developer → Edit Config");
  }
}

// --- Generate Kiro MCP config ---

if (clientChoice === "2" || clientChoice === "3") {
  const kiroDir = resolve(ROOT, ".kiro/settings");
  if (!existsSync(kiroDir)) mkdirSync(kiroDir, { recursive: true });

  const kiroConfig = {
    mcpServers: {
      obsidian: {
        command: isWindows ? "C:\\Program Files\\nodejs\\npx.cmd" : "npx",
        args: ["-y", "obsidian-mcp", vaultPath],
        ...(isWindows && {
          env: {
            PATH: "C:\\Program Files\\nodejs;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0;C:\\WINDOWS\\System32;%PATH%",
          },
        }),
        disabled: false,
        autoApprove: ["list-available-vaults", "search-vault", "create-directory", "create-note"],
      },
    },
  };

  const kiroConfigPath = resolve(kiroDir, "mcp.json");
  writeFileSync(kiroConfigPath, JSON.stringify(kiroConfig, null, 2));
  console.log(`✓ Kiro MCP config → .kiro/settings/mcp.json`);
}

// --- Generate Kiro steering (gtd-assistant) ---

if (clientChoice === "2" || clientChoice === "3") {
  const steeringDir = resolve(ROOT, ".kiro/steering");
  if (!existsSync(steeringDir)) mkdirSync(steeringDir, { recursive: true });

  const emailType = employer ? "corporate email (Outlook/Gmail)" : "Gmail";
  const meetingNotesPath = employer
    ? `05 Reference/${employer}/Meeting Notes/`
    : "05 Reference/Meeting Notes/";

  const steering = `---
inclusion: auto
---

## Identity

You are **${name}**'s Personal Assistant.

Your goal is to reduce cognitive load and help execute on what matters. You are direct, action-oriented, and organized around GTD (Getting Things Done) principles.

You have access to the following tools via MCP:
- **Obsidian** — Read and write notes in the GTD vault

---

## Obsidian Vault Structure

The Obsidian vault is located at:
\`\`\`
${vaultPath}
\`\`\`

The vault is organized into these folders:

| Folder | Purpose |
|--------|---------|
| \`00 Inbox/\` | Raw captures — thoughts, tasks, links, ideas. Entry point for everything. |
| \`01 Next Actions/Deep Work/\` | Tasks requiring 30+ minutes of focused effort |
| \`01 Next Actions/Quick Wins/\` | Tasks completable in under 30 minutes |
| \`02 Personal Projects/\` | Multi-step efforts with a defined outcome |
| \`03 Family & Personal Planning/\` | Household logistics, family coordination |
| \`04 Someday Maybe/\` | Ideas and possibilities — not active, not forgotten |
| \`05 Reference/\` | Information to keep but not act on |
| \`06 Waiting For/\` | Things waiting on someone else. Include who and when. |
| \`People/\` | Notes on key people |
| \`00 Inbox/Bee/\` | Auto-generated task files from Bee captures |
| \`05 Reference/Bee/_raw/\` | Immutable raw Bee captures. **Never read or edit from here.** |
| \`${meetingNotesPath}\` | Cleaned meeting summaries from Bee captures |

---

## Communication Style

- **Be direct and concise.** Lead with the answer or action.
- **Default to action over discussion.** If something can be done, suggest doing it.
- **Challenge vague requests.** Ask: "What's the next physical action here?"
- **Propose, don't assume.** For anything that sends, posts, or deletes — show first, then ask.
`;

  const steeringPath = resolve(steeringDir, "gtd-assistant.md");
  writeFileSync(steeringPath, steering);
  console.log(`✓ Kiro GTD steering → .kiro/steering/gtd-assistant.md`);
}

// --- Generate vault folders (if they don't exist) ---

console.log("");
const createFolders = await ask("Create GTD folders in your vault if they don't exist? (y/n): ");
if (createFolders.toLowerCase() === "y") {
  const folders = [
    "00 Inbox",
    "00 Inbox/Bee",
    "01 Next Actions/Deep Work",
    "01 Next Actions/Quick Wins",
    "02 Personal Projects",
    "03 Family & Personal Planning",
    "04 Someday Maybe",
    "05 Reference",
    "05 Reference/Bee/_raw",
    "05 Reference/Meeting Notes",
    "06 Waiting For",
    "People",
  ];

  if (employer) {
    folders.push(`05 Reference/${employer}`);
    folders.push(`05 Reference/${employer}/Meeting Notes`);
  }

  let created = 0;
  for (const folder of folders) {
    const fullPath = join(vaultPath, folder);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      created++;
    }
  }
  console.log(`✓ Vault folders: ${created} created, ${folders.length - created} already existed`);
}

// --- Create user's People note ---

const peoplePath = join(vaultPath, "People", `${fullName}.md`);
if (!existsSync(peoplePath)) {
  const peopleNote = `---
source: manual
created: ${new Date().toISOString()}
last_updated: ${new Date().toISOString()}
---

# ${fullName}

## Role & Context
<!-- Your role, responsibilities, and what you're working on -->

## Communication Style
<!-- How you prefer to communicate — what works, what doesn't -->

## Decision-Making Pattern
<!-- How you make decisions — data-driven, intuitive, consensus-seeking -->

## Observed Patterns
<!-- Patterns surfaced from Bee captures over time -->
`;

  writeFileSync(peoplePath, peopleNote);
  console.log(`✓ People note → People/${fullName}.md`);
} else {
  console.log(`  People/${fullName}.md already exists — skipped`);
}

// --- Done ---

console.log("");
console.log("═══════════════════════════════════════════");
console.log("  Setup complete!");
console.log("");
console.log("  Next steps:");
if (clientChoice === "1" || clientChoice === "3") {
  console.log("  1. Copy claude_desktop_config.generated.json to your Claude Desktop config location");
  console.log("  2. Paste system-prompt.generated.md into Claude Desktop → Project → Custom Instructions");
}
if (clientChoice === "2" || clientChoice === "3") {
  console.log("  1. Open this folder in Kiro — it will use .kiro/settings/mcp.json automatically");
}
console.log("  3. Say \"process my inbox\" to test the connection");
console.log("");
console.log("  Docs: README.md | Troubleshooting: TROUBLESHOOTING.md");
console.log("═══════════════════════════════════════════");
console.log("");

rl.close();
