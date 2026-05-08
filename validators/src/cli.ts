import { resolve } from "path";
import { validateSchema } from "./schema.js";
import { validateRedaction } from "./redaction.js";
import { validateRouting } from "./routing.js";
import { validateIdempotency } from "./idempotency.js";
import { findInterruptedSessions } from "./continuation.js";
import type { ValidationResult } from "./types.js";

const args = process.argv.slice(2);
const command = args[0] ?? "all";
const vaultPath = args[1] ?? process.env.VAULT_PATH ?? "";
const workspacePath = args[2] ?? process.env.WORKSPACE_PATH ?? process.cwd();

if (!vaultPath && command !== "help") {
  console.error("Usage: npx tsx src/cli.ts [command] [vault-path] [workspace-path]");
  console.error("  Or set VAULT_PATH environment variable");
  console.error("");
  console.error("Commands: all, schema, redaction, routing, idempotency, continuation, help");
  process.exit(1);
}

function printResult(result: ValidationResult): void {
  const icon = result.passed ? "✓" : "✗";
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`\n${icon} ${result.validator.toUpperCase()} — ${status} (${result.filesChecked} files checked)`);

  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`);
    for (const err of result.errors) {
      console.log(`    ✗ [${err.file}] ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`  Warnings (${result.warnings.length}):`);
    for (const warn of result.warnings.slice(0, 10)) {
      console.log(`    ⚠ [${warn.file}] ${warn.message}`);
    }
    if (result.warnings.length > 10) {
      console.log(`    ... and ${result.warnings.length - 10} more`);
    }
  }
}

function runAll(): boolean {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Personal Assistant Kit — Validators    ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\nVault: ${vaultPath}`);
  console.log(`Workspace: ${workspacePath}`);

  const results: ValidationResult[] = [];

  results.push(validateSchema(vaultPath));
  results.push(validateRedaction(vaultPath));
  results.push(validateRouting(vaultPath));
  results.push(validateIdempotency(vaultPath, resolve(workspacePath, ".kiro/bee-inbox")));

  for (const result of results) {
    printResult(result);
  }

  // Check for interrupted sessions
  const interrupted = findInterruptedSessions(workspacePath);
  if (interrupted.length > 0) {
    console.log(`\n⚠ CONTINUATION: ${interrupted.length} interrupted session(s) found:`);
    for (const session of interrupted) {
      console.log(`    ${session.sessionId} — ${session.operation} (${session.progress.processedItems}/${session.progress.totalItems} items, started ${session.startedAt})`);
    }
  }

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const allPassed = results.every((r) => r.passed);

  console.log("\n─────────────────────────────────────────");
  console.log(`Result: ${allPassed ? "ALL PASSED" : "FAILURES DETECTED"}`);
  console.log(`  ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  console.log("");

  return allPassed;
}

switch (command) {
  case "all": {
    const passed = runAll();
    process.exit(passed ? 0 : 1);
    break;
  }
  case "schema": {
    const result = validateSchema(vaultPath);
    printResult(result);
    process.exit(result.passed ? 0 : 1);
    break;
  }
  case "redaction": {
    const result = validateRedaction(vaultPath);
    printResult(result);
    process.exit(result.passed ? 0 : 1);
    break;
  }
  case "routing": {
    const result = validateRouting(vaultPath);
    printResult(result);
    process.exit(result.passed ? 0 : 1);
    break;
  }
  case "idempotency": {
    const result = validateIdempotency(vaultPath, resolve(workspacePath, ".kiro/bee-inbox"));
    printResult(result);
    process.exit(result.passed ? 0 : 1);
    break;
  }
  case "continuation": {
    const interrupted = findInterruptedSessions(workspacePath);
    if (interrupted.length === 0) {
      console.log("✓ No interrupted sessions found.");
    } else {
      console.log(`⚠ ${interrupted.length} interrupted session(s):`);
      for (const session of interrupted) {
        console.log(JSON.stringify(session, null, 2));
      }
    }
    process.exit(interrupted.length > 0 ? 1 : 0);
    break;
  }
  case "help":
    console.log("Usage: npx tsx src/cli.ts [command] [vault-path] [workspace-path]");
    console.log("");
    console.log("Commands:");
    console.log("  all           Run all validators (default)");
    console.log("  schema        Check frontmatter and section structure of Bee outputs");
    console.log("  redaction     Scan outputs for leaked sensitive content");
    console.log("  routing       Verify all files are in valid GTD folders, no duplicates");
    console.log("  idempotency   Check for duplicate processing of same conversation");
    console.log("  continuation  Check for interrupted processing sessions");
    console.log("  help          Show this message");
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
