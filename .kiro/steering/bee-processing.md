---
inclusion: fileMatch
fileMatchPattern: '**/.kiro/bee-inbox/**'
---

## Bee Capture Processing

You process raw lifelog data captured by the user's [Bee](https://bee.computer) wearable. Raw captures land in `05 Reference/Bee/_raw/` in the user's Obsidian vault via the `bee` CLI. The sync scripts detect genuinely-changed captures and drop a sentinel file at `.kiro/bee-inbox/<conversation-id>.sentinel.md` inside the workspace. Your job is to read the sentinel, read the raw capture from the vault path, redact sensitive content, and produce three distinct outputs in the vault.

**Never edit files in `_raw/`.** Treat that folder as an immutable source of truth. All output goes elsewhere.

---

## Redaction Policy

Apply judgment, not keyword matching. Exclude any content that is:

- **Intimate** — romantic, sexual, or private partner-only conversation
- **Personal/medical** — health conditions, medications, therapy, mental health details about the user or anyone mentioned
- **Family-private** — parenting disputes, family conflicts, finances discussed in a family context, anything about minors
- **Third-party-sensitive** — information about people who clearly did not consent to being recorded (strangers, overheard conversation, personal disclosures not directed at the user)

When in doubt, exclude and note the skip in your processing summary. Do not paraphrase redacted content — omit it entirely.

If the **entire capture** is personal/intimate/private, write nothing to the three output locations. Note the skip and stop.

---

## Three Outputs Per Capture

For each raw meeting/conversation, produce up to three artifacts. Skip any that don't apply.

### 1. Tasks → `00 Inbox/Bee/YYYY-MM-DD_<meeting-slug>_tasks.md`

- One file per meeting, named with the meeting date and a short slug
- Contains **only** action items, commitments, and follow-ups surfaced during the meeting
- **Stack-ranked** by urgency × importance (most urgent/important first)
- Each task as a checkbox with one line of context

**Format:**
```markdown
---
source: bee
meeting_date: YYYY-MM-DD
meeting_slug: <slug>
bee_conversation_id: <id>
created: <ISO timestamp>
---

# Tasks from <Meeting Title> (<YYYY-MM-DD>)

<!-- Stack-ranked: most urgent/important first -->

- [ ] **<Task>** — <who it's for / why it matters / deadline if mentioned>
- [ ] **<Task>** — <context>
```

If there are no action items, don't create this file.

### 2. Meeting Notes

Decide work vs personal using judgment:

- **Work meeting** → `05 Reference/[EMPLOYER]/Meeting Notes/YYYY-MM-DD_<meeting-slug>.md`
- **Personal meeting** → `05 Reference/Meeting Notes/YYYY-MM-DD_<meeting-slug>.md`

Replace `[EMPLOYER]` with the user's employer folder name (e.g. `Amazon`). If the user doesn't want the work/personal split, route everything to `05 Reference/Meeting Notes/`.

Most Bee captures are work. Signals of a work meeting: colleagues present, business topics, work projects, customer/partner discussions, work-internal terminology. Signals of personal: friends/family, hobbies, non-work planning, social contexts. When ambiguous, default to work and note the ambiguity in "Things to Keep in Mind."

- Cleaned, structured summary of what happened
- This is reference material, not action material — no task duplicates

**Required sections (omit sections with no content):**
```markdown
---
source: bee
meeting_date: YYYY-MM-DD
meeting_slug: <slug>
participants: [<Name>, <Name>]
bee_conversation_id: <id>
created: <ISO timestamp>
---

# <Meeting Title> — <YYYY-MM-DD>

## Topic Summary
<2–4 sentence plain-language summary of what was discussed>

## Key Decisions
- <Decision made, by whom, with rationale if stated>

## Conflict & Divergence
<Disagreements, unresolved tensions, differing viewpoints. Omit this section if none detected.>

## Things to Keep in Mind
<Non-actionable context worth remembering — constraints, dependencies, political sensitivities, watch-outs>

## Takeaways
<The user's likely takeaways — what this means for them going forward>
```

### 3. People Notes → `People/<First Last>.md`

For each **high-signal** person in the meeting, create or update their People note. Be selective:

- **Create a People note when** there's enough signal to populate at least 3 sections meaningfully (Role & Context, plus observations of two other dimensions like Communication Style, Decision-Making Pattern, or Collaboration Notes)
- **Skip People notes for fly-by participants** who appeared briefly with no substantive characterization. Instead, mention them in the meeting note's "Things to Keep in Mind" section
- **Always exclude the user themselves** from standard people notes — see "User's own note" below

For each kept person:

- **If the file doesn't exist**, create it from the template below
- **If the file exists**, update the relevant structured sections in place. Do not overwrite unrelated content.

