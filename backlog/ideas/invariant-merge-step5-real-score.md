---
name: invariant-merge-step5-real-score
title: Under an invariant merge, run a real incremental mutation score at step 5 instead of skipping
created: 2026-08-24
---

## Context

`slice/acceptance-contract-rulings` lets merge-protocol stage 4 be **skipped**
when a diff touches nothing Stryker can see. `hardener` accepted the ruling and
made one advisory objection worth keeping:

> The doc identifies that a skip produces no artifact and is indistinguishable
> from a pass — then chooses the option with no artifact.

The middle option was never discussed: under the exemption **the incremental
cache is retained by design**, so a plain `npm run test:mutation` would produce a
real score rather than nothing.

**`architect` considered it and declined, with a correction that shrinks the
proposal rather than killing it.** The apparent saving was quoted as
2 × ~19 min → 2 × ~4 min, and that is optimistic in a specific place: **step 3
runs on a branch that was just rebased onto a moved `main`**, so its cache is
stale with respect to everything the rebase brought in — which is the protocol's
own stated reason for mandating `:full` there. The `@fast-check/vitest` floor
figure (~3m45s) was measured on a **warm cache against an unchanged tree**, never
for that case.

**At step 5 the argument survives intact**: `main`'s own cache differs from the
tree by exactly the invariant diff, which is the case incremental mode is built
for. So this is a **step-5-only** proposal.

The artifact gap `hardener` named was closed cheaply in the meantime — every skip
must now be recorded in its handoff, naming the skip, the instruction it was
handed, the diff that instruction covered, and whether it verified it. That makes
a skip distinguishable from a pass, which was the actual complaint. This slice
would go further and produce a number.

## Sketch

Amend the invariant-merge clause so that at **step 5 only**, stage 4 runs as a
plain `npm run test:mutation` (incremental, cache retained) rather than being
skipped. Step 3 keeps the skip.

**Measure before quoting any saving.** The one number nobody has is what a plain
incremental run actually costs at step 5 under an invariant diff. Take it on a
real merge before writing a figure into the doc — this repo has been bitten twice
this session by a figure that was correct when measured and stale a slice later.

## Touches

`CLAUDE.md`'s mutation-invariant-merges clause and `.claude/agents/hardener.md`'s
stage-4 mirror. Docs only — but it **changes what the gate measures**, which is
the same reason `architect` ruled it a slice rather than a paragraph, and the same
bar `stryker-excludes-gherkin` was held to.

## Open questions

- **What does a plain incremental run cost at step 5 under an invariant diff?**
  Unmeasured. Everything else here is downstream of that number.
- **Is a floor-cost score worth more than a recorded skip?** A score that mostly
  re-reports cached results is weaker evidence than it looks, and the recorded
  skip already fixes the indistinguishability problem. This slice is worth doing
  only if the number is cheap _and_ meaningfully more informative.
- Whether the same reasoning reaches step 3 after all, if someone measures the
  post-rebase incremental cost and it turns out closer to the floor than feared.
