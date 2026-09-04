import { useEffect, useRef } from 'react'
import { zoomCameraToCellSize, type Camera } from '../camera'
import { advanceZoomTarget, glideCellSizeAt, glideDurationMs, isGlideComplete, type ZoomGlide } from '../zoomGlide'
import { useReducedMotion } from './useReducedMotion'

export interface ZoomGlideController {
  zoomBy(camera: Camera, factor: number, anchorPixelX: number, anchorPixelY: number): void
  cancel(): void
}

interface GlideState {
  glide: ZoomGlide
  // The camera the glide STARTED at -- every frame recomputes
  // zoomCameraToCellSize from THIS fixed starting camera, never from the
  // previous frame's resulting camera. Chaining zoomCameraToCellSize calls
  // frame-over-frame is algebraically exact but floating-point inexact --
  // measured (cleaner, smooth-zoom-transitions step 3): fuzzing reachable
  // camera/anchor/cellSize combinations over a real 12-frame, 60fps glide
  // finds chained-vs-fixed divergences up to ~1 ULP (~1e-14 in offset
  // units), even at anchor/offset magnitudes far past what this app ever
  // reaches before cellAnchor.ts re-quantizes. That's real but many orders
  // of magnitude below anything pixel-observable (worst case measured
  // ~1e-10px within this app's actual offset range) -- nowhere near enough
  // to red features/camera-pan-and-zoom.e2e.spec.ts or any getBoundingClientRect-based
  // assertion, which the previous version of this comment claimed. What it
  // DOES red is an exact-equality unit assertion, which is what
  // useZoomGlide.test.ts's "accumulates zero float divergence from chaining"
  // test pins, with a fuzz-found adversarial camera. Recomputing from one
  // fixed starting camera also makes the completion frame bit-identical to
  // today's instantaneous zoom, because toCellSize ===
  // clampCellSize(fromCellSize * factor) and clamping an already-in-range
  // value is the identity -- that part of the original claim holds.
  fromCamera: Camera
  anchorX: number
  anchorY: number
}

