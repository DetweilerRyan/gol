# Rationale: Mutation Testing

**Audience:** whoever is changing a rule in `mutation-testing.md`. **Read when:** you are amending,
narrowing or overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file. `mutation-testing.md` is written to be actionable alone;
this holds the evidence behind it, so a rule can be argued with rather than only obeyed.

Everything below is history: what was measured, in which slice, by what method, and which readings were
later corrected. Several figures here describe trees that no longer exist and say so — **do not quote a
number forward from this file without re-deriving it.**

> The article this belongs to was extracted verbatim from CLAUDE.md @ `b5e333e`, lines 57-99, 128, 178,
> 180, 182, 183, 392-399. No prose was edited in the extracting commit; only the common leading indent of
> a fragment lifted out of a nested list was removed. It was split into an instruction file and this
> sidecar by `split-mutation-testing-article`.

## The split itself, measured

`split-mutation-testing-article`, 2026-09-08, the first split performed by following
`roll-the-rationale-sidecar-out`'s rules rather than inventing them.

| measure                        | before | after                            |
| ------------------------------ | -----: | -------------------------------- |
| article bytes                  | 45,362 | 15,365 instruction, ~28k sidecar |
| rationale-only bytes (article) | 12,680 | 9,836                            |
| entanglement                   |    92% | 71%                              |
| backticked slice-slug mentions |     22 | 2 in the article, 18 here        |
| Vale findings (article)        |    231 | 32                               |

**The slug count is the cleanest signal.** A backticked slice name is history by definition, and 20 of
the 22 moved to this file. The rationale _share_ went up rather than down, which is the ratio artifact
recorded in `prose-linting.rationale.md`: removing rationale removes total bytes too, so only the
absolute figure moves in the direction the split intends.

## The Vale triage, done finding by finding

Recorded 2026-09-09, on the rebased branch. `mutation-testing.md` reports **zero** on the three mechanical
rules. Its 36 residual findings come from the two prompt rules, and every one was read individually
rather than in bulk.

**`STE.ProcedureLength`, 12 findings, 12 exempt.** Every one is a statement rather than a step: the three
misreporting modes, two `:full` trigger conditions, two equivalence practical notes, two `ignorePatterns`
hazards, the two `Timeout` consequences, and two allowlist what-secures-each facts. None is a procedure,
so `prose-linting.md`'s test — is this bullet a step, or a statement — exempts all twelve.

**`STE.PassiveVoice`, 24 findings, 24 exempt.** By the five classes: 11 descriptive prose where the actor
is a tool and irrelevant, 4 passives that already name their agent ("killed **by a test in another**",
"collected **by no vitest project**"), 4 predicate adjectives read as participles ("covered",
"gitignored", "tracked"), 1 heading, and 1 dated past-tense record — the `coverageAnalysis: off`
closed-decision marker, which claim discipline **requires** in that form.

**Zero act-on findings, and that number needs its explanation.** The act-on class is a rule written
passively where naming the actor makes it actionable, and `doc-comments.md` yielded 4 of 26 in that
class. This file yielded none because it was written after that class was identified, so the shape was
avoided at authoring time rather than removed afterwards. A later editor should not read zero as proof
the rule is inert here.

**One finding is genuinely arguable and was left in.** Line 108's "No current run-cost figure is recorded
in either file" could be "Neither file records one". The passive fronts the missing figure, which is the
subject, so it stays — but it is the closest call of the 36, and `prose-linting.md` is explicit that a
residual fitting no class is not automatically exempt.

## The three misreporting modes, and where each was measured

1. **Per-test attribution.** Measured in `live-cell-store`; the note lives above `getBoundsSnapshot` in
   `src/liveCellStore.ts`. Its mirror image is the first-kill-wins `killedBy` attribution below — a
   different anomaly with the same root.
2. **Incremental reuse of a static mutant.** Measured by `hardener` in `collapse-dead-cell-layer`: five
   hand-verified-dead **static** mutants came back `Survived` because `IncrementalDiffer` reused cached
   results even though the covering test file had changed. This is the case where "evidence about the
   diff, not about the tree" is widest.
