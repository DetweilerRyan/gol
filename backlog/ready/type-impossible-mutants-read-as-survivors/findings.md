---
name: type-impossible-mutants-read-as-survivors
title: What Stryker's TypeScript checker does to this tree's mutation runs
created: 2026-09-22
---

## The question

Is the triage cost of type-impossible mutants here large enough to justify the checker's run-time cost, given
that the check is paid on every mutant on every run while the triage cost is paid only on survivors?

## The answer

**The framing was wrong, and the measurement inverts it.** The checker makes the `src/` run _faster_, not
slower, so the cost that the trade-off was built around does not exist on that config. It makes the `scripts/`
run slower.

**Recommendation: adopt on both configs.** The checker makes mutation testing aware of the type system, so the
score is computed over the programs TypeScript permits rather than over a population that includes programs
that cannot exist. That gain does not depend on which config is running, and it is the reason to adopt.

On `src/` the trade needs no argument at all: 3m08s faster per run, 6 of 23 survivors removed. On `scripts/`
the run costs 53s more and removes 5 of 38 survivors. **An earlier revision of this file declined `scripts/` on
that cost, and the reasoning was weak.** A relative figure of +46% reads decisively and describes 53 seconds on
a run that happens about once a slice, against no stated budget it breaches. Accuracy was the reason to adopt
and wall clock was allowed to overrule it. `scripts/` is also the cleaner of the two cases: it has no file
whose every mutant is excluded, so the one residual concern below does not arise there.

A per-config split would also need an explanation that survives contact with the next reader, and "the faster
one only" is not one.

**A correction to this file's own first reading.** An earlier revision recommended against adoption on both
configs, on the ground that 629 of the 635 excluded valid mutants had been killed rather than surviving. That
reasoning does not hold. A type-impossible mutant is a program that cannot exist, so a test that killed one was
killing a phantom; removing the mutant removes no test and loses no coverage. The work of writing those tests
is already spent either way — the only live question is whether to keep regenerating and re-running the
phantoms, and on `src/` that costs 3m08s per run. The score falling from 98.65 to 98.41 is not damage. It is
the kill rate recomputed over programs that can exist, and it fell because the type system was guarding the
excluded subset better than the tests were guarding the rest. That is the checker working, not a cost.

**What would reverse this, and what the evidence says about it.** A _false_ `CompileError` would silently
remove a real test gap. Every verdict anyone has checked is genuine: 6 `src/` survivors and 5 `scripts/`
survivors by two independent methods, a 20-of-20 sample across all 636 `src/` verdicts, and 9 of 9 on the dark
files. The documented accuracy loss runs the other way — mutants that should be `CompileError` and are not —
so false verdicts are not the known failure mode. 610 of the 636 remain unchecked, and the decisive
measurement, splicing and type-checking all of them individually, was not run.

## Method

Measured 2026-09-22 on an Apple M2 Pro, 10 cores, in a dedicated worktree off `e84b1a3`. Versions:
`@stryker-mutator/core` 10.0.0, `@stryker-mutator/typescript-checker` 10.0.0, TypeScript 6.0.3.

Checker settings were the documented defaults — `prioritizePerformanceOverAccuracy` left at `true`, and
`tsconfigFile` left unset so it resolved `tsconfig.json`, the solution file, with `--build` engaged.

Each config was run twice with `--force`, once without the checker and once with it, and timed with `time`.
Wall clock is the shell's, and the mutant counts are read from each run's own HTML report.

A third, independent measurement cross-checks the first: each of the 23 `src/` baseline survivors was spliced
into its own file at the location the report gives, then type-checked twice — once under `tsconfig.app.json`
as the repo has it, once under a copy carrying the checker's three documented overrides.

## What the runs measured

### `src/`

