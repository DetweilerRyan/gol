---
name: renderer-crash-and-hit-test-drift
title: Investigate two pre-existing defects qa found on shipped code
created: 2026-08-23
---

## Context

Two defects surfaced during `tile-virtualized-cells` verification that are **not**
that slice's artifacts — both reproduce byte-identically on the pre-slice `main`.
They were filed rather than fixed because they were outside that slice's manifest.

### 1. The renderer crashes under sustained wheel panning at min zoom

Reproducible **2/2 attempts** at ~1,250 sustained wheel pans at 41% zoom
(`cellSize` 8.192, 1280 wide). The tile slice ran past 1,500 at roughly 2× the
per-pan speed without crashing — but that run was cut by a 10-minute harness
timeout before reaching the planned 2,500, so **"the slice fixes it" is not
established**, only "the slice is better under the same load."

Likely a memory or node-churn issue. `perf/load.perf.spec.ts`'s
playback-sustained scenarios are the natural place to catch it.

### 2. `elementFromPoint` and `screenToWorld` disagree within ~1px of a cell boundary

At fractional cell sizes, **55 of 264 sampled points at 41% zoom toggled the
neighbouring cell**. Every mismatch was a point 0.1–1.0px _outside_ the hit box's
edge — e.g. a click at `x=411` where the hit box starts at `411.74` toggles cell
81, not 82. Byte-identical on `main`: same 55/264, same coordinates, same boxes.

**The toggle is the correct one; the DOM hit-test is the loose one.** Existing e2e
specs are unexposed because their probe points sit mid-cell.

Low severity — sub-pixel, and the resulting action is right — but a click within
1px of a boundary lands on a cell the user did not visually target.

## Sketch

These are two investigations, probably two slices, filed together only because
they arrived in the same report.

- **The crash** needs reproduction under instrumentation first (heap snapshots
  across the pan sequence, node counts over time) before any fix is scoped. It is
  the higher-severity of the two by a wide margin — a crash is a crash — but also
  the one most likely to be already mitigated by tiling. Re-run the reproduction
  on current `main` before scoping anything.
- **The hit-test drift** may be resolved for free by `collapse-dead-cell-layer`,
  which removes the per-cell hit boxes entirely and resolves every click through
  `screenToWorld` — the side that is already correct. Worth checking that
  dependency before spending a slice here.

## Touches

Unknown until reproduced. Probably `perf/load.perf.spec.ts` for the crash, and
nothing at all for the drift if the dead-cell-layer slice subsumes it.

## Open questions

- **Is the crash still reproducible on current `main`?** Everything else depends on
  that answer, and it is one measurement.
- Is the drift worth fixing on its own, or purely a note attached to
  `collapse-dead-cell-layer`? Filing it as its own candidate risks doing work twice.
- Neither defect has a `.feature` scenario or a spec that catches it. If either is
  fixed, `product` needs to specify the regression check — and for the crash, "does
  not crash after N pans" is an awkward thing to state as a contract.
