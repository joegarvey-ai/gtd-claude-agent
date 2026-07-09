# Validators

> **Offline developer tooling — not runtime middleware.** These are TypeScript CLIs you run yourself (in CI or from a terminal) against the vault. The prompt-driven agent cannot `import` them mid-session, so they do **not** run during a live agent turn and do **not** gate agent actions in real time. Nothing in the agent loop invokes them. Use them as an offline safety net that checks the vault *after* the agent has written to it.

Deterministic checks for system invariants: schema, redaction leakage, GTD routing, idempotency, and continuation state. Run them by hand or on a schedule to catch issues the agent's prompt-level rules may have missed.

## Setup

```bash
cd validators
npm install
```

## Usage

```bash
# Run all validators against your vault
npx tsx src/cli.ts all /path/to/vault /path/to/workspace

# Or set env vars
export VAULT_PATH=/path/to/vault
export WORKSPACE_PATH=/path/to/workspace
npm run validate

# Individual validators
npm run validate:schema
npm run validate:redaction
npm run validate:routing
npm run validate:idempotency
```

## Validators

### Schema (`src/schema.ts`)

**Trigger:** Post-write (after Bee Processor generates outputs)

Verifies that all generated files have correct structure:

- **Bee task files** — required frontmatter fields (source, meeting_date, meeting_slug, bee_conversation_id, created), at least one checkbox item
- **Meeting notes** — required frontmatter + expected sections (Topic Summary, Key Decisions)
- **People notes** — required frontmatter (created, last_updated) + required sections (Role & Context)

### Redaction (`src/redaction.ts`)

**Trigger:** Post-write (after any agent writes to the vault)

Scans all processed output files for leaked sensitive content. Uses pattern matching for high-confidence signals:

| Category | What it catches |
|----------|----------------|
| Medical | Medication dosages (10mg), drug names, therapy session content, diagnoses |
| Financial | Personal financial figures, salary disclosures |
| Minors | Child behavioral/medical details, pediatrician recommendations |
| Intimate | Sexual content |
| PII | SSN patterns, credit card numbers |
| Credentials | Passwords, API keys in output |

This is a safety net, not the primary redaction mechanism. The primary mechanism is judgment-based exclusion in the Bee Processor system prompt. This validator catches leaks that slip through.

### Routing (`src/routing.ts`)

**Trigger:** Post-process (after inbox processing moves items)

Verifies:
- Every file in the vault lives within a recognized GTD folder
- No duplicates (same file in both Inbox/Bee and a routed destination)
- Files haven't been orphaned outside the folder structure

### Idempotency (`src/idempotency.ts`)

**Trigger:** Pre-process (before Bee Processor starts)

Prevents re-processing captures that have already been processed:
- Collects conversation IDs from existing outputs — matches both `bee_conversation_id` (output files) and `conversation_id` (sentinels)
- Checks pending sentinel files against already-processed IDs
- Flags duplicate task files for the same conversation

### Continuation (`src/continuation.ts`)

**Trigger:** Session boundary (start/end of processing runs)

Manages processing state so interrupted runs can resume cleanly:

```typescript
import { createProcessingState, saveCheckpoint, markCompleted } from "./src/continuation.js";

// At start of processing
const state = createProcessingState("bee-processor", "process-captures", sentinels, total);
saveCheckpoint(workspacePath, state);

// After each item
state.progress.processedItems++;
state.completedOutputs.push(outputPath);
saveCheckpoint(workspacePath, state);

// At end
markCompleted(workspacePath, state.sessionId);
```

If a run is interrupted (context limit, crash, timeout), the next run can detect the incomplete state and resume from the last checkpoint rather than re-processing everything.

## Where these fit (and where they don't)

The "Trigger" labels above (Pre-process, Post-write, Post-process) describe the *logical* point each check corresponds to — **not** an automatic hook that fires there. Today nothing invokes these at agent runtime; you run them yourself.

Recommended ways to actually use them:
- **In CI** — run `npx tsx src/cli.ts all <vault> <workspace>` on a schedule or pre-commit to check the vault state.
- **By hand** — after a batch of Bee processing, run `validate:idempotency` and `validate:redaction` to confirm no duplicates or leaks landed.

Wiring these into a real gate (CI against the shipped prompts; a scheduled vault check) is planned but not yet done — see CLAUDE.md, "Runtime vs. offline tooling."

## Programmatic API

All validators export functions you can call directly:

```typescript
import { validateSchema, validateRedaction, validateRouting, validateIdempotency } from "./src/index.js";

const schemaResult = validateSchema("/path/to/vault");
const redactionResult = validateRedaction("/path/to/vault");
const routingResult = validateRouting("/path/to/vault");
const idempotencyResult = validateIdempotency("/path/to/vault", "/path/to/.kiro/bee-inbox");

// Each returns: { validator, passed, errors, warnings, filesChecked }
```
