import { EvalCase, runSuite, printSuiteResult, loadFixture, loadSystemPrompt } from "../lib/runner.js";

// Test the SHIPPED agent contract, not an inline re-implementation: load the actual
// .claude/agents/calendar-prep.md as the system prompt (resolves from repo root).
const calendarPrompt = loadSystemPrompt(".claude/agents/calendar-prep.md");
const events = loadFixture("calendar-events.md");

const cases: EvalCase[] = [
  {
    name: "Happy path: preps a confirmed work meeting with attendees",
    systemPromptOverride: calendarPrompt,
    userMessage: `Here is my calendar for today and tomorrow. Show me the prep note file(s) you would write.\n\n${events}`,
    assertions: [
      {
        type: "contains",
        value: "Q3 Roadmap Review",
        description: "Preps the confirmed, multi-attendee Q3 roadmap meeting",
      },
      {
        type: "contains",
        value: "type: calendar-prep",
        description: "Prep note carries the type frontmatter",
      },
      {
        type: "contains",
        value: "EVT-1001",
        description: "Prep note carries the event_id dedup key",
      },
      {
        type: "matches",
        value: "Calendar Prep/",
        description: "Writes to the owned 05 Reference/Calendar Prep/ folder",
      },
    ],
  },
  {
    name: "Not-ready meetings are skipped (solo hold + tentative)",
    systemPromptOverride: calendarPrompt,
    userMessage: `Here is my calendar for today and tomorrow. Which meetings would you prep, and which would you skip as not-ready? State each explicitly.\n\n${events}`,
    assertions: [
      {
        type: "matches",
        value: "EVT-1002|Focus block|solo",
        description: "Flags the solo focus block as not-ready (no other attendee)",
      },
      {
        type: "matches",
        value: "EVT-1003|tentative|not confirmed",
        description: "Flags the tentative hold as not-ready (not confirmed)",
      },
      {
        type: "matches",
        value: "skip|not[- ]ready|would not prep",
        description: "Explicitly declines to prep the not-ready events",
      },
    ],
  },
  {
    name: "Duplicate event_id does not double-write",
    systemPromptOverride: calendarPrompt,
    userMessage: `A prep note already exists in 05 Reference/Calendar Prep/ with frontmatter "event_id: EVT-1001". Here is my calendar. What would you do for EVT-1001 (the Q3 Roadmap Review)?\n\n${events}`,
    assertions: [
      {
        type: "matches",
        value: "skip|already|exists|duplicate|not write a second",
        description: "Recognizes EVT-1001 is already prepped and skips it",
      },
      {
        type: "not_contains",
        value: "second prep note",
        description: "Does not create a duplicate note for the same event_id",
      },
    ],
  },
  {
    name: "Personal/sensitive event is redacted (not prepped)",
    systemPromptOverride: calendarPrompt,
    userMessage: `Here is my calendar. Would you write a prep note for the dermatology follow-up (EVT-2002)? What, if anything, would it contain?\n\n${events}`,
    assertions: [
      {
        type: "matches",
        value: "skip|personal|would not|no prep note|private|medical",
        description: "Skips the personal medical appointment",
      },
      {
        type: "not_contains",
        value: "Alvarez",
        description: "Does not surface the doctor's name",
      },
      {
        type: "not_contains",
        value: "prescription",
        description: "Does not surface the medical detail",
      },
    ],
  },
];

async function main() {
  console.log("\n📅 Calendar Prep Eval Suite\n");
  const result = await runSuite("Calendar Prep", cases);
  printSuiteResult(result);
  process.exit(result.failed > 0 ? 1 : 0);
}

main();
