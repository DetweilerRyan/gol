---
name: gridline-rasterization-unmeasured-at-dpr-2
title: Measure gridline rasterization at DPR 2 across the zoom range
created: 2026-09-02
---

## Context

The one coverage gap `collapse-dead-cell-layer` closed only partially, flagged honestly by three
roles rather than papered over.

`GridLines.tsx` paints minor and major gridlines as CSS `background-image` layers on an untransformed
div, positioned from `gridGeometry.ts`'s `gridLinePhasePx`. The risk it carries is **rasterization**:
seams, doubled lines, or dropped lines where a fractional `cellSize` meets the device-pixel grid.

What has been measured:

- **`coder`'s spike**: no seams or double lines at `cellSize` 20 and 12.8, at **DPR 1 and DPR 2**,
  with pixel-level inspection of a decoded screenshot. It validated the probe itself by injecting
  `+5px` and `+0.5px` offsets and confirming detection — the `0.5` case visible only at DPR 2.
- **`cleaner`'s property**: the coincidence identity over the **entire** `[MIN_CELL_SIZE, MAX_CELL_SIZE]`
  = `[8, 60]` fractional range, proving no systematic phase offset at any reachable zoom. It stated
  plainly that a property over phase math **cannot see rasterization**.
- **`product`'s VERIFY**: exact line counts at five zoom levels including two fractional ones the
  spike never covered — 75 / 73 / 30 / 19 / 10 lines across a 600px span at `cellSize`
  8 / 8.2 / 20 / 31.2 / 60. Nothing missing, nothing doubled. **DPR 1 only.**

**So the gap is precisely: DPR 2, at the zoom levels `product` swept.** The math is proven over the
full range; DPR 1 rasterization is proven at five points; DPR 2 rasterization is proven at two.

## Sketch

Repeat `product`'s five-zoom line-count sweep at `deviceScaleFactor: 2`. The technique already
exists in this repo's history — decode a screenshot and scan real device pixels for where the line
colour starts, which is how `coder` measured the ±0.5px injection that DPR 1 structurally cannot see.

**The honest question to answer first is whether this belongs in a test at all.** No layer of this
repo asserts rendered pixels today: jsdom has no layout, the property layer cannot see
rasterization, and the e2e layer measures boxes rather than pixel colour. A one-off measurement that
comes back clean might be worth more as a recorded finding than as a permanent spec — and if it
comes back _dirty_, the fix is a different slice anyway.

Note `perf/` already runs at **1280×900 and 1920×1080** but not at a raised device scale factor, so
adding a DPR-2 project is a real configuration change rather than a parameter tweak.

## Touches

Likely a throwaway probe rather than a landed test — see above. If it becomes a test, the honest home
is `*.browser.test.ts` (real Chromium, and **additive only**: `vite.config.ts` excludes that suffix,
so `crap4ts` and Stryker cannot see it and moving an assertion there silently drops coverage).

## Open questions

- Does a seam at DPR 2 even matter visually? A half-device-pixel line at 2× is a rendering artifact
  a user may never notice, and the cost of pinning it may exceed the cost of the defect.
- Is the SVG `<pattern>` data-URI fallback — designed but never needed, since the spike came back
  clean — the right remedy if DPR 2 turns out dirty? It was ratified as a component-body swap
  touching nothing else, because `gridLinePhasePx` returns numbers rather than CSS strings.
