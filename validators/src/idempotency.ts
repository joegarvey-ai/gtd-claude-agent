import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { ValidationResult, ValidationError, ValidationWarning } from "./types.js";

function extractConversationId(content: string): string | null {
  const match = content.match(/bee_conversation_id:\s*(.+)/);
  if (!match) return null;
  return match[1].trim();
}

export function validateIdempotency(
  outputDir: string,
  sentinelDir: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let filesChecked = 0;

  // Collect all conversation IDs that have already been processed
  // (present in output directories)
  const processedIds = new Set<string>();

  function collectProcessedIds(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        collectProcessedIds(fullPath);
      } else if (entry.name.endsWith(".md")) {
        filesChecked++;
        const content = readFileSync(fullPath, "utf-8");
        const id = extractConversationId(content);
        if (id) {
          // Handle comma-separated IDs (merged conversations)
          for (const singleId of id.split(",")) {
            processedIds.add(singleId.trim());
          }
        }
      }
    }
  }

  // Scan Bee task files and meeting notes for conversation IDs
  collectProcessedIds(resolve(outputDir, "00 Inbox/Bee"));
  collectProcessedIds(resolve(outputDir, "05 Reference/Meeting Notes"));

  // Also scan employer-specific meeting note dirs
  const refDir = resolve(outputDir, "05 Reference");
  if (existsSync(refDir)) {
    for (const entry of readdirSync(refDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "Bee" && entry.name !== "Meeting Notes") {
        const meetingNotesDir = join(refDir, entry.name, "Meeting Notes");
        collectProcessedIds(meetingNotesDir);
      }
    }
  }

  // Check sentinel files — if a sentinel references an already-processed ID, flag it
  if (existsSync(sentinelDir)) {
    const sentinels = readdirSync(sentinelDir).filter((f) => f.endsWith(".sentinel.md"));

    for (const sentinel of sentinels) {
      const fullPath = join(sentinelDir, sentinel);
      const content = readFileSync(fullPath, "utf-8");
      const id = extractConversationId(content);

      if (id && processedIds.has(id)) {
        warnings.push({
          file: sentinel,
          message: `Sentinel references conversation ${id} which has already been processed. Re-processing would create duplicates.`,
          severity: "warning",
        });
      }
    }
  }

  // Check for duplicate conversation IDs within output files (shouldn't happen)
  const idToFiles = new Map<string, string[]>();

  function mapIdsToFiles(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        mapIdsToFiles(fullPath);
      } else if (entry.name.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
        const id = extractConversationId(content);
        if (id) {
          for (const singleId of id.split(",")) {
            const trimmed = singleId.trim();
            if (!idToFiles.has(trimmed)) idToFiles.set(trimmed, []);
            idToFiles.get(trimmed)!.push(entry.name);
          }
        }
      }
    }
  }

  // Check task files for duplicates specifically
  const beeInbox = resolve(outputDir, "00 Inbox/Bee");
  mapIdsToFiles(beeInbox);

  for (const [id, files] of idToFiles) {
    // Same conversation ID in multiple task files = duplicate processing
    const taskFiles = files.filter((f) => f.includes("_tasks"));
    if (taskFiles.length > 1) {
      errors.push({
        file: taskFiles.join(", "),
        message: `Duplicate task files for conversation ${id}: ${taskFiles.join(", ")}`,
        severity: "error",
      });
    }
  }

  return {
    validator: "idempotency",
    passed: errors.length === 0,
    errors,
    warnings,
    filesChecked,
  };
}
