---
name: idea-promote-skill
title: Add /idea-promote — the move-only commit, then the two-record verdict
created: 2026-09-14
---

## Context

Child 4 of `backlog-readiness-assessment.md`. Promotion mechanics are fiddly and prose-held: the
move must land alone or git's rename detection loses the file's history, and the calibration
design needs the judge's record written before the human's ruling so the label is not
contaminated.

## Sketch

- `.claude/skills/idea-promote/SKILL.md` — `git mv candidates/<name>.md todo/<name>.md`, commit
  that alone; then flesh out; then the promotion commit body carries two records in order: the
  judge's six letters each with its finding text, then the human's per-letter agree-or-differ
  with reasons on the differing letters. The judge's half is not edited afterwards.
- One CLAUDE.md clause in the Idea board section naming what the promotion commit carries —
  routing branch 1, a procedure this seat executes.

## Touches

- `.claude/skills/idea-promote/SKILL.md` (new)
- `CLAUDE.md` (orchestrating session, user approval)

## Open questions

- Should `/idea-promote` refuse when `todo/` already holds three? The cap is prose ("about
  three"), and a hard refusal would be the board's first gate — which the standing ruling
  forbids. Leaning: report the count and proceed on the user's word.
