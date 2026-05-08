import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { ValidationResult, ValidationError, ValidationWarning } from "./types.js";

// Patterns that should NEVER appear in processed outputs.
// These are strong signals of redaction failure — not keywords to block,
// but patterns indicating sensitive content leaked through.
const REDACTION_PATTERNS: { pattern: RegExp; category: string; description: string }[] = [
  // Medical
  { pattern: /\b\d+\s*mg\b/i, category: "medical", description: "Medication dosage (e.g., 10mg)" },
  { pattern: /\bsertraline|lexapro|zoloft|prozac|wellbutrin|xanax|adderall|ritalin\b/i, category: "medical", description: "Medication name" },
  { pattern: /\btherapist\s+(said|suggested|recommended|thinks)\b/i, category: "medical", description: "Therapy session content" },
  { pattern: /\bdiagnos(ed|is)\s+with\b/i, category: "medical", description: "Medical diagnosis" },

  // Financial (personal)
  { pattern: /\b(credit score|bank balance|net worth)\s*[:\s]*\$?\d/i, category: "financial", description: "Personal financial figure" },
  { pattern: /\bsalary\s*[:\s]*\$?\d{3,}/i, category: "financial", description: "Salary disclosure" },

  // Minors
  { pattern: /\b(my|our)\s+(son|daughter|kid|child)\s+(is|was|has been)\s+(diagnosed|struggling|failing|suspended)\b/i, category: "minor", description: "Child behavioral/medical detail" },
  { pattern: /\bpediatrician\s+(said|suggested|recommended|wants)\b/i, category: "minor", description: "Pediatrician recommendation about a child" },

  // Intimate
  { pattern: /\b(we|I)\s+(had sex|made love|slept together|hooked up)\b/i, category: "intimate", description: "Sexual content" },

  // SSN / credit card patterns
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, category: "pii", description: "Possible SSN pattern" },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, category: "pii", description: "Possible credit card number" },

  // Password/secret patterns
  { pattern: /\b(password|secret|api.key)\s*[=:]\s*\S{8,}\b/i, category: "credential", description: "Possible credential in output" },
];

function checkFileForLeaks(filePath: string, content: string): (ValidationError | ValidationWarning)[] {
  const issues: (ValidationError | ValidationWarning)[] = [];

  for (const { pattern, category, description } of REDACTION_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      issues.push({
        file: filePath,
        message: `Redaction leak [${category}]: ${description} — matched: "${match[0]}"`,
        severity: "error",
      });
    }
  }

  return issues;
}

export function validateRedaction(outputDir: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let filesChecked = 0;

  if (!existsSync(outputDir)) {
    return { validator: "redaction", passed: true, errors: [], warnings: [], filesChecked: 0 };
  }

  function scanRecursive(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip _raw — those are unprocessed source files
        if (entry.name === "_raw") continue;
        scanRecursive(fullPath);
      } else if (entry.name.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
        filesChecked++;
        const issues = checkFileForLeaks(fullPath, content);
        for (const issue of issues) {
          if (issue.severity === "error") errors.push(issue as ValidationError);
          else warnings.push(issue as ValidationWarning);
        }
      }
    }
  }

  // Scan all output directories (not _raw)
  scanRecursive(resolve(outputDir, "00 Inbox/Bee"));
  scanRecursive(resolve(outputDir, "05 Reference/Meeting Notes"));
  scanRecursive(resolve(outputDir, "People"));

  // Also scan any employer-specific meeting notes dirs
  const refDir = resolve(outputDir, "05 Reference");
  if (existsSync(refDir)) {
    for (const entry of readdirSync(refDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== "Bee" && entry.name !== "Meeting Notes") {
        const meetingNotesDir = join(refDir, entry.name, "Meeting Notes");
        if (existsSync(meetingNotesDir)) {
          scanRecursive(meetingNotesDir);
        }
      }
    }
  }

  return {
    validator: "redaction",
    passed: errors.length === 0,
    errors,
    warnings,
    filesChecked,
  };
}
