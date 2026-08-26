---
name: scrollbar-thumb-overflows-its-track
title: The thumb is sized against the viewport but drawn inside a 10px-inset track
created: 2026-08-26
---

## Context

Found by `architect` during the `scrollbar-visible-proportion-affordance` CONTRACT pass, while
measuring something else. Pre-existing, not that slice's, and deliberately not adjudicated there.

**`GridScrollbars.tsx` passes `trackLengthPx={size.width}` / `{size.height}` — the _viewport_ —
while `Scrollbar.tsx`'s track div is inset 10px by `right-2.5` / `bottom-2.5`.** So the length the
thumb is computed against is 10px longer than the box it is drawn in.

Measured on the live app at the default camera: **a 1280px-wide horizontal thumb inside a 1270px
track**, giving `thumbTrackFraction` = **1.0079**. By construction the same 10px lands at maximum
offset, since `offsetPx + lengthPx = trackLengthPx = 1280`.

## Why nobody noticed, which is the more interesting half

`features/grid-scrollbars.feature` carries an accepted clause — _"still leaves the thumb inside its
track"_ — and it is **green today only because neither observation channel can see the overflow**:

- `aria-valuenow` announces `thumbOffsetRatio` as an integer percent, which is 100 either way;
- `thumbTrackFraction` compares boxes with a `> 0.99` tolerance, and 1.0079 passes a
  greater-than test as readily as 1.0 does.

So this is a contract the suite asserts and cannot falsify — the same shape as the vacuous-locator
finding in [[vacuous-pass-when-a-locator-resolves-to-nothing]], reached by a different route: there
the assertion could not fail because the scope vanished; here because the instrument's tolerance
runs the wrong way for the defect that exists.

## Sketch

The fix is likely one line — pass the _track's_ length rather than the viewport's — but **decide
which end is wrong before moving either**. Two candidates, and they differ in what else moves:

1. **`GridScrollbars.tsx` should subtract the inset**, making the thumb honest against the box it
   sits in. Cheapest, but the inset then exists in two places and can drift.
2. **`Scrollbar.tsx` should measure its own track** and stop taking `trackLengthPx` as a prop. More
   honest — the component that owns the inset owns the length — but it is a prop-shape change and
   `computeThumbGeometry`'s contract moves with it.

Whichever lands, note the `MIN_THUMB_PX` (24) floor and the `Math.min(trackLengthPx, …)` clamp in
`computeThumbGeometry` both read that same length, so the numbers they produce shift slightly.
Several `grid-scrollbars` pixel assertions are windowed (`330..380`, `165..200`) and may need
re-deriving — check rather than assume they absorb it.

## The sequencing that matters

**Decide this before T8 touches `grid-scrollbars`' fifth hand-written test.** `architect` ruled that
test (_"panning far away maxes out the scrollbar offset without breaking it"_) a delete-or-restate,
partly because its containment claim `x + width > 1275` is **only accidentally true** — it passes
_because_ of the 10px overflow, not despite it. Deleting it while the defect stands removes the one
assertion in the repo that is anywhere near the mechanism.

## Touches

`src/components/GridScrollbars.tsx`, `src/components/Scrollbar.tsx`, `src/scrollbars.ts`
(`computeThumbGeometry`), their unit and property tests, and probably windowed pixel assertions in
`features/grid-scrollbars.e2e.spec.ts`.

## Open questions

- Which end is wrong — the caller or the component? Decides how much else moves.
- Is the 10px inset load-bearing visually, or incidental? If the track should be full-bleed, the
  fix is the other direction entirely and no arithmetic changes.
- Once the visible-proportion affordance lands, does an exact integer percent make this
  _falsifiable_? An announced 100% against a rendered 100.79% is still invisible — the announcement
  derives from `metrics.thumbRatio` **upstream** of `computeThumbGeometry`, so it cannot see
  rendering at all. That is exactly why `architect` ruled T8 must keep one pixel test.
