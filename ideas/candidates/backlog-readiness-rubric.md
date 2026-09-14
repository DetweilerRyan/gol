---
name: backlog-readiness-rubric
title: The readiness article — kind discriminator, six predicates, anchors, four dispositions
created: 2026-09-14
---

## Context

Child 2 of `backlog-readiness-assessment.md`. The rubric itself, as prose, reviewable on its own
terms before any mechanism depends on it. INVEST adapted to a board that is mostly
checker-bearing work, with the score bounded to ranking by five constraints, because this repo
has never graded anything and carries recorded rulings against a deciding score.

## Sketch

- `.claude/agents/articles/backlog-readiness.md` — questions 0a (contract-bearing /
  checker-bearing / knowledge-bearing) and 0b (verdict records and indexes are not assessed);
  the six predicates in repo vocabulary (lands alone; need, not solution; worth doing; size is
  judgeable; split signal; observability); the anchors; the four dispositions (ready / epic /
  spike / not worth doing); the A–E bounds on the number; the Layer 3 procedure and its
  contaminated-label fix (judge's record written first, human rules agree-or-differ per letter).
- `.claude/agents/articles/backlog-readiness.meta.md` — provenance (the freeCodeCamp three-layer
  architecture, INVEST, the SAFe enabler mapping researched 2026-09-13), the vocabulary-collision
  census, the rejected alternatives, and the three literal `ideas/` path couplings
  `intent-driven-layout` would break.
- `orchestration.md` gains its missing idea-board section; CLAUDE.md gains the doc-map pointer
  ("Ten are topic articles" becomes eleven), the sidecar-index line, and one Idea board sentence.

## Touches

- `.claude/agents/articles/backlog-readiness.md`, `backlog-readiness.meta.md` (new)
- `.claude/agents/articles/orchestration.md`, `CLAUDE.md` (orchestrating session, user approval)

## Open questions

- **The stop condition.** This child ends by hand-assessing three candidates chosen to exercise
  the exits: one that should come back epic (`effective-prose.md` or `scripts-boundary.md`), one
  spike (`architect-designs-for-parallelism.md`), one ready
  (`the-vale-fixture-harness-is-gated-by-nothing.md`). If no disposition changes a decision the
  user would otherwise have made, the epic stops here.
