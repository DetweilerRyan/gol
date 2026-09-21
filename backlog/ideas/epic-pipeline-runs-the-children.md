---
name: epic-pipeline-runs-the-children
title: Give pipelines.md an Epic pipeline that sequences an epic's children toward its goal
created: 2026-09-21
---

## Situation

`.claude/references/pipelines.md` carries a class of service per backlog item kind, and its Epic
section states that an epic runs no pipeline: the epic splits, and each child then runs its own
kind's pipeline independently.

`backlog-board-redesign` was the first epic to run under that design. The seat promoted and landed
its three children one at a time, choosing the order and the moment for each, and recorded none of
that reasoning anywhere the next epic could read it.

## Complication

The cross-child sequencing an epic needs exists nowhere. It lived in one session's judgment and
left with it. So the second epic re-derives what the first one worked out, and neither the order
nor the reasoning behind it is reviewable.

The per-child pipelines are not the gap — each child already has a class of service. What is
missing is the layer above: which child goes next, what a child's landing means for its siblings,
and when the epic itself is done.

## Question

What does an Epic pipeline own that the children's own pipelines do not, given that each child
already carries a full class of service of its own?

## Answer

None yet. The shape depends on what `epics-promote-to-their-own-lane` settles about the folder,
since a pipeline's steps address artifacts that idea defines.

One boundary is already ruled, on 2026-09-21. **That idea holds the plan and this one holds its
execution.** The epic's file states the goal and the order its children run in, including that a
spike may run first and change what a later child should be. What this idea owes is who reads that
order, when a child is dispatched against it, what a child's landing obliges of its siblings, and
what happens when a spike's answer contradicts the plan it was run to inform.

## No-gos

- **This idea does not create the lane or the folder, and does not define the sequence.** That is
  `epics-promote-to-their-own-lane`, and this idea starts after it lands.
- No change to any child's own pipeline. A story child still runs the story pipeline unchanged.

## Open questions

- Does an Epic pipeline replace `pipelines.md`'s no-pipeline Epic section, or sit beside it as the
  case where an epic is being actively progressed rather than merely split?
- Does the cross-child sequencing land as a `tasks.md` analogue — the dispatch-plan shape the
  board reevaluation ruled for multi-unit items — or as its own artifact?
- Who decides the next child: the seat reading the roster, or a role the pipeline names?
- Does an epic's completion have a gate of its own, or is it the last child's merge?
- Is there enough here for a pipeline at all, or is the honest answer a paragraph of seat guidance
  in `orchestration.md`? Two epics' worth of evidence is thin, and one of them has not run yet.
