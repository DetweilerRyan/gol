import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_CELL_SIZE,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  worldToScreen,
  zoomCameraAtPoint,
  ZOOM_FACTOR,
} from '../camera'
import { stubAnimationFrames, stubMatchMedia, type AnimationFrameController } from '../test-support/domStubs'
import { useCamera } from './useCamera'

const initialCamera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

// Gates the identity-stability describe below, on Grid.test.tsx's and
// useZoomGlide.test.ts's precedent: Stryker's per-expression instrumentation
// defeats React Compiler's memoization, so an ungated identity assertion
// reds the dry run and npm run test:mutation never starts. globalThis.__stryker__
// is set at module load by any instrumented file's own bootstrap, before
// test collection.
const underStryker = '__stryker__' in globalThis

// useCamera composes useZoomGlide, which composes useReducedMotion --
// window.matchMedia is undefined in this repo's jsdom project (see
// useReducedMotion.ts's own comment), so every test in this file needs the
// stub even the ones that never touch zoomInCentered/zoomOutCentered.
// stubAnimationFrames gives the toolbar-glide tests a controllable clock;
// tests that never call zoomInCentered/zoomOutCentered simply never schedule
// a frame, so the stub is inert for them.
let raf: AnimationFrameController

beforeEach(() => {
  raf = stubAnimationFrames()
  stubMatchMedia(false)
})

describe('useCamera', () => {
  it('starts centered on the origin at the default zoom', () => {
    const { result } = renderHook(() => useCamera())
    expect(result.current.camera).toEqual({ offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE })
  })

  it('panByPixels moves the offset opposite the drag direction, scaled by cellSize', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.panByPixels(20, 40))
    expect(result.current.camera.offsetX).toBeCloseTo(-1)
    expect(result.current.camera.offsetY).toBeCloseTo(-2)
  })

  it('zoomAtPoint keeps the world point under the cursor fixed on screen', () => {
    const { result } = renderHook(() => useCamera())
    const pixelX = 100
    const pixelY = 50
    act(() => result.current.zoomAtPoint(pixelX, pixelY, 2))
    expect(result.current.camera.cellSize).toBe(DEFAULT_CELL_SIZE * 2)
    // The screen position of whatever world cell was under the cursor before
    // zooming must still land under the cursor after zooming.
    const screenAfter = worldToScreen(result.current.camera, 5, 2.5)
    expect(screenAfter.x).toBeCloseTo(pixelX)
    expect(screenAfter.y).toBeCloseTo(pixelY)
  })

  it.each([
    ['MAX_CELL_SIZE', 1000, MAX_CELL_SIZE],
    ['MIN_CELL_SIZE', 0.001, MIN_CELL_SIZE],
  ])('zoomAtPoint clamps cellSize to %s and stops changing state once clamped', (_label, factor, expectedCellSize) => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.zoomAtPoint(0, 0, factor))
    expect(result.current.camera.cellSize).toBe(expectedCellSize)

    const clampedCamera = result.current.camera
    act(() => result.current.zoomAtPoint(0, 0, factor))
    // Already clamped: zoomAtPoint should bail out and return the same object,
    // not drift the offset from repeated no-op zoom attempts.
    expect(result.current.camera).toBe(clampedCamera)
  })

  it('applyWheel pans when shiftKey is false', () => {
    const { result } = renderHook(() => useCamera())
    act(() =>
      result.current.applyWheel({
        pixelX: 0,
        pixelY: 0,
        deltaX: 40,
        deltaY: 100,
        deltaMode: 0,
        shiftKey: false,
        ctrlKey: false,
      }),
    )
    expect(result.current.camera.cellSize).toBe(DEFAULT_CELL_SIZE)
    expect(result.current.camera.offsetX).toBeGreaterThan(0)
    expect(result.current.camera.offsetY).toBeGreaterThan(0)
  })

  it('applyWheel zooms when shiftKey is true', () => {
    const { result } = renderHook(() => useCamera())
    act(() =>
      result.current.applyWheel({
        pixelX: 0,
        pixelY: 0,
        deltaX: 0,
        deltaY: -100,
        deltaMode: 0,
        shiftKey: true,
        ctrlKey: false,
      }),
    )
    expect(result.current.camera.cellSize).toBeGreaterThan(DEFAULT_CELL_SIZE)
  })

  it('panByScrollbarDrag moves the offset in the same direction as the drag, scaled by thumbRatio and cellSize', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.panByScrollbarDrag('x', 50, 0.5))
    expect(result.current.camera.offsetX).toBeCloseTo(5)
    expect(result.current.camera.offsetY).toBe(0)
  })

  // zoomInCentered/zoomOutCentered now GLIDE rather than snap (see
  // useZoomGlide.ts), so the assertion has to wait for the glide to reach
  // its completion frame before comparing against an instantaneous
  // zoomCameraAtPoint call. The assertion itself is UNCHANGED from before
  // the glide existed -- if it doesn't pass once the glide has settled, the
  // from-camera invariant has been implemented as frame-chaining rather
  // than a fixed starting camera, and that is the bug, not this assertion.
  it('zoomInCentered zooms at the viewport center using ZOOM_FACTOR, once the glide settles', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.zoomInCentered(800, 600))
    act(() => raf.advance(200))

    expect(result.current.camera).toEqual(zoomCameraAtPoint(initialCamera, 800 / 2, 600 / 2, ZOOM_FACTOR))
  })

  it('zoomOutCentered zooms at the viewport center using 1 / ZOOM_FACTOR, once the glide settles', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.zoomOutCentered(800, 600))
    act(() => raf.advance(200))

    expect(result.current.camera).toEqual(zoomCameraAtPoint(initialCamera, 800 / 2, 600 / 2, 1 / ZOOM_FACTOR))
  })

  it('centerView resets to the default zoom, centered on the given viewport size', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.zoomAtPoint(0, 0, 3))
    act(() => result.current.panByPixels(500, 500))

    act(() => result.current.centerView(800, 600))
    expect(result.current.camera).toEqual({
      cellSize: DEFAULT_CELL_SIZE,
      offsetX: -800 / 2 / DEFAULT_CELL_SIZE,
      offsetY: -600 / 2 / DEFAULT_CELL_SIZE,
    })
  })
})

