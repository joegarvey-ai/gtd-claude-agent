import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { ValidationResult, ValidationError, ValidationWarning, BeeFrontmatter } from "./types.js";

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const parsed: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (/^\d+$/.test(value as string)) value = Number(value);
    else if ((value as string).startsWith("[") && (value as string).endsWith("]")) {
      value = (value as string).slice(1, -1).split(",").map((s) => s.trim());
    }

    parsed[key] = value;
  }
  return parsed;
}

function validateBeeTaskFile(filePath: string, content: string): (ValidationError | ValidationWarning)[] {
  const issues: (ValidationError | ValidationWarning)[] = [];
  const fm = parseFrontmatter(content);

  if (!fm) {
    issues.push({ file: filePath, message: "Missing frontmatter block", severity: "error" });
    return issues;
  }

  const required = ["source", "meeting_date", "meeting_slug", "bee_conversation_id", "created"];
  for (const field of required) {
    if (!(field in fm)) {
      issues.push({ file: filePath, field, message: `Missing required field: ${field}`, severity: "error" });
    }
  }

  if (fm.source && fm.source !== "bee") {
    issues.push({ file: filePath, field: "source", message: `Expected source: bee, got: ${fm.source}`, severity: "error" });
  }

  if (fm.meeting_date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.meeting_date as string)) {
    issues.push({ file: filePath, field: "meeting_date", message: `Invalid date format: ${fm.meeting_date} (expected YYYY-MM-DD)`, severity: "error" });
  }

  if (!content.includes("- [ ]") && !content.includes("- [x]")) {
    issues.push({ file: filePath, message: "Task file contains no checkbox items", severity: "warning" });
  }

  return issues;
}

function validateMeetingNoteFile(filePath: string, content: string): (ValidationError | ValidationWarning)[] {
  const issues: (ValidationError | ValidationWarning)[] = [];
  const fm = parseFrontmatter(content);

  if (!fm) {
    issues.push({ file: filePath, message: "Missing frontmatter block", severity: "error" });
    return issues;
  }

  const required = ["source", "meeting_date", "meeting_slug", "bee_conversation_id", "created"];
  for (const field of required) {
    if (!(field in fm)) {
      issues.push({ file: filePath, field, message: `Missing required field: ${field}`, severity: "error" });
    }
  }

  const expectedSections = ["Topic Summary", "Key Decisions"];
  for (const section of expectedSections) {
    if (!content.includes(`## ${section}`)) {
      issues.push({ file: filePath, message: `Missing expected section: ## ${section}`, severity: "warning" });
    }
  }

  return issues;
}

function validatePeopleFile(filePath: string, content: string): (ValidationError | ValidationWarning)[] {
  const issues: (ValidationError | ValidationWarning)[] = [];
  const fm = parseFrontmatter(content);

  if (!fm) {
    issues.push({ file: filePath, message: "Missing frontmatter block", severity: "error" });
    return issues;
  }

  if (!fm.created) {
    issues.push({ file: filePath, field: "created", message: "Missing created timestamp", severity: "error" });
  }

  if (!fm.last_updated) {
    issues.push({ file: filePath, field: "last_updated", message: "Missing last_updated timestamp", severity: "warning" });
  }

  const requiredSections = ["Role & Context"];
  for (const section of requiredSections) {
    if (!content.includes(`## ${section}`)) {
      issues.push({ file: filePath, message: `Missing required section: ## ${section}`, severity: "error" });
    }
  }

  return issues;
}

export function validateSchema(outputDir: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let filesChecked = 0;

  if (!existsSync(outputDir)) {
    return { validator: "schema", passed: true, errors: [], warnings: [], filesChecked: 0 };
  }

  function scanDir(dir: string, fileValidator: (path: string, content: string) => (ValidationError | ValidationWarning)[]) {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const fullPath = join(dir, file);
      const content = readFileSync(fullPath, "utf-8");
      filesChecked++;
      const issues = fileValidator(fullPath, content);
      for (const issue of issues) {
        if (issue.severity === "error") errors.push(issue as ValidationError);
        else warnings.push(issue as ValidationWarning);
      }
    }
  }

  // Check Bee task files
  const beeInbox = resolve(outputDir, "00 Inbox/Bee");
  scanDir(beeInbox, validateBeeTaskFile);

  // Check meeting notes (look for both patterns)
  for (const meetingDir of ["05 Reference/Meeting Notes", "05 Reference/Amazon/Meeting Notes"]) {
    const fullDir = resolve(outputDir, meetingDir);
    scanDir(fullDir, validateMeetingNoteFile);
  }

  // Check People notes
  const peopleDir = resolve(outputDir, "People");
  scanDir(peopleDir, validatePeopleFile);

  return {
    validator: "schema",
    passed: errors.length === 0,
    errors,
    warnings,
    filesChecked,
  };
}
