import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  DEFAULT_CELL_SIZE,
  MAX_CELL_SIZE,
  zoomCameraAtPoint,
  zoomCameraToCellSize,
  ZOOM_FACTOR,
  type Camera,
} from '../camera'
import {
  stubAnimationFrames,
  stubMatchMedia,
  type AnimationFrameController,
  type MatchMediaController,
} from '../test-support/domStubs'
import { useZoomGlide } from './useZoomGlide'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
const ANCHOR_X = 640
const ANCHOR_Y = 450

// Gates the identity-stability test below, on Grid.test.tsx's precedent:
// Stryker's per-expression instrumentation defeats React Compiler's
// memoization, so an ungated identity assertion reds the dry run and
// npm run test:mutation never starts. globalThis.__stryker__ is set at
// module load by any instrumented file's own bootstrap, before test
// collection.
const underStryker = '__stryker__' in globalThis

let raf: AnimationFrameController
let matchMedia: MatchMediaController

beforeEach(() => {
  raf = stubAnimationFrames()
  // Motion enabled by default -- individual tests that care about reduced
  // motion re-stub with stubMatchMedia(true).
  matchMedia = stubMatchMedia(false)
})

// Every test here mounts the hook the same way and drives it through the same
// two entry points, so the arrange is extracted and each test body is only the
// part that differs -- the repeated two-line mount was duplication dry4ts
// reported against useRafCoalescedPan.test.ts, the repo's other rAF-owning
// hook's tests, as well as against this file's own siblings.
//
// zoomBy/cancel/glide read result.current AT CALL TIME rather than closing
// over the first render's controller: useZoomGlide returns a fresh object
// every render, and a captured one would quietly drive a stale closure.
function mountGlide() {
  const onCamera = vi.fn<(next: Camera) => void>()
  const { result, unmount } = renderHook(() => useZoomGlide(onCamera))
  return {
    onCamera,
    unmount,
    zoomBy: (from: Camera, factor: number, anchorX = ANCHOR_X, anchorY = ANCHOR_Y) =>
      result.current.zoomBy(from, factor, anchorX, anchorY),
    cancel: () => result.current.cancel(),
  }
}

// The end state a settled zoom must be in, whichever route reached it: one
// onCamera call, carrying exactly the camera an instantaneous zoom of the same
// factor produces, and no frame still pending. A completed glide and a
// reduced-motion snap are required to agree on it exactly -- which is why the
// two tests below assert through one shared expectation rather than restating
// it (dry4ts reported the restatement at 0.83).
function expectSettledOnInstantaneousZoom(onCamera: Mock, from: Camera, factor: number) {
  const expected = zoomCameraAtPoint(from, ANCHOR_X, ANCHOR_Y, factor)
  expect(onCamera).toHaveBeenCalledTimes(1)
  expect(onCamera).toHaveBeenCalledWith(expected)
  expect(raf.pendingCount()).toBe(0)
}

