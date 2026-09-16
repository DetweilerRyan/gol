---
name: spike-rebase-conflict-frequency
title: Measure how often a slice rebase actually conflicted, before designing for parallelism
created: 2026-09-14
---

## Context

A readiness spike, ruled 2026-09-14 under `definition-of-ready.md`'s first run. Parent idea:
`architect-designs-for-parallelism.md`, targeting its V and I letters.

The parent's own first open question concedes its premise may be capped by something no module
boundary can move: the merge protocol lands slices serially, so perfect partitioning may buy
smoother rebases rather than more concurrency. Whether rebases are even rough today is
unmeasured. Nobody has the answer, and the parent's V score cannot be raised by editing — the
definition of a spike rather than a revision.

## Sketch

Read the landed slices' history — `git tag -l 'slice/*'` is the roster — and answer, per slice:
did its step-1 rebase hit a conflict, and in which files? Rerere caches, reflogs, and merge
commits are candidate evidence; if history cannot answer it, say so and start counting forward
from now instead. Deliverable is a recorded count in the parent's file plus a re-assessment of
the parent, not code. Throwaway probing goes to `spikes/`.

## Touches

- `ideas/candidates/architect-designs-for-parallelism.md` — the re-assessment and the count land
  there
- Nothing under `src/` or `scripts/`

## Open questions

- Can git history answer this at all after worktree retirement, or does the evidence die with
  the branch? If dead, the spike converts to a forward-counting convention and closes cheap.
- What count is the decision threshold? The parent should say what "rarely" means before the
  number arrives, or the number will get argued instead of the premise.
