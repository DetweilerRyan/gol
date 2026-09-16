---
name: cross-module-kills-as-a-coupling-signal
title: Measure whether each module's own tests can kill its own mutants
created: 2026-09-02
---

## Context

Raised as: mutants that survive a scoped run but are killed by tests **not** associated with the
mutated file feel like a design smell, and the instinct is that they come from implementations that
lack separation via dependency injection or dependency inversion.

**The instinct is pointing at something real and this repo has measured instances of it. The
evidence normally quoted for it, however, cannot support the inference — and that is the first
thing to fix, because it is why the question has never actually been asked here.**

### Why `killedBy` cannot answer this

`@stryker-mutator/vitest-runner` sets `bail: this.options.disableBail ? 0 : 1`, so vitest stops at
the **first** failing test and Stryker records that one. Measured on the `bd7c388` baseline: all
**1,278** killed mutants carry exactly one `killedBy` entry, never more. A mixed attribution is
structurally unrepresentable.

So "this mutant was killed by a test in another module" means **a test elsewhere got there first** —
not that the module's own tests could not have killed it. CLAUDE.md already draws this conclusion in
the Gherkin case: 324 kills attributed to `features/**` cost almost no real kills when that layer was
removed, precisely because the other tests that would have killed those mutants were simply never
reached. **Reading a cross-module `killedBy` as a coupling signal is reading scheduling order.**

The same caution applies from the other side: `coveredBy` answers "covered, therefore fine" about
mutants nothing kills.

### The instances that are real, and what fixing them actually took

This repo has found genuine cases — mutants **covered by the module's own tests and killed by
neither**. All six `src/scrollbars.ts` mutants that survived once `features/**` was removed were
`coveredBy` `scrollbars.test.ts` and `scrollbars.property.test.ts`, and killed only from outside.

**The resolution is the interesting part: of the ten mutants the Gherkin layer was ever credited
with killing, five were equivalent and five were simply untested and now carry unit tests.** Not one
was resolved by changing the design. That is a single data point and it is about one layer, but it
is the only evidence this repo currently has, and it points away from the DI hypothesis rather than
toward it.

### Why DI may be the wrong remedy _here_ specifically

This codebase already applies dependency inversion — through **parameters rather than interfaces**,
which is the functional form of the same principle:

- `zoomGlide.ts` takes `nowMs` and reads no clock; `useZoomGlide.ts` is the adapter that reads
  `performance.now()`. `rules/no-ambient-time-in-domain.yml` enforces it.
- `liveCellSeed.ts` takes the query string and never reads `location`, enforced by
  `no-dom-in-domain.yml` and `no-build-env-in-domain.yml`.
- `container-equality.ts` takes the leaf comparison as an injected `compare` function — the design
  that stopped the two comparators re-diverging.
- `tuple-list.ts` takes `mutateValue` as a `ValueMutator` parameter, which also makes a component's
  mutation _defined as_ recursion through `VALUE_RULES` rather than merely agreeing with it.

So injection is used where it earns its place: at I/O boundaries, and where it removes duplicated
branching. What is deliberately **not** inverted is composition between pure modules — the
framework-free layer is a small acyclic import graph (`gridGeometry.ts` → `camera.ts`, and so on),
and injecting a module of pure functions into another buys testability that is already free.

**That is the real question this candidate should settle, and it should be settled by measurement:
is there any module whose own tests genuinely cannot kill its own mutants, and if so, is the cause a
missing test or a coupling?**

## Sketch

**The measurement `killedBy` cannot give you.** For one module at a time, run Stryker scoped to that
module with **only that module's own test files collected**, and compare the survivor set against
the same module's survivors in a full run. Every mutant that survives the isolated arm and dies in
the full arm is one the module's own suite cannot kill — the real population the request is about,
and it is not the `killedBy` population.

Start with two or three modules rather than all nineteen; `scrollbars.ts` is the obvious first
candidate given the history above, and `camera.ts` the obvious second given how many modules import
it.

**Mechanism caution before designing the run.** `@stryker-mutator/vitest-runner`'s `vitest.related`
option defaults to **true**, so the dry run already scopes collection to test files importing the
mutated files — which is _not_ the same as "that module's own test files", since a test importing
`camera.ts` transitively is related to it. Narrowing to the module's own suite likely needs an
explicit vitest filter rather than a Stryker option, and getting that wrong produces a confidently
wrong answer. Never pass `--incremental` to any scoped run of this kind.

**Then triage what the isolated arm surfaces**, using the repo's existing rules rather than a new
one: read the `NoCoverage` column first (an uncovered mutant makes the coverage gap the finding, and
equivalence not yet a question that can be asked); hand-apply and run the unfiltered suite before
ruling anything equivalent. Only what remains — covered, non-equivalent, unkillable from inside — is
evidence about design.

## Touches

Nothing in `src/` initially; this is a measurement. If it finds a real coupling, the remedy is
`architect`'s (DESIGN or REVIEW), and the finding would likely also want an `ast-grep` rule so the
boundary it establishes cannot silently erode.

If it finds only missing tests, the remedy is ordinary `cleaner`/`hardener` work and this candidate
closes with a recorded measurement — which is a **good** outcome, not a wasted slice, because the
question is currently unanswerable rather than answered.

## Open questions

- **Is "a module's own tests kill all its own mutants" even the right standard?** A pure function
  composed from another pure module is legitimately exercised through its caller, and this repo's
  layering is deliberately built that way. Holding every module to per-module mutation independence
  could push toward mock-heavy tests that pin the implementation rather than the behaviour — the
  same failure the `camera.property.test.ts` equivalence-check concern in
  `wheel-zoom-ignores-magnitude-and-pinch` is about.
- Does this overlap with `cleaner-property-tests-and-layer-overlap`? Both want a **per-arm survivor
  diff** that Stryker's reporting cannot produce, differing only in how the arms are cut (by test
  layer there, by module here). If the harness is the hard part, one slice could build it and both
  questions could use it.
- Would a finding here have been visible in `crap4ts` instead? CRAP is coverage-based and coverage
  is a union, so a line reached only from another module's test scores as covered — meaning **no**,
  and that is worth stating, since it explains why nothing has flagged this so far.
