import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { type SessionSummary } from "./metering.js";
import { generateDriftReport } from "./drift.js";

const dataDir = resolve(process.argv[2] ?? "./_observability");
const showLatest = process.argv.includes("--latest");

function loadSessions(): SessionSummary[] {
  if (!existsSync(dataDir)) return [];

  return readdirSync(dataDir)
    .filter((f) => f.startsWith("session-") && f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(resolve(dataDir, f), "utf-8")) as SessionSummary)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  return `$${usd.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n > 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n > 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function printSession(session: SessionSummary): void {
  console.log(`\n┌─ Session: ${session.sessionId}`);
  console.log(`│  Agent: ${session.agent}`);
  console.log(`│  Time: ${session.startTime} → ${session.endTime ?? "running"}`);
  console.log(`│  Operations: ${session.operations}`);
  console.log(`│  Tokens: ${formatTokens(session.totalInputTokens)} in / ${formatTokens(session.totalOutputTokens)} out`);
  if (session.totalCacheHits > 0) {
    console.log(`│  Cache hits: ${formatTokens(session.totalCacheHits)}`);
  }
  console.log(`│  Cost: ${formatCost(session.totalEstimatedCostUsd)}`);
  console.log(`│  Duration: ${(session.totalDurationMs / 1000).toFixed(1)}s`);

  if (Object.keys(session.byOperation).length > 0) {
    console.log(`│`);
    console.log(`│  By operation:`);
    for (const [op, stats] of Object.entries(session.byOperation)) {
      console.log(
        `│    ${op}: ${stats.count}× | ${formatTokens(stats.inputTokens + stats.outputTokens)} tok | ${formatCost(stats.estimatedCostUsd)} | avg ${stats.avgDurationMs}ms`
      );
    }
  }
  console.log(`└─`);
}

// Main
console.log("\n══════════════════════════════════════════");
console.log("  Personal Assistant Kit — Observability Report");
console.log("══════════════════════════════════════════\n");

const sessions = loadSessions();

if (sessions.length === 0) {
  console.log("No session data found.");
  console.log(`Looking in: ${dataDir}`);
  console.log("\nRun evals with observability enabled to generate data.");
  process.exit(0);
}

if (showLatest) {
  printSession(sessions[sessions.length - 1]);
} else {
  // Summary across all sessions
  const totalOps = sessions.reduce((s, sess) => s + sess.operations, 0);
  const totalCost = sessions.reduce((s, sess) => s + sess.totalEstimatedCostUsd, 0);
  const totalInput = sessions.reduce((s, sess) => s + sess.totalInputTokens, 0);
  const totalOutput = sessions.reduce((s, sess) => s + sess.totalOutputTokens, 0);

  console.log(`Sessions: ${sessions.length}`);
  console.log(`Total operations: ${totalOps}`);
  console.log(`Total tokens: ${formatTokens(totalInput)} in / ${formatTokens(totalOutput)} out`);
  console.log(`Total estimated cost: ${formatCost(totalCost)}`);
  console.log(`Avg cost per session: ${formatCost(totalCost / sessions.length)}`);

  // Show last 5 sessions
  console.log(`\nRecent sessions (last 5):`);
  for (const session of sessions.slice(-5)) {
    printSession(session);
  }
}

// Drift report
const drift = generateDriftReport(dataDir);
if (drift.snapshots.length > 0) {
  console.log("\n─── Drift Status ───");
  console.log(`Trend: ${drift.trend.direction}`);
  if (drift.alerts.length > 0) {
    for (const alert of drift.alerts) {
      const icon = { info: "ℹ", warn: "⚠", critical: "🚨" }[alert.severity];
      console.log(`  ${icon} [${alert.suite}] ${alert.message}`);
    }
  } else {
    console.log("  No drift alerts.");
  }
}

console.log("");
