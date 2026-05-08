import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join, relative } from "path";
import { ValidationResult, ValidationError, ValidationWarning, DEFAULT_VAULT_FOLDERS } from "./types.js";

function getParentFolder(filePath: string, vaultRoot: string): string {
  const rel = relative(vaultRoot, filePath);
  const parts = rel.split(/[\\/]/);
  parts.pop(); // remove filename
  return parts.join("/");
}

export function validateRouting(vaultPath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let filesChecked = 0;

  if (!existsSync(vaultPath)) {
    return { validator: "routing", passed: true, errors: [], warnings: [], filesChecked: 0 };
  }

  // Check that every .md file in the vault lives within a recognized GTD folder
  const validPrefixes = DEFAULT_VAULT_FOLDERS.map((f) => f.toLowerCase());

  function scanDir(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden dirs, _raw, and template dirs
        if (entry.name.startsWith(".") || entry.name === "_raw" || entry.name === "templates") continue;
        scanDir(fullPath);
      } else if (entry.name.endsWith(".md")) {
        filesChecked++;
        const folder = getParentFolder(fullPath, vaultPath).toLowerCase();

        // Root-level files are acceptable (README, etc)
        if (folder === "") continue;

        // Check if the file is in a recognized folder
        const isValid = validPrefixes.some(
          (prefix) => folder === prefix || folder.startsWith(prefix + "/")
        );

        if (!isValid) {
          warnings.push({
            file: relative(vaultPath, fullPath),
            message: `File is outside recognized GTD folders: ${folder}`,
            severity: "warning",
          });
        }
      }
    }
  }

  scanDir(vaultPath);

  // Check for duplicates: same filename in both Inbox/Bee and a routed folder
  const inboxBeeDir = resolve(vaultPath, "00 Inbox/Bee");
  if (existsSync(inboxBeeDir)) {
    const inboxFiles = readdirSync(inboxBeeDir).filter((f) => f.endsWith(".md"));

    for (const file of inboxFiles) {
      // Check if a file with the same base name exists in Next Actions
      const baseName = file.replace(/_tasks\.md$/, "");
      const deepWork = resolve(vaultPath, "01 Next Actions/Deep Work");
      const quickWins = resolve(vaultPath, "01 Next Actions/Quick Wins");

      for (const targetDir of [deepWork, quickWins]) {
        if (!existsSync(targetDir)) continue;
        const targetFiles = readdirSync(targetDir);
        if (targetFiles.includes(file)) {
          errors.push({
            file: file,
            message: `Duplicate: exists in both 00 Inbox/Bee/ and ${relative(vaultPath, targetDir)}/`,
            severity: "error",
          });
        }
      }
    }
  }

  return {
    validator: "routing",
    passed: errors.length === 0,
    errors,
    warnings,
    filesChecked,
  };
}
