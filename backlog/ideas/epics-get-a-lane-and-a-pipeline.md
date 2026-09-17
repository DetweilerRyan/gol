---
name: epics-get-a-lane-and-a-pipeline
title: Promote epics into backlog/epics/<name>/ and give them a pipeline that runs their ready children
created: 2026-09-17
---

## Situation

Under the 2026-09-16 board redesign an epic gets no folder: it stays an index file in
`backlog/ideas/` and its only work is the split. The first epic to run under that design,
`backlog-board-redesign`, was sequenced entirely by hand — the seat promoted and landed its
three children one at a time and hand-edited the index's rows after each landing. Nothing on
the board distinguished that running epic from any parked index in the same lane.

## Complication

A parked epic and a running epic read identically, and the process that progresses an epic's
children toward its goal exists nowhere — it lived in one session's judgment. The user ruled
2026-09-17 (superseding their own no-folder ruling of 2026-09-16): epics promote out of
`ideas/` like everything else.

## Question

What do the `backlog/epics/<name>/` folder and the Epic pipeline contain, so that one or more
connected ready items can be progressed toward a goal too uncertain or too large for a single
properly assessed backlog item?

## Answer

Shaped, per the user's 2026-09-17 direction:

- **Promotion moves an epic to `backlog/epics/<name>/`** instead of leaving it in `ideas/` —
  the lane's existence is what makes a running epic visible, the same directory-is-status
  logic as every other lane.
- **An Epic pipeline joins `pipelines.md`**, replacing its no-pipeline Epic section: it
  executes one or more of the epic's connected ready items, each child running its own kind's
  pipeline, with the epic supplying the cross-child sequencing the seat did by hand.
- **The folder holds the process and files needed to progress the children toward the goal** —
  at minimum the index (which becomes the epic's own file), and plausibly the goal statement,
  the child roster with states, and the cross-child sequencing plan.

## No-gos

- A child still assesses and promotes on its own merits — the epic connects ready items, it
  does not exempt them from the definition of ready.

## Open questions

- What exactly lives in `epics/<name>/` — is the promoted index the `proposal.md` analogue,
  and do the goal, roster, and sequencing get their own files or sections?
- How does an epic complete — a `done/` move and a retrospective like any item, an own
  `slice/` tag beside its children's, or closure when its last child lands?
- The reversal's reach: `definition-of-ready.md`'s epic disposition ("the parent stays in the
  `ideas/` lane as an index"), the slice check's index exemption, CLAUDE.md's board section,
  `pipelines.md`'s Epic section, and the kind-to-folder rule in the board docs all state the
  no-folder form and would move together.
- Does the epic's cross-child sequencing land as a `tasks.md` analogue — the dispatch-plan
  shape the reevaluation ruled for multi-unit items — or as its own artifact?
- Does `ls backlog/epics/` join `ls backlog/ready/` as "the board"?
