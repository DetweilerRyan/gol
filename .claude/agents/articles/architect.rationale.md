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

## The orchestrating session editing a style the clause said a role owned

On 2026-09-10 the seat that invokes the roles widened all four `vale-styles/JsDoc/` rules to `.tsx`. The content was largely right and the authorship was not. The edit overrode a ratified design ruling its author had not read, and then wrote the override into `architect.md` as standing policy. That is what widened the clause from "role" to any seat.

## Why a Vale rule ships a hand-built fixture pair

`architect.md` requires a `<Rule>.bad.*` and `<Rule>.good.*` pair for every extension a rule claims,
and says a silent good fixture proves nothing. Both are choices with rejected alternatives behind
them.

The reason a fixture is needed at all is the one `rules/*.yml` already has: a rule matching nothing
reports nothing, and that is indistinguishable from a clean codebase.

**Vale's own `vale test` cannot do this job.** Its `input:` is parsed as Markdown, so a
comment-scoped rule never matches it. The upstream rule-authoring server was the other candidate, and
its scaffolding and testing tools need a paid subscription. Both were measured and rejected;
`prose-linting.rationale.md` carries each. So the hand-built fixtures are a considered choice rather
than a gap nobody has noticed.

## The two `extends:` traps

`architect.md` says not to reach for `extends:` to inherit another style's rule. Both traps are
hidden by a passing run.

A child's key **replaces** the parent's rather than merging. Add a comment scope to a child of a
sentence-scoped rule and `scope: sentence` is destroyed — the counter then measures whole blocks under
a message that still says "Sentence".

A parent that is not on the search path aborts the **whole run** at E201. That makes a synced `.vale/`
a precondition for loading every rule, including the fixtures that deliberately need none.
`prose-linting.rationale.md` carries both measurements.

## Why the style ownership binds the orchestrating session

`architect.md`'s clause once said "role" alone, and the seat that invokes the roles edited the style
under it. That seat has no reviewer upstream of `hardener`, which is the whole reason the clause
exists. A finding from there comes to `architect` as a finding, and `architect` makes the edit.

## Where the property-test and doc-convention rules came from

`architect.md` states that a green property run is weak evidence about edge cases, and that an
arbitrary narrowed to clear a finding is a rejection rather than a fix.

The second is the same move as weakening an ast-grep rule to clear its finding: filtering the failing
case out of a generator leaves the defect in the module and removes the only thing that could find it.

The doc-convention half has its own history. Adjudication ownership moved to this role from the
former `qa` role, which fixed its own findings, so a late-cycle defect never reached an independent
reading.