**Template for a new People note:**
```markdown
---
source: bee-initialized
created: <ISO timestamp>
last_updated: <ISO timestamp>
---

# <First Last>

## Role & Context
<Title, organization, how they relate to the user's work — one paragraph>

## Communication Style
<How they talk, tone, pace, directness, written vs verbal preferences>

## Decision-Making Pattern
<How they decide — data-driven, consensus-seeking, intuitive, risk-averse, etc.>

## Collaboration Notes
<How the user should work with them — what works, what doesn't, what to avoid>

## Recent Topics
<!-- Rolling last 10 meetings, most recent first. Older entries move to Archive. -->
- **<YYYY-MM-DD>** — <topic>, <what was discussed/decided> ([[Meeting Notes link]])

## Open Threads
<Things in-flight between the user and this person — waiting-fors, pending decisions, open questions>

## Archive
<!-- Rolling: Recent Topics older than the last 10 entries move here -->
```

**Update rules:**
- **Recent Topics** is capped at 10 entries. When adding an 11th, move the oldest into Archive.
- **Communication Style**, **Decision-Making Pattern**, and **Collaboration Notes** are evolving paragraphs. Refine them with new observations; don't append blindly. If a new observation contradicts the existing note, note both with a date stamp.
- **Open Threads** — add new ones, remove resolved ones
- Always update `last_updated` in frontmatter

**User's own note (`People/<User Name>.md`):**
- Treat as the master self-reference. Enrich with new facts learned about the user from meetings (stated preferences, commitments they made, reactions under pressure, etc.).
- Do **not** add "Recent Topics" to the user's own note — meetings are already captured in `Meeting Notes/`.
- If the existing file uses a custom structure (not the Bee-processor schema), **append** a new `## Observed Patterns (from Bee captures)` section at the end rather than rewriting existing sections.

---

## Processing Workflow

### When triggered by a sentinel file (auto-process mode)

The sync scripts drop a sentinel file at `.kiro/bee-inbox/<conversation-id>.sentinel.md` whenever a new or updated raw capture appears. The sentinel's frontmatter includes:

- `raw_path` — absolute path to the raw capture in the vault (lives outside the workspace)
- `conversation_id` — the Bee conversation ID
- `auto_process: true` — a flag indicating you should write outputs directly, without proposing

When auto-processing, follow this flow:

1. Read the sentinel to get `raw_path` and `conversation_id`
2. Read the raw capture via PowerShell (`Get-Content -Raw`) since it's outside the workspace
3. Apply the redaction policy and generate the slug
4. **Skip the "propose before writing" step.** Write tasks, meeting notes, and affected People notes directly.
5. Be selective on People notes: only create new notes for high-signal people (context for ~3+ substantive sections). For fly-by participants, mention them in "Things to Keep in Mind" but don't stub a People note.
6. **Delete the sentinel file** after writing outputs
7. Summarize in one or two sentences what was written and where — no recap of meeting content

### When triggered by direct user request (propose mode)

When the user manually asks you to process a specific capture (not via a sentinel):

1. **Read** the raw file fully before deciding anything
2. **Assess redaction** — is the entire capture personal? If yes, skip and note. If partial, redact specific sections.
3. **Identify participants** — who was there, who was named
4. **Generate the meeting slug** — 2–4 lowercase hyphenated words capturing the topic (e.g., `q2-roadmap-review`, `1on1-sarah`)
5. **Draft the three outputs** in memory
6. **Propose before writing** — show the user the three file paths, the redaction decisions, and a one-line preview of each. Wait for confirmation.
7. **Write the files** (create directories as needed)
8. **Update affected People notes** — do these last since they aggregate across meetings
9. **Summarize** what you did: files created, files updated, content redacted, people touched

---

## Edge Cases

- **No clear meeting boundary** — if the raw file is a jumble of short interactions, group by conversation ID and process each separately
- **Unknown participant** — if a name was mentioned but you can't tell if it's a first name, last name, or role, note this in the meeting's "Things to Keep in Mind" section and do not create a speculative People note
- **Ambiguous task owner** — default to the user. Flag in the task description if ownership is unclear.
- **Duplicate task across meetings** — check `00 Inbox/Bee/` for existing task files from the last 7 days; if the same commitment appears, reference the existing file rather than duplicating
- **Hard-to-redact content** — if judgment is genuinely unclear, err on the side of excluding from People and Meeting Notes but ask before dropping any potential action items
- **Transcript lacks speaker diarization** — the Bee CLI does not currently label speakers. Infer from context, note the limitation in "Things to Keep in Mind", and treat specific quote attribution as probabilistic.

---

## Consumption by GTD Assistant

The outputs in `00 Inbox/Bee/` flow through normal GTD inbox processing — the GTD assistant handles routing from `00 Inbox/Bee/` into `01 Next Actions/` just as it would any other inbox item. Meeting Notes and People notes are reference material the GTD assistant reads during weekly reviews and contextual lookups. No coordination is needed between the two systems; they communicate through the vault.
