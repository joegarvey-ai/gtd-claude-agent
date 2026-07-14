# Context Pack - [YOUR NAME] / Personal Assistant Kit

> The canonical description of the user and their world. **Every agent in this kit loads this file.** Do not re-derive who the user is; read this. Keep it current: when a fact here changes, update it once and every agent inherits the change.
>
> **Local override:** if `context/context-pack.local.md` exists, agents read that instead of this file. Put your real, personal details in the `.local` copy (it is gitignored); keep this tracked file generic and `[BRACKETED]` so the public repo carries no personal data. This mirrors how the Bee consumer prefers `.claude/bee-paths.local.json` over the tracked `.claude/bee-paths.example.json`.

_Last updated: [DATE]_

---

## Who

- **[YOUR NAME]** (username `[USERNAME]`). **[ROLE]** at **[EMPLOYER]**.
- Reports to **[MANAGER]** (omit if not relevant).
- [One line of any other standing identity fact an agent should never have to re-derive.]

## What you own / current focus

- **[AREA 1]** - [one line].
- **[AREA 2]** - [one line].
- **[AREA 3]** - [one line].
- Keep this list short and current. It is context for prioritization, not a full project inventory.

## Systems of record

- **Obsidian vault** - long-term memory and publishing surface. The vault path is machine-specific; agents derive it at runtime (from a sentinel's `raw_path` or a path map) rather than hardcoding it. Planning and durable notes live here.
- **[EMAIL / CALENDAR MCP]** - read/triage mail, read calendar. Writes (send, book) are proposed, never automatic.
- **[CHAT MCP]** - read channels/DMs; replies are draft-only.
- **[PM TOOL MCP]** - task/ticket system ([Taskei / Jira / Linear / etc.]); reads are automatic, writes are proposed.

## Voice and writing style (apply to anything user-facing or published)

- **No em dashes.** Use commas, periods, or parentheses.
- **No contrast hooks** ("It's not X, it's Y" / "The best part isn't X"). State the point directly.
- **No defensive framing.** Evidence speaks; do not pre-empt objections or add trailing "to be clear" defenses.
- Direct and concise; lead with the answer or action. Plain language. Full names, never @handles, in anything that could land in a report or published note.

## Safety tiers (hard constraints)

- **Tier 0 - unattended:** reads and digests run automatically; writes go only to the vault (never send/post/delete). This is the default for a new agent.
- **Tier 1 - drafts and waits:** the agent drafts the send/post/write and waits for the user's explicit approval before acting.
- **Tier 2 - human-led:** anything HR-adjacent, performance, ratings, or promo. The agent assists and assembles only; it never decides or files. Never unattended.
- When uncertain which tier applies, choose the more conservative one.