3. **A mutant that crashes the reporter.** Measured by `cleaner` in the same slice: mutating
   `useGridPointerGestures.ts`'s `handlers: {…}` to `handlers: false` breaks Stryker's own error
   serialization and scores `RuntimeError`; hand-applied, it fails **33 tests**. A second site was
   measured in `wheel-zoom-ignores-magnitude-and-pinch` — `Scrollbar.tsx`'s `!drag` → `false`, identical
   reason string, hand-applying reds `Scrollbar.test.tsx` with a real `TypeError`. A genuine kill
   mis-scored, which Stryker then excludes from the denominator. The `useGridPointerGestures.ts` one did
   **not** recur on that run, which is why the article says to expect the reason string rather than a
   site list.

## The `NoCoverage` correction, and the five rulings it overturned

Measured in `collapse-dead-cell-layer`. `Grid.tsx`'s `updateHovered` carried five survivors recorded as
hand-verified equivalent and re-confirmed by three roles across four trees.

**Four of the five were `NoCoverage`, and four were not equivalent.** With `prev.x === x` forced true, a
move changing x but not y returns `prev` and renders prev's stale x. Two died to a later test that panned
only in y; two needed an x-axis case written for them. One genuine equivalent remains.

## The covered-but-undiscriminated instance

Measured in `stable-hook-identities`. `useCamera.ts`'s `cameraRef` sync effect emptied to
`useEffect(() => {})` is covered, and hand-applied it left the whole unfiltered suite **green at 908** —
because no test panned the camera before calling `zoomInCentered`, and a live ref and one frozen at mount
can only disagree once the camera has moved.

`cleaner` wrote the missing case instead of recording an equivalence. On the landed tree the same
hand-applied mutant reds **exactly 1 of 909**, re-measured by `architect` at REVIEW, whole suite, no
filter.

Two details behind the article's practical notes. The standalone version of that case tripped `dry4ts` at
**0.83 similarity**, and it landed as a second `it.each` row. And the survivor the same slice ruled
genuinely equivalent — `usePatternPlacement.ts`'s `}, [])` replaced by a single-element literal — is
argued from React comparing deps by per-index `Object.is`, checkable without running anything.

## The pipeline-eats-the-status class

Three measured instances in this repo, all making a red gate or a failed run read as green:

- `hardener` reported `npm run dry4ts` passing through a `| tail`. It was exiting **3** on 11 findings,
  and had been for the length of a slice. `.dry4tsrc.json` carries `failOnFound: true`, which is why that
  command is labelled a gate in CLAUDE.md's Commands list.
- An orchestrating session's `npm run test:perf` had its nonzero exit swallowed by a trailing `|| echo`,
  leaving the **previous** run's `reports/perf/latest.md` in place — which reads exactly like a fresh
  successful run of the current tree.
- A `grep | sed || echo` chain did the same thing earlier in the project's history.

## Why the incremental cache does not fail safe

`IncrementalDiffer` decides reuse per mutant from three things and no others
(`node_modules/@stryker-mutator/core/dist/src/mutants/incremental-differ.js`, `mutantCanBeReused`, read on
10.0.0):

- whether the mutant still exists after a text diff of its own file;
- whether the test that killed it still exists unchanged after a text diff of _that test's_ file
  (`testsDiff.get(killingTest) === 'same'`);
- for a mutant that was not killed, whether it gained a new covering test.

**There is no dependency-graph analysis anywhere in the class.** Its only imports are `path`,
`diff-match-patch` and its own reporting helpers. So when `zoomGlide.ts` changes, every cached result for
`useZoomGlide.ts` — which imports it — is reused wholesale, because neither `useZoomGlide.ts` nor
`useZoomGlide.test.ts` has a byte different in it.

Note also the `!testCoverage.hasCoverage` early return above all of that, which reuses everything —
inapplicable here since this repo runs `coverageAnalysis: "perTest"`, but it bounds the claim.

