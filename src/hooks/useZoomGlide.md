# `useZoomGlide.ts` — implementation notes

Depth that overflows the hover budget, per `doc-comments.md` rule 7. The hover carries the contract; this
file carries why the contract is shaped that way. Read it when you are changing the glide, not in order to
call it.

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
is an exact-equality unit assertion. `useZoomGlide.test.ts`'s "accumulates zero float divergence from
chaining" test pins it, using a fuzz-found adversarial camera.

## Why the completion frame is bit-identical to an instantaneous zoom

Recomputing from one fixed starting camera also makes the last frame exactly equal to what a
non-animated zoom would produce. `toCellSize === clampCellSize(fromCellSize * factor)`, and clamping an
already-in-range value is the identity. That half of the original claim holds.

**This is the property a caller depends on**, which is why the hover states it and this file explains it.

## The unmount asymmetry against `useRafCoalescedPan`

An unfinished glide at unmount is **cancelled, never flushed**, where a coalesced pan flushes. The two
animation-frame owners differ on purpose.

A coalesced pan owes its caller an already-accumulated delta, so dropping it would lose input the user
already gave. A half-arrived-at cellSize is owed to nobody: it is an interpolation toward a target, not a
record of anything the user did.

`state-flow.md` carries that contrast, because it is a contract between two hooks and neither hover can
hold it alone.

## The controller's identity is a contract with named guards

The returned controller is identity-stable across renders. `useCamera`'s private `commit()` closes over it,
and every one of that hook's returned actions closes over `commit()`, so a controller rebuilt per render
churns all of them.

**What keeps it stable is that the controller closes over nothing that varies per render.** `onCamera` and
the reduced-motion preference are both read through refs, reassigned in this hook's single
dependency-array-free effect, which is what lets React Compiler memoize it.

**Declaration order is load-bearing, and the failure is silent.** Placing that effect above
`const prefersReducedMotion = useReducedMotion()` compiles, type-checks and passes every other test in the
repo, while leaving the controller unmemoized and the change inert.

`state-flow.md` carries the general contract this is one instance of, and
`state-flow.rationale.md` carries the measurements behind it.
