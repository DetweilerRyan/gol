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
    act(() => result.current.applyWheel({ pixelX: 0, pixelY: 0, deltaX: 40, deltaY: 100, shiftKey: false }))
    expect(result.current.camera.cellSize).toBe(DEFAULT_CELL_SIZE)
    expect(result.current.camera.offsetX).toBeGreaterThan(0)
    expect(result.current.camera.offsetY).toBeGreaterThan(0)
  })

  it('applyWheel zooms when shiftKey is true', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.applyWheel({ pixelX: 0, pixelY: 0, deltaX: 0, deltaY: -100, shiftKey: true }))
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
      (result) => result.current.applyWheel({ pixelX: 0, pixelY: 0, deltaX: 10, deltaY: 10, shiftKey: false }),
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
