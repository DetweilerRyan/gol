---
name: type-impossible-mutants-read-as-survivors
title: What upstream says about the TypeScript checker, and where this tree's measurement departs from it
created: 2026-09-22
---

## Why this file exists

`findings.md` records what four timed runs measured on this tree. This file records what Stryker's own
documentation and issue tracker say, read 2026-09-22, and marks the two places where the measurement and the
prevailing account disagree. The two are kept apart deliberately: a measurement on one tree on one day is not
evidence about the plugin in general, and upstream prose is not evidence about this repo.

Sources are listed at the end. Everything below is attributed to one of them or to this spike's own runs.

## What upstream states, and this spike confirmed

**The mechanism.** The checker type-checks each mutant and marks the failures `CompileError`. The check runs
in memory with no side effects on disk. Confirmed: the worktree stayed clean across all four runs.

**The metric definitions.** `detected = killed + timeout`, `undetected = survived + no coverage`,
`valid = detected + undetected`, `invalid = runtime errors + compile errors`, and
`mutation score = detected / valid * 100`. Confirmed: both runs' reported scores reproduce from their own
mutant counts under that formula.

**Project references.** `tsconfigFile` defaults to `tsconfig.json`, and `--build` is enabled automatically
when references are found. Confirmed: this tree's solution file works untouched. A scoped probe on
`src/appearance.ts` returned 14 `CompileError` of 17 mutants whether `tsconfigFile` was left at the default or
pointed straight at `tsconfig.app.json` — the same verdict by both paths, through the sandbox, with `features`
excluded from it. That settles the proposal's sandbox open question.

**The three compiler-option overrides.** `allowUnreachableCode: true`, `noUnusedLocals: false`,
`noUnusedParameters: false`, applied to avoid false positives. Confirmed with a named instance:
`liveCellStore.ts:230` fails the repo's own build with TS6133 and compiles under those relaxed settings, so
the checker leaves it surviving.

**Compile errors are by design, not a defect.** Issue #2438 states the position directly: "In a mutation
switching world, we will create (typescript/flow) type errors. This is by design; it would be almost
impossible to prevent it." That discussion records three rejected alternatives — `transpileOnly` with
`isolatedModules`, bypassing the checker through the compiler API, and `@ts-nocheck` with comment stripping —
and no figure for how many mutants are affected.

**The default strategy is lossy in a stated direction.** With `prioritizePerformanceOverAccuracy` at its
default `true`, mutants are grouped by a file-dependency graph and checked in batches. The documented cost is
"having mutants with a status other than `CompileError` while they should have this status" — under-reporting,
never over-reporting. Stryker measured its own core package at 43% faster and 99.1% accurate on that strategy.
The root cause is cited to TypeScript issue 46272, on how the compiler resolves errors.

## Where this tree's measurement departs from the prevailing account

### 1. The claim that the score is unaffected is wrong, and the direction is knowable in advance

The common secondary framing — repeated in third-party write-ups — is that because `CompileError` mutants are
excluded from the score, enabling the checker cannot hurt the number. One search summary put it as: the
excluded mutants are "simply removed from the scoring calculation," so the checker "doesn't negatively impact
your mutation score."

**Measured here, it does.** `src/` fell from 98.65 to 98.41 and `scripts/` from 98.94 to 98.62.

The arithmetic is not a surprise once stated. The excluded set leaves both the numerator and the denominator,
so the score becomes the **retained** set's own kill rate exactly — on `src/`, 1053/1070 = 98.41. It therefore
moves _away_ from the excluded set's rate, not toward it. On `src/`, 629 of the 635 excluded valid mutants were
detected, a kill rate of 99.06% against the tree's 98.65%. **Removing a subset that is better-killed than
average necessarily lowers the average.** A subset worse-killed than average would raise it.

So the honest statement is not "the score is unaffected" but "the score moves to whatever the surviving
mutants say, and the direction depends on which subset the type system removes." No upstream page makes the
claim the third-party write-ups make; this is an inference added downstream, and it is false in general.

