---
name: black-box-acceptance-pilot
title: Convert cell-life-and-death to a black-box RTL step test, and measure whether the layer earns its keep
created: 2026-08-23
---

## Context

The Gherkin layer is not black-box. Every `features/*.steps.test.ts` imports
framework-free modules and calls them directly, and `CLAUDE.md` already concedes
six of seven features overlap the unit tests with "the same functions,
frequently the same literal inputs."

That makes `acceptance-mutation` a check on step _plumbing_ rather than on the
user-facing contract. Rewriting the steps as React Testing Library tests driving
real components through ARIA makes the layer describe **observable behaviour**,
which is what the `product` role's acceptance spike depends on.

This is the **pilot**. Convert one feature, measure, then decide about the other
six — the plan deliberately does not commit to a full migration before the
numbers exist.

## Sketch

Add a fourth vitest project, `acceptance`: `jsdom`, `setupFiles:
['./src/test-setup.ts']`, the react/react-compiler/tailwind plugins,
`include: ['features/**/*.steps.test.tsx']`; `unit`'s exclude gains the same glob.

**The extension is the discriminator and it is load-bearing** — a project glob
cannot split one extension by content, so `.steps.test.ts` stays node/direct-call
and `.steps.test.tsx` is jsdom/RTL. A feature converts by being renamed.
`acceptance-mutation`'s discovery already accepts both, as of
`slice/acceptance-mutation-runner`.

Harness at **`features/acceptance-harness.tsx`**, not `src/test-support/` —
`product` owns `features/**` and must be able to add a query helper without a
round trip through `coder`.

Convert `cell-life-and-death` — the most domain-central feature, and the one
whose fate table _is_ the ubiquitous language of Life. **Change no Examples
values**, so the 28 mutants and their seed keys are identical and the comparison
is controlled.

## Touches

`vite.config.ts` (fourth project; note its own comment warns a project glob
matching nothing exits 0 silently), new `features/acceptance-harness.tsx`,
`features/cell-life-and-death.steps.test.ts` → `.tsx`. Depends on
`aria-pressed-cell-state` for the aliveness assertion.

## Open questions

**Gate P — all six rows recorded before converting anything else:**

|     | measurement                                                                           | threshold                                                       |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P1  | scoped `acceptance-mutation` wall time                                                | extrapolate ×~2.4 to a pruned ~68-mutant suite                  |
| P2  | `npm run test:unit` delta                                                             | acceptance stays in the fast path; `coder` must end green on it |
| P3  | coverage/crap4ts **without** the acceptance project                                   | does anything cross threshold 6?                                |
| P4  | Stryker without it, **via a config file** (don't assume the CLI forwards `--project`) | does `break: 85` hold?                                          |
| P5  | `test:mutation` wall time **with** it                                                 | jsdom under `coverageAnalysis: perTest` is unpriced             |
| P6  | qualitative: any scenario Playwright lacks, where a defect surfaces first?            | flat no ⇒ **stop and reconsider**                               |

**P3/P4 are the hinge** for the two pruning slices behind this one: the Gherkin
steps currently feed the `src/` Stryker and crap4ts gates, so deleting scenarios
can break gates unrelated to Gherkin.

Two harness decisions to make up front rather than discover: a **fixed viewport
constant with its derivation written out** (200×200 at `DEFAULT_CELL_SIZE` 20
centres at `offsetX/Y = -5`, giving cells −5..4 — enough for (2,3), the
neighbourhood of (0,0), and blinkers), exactly as `e2e-helpers.ts` documents
`CENTER`; and **`getByLabelText`, not `getByRole` + name, for cells** —
accessible-name computation walks the tree per candidate, a known jsdom trap at
~400 mounted buttons.

**A semantic warning worth recording at pilot time:** under black-box steps a
mutated coordinate landing outside the viewport kills via _"element not found"
in the Given_, not via the Then — a weak kill that reads as 100%. Mitigate with
independent literal Then columns. Pre- and post-conversion mutation scores are
**not** comparable.
