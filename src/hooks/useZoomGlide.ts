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
  // Read via a ref, exactly as useRafCoalescedPan.ts reads onPan -- the frame
  // callback scheduled by one render must call whichever onCamera is current
  // by the time it fires, not the one closed over when it was scheduled.
  const onCameraRef = useRef(onCamera)
  useEffect(() => {
    onCameraRef.current = onCamera
  })

  const prefersReducedMotion = useReducedMotion()

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

  function scheduleFrame() {
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      // The glide may have been cancelled, or replaced by a new one from a
      // later click, between this frame being scheduled and it firing --
      // either way there is nothing left for this particular frame to do.
      if (stateRef.current === null) return
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
    const durationMs = glideDurationMs(prefersReducedMotion)
    const prevGlide = stateRef.current?.glide ?? null
    const nextGlide = advanceZoomTarget(prevGlide, camera.cellSize, factor, nowMs, durationMs)

    // ALWAYS store the result, null included: an immediate opposite click
    // must clear the pending glide rather than leave the first one running
    // underneath a "nothing to do" no-op -- see advanceZoomTarget's own
    // header comment for the worked example this prevents.
    stateRef.current =
      nextGlide === null ? null : { glide: nextGlide, fromCamera: camera, anchorX: anchorPixelX, anchorY: anchorPixelY }

    if (nextGlide === null) return

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
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [])

  return { zoomBy, cancel }
}
