---
name: perf-precondition-assertion-races-under-load
title: Make the perf harness's population precondition auto-wait instead of snapshotting
created: 2026-09-01
---

## Context

Hit while regenerating the `main` perf baseline before `collapse-dead-cell-layer`.
`generation-advance-1k-inview` failed at **1920×1080** — and only there — with

```
expected ~967.2 alive cells in view, requestedCount=1000
Expected: > 677.05
Received: 6
```

The same scenario **passed at 1280×900 in the same run**, and passed **3/3 when
re-run in isolation** immediately afterwards. So it is load-dependent, not a
seeding defect: the seed query (`?cells=1000&spread=30`) is viewport-independent,
so the alive cells simply were not mounted-and-marked yet when the count was
taken.

**The mechanism is a non-waiting read.** `assertInViewAlivePopulation`
(`perf/population.ts`) does

```ts
const aliveCount = await page.locator(`#grid-content ${ALIVE_CELL_SELECTOR}`).count()
```

`.count()` is a single snapshot with no auto-wait, unlike `expect(locator).toHaveCount(n)`.
A larger viewport mounts more cells and takes longer to settle, which is why
1920×1080 loses the race and 1280×900 does not.

**This is the same failure class `product` diagnosed in
[[pattern-library-e2e-flakes-under-load]]** — passes in isolation, fails under
load, non-waiting read downstream of a render. Two independent sightings in
different directories now, which is the argument for treating the _shape_ as the
finding rather than each instance.

**Why it matters beyond one red test.** The assertion is a guard, and its comment
says so: _"tight enough that an unseeded/silently-empty grid (aliveCount near 0)
always fails it."_ It is doing its job. But a flaky guard on a **precondition**
fails the whole scenario, which means:

- `npm run test:perf` exits nonzero, so a chained `&& npm run perf-report` never
  runs and the previous run's `reports/perf/latest.md` stays in place — exactly
  the stale-report trap CLAUDE.md warns about, reached by a route it does not
  mention;
- `reports/perf/raw/` is left holding a **mix** of the current run's samples and
  one stale sample from whenever that scenario last passed, so a later
  `perf-report` blends two trees in one report with nothing saying so.

Both of those happened on this run and had to be cleaned up by hand.

## Sketch

Replace the `.count()` snapshot with Playwright's retrying assertion. The bounds
are a range rather than an equality, so it needs the polling form:

```ts
await expect
  .poll(() => page.locator(`#grid-content ${ALIVE_CELL_SELECTOR}`).count())
  .toBeGreaterThan(expectedCount * 0.7)
```

or an `expect.poll` over a predicate covering both bounds. Keep the failure
message — it names `expectedCount` and `requestedCount`, and that is what made
this diagnosable in one read.

**Check the sibling guard too**: `assertOffscreenSeedTookEffect` is the
off-screen half of the same file and may carry the same shape.

**Consider the two operational consequences separately from the fix**, because
they bite for any perf failure, not just this one:

- Should `test:perf` and `perf-report` be one script, so the report cannot be
  silently skipped by a nonzero exit? CLAUDE.md currently documents them as two
  deliberately separate commands and warns about exactly this, so changing it is
  a docs change as well as a `package.json` one.
- Should a failed scenario's **stale raw sample be deleted** rather than left, so
  a later `perf-report` cannot blend trees? Failing loudly with a missing
  scenario is better than a plausible report over mixed inputs.

## Touches

`perf/population.ts` (both guards), possibly `package.json` and CLAUDE.md's
`test:perf` / `perf-report` entries, and `scripts/perf-report/` if the
stale-sample question is answered on the report side.

Note `perf/` is deliberately outside every quality gate and is **orchestrator-owned** —
no role runs `npm run test:perf`, so a fix here is verified by running the harness,
not by a gate.

## Open questions

- Is the race in _mounting_ or in _marking_? `ALIVE_CELL_SELECTOR` matches
  `aria-pressed="true"`, so a cell could be mounted-but-not-yet-pressed, or not
  mounted at all. That distinction matters if `collapse-dead-cell-layer` lands
  first, since it changes what is mounted at all.
- Does `assertOffscreenSeedTookEffect` share the defect, or does its assertion
  shape already tolerate the delay?
- Would raising the retry ceiling merely move the failure to a busier machine?
  The honest fix is auto-wait, not a longer fixed budget — the same reasoning that
  ruled out `expect.timeout` in the pattern-library flake.
