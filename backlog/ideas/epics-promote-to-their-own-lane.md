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
- **The folder carries a roster of the epic's children as a checkbox table**, so the epic's own
  file answers what work belongs to it and where each piece has got to. A child's state is already
  a fact the board holds in its lane directories; the roster's job is to gather it in one place
  rather than to become a second source of truth for it.
- **The promoted index becomes the epic's own file**, carrying the goal that makes the children one
  epic rather than a list.

## No-gos

- **No Epic pipeline.** Ruled out of this idea by the user on 2026-09-21 and split to
  `epic-pipeline-runs-the-children`. This idea gives an epic a lane and a readable roster; it does
  not say how the children get executed, and `pipelines.md`'s Epic section is untouched by it.
- A child still assesses and promotes on its own merits. The epic gathers ready items; it does not
  exempt them from the definition of ready.

## Open questions

- **Does the roster stay true by hand, and is that acceptable?** A checkbox that disagrees with the
  lane directories is worse than no checkbox, and nothing on this board is checked by a gate. The
  cheapest honest form may be one that a reader can falsify against `ls` in a second.
- What exactly lives in `epics/<name>/` — is the promoted index the `proposal.md` analogue, and do
  the goal and the roster get their own files or sections?
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