|                                  | Baseline | With checker     |
| -------------------------------- | -------- | ---------------- |
| Wall clock                       | 10m17s   | **7m09s** (−30%) |
| Mutants generated                | 1706     | 1706             |
| `CompileError`                   | 0        | **636** (37.3%)  |
| Killed                           | 1668     | 1041             |
| Timeout                          | 14       | 12               |
| Survived                         | 23       | **17**           |
| RuntimeError                     | 1        | 0                |
| Valid (the score's denominator)  | 1705     | 1070             |
| Mutation score                   | 98.65    | 98.41            |
| Files with every mutant excluded | 0        | **5**            |

### `scripts/`

|                                  | Baseline | With checker     |
| -------------------------------- | -------- | ---------------- |
| Wall clock                       | 1m54s    | **2m47s** (+46%) |
| Mutants generated                | 3587     | 3587             |
| `CompileError`                   | 0        | **1189** (33.1%) |
| Killed                           | 3532     | 2348             |
| Timeout                          | 17       | 17               |
| Survived                         | 38       | **33**           |
| Valid (the score's denominator)  | 3587     | 2398             |
| Mutation score                   | 98.94    | 98.62            |
| Files with every mutant excluded | 0        | 0                |

## The four findings

**1. The cost is negative on `src/` and positive on `scripts/`, and the reason is the suite, not the checker.**
`src/` runs jsdom and property tests, so a mutant costs more to test than to type-check, and skipping 636 of
them buys back more than the type-check costs. `scripts/` is a Node-only suite whose mutants are cheap, so the
type-check dominates. This answers the proposal's "both configs or one?" question with a measured asymmetry
rather than a preference.

**2. The triage saving is real but small: 11 survivors of 61, across both configs.** Six of the 23 `src/`
survivors and five of the 38 `scripts/` survivors are type-impossible. Those are the ones a role would
otherwise investigate and be unable to close, since `mutation-testing.md` requires naming an input at which the
two programs differ, and for these no such input exists.

The six on `src/`, all genuine narrowing or assignability failures:

| Mutant                                                              | Type error                                          |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| `cache.ts:86` `error instanceof CacheError` → `true`                | TS18046, `error` is of type `unknown`               |
| `Grid.tsx:350` `'right'` → `""`                                     | TS2345, not assignable to `"left" \| "right"`       |
| `useGridPointerGestures.ts:132` `containerRectRef.current` → `true` | TS2345, `null` not assignable                       |
| `liveCellSeed.ts:85` `raw === null` → `false`                       | TS2345, `string \| null` not assignable to `string` |
| `scrollbars.ts:57` `contentMin === undefined` → `false`             | TS18048, possibly `undefined`                       |
| `scrollbars.ts:58` `contentMax === undefined` → `false`             | TS18048, possibly `undefined`                       |

The five on `scripts/` are in `acceptance-mutation/gherkin-document.ts:116`,
`acceptance-mutation/mutation-rules.ts:253`, `acceptance-mutation/playwright-runner.ts:250`, and
`board-shape-hook/board-shape.ts` at lines 183 and 189.

**3. Almost everything the checker removes was already being killed.** The 636 mutants excluded from `src/`
decompose as 627 `Killed`, 2 `Timeout`, 6 `Survived` and 1 `RuntimeError` — every one accounted for. So 629 of
the 635 excluded _valid_ mutants were detected, a kill rate of 99.06% against the tree's 98.65%. That is why
the score _falls_ rather than rises: both the numerator and the denominator shrink, and the numerator shrinks
harder. `scripts/` behaves the same way, 98.94 to 98.62.

The resulting score is not merely lower, it is an identity: 1053/1070 = 98.41 is exactly the retained set's own
kill rate.

Neither move threatens a `break` threshold — 98.41 against 85, and 98.62 against 95. The thresholds are not the
exposure. The exposure is what the number now describes.

**4. Five `src/` files end up with no mutation signal — and every one of their mutants is genuinely
impossible.** `src/hooks/useLiveCells.ts`,
`src/hooks/useContentBounds.ts`, `src/equality/is-deep-equal.ts`, `src/equality/is-shallow-equal.ts` and
`src/equality/is-strict-equal.ts` have every mutant marked `CompileError`. Each reports `n/a` and contributes
nothing. Those five carry 9 mutants between them, and all 9 were spliced and type-checked individually: **9 of
9 are genuine**, every one a `BlockStatement → {}` or `ArrowFunction → () => undefined` on a function declaring
a non-`void` return, failing with TS2355 or TS2322.

**So these files are unassessable rather than hidden.** Every mutant Stryker can generate for them is a program
TypeScript forbids, which means there was no test question there to lose. The `n/a` is accurate.

**The residual risk is drift, not concealment.** The HTML report renders `n/a`, so a human reading the
per-file view can tell an unassessed file from a fully killed one. The score and the survivor list — the
surfaces this repo's gates and roles consume — cannot. Today that costs nothing, since the 9 mutants are all
impossible. It would start costing something if one of those files grew logic whose mutants were assessable and
nobody noticed the file had never been reporting. `scripts/` has no such file.

## What the classification confirmed, and what it corrected

The independent type-check harness predicted exactly six type-impossible survivors on `src/`, and the checker
removed exactly those six. Two separate methods, same answer.

`architect`'s review pass re-ran all four runs and reproduced every mutant count exactly, then extended the
harness to `scripts/`, which this spike had not: 5 of its 38 survivors fail `tsc`, at the same five sites the
checker removed. Two methods, exact agreement, both configs.

That pass also recorded a precondition worth keeping. TypeScript 6.0.3 resolves these tsconfigs with strict
null checking in force even though no `strict` key appears in any of them, verified empirically. Both methods
depend on it, so nobody should revise these results on the theory that strict mode is off.

It also produced the measured instance of the gap the proposal predicted. `liveCellStore.ts:230`, replacing
`!boundsDirty` with `false`, fails `tsc` with TS6133, `'boundsDirty' is declared but its value is never read`.
The checker sets `noUnusedLocals: false`, so it compiles there and keeps surviving. A seventh survivor the
repo's own build rejects, which the checker is documented not to catch.

## What this does not prove

- **Nothing here was measured on a second machine or a cold cache.** Every run was `--force` on a warm tree,
  and the two configs' runs were serial rather than concurrent.
- **The timing story names one mechanism where the logs show two, entangled.** Enabling the checker also
  reallocates workers: `ConcurrencyTokenProvider` reports 9 test-runner processes without it, and 5 checker
  plus 4 test-runner processes with it, on both configs. Check and test share one progress counter, so these
  runs cannot separate reduced test-runner concurrency from per-mutant check cost. The per-mutant arithmetic is
  consistent with the test-cost explanation — about 0.34s per mutant on `src/` against 0.03s on `scripts/` —
  but consistency is not attribution.
- **The `CompileError` verdicts were not audited in full.** Six of 636 were cross-checked by hand on `src/`.
  `architect`'s review added a deterministic random sample of 20 of the 636, spliced and type-checked
  individually: 20 of 20 genuine, no false verdict. Rule of three bounds the false share at roughly 15% or less
  at 95% confidence. That is a bound, not an audit, and 610 verdicts remain unchecked.
- **Neither run used `prioritizePerformanceOverAccuracy: false`,** and the review declined it on the ground
  that its documented loss direction is one-way: setting it `false` can only move _more_ mutants into
  `CompileError`, deepening both exposures the recommendation rests on. It cannot reverse the verdict, so the
  run was judged not worth its cost.
- **The incremental cache was never exercised.** Whether a `CompileError` verdict survives into a later
  `--incremental` run is untested here, and it decides whether the `src/` speedup holds on the runs a role
  actually makes.
- **Neither number is a claim about a future tree.** Both depend on the current ratio of test cost to
  type-check cost, which any change to the suites moves.

## What follows

Two candidates, neither of which this spike is authorized to land:

1. **A dark-file guard.** Something should report when a file's every mutant is excluded. This is **not** a
   precondition for adoption — all 9 of today's dark mutants are genuinely impossible, so the guard would
   currently fire on five files that deserve their `n/a`. It is worth having as the same inertness predicate
   `ast-grep-rule-check`'s "was any rule found at all" and `reference-check`'s `checkNonEmpty` already encode,
   applied to a mutation report, so that a file which stops reporting is visible rather than silent.
2. **A narrower way to close a type-impossible survivor.** Adopting on both configs removes the eleven this
   spike found, but not the class. The TS6133 case survives the checker by construction, and any future
   survivor the checker's relaxed settings accept will arrive with no shape for closing it.
   `mutation-testing.md` has none today. A ruling shape costs one article edit and no run time.

   **The ruling shape must be argued against the repo's own compiler config, not the checker's.**
   `liveCellStore.ts:230` is the case that forces this: the repo's build rejects it and the checker's relaxed
   settings accept it, so the checker is not even a directional proxy for `tsc -b`. The splice-plus-
   `tsc --noEmit` method both passes used is the mechanism such a ruling would cite, which is what
   `mutation-testing.md` already asks of an equivalence argument.

The spike has no parent idea, so it closes against its own question rather than by re-assessing another
candidate.