**The sharpest instance, found the way this file keeps insisting things be found.** `hardener` overrode an
orchestrator instruction to run incrementally on `smooth-zoom-transitions`' adjudicate fix, which changed
exactly one function in `zoomGlide.ts`. Its full run came back byte-identical to the pre-fix one,
survivor identities included — so on that diff the cache _would_ have been right, because the behaviour
change sat in a window no test reaches. Read that as the sharpest statement of the problem rather than a
reprieve: being right is something the full run **verified** and an incremental run would have
**asserted**, and the two are indistinguishable from the output.

## The seed saga

**`pin-stryker-seed-to-unblind-the-mutation-gate` fixed a correctness bug in the mutation gate first and
a cache cost second.** This account is kept because the mechanism is the only written record of how a
property test could be green in `npm run test:property` and invisible to Stryker at the same time.

`@fast-check/vitest` interpolates the run's seed into the test _title_ (`… (with seed=2041793899)`),
unconditionally and with no option to suppress it — measured in
`node_modules/@fast-check/vitest/lib/vitest-fast-check.js`; the only way to stabilize the title is to pin
the seed. Meanwhile `@stryker-mutator/vitest-runner` filters each mutant run with a `testNamePattern`
built from the **dry run's** test names, and `IncrementalDiffer` matches cached results by test name too.

One cause, two consequences:

- **Correctness.** The two titles are drawn in different processes, so they never matched. Every property
  test was filtered out of every mutant run, and a filtered test produces no result at all
  (`vitest-test-runner.js`'s `.filter((test) => test.result)`). The property body never executed against a
  single mutant, and the outcome read as `Survived` rather than as an error.
- **Cache.** Every property test looked brand-new on every run and invalidated the ~135 mutants they
  covered regardless of the diff.

**Where the pin is wired.** `fast-check-stryker-seed.ts` reaches the two vitest scopes that hold property
tests and no others, through `vite.config.ts`'s `property` project and `vitest.scripts.config.ts` — which
share no setup path, hence two entries rather than one.

### The metric, and the trap in the obvious one

**Count kills whose _killer's own title carries a seed marker_, not kills whose killer's _filename_ ends
in `.property.test.ts`.** The filename count reports 32 kills even in the unpinned control, because a
`*.property.test.ts` file also holds deterministic `it.each` twins whose titles are stable and which were
killing all along.

By the title filter, on a 10-file control: killed+timeout is **607 in both arms** while seed-bearing kills
go **0 → 215**. Over the whole pinned run there are **420** seed-bearing kills across 14 property files
(`cache.property` 106, `patternLibrary.property` 99, `liveCellSeed.property` 48, `is-deep-equal.property`
42, `liveCellStore.property` 41, `gameOfLife.property` 24, …), against **0** unpinned.

Engagement is separately checkable without any diff, which is worth doing because a null survivor diff
cannot distinguish "nothing was wrong" from "the pin never fired":
`reports/stryker-incremental.json` carried 103 seed markers, all `424242` with no second seed, and
`reports/mutation/scripts.html`'s 654 test titles carried 5, likewise all `424242`.

### The survivor set did not move, and that is a result

Byte-identical at mutant granularity on both scopes — `src/` 98.71% / 17 survivors, `scripts/` 98.83% /
23, all 19 entries of the 10-file control including both RuntimeErrors. **There were no false
survivors**: every prior equivalence ruling was correct, but each had been correct while resting on a gate
that could not see the property layer. No re-audit slice is owed.

Two things this does **not** license:

- The 420 are entirely **first-kill-wins re-attribution.** The unpinned arm _is_ the "property layer
  absent from the gate" arm, and it killed the same mutants, so **on that tree the property layer
  contributed zero mutants to either score.** That is a statement about redundancy on one tree at one
  seed, not about the layer's worth — property tests earn their place by finding defects while a module
  is being written, and `architecture.md`'s `scrollbars.ts` lesson is that a green, correct property can
  coexist with a real bug in what a caller passes it.
- The comparison is a **lower bound.** A pinned run sees one frozen draw, so "no mutant changed fate at
  seed 424242" is not "no mutant could".

### The cache floor collapsed as a side effect

A warm `npm run test:mutation` on an unchanged tree, immediately after a full run, reported
**`1323 of 1323 mutant result(s) are reused`, 0 re-tested, 24s** (26s wall) — against the pre-pin
`1171 of 1306` and ~3m45s.

**Those totals are the trees those runs were taken on, not any current one.** 1,323 was the mutant count
when the cache-floor figure was measured and 1,306 when the older one was; a later `hardener` full run at
`slice/stable-hook-identities` measured **1,658** at 98.61% with 0 NoCoverage. The growth is intervening
slices adding modules, not a configuration change. **The 24s warm-reuse figure has not been re-measured
against any later tree — do not quote it forward as a current cost.** Only a suspiciously _small_ mutant
count would signal something wrong.

The older test-side figures (310 of 383 invalidated cached tests carrying a `with seed=` marker) were
additionally measured with `features/` still in Stryker's sandbox, and are left as the history they are.

As a _cache_ effect the old behaviour failed **safe** — it re-tested more than needed and never falsely
reused a stale result, and three runs on an identical tree gave byte-identical totals. **Read that
fails-safe clause as a statement about the seed churn and nothing wider.** It is _not_ a property of
incremental mode, which does falsely reuse stale results across a dependency edge.

### How the correctness half was found

This is `scripts-mutation-survivors-untriaged`'s discovery record, kept in its own right: it is the
evidence that made the fix a priority, and two of its findings — the execution trace, and
`coverageAnalysis: off` being inert with this runner — are about Stryker rather than about the seed and
outlive it.

Until that slice, this account stopped at the cache reasoning and closed on a sentence — "this is a cost,
not a correctness problem, and no reported score has ever been wrong because of it" — that **was false,
in the dangerous direction.** The cache reasoning itself was unaffected and stands; what that slice found
was a _second, independent_ consequence of the same fact.

The eventual full-run measurement found no mutant on that tree whose only killer was a property test.
**That was not knowable in advance, and it does not make the blindness benign — it makes every
equivalence ruling taken under it lucky rather than sound.**

Measured three ways, all agreeing:

- `hardener`'s A/B on `analyze.ts`'s `.sort()` mutant scoped alone, same config both arms — **seed free →
  Survived (50.00%); seed pinned via `fc.configureGlobal` → Killed (100.00%)**.
- Hand-applying that mutant reds the property **30 runs out of 30**, so "the suite kills it" and "the gate
  cannot" are simultaneously true.
- A throwaway **replica** of that shape — a two-line module, one seed-blind unit test, one property that
  is its only real killer. It reproduced the survival and added the execution trace: instrumenting the
  property body to append the active mutant id shows **100 executions in the dry run and zero against any
  mutant**, while the unit test runs against every one.

> **Trace it in the body, not at module scope.** Vitest evaluates a module once per worker rather than
> once per run, so a module-scope marker reads as "never ran" whatever happens. That artifact cost a
> measurement here.

### `coverageAnalysis: off` does not escape it

Worth knowing before anyone reaches for that lever. The replica probe's mutant survived in every arm
tried — `perTest`, `off` and `all`, plus `perTest` and `off` again with `vitest.related` false — and
`Ran 1.00 tests per mutant` was read off four of those five.

**`off` is inert with this runner.** `vitest-test-runner.js`'s `dryRun` calls `readMutantCoverage()`
unconditionally (the string `coverageAnalysis` does not appear in that file at all), and core's
`TestCoverage.hasCoverage` is just `!!staticCoverage`, so `MutantTestPlanner.planMutant` always takes the
has-coverage branch and always filters by `coveredBy`. So there is **one** mechanism here, not two — an
earlier reading that treated the `off` result as an unexplained residual was reasoning about a config
option the runner ignores.

### What the deterministic twin bought

`analyze.ts`'s sort contract got one, and it moved `scripts/` from 24 survivors to 23.

**`src/`'s own score is suspect the same way and nobody has checked it**: any survivor whose sole killer
lives in one of the 14 `*.property.test.ts` files may be a false survivor. The two figures move in
opposite directions — a false survivor understates the score, so the risk is a _pessimistic_ gate hiding
_optimistic_ individual rulings.

**The pin does not retire the twin, and that is measured rather than argued.** On `analyze.ts`'s `pairKey`
mutant the property now beats the twin to the report under first-kill-wins, while the unpinned control
shows the twin killing it alone.

## The `features/` exclusion, and the figures behind it

What the entry excluded when it landed was a real vitest layer, the seven `*.steps.test.*` files. Those
are gone, and **`features/` now contributes zero tests to `npm test`**, so the entry subtracts nothing
today.

The measurement is kept because it is the argument for the entry and the only written account of why a
`killedBy` naming a step test never meant what it looked like. On the tree it was taken from, the two
scopes genuinely differed: `npx vitest run features/` collected **180** tests from those 7 files (of 837
across 61 files on `ebba2f5`), while the `bd7c388` baseline showed Stryker collecting only **151** from
the same 7 (of 805 across the same 61 files). Same tree, same files, 32 fewer tests seen by Stryker,
because its runner drops any test that finishes without a result (`vitest-test-runner.js` filters on
exactly that, with `bail: 1` set). **Neither figure describes any tree that exists now.**

What the `stryker-excludes-gherkin` slice removed was a duplicate measurement that was also wrong, not a
gate.

**Why `npm run acceptance-mutation` is untouched by any of this.** It spawns `bddgen` and `playwright
test` against a dedicated config, `playwright.acceptance-mutation.config.ts`, via
`scripts/acceptance-mutation/playwright-runner.ts`, and runs against the real tree. Stryker's sandbox and
its `ignorePatterns` are not in the picture at all.

**The silent-rename failure is measured, not assumed.** A probe config carrying
`ignorePatterns: ["/no-such-dir-xyz"]` emits no warning of any kind and collects the identical test count
as `ignorePatterns: []` — 267, scoped to `is-strict-equal.ts`. Today a silent break would readmit no test
at all, which is why the entry has dropped to belt-and-braces; the consequence was severe only while the
layer existed.

`npm run gherkin-lint` and `playwright.config.ts`'s `testDir` also hardcode that directory name;
`vite.config.ts` no longer does, the `acceptanceTests` glob having gone with the layer.

## The crap4ts/Stryker split, and its closing

While the step layer existed, `npm run test:coverage` ran it through `vite.config.ts`, so a line reachable
_only_ from a step test read as covered in `npm run crap4ts` while its mutants were killable only by a
non-`features/` test. The two tools could legitimately disagree about the same line.

`delete-step-test-layer` removed the layer, so `features/` contributes to neither tool. Measured on that
slice's probe tree: `crap4ts`'s per-function table is **byte-identical** before and after the deletion —
111 functions, 0 above threshold, worst 6.0 — so the layer was contributing no gated coverage at all.

Exactly two `src/` files moved, and **both sit outside `crap4ts.config.ts` and `stryker.config.json`
already**: `src/App.tsx` drops out of `coverage/coverage-final.json` entirely (the `acceptance` project
was the only vitest project that mounted `<App />`), and `src/test-support/cellQuery.ts` goes 8/8 → 7/8 as
`cellSelector` loses its only _instrumented_ caller, its live one being `features/screenplay/elements.ts`
on the Playwright side. Neither is a gap to chase.

## Why the `scripts/` cache is never written, read from source

The two configs separate `tempDirName` and their HTML reports as well as their `incrementalFile`, for the
same reason: one shared cache across two different `mutate` lists would corrupt both.

**That the `scripts/` side never writes its file is a fact about Stryker's source, not a single
observation — and the difference matters**, because an `ls` after one run only tells you that run wrote
nothing. `node_modules/@stryker-mutator/core/dist/src/reporters/mutation-test-report-helper.js` writes the
file at exactly two sites, `reportAll` and the handler it registers on `unexpectedExitHandler`, and
**both are gated on `this.options.incremental`** (read on 10.0.0). The schema defaults that option to
`false` and neither config sets it. So even an aborted scripts-side run writes nothing.

## The `--mutate` footguns, read from source

**Last-wins.** `npx stryker run --mutate 'src/a.ts' --mutate 'src/b.ts'` mutates only `src/b.ts` and
reports `Found 1 of 197 file(s) to be mutated`. The mechanism is in the CLI rather than the config:
`stryker-cli.js` declares `-m, --mutate <filesToMutate>` with the coercion `createSplitter(',')`, whose
`(val) => val.split(sep).filter(Boolean)` ignores commander's `previous` argument, so a repeated flag
overwrites rather than accumulates (read on 10.0.0, not inferred). The `Found N of M` line is
`fs/project.js`'s, at `info` level.

`cleaner`'s workflow step 3 is where this bites. `engineering.md` had cross-referenced the trap to this
article for some time, and until `document-the-orchestrating-seat` it was written down nowhere in these
docs — verified with `git grep last-wins cbe9faf -- .claude CLAUDE.md`, which returns that cross-reference
and nothing else. **That ref is pinned to `slice/document-the-orchestrating-seat`'s base on purpose:** the
article uses the word twice, so the same command against `main` now returns the article too, and a claim
written against a moving ref stops reproducing exactly when someone tries to check it.

<!-- reference-check: allow src/a.ts -- illustrative hypothetical CLI example, not a real file -->
<!-- reference-check: allow src/b.ts -- illustrative hypothetical CLI example, not a real file -->

**Overriding config exclusions.** `stryker.scripts.config.json` excludes `!scripts/**/run.ts` repo-wide,
but `npx stryker run stryker.scripts.config.json --mutate 'scripts/halstead4ts/report.ts,scripts/halstead4ts/run.ts'`
mutates `run.ts` anyway, producing a pile of `NoCoverage` mutants and a badly depressed score — measured
**58.82%** against a true 100% — that reads as a genuine coverage gap.

The mechanism is `ConfigReader.readConfig`'s `deepMerge(options, cliOptions)`: `@stryker-mutator/util`'s
`deepMerge` assigns straight through when the existing value `Array.isArray`, so a CLI `mutate`
**replaces** the config's array whole, negations included (read on 10.0.0). The 58.82% is one measurement
on one command and is not re-derived; the mechanism is.

**Second measured instance, from `comment-reference-checks`'s cleanup pass**, and a nastier symptom: the
dropped negation was `!scripts/**/*.test.ts`, so the scan mutated the test files themselves, where a
mutated assertion can be killed by its own neighbours and the score stays plausible. Measured with
`--dryRunOnly`: `--mutate 'scripts/reference-check/*.ts'` reports **`Instrumented 14 source file(s) with
1216 mutant(s)`** — seven modules plus their seven test files — while re-appending the config's negations
reports **`Instrumented 6 source file(s) with 327 mutant(s)`**. The `Instrumented N source file(s)` line
is `Instrumenter`'s, at `info` level.

## The `Timeout` scoring mechanism

`mutation-testing-metrics`' `calculateMetrics.js` computes `totalDetected = timeout + killed` and
`mutationScore = totalDetected / totalValid`, which is why the tallies in this file read `killed+timeout`
as one figure.

## The statement-removal mutator, and a correction

Measured with a scoped, non-incremental run over `src/hooks/useCamera.ts`: `glide.cancel()` — the single
unconditional call the whole zoom-glide cancel invariant rests on — carries an `emptyExpressionMutator`
mutant, replacement `";"`, status **Killed**. So that file's 100% score did answer the question it looked
unable to answer.

The expression-position case yields `void 0` instead, which is why `Scrollbar.tsx`'s `Math.max(0, …)`
clamp — described in `architecture.md`'s `src/scrollbars.ts` bullet — genuinely has no removal mutant. The second suppression is the mutator's own
`filter(mutantsInScope) { return mutantsInScope.length === 1 }`, applied in `babel-transformer.js`'s
`applyMutantFilters` with **scope = the node plus its descendants**. Both readings were verified against
`node_modules/@stryker-mutator/instrumenter/dist/src/`, not inferred.

**The standing lesson survives the correction and is why the paragraph exists:** `cleaner` believed no
such mutator existed, hand-removed the line and found 5 of 872 tests red — the right instinct, reaching an
answer the score had already given.

## Four cautions about reading a run's own numbers

Kept from the removal-experiment record whose framing and remaining bullets are in `archive.md`.

**A `--mutate`-scoped probe's dry run does not collect the whole suite.** `@stryker-mutator/vitest-runner`'s
`vitest.related` option defaults to **true** (its own `dist/schema/vitest-runner-options.json`), so
`dryRun` hands the mutated files to vitest's `--related` and only test files importing them are collected.
Measured **before the step layer was deleted**, on 10.0.0 / vitest 4.1.10, scoped to
`src/equality/is-strict-equal.ts`: 267 tests collected with `ignorePatterns: []` against 219 with the
landed `["/features"]` — on today's tree both arms collect 219. The 48-test delta was exactly
`cell-life-and-death.steps.test.tsx`, which boots `<App />` and so is related to almost everything, while
the six direct-call `.steps.test.ts` files never entered either arm because they do not import
`equality/`.

**`killedBy` is first-kill-wins, so an attribution count is not a coverage count.** The runner sets
`bail: this.options.disableBail ? 0 : 1`, so vitest stops at the first failing test and Stryker records
that one — measured on the `bd7c388` baseline, all 1,278 killed mutants carry **exactly one** `killedBy`
entry, never more. So "324 of 1,278 kills were attributed to a `features/**` test" means _a Gherkin step
got there first_, not _only a Gherkin step could kill it_. **The fact that no mutant was killed by a mix
of Gherkin and non-Gherkin tests is an artifact of first-kill-wins, not corroborating evidence** — under
`bail: 1` a mixed attribution is unrepresentable.

The baseline's attribution table, for the record: 292 of the 324 went to
`cell-life-and-death.steps.test.tsx` alone; the largest non-`features/` attributions were
`src/cache.test.ts` (173), `src/hooks/useCamera.test.ts` (62), `src/liveCellSeed.test.ts` (57), and
`src/components/LifeBoard.test.tsx` (55), with 104 kills carrying an id that resolves to no test file.

**Per-test attribution is unreliable in the other direction too**, and that was recorded first — see the
mutation-scan note above `getBoundsSnapshot` in `src/liveCellStore.ts`.

**A kill reported as `Timeout` rather than an assertion failure is not coverage anyone should rely on.**
The scoring mechanism is above; this bullet keeps the four-caution record whole.

<!-- reference-check: allow cell-life-and-death.steps.test.tsx -- measured against the now-deleted jsdom step file, before delete-step-test-layer; the figures above are historical measurements, not a live claim -->

## The allowlist hole that `sharedExclude` closed

**This is the soundness argument for the allowlist clause, not decoration.** `vite.config.ts`'s `unit`
project inherits the **unrooted** `**/*.{test,spec}.?(c|m)[jt]s?(x)` include, and until
`shared-exclude-covers-docs-dirs` landed, `sharedExclude` covered `scripts/**` and `.claude/worktrees/**`
but neither `ideas/` nor `.claude/` as a whole.

Measured twice with throwaway probes: `npx vitest list` collected `[unit] .claude/__probe.test.ts` **and**
`[unit] ideas/__probe.test.ts` — and the second imported `src/gameOfLife`, so it would have run inside
Stryker's sandbox and changed mutant fates while the path check still answered "invariant".

The predicate therefore carried a second conjunct — the diff must name no `*.test.*`/`*.spec.*` path under
either directory — from the pass that found the hole until the pass that cured it. **That conjunct is
retired.** The invariant now lives in `sharedExclude`, where a config entry holds it rather than a
per-merge grep nobody can be relied on to run.

**The unrooted include measurably still reaches everywhere else.** Probes dropped into `perf/`, `rules/`,
`rule-tests/`, `patches/` and `public/` are all collected into `unit` on the landed tree — 66 files
against the usual 61.

<!-- reference-check: allow ideas/__probe.test.ts -- a throwaway measurement probe, never committed to git, so it can never resolve -->

## The two sections relocated from `engineering.md`, 2026-09-09

`split-engineering-article` moved "Ruling a mutation survivor equivalent" and "Skipping a test under the
mutation runner" out of `engineering.md` and into the article whose read trigger already named the first
of them. This is the evidence those two sections carried.

### The `// Stryker disable` measurement

**`// Stryker disable` is not the better alternative here — that was measured, in `render-perf-improvements`, and rejected.** Stryker's instrumenter does support comment directives, so the obvious question is whether disabling mutants on just the affected declarations lets the test run. It does not, and the reason generalises: the React Compiler bailout is triggered by the _file's_ instrumentation, not by the individual mutant switches. Measured against the two landed cases (the useLiveCell hook has since been retired by `collapse-dead-cell-layer`, which deleted the per-cell store subscription it wrapped; the table is left as the measurement it was rather than re-fitted to a tree it was not taken on, and the second landed case today is `useLiveCells.ts`, its whole-set successor):

| what was tried                                           | mutants measured in that file                                    | does the test pass under Stryker |
| -------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| `it.skipIf` (what's landed)                              | `Grid.tsx` 23/23 killed, the retired useLiveCell hook 3/3 killed | no — it doesn't run              |
| `// Stryker disable all` around the specific declaration | unchanged                                                        | **no** — dry run still fails     |
| `// Stryker disable all` at the top of the file          | **0 of 23**, **0 of 3**                                          | yes                              |

Neither tool is malfunctioning, so no upstream fix is coming: Stryker's instrumentation is a read of a mutable global during render, which is on React's own documented list of bailout conditions. The interaction has no public report — the nearest analogue is [stryker-js#2704](https://github.com/stryker-mutator/stryker-js/issues/2704), where instrumentation displaces the `@flow` pragma and silently disables that Babel plugin — and it is worth reporting now that React Compiler is stable and default-on in Next.js, since the population hitting it is about to grow.

### The seed-title gap, and what survived closing it

**A property test used to kill in the suite and be unable to kill in the gate. That gap is now closed here, and the habit it taught is the part to keep.** `@fast-check/vitest` puts the run's seed in the test _title_; Stryker filters each mutant run by the **dry run's** test names; the seeds differed between processes, the title never matched, and **a `test.prop` body never executed against any mutant** — so "hand-applying it reds the property" and "the gate reports Survived" were both true at once, and only the second is what a mutation score means. `pin-stryker-seed-to-unblind-the-mutation-gate` fixed it for this repo's property tests specifically, by pinning the seed when and only when the process is running under Stryker; measured, seed-bearing kills went from 0 to 420. Three things survive the fix. **One**: the general shape does — a runner that varies a test's _title_ between runs is invisible to a filter that matches by name, and CONTRACT-mode question 4 exists because that class of lifecycle question is answered by measuring, not by reasoning. **Two**: the deterministic `it.each` twin is **not** made redundant. `killedBy` is first-kill-wins, so a property now beating a twin to the report says nothing about whether the twin was needed — measured on `analyze.ts`'s `pairKey`, where the pinned property wins the race and the unpinned control shows the twin killing the mutant alone. **Three**: a pinned run freezes one draw, so a green gate is evidence about that draw and not about the arbitrary's whole range. Still say which run you mean, and still prefer a twin when a specific survivor needs specific inputs named.

### The 23-survivor triage behind the two-line budget

The worked example is `scripts-mutation-survivors-untriaged`, which triaged 23 unexamined `scripts/` survivors. Every survivor whose site already carried an equivalence comment survived scrutiny intact; the two rulings that had to be overturned mid-slice, and the one **live defect** the slice then found in unmutated source, were all at the one site whose equivalence depended on a collision space shared between two functions (`analyze.ts`'s `pairKey` and its two callers). Read the arrow carefully — n is 23, and the likeliest common cause is that locally-arguable sites are both easier to comment and easier to get right, not that the writing itself confers correctness. The rule above holds under either reading.

That slice also supplied the counter-shape the budget has to tolerate. `analyze.ts`'s loop-bound and diagonal-guard comments run past two lines and reason across functions — and both are _correct_, confirmed by hand-application at full scope. What distinguishes them from the one that was wrong is not length: it is that each is a **closed** argument about a value space the file itself defines, and each now carries the measurement that settles it. The warning fires on an argument that is long because it is _unresolved_, not on one that is long because it is documented.