// Drives the toolbar zoom-in/out glide: reads performance.now() and
// requestAnimationFrame -- the one thing this module exists to do, so that
// src/zoomGlide.ts, which owns the actual arithmetic, never has to (see
// rules/no-ambient-time-in-domain.yml). Only the toolbar route uses this;
// wheel zoom, drag-pan, scrollbar drag and reset all stay instantaneous and
// never touch it.
//
// The rAF lifecycle -- schedule/cancel/replace-on-a-new-call -- mirrors
// useRafCoalescedPan.ts, this repo's other animation-frame owner, with one
// deliberate difference at unmount: an unfinished glide is CANCELLED, never
// flushed. A coalesced pan owes its caller an already-accumulated delta;
// an unfinished glide owes nobody its half-arrived-at cellSize.
export function useZoomGlide(onCamera: (next: Camera) => void): ZoomGlideController {
  const stateRef = useRef<GlideState | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  // Read via a ref, exactly as useRafCoalescedPan.ts reads onPan -- the frame
  // callback scheduled by one render must call whichever onCamera is current
  // by the time it fires, not the one closed over when it was scheduled.
  const onCameraRef = useRef(onCamera)
  // Same reasoning, for a different reason: zoomBy reads this to choose
  // glideDurationMs, and reading it through a ref rather than closing over
  // the render-local value is what lets the returned controller close over
  // nothing that varies per render -- which is what lets React Compiler
  // memoize it, restoring the identity stability every useCamera action
  // depends on (measured: pre-slice all seven of useCamera's actions were
  // identity-stable; without this, none were -- see
  // zoom-glide-regressed-the-pan-path's DESIGN ruling).
  const prefersReducedMotionRef = useRef(prefersReducedMotion)
  useEffect(() => {
    onCameraRef.current = onCamera
    prefersReducedMotionRef.current = prefersReducedMotion
  })

  // Applies the glide's value at nowMs, then clears the ref if that lands it
  // complete -- so a later, unrelated zoomBy call starts from a clean slate
  // (prevGlide null, base = the actual current cellSize) instead of forever
  // carrying a finished glide's target forward.
  function applyFrame(nowMs: number) {
    const state = stateRef.current
    if (state === null) return
    const cellSize = glideCellSizeAt(state.glide, nowMs)
    const nextCamera = zoomCameraToCellSize(state.fromCamera, state.anchorX, state.anchorY, cellSize)
    onCameraRef.current(nextCamera)
    if (isGlideComplete(state.glide, nowMs)) {
      stateRef.current = null
    }
  }

  // ONE NULL GUARD, IN applyFrame, AND DELIBERATELY NOT A SECOND ONE HERE.
  // This callback used to re-check stateRef.current before calling
  // applyFrame, on the reasoning that the glide might have been cancelled or
  // replaced between the frame being scheduled and it firing. It cannot have
  // been: both cancel() and zoomBy() cancelAnimationFrame the pending frame
  // synchronously before they touch stateRef, so a fired frame always has
  // the state it was scheduled with. The re-check was therefore unreachable
  // dead code, and measured as such -- a scoped Stryker run over this file
  // reported four mutually-masking `=> false` survivors across the four null
  // decisions this module used to have (architect, REVIEW pass). Removing
  // this one and zoomBy's twin leaves applyFrame's own guard as the single
  // decision, which is then genuinely reachable and killed.
  function scheduleFrame() {
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      applyFrame(performance.now())
      if (stateRef.current !== null) scheduleFrame()
    })
  }

  function zoomBy(camera: Camera, factor: number, anchorPixelX: number, anchorPixelY: number) {
    // A new click always wins outright over whatever frame the previous one
    // scheduled -- cancelled unconditionally, whether the click continues
    // the same glide (chained rungs) or cancels it outright.
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    const nowMs = performance.now()
    const durationMs = glideDurationMs(prefersReducedMotionRef.current)
    const prevGlide = stateRef.current?.glide ?? null
    const nextGlide = advanceZoomTarget(prevGlide, camera.cellSize, factor, nowMs, durationMs)

    // ALWAYS store the result, null included: an immediate opposite click
    // must clear the pending glide rather than leave the first one running
    // underneath a "nothing to do" no-op -- see advanceZoomTarget's own
    // header comment for the worked example this prevents.
    stateRef.current =
      nextGlide === null ? null : { glide: nextGlide, fromCamera: camera, anchorX: anchorPixelX, anchorY: anchorPixelY }

    // No early return for the null case, deliberately -- see scheduleFrame's
    // comment above. applyFrame is a no-op on a null state, and the
    // reschedule check below is false, so a refused click falls through here
    // doing exactly nothing rather than through a guard of its own.
    //
    // Apply synchronously once. At progress 0 this is a same-reference bail
    // in zoomCameraToCellSize (fromCellSize === camera.cellSize, so the
    // clamped target equals the current cellSize), which React's setState
    // then no-ops on -- at duration 0 (reduced motion) the very next line
    // has already cleared stateRef.current via applyFrame's own completion
    // check, so no frame is ever scheduled and this synchronous call was the
    // whole of the (instantaneous) transition. Reduced motion is therefore
    // nowhere a branch in this hook -- it only ever changes the durationMs
    // that flowed in above.
    applyFrame(nowMs)
    if (stateRef.current !== null) scheduleFrame()
  }

  function cancel() {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    stateRef.current = null
  }

  // Unmount cancels; it must NOT flush -- see the module comment above.
  //
  // EQUIVALENT MUTANT, measured -- the same one useRafCoalescedPan.ts's own
  // unmount effect documents, for the same reason. Stryker replaces the `[]`
  // with a single-element array and it survives: React compares deps by
  // per-index Object.is, and a fresh same-valued literal is Object.is-equal to
  // itself across renders exactly as `[]` is, so both schedule identically
  // (mount/unmount only). It is the ONLY survivor left on this file -- a
  // scoped, non-incremental run at architect's REVIEW pass reports 45 mutants
  // and 97.78%, the missing 2.22% being this one line.
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [])

  return { zoomBy, cancel }
}
