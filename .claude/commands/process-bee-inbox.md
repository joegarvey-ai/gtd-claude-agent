---
description: Process all pending Bee sentinels into redacted Obsidian notes (the reliable manual path)
---

Process my Bee inbox - drain every pending sentinel in `.kiro/bee-inbox/` in one pass.

Use the `bee-processor` subagent to:
1. Enumerate every `*.sentinel.md` in `.kiro/bee-inbox/` (ignore `.gitkeep`, `_staging/`, `_output/`). If none, report "Bee inbox is clear" and stop. Otherwise report the count.
2. For each sentinel: read `conversation_id` + `raw_path` (tolerate a leading UTF-8 BOM; translate the Windows path to its WSL `/mnt/c/...` form), run the idempotency guard (skip + still delete the sentinel if the conversation is already in the vault), and apply the completeness gate (process only COMPLETED + settled captures; leave partial/sparse ones and their sentinels).
3. Process each ready capture per the redaction policy and write the three outputs directly to the vault, using the folders from `.claude/bee-paths.local.json` (tasks, meeting notes, selective People notes, plus optional voice observations). Every task/meeting-note output carries `bee_conversation_id`.
4. Delete each sentinel only after its outputs land (partial captures keep their sentinel).
5. Summarize: N found -> M processed (slugs), K duplicates skipped, P left pending, sentinels remaining. Do not recap meeting contents.

If the user passed arguments ($ARGUMENTS), treat them as a scope hint (e.g. a specific conversation id, or "dry run" to enumerate and gate-check without writing).
