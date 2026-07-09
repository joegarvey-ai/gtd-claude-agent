import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { AgentRole } from "./logger.js";

export interface OperationCost {
  timestamp: string;
  agent: AgentRole;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheHits: number;
  estimatedCostUsd: number;
  durationMs: number;
}

export interface SessionSummary {
  sessionId: string;
  startTime: string;
  endTime?: string;
  agent: AgentRole;
  operations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheHits: number;
  totalEstimatedCostUsd: number;
  totalDurationMs: number;
  byOperation: Record<string, {
    count: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    avgDurationMs: number;
  }>;
}

// Pricing per million tokens. Current models first; legacy keys kept so historical
// metering data still prices correctly. cacheRead ~= 0.1x input.
const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  // Current
  "claude-sonnet-5": { input: 3.0, output: 15.0, cacheRead: 0.30 },
  "claude-opus-4-8": { input: 5.0, output: 25.0, cacheRead: 0.50 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheRead: 0.10 },
  // Legacy (retained for old data)
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0, cacheRead: 0.30 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.0, cacheRead: 0.08 },
  "claude-opus-4-20250514": { input: 15.0, output: 75.0, cacheRead: 1.50 },
  default: { input: 3.0, output: 15.0, cacheRead: 0.30 },
};

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheHits: number
): number {
  const pricing = PRICING[model] ?? PRICING.default;
  const nonCachedInput = Math.max(0, inputTokens - cacheHits);
  const cost =
    (nonCachedInput / 1_000_000) * pricing.input +
    (cacheHits / 1_000_000) * pricing.cacheRead +
    (outputTokens / 1_000_000) * pricing.output;
  return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimal places
}

export class Meter {
  private dataDir: string;
  private session: SessionSummary;
  private costs: OperationCost[] = [];

  constructor(dataDir: string, agent: AgentRole, sessionId?: string) {
    this.dataDir = dataDir;
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.session = {
      sessionId: sessionId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      startTime: new Date().toISOString(),
      agent,
      operations: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheHits: 0,
      totalEstimatedCostUsd: 0,
      totalDurationMs: 0,
      byOperation: {},
    };
  }

  record(opts: {
    operation: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheHits?: number;
    durationMs: number;
  }): OperationCost {
    const cacheHits = opts.cacheHits ?? 0;
    const cost = estimateCost(opts.model, opts.inputTokens, opts.outputTokens, cacheHits);

    const entry: OperationCost = {
      timestamp: new Date().toISOString(),
      agent: this.session.agent,
      operation: opts.operation,
      model: opts.model,
      inputTokens: opts.inputTokens,
      outputTokens: opts.outputTokens,
      cacheHits,
      estimatedCostUsd: cost,
      durationMs: opts.durationMs,
    };

    this.costs.push(entry);

    // Update session summary
    this.session.operations++;
    this.session.totalInputTokens += opts.inputTokens;
    this.session.totalOutputTokens += opts.outputTokens;
    this.session.totalCacheHits += cacheHits;
    this.session.totalEstimatedCostUsd += cost;
    this.session.totalDurationMs += opts.durationMs;

    // Update by-operation breakdown
    if (!this.session.byOperation[opts.operation]) {
      this.session.byOperation[opts.operation] = {
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        avgDurationMs: 0,
      };
    }
    const opSummary = this.session.byOperation[opts.operation];
    opSummary.count++;
    opSummary.inputTokens += opts.inputTokens;
    opSummary.outputTokens += opts.outputTokens;
    opSummary.estimatedCostUsd += cost;
    opSummary.avgDurationMs = Math.round(
      (opSummary.avgDurationMs * (opSummary.count - 1) + opts.durationMs) / opSummary.count
    );

    return entry;
  }

  finalize(): SessionSummary {
    this.session.endTime = new Date().toISOString();

    // Write session summary
    const summaryPath = resolve(this.dataDir, `session-${this.session.sessionId}.json`);
    writeFileSync(summaryPath, JSON.stringify(this.session, null, 2));

    // Append costs to daily log
    const date = new Date().toISOString().split("T")[0];
    const costLogPath = resolve(this.dataDir, `costs-${date}.jsonl`);
    const lines = this.costs.map((c) => JSON.stringify(c)).join("\n") + "\n";
    if (existsSync(costLogPath)) {
      const existing = readFileSync(costLogPath, "utf-8");
      writeFileSync(costLogPath, existing + lines);
    } else {
      writeFileSync(costLogPath, lines);
    }

    return this.session;
  }

  getSummary(): SessionSummary {
    return this.session;
  }
}

export function createMeter(dataDir: string, agent: AgentRole, sessionId?: string): Meter {
  return new Meter(dataDir, agent, sessionId);
}
