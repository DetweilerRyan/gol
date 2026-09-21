---
name: epics-promote-to-their-own-lane
title: Promote epics into backlog/epics/<name>/ and track their children in a checkbox roster
created: 2026-09-17
---

## Situation

Under the 2026-09-16 board redesign an epic gets no folder: it stays an index file in
`backlog/ideas/` and its only work is the split. The first epic to run under that design,
`backlog-board-redesign`, was sequenced entirely by hand — the seat promoted and landed its three
children one at a time and hand-edited the index's rows after each landing. Nothing on the board
distinguished that running epic from any parked index in the same lane.

The user ruled 2026-09-17, superseding their own no-folder ruling of 2026-09-16: epics promote out
of `ideas/` like everything else.

## Complication

A parked epic and a running epic read identically. Neither `ls backlog/ideas/` nor any other board
command answers which epics are in flight, what work each one carries, or how far along that work
is. The seat reconstructs all three by reading an index file and comparing its prose against the
other lanes.

## Question

What does `backlog/epics/<name>/` hold, so that the epic's own goal, its children, and each child's
current state are readable at a glance rather than reconstructed?

## Answer

Shaped, per the user's 2026-09-21 direction.

- **Promotion moves an epic to `backlog/epics/<name>/`** instead of leaving it in `ideas/`. The
  lane's existence is what makes a running epic visible, the same directory-is-status logic every
  other lane uses.
- **The epic's status is derived on demand, never stored.** The seat is asked where an epic stands
  and answers by reading the board — each child's lane directory already is its state — printing
  the result in chat. Ruled by the user 2026-09-21, replacing a stored checkbox table. A stored
  status is a census of external state with no gate behind it, which is the form that has gone
  false repeatedly in this corpus; a derived one cannot drift because it is never written down.
- **The folder holds what the board cannot derive**, which is the epic's goal and the membership
  that makes a set of children one epic.
- **The promoted index becomes the epic's own file**, carrying that goal.

## No-gos

- **No Epic pipeline.** Ruled out of this idea by the user on 2026-09-21 and split to
  `epic-pipeline-runs-the-children`. This idea gives an epic a lane and a readable roster; it does
  not say how the children get executed, and `pipelines.md`'s Epic section is untouched by it.
- A child still assesses and promotes on its own merits. The epic gathers ready items; it does not
  exempt them from the definition of ready.

## Open questions

- **Where does membership live — in the epic, or in each child?** Status is now derived, but which
  children belong to an epic is not derivable from anything the board holds today. If the epic
  names its children, that list is a roster of external state and goes stale on any rename. If each
  child's frontmatter names its epic, membership travels with the child and the roster derives like
  the status does, at the cost of a third frontmatter fact beside `name` and `kind`. The second
  form is the one this repo's own claim discipline argues for, and it is unruled.
- What exactly lives in `epics/<name>/` — is the promoted index the `proposal.md` analogue, and
  does the goal get its own file or a section?
- **What does the derived answer look like?** A status the seat prints is a report with no fixed
  shape, and an unshaped report is one a reader cannot compare against last week's.
- How does an epic complete: a `done/` move and a retrospective like any item, its own `slice/` tag
  beside its children's, or closure when its last child lands?
- Does `ls backlog/epics/` join `ls backlog/ready/` as "the board"?
- **The reversal's reach was measured short.** The idea named five corpus surfaces stating the
  no-folder form; a check on 2026-09-21 found eight. Beyond `definition-of-ready.md`'s epic
  disposition, CLAUDE.md's board section, `pipelines.md`'s Epic section and the slice check's index
  exemption, three more encode it: `.claude/skills/idea-promote/` has no epic branch at all,
  `.claude/skills/idea-assess/SKILL.md` instructs the judge that an Epic names its children and
  nowhere else, and `definition-of-ready.md` states the form a third time where it rules an epic's
  trace to be its index sections and children.
- Under the rule in force today this file stays in `ideas/` as an index — the convention it
  proposes to abolish — so it would be the last file to sit there under the old rule.
