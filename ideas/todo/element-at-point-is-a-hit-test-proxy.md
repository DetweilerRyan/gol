---
name: element-at-point-is-a-hit-test-proxy
title: elementAtPoint resolves pixels the way the app never does
created: 2026-08-26
---

## Context

Found by `architect` while investigating — and retiring — `renderer-crash-and-hit-test-drift`.
That defect was filed because a verification harness compared the app against
`document.elementFromPoint` and found them disagreeing. **The app was correct; the proxy was
loose.** This file is what survives that finding.

`features/screenplay/questions.ts:51`'s `elementAtPoint` resolves a pixel through
`document.elementFromPoint`. `architect` measured that against real clicks and against paint, four
columns per sample point at 0.1px steps across a cell boundary:

- **`elementFromPoint` is loose by a fixed ~0.9px**, favouring the later-in-DOM (right/lower)
  sibling — at 41% and 100% zoom, at DPR 1, 2 and 3, and at **integer** `cellSize` as well as
  fractional.
- **A real click is exact.** `click ≠ rect` was **0 of 41** in every configuration, because pointer
  capture retargets the click and `Grid`'s `onTap` resolves the cell arithmetically through
  `screenToWorld`.
- **Paint agrees with the arithmetic**, not with the proxy: at DPR 3 the partial-coverage pixel
  predicted intensity 202.3 and measured 202.

So `elementAtPoint` answers _"which element would the browser's hit-test return here"_ — a question
this app asks **nowhere**.

## Why it matters, and where

Eight call sites. Most are boundary-insensitive and fine. `architect` measured the two that sit
near boundaries, and **corrected itself on one of them**:

- **Weakened — `features/camera-pan-and-zoom.e2e.spec.ts:41,64`.** `CENTER` is _exactly_ cell
  (0,0)'s top-left corner (`rect.left` 640, `rect.top` 450, confirmed). Measured:
  `elementFromPoint(639.1, 449.1)` — nearly a full pixel outside the cell on **both** axes — still
  returns `Cell 0, 0`. The assertion reads as exact camera positioning and tolerates ~0.9px of
  drift in both axes.
- **Sharp, and `architect` had reasoned otherwise before measuring —
  `features/grid-scrollbars.e2e.spec.ts:245`.** At `box.x + 0.5` it returns the thumb; at offset 0
  it already returns `Cell -32, 22`; beyond, `null`. A sub-pixel thumb shift really would flip it,
  so that deliberate corner probe works as its comment claims.

## Sketch

The narrow fix is the `camera-pan-and-zoom` pair: assert the camera's position through something
exact rather than through a hit-test. The ruler labels (`axisLabelValues`) are the camera-exact
observable that slice already uses elsewhere, and `cellScreenPosition` reads a `boundingBox`
directly.

The wider question is whether `elementAtPoint` should exist at all, or only for the
**stacking/occlusion** cases it is genuinely right for — "is the thumb on top of the cell here",
which is exactly a hit-test question and exactly what `grid-scrollbars.e2e.spec.ts:245` asks. Those
uses are sound; the positional ones are the proxy.

If it stays, its own comment should carry the measurement: **~0.9px loose, later-sibling-favouring,
at every zoom and DPR** — so the next author picks it deliberately rather than as a default way to
ask "what is at this pixel".

**No ast-grep rule.** "A sample point too near a boundary" is not structurally checkable;
`architect` ruled that out explicitly.

## Touches

`features/screenplay/questions.ts` (the comment, and possibly the export's scope),
`features/camera-pan-and-zoom.e2e.spec.ts` (the two weakened assertions). `features/` is
`product`'s manifest.

## Open questions

- Fix the two weakened assertions only, or narrow `elementAtPoint` to stacking questions?
- Is there a positional case among the other six sites that this survey classified as
  boundary-insensitive but that a future camera change would move onto a boundary?
