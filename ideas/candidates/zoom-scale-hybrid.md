---
name: zoom-scale-hybrid
title: Scale the layer during a zoom gesture, re-derive tiles once when it ends
created: 2026-08-23
---

## Context

Zoom was the second-worst render path before tiling landed, and **tiling already
collected most of the win**. Measured `zoom-shift-wheel-empty` at 1280×900: frame
p95 **50.19ms → 25.0ms**, close to the predicted ~22ms. Tile keys are world-based
and unchanged by zoom, so retained tiles re-render instead of remounting.

What tiling did **not** fix is the toolbar zoom-to-clamp path. On `main` at
`7078df6`, `zoom-toolbar-clamp` still shows an event duration p95 of **496ms**
(1280×900) and **1176ms** (1920×1080), with 9 and 15 long tasks respectively — the
worst numbers left in the report by a wide margin. Every step of that clamp
changes `cellSize`, and a `cellSize` change fails lattice coverage by
construction, so each step re-derives everything.

## Sketch

The technique is a **hybrid**, not a replacement: scale during the gesture (cheap,
compositor-only), re-layout once at the end (expensive, once).

1. During the gesture, apply a CSS `transform: scale()` to the layer div — no
   relayout, no re-derivation, no remounts.
2. On gesture end, commit the new `cellSize`, re-derive tiles, and remove the
   scale in the same commit so nothing paints twice.

**Leaflet does exactly this.** Its render loop scales the rendered layer via CSS
transform and only re-projects once the animation ends; `updateWhenZooming: false`
defers the grid-layer update to the end of the gesture entirely, and it loads
tiles at certain zoom levels and _scales_ them rather than reloading at every
intermediate level.

**Why scale alone can't replace `cellSize` — this is the load-bearing constraint.**
Zooming out has to _reveal more of the infinite grid_: ~700 cells at max zoom,
~19,300 at min. A pure scale transform shows the same cells bigger or smaller; it
never brings new ones into existence. So the re-derivation cannot be removed, only
deferred out of the gesture.

## Touches

`useCamera.ts` (gesture start/end lifecycle — there is no such lifecycle today),
`Grid.tsx`'s layer div, `cellLattice.ts`/tile derivation, and `GridToolbar`'s
clamp path. Crosses the framework-free → hook → component layering, so it wants an
`architect` DESIGN pass before `coder`.

## Open questions

- **Is the remaining win worth the complexity?** Wheel zoom is now ~25ms p95 and
  the case rests almost entirely on `zoom-toolbar-clamp`. Re-measure and scope
  against _that_ scenario specifically — a design aimed at the wheel path may not
  help the toolbar path at all, since a clamp is a burst of discrete steps rather
  than a continuous gesture.
- **A toolbar clamp has no natural "gesture end".** Debounce? Treat the whole clamp
  animation as one gesture? Decide before scoping — this is the difference between
  a small slice and a large one.
- **Text and border crispness under a fractional scale.** Cell borders are 1px; a
  scaled layer renders them at fractional widths mid-gesture. Acceptable during a
  transient, but worth looking at before committing.
- Interaction with `PatternPreview`, which deliberately sits _outside_ the
  transformed layer and recomputes `worldToScreen` per position. It would need to
  either follow the scale or be hidden during a gesture.
