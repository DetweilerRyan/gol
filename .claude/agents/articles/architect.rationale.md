# Rationale: `architect`

Evidence behind the rules in `.claude/agents/architect.md`. No role has a read trigger for this
file. It is read when a rule in that file is being changed, never in order to follow one.

Every rule these cases produced is stated in the role file and is actionable there without this
one. Nothing here restates a rule.

## The missing-affordance finding, contract mode Q2

The worked example: cell aliveness used to have no `aria-pressed`, so every layer in this repo read `bg-gray-900` off a className — fourteen sites, in directories no checker watched. That was adjudicated as a missing affordance and became the `aria-pressed-cell-state` slice; `rules/no-aliveness-by-paint-class*.yml` is what now keeps it from growing back.

## Ratifying a library's lifecycle without running it, contract mode Q4

The worked example is historical but the error is not. `@amiceli/vitest-cucumber` — the runner behind the deleted jsdom step layer, uninstalled by `delete-step-test-layer` — compiled every _step_ into its own vitest `test`, not every scenario, so `src/test-setup.ts`'s global `afterEach(cleanup)` fired _between_ a scenario's `Given` and its `When` and an RTL-`render`ed tree could not survive one scenario. A DESIGN pass on `black-box-acceptance-pilot` asserted the opposite from plausible reasoning ("cleanup is `src/test-setup.ts`'s `afterEach`; the harness adds none") and was wrong; the check would have cost one command (48 collected tests for a 13-scenario feature, not 13).

## A claim that outran the command that produced it

The worked example is the same slice: a REVIEW-pass defect duel ran its Playwright column as `npx playwright test features/cell-life-and-death.e2e.spec.ts` — one spec file — and the conclusion committed in `4f6e14d` said "the e2e layer **cannot see** `Cell.onClick`". Running the whole layer refutes it in twenty seconds; `product` did, and one of the eight spec files fails.

## A call-site read is a claim about reachability

Two worked examples, one slice apart. In `ruler-label-axis-affordance` a REVIEW pass concluded the browser layer guarded a ruler-group swap; `product` then measured that the guard was **incidental** — carried by tests whose stated purpose was gridline multiples, working only because the two axes' label sets differ at ±30 — and that the generated layer was blind to the swap entirely. In `mutate-accessible-names` a CONTRACT-mode ruling said a modal locator had "exactly one call site" and "cannot fail on a name change at all, in either direction, for any value"; it had three, and the third throws when the locator matches nothing, reaching eight generated tests. Both rulings' _verdicts_ survived on other evidence, which is precisely why the wrong reasoning nearly reached `CLAUDE.md` unchallenged.

## A fault battery is two claims per entry, not one

`triage-paired-specs` handed `product` a battery and four entries were wrong, two of each kind. Two were (a): F13 named `panByPixels` in `camera.ts`, which has never held it (it is `src/hooks/useCamera.ts`), and F16 broke `isMajorGridline`, whose only caller in the app paints a cell border — the ruler labels it was meant to redden come from `computeMajorGridlines`, which reads the interval directly and never calls it. Two were (b): F14 dropped the `/ thumbRatio` divisor from the scrollbar drag, which is the identity at the ratio of 1 the scenario drags at, and F15 forced `thumbRatio` to 1, which makes _“the thumb should fill its track”_ pass **vacuously** — the fault _is_ the assertion it was supposed to break. `product` caught all four by running the battery rather than trusting it.

## A structural rule shaped a design, before any code existed

In `split-grid-render-props` the place-vs-toggle branch could not live in the composition root, because
`no-logic-in-composition-root` forbids the conditional there. That constraint shaped the final prop design.
This is why checking a design against the existing rules is not hypothetical work.
