---
name: perf-tile-boundary-triangulates-off-deleted-cells
title: Re-source the perf harness's camera read now that dead cells are not rendered
created: 2026-09-02
---

## Context

A direct consequence of `collapse-dead-cell-layer`, found while preparing the post-merge perf run
and filed rather than patched.

`perf/tile-boundary.ts` reads the camera back out of what the app rendered — deliberately, rather
than re-deriving it from the zoom clicks a scenario performed. It triangulates from two cell
buttons:

```ts
const ORIGIN_CELL_SELECTOR = '[aria-label="Cell 0, 0"]'
const PROBE_CELL_OFFSET_CELLS = 16
const PROBE_CELL_SELECTOR = `[aria-label="Cell ${PROBE_CELL_OFFSET_CELLS}, ${PROBE_CELL_OFFSET_CELLS}"]`
```

Its own comment says both are _"mounted in every scenario this module serves"_, which was true when
every in-range cell was mounted. **The flip falsifies it**: `tile-boundary.perf.spec.ts:215` does
`page.goto('/')` — an empty board — so neither cell is live, neither is the focus cursor, and
neither exists. `readGridGeometry` throws by name, taking all three `wobble-tile-boundary-*`
scenarios with it.

**Not urgent, and the reason is worth stating**: the `pan-min-zoom-*` scenarios that carry the
slice's perf premise are unaffected, so the post-merge measurement is real but partial. What is
lost is the tile-boundary family specifically — the scenarios that measure admit/evict churn at a
crossing, which is exactly the cost this slice claims to have removed. So the gap is narrow and
pointed rather than broad.

## Sketch

**The ruler is the right source.** `GridRuler` draws from the camera alone, needs no live cells, and
is always present. `ruler-label-axis-affordance` already gave each axis a named `role="group"`.

**The obstacle is real and shapes the fix.** `src/test-support/rulerQuery.ts` deliberately exports
**one** function, `rulerGroupLabel(axis)`, and **no CSS-selector sibling** — its header argues an
accessible name is computed rather than stored, so only the role engine queries it faithfully.
Meanwhile `readGridGeometry` runs `document.querySelector` inside `page.evaluate`, where no role
engine exists.

So either the triangulation moves out of `page.evaluate` to the Playwright side (where
`getByRole('group', { name })` works and boxes are read with `boundingBox()`), or the ruler labels
gain a structural handle the way `#grid-content` and now `#hover-indicator` have — the precedent
this repo has used twice, for exactly the case of a thing with no accessible meaning that a test
still needs to locate.

**A third option to weigh and probably reject**: seed two live cells at known coordinates. It keeps
the current shape but changes what the scenario measures — a board with live cells is not the empty
board the wobble scenarios were designed around.

## Touches

`perf/tile-boundary.ts`, `perf/tile-boundary.perf.spec.ts`, possibly `src/components/GridRuler.tsx`
and `src/test-support/rulerQuery.ts` if the structural-handle route is taken.

**`perf/` is outside every quality gate and is orchestrator-owned** — no role runs
`npm run test:perf`, so a wrong fix here is silent, and that is why this was filed rather than
patched at merge time. Verification is running the harness, not a gate.

## Open questions

- Does moving the read to the Playwright side cost accuracy? The current code is careful about
  Blink's 1/64px LayoutUnit quantisation and deliberately takes `cellSize` symbolically rather than
  from pixels; `boundingBox()` has its own rounding.
- Is `measuredCellSizePx`'s cross-check still meaningful off ruler labels, whose spacing is
  `MAJOR_GRIDLINE_INTERVAL` cells rather than one?
- Should the harness fail loudly when its geometry source is missing, rather than throwing from
  `readGridGeometry`'s generic message? The failure was diagnosable here only because someone knew
  the flip had landed.
