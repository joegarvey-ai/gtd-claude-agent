---
inclusion: fileMatch
fileMatchPattern: '**/05 Reference/Bee/_raw/**'
---

## Bee Capture Processing

You are processing raw lifelog data captured by [YOUR_NAME]'s Bee wearable. Raw captures land in `05 Reference/Bee/_raw/` via the `bee` CLI. Your job is to read the raw file, redact sensitive content, and produce three distinct outputs in the Obsidian vault.

**Never edit files in `_raw/`.** Treat that folder as an immutable source of truth. All output goes elsewhere.

---

## Redaction Policy

Apply judgment, not keyword matching. Exclude any content that is:

- **Intimate** — romantic, sexual, or private partner-only conversation
- **Personal/medical** — health conditions, medications, therapy, mental health details about [YOUR_NAME] or anyone mentioned
- **Family-private** — parenting disputes, family conflicts, finances discussed in a family context, anything about minors
- **Third-party-sensitive** — information about people who clearly did not consent to being recorded (strangers, overheard conversation, personal disclosures not directed at [YOUR_NAME])

When in doubt, exclude and note the skip in your processing summary. Do not paraphrase redacted content — omit it entirely.

If the **entire capture** is personal/intimate/private, write nothing to the three output locations. Note the skip and stop.

---

## Three Outputs Per Capture

For each raw meeting/conversation file, produce up to three artifacts. Skip any that don't apply.

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

Most Bee captures are work. Signals of a work meeting: colleagues present, business topics, work projects, customer/partner discussions, company-internal terminology. Signals of personal: friends/family, hobbies, non-work planning, social contexts. When ambiguous, default to work and note the ambiguity in "Things to Keep in Mind."

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
<[YOUR_NAME]'s likely takeaways — what this means going forward>
```

### 3. People Notes → `People/<First Last>.md`

For each **high-signal** person in the meeting, create or update their People note. Be selective:

- **Create a People note when** there's enough signal to populate at least 3 sections meaningfully (Role & Context, plus observations of two other dimensions like Communication Style, Decision-Making Pattern, or Collaboration Notes)
- **Skip People notes for fly-by participants** who appeared briefly with no substantive characterization. Instead, mention them in the meeting note's "Things to Keep in Mind" section
- **Always exclude [YOUR_NAME] themselves** from standard people notes — see "your own note" below

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
<Title, organization, how they relate to [YOUR_NAME]'s work — one paragraph>

## Communication Style
<How they talk, tone, pace, directness, written vs verbal preferences>

## Decision-Making Pattern
<How they decide — data-driven, consensus-seeking, intuitive, risk-averse, etc.>

## Collaboration Notes
<How [YOUR_NAME] should work with them — what works, what doesn't, what to avoid>

## Recent Topics
<!-- Rolling last 10 meetings, most recent first. Older entries move to Archive. -->
- **<YYYY-MM-DD>** — <topic>, <what was discussed/decided> ([[Meeting Notes link]])

## Open Threads
<Things in-flight between [YOUR_NAME] and this person — waiting-fors, pending decisions, open questions>

## Archive
<!-- Rolling: Recent Topics older than the last 10 entries move here -->
```

**Update rules:**
- **Recent Topics** is capped at 10 entries. When adding an 11th, move the oldest into Archive.
- **Communication Style**, **Decision-Making Pattern**, and **Collaboration Notes** are evolving paragraphs. Refine them with new observations; don't append blindly. If a new observation contradicts the existing note, note both with a date stamp.
- **Open Threads** — add new ones, remove resolved ones
- Always update `last_updated` in frontmatter

**[YOUR_NAME]'s own note (`People/[YOUR_NAME].md`):**
- Treat as the master self-reference. Enrich with new facts learned from meetings (stated preferences, commitments made, reactions under pressure, etc.).
- Do **not** add "Recent Topics" to this note — meetings are already captured in `Meeting Notes/`.
- Use the same structured sections but focused on self-knowledge to preserve.

---

## Processing Workflow

### When triggered by a sentinel file (auto-process mode)

The sync scripts (`bee-sync-scheduled.ps1` and `bee-stream-watcher.ps1`) drop a sentinel file at `.kiro/bee-inbox/<conversation-id>.sentinel.md` whenever a new or updated raw capture appears. The sentinel's frontmatter includes:

- `raw_path` — absolute path to the raw capture in the vault (lives outside the workspace)
- `conversation_id` — the Bee conversation ID
- `auto_process: true` — a flag indicating you should write outputs directly, without proposing

When auto-processing, follow this flow:

