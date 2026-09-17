---
name: artifact-name-tokens-break-when-done-empties
title: Record a remedy before the retrospective deletes the last spec.md and design.md
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R4,
2026-09-17 — widening `editor` AUDIT's finding of the same day.

## Situation

`reference-check` resolves filename-shaped tokens against the live tree by basename.
Measured 2026-09-17: `spec.md` has exactly one instance in the tree, and `design.md` has
two, all inside `backlog/done/`. Four live files cite those basenames — `CLAUDE.md`,
`.claude/references/pipelines.md`, `.claude/agents/coach.md`, and a `done/` design file.

## Complication

The retrospective that empties `backlog/done/` reds `reference-check` on all four citing
files at once, and the remedy is recorded nowhere. The extraction slice deleted the two
allow markers that were the remedy — correctly, by the markers' own written terms. Those
terms said "delete when the first instance resolves" and never said "restore when the last
one goes". That asymmetry is the defect, and it reaches `tasks.md` and `findings.md` the
moment their first instances land.

## Question

Where does the restore-on-last-deletion obligation live so the retrospective cannot red
the gate by doing its job?

## Open questions

- Is the remedy a standing allow marker per artifact basename, a retrospective-procedure
  step, or a checker change that treats the artifact basenames as a vocabulary rather than
  as citations?
