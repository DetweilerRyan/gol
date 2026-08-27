---
name: pattern-library-e2e-flakes-under-load
title: Find out why pattern-library aborts acceptance-mutation under load, now that evidence is captured
created: 2026-08-27
---

## Context

**This file has been rewritten once.** Its first form named a hypothesis (an un-settled Headless UI
enter transition) and a fix for it. A `product` investigation falsified that hypothesis and two
other readings, could not reproduce the failure at all, and stopped rather than ship a guess. An
`architect` ADJUDICATE pass then ruled, landed evidence capture, and rewrote this file. **The
concern is still outstanding; what changed is the size of the search space.** Read the falsification
section before spending another pass here — two of the obvious avenues are already closed by
measurement, and one reported symptom is provably not what it looked like.

### The original report, unchanged

Found by `product` at `scripts-mutation-survivors-untriaged`'s VERIFY, as a bucket-D defect --
pre-existing, outside that slice's manifest, and reported rather than fixed. `git diff --stat
main...HEAD -- features src` was empty, so every file these tests execute was byte-identical to
`main`.

**`features/pattern-library` scenarios fail intermittently under parallel load, and the failure
aborts `npm run acceptance-mutation` before it scores anything.** Observed rate: the mutation run
aborted **3 of 5** attempts; `npm run test:e2e` failed 1 of 2. Both green on a quiet machine, and
the failing e2e run took 55.8s against 28.1s for the passing one, so it is load-dependent. Four
distinct failing assertions were observed:

1. `features/screenplay/interactions.ts:128` -- `choosePatternFromLibrary`'s `.click()`: _element
   was detached from the DOM, retrying_
2. `features/steps/pattern-library.ts:123` -- `expect(previewCells(page)).toHaveCount(8)` got **0**
3. `features/steps/pattern-library.ts:133` -- `expect(actual.length).toBe(expected.length)`,
   expected 5, received 2
4. `features/screenplay/expectations.ts:26` -- `Cell 20, 20` `aria-pressed` expected `"true"`, got
   `"false"` -- the pattern was never stamped

**The runner's guard behaves correctly** -- it aborts naming the target rather than scoring mutants
against a red baseline. The flake is upstream of it.

## What has been falsified

**Not reproducible: ~1,300 pattern-library executions, zero failures**, across nine load models --
11-16 workers with `--repeat-each`, 12 concurrent CPU hogs, a concurrent 14-worker second suite, 20x
CDP throttling, in-page 3-second main-thread stalls, concurrent vitest loops, and this file's own
former `ACCEPTANCE_MUTATION_DIR` repro recipe (8 of 8 green, against the reported 1-of-2 failure).
The concurrent-suite model **reproduced the incident's duration signature** -- 49.7/49.9/57.1s
against the report's 55.8s vs 28.1s quiet -- and still went 132/132 green. **The slowdown reproduces;
the failure does not.** Do not treat "I could not make it fail" as a new finding; it is this file's
starting condition now.

- **The un-settled-transition race is dead.** `MutationObserver` on a real modal cycle: on close,
  `#root` loses `inert`/`aria-hidden` at t+167.9ms while the dialog subtree is removed at t+282.6ms
  -- the grid is interactive **~115ms before** `choosePatternFromLibrary`'s `toHaveCount(0)` can
  return. On open, two wrappers are _added_ and nothing is removed, so there is no remount and
  nothing to detach. Arming and closing are the same React state update, so `toHaveCount(0)` already
  implies armed. **`openPatternModal` does not need a settle step**; that was this file's own sketch
  and it would have been a no-op.
- **A vite full-reload mid-test is dead.** It fit all four symptoms. Driving the HMR broadcast at
  ~2/s through a full run: 44 passed, and a direct probe showed `framenavigated` unchanged. Vite's
  payload is path-scoped and the client at `/` ignores a `/playwright-report/index.html` path.
  Recorded because it is a genuinely plausible dead end someone will re-derive.
- **Symptom 3 is unreachable as transcribed, so there is no second ordering bug.** This file
  previously flagged it as possibly "a second, separate problem in the step's assertion ordering."
  It is not. Set algebra on `features/steps/pattern-library.ts`: lines 131-132 passing forces
  `shown === named`, so `|named| <= |actual| = 2`, so `expected`'s five entries would have to
  collapse to <=2 distinct pairs -- impossible, since no baseline row carries a duplicate and
  `mutateCommaList` perturbs one part in place (worst case 5 distinct -> 4). Independently,
  `src/patternPlacement.ts`'s `previewPositions` is **0-or-all**, so a 2-cell preview of a 5-cell
  pattern does not exist in any state. That also closes the "the line attribution is off" escape.
  The most likely explanation is a transcription error in the original report.

