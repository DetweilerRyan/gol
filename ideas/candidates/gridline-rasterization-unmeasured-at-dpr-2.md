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

## MEASURED 2026-09-03 — clean. This candidate is answered; see the closing note.

Run on `main` at `eb00437` with a throwaway Playwright probe (deleted, never landed), decoding
screenshots with `pngjs` and scanning real device pixels along one row, at **both** DPR 1 and DPR 2,
at the same five zoom levels `product` swept: `cellSize` 8 / 8.2 / 20 / 31.2 / 60.

| cellSize | zoom | DPR 1 runs | DPR 2 runs | missing | doubled       |
| -------- | ---- | ---------- | ---------- | ------- | ------------- |
| 8        | 40%  | 125        | 125        | 0       | 0             |
| 8.2      | 41%  | 122        | 125        | 0       | 0 (see below) |
| 20       | 100% | 50         | 50         | 0       | 0             |
| 31.2     | 156% | 32         | 32         | 0       | 0             |
| 60       | 300% | 17         | 17         | 0       | 0             |

**No missing lines and no doubled lines at any zoom, at either DPR.** The probe self-calibrated on
the modal gap rather than assuming a `cellSize`, so it did not depend on hitting an exact zoom.

**The one anomaly was the probe's, not the app's, and chasing it is what produced the real finding.**
At `cellSize` 8.2 the DPR-2 arm counted 125 runs against DPR 1's arithmetically-correct 122. Dumping
raw device pixels at the three extra sites showed all three identical:

```
px: 255 255  229 230  252  152 153 153 156  255 255
              minor    ^    major line
                     252, not 255
```

A `> 250` white threshold counted that **252** pixel as white and split one line into two runs. What
is actually there is a minor line sitting **3 device px (1.5 CSS px)** from a major one — a sub-pixel
phase difference between the two `background-position` layers at a fractional `cellSize`. DPR 2
_resolves_ it; it does not cause it. At DPR 1 the same pair merges into one run, which is exactly
why that arm reads 122.

**So the answer to this candidate's own first open question — "does a seam at DPR 2 even matter
visually?" — is that there is no seam, and the sub-CSS-pixel phase difference that does exist is
below the bar the question sets.** Nothing to fix, and the SVG `<pattern>` fallback stays unneeded.

**One incidental finding worth keeping, because it is about the harness rather than the paint.**
Playwright's `page.mouse.wheel(x, y)` takes **device** pixels: measured, a requested `deltaY` of 100
arrives as 100 / 50 / 33.3 at `deviceScaleFactor` 1 / 2 / 3. The first DPR-2 sweep silently ran at
51/64/100/125/195% instead of the intended 40/41/100/156/300% because of it, and read as a completed
measurement. Nothing in `features/` is affected today — the suite runs at DPR 1 — but every wheel
scenario there would silently measure a different gesture if it ever ran at another DPR.

**Reaching the fractional levels at all depended on `slice/wheel-zoom-ignores-magnitude-and-pinch`**,
merged hours earlier: a wheel delta of `-100 * ln(c/20) / ln(1.25)` lands on an arbitrary `cellSize`,
where before only `20 * 1.25^n` was reachable through the real wheel path. Two of the five sample
points could not previously have been driven this way.

## Sketch (superseded by the measurement above)

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
