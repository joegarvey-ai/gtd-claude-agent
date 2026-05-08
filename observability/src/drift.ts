import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve } from "path";

export interface EvalSnapshot {
  timestamp: string;
  suite: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  failedCases: string[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalDurationMs: number;
}

export interface DriftReport {
  generated: string;
  period: { from: string; to: string };
  snapshots: EvalSnapshot[];
  trend: {
    direction: "improving" | "stable" | "degrading";
    passRateChange: number;
    costChange: number;
    latencyChange: number;
  };
  alerts: DriftAlert[];
}

export interface DriftAlert {
  severity: "info" | "warn" | "critical";
  suite: string;
  message: string;
  currentValue: number;
  threshold: number;
}

const THRESHOLDS = {
  minPassRate: 0.85,
  maxCostPerRun: 0.50,
  maxLatencyMs: 60_000,
  degradationWindow: 3, // consecutive snapshots below threshold triggers alert
};

export function recordEvalSnapshot(
  dataDir: string,
  snapshot: EvalSnapshot
): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const historyPath = resolve(dataDir, "eval-history.jsonl");
  const line = JSON.stringify(snapshot) + "\n";

  if (existsSync(historyPath)) {
    const existing = readFileSync(historyPath, "utf-8");
    writeFileSync(historyPath, existing + line);
  } else {
    writeFileSync(historyPath, line);
  }
}

export function loadEvalHistory(dataDir: string): EvalSnapshot[] {
  const historyPath = resolve(dataDir, "eval-history.jsonl");
  if (!existsSync(historyPath)) return [];

  return readFileSync(historyPath, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvalSnapshot);
}

export function generateDriftReport(dataDir: string): DriftReport {
  const snapshots = loadEvalHistory(dataDir);

  if (snapshots.length === 0) {
    return {
      generated: new Date().toISOString(),
      period: { from: "N/A", to: "N/A" },
      snapshots: [],
      trend: { direction: "stable", passRateChange: 0, costChange: 0, latencyChange: 0 },
      alerts: [],
    };
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const alerts: DriftAlert[] = [];

  // Check pass rate degradation
  const bySuite = new Map<string, EvalSnapshot[]>();
  for (const s of sorted) {
    if (!bySuite.has(s.suite)) bySuite.set(s.suite, []);
    bySuite.get(s.suite)!.push(s);
  }

  for (const [suite, history] of bySuite) {
    const recent = history.slice(-THRESHOLDS.degradationWindow);
    const allBelowThreshold = recent.every((s) => s.passRate < THRESHOLDS.minPassRate);

    if (allBelowThreshold && recent.length >= THRESHOLDS.degradationWindow) {
      alerts.push({
        severity: "critical",
        suite,
        message: `Pass rate below ${THRESHOLDS.minPassRate * 100}% for ${THRESHOLDS.degradationWindow} consecutive runs`,
        currentValue: recent[recent.length - 1].passRate,
        threshold: THRESHOLDS.minPassRate,
      });
    }

    const latest = history[history.length - 1];
    if (latest.passRate < THRESHOLDS.minPassRate) {
      alerts.push({
        severity: "warn",
        suite,
        message: `Current pass rate (${(latest.passRate * 100).toFixed(0)}%) below threshold`,
        currentValue: latest.passRate,
        threshold: THRESHOLDS.minPassRate,
      });
    }
  }

  // Calculate trend
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

  const avgPassRate = (snaps: EvalSnapshot[]) =>
    snaps.reduce((sum, s) => sum + s.passRate, 0) / snaps.length;
  const avgCost = (snaps: EvalSnapshot[]) =>
    snaps.reduce((sum, s) => sum + s.totalInputTokens + s.totalOutputTokens, 0) / snaps.length;
  const avgLatency = (snaps: EvalSnapshot[]) =>
    snaps.reduce((sum, s) => sum + s.totalDurationMs, 0) / snaps.length;

  const passRateChange = firstHalf.length > 0
    ? avgPassRate(secondHalf) - avgPassRate(firstHalf)
    : 0;
  const costChange = firstHalf.length > 0
    ? avgCost(secondHalf) - avgCost(firstHalf)
    : 0;
  const latencyChange = firstHalf.length > 0
    ? avgLatency(secondHalf) - avgLatency(firstHalf)
    : 0;

  let direction: "improving" | "stable" | "degrading" = "stable";
  if (passRateChange > 0.05) direction = "improving";
  if (passRateChange < -0.05) direction = "degrading";

  return {
    generated: new Date().toISOString(),
    period: {
      from: sorted[0].timestamp,
      to: sorted[sorted.length - 1].timestamp,
    },
    snapshots: sorted,
    trend: {
      direction,
      passRateChange: Math.round(passRateChange * 1000) / 1000,
      costChange: Math.round(costChange),
      latencyChange: Math.round(latencyChange),
    },
    alerts,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith("drift.ts")) {
  const dataDir = resolve(process.argv[2] ?? "./_observability");
  const report = generateDriftReport(dataDir);

  console.log("\n📈 Drift Report\n");
  console.log(`Period: ${report.period.from} → ${report.period.to}`);
  console.log(`Snapshots: ${report.snapshots.length}`);
  console.log(`Trend: ${report.trend.direction} (pass rate Δ${(report.trend.passRateChange * 100).toFixed(1)}%)`);

  if (report.alerts.length > 0) {
    console.log(`\nAlerts (${report.alerts.length}):`);
    for (const alert of report.alerts) {
      const icon = { info: "ℹ", warn: "⚠", critical: "🚨" }[alert.severity];
      console.log(`  ${icon} [${alert.suite}] ${alert.message}`);
    }
  } else {
    console.log("\nNo alerts.");
  }
  console.log("");
}