describe('useZoomGlide, motion not reduced', () => {
  it('applies the glide value synchronously once on zoomBy, before any frame has run', () => {
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)

    // Progress 0 is a same-reference bail in zoomCameraToCellSize -- the
    // synchronous call happens, but it hands back the same camera the caller
    // passed in, so nothing has visibly moved yet.
    expect(onCamera).toHaveBeenCalledTimes(1)
    expect(onCamera).toHaveBeenCalledWith(camera)
    expect(raf.pendingCount()).toBe(1)
  })

  it('lands on exactly toCellSize once the full duration elapses -- bit-identical to an instantaneous zoom', () => {
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    onCamera.mockClear()
    raf.advance(200)

    expectSettledOnInstantaneousZoom(onCamera, camera, ZOOM_FACTOR)
  })

  it('reports at least one intermediate camera strictly between the start and end cellSize', () => {
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    onCamera.mockClear()
    raf.advance(100)

    expect(onCamera).toHaveBeenCalledTimes(1)
    const mid = onCamera.mock.calls[0][0]
    expect(mid.cellSize).toBeGreaterThan(camera.cellSize)
    expect(mid.cellSize).toBeLessThan(camera.cellSize * ZOOM_FACTOR)

    raf.advance(100)
    expect(raf.pendingCount()).toBe(0)
  })

  it('schedules a fresh frame after each one fires, until the glide completes', () => {
    const { zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    expect(raf.pendingCount()).toBe(1)

    raf.advance(50)
    expect(raf.pendingCount()).toBe(1) // not complete yet -- rescheduled

    raf.advance(50)
    expect(raf.pendingCount()).toBe(1)

    raf.advance(100) // total 200ms -- complete
    expect(raf.pendingCount()).toBe(0)
  })

  // The "two quick clicks -> 156%" guard: base chains onto the pending
  // glide's own target (25), not the still-unmoved displayed cellSize (20),
  // so two rapid clicks land two rungs up (20 -> 25 -> 31.25, i.e. 156%).
  it('two quick clicks, before the first frame has run, chain onto the pending target rather than repeating the first rung', () => {
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    expect(raf.cancelCallCount()).toBe(0)
    zoomBy(camera, ZOOM_FACTOR)
    // The second click cancels the first click's pending frame outright.
    expect(raf.cancelCallCount()).toBe(1)
    expect(raf.pendingCount()).toBe(1)

    onCamera.mockClear()
    raf.advance(200)

    // Single-step from the ORIGINAL camera to the compound target (20 *
    // 1.25^2 = 31.25, 156%), never a chain of two zoomCameraAtPoint calls
    // through an intermediate 25-cellSize camera -- see useZoomGlide.ts's
    // GlideState.fromCamera comment for why that distinction is load-bearing
    // (a chained computation is only algebraically, not float-, identical).
    const expected = zoomCameraToCellSize(camera, ANCHOR_X, ANCHOR_Y, DEFAULT_CELL_SIZE * ZOOM_FACTOR * ZOOM_FACTOR)
    expect(onCamera).toHaveBeenCalledTimes(1)
    expect(onCamera).toHaveBeenCalledWith(expected)
    expect(Math.round((expected.cellSize / DEFAULT_CELL_SIZE) * 100)).toBe(156)
  })

  // Ruling 4's worked example, verbatim: click zoom-in (glide 20->25
  // created, no frame run yet, displayed still 20), then immediately click
  // zoom-out -- must clear the pending glide entirely rather than leaving it
  // running underneath a "nothing to do" no-op.
  it('an immediate opposite click clears the pending glide -- no further onCamera call, no pending frame', () => {
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR) // 20 -> 25
    expect(onCamera).toHaveBeenCalledTimes(1)
    expect(raf.pendingCount()).toBe(1)

    zoomBy(camera, 1 / ZOOM_FACTOR) // clears: target 20 === current 20

    // The clearing click cancelled the pending frame and made no further
    // synchronous onCamera call of its own (advanceZoomTarget returned null,
    // so zoomBy returns before applying anything).
    expect(raf.cancelCallCount()).toBe(1)
    expect(raf.pendingCount()).toBe(0)
    expect(onCamera).toHaveBeenCalledTimes(1)

    // Advancing time confirms nothing was left running underneath.
    raf.advance(1000)
    expect(onCamera).toHaveBeenCalledTimes(1)
  })

  // "past-max-then-out -> 240%": clicking to the clamp and then out once
  // chains off the CLAMPED target (60, 300%), landing on 60 / 1.25 = 48
  // (240%) -- not on 60 * (1 / 1.25) applied to some other base.
  it('zooming out once after settling at the clamp lands on clamp / factor (240%), chaining off the clamped target', () => {
    const { onCamera, zoomBy } = mountGlide()
    const atMax: Camera = { offsetX: 0, offsetY: 0, cellSize: MAX_CELL_SIZE }

    zoomBy(atMax, 1 / ZOOM_FACTOR)
    onCamera.mockClear()
    raf.advance(200)

    const expected = zoomCameraToCellSize(atMax, ANCHOR_X, ANCHOR_Y, MAX_CELL_SIZE / ZOOM_FACTOR)
    expect(onCamera).toHaveBeenCalledWith(expected)
    expect(Math.round((expected.cellSize / DEFAULT_CELL_SIZE) * 100)).toBe(240)
  })

  // GlideState.fromCamera's own header comment claims chaining
  // zoomCameraToCellSize frame-over-frame is "algebraically exact but
  // floating-point inexact" -- this pins that claim with a mutation that
  // actually reproduces it, since most camera/anchor combinations DON'T
  // diverge (the telescoping sum cancels exactly in float64 for "nice"
  // values, which is why a naive hand-check can look bit-identical and be
  // wrong about the general case). offsetX=99.69147330349733,
  // cellSize=30.028873671091873 and anchorX=935 are not special in any way
  // this app cares about -- they're an ordinary post-pan, mid-zoom camera at
  // an ordinary click point -- but this particular combination, run through
  // 12 real-cadence (~16.6667ms) frames at the app's actual ZOOM_FACTOR,
  // accumulates exactly one ULP of divergence between "recompute from the
  // camera the glide started at" (correct) and "recompute from the previous
  // frame's own output" (the regression this guards). Found by fuzzing
  // random reachable camera states, not hand-picked -- most inputs land on
  // an exact float match either way, so this is one of the rare ones that
  // doesn't, which is exactly why the claim needs a test rather than an
  // assertion holding "by inspection".
  it('accumulates zero float divergence from chaining, even over 12 real-cadence frames on an adversarial camera', () => {
    const raf = stubAnimationFrames()
    const adversarialCamera: Camera = {
      offsetX: 99.69147330349733,
      offsetY: -109.979532160271,
      cellSize: 30.028873671091873,
    }
    const anchorX = 935
    const anchorY = 401
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(adversarialCamera, ZOOM_FACTOR, anchorX, anchorY)
    onCamera.mockClear()

    // 12 frames of ~16.6667ms -- an ordinary 60fps cadence over the 200ms
    // duration -- rather than one raf.advance(200) jump straight to
    // completion, which never gives frame-to-frame chaining anything to
    // accumulate over.
    for (let i = 0; i < 11; i++) raf.advance(16.6667)
    raf.advance(200 - raf.now())

    const expected = zoomCameraToCellSize(adversarialCamera, anchorX, anchorY, adversarialCamera.cellSize * ZOOM_FACTOR)
    expect(onCamera).toHaveBeenLastCalledWith(expected)
  })

  it('repeated clicks once already at the clamp bank nothing -- no onCamera call, no pending frame', () => {
    const { onCamera, zoomBy } = mountGlide()
    const atMax: Camera = { offsetX: 0, offsetY: 0, cellSize: MAX_CELL_SIZE }

    zoomBy(atMax, ZOOM_FACTOR)

    expect(onCamera).not.toHaveBeenCalled()
    expect(raf.pendingCount()).toBe(0)
  })
})

