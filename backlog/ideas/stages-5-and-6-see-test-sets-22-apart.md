---
name: stages-5-and-6-see-test-sets-22-apart
title: Reconcile hardener's same-test-set invariant with the measured 22-test stage-5/6 divergence
created: 2026-09-16
---

## Situation

`hardener.md` states "Stages 5 and 6 see the same test set. If they ever diverge, that is a finding
rather than a known asymmetry." `mutation-testing.md` sanctions `it.skipIf('__stryker__' in
globalThis)` as an accepted idiom — which by construction makes the two stages diverge.

## Complication

Measured 2026-09-16 by `hardener` during the `backlog-board-migration` gate, on a tree whose manifest
contained no `src/` file: stage 6's coverage input ran 955 tests, Stryker's dry run reported 933.
A probe with `globalThis.__stryker__` set showed 943 passed / 12 skipped, all names distinct. So 12
of the 22 are the sanctioned skip idiom — the role file's absolute invariant and the article's
sanctioned idiom contradict each other on those. **The residual 10 have no asserted mechanism.**
The measuring pass deliberately declined to guess one.

## Question

What accounts for the residual 10, and how should the role file's invariant be restated so the
sanctioned idiom stops reading as a standing violation?

## Answer

The measurement exists — the 22 decomposes completely, with no residual. Measured 2026-09-16 by
`hardener` during the post-merge integration gate on `main` at the migration's tip:

- **13** — every test in `fast-check-stryker-seed.test.ts`. Stryker's incremental cache records 69
  collected test files totalling exactly 933; that file is the one collected file absent from the
  set. Its own module header predicts this: it imports nothing from `src/` or `scripts/`, so
  `coverageAnalysis: "perTest"` related-file filtering never selects it. The omission was
  corroborated; the filtering mechanism itself was not independently verified.
- **9** — the `it.skipIf(underStryker)` tests under `src/` (the other 3 of the probe's 12 skips
  live in the root file above, which is uncollected anyway).

So the divergence is one uncollected root-level file plus the sanctioned skip idiom — not a
coverage gap. What remains is prose reconciliation only.

## Open questions

- Does the reconciliation belong in `hardener.md` (restate the invariant as "identical minus the
  sanctioned skips and the uncollected seed file, count them") or in `mutation-testing.md` (name
  the divergence the idiom and the perTest filter cause)?
- No role edits either file — the seat does, on the user's approval.