### 2. `CompileError` can mean "unbuildable tree" rather than "impossible production program"

Upstream describes the status as marking a mutant that results in a type error, without distinguishing where
that error lands. The distinction appeared once in 201 stratified samples, and is worth stating so a reader
auditing a single verdict does not mistake it for a harness fault.

`usePatternPlacement.ts:87`, an `ArrowFunction` mutant replacing `(pattern: Pattern) => setPlacement(...)` with
`() => undefined`, produces exactly one type error, and it lands in `usePatternPlacement.test.ts` — TS2554,
expected 0 arguments but got 1. Every production module still compiles: `() => undefined` is assignable to the
prop's `(pattern: Pattern) => void`, and only the test's own direct call fails.

**The verdict is faithful, and it hides nothing.** The checker's program includes `src` test files, exactly as
`tsc -b` does, so the mutated tree genuinely does not build. No test gap is concealed either, since the
compiler catches the change at the test's own call site and the defect cannot return without a red build. But
`CompileError` on such a mutant is a statement about the tree, not about whether the production program could
exist. Measured at 1 of 100 on `src/` and 0 of 101 on `scripts/`.

### 3. Nothing upstream addresses a file losing every mutant

Neither the checker documentation, the plugin README, the troubleshooting page, nor issue #2438 discusses what
happens when every mutant in a file is marked `CompileError`. No search surfaced an issue reporting it.

This tree produced five such files on `src/`: `useLiveCells.ts`, `useContentBounds.ts`, and all three
`src/equality/is-*-equal.ts`. Each reports `n/a` and contributes nothing to the score.

The gap matters because of the shape, not the count. **A file with no testable mutants and a file whose every
mutant is killed are both reported as carrying no findings.** Stryker's own metrics have no state for "this
file was not assessed," so the distinction cannot be read off the report at all. That is the fail-open shape
this repo's checkers are otherwise built against: `ast-grep-rule-check` asks whether any rule was found,
`reference-check` shares a `checkNonEmpty` guard, and `vale-fixture-check` probes for a missing binary because
zero findings and no run produce the same text.

## What was searched and not found

- No issue reporting `CompileError` false positives from the grouping strategy. The documented accuracy loss
  runs the other way, so a false `CompileError` would be a defect rather than a known trade-off. This spike
  did not audit its own 636 verdicts beyond the six cross-checked by hand, so it cannot rule the rest out.
- No published figure for the share of mutants a strict TypeScript project loses to `CompileError`. Two
  third-party posts assert a 10 to 30% range; neither cites a method, and neither is an upstream source. This
  tree measured 37.3% on `src/` and 33.1% on `scripts/` — above that range, from a single sample.
- No upstream guidance on adopting the checker per-config rather than wholesale, which is the shape this
  tree's asymmetry would need.

## Sources

Read 2026-09-22.

- [TypeScript Checker](https://stryker-mutator.io/docs/stryker-js/typescript-checker/) — the plugin's options,
  the `CompileError` status, the three compiler-option overrides.
- [typescript-checker.md](https://github.com/stryker-mutator/stryker-js/blob/master/docs/typescript-checker.md)
  — project references and `--build`, the accuracy direction of the default strategy.
- [Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)
  — the state definitions and the score formula.
- [Announcing faster TypeScript checking](https://stryker-mutator.io/blog/announcing-faster-typescript-checking/)
  — the grouping mechanism, the 43% and 99.1% figures, the citation to TypeScript issue 46272.
- [Configuration](https://stryker-mutator.io/docs/stryker-js/configuration/) — `checkers`, `checkerNodeArgs`,
  `concurrency`, `incremental`.
- [Issue #2438, TypeScript compile errors with mutation switching](https://github.com/stryker-mutator/stryker-js/issues/2438)
  — why the errors are by design, and the rejected alternatives.
- [FAQ](https://stryker-mutator.io/docs/General/faq/) — error mutants are excluded from the calculation.