describe('useZoomGlide, motion reduced', () => {
  it('snaps synchronously to the target in the one zoomBy call, scheduling no frame at all', () => {
    matchMedia.changeTo(true)
    const { onCamera, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)

    expectSettledOnInstantaneousZoom(onCamera, camera, ZOOM_FACTOR)
  })

  it('reads prefers-reduced-motion at click time, not just at mount', () => {
    const { onCamera, zoomBy } = mountGlide()

    // Motion starts enabled (stubbed false in the outer beforeEach); flip it
    // on before clicking.
    matchMedia.changeTo(true)
    zoomBy(camera, ZOOM_FACTOR)

    expect(raf.pendingCount()).toBe(0)
    expect(onCamera).toHaveBeenCalledWith(zoomCameraAtPoint(camera, ANCHOR_X, ANCHOR_Y, ZOOM_FACTOR))
  })
})

describe('cancel', () => {
  it('cancels a pending frame and clears the glide, with no further onCamera calls', () => {
    const { onCamera, zoomBy, cancel } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    onCamera.mockClear()

    cancel()
    expect(raf.cancelCallCount()).toBe(1)
    expect(raf.pendingCount()).toBe(0)

    raf.advance(200)
    expect(onCamera).not.toHaveBeenCalled()
  })

  it('is a no-op when nothing is running', () => {
    const { cancel } = mountGlide()

    expect(() => cancel()).not.toThrow()
    expect(raf.cancelCallCount()).toBe(0)
  })

  it('after a cancel, a fresh zoomBy call starts a new glide from the actual current cellSize', () => {
    const { onCamera, zoomBy, cancel } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    cancel()
    onCamera.mockClear()

    zoomBy(camera, ZOOM_FACTOR)
    raf.advance(200)

    expect(onCamera).toHaveBeenLastCalledWith(zoomCameraAtPoint(camera, ANCHOR_X, ANCHOR_Y, ZOOM_FACTOR))
  })
})

