---
name: pattern-library-e2e-flakes-under-load
title: Settle the pattern-library modal transition so acceptance-mutation stops aborting under load
created: 2026-08-27
---

## Context

Found by `product` at `scripts-mutation-survivors-untriaged`'s VERIFY, as a bucket-D defect —
pre-existing, outside that slice's manifest, and reported rather than fixed. `git diff --stat
main...HEAD -- features src` was empty, so every file these tests execute was byte-identical to
`main`.

**`features/pattern-library` scenarios fail intermittently under parallel load, and the failure
aborts `npm run acceptance-mutation` before it scores anything.** Observed rate: the mutation run
aborted **3 of 5** attempts; `npm run test:e2e` failed 1 of 2. Both are green on a quiet machine,
and the failing e2e run took 55.8s against 28.1s for the passing one, so it is load-dependent.
Isolated, `npm run test:e2e -- --project=bdd .features-gen/bdd/features/pattern-library.feature.spec.js`
passes 3/3.

**The runner's guard behaves correctly** — it aborts naming the target rather than scoring mutants
against a red baseline, which is exactly what it exists for. The flake is upstream of it.

Four distinct failing assertions were observed, all downstream of the modal/preview interaction:

1. `features/screenplay/interactions.ts:128` — `choosePatternFromLibrary`'s `.click()`: _element was
   detached from the DOM, retrying_
2. `features/steps/pattern-library.ts:123` — `expect(previewCells(page)).toHaveCount(8)` got **0**
3. `features/steps/pattern-library.ts:133` — `expect(actual.length).toBe(expected.length)`, expected
   5, received 2
4. `features/screenplay/expectations.ts:26` — `Cell 20, 20` `aria-pressed` expected `"true"`, got
   `"false"` — the pattern was never stamped

**Hypothesis, labelled as one:** the race is upstream of all four. `openPatternModal` asserts
`toHaveCount(1)` — mounted — but not that Headless UI's _enter_ transition has settled, so under
load the pattern-button click lands mid-transition and is lost or hits a detaching node. Everything
downstream (nothing armed → no preview → nothing stamped) follows from that.

**Why this is worth doing before the next feature slice**: `acceptance-mutation` runs in `product`'s
VERIFY on every slice, and at the observed rate it aborts more often than it completes under load.
That taxes every future slice twice over, and an aborting gate trains people to re-run rather than
read.

## Sketch

Settle the dialog's enter transition inside `openPatternModal` before it returns, rather than
asserting only that the dialog is mounted. Then make the post-`toHaveCount` preview read in
`features/steps/pattern-library.ts` tolerant of a re-render between the two queries —
`previewCellPositions`'s `evaluateAll` does **not** auto-wait, so the count assertion settling the
render does not protect the read that follows it.

**One open detail `product` could not resolve and explicitly handed over rather than papering
over**: symptom 3 is internally puzzling. The two set-inclusion assertions on lines 131–132 sit
_above_ the count and should have failed first if `actual` really held 2 of 5 named cells. Either
the reported error is not from the site it appears to be, or `actual`/`expected` diverge in a way
the inclusion checks tolerate. That may be a **second, separate problem** in the step's assertion
ordering, and finding out is part of this slice rather than a footnote to it.

## Touches

`features/screenplay/interactions.ts` (`openPatternModal`, `choosePatternFromLibrary`),
`features/steps/pattern-library.ts`, possibly `features/screenplay/questions.ts`
(`previewCellPositions`). All `product`'s manifest — this is a `product`-owned slice, not `coder`'s,
and it changes no `.feature`.

Reproducing the abort's exact conditions needs the baseline phase's real shape, which writes only
the 3 targets that have Examples tables rather than all 7: copy `cell-life-and-death`,
`grid-reference-lines`, `pattern-library` as `<name>.baseline.feature` into a temp dir, then
`ACCEPTANCE_MUTATION_DIR=<dir> npx bddgen --config playwright.acceptance-mutation.config.ts &&
ACCEPTANCE_MUTATION_DIR=<dir> npx playwright test --config playwright.acceptance-mutation.config.ts`.
That failed 1 of 2 back-to-back.

## Open questions

- **Is `--retries` the wrong lever here, and should that be said out loud in the slice?** CLAUDE.md
  already warns that a flaky failure under `--retries=0` scores as `killed` and silently inflates
  the only mutation signal `features/` has. Masking this with a retry would be worse than the flake.
- Does anything else in the suite share the un-settled-transition shape, or is the pattern library
  the only modal? If it is the only one, a fix local to `openPatternModal` is right; if not, the
  waiting idiom belongs in `interactions.ts` as a named primitive.
