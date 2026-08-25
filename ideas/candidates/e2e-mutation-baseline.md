---
name: e2e-mutation-baseline
title: The measurements that gate moving the acceptance contract onto Playwright
created: 2026-08-25
---

## Context

The programme that retires the step-test layer onto Playwright has three stop
conditions, fixed before measuring so they could not be rationalised afterwards.
This file records what was measured, on `main` at `c0a5609`, M2 Pro, quiet
machine. **All three clear.**

## The stop conditions

| #   | condition                                             | result                                          |
| --- | ----------------------------------------------------- | ----------------------------------------------- |
| 1   | any flake in five `test:e2e` repetitions              | **clear** — 5/5, 59 passed each                 |
| 2   | per-mutant cost above 2.5× (>~570s)                   | **clear, but only with mitigation** — see below |
| 3   | a CRAP regression whose lost coverage needs `<App />` | **clear** — zero unique coverage                |

## 1 · Flake — zero

```
rep 1: 25s | 59 passed     (cold: includes dev-server boot)
rep 2: 21s | 59 passed
rep 3: 21s | 59 passed
rep 4: 21s | 59 passed
rep 5: 21s | 59 passed
```

`--retries=0` throughout. This mattered more than it looks: under the adapted
runner a flaky failure scores as `killed` and **silently inflates the only
mutation signal `features/` would have**.

## 2 · Cost — and the mitigation is load-bearing, not polish

Per-spawn, dev server already up:

| shape                             |      cost | note                           |
| --------------------------------- | --------: | ------------------------------ |
| passing spec                      |  **3.9s** | n=3 (4119 / 3933 / 3919 ms)    |
| failing — assertion on a value    |  **6.7s** | the ordinary mutated-cell case |
| failing — locator matches nothing | **31.1s** | the full 30s test timeout      |

**An 8× spread between failure shapes**, and ~55 of 58 spawns fail on purpose.
Playwright configures no action timeout (default 0, unbounded), so a mutated
value that makes a locator match nothing burns the _test_ timeout.

`--timeout` bounds it linearly — measured, not assumed:

```
--timeout=30000 -> 31.1s      --timeout=8000 -> 9.1s      --timeout=4000 -> 5.1s
```

Baseline test durations, for setting it: **slowest 4255ms** ("zoom clamps to the
minimum after enough zoom-out clicks" — legitimately click-heavy), p95 3365ms,
median 1009ms. The plan's "3× slowest" rule therefore gives ~12.8s.

**Projections, and the reason the discipline is not optional:**

| mitigation                                   | projected full run |                          vs today's 226s |
| -------------------------------------------- | -----------------: | ---------------------------------------: |
| none                                         |              ~575s | **2.5× — exactly at the stop condition** |
| global `--timeout=12800` only                |              ~437s |                                     1.9× |
| + per-assertion timeouts in step definitions |              ~380s |                                 **1.7×** |

So the programme is inside its own budget **only because of the timeout
discipline**. Per-assertion timeouts are the better lever: they bound the tail
independently of the global setting, which is otherwise dragged up by one
legitimately slow baseline test.

Mix assumed: 8 of `pattern-library`'s 24 mutants hit the `pattern` **name**
column and are the locator-matches-nothing shape; the rest are value assertions.

## 3 · Coverage — the acceptance project contributes nothing crap4ts can see

```
without acceptance : 111 functions | 0 above threshold (6) | worst 6.0 | PASS
with acceptance    : 111 functions | 0 above threshold (6) | worst 6.0 | PASS
per-function row diff: EMPTY
```

Stronger than the condition asked for. It required that no function _cross_ CRAP
6; what was measured is that **no row moves at all**. Independent corroboration
of the programme's premise — `CLAUDE.md:130`'s "strict subset" claim, arrived at
by a different route.

Run in the prescribed order (`--project unit --project property --project dom`,
read crap4ts, then `npm run test:coverage` to restore truth on disk), because
crap4ts reads `coverage/coverage-final.json` off disk and never regenerates it.

## Reference figures, not re-measured

- **`npm run acceptance-mutation`**: 226s, 55 mutants / 55 killed / 0 survived.
- **`npm run test:mutation:full`**: 98.70%, 1287/1304, 17 survivors, 563s —
  measured at `a59633e`; `main` has advanced only by `ideas/*.md` since, so it is
  current. Deliberately not re-run: nothing Stryker sees has changed.

## What this does not measure

- **The failing-run cost of a _generated_ spec.** Every figure above comes from
  hand-written specs. `playwright-bdd` adds a `bddgen` step per spawn, unmeasured,
  and its generated specs have different test granularity (one per scenario, not
  per step).
- **`pattern-library`'s cost specifically** — it has no `.e2e.spec.ts` yet, so its
  24 mutants (44% of the surface) are projected from other specs' behaviour, not
  observed. Re-measure at T4.
