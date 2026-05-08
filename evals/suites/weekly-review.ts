import { EvalCase, runSuite, printSuiteResult, loadFixture } from "../lib/runner.js";

const vaultState = loadFixture("vault-state-weekly-review.md");

const cases: EvalCase[] = [
  {
    name: "Flags stale waiting-for (Marcus contract, 17 days old)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "contains",
        value: "Marcus",
        description: "Flags Marcus contract as stale (17 days, was due April 25)",
      },
      {
        type: "matches",
        value: "stale|overdue|past due|no update|follow up",
        description: "Identifies it as needing attention",
      },
    ],
  },
  {
    name: "Identifies project without next action (blog migration)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "contains",
        value: "blog migration",
        description: "Flags blog migration project",
      },
      {
        type: "matches",
        value: "no next action|missing.*next action|needs.*next action|no.*action listed",
        description: "Identifies that it lacks a defined next action",
      },
    ],
  },
  {
    name: "Identifies project without next action (home office)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "contains",
        value: "home office",
        description: "Flags home office project",
      },
      {
        type: "matches",
        value: "no next action|missing.*next action|needs.*next action|no.*action listed",
        description: "Identifies that it lacks a defined next action",
      },
    ],
  },
  {
    name: "Catches unresolved meeting commitment (blog post draft)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "matches",
        value: "blog post|first post|environment setup|July 15",
        description: "Catches the commitment to write blog post 1 by July 15",
      },
    ],
  },
  {
    name: "Catches unresolved meeting commitment (all-hands presentation)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "matches",
        value: "all.hands|present.*API|May 20",
        description: "Catches the commitment to present API redesign at all-hands May 20",
      },
    ],
  },
  {
    name: "Suggests activating someday-maybe item when relevant",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "matches",
        value: "saas|onboarding checklist|side.project",
        description: "Notes the SaaS idea is relevant given the Q3 content work",
      },
    ],
  },
  {
    name: "Does NOT flag healthy project (API redesign has next action)",
    systemPromptFile: "system-prompt.md",
    userMessage: "Run a weekly review. Check which active projects have next actions defined and which don't. Here's the current vault state.",
    context: vaultState,
    assertions: [
      {
        type: "contains",
        value: "api redesign",
        description: "Mentions API redesign project",
      },
      {
        type: "matches",
        value: "has.*next action|next action.*defined|schedule.*review|architecture review",
        description: "Recognizes it already has a next action (schedule architecture review)",
      },
    ],
  },
];

async function main() {
  console.log("\n📋 Weekly Review Eval Suite\n");
  const result = await runSuite("Weekly Review", cases);
  printSuiteResult(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

main();