1. Read the sentinel to get `raw_path` and `conversation_id`
2. Stage the raw capture into `.kiro/bee-inbox/_staging/` so you can read it with readFile (necessary when the vault lives outside the workspace)
3. Apply the redaction policy and generate the slug
4. **Skip the "propose before writing" step.** Write tasks, meeting notes, and affected People notes to `.kiro/bee-inbox/_output/` mirroring the vault structure.
5. For People notes on users who already have existing notes, write in append-mode with an `_APPEND_MODE_SENTINEL_` header so the sync script preserves existing content.
6. Be selective on People notes: only create new notes for high-signal people (context for ~3+ substantive sections). For fly-by participants, mention them in "Things to Keep in Mind" but don't stub a People note.
7. Check if the capture state is still CAPTURING in the raw file — if so, note `capture_state: PARTIAL` in frontmatter and mention that the next sync will re-fire the sentinel when it completes.
8. Run the vault sync script (`scripts/apply-bee-outputs.template.ps1` or your customized version) to copy outputs to the vault, append to existing People notes, and clean up.
9. **Delete the sentinel file** after outputs are synced
10. Summarize in one or two sentences what was written and where — no recap of meeting content

If multiple sentinels are present, process them all in a single pass (write all outputs, then sync once).

### Writing Style Guide update (fourth output — optional)

After processing each capture, check whether any observations about the user's communication patterns are worth recording. If you maintain a Writing Style Guide (e.g., `05 Reference/Writing Style Guide & Rules.md`), update the "Voice Analysis from Bee Transcripts" section at the bottom. This section has three subsections:

- **Strengths to Preserve in Writing** — patterns that work well verbally and should carry into written voice
- **Patterns to Correct in Writing** — verbal habits that don't serve written communication
- **Calibration Notes for Agents Writing on Behalf** — specific guidance for AI agents drafting content as the user

**Rules for this update:**
- **Read the existing section first.** Do not duplicate observations already captured. Refine, adjust, or replace existing bullets if new evidence strengthens or contradicts them.
- **Only add genuinely new patterns.** One meeting rarely surfaces a new pattern. Look for patterns that appear across multiple meetings or that are strikingly clear in a single meeting.
- **Keep it tight.** Each bullet should be one concrete observation with one concrete writing implication. No filler.
- **Update the "Last updated" date at the bottom of the section.**
- **If no style-relevant observations emerge from a capture, skip this step entirely.** Most meetings won't produce style updates.

To enable this output, create a Writing Style Guide note in your vault with the three subsections listed above. If the file doesn't exist, this step is skipped.

### When triggered by direct user request (propose mode)

When [YOUR_NAME] manually asks you to process a specific capture (not via a sentinel):

1. **Read** the raw file fully before deciding anything
2. **Assess redaction** — is the entire capture personal? If yes, skip and note. If partial, redact specific sections.
3. **Identify participants** — who was there, who was named
4. **Generate the meeting slug** — 2–4 lowercase hyphenated words capturing the topic (e.g., `q2-roadmap-review`, `1on1-sarah`)
5. **Draft the three outputs** in memory
6. **Propose before writing** — show the three file paths, the redaction decisions, and a one-line preview of each. Wait for confirmation.
7. **Write the files** (create directories as needed)
8. **Update affected People notes** — do these last since they aggregate across meetings
9. **Summarize** what you did: files created, files updated, content redacted, people touched

---

## Completeness gate (verify before writing)

The sync scripts already gate on this and only write a sentinel for a capture that is COMPLETED and settled — but **re-verify it yourself before writing any Meeting Note**, as a backstop:

1. Read the raw capture's top metadata block (the `- key: value` bullets under the `# Conversation <id>` heading).
2. **Only process when `state: COMPLETED` AND `end_time` is a real timestamp (not `n/a`).** If `state: CAPTURING` or `end_time: n/a`, the meeting isn't finished — do NOT write outputs. Note it as still capturing and stop; the next sync will re-fire when it completes.
3. Bee enriches a capture (Summary, Key Takeaways, Suggested Links) for a short window after it completes. If the capture looks sparse (e.g. only a Short Summary, no body sections) even though state is COMPLETED, prefer to wait — process on the next pass once the sections have filled in.

A capture stuck in `CAPTURING` for a long time (the sync tracks these in `stuck-captures.json`) is likely abandoned — leave it for manual review rather than processing partial content.

---

## Edge Cases

- **No clear meeting boundary** — if the raw file is a jumble of short interactions, group by conversation ID and process each separately
- **Unknown participant** — if a name was mentioned but you can't tell if it's a first name, last name, or role, note this in the meeting's "Things to Keep in Mind" section and do not create a speculative People note
- **Ambiguous task owner** — default to [YOUR_NAME]. Flag in the task description if ownership is unclear.
- **Duplicate task across meetings** — check `00 Inbox/Bee/` for existing task files from the last 7 days; if the same commitment appears, reference the existing file rather than duplicating
- **Hard-to-redact content** — if judgment is genuinely unclear, err on the side of excluding from People and Meeting Notes but ask before dropping any potential action items

---

## Consumption by gtd-assistant

The outputs in `00 Inbox/Bee/` flow through normal GTD inbox processing — the gtd-assistant steering handles routing from `00 Inbox/Bee/` into `01 Next Actions/` just as it would any other inbox item. Meeting Notes and People notes are reference material the gtd-assistant reads during weekly reviews and contextual lookups. No coordination is needed between the two systems; they communicate through the vault.
