import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen } from '../viewport'
import { useCamera } from './useCamera'

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
