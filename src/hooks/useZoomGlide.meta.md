# `useZoomGlide.ts` — rationale

The rationale half of the sidecar pair, per `doc-comments.md` rule 7: the hover carries the contract, and
this file carries the evidence for why the contract is shaped that way. Read it when you are changing the
glide, not in order to call it.

## Every frame recomputes from the camera the glide started at

`GlideState.fromCamera` stores the camera the glide began with, and every frame recomputes
`zoomCameraToCellSize` from **that fixed starting camera** rather than from the previous frame's result.

**Chaining frame-over-frame is algebraically exact and floating-point inexact.** Measured by `cleaner` at
`smooth-zoom-transitions` step 3: fuzzing reachable camera, anchor and cellSize combinations over a real
12-frame, 60fps glide finds chained-versus-fixed divergences up to roughly **1 ULP**, about 1e-14 in offset
units. That holds even at anchor and offset magnitudes far past what this app reaches before `cellAnchor.ts`
re-quantizes.

**That divergence is real and is nowhere near pixel-observable.** The worst case measured within this app's
actual offset range is about **1e-10 px**. It cannot red `features/camera-pan-and-zoom.e2e.spec.ts`, nor any
`getBoundingClientRect`-based assertion.

**An earlier version of this note claimed it could, and that claim was wrong.** What the divergence does red
is an exact-equality unit assertion, and `useZoomGlide.test.ts` carries one built on a fuzz-found
adversarial camera.

## Why the completion frame is bit-identical to an instantaneous zoom

Recomputing from one fixed starting camera also makes the last frame exactly equal to what a
non-animated zoom would produce. `toCellSize === clampCellSize(fromCellSize * factor)`, and clamping an
already-in-range value is the identity. That half of the original claim holds.

**This is the property a caller depends on**, which is why the hover states it and this file explains it.

## Two rulings this file does not restate

Both are contracts this hook has with another one, so `state-flow.md` owns them and this file only routes
you there. Read them before changing the unmount path or the ref-syncing effect.

- **The unmount asymmetry against `useRafCoalescedPan`** — an unfinished glide is cancelled, never flushed.
  `state-flow.md`, the cross-hook constraint list.
- **The returned controller's identity stability, and the silent failure if the ref-syncing effect is
  declared above `useReducedMotion()`** — `state-flow.md`'s identity-contract section, with the churn
  measurements in `state-flow.rationale.md`.
