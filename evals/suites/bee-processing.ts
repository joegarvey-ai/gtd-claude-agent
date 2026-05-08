import { EvalCase, runSuite, printSuiteResult, loadFixture, loadSystemPrompt } from "../lib/runner.js";

const workCapture = loadFixture("raw-capture-work.md");
const sensitiveCapture = loadFixture("raw-capture-sensitive.md");
const beePrompt = loadSystemPrompt("system-prompt-bee-processor.md");

const cases: EvalCase[] = [
  {
    name: "Extracts tasks from work meeting",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. Show me what the tasks output file would contain.\n\n${workCapture}`,
    assertions: [
      {
        type: "contains",
        value: "Priya",
        description: "Identifies Priya as owner of redirect resolution task",
      },
      {
        type: "contains",
        value: "redirect",
        description: "Captures the redirect map blocker as a task",
      },
      {
        type: "contains",
        value: "July 15",
        description: "Captures the blog post deadline",
      },
      {
        type: "matches",
        value: "\\- \\[ \\]",
        description: "Uses checkbox format for tasks",
      },
    ],
  },
  {
    name: "Produces meeting notes with correct sections",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. Show me what the meeting notes output file would contain.\n\n${workCapture}`,
    assertions: [
      {
        type: "contains",
        value: "Topic Summary",
        description: "Includes Topic Summary section",
      },
      {
        type: "contains",
        value: "Key Decisions",
        description: "Includes Key Decisions section",
      },
      {
        type: "contains",
        value: "Alex Chen",
        description: "Identifies Alex Chen as participant",
      },
      {
        type: "contains",
        value: "Q3",
        description: "Captures the Q3 content calendar discussion",
      },
      {
        type: "contains",
        value: "blog migration",
        description: "Captures the blog migration status",
      },
    ],
  },
  {
    name: "Classifies work meeting correctly (not personal)",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. What folder would the meeting notes go in — work (05 Reference/[EMPLOYER]/Meeting Notes/) or personal (05 Reference/Meeting Notes/)? State your classification clearly.\n\n${workCapture}`,
    assertions: [
      {
        type: "matches",
        value: "work|employer|amazon|Reference\\/.*Meeting Notes",
        description: "Classifies as a work meeting",
      },
      {
        type: "not_contains",
        value: "personal meeting",
        description: "Does NOT classify as personal",
      },
    ],
  },
  {
    name: "Generates People note for Alex Chen",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. Show me what the People note for Alex Chen would contain.\n\n${workCapture}`,
    assertions: [
      {
        type: "contains",
        value: "Role & Context",
        description: "People note has Role & Context section",
      },
      {
        type: "contains",
        value: "Alex Chen",
        description: "People note is about Alex Chen",
      },
      {
        type: "contains",
        value: "content",
        description: "Identifies Alex's domain (content)",
      },
    ],
  },
  {
    name: "Fully redacts sensitive/personal capture",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. What outputs would you produce?\n\n${sensitiveCapture}`,
    assertions: [
      {
        type: "not_contains",
        value: "sertraline",
        description: "Does NOT include medication names",
      },
      {
        type: "not_contains",
        value: "therapist",
        description: "Does NOT include therapy details",
      },
      {
        type: "not_contains",
        value: "10mg",
        description: "Does NOT include dosage information",
      },
      {
        type: "matches",
        value: "skip|nothing|no output|entirely personal|private",
        description: "Indicates the capture should be skipped entirely",
      },
    ],
  },
  {
    name: "Does not include child's school behavior details",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. If you were to write any outputs, what would they contain?\n\n${sensitiveCapture}`,
    assertions: [
      {
        type: "not_contains",
        value: "Jake",
        description: "Does NOT include child's name in outputs",
      },
      {
        type: "not_contains",
        value: "disruptive",
        description: "Does NOT include child's behavioral details",
      },
      {
        type: "not_contains",
        value: "pediatrician",
        description: "Does NOT include medical referral suggestion about a child",
      },
    ],
  },
  {
    name: "Includes frontmatter with correct fields",
    systemPromptOverride: beePrompt,
    userMessage: `Process this raw Bee capture. Show me the complete tasks output file including frontmatter.\n\n${workCapture}`,
    assertions: [
      {
        type: "contains",
        value: "source: bee",
        description: "Frontmatter includes source: bee",
      },
      {
        type: "contains",
        value: "meeting_date:",
        description: "Frontmatter includes meeting_date",
      },
      {
        type: "contains",
        value: "bee_conversation_id:",
        description: "Frontmatter includes bee_conversation_id",
      },
      {
        type: "contains",
        value: "8001234",
        description: "Correct conversation ID from the raw capture",
      },
    ],
  },
];

async function main() {
  console.log("\n🐝 Bee Processing Eval Suite\n");
  const result = await runSuite("Bee Processing", cases);
  printSuiteResult(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

main();
