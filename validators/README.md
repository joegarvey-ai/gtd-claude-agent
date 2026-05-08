# Validators

Deterministic execution hooks that enforce system invariants regardless of which model or agent is running. These run as pre/post checks around agent actions to catch issues before they reach the vault.

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
- Collects all `bee_conversation_id` values from existing outputs
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

## Integration with Kiro Hooks

The validators can be called from Kiro hooks at appropriate trigger points:

**Pre-process (before Bee processing starts):**
```
Check idempotency → skip already-processed sentinels
Check continuation → resume interrupted sessions instead of re-processing
```

**Post-write (after outputs are generated):**
```
Validate schema → ensure frontmatter and sections are correct
Validate redaction → catch any sensitive content that leaked through
```

**Post-process (after inbox routing):**
```
Validate routing → ensure no orphaned or duplicated files
```

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
