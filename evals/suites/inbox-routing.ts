import { EvalCase, runSuite, printSuiteResult, loadFixture } from "../lib/runner.js";

const inboxItems = loadFixture("inbox-items.md");

const ROUTING_PROMPT = `You are evaluating inbox items for a GTD (Getting Things Done) system.

For each item, respond with ONLY a JSON array. Each element should have:
- "item": the filename
- "route": one of "01 Next Actions/Quick Wins", "01 Next Actions/Deep Work", "02 Personal Projects", "03 Family & Personal Planning", "04 Someday Maybe", "05 Reference", "06 Waiting For"
- "reasoning": one sentence explaining why

Do not include any other text outside the JSON array.`;

const cases: EvalCase[] = [
  {
    name: "Routes quick task to Quick Wins",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Buy replacement HEPA filter for the Dyson — the indicator light is red"`,
    assertions: [
      {
        type: "contains",
        value: "Quick Wins",
        description: "Simple purchase task routes to Quick Wins",
      },
    ],
  },
  {
    name: "Routes deep work task to Deep Work",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Write the architecture doc for the new notification system. Need to cover event schema design, delivery guarantees, retry/backoff strategy, multi-channel routing. This will take a few hours of focused thinking."`,
    assertions: [
      {
        type: "contains",
        value: "Deep Work",
        description: "Multi-hour focused task routes to Deep Work",
      },
    ],
  },
  {
    name: "Routes multi-step effort to Projects",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Kitchen renovation planning — need to get quotes from 3 contractors, decide on countertop material, figure out timeline, set a budget. Ask Sarah's contractor for contact."`,
    assertions: [
      {
        type: "contains",
        value: "Project",
        description: "Multi-step effort with defined outcome routes to Projects",
      },
    ],
  },
  {
    name: "Routes someday-maybe correctly",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Learn woodworking — maybe take a weekend class? Saw a cool dovetail jig on YouTube. Not urgent, just sounds fun."`,
    assertions: [
      {
        type: "contains",
        value: "Someday",
        description: "Non-urgent interest with no commitment routes to Someday Maybe",
      },
    ],
  },
  {
    name: "Routes reference material correctly",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Good article on distributed systems: reading notes on partitioning strategies, LSM trees vs B-trees, vector clocks. Save for when working on the storage layer."`,
    assertions: [
      {
        type: "contains",
        value: "Reference",
        description: "Non-actionable information to keep routes to Reference",
      },
    ],
  },
  {
    name: "Routes waiting-for correctly",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Waiting on Marcus to send the finalized contract by Friday. He said he'd have legal review it by Wednesday. If no response by end of day Friday, ping him on Slack."`,
    assertions: [
      {
        type: "contains",
        value: "Waiting",
        description: "Blocked on someone else routes to Waiting For",
      },
    ],
  },
  {
    name: "Routes family/personal planning correctly",
    systemPromptFile: "system-prompt.md",
    userMessage: `Process this inbox item and tell me where it should go. Reply with the folder path only.\n\nItem: "Summer camp registration opens March 1st. Options for the kids: YMCA day camp ($300/week), Science museum camp ($450/week), Swimming intensive ($200/week). Need to decide by February 15th for early bird pricing."`,
    assertions: [
      {
        type: "contains",
        value: "Family",
        description: "Kids/family logistics routes to Family & Personal Planning",
      },
    ],
  },
  {
    name: "Batch routing produces correct structure",
    systemPromptOverride: ROUTING_PROMPT,
    userMessage: `Route all of the following inbox items:\n\n${inboxItems}`,
    assertions: [
      {
        type: "contains",
        value: "quick-task",
        description: "Batch response references all items",
      },
      {
        type: "contains",
        value: "waiting-for",
        description: "Batch response includes waiting-for item",
      },
      {
        type: "not_contains",
        value: "delete",
        description: "No items are suggested for deletion",
      },
    ],
  },
];

async function main() {
  console.log("\n🗂️  Inbox Routing Eval Suite\n");
  const result = await runSuite("Inbox Routing", cases);
  printSuiteResult(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

main();
