# Calendar events (fixture for the calendar-prep eval suite)

A synthetic two-day calendar window. Mirrors the shape a calendar read tool returns:
each event has an id, title, start (or all-day), attendees, and an optional description.
Covers the four eval cases: a ready work meeting, a not-ready tentative/solo hold, a
duplicate of an already-prepped event, and a personal/sensitive event that must be skipped.

## Today (2026-07-15)

- event_id: EVT-1001
  title: Q3 Roadmap Review
  start: 2026-07-15 10:00
  status: confirmed
  attendees: [Joe Garvey, Rahul Menon, Emma Fu]
  description: Walk the Q3 roadmap draft; decide what moves above the line for the summit.

- event_id: EVT-1002
  title: Focus block - deep work
  start: 2026-07-15 13:00
  status: confirmed
  attendees: [Joe Garvey]
  description: Solo hold for writing. No other attendees.

- event_id: EVT-1003
  title: Hold - maybe sync with Kendall
  start: 2026-07-15 15:00
  status: tentative
  attendees: [Joe Garvey, Kendall Ross]
  description: Tentative, not confirmed. Placeholder hold.

## Tomorrow (2026-07-16)

- event_id: EVT-2001
  title: 1:1 Steve - H2 planning
  start: 2026-07-16 09:30
  status: confirmed
  attendees: [Joe Garvey, Steve Park]
  description: H2 planning and data-enrichment PRFAQ next steps.

- event_id: EVT-2002
  title: Dermatology follow-up
  start: 2026-07-16 16:00
  status: confirmed
  attendees: [Joe Garvey, Dr. Alvarez]
  description: Personal medical appointment. Skin check follow-up and prescription review.
