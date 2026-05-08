import { execSync } from "child_process";
import { finalizeMeter } from "../lib/runner.js";

const suites = [
  { name: "Inbox Routing", script: "suites/inbox-routing.ts" },
  { name: "Bee Processing", script: "suites/bee-processing.ts" },
  { name: "Weekly Review", script: "suites/weekly-review.ts" },
  { name: "Status Updates", script: "suites/status-updates.ts" },
];

console.log("╔══════════════════════════════════════════╗");
console.log("║   Personal Assistant Kit — Eval Suite    ║");
console.log("╚══════════════════════════════════════════╝");
console.log("");

let totalPassed = 0;
let totalFailed = 0;
const results: { name: string; passed: boolean }[] = [];

for (const suite of suites) {
  try {
    execSync(`npx tsx ${suite.script}`, {
      stdio: "inherit",
      cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    });
    results.push({ name: suite.name, passed: true });
    totalPassed++;
  } catch {
    results.push({ name: suite.name, passed: false });
    totalFailed++;
  }
}

console.log("");
console.log("╔══════════════════════════════════════════╗");
console.log("║              FINAL RESULTS              ║");
console.log("╠══════════════════════════════════════════╣");
for (const r of results) {
  const status = r.passed ? "✓ PASS" : "✗ FAIL";
  console.log(`║  ${status}  ${r.name.padEnd(30)}║`);
}
console.log("╠══════════════════════════════════════════╣");
console.log(
  `║  ${totalPassed} passed, ${totalFailed} failed${" ".repeat(24 - String(totalPassed).length - String(totalFailed).length)}║`
);
console.log("╚══════════════════════════════════════════╝");

finalizeMeter();
process.exit(totalFailed > 0 ? 1 : 0);
