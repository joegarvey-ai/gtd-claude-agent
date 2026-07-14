# Add a new agent

A copy-executable checklist for adding an agent to this kit without reintroducing drift.
It builds on the orchestration foundation: the reusable template (`.claude/agents/_AGENT-TEMPLATE.md`),
the information-sharing contract in `CLAUDE.md`, and the shared identity file
(`context/context-pack.md`). Follow the nine steps in order. Two hard gates near the end are
non-negotiable.

Everything here honors the voice rule (no em dashes, no contrast hooks, no defensive framing)
and the human-in-the-loop tiers. A new agent defaults to Tier 0 (unattended writes to the
vault only, never send/post/delete).

## The nine steps

1. **Copy the template.** Copy `.claude/agents/_AGENT-TEMPLATE.md` to `.claude/agents/<agent-name>.md`.
   The template already bakes in the seven anti-drift guards (completeness gate, idempotency,
   self-verify, close-the-loop, reconcile-and-report, least-privilege tools, tier/safety).
   Fill every `<angle-bracket>`; do not remove a guard.

2. **Write the description as the routing table.** The `description` frontmatter is one crisp
   sentence: the single job plus the exact trigger phrases that should invoke it. Those phrases
   ARE the routing table. Set `tools:` to least privilege (a Tier-0 agent gets no send/post/
   delete/ticket-write tools). Keep `model: sonnet`.

3. **Assign exactly ONE output folder.** Give the agent a single folder it owns and add a row
   to the one-writer-per-folder table in `CLAUDE.md`. If the agent needs a folder another agent
   already owns, redesign the split; do not co-own. (See the one-writer-per-folder invariant in
   `CLAUDE.md`.)

4. **Define the completeness gate, dedup key, and output frontmatter.** State a deterministic
   "ready" condition (when PowerShell is in the loop, reuse a `bee-lib.ps1`-style gate like
   `Test-BeeCaptureReady`; otherwise a precise prose condition). Pick a dedup key. Every output
   carries `type:`, `date:`, `source: <agent>`, and the dedup key in frontmatter (the provenance
   contract; going forward only, no backfill).

5. **Point at the shared identity, do not restate it.** Add a "Load context first" step that
   reads `context/context-pack.local.md` if present, else `context/context-pack.md`, for identity
   and voice. Do not restate voice rules inline; the pack is the single source.

6. **If it runs unattended, clone the parametrized runner.** Clone a headless runner
   (`{command, allowedTools, logfile, addDir}`). When the output lives outside the repo cwd
   (the vault does), set `--add-dir` to the WSL-translated vault path and end the inner command
   with `< /dev/null` so a headless run cannot hang on stdin. Clone the installer schedule
   pattern if you register a task. Author `.ps1` files with CRLF line endings and clean ASCII.

7. **Pick the loosest trigger that meets the latency need.** Prefer poll-by-frontmatter (glob
   the vault for `type: X` newer than last run; zero coupling). Use a status-flag flip next. Use
   an event seam (`.agent-inbox/<consumer>/` once a second event consumer exists) only when
   near-real-time latency actually matters. Do not reach for a sentinel by default. (See the
   triggers decision-rule in `CLAUDE.md`.)

8. **Write an eval suite.** Add `evals/suites/<agent>.ts` covering four cases at minimum: the
   happy path, a not-ready input that is skipped, the same dedup key twice not double-writing,
   and a sensitive/personal input that is redacted. Register it in `evals/suites/run-all.ts`.
   Load the SHIPPED agent file as the system prompt (test the real artifact, not an inline
   re-implementation). It must pass on Sonnet before the agent runs unattended.

9. **Set the tier explicitly.** Tier 0 writes to the vault only. Tier 1 drafts and waits for
   approval before sending. Tier 2 is human-led (HR, performance, ratings, promo) and never runs
   unattended. State the tier in the agent file's "Tier & safety" section.

## Two hard gates

