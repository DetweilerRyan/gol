import { describe, expect, it } from 'vitest'
import {
  applyWheelInput,
  centeredCamera,
  clampCellSize,
  DEFAULT_CELL_SIZE,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  panCamera,
  rectRelativePixels,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
} from './camera'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

describe('clampCellSize', () => {
  it('passes values within range through unchanged', () => {
    expect(clampCellSize(20)).toBe(20)
  })

  it('clamps below the minimum', () => {
    expect(clampCellSize(1)).toBe(MIN_CELL_SIZE)
  })

  it('clamps above the maximum', () => {
    expect(clampCellSize(1000)).toBe(MAX_CELL_SIZE)
  })
})

describe('worldToScreen', () => {
  it('maps the camera origin to pixel (0, 0)', () => {
    expect(worldToScreen(camera, 0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('scales world distance by cellSize', () => {
    expect(worldToScreen(camera, 3, -2)).toEqual({ x: 60, y: -40 })
  })

  it('accounts for a non-zero camera offset', () => {
    const panned: Camera = { offsetX: 5, offsetY: 5, cellSize: 20 }
    expect(worldToScreen(panned, 5, 5)).toEqual({ x: 0, y: 0 })
  })
})

describe('screenToWorld', () => {
  it('maps pixel (0, 0) back to the camera origin', () => {
    expect(screenToWorld(camera, 0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('floors fractional cell positions to the containing cell', () => {
    // 1 pixel into a 20px cell should still resolve to world cell 0, not 1.
    expect(screenToWorld(camera, 1, 1)).toEqual({ x: 0, y: 0 })
    expect(screenToWorld(camera, 19, 19)).toEqual({ x: 0, y: 0 })
    expect(screenToWorld(camera, 20, 20)).toEqual({ x: 1, y: 1 })
  })

  it('is the inverse of worldToScreen for integer world coordinates', () => {
    const panned: Camera = { offsetX: -3.5, offsetY: 7.25, cellSize: 32 }
    for (const [x, y] of [
      [0, 0],
      [10, -10],
      [-100, 100],
    ] as const) {
      const screen = worldToScreen(panned, x, y)
      expect(screenToWorld(panned, screen.x, screen.y)).toEqual({ x, y })
    }
  })
})

describe('panCamera', () => {
  it('moves the offset opposite the drag direction, scaled by cellSize', () => {
    const next = panCamera(camera, 20, 40)
    expect(next.offsetX).toBeCloseTo(-1)
    expect(next.offsetY).toBeCloseTo(-2)
  })

  it('preserves cellSize', () => {
    const zoomed: Camera = { offsetX: 0, offsetY: 0, cellSize: 40 }
    expect(panCamera(zoomed, 40, 0).cellSize).toBe(40)
  })
})

describe('zoomCameraAtPoint', () => {
  it('keeps the world point under the cursor fixed on screen', () => {
    const pixelX = 100
    const pixelY = 50
    const next = zoomCameraAtPoint(camera, pixelX, pixelY, 2)
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE * 2)
    const screenAfter = worldToScreen(next, 5, 2.5)
    expect(screenAfter.x).toBeCloseTo(pixelX)
    expect(screenAfter.y).toBeCloseTo(pixelY)
  })

  it('clamps to MAX_CELL_SIZE and returns the same camera reference once clamped', () => {
    const clamped = zoomCameraAtPoint(camera, 0, 0, 1000)
    expect(clamped.cellSize).toBe(MAX_CELL_SIZE)

    const noop = zoomCameraAtPoint(clamped, 0, 0, 1000)
    expect(noop).toBe(clamped)
  })

  it('clamps to MIN_CELL_SIZE and returns the same camera reference once clamped', () => {
    const clamped = zoomCameraAtPoint(camera, 0, 0, 0.001)
    expect(clamped.cellSize).toBe(MIN_CELL_SIZE)

    const noop = zoomCameraAtPoint(clamped, 0, 0, 0.001)
    expect(noop).toBe(clamped)
  })
})

describe('centeredCamera', () => {
  it('resets to the default zoom, centered on the given viewport size', () => {
    expect(centeredCamera(800, 600)).toEqual({
      cellSize: DEFAULT_CELL_SIZE,
      offsetX: -800 / 2 / DEFAULT_CELL_SIZE,
      offsetY: -600 / 2 / DEFAULT_CELL_SIZE,
    })
  })
})

describe('applyWheelInput', () => {
  it('pans (leaves cellSize unchanged) when shiftKey is false', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 40, deltaY: 100, shiftKey: false })
    expect(next.cellSize).toBe(camera.cellSize)
  })

  it('scrolling down/right (positive deltaY/deltaX) increases offsetY/offsetX -- the opposite sign convention from drag-to-pan', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 40, deltaY: 100, shiftKey: false })
    expect(next.offsetX).toBeGreaterThan(camera.offsetX)
    expect(next.offsetY).toBeGreaterThan(camera.offsetY)
  })

  it('zooms (leaves offset behaving like zoomCameraAtPoint) when shiftKey is true', () => {
    const next = applyWheelInput(camera, { pixelX: 100, pixelY: 50, deltaX: 0, deltaY: -100, shiftKey: true })
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE * ZOOM_FACTOR)
    const screenAfter = worldToScreen(next, 5, 2.5)
    expect(screenAfter.x).toBeCloseTo(100)
    expect(screenAfter.y).toBeCloseTo(50)
  })

  it('zooms out when the shift-held scroll direction is positive', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 0, deltaY: 100, shiftKey: true })
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE / ZOOM_FACTOR)
  })

  it('falls back to deltaX for zoom direction when deltaY is 0 and shiftKey is true', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: -100, deltaY: 0, shiftKey: true })
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE * ZOOM_FACTOR)
  })

  it('prefers deltaY over deltaX for zoom direction when both are populated', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 50, deltaY: -100, shiftKey: true })
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE * ZOOM_FACTOR)
  })

  it('zooms out (not in) at the zoomDelta === 0 boundary, pinning the `< 0` guard exactly', () => {
    const next = applyWheelInput(camera, { pixelX: 0, pixelY: 0, deltaX: 0, deltaY: 0, shiftKey: true })
    expect(next.cellSize).toBe(DEFAULT_CELL_SIZE / ZOOM_FACTOR)
  })
})

describe('zoomPercentage', () => {
  it('is 100 at the default cell size', () => {
    expect(zoomPercentage(camera)).toBe(100)
  })

  it('scales proportionally to cell size', () => {
    expect(zoomPercentage({ ...camera, cellSize: 40 })).toBe(200)
    expect(zoomPercentage({ ...camera, cellSize: 10 })).toBe(50)
    expect(zoomPercentage({ ...camera, cellSize: 60 })).toBe(300)
    expect(zoomPercentage({ ...camera, cellSize: 8 })).toBe(40)
  })
})

describe('rectRelativePixels', () => {
  it('subtracts the rect origin from client coordinates', () => {
    expect(rectRelativePixels({ left: 50, top: 30 }, 150, 130)).toEqual({ pixelX: 100, pixelY: 100 })
  })

  it('is an identity for a rect at the window origin', () => {
    expect(rectRelativePixels({ left: 0, top: 0 }, 12, -7)).toEqual({ pixelX: 12, pixelY: -7 })
  })

  it('yields negative pixels for a point above/left of the rect', () => {
    expect(rectRelativePixels({ left: 100, top: 100 }, 40, 90)).toEqual({ pixelX: -60, pixelY: -10 })
  })
})
