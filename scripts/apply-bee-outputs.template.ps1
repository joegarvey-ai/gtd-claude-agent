# Bee Capture Output Sync Script - Template
#
# This script handles the "last mile" of Bee capture processing: taking staged
# outputs from Kiro's processing directory and writing them into the Obsidian vault.
#
# WHY this exists:
# When your Obsidian vault lives outside the Kiro/Claude workspace (common with
# iCloud, OneDrive, or Dropbox-synced vaults on Windows), the AI agent can't
# directly write to the vault via MCP. Instead, it stages outputs in a workspace
# directory and this script handles the actual vault writes.
#
# The script handles three operations:
# 1. COPY - new files (tasks, meeting notes) are written directly
# 2. APPEND - existing People notes get new content prepended/appended without
#             overwriting existing sections
# 3. CLEANUP - sentinel files and staging directories are removed after success
#
# USAGE:
#   1. Replace [VAULT_PATH] with your Obsidian vault path
#   2. Replace [WORKSPACE_PATH] with your personal-assistant-kit workspace path
#   3. Run manually or let the Kiro hook invoke it after processing
#
# ============================================================

$ErrorActionPreference = "Stop"

# --- Configuration (replace these) ---
$vault = "[VAULT_PATH]"
# Example: "C:\Users\you\iCloudDrive\iCloud~md~obsidian"

$workspace = "[WORKSPACE_PATH]"
# Example: "C:\Users\you\Desktop\personal-assistant-kit-main"

$outputDir = "$workspace\.kiro\bee-inbox\_output"
$stagingDir = "$workspace\.kiro\bee-inbox\_staging"
$sentinelDir = "$workspace\.kiro\bee-inbox"

# --- Helper: Write UTF-8 without BOM ---
# Obsidian and most markdown tools expect UTF-8 without the byte-order mark.
# PowerShell's default Out-File adds a BOM, which can cause rendering issues.
function Write-Utf8File {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

# --- Helper: Read UTF-8 ---
function Read-Utf8File {
    param([string]$Path)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    return [System.IO.File]::ReadAllText($Path, $utf8NoBom)
}

# --- Ensure vault directories exist ---
$dirs = @(
    "$vault\00 Inbox\Bee",
    "$vault\05 Reference\Meeting Notes",
    "$vault\People"
    # Add your employer-specific meeting notes path:
    # "$vault\05 Reference\[EMPLOYER]\Meeting Notes"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

# --- Check for staged outputs ---
if (-not (Test-Path $outputDir)) {
    Write-Host "No output directory found at: $outputDir"
    Write-Host "Nothing to sync."
    exit 0
}

$outputFiles = Get-ChildItem -Path $outputDir -Recurse -File
if ($outputFiles.Count -eq 0) {
    Write-Host "Output directory is empty. Nothing to sync."
    exit 0
}

Write-Host ""
Write-Host "=== Syncing Bee outputs to vault ==="
Write-Host "Found $($outputFiles.Count) file(s) to process"
Write-Host ""

# --- Process each output file ---
foreach ($file in $outputFiles) {
    # Determine the relative path within the output directory
    $relativePath = $file.FullName.Substring($outputDir.Length + 1)
    $destPath = Join-Path $vault $relativePath

    # Ensure destination directory exists
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    # Read the staged content
    $content = Read-Utf8File -Path $file.FullName

    # Check for append-mode sentinel
    # When the Bee processor wants to UPDATE an existing People note rather than
    # overwrite it, it adds this header. The content below the header should be
    # appended/merged into the existing file.
    $appendSentinel = "_APPEND_MODE_SENTINEL_"

    if ($content.StartsWith($appendSentinel)) {
        # --- APPEND MODE ---
        # Strip the sentinel header
        $newContent = $content.Substring($appendSentinel.Length).TrimStart("`n", "`r")

        if (Test-Path $destPath) {
            $existingContent = Read-Utf8File -Path $destPath

            # Strategy: find section markers in the new content and insert/replace
            # in the existing file. For simplicity, this template appends before
            # the Archive section (if it exists) or at the end.
            $archiveMarker = "## Archive"
            if ($existingContent.Contains($archiveMarker)) {
                $merged = $existingContent.Replace(
                    $archiveMarker,
                    "$newContent`n`n$archiveMarker"
                )
            } else {
                $merged = "$existingContent`n`n$newContent"
            }

            # Update the last_updated frontmatter
            $today = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
            if ($merged -match "last_updated:.*") {
                $merged = $merged -replace "last_updated:.*", "last_updated: $today"
            }

            Write-Utf8File -Path $destPath -Content $merged
            Write-Host "[APPEND] $relativePath"
        } else {
            # File doesn't exist yet - write as new (strip sentinel)
            Write-Utf8File -Path $destPath -Content $newContent
            Write-Host "[NEW (from append)] $relativePath"
        }
    } else {
        # --- STANDARD COPY ---
        Write-Utf8File -Path $destPath -Content $content
        Write-Host "[COPY] $relativePath"
    }
}

# --- Delete processed sentinel files ---
Write-Host ""
Write-Host "=== Cleaning up sentinels ==="

$sentinels = Get-ChildItem -Path $sentinelDir -Filter "*.sentinel.md" -File
foreach ($s in $sentinels) {
    Remove-Item -Path $s.FullName -Force
    Write-Host "[DELETED] $($s.Name)"
}

if ($sentinels.Count -eq 0) {
    Write-Host "(no sentinels found)"
}

# --- Clean staging and output directories ---
Write-Host ""
Write-Host "=== Cleaning staging directories ==="

if (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Recurse -Force
    Write-Host "[CLEANED] _output/"
}

if (Test-Path $stagingDir) {
    Remove-Item -Path $stagingDir -Recurse -Force
    Write-Host "[CLEANED] _staging/"
}

# --- Summary ---
Write-Host ""
Write-Host "==================================================="
Write-Host "  Sync complete"
Write-Host "  Files written: $($outputFiles.Count)"
Write-Host "  Sentinels cleaned: $($sentinels.Count)"
Write-Host "==================================================="
