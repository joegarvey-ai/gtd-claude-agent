# Observability

> **Offline developer tooling — it does not observe live agent turns.** This is a TypeScript library the prompt-driven agent cannot `import` mid-session. Its only importer is the offline eval runner (`evals/lib/runner.ts`), so it instruments *eval runs*, not your real Daily Triage / Bee / inbox sessions. To get real runtime telemetry you'd need the MCP client itself to emit it; that isn't wired up. Treat everything below as instrumentation for the offline harness.

Structured logs, traces, cost metering, and drift detection for the eval harness.

## Components

### Logger (`src/logger.ts`)

Structured JSON logging with trace correlation.

```typescript
import { createLogger } from "./src/logger.js";

const logger = createLogger({
  logDir: "./_observability/logs",
  agent: "bee-processor",
  stdout: true, // also print to terminal
});

logger.info("process-capture", "Processing raw capture 8001234", {
  metadata: { conversationId: "8001234" },
});

logger.info("write-output", "Wrote meeting notes", {
  durationMs: 1200,
  tokens: { input: 3400, output: 890 },
});
```

**Log format:** JSONL files at `<logDir>/YYYY-MM-DD.jsonl`. Each line:

```json
{
  "timestamp": "2026-05-07T14:30:00.000Z",
  "level": "info",
  "traceId": "m8k2f-a9b3c1",
  "agent": "bee-processor",
  "operation": "process-capture",
  "message": "Processing raw capture 8001234",
  "metadata": { "conversationId": "8001234" },
  "durationMs": 1200,
  "tokens": { "input": 3400, "output": 890 }
}
```

### Tracer (`src/tracer.ts`)

Hierarchical spans for end-to-end operation tracing.

```typescript
import { createLogger } from "./src/logger.js";
import { createTracer } from "./src/tracer.js";

const logger = createLogger({ logDir: "./_observability/logs", agent: "bee-processor" });
const tracer = createTracer(logger, "process-capture", "bee-processor");

tracer.startSpan("read-raw");
// ... read the file ...
tracer.endSpan({ tokens: { input: 500, output: 0 } });

tracer.startSpan("generate-outputs");
// ... call Claude API ...
tracer.endSpan({ tokens: { input: 3000, output: 800 }, metadata: { outputFiles: 3 } });

tracer.startSpan("write-vault");
// ... write files ...
tracer.endSpan();

const trace = tracer.endTrace("success");
// trace.totalDurationMs, trace.totalTokens, trace.spans[...]
```

### Meter (`src/metering.ts`)

Cost and token accumulation per session.

```typescript
import { createMeter } from "./src/metering.js";

const meter = createMeter("./_observability/metering", "gtd-assistant");

meter.record({
  operation: "inbox-processing",
  model: "claude-sonnet-5",
  inputTokens: 4200,
  outputTokens: 1100,
  cacheHits: 2800,
  durationMs: 3400,
});

// At end of session:
const summary = meter.finalize();
// Writes session-<id>.json and appends to costs-YYYY-MM-DD.jsonl
```

**Pricing:** Built-in per-model pricing (Sonnet, Haiku, Opus). Automatically estimates USD cost per operation including cache discounts.

### Drift Detection (`src/drift.ts`)

Tracks eval pass rates over time and alerts on degradation.

```typescript
import { recordEvalSnapshot, generateDriftReport } from "./src/drift.js";

// Automatically called by the eval runner after each suite
recordEvalSnapshot("./_observability/metering", {
  timestamp: new Date().toISOString(),
  suite: "Inbox Routing",
  totalCases: 8,
  passed: 7,
  failed: 1,
  passRate: 0.875,
  failedCases: ["Routes ambiguous item"],
  totalInputTokens: 32000,
  totalOutputTokens: 8000,
  totalDurationMs: 24000,
});

// Generate drift report
const report = generateDriftReport("./_observability/metering");
// report.trend.direction: "improving" | "stable" | "degrading"
// report.alerts: [...warnings and critical alerts]
```

**Alert thresholds:**
- Pass rate below 85% → `warn`
- Pass rate below 85% for 3 consecutive runs → `critical`
- Cost exceeds $0.50 per run → `warn`

## Integration with Evals

The eval runner (`evals/lib/runner.ts`) automatically:
1. Records metering data for every API call
2. Logs pass/fail results with durations and token counts
3. Records drift snapshots after each suite completes
4. Finalizes the meter session when all suites are done

Output lands in `_observability/` (gitignored):
```
_observability/
├── logs/
│   └── 2026-05-07.jsonl          ← structured log entries
└── metering/
    ├── session-m8k2f-a9b3c1.json ← per-session cost summary
    ├── costs-2026-05-07.jsonl    ← per-operation cost log
    └── eval-history.jsonl         ← drift tracking (append-only)
```

## CLI Commands

```bash
cd observability

# View report (all sessions + drift status)
npm run report

# View latest session only
npm run report:latest

# Check drift (standalone)
npm run drift:check
```

## Verbose Mode

Set `VERBOSE=1` when running evals to print observability data to stdout:

```bash
cd evals
VERBOSE=1 ANTHROPIC_API_KEY=sk-... npm run eval
```
