# perf/ -- the render-performance harness

Playwright specs that measure render cost against a real Chromium, real
DOM, real CDP metrics -- not a substitute for `e2e/*.e2e.spec.ts` (which
proves correctness) and not covered by `crap4ts`/Stryker/`dry4ts` (see
`vite.config.ts`'s exclude and `crap4ts.config.ts`'s glob). Run it with:

```bash
npm run test:perf      # runs every scenario, both viewports, writes reports/perf/raw/*.json
npm run perf-report     # turns those raw samples into reports/perf/latest.md / latest.json
```

## Report-only, always

`npm run test:perf` has no pass/fail threshold of its own -- every
scenario's assertions are population sanity checks (see "The population
assertion" below), not performance budgets. A successful run always exits
0, regardless of how slow the numbers it produced are. Nothing here is a
CI gate, the same stance `gherkin-dry-checker`/`halstead4ts` take (see
`CLAUDE.md`). If this suite should ever gate a build, that is a decision
for a later slice to make deliberately, not something that falls out of
adding a `toBeLessThan` to a scenario.

## Why a production build, not `npm run dev`

`playwright.perf.config.ts`'s `webServer` runs `npm run build:perf && npm
run preview:perf` -- a real `vite build --mode perf` served by `vite
preview`, never the dev server. React's `<StrictMode>` (wrapping `<App
/>` in `src/main.tsx`) double-invokes render-phase work in development
specifically to surface impure renders; every render this harness measures
would be counted twice under `npm run dev`, and every scenario's numbers
would be meaningless as an estimate of what a real user's browser does.
`playwright.config.ts` (the black-box e2e suite) can get away with `npm
run dev` because it never times anything -- this harness can't.

## Why its own Playwright config

`playwright.perf.config.ts` is deliberately not a `projects` variant of
`playwright.config.ts`. Everything that config carries for _correctness_
testing -- trace capture, video, screenshots, retries -- is itself CPU and
IPC work that would perturb the exact `ScriptDuration`/`LayoutDuration`
numbers this suite exists to produce, so all of it is off unconditionally
here. It also runs serially (`fullyParallel: false, workers: 1`) since a
second worker's script/layout work would land inside the first worker's
CDP metrics window, and it always rebuilds
(`reuseExistingServer: false`) so a stale non-perf build can never be
measured by accident.

## The rAF-pacing condition, and what breaks without it

Every gesture driver in `perf/gestures.ts` awaits a
`requestAnimationFrame` round-trip between each input event
(`panPaced`, `zoomWheelPaced`, `clickPaced`). `page.mouse.move`/`.wheel`
dispatch `Input.dispatchMouseEvent` as fast as CDP will take it; Chromium
then _coalesces_ the resulting pointermove/wheel events into however many
actually get processed before the next paint. Drive a gesture unpaced and
the rAF timestamps a scenario records describe how fast CDP could accept
input, not how fast the app could render it -- a number that looks
entirely plausible and measures the wrong thing. `gestures.ts` has no
un-paced sibling exported, on purpose: if one existed, some future
scenario would reach for it "just this once," and nothing would flag the
resulting number as wrong.

## The `addInitScript` self-containment constraint

`perf/instrumentation.ts`'s `installPerfInstrumentation` is passed to
`page.addInitScript`, which serialises it via
`Function.prototype.toString()` and evaluates that source in a fresh page
realm with no module scope. The function may reference nothing from
outside its own body -- no imports, no closures over this file's top
level. Violating that throws a bare `ReferenceError` _inside the page_,
which Playwright does not surface as a test failure: the collector arrays
just stay empty and the scenario reports a confident, silently-empty
sample. See that file's own header comment before touching it.

## `perf/` computes no statistics

Every file in this directory writes exactly one thing to disk per
scenario/project pair: a `RawScenarioSample` (raw per-rep arrays, see
`scripts/perf-report/raw-sample.ts`), via `raw-sink.ts`. No median,
percentile, or ratio is ever computed here -- that's
`scripts/perf-report/`'s job entirely, because it's the gated layer
(unit-tested, Stryker-covered) and `perf/` is not. This is the thing most
likely to erode first: it is very tempting, mid-scenario, to reach for
"just log the average wall clock" for a quick sanity check while
iterating. Don't leave that in. If a scenario needs an assertion beyond
the population check, that assertion belongs in
`scripts/perf-report/`'s test suite, not as inline arithmetic in a
`perf/*.perf.spec.ts` file.

The half of that boundary a tool can check -- that the two directories
exchange types and never runtime code -- is checked by
`rules/no-value-import-across-perf-boundary.yml`: `import type` across the
boundary is fine (it is erased), any value import in either direction warns
in `npm run ast-grep`. What no tool can check is the other half, "no median
computed here"; that one is on the reader.

## CDP reports durations in seconds, not milliseconds

Every duration in a `RepSample` that this directory produces directly
(`frameIntervalsMs`, `eventDurationsMs`, `wallClockMs`) is milliseconds.
`metricsDelta`, sourced from `perf/cdp-metrics.ts`'s wrapper around CDP's
`Performance.getMetrics`, is the one exception: its duration/CPU-time
counters (`TaskDuration`, `ScriptDuration`, `RecalcStyleDuration`,
`LayoutDuration`, and others -- see
`scripts/perf-report/units.ts`'s `DURATION_METRIC_KEYS`) are reported in
_seconds_. `perf/raw-sink.ts` records whatever CDP returns exactly as
received -- unconverted -- so the on-disk raw sample stays a faithful
record of what the browser actually said. `scripts/perf-report/units.ts`
does the seconds-to-milliseconds conversion once, at report time, driven
by that explicit key list (count/byte-size keys like `LayoutCount` and
`JSHeapUsedSize` are left alone). The run header's `TaskDuration/wallClock
ratio` line exists specifically as a tripwire against this: a pan gesture
keeps the main thread essentially fully busy, so that ratio should read
close to 1.0. Before this conversion existed it read ~0.0009 (seconds
compared against milliseconds); if it ever drifts back toward that again
-- a future Chromium CDP behavior change, say -- that is a signal to go
re-derive the units from a real CDP response, not something to shrug off.

## The population assertion is mandatory for every seeded scenario

Every scenario that seeds live cells (`?cells=...` via
`src/liveCellSeed.ts`) asserts its population _before_ measuring, via
`perf/population.ts`. A silently-failed seed -- a typo'd query string,
`parseSeedRequest` rejecting an input that looked valid,
`App.tsx`'s `initialLiveCells` prop wiring regressing -- produces a
perfectly plausible-looking measurement of what is actually an _empty_
grid, and nothing else in this harness would notice (an empty-grid pan is
a legitimate scenario in its own right). This is also the only place in
the whole repository that exercises `App.tsx`'s `initialLiveCells` prop
end to end: that prop has no unit test, since `App.tsx` is
composition-root code deliberately outside the unit-test gates (see
`CLAUDE.md`'s Architecture section).

In-view scenarios (small `spread`, e.g. `spread=30`) count alive cell
buttons directly in the DOM against an analytically-expected fraction.
Off-screen scenarios (`spread=200`, far outside the default viewport)
can't do that -- the DOM has nothing to count -- so they assert via
scrollbar geometry instead: `computeAxisScrollbarMetrics` derives the
thumb size from `computeContentBounds` over the _whole_ live-cell set, so
a populated 50k-cell grid produces a visibly shrunk thumb and an
unseeded/empty grid leaves the thumb spanning the full track.

## Scenario 3's `computeContentBounds` hypothesis

`pan-default-50k-offscreen` exists to test a specific hypothesis:
`LifeBoard.tsx` calls `computeContentBounds(liveCells)` unconditionally
in its render body -- once per `pointermove` during a pan -- and that
function is O(live count) with a `split(',')` + two `Number()` calls per
key. At 50,000 live cells, the expectation was that `ScriptDuration`
would explode relative to the 0-live-cell baseline while
`RecalcStyleDuration`/`LayoutDuration` stayed flat.

**React Compiler is enabled project-wide, and it may already memoize that
call on `liveCells` identity** -- which does not change during a pan, so
a memoized call would make this scenario land flat, indistinguishable
from the empty-grid baseline. That is not a broken scenario; it is a
valid, valuable finding in its own right (the compiler already doing the
job a later slice might otherwise have hand-rolled). Whichever way a given
run lands, read `ScriptDuration` per move-event (`metricsDeltaPerMoveEvent`
in `reports/perf/latest.json`) against `pan-default-empty`'s -- don't
tune the harness (rep count, move count, seed size) to try to force the
"expected" shape.

## The tile-boundary wobble family (scenarios 6-8)

`perf/tile-boundary.perf.spec.ts` is the one scenario family whose subject is
a _geometry_, not a population or a zoom level, and it is the only one that
uses a non-monotone gesture. Read `perf/gestures.ts`'s `panWobblePaced`
header and `src/cellTiles.ts`'s `tileRangeHolds` comment before touching it.

`cellTiles.ts` mounts a world-anchored tile range and keeps it while it still
covers the viewport, tolerating up to `EVICT_LAG_TILES` of staleness on a
side. That hysteresis protects the trailing edge only. Where the viewport is
a whisker wider than a whole number of tiles, the leading and trailing tile
edges cross within the same sub-cell step, so a small back-and-forth pan
_shifts_ the covering set rather than widening it -- neither position's range
contains the other's, and **every** step rebuilds. That defect shipped
knowingly; this family is what measures it, before and after the fix.

Nothing in scenarios 1-5 can see it. `panPaced` interpolates monotonically
from `from` to `from + delta`, so the camera's world offset is monotone for
the whole gesture, and a monotone offset crosses any given tile boundary at
most once.

### The geometry, and why 1280x900 only

The two crossings sit `(widthPx / cellSize) mod TILE_SPAN_CELLS` cells apart
-- so a wobble thrashes only when its travel exceeds that gap _and_ its phase
straddles both crossings.

| viewport | cellSize | width in cells | in tiles | gap between crossings |
| -------- | -------- | -------------- | -------- | --------------------- |
| 1280     | 8.192    | 156.250        | 39.0625  | 0.25 cells (2.048px)  |
| 1280     | 10.240   | 125.000        | 31.2500  | 1.00 cell (10.24px)   |
| 1280     | 20.000   | 64.000         | 16.0000  | coincident            |
| 1920     | 8.192    | 234.375        | 58.5938  | 2.375 cells (19.5px)  |

The wobble is 5px: above `dragGesture.ts`'s `DRAG_THRESHOLD_PX` of 4 (below
it the drag never becomes a pan at all and the scenario measures a camera
that never moved), and above 2.048px so it spans both crossings at 1280 /
8.192. No rung of the zoom ladder brings the crossings within 5px of each
other at 1920 wide, which is why `playwright.perf.config.ts` carries a
`testIgnore` for this file on the 1920x1080 project -- excluded loudly, with
the reason, rather than left to fail its own precondition search.

### Every scenario asserts its own phase before measuring

This is the part that matters. At 1280 / 8.192 the qualifying phase window is
about 3 whole pixels out of a 32.768px tile pitch -- roughly 6%. Land outside
it and the wobble is ordinary panning: the numbers come back clean, look like
a successful measurement, and say nothing at all. Same failure shape as an
unseeded population (see above), and handled the same way.

`perf/tile-boundary.ts` therefore (a) reads the camera back out of the
rendered DOM -- `#grid-content`'s own rect plus two cell buttons' rects --
rather than assuming what the zoom clicks produced, and (b) predicts the
rebuild count over the planned gesture using the app's _own_ policy function,
`cellTiles.ts`'s `nextTileRange`. The thrash row asserts at least
`moves - 2` predicted rebuilds; the two control rows assert at most 1.

The setup nudge that finds the phase is applied **rightward**, and the
direction is load-bearing rather than arbitrary: panning right decreases
`offsetX` monotonically, which leaves the retained range's minimum tile
exactly on the covering minimum. Approach from the other side and the
retained range can be one tile wider on precisely the side the wobble travels
toward, in which case it contains both of the wobble's covering sets, holds
for the whole gesture, and the scenario measures a confident zero while every
precondition still passes. See `findThrashNudgePx`'s comment.

### The headline number is node churn, not milliseconds

`instrumentation.ts` grows an optional `MutationObserver` (config's
`nodeChurnSelector`) that counts DOM nodes added plus removed under the cell
layer per rep, surfaced as `RepSample.nodeChurnCount` and reported as the
`Node churn/move` column. Milliseconds are machine-specific and noisy; the
strip mount/unmount count is exact, is what a hysteresis fix has to move, and
is comparable between runs on different hardware.

That field is **optional** on `RepSample`, and absent rather than `0` for
every other scenario. Two reasons, both deliberate: a scenario that never
attached the observer has not measured zero churn, and a `MutationObserver`
over ~18,000 cell buttons is itself script work that would perturb the very
`ScriptDuration`/`RecalcStyleDuration` numbers scenarios 1-5 exist to
produce. The snapshot also carries `nodeChurnObserved`, which each rep
asserts and which is never persisted -- without it, a mistyped selector
reports 0 and is indistinguishable from the safe row's genuine 0.

### What a good run looks like

Measured on an Apple M2 Pro, 5 reps x 40 moves, `buildMode: perf`:

| scenario                       | tiles across | churn/rep            | churn/move | wall clock/rep | ScriptDuration/rep |
| ------------------------------ | ------------ | -------------------- | ---------- | -------------- | ------------------ |
| `wobble-tile-boundary-thrash`  | 39.0625      | 35,840               | 896        | 3,488ms        | 1,346ms            |
| `wobble-tile-boundary-safe`    | 31.2500      | 0                    | 0          | 821ms          | 16ms               |
| `wobble-tile-boundary-aligned` | 16.0000      | 192 on rep 0, then 0 | 0          | 690ms          | 13ms               |

35,840 is 40 moves x 896 nodes, and 896 is one entering strip plus one
leaving strip: 4 cells x 112 rows x 2. The aligned row's 192 is a single
one-directional widening (4 x 48 cells, admitted and never evicted) on the
first rep only -- the rebuild-once-and-settle signature, and a third
independent confirmation that the observer works, since it sits between the
other two rows rather than at either extreme.

If the thrash row ever reads 0 while its precondition still passes, suspect a
pan-sign disagreement between the nudge, `simulateWobbleRebuilds`, and
`camera.ts`'s `panCamera` before touching the amplitude.

## No baseline is committed

`reports/` is gitignored, and nothing under it -- raw samples, `latest.md`,
`latest.json`, `history.jsonl` -- is ever checked in. Timings captured on
one machine (CPU, thermal state, background load, OS scheduler) don't mean
anything on another; a committed "baseline" would silently become a
comparison against hardware nobody else in the project owns. If a future
slice wants trend tracking across commits, that needs a dedicated,
consistently-provisioned runner (e.g. a fixed CI machine class) producing
its own `history.jsonl` outside this repo, not a file checked in here.