- **Gate 1 - tool parity.** The runner's `--allowedTools` list must exactly match the agent's
  declared `tools:` frontmatter. A mismatch is the drift the audit flagged between `taskei-ops.md`
  and `run-taskei-radar.ps1`. Same set, both sides.

- **Gate 2 - no green Sonnet eval, no Tier-0 promotion.** An agent does not get wired into a live
  schedule (or a real write-capable MCP config) until its eval suite passes on Sonnet. Scaffolding
  the files is not promotion; promotion is a separate, gated action.

---

## Worked example: adding a `calendar-prep` Tier-0 agent

`calendar-prep` reads today's and tomorrow's calendar and writes one prep note per meeting that
needs prep, feeding the daily plan. The three files below were produced by following the checklist
and ship in this repo as a reference implementation. Per Gate 2, promoting it to a live scheduled
job is deferred until its eval suite passes on Sonnet.

**Step 1 - copied** `.claude/agents/_AGENT-TEMPLATE.md` to `.claude/agents/calendar-prep.md`.

**Step 2 - description as routing table** (filled):

```yaml
description: >-
  Reads today's and tomorrow's calendar and writes one prep note per meeting that
  needs prep, so the daily plan can point at ready-made briefs. Invoke with "prep my
  day", "calendar prep", or "prep my meetings". Reads the calendar and writes prep
  notes to the ONE folder it owns. Never books, edits, declines, or sends anything.
tools: Read, Write, Glob, Grep
model: sonnet
```

**Step 3 - one owned folder.** `calendar-prep` owns `05 Reference/Calendar Prep/`, added to the
one-writer-per-folder table in `CLAUDE.md` with `Calendar Prep` as the sole writer. (Adopters set
their own vault-relative path; the maintainer's real vault uses its own layout, kept out of the
tracked public files.)

**Step 4 - completeness gate, dedup key, frontmatter.** Gate: a meeting is READY iff it has a
confirmed start time AND at least one other attendee (a solo hold or all-day block is not prepped).
Dedup key: `event_id`. Output frontmatter: `type: calendar-prep`, `date:`, `source: calendar-prep`,
`event_id:`.

**Step 5 - identity.** The agent's "Load context first" step reads `context/context-pack.md`
(`.local` preferred); it does not restate voice rules.

**Step 6 - runner.** `scripts/run-calendar-prep.ps1`, cloned from the parametrized headless runner:
`command=/calendar-prep`, `allowedTools='Read Write Glob Grep'`, `logfile=calendar-prep.log`,
`addDir=<vault WSL path>`. It carries both the `--add-dir` grant and the trailing `< /dev/null`.
The `allowedTools` string is identical to the agent's `tools:` line (Gate 1).

**Step 7 - trigger.** Poll-based: the agent globs its owned folder for existing `event_id`s and
writes only the missing ones. No sentinel. (A live schedule would be a Windows task, deferred per
Gate 2.)

**Step 8 - eval suite.** `evals/suites/calendar-prep.ts`, registered in `run-all.ts`, with the four
required cases: (1) happy path preps a confirmed multi-attendee meeting, (2) a solo hold and a
tentative event are skipped as not-ready, (3) a duplicate `event_id` does not double-write, (4) a
personal medical appointment is redacted (skipped, no detail surfaced). It loads the shipped
`.claude/agents/calendar-prep.md` as the system prompt.

**Step 9 - tier.** Tier 0 (unattended writes to the vault only; no calendar-write, send, or delete).

**Gates:** the runner `allowedTools` equals the agent `tools:` (Gate 1). The agent is NOT wired to
a live schedule or a calendar-MCP write config; that waits on a green Sonnet eval (Gate 2).

**Not yet live.** `calendar-prep` is a reference scaffold. To promote it: run
`npx tsx evals/suites/calendar-prep.ts` on Sonnet, confirm it passes, then (and only then) install a
scheduled task from `scripts/run-calendar-prep.ps1` and grant the calendar read tools it needs.