// zoom-glide-regressed-the-pan-path: useZoomGlide used to return a fresh
// controller object every render, which commit() closed over, which made
// every one of useCamera's returned actions churn identity on every render
// -- which in turn made Grid's props differ on every render and defeated its
// own memoization (measured: every mounted Cell re-rendered on every pan
// frame at min zoom). See useZoomGlide.test.ts's "controller identity"
// describe for the producer-side half of this fix.
describe('returned action identity', () => {
  // Skipped under Stryker for the same reason useZoomGlide.test.ts's
  // "controller identity" test is: Stryker's instrumentation defeats React
  // Compiler's memoization, so a mutated build returns a fresh action set on
  // every render and this assertion fails in Stryker's dry run, before a
  // single mutant executes. The unskipped companion at the end of this
  // describe proves the probe can see a real change -- camera's own identity
  // DOES change across a pan -- which holds with or without memoization, so
  // it stays unskipped and still exercises this describe's setup under
  // mutation testing.
  it.skipIf(underStryker)('the whole returned surface keeps identity across a no-op re-render', () => {
    const { result, rerender } = renderHook(() => useCamera())
    const first = result.current

    rerender()

    expect(result.current.panByPixels).toBe(first.panByPixels)
    expect(result.current.zoomAtPoint).toBe(first.zoomAtPoint)
    expect(result.current.applyWheel).toBe(first.applyWheel)
    expect(result.current.centerView).toBe(first.centerView)
    expect(result.current.panByScrollbarDrag).toBe(first.panByScrollbarDrag)
    expect(result.current.zoomInCentered).toBe(first.zoomInCentered)
    expect(result.current.zoomOutCentered).toBe(first.zoomOutCentered)
  })

  // The five commit()-routed writers, across a PAN -- the hot path this
  // slice's perf finding is about (Grid pans through panByPixels many times a
  // second during a drag). zoomInCentered/zoomOutCentered are deliberately
  // NOT asserted stable here: they capture `camera` directly rather than
  // going through commit()'s functional setCamera update (see useCamera.ts's
  // own comment on why that bypass of commit() is load-bearing), so they
  // legitimately churn whenever camera changes, with or without this slice's
  // fix -- pinning them as stable would be asserting something architect's
  // DESIGN ruling explicitly measured false.
  it.skipIf(underStryker)('the five commit()-routed writers keep identity across a pan', () => {
    const { result } = renderHook(() => useCamera())
    const before = result.current

    act(() => result.current.panByPixels(10, 10))

    expect(result.current.panByPixels).toBe(before.panByPixels)
    expect(result.current.zoomAtPoint).toBe(before.zoomAtPoint)
    expect(result.current.applyWheel).toBe(before.applyWheel)
    expect(result.current.centerView).toBe(before.centerView)
    expect(result.current.panByScrollbarDrag).toBe(before.panByScrollbarDrag)
  })

  it('camera itself does change identity across a pan -- the guards above are not vacuous', () => {
    const { result } = renderHook(() => useCamera())
    const before = result.current.camera

    act(() => result.current.panByPixels(10, 10))

    expect(result.current.camera).not.toBe(before)
  })
})

