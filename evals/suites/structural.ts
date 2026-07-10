// Structural check — no API key, no network. Validates the eval wiring itself:
// shipped prompts load, hook prompts parse and carry their rules, fixtures exist,
// and the loaders resolve. This is the free CI gate that always runs; it catches
// the majority of regressions (broken repoints, malformed prompts/hooks, missing
// fixtures, bad paths) without spending a token. The live API suites verify behavior.

import { loadSystemPrompt, loadHookPrompt, loadFixture } from "../lib/runner.js";

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const checks: Check[] = [];
function check(name: string, fn: () => boolean | string): void {
  try {
    const r = fn();
    if (r === true) checks.push({ name, passed: true, detail: "" });
    else checks.push({ name, passed: false, detail: typeof r === "string" ? r : "returned false" });
  } catch (err) {
    checks.push({ name, passed: false, detail: String(err) });
  }
}

// Shipped prompts load and carry the GTD vocabulary the suites assert on.
check("system-prompt.md loads with GTD folders", () => {
  const p = loadSystemPrompt("system-prompt.md");
  return (/Quick Wins/.test(p) && /Waiting For/.test(p) && /Someday/.test(p)) || "missing GTD folder names";
});
check("system-prompt.md has the Daily Triage workflow (S1)", () => {
  return /## Daily Triage/.test(loadSystemPrompt("system-prompt.md")) || "no Daily Triage section";
});
check("system-prompt-bee-processor.md loads", () => {
  return loadSystemPrompt("system-prompt-bee-processor.md").length > 500 || "too short / empty";
});

// The status suite depends on the shipped hook prompt carrying its rules.
check("weekly-status-update hook prompt loads with its rules", () => {
  const p = loadHookPrompt(".kiro/hooks/weekly-status-update.kiro.hook");
  return (/M\/D/.test(p) && /NO CONTEXT/.test(p) && /full names/i.test(p)) || "hook prompt missing status rules";
});

// Fixtures every suite reads must exist and be non-trivial.
for (const f of [
  "inbox-items.md",
  "task-data-status.md",
  "raw-capture-work.md",
  "raw-capture-sensitive.md",
  "vault-state-weekly-review.md",
]) {
  check(`fixture ${f} loads`, () => loadFixture(f).length > 50 || "too short / empty");
}

let failed = 0;
console.log("\n🧪 Structural Check (no API)\n");
for (const c of checks) {
  console.log(`  ${c.passed ? "✓" : "✗"} ${c.name}`);
  if (!c.passed) {
    failed++;
    console.log(`      ${c.detail}`);
  }
}
console.log(`\n${checks.length - failed} passed, ${failed} failed (${checks.length} total)\n`);
process.exit(failed > 0 ? 1 : 0);