## The surviving hypothesis -- and it IS a hypothesis

Neither Playwright config sets `expect.timeout` or `timeout`, so the defaults apply: **5s** per
retrying assertion, **30s** per test. Symptoms 2 and 4 are both 5-second retrying assertions
expiring. Symptom 1's "element was detached from the DOM, retrying" is Playwright's click **retry
banner** from the call log, not a failure in itself -- it surfaces only when the click eventually
hits the 30s test timeout. That is the signature of a machine saturated past both defaults, rather
than of a race. Nothing here has been confirmed against a real failure, because no real failure has
been observed since the incident.

## What was landed, and why it is not the fix

`playwright.acceptance-mutation.config.ts` now sets `trace: 'retain-on-failure'`,
`screenshot: 'only-on-failure'`, and a dedicated `outputDir: 'test-results-acceptance-mutation'`.
**This changes no test and fixes nothing.** It exists so the next recurrence produces evidence
instead of another algebra exercise -- this pass was an algebra exercise precisely because
`trace: 'off'` had left nothing to autopsy. It is on by default rather than behind a flag because an
opt-in trace is worthless for a failure ~1,300 executions could not reproduce: it has to be captured
on the run that fails.

Two facts about the artifacts, both measured or read from source, that the next pass needs:

- Playwright deletes a project's `outputDir` during run **setup**
  (`createRemoveOutputDirsTask`, playwright 1.62.1 `lib/runner/index.js`). The dedicated directory
  stops `npm run test:e2e` wiping an aborted run's evidence, but **acceptance-mutation still wipes
  its own** -- so after an abort, read `test-results-acceptance-mutation/` BEFORE re-running.
- An abort stops the run inside the baseline phase, so the baseline phase's artifacts are the ones
  that survive. That is the phase whose evidence matters.

Cost, measured back to back on one machine, `npm run acceptance-mutation -- --feature
pattern-library` (24 mutants, 24 killed both times): 1:35.97 / 3.0M with `trace: 'off'`, 1:46.59 /
40M with `retain-on-failure`. Note `'off'` was never artifact-free -- Playwright already wrote a
~116K `error-context.md` ARIA snapshot per failed spec, which is that 3.0M.

## Levers deliberately NOT pulled

- **`retries`.** Unchanged at 0, and it must stay there. A retry would make "the mutant run passed"
  and "the mutant run passed on retry after a flake" indistinguishable, silently inflating the only
  mutation signal `features/` has. This is the one lever that would be worse than the flake.
- **Raising `expect.timeout` in `playwright.acceptance-mutation.config.ts`.** Ruled out for now, not
  forever. It is not `retries` -- it re-runs nothing, so it cannot turn a flake into a silent
  `killed` -- but it is equally unvalidatable while nothing reproduces, and its cost is certain
  where its benefit is hypothetical: 8 of the 24 `pattern-library` mutants hit the **name** column,
  and a mutated name matches no button, so those specs wait out the full timeout on purpose. Raising
  it taxes every deliberate failure on every run of every slice -- the same tax this file was filed
  about. It also would not have saved the incident on its own: the surviving hypothesis has the
  machine blowing past the **30s test timeout** too, so raising the 5s expect timeout alone only
  changes which timeout fires.

  **Falsifier, so this is a decision and not a standing refusal:** if a captured trace shows the
  assertion was within a few hundred ms of settling when it expired, raise the timeout then. If it
  shows a multi-second main-thread stall or a hung browser, the timeout was never the lever and
  raising it would only have made the abort slower.

## Where a next pass should start

1. **Wait for a recurrence and read the trace.** That is the whole point of what was landed. There
   is no longer a cheap way to make progress without one -- nine load models did not produce it.
2. If a recurrence never comes, consider closing this as not-reproducible rather than fixing it
   speculatively. An unreproducible flake fixed by guess leaves a permanent unexplained change in
   the gate.
3. Do **not** re-walk the transition race, the vite reload, or symptom 3's assertion ordering.

## Touches

`playwright.acceptance-mutation.config.ts` (`architect`'s, by the precedent
`rules/no-playwright-config-import-in-mutation-config.yml` already sets), `.gitignore`. If a trace
ever justifies a real fix, that fix most likely lands in `features/screenplay/interactions.ts` or
`features/steps/pattern-library.ts`, which are `product`'s.

## Open questions

- Was the original incident's machine doing something no synthetic load model reproduced -- a
  Stryker run, a perf harness, a second worktree's full gate? The report does not say what else was
  running, and that is the one variable the nine models could not replay.
- Does anything else in the suite share this shape, or is the pattern library the only feature that
  aborts? Every observed symptom is in one feature, which is itself a clue nobody has explained.