// Step 6's funnel: EVERY camera write that is not the glide's own tick calls
// commit(), which cancels an in-flight toolbar glide first. architect
// verified these five functions are the entire remaining set of production
// camera writers (CONTRACT review) -- one row per writer here, plus the
// in-then-immediately-out row that catches advanceZoomTarget's null being
// misread as "nothing to do" rather than "clear the glide" (see
// src/zoomGlide.ts's own header comment on advanceZoomTarget for the
// worked example this guards).
describe('every non-glide camera writer cancels an in-flight toolbar zoom glide', () => {
  const writers: Array<[string, (result: { current: ReturnType<typeof useCamera> }) => void]> = [
    ['panByPixels', (result) => result.current.panByPixels(10, 10)],
    ['zoomAtPoint', (result) => result.current.zoomAtPoint(0, 0, 2)],
    [
      'applyWheel',
      (result) =>
        result.current.applyWheel({
          pixelX: 0,
          pixelY: 0,
          deltaX: 10,
          deltaY: 10,
          deltaMode: 0,
          shiftKey: false,
          ctrlKey: false,
        }),
    ],
    ['centerView', (result) => result.current.centerView(800, 600)],
    ['panByScrollbarDrag', (result) => result.current.panByScrollbarDrag('x', 10, 0.5)],
  ]

  it.each(writers)('%s cancels a pending glide rather than leaving it to keep ticking underneath', (_label, invoke) => {
    const { result } = renderHook(() => useCamera())

    // A toolbar click that hasn't run its completion frame yet -- the
    // glide's own synchronous progress-0 apply is a same-reference bail, so
    // the camera hasn't visibly moved, but a frame is pending.
    act(() => result.current.zoomInCentered(800, 600))
    expect(raf.pendingCount()).toBe(1)

    act(() => invoke(result))

    expect(raf.cancelCallCount()).toBe(1)
    expect(raf.pendingCount()).toBe(0)

    const afterWrite = result.current.camera
    act(() => raf.advance(1000))
    // The cancelled glide never gets to run its completion frame and
    // overwrite what the writer above just committed.
    expect(result.current.camera).toBe(afterWrite)
  })

  // Ruling 4's worked example, at the useCamera level: at rest 100%, click
  // zoom-in (glide 20 -> 25, no frame run yet, displayed still 20), then
  // immediately click zoom-out -- base 25, target 20, current 20 -> null.
  // Left running (misread as "nothing to do"), the user would net a step UP
  // despite clicking in and straight back out.
  //
  // DO NOT PRUNE THIS AS REDUNDANT WITH THE FIVE ROWS ABOVE, and do not
  // assume the e2e layer would catch it. It is the only guard against
  // routing zoomInCentered/zoomOutCentered through commit() "for
  // consistency" with its five siblings: the second click would then cancel
  // the pending glide and recreate it from the CURRENT cellSize (still 20)
  // rather than from the pending TARGET (25), landing at 80% instead of
  // netting back to 100%. The .feature's "two quick clicks -> 156%" scenario
  // cannot see that -- it only discriminates while the first glide is still
  // mid-flight, and the mis-wiring shows up in the opposite-direction case
  // this test owns. Argued by coder, ruled to stay at architect's REVIEW.
  it('zoom-in then immediately zoom-out, before any frame runs, nets back to rest -- not one rung up', () => {
    const { result } = renderHook(() => useCamera())

    act(() => result.current.zoomInCentered(800, 600))
    expect(raf.pendingCount()).toBe(1)

    act(() => result.current.zoomOutCentered(800, 600))
    expect(raf.pendingCount()).toBe(0)

    act(() => raf.advance(1000))
    expect(result.current.camera).toEqual(initialCamera)
  })
})
