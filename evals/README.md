# Evals

> **Offline test harness — you run it, nothing runs it for you.** These call the Claude API with synthetic fixtures (no live MCP, no real vault) and are **not** wired into CI, so they don't gate commits or the shipped prompts today. Two caveats worth knowing: (1) some suites test prompt text inline rather than importing the exact shipped `system-prompt.md`/steering, and (2) the suites check the model's prose *about* an action — they don't exercise real tool use or the propose/confirm/write loop. Making these a real gate (CI against the shipped artifacts; a tool-use case) is planned — see CLAUDE.md, "Runtime vs. offline tooling."

Functional tests that check the Personal Assistant Kit's system prompts produce correct behavior against synthetic fixtures.

## Setup

```bash
cd evals
npm install
```

You need an `ANTHROPIC_API_KEY` environment variable set:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Running

```bash
# All suites
npm run eval

# Individual suites
npm run eval:inbox    # Inbox routing (7 cases)
npm run eval:bee      # Bee capture processing (7 cases)
npm run eval:review   # Weekly review (7 cases)
npm run eval:status   # Status updates (7 cases)
```

## What's being tested

### Inbox Routing (`suites/inbox-routing.ts`)
Given synthetic inbox items of varying types, verifies the system prompt produces correct GTD routing:
- Quick tasks → Quick Wins
- Deep work → Deep Work
- Multi-step efforts → Projects
- Non-urgent interests → Someday Maybe
- Keep-but-don't-act → Reference
- Blocked on others → Waiting For
- Family logistics → Family & Personal Planning

### Bee Processing (`suites/bee-processing.ts`)
Given raw Bee captures (work meeting + sensitive personal conversation), verifies:
- Tasks are extracted with correct owners and deadlines
- Meeting notes have all required sections (Topic Summary, Key Decisions, etc.)
- Work vs. personal classification is correct
- People notes are generated with correct structure
- Sensitive content is fully redacted (no medication names, no child details, no therapy)
- Frontmatter schema is correct

### Weekly Review (`suites/weekly-review.ts`)
Given a vault snapshot with planted issues, verifies the system catches:
- Stale waiting-for items (overdue by 17 days)
- Projects without next actions (2 of 3 are missing them)
- Meeting commitments that don't have corresponding tasks
- Someday-maybe items worth activating
- Healthy projects that should NOT be flagged

### Status Updates (`suites/status-updates.ts`)
Given task data with varying states, verifies:
- Active tasks get substantive updates from available context
- Tasks with no context are flagged [!] — not fabricated
- Closed tasks are marked CLOSED
- Blocked tasks include Risks/Dependencies
- Format rules are followed (dash bullets, full names, M/D dates)

## How assertions work

Each eval case sends a message to Claude with the relevant system prompt and fixture data, then checks the response against assertions:

| Type | What it checks |
|------|---------------|
| `contains` | Response includes a specific string (case-insensitive) |
| `not_contains` | Response does NOT include a string |
| `matches` | Response matches a regex pattern |
| `json_path` | A JSON value in the response equals an expected value |

## Adding new evals

1. Add fixture data to `fixtures/` if needed
2. Create a new case in the relevant suite (or a new suite file)
3. Define assertions that verify the behavior you care about
4. Run the suite to confirm it passes

## Cost

Each full run makes ~28 Claude API calls (Sonnet). Typical cost: ~$0.10-0.20 per full run depending on response lengths.

## Model

Evals run against `claude-sonnet-4-20250514` by default. This is intentional — evals should pass on Sonnet; if they only pass on Opus, the system prompt needs improvement. Change the model in `lib/runner.ts` if needed.
