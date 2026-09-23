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
- **The folder holds what the board cannot derive**, which is the epic's goal and the order its
  children run in.
- **The epic names its children as a sequence, not a set.** Ruled by the user 2026-09-21: an epic
  may have to sequence its children, and a spike that runs first can change what a later child
  should be. Order and cross-child dependency are properties of the set rather than of any member,
  so no child can carry them and nothing on the board can derive them.
- **Each child's frontmatter names its epic too, and the duplication is deliberate.** Membership
  then travels with the child, so a child read on its own says what it belongs to. Two independent
  statements of one fact are also **checkable**, where a single roster is not: the children
  claiming an epic and the children that epic names must be the same set, and a mismatch is
  mechanically findable. A single source of membership can only be trusted.
- **The promoted index becomes the epic's own file**, carrying the goal and the sequence.
- **The process pipeline gains standing over `board-lanes.config.json`.** Ruled by the user
  2026-09-22. A lane the corpus instructs a reader to use, and which the classifier does not
  declare, draws `undeclared lane, 0 checks` — measured 2026-09-22 on a probe under
  `backlog/epics/`. So declaring the lane and documenting it are one change, and the pipeline that
  documents it must be able to declare it.

  **The three roles need different things, and only one of them writes.** `writer` gains the file
  in its write surface, beside `role-cycles.config.json`, which is the precedent: a tracked
  declaration the corpus instructs against. `coach` gains standing to name it in a spec, since its
  own file forbids it editing anything and its specs name what `writer` edits. `editor` gains it
  inside a `writer` manifest for CLEAN, which is where its scope already comes from.

  **This is a boundary change**, so it runs the process pipeline on its own terms rather than
  riding in as a side edit of the lane work.

## No-gos

- **No Epic pipeline.** Ruled out of this idea by the user on 2026-09-21 and split to
  `epic-pipeline-runs-the-children`. **The split is between the plan and its execution**: this idea
  gives the epic a lane and lets its file state the goal and the child sequence, and it says
  nothing about who reads that sequence, when a child is dispatched, or what a child's landing
  obliges. `pipelines.md`'s Epic section is untouched by this idea.
- A child still assesses and promotes on its own merits. The epic gathers ready items; it does not
  exempt them from the definition of ready.

## Open questions

- **Does the standing ruling reach the schema, and does it reach further than this lane?**
  `board-lanes.config.json` has a sibling at `schemas/board-lanes.schema.json`, and a lane entry
  that the schema refuses is as useless as one the classifier refuses. The ruling names the config
  and not the schema. It also names one file rather than a class, so the next tracked declaration
  the corpus instructs against raises the same question again.
- **Does anything check the two membership statements against each other?** They are only worth
  duplicating because they can disagree detectably, and nothing on this board is gated. The check
  is cheap — the set of children naming an epic against the set that epic names — but it has no
  home, since `backlog/` has no checker and a board-rendering script would owe `scripts/` its full
  quality bar.
- **What happens to the epic's sequence when a child is renamed or dropped?** The child's own
  frontmatter survives a rename of itself; the epic's ordered list does not. That is the residual
  staleness the duplication does not remove, and it is the half a checker would catch.
- **Does the epic's frontmatter need `kind: epic` once the lane carries it?** The directory is the
  lane under this board's own rule, and an epic in `backlog/epics/` states its kind by sitting
  there. Deciding otherwise puts one fact in two places without the checkability that justifies it
  for membership.
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
