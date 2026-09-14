---
name: backlog-readiness-assessment
title: Backlog readiness — the epic over the rubric, the three skills, and the advisory Layer 1
created: 2026-09-14
---

## What this file is

An **index, not work** — the same tier `scripts-boundary.md` rules on: "`ideas/` is two lanes by
design and an epic is neither; this sits in `candidates/` as an index." The four children below
are the slices. Each deletes its own file on landing; this file stays and holds the ordering,
and is deleted when the last child lands or the epic is abandoned.

The approved plan (2026-09-14) lives at the orchestrating seat and its content lands in
`backlog-readiness.md` with child 2. What this index must preserve is the ordering and the two
rulings that bind every child:

- **Nothing gates.** The user ruled 2026-09-13 that CLAUDE.md's "ideas/ has no gate" decision
  stands unreversed: the hook reports and cannot block, the shell always exits 0, the one Vale
  rule reaches no gating script. `vale-fixture-check` gating the _rule's fixtures_ is the same
  split `rules/` already runs, and never touches a board file.
- **Prove it on three.** Child 2 ends by assessing three real candidates by hand. If no
  disposition changes a decision the user would otherwise have made, the epic stops there —
  children 3 and 4 are not built.

## Context

Promotion from `candidates/` to `todo/` is this repo's de-facto Definition of Ready, and nothing
assesses it. The rubric combines a three-layer evaluation (deterministic checks, anchored LLM
judge, human calibration) with INVEST, adapted by slice kind because the board is mostly
checker-bearing work — measured 2026-09-13: 47 of 59 candidates touch `scripts/`, Vale, or
`rules/`; 11 mention a `.feature`.

## The children, in order

1. **`idea-capture-skill`** — `/idea-capture`, plus the `.vale.ini` section that stops
   `.claude/skills/**` being a prose surface no rule reaches. First because a Vale section must
   land with a file at its path, or it is itself a confident zero.
2. **`backlog-readiness-rubric`** — the article and sidecar: the kind discriminator, six
   predicates, anchors, the four dispositions (ready / epic / spike / not worth doing), and the
   score's A–E bounds. Prose only; ends with the three-candidate test above.
3. **`idea-assess-skill`** — `/idea-assess` with the Layer 1 injection and hook, plus
   `Board.NoStatusField`.
4. **`idea-promote-skill`** — `/idea-promote` and the two-record promotion commit.

## Open questions

- None blocking child 1. The epic-level risks (the board may not be the bottleneck;
  `intent-driven-layout` moves the lanes) are recorded in the plan and land in the sidecar with
  child 2.