describe('unmount', () => {
  it('cancels the pending frame and does not flush a final onCamera call for the unfinished glide', () => {
    const { onCamera, unmount, zoomBy } = mountGlide()

    zoomBy(camera, ZOOM_FACTOR)
    onCamera.mockClear()

    unmount()
    expect(raf.cancelCallCount()).toBe(1)
    expect(raf.pendingCount()).toBe(0)

    // No pending frame remains to run, so nothing left to prove -- but a
    // stray call here would mean the cleanup flushed rather than cancelled.
    expect(onCamera).not.toHaveBeenCalled()
  })

  it('unmounting with nothing running does not throw and calls onCamera no further', () => {
    const { onCamera, unmount } = mountGlide()

    expect(() => unmount()).not.toThrow()
    expect(onCamera).not.toHaveBeenCalled()
  })
})

describe('controller identity', () => {
  // Skipped under Stryker for the same reason Grid.test.tsx's "tile
  // pan-stability" pair does: Stryker's instrumentation defeats React
  // Compiler's memoization, so a mutated build returns a fresh controller on
  // every render and this assertion fails in Stryker's dry run, before a
  // single mutant executes. The non-vacuous companion is the existing
  // "reads prefers-reduced-motion at click time, not just at mount" test
  // just above -- it fails if prefersReducedMotionRef is never reassigned,
  // so it stays unskipped and still exercises the ref-read path under
  // mutation testing regardless of whether memoization survives
  // instrumentation.
  //
  // This is the regression zoom-glide-regressed-the-pan-path's own DESIGN
  // ruling measured directly: pre-slice, useZoomGlide didn't exist; post-fix,
  // the controller returned across a no-op re-render must be the SAME
  // object, not merely one with the same shape -- a fresh literal every
  // render is what let commit()'s closure over it churn all seven of
  // useCamera's actions (see useCamera.test.ts's "returned action identity"
  // describe for the consumer-side half of this).
  it.skipIf(underStryker)('keeps its identity across a re-render', () => {
    const onCamera = vi.fn<(next: Camera) => void>()
    const { result, rerender } = renderHook(() => useZoomGlide(onCamera))

    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })
})

describe('onCamera identity churn', () => {
  it('a frame scheduled by one render calls whichever onCamera is current when it fires, not the one active at zoomBy time', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onCamera }: { onCamera: (next: Camera) => void }) => useZoomGlide(onCamera),
      {
        initialProps: { onCamera: first },
      },
    )

    result.current.zoomBy(camera, ZOOM_FACTOR, ANCHOR_X, ANCHOR_Y)
    // The synchronous progress-0 apply reached `first`, the one active when
    // zoomBy was called.
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()

    rerender({ onCamera: second })
    raf.advance(200)

    // The scheduled frame fires against whichever onCamera is current now.
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })
})
