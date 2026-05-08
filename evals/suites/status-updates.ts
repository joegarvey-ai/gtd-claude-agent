import { EvalCase, runSuite, printSuiteResult, loadFixture } from "../lib/runner.js";

const taskData = loadFixture("task-data-status.md");

const STATUS_PROMPT = `You are a weekly status update assistant. Given task data, draft status updates for each task.

Rules:
- Date prefix in M/D format (e.g., 5/7)
- Use '-' bullets only
- FULL NAMES of people, never @handles
- Plain text, no em dashes
- Risks/Dependencies section only when blockers exist
- For closed tasks in last 7 days, include CLOSED
- For tasks with NO CONTEXT (no comments, no activity), flag with [!] NO CONTEXT — do NOT fabricate status
- Prepend new content to existing updates (newest on top)

Today's date: 2026-05-07`;

const cases: EvalCase[] = [
  {
    name: "Drafts update for active task with context (blog migration)",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "contains",
        value: "PROJ-142",
        description: "References the task ID",
      },
      {
        type: "contains",
        value: "Priya",
        description: "Uses full name (Priya) from comments",
      },
      {
        type: "matches",
        value: "5\\/7|5/7",
        description: "Uses M/D date format",
      },
      {
        type: "matches",
        value: "redirect|ambiguous|cut.over|June",
        description: "Includes substantive progress detail from comments",
      },
    ],
  },
  {
    name: "Flags task with no context",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "contains",
        value: "PROJ-160",
        description: "References the no-context task (API redesign review)",
      },
      {
        type: "matches",
        value: "NO CONTEXT|no context|\\[!\\]|unknown|no activity",
        description: "Flags the task as having no context rather than fabricating",
      },
    ],
  },
  {
    name: "Does NOT fabricate status for unknown task",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft a status update specifically for PROJ-160 (API redesign architecture review). Here's the task data:\n\n${taskData}`,
    assertions: [
      {
        type: "not_contains",
        value: "completed",
        description: "Does not claim task is completed",
      },
      {
        type: "not_contains",
        value: "in progress on",
        description: "Does not fabricate specific progress",
      },
      {
        type: "matches",
        value: "no context|no recent|no activity|no comment|unable to determine|\\[!\\]",
        description: "Acknowledges lack of information",
      },
    ],
  },
  {
    name: "Marks closed task correctly",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "contains",
        value: "PROJ-139",
        description: "References the closed task",
      },
      {
        type: "matches",
        value: "CLOSED|closed|completed|published",
        description: "Marks it as closed/completed",
      },
    ],
  },
  {
    name: "Includes risks/dependencies for blocked task",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "contains",
        value: "PROJ-148",
        description: "References the blocked task (staging DNS)",
      },
      {
        type: "matches",
        value: "Risk|Dependenc|block|DevOps|DNS",
        description: "Includes risk/dependency information for blocked task",
      },
    ],
  },
  {
    name: "Uses dash bullets, not asterisks or numbers",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "matches",
        value: "^- |\\n- ",
        description: "Uses dash bullets",
      },
      {
        type: "not_contains",
        value: "* ",
        description: "Does not use asterisk bullets",
      },
    ],
  },
  {
    name: "Never uses @handle format",
    systemPromptOverride: STATUS_PROMPT,
    userMessage: `Draft status updates for today based on this task data:\n\n${taskData}`,
    assertions: [
      {
        type: "not_contains",
        value: "@alex",
        description: "Does not use @alexchen handle",
      },
      {
        type: "not_contains",
        value: "@priya",
        description: "Does not use @priya handle",
      },
      {
        type: "contains",
        value: "Alex Chen",
        description: "Uses full name Alex Chen",
      },
    ],
  },
];

async function main() {
  console.log("\n📊 Status Updates Eval Suite\n");
  const result = await runSuite("Status Updates", cases);
  printSuiteResult(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

main();
