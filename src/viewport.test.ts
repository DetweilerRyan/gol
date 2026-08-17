import { describe, expect, it } from 'vitest'
import {
  centeredCamera,
  clampCellSize,
  computeVisibleRange,
  DEFAULT_CELL_SIZE,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  panCamera,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  type Camera,
} from './viewport'

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

describe('computeVisibleRange', () => {
  it('covers the viewport plus a buffer on all sides', () => {
    const range = computeVisibleRange(camera, 200, 100)
    // 200px / 20px = 10 cells wide, 100px / 20px = 5 cells tall, plus 2-cell buffer each side.
    expect(range).toEqual({ minX: -2, maxX: 12, minY: -2, maxY: 7 })
  })

  it('shrinks the cell count as cellSize (zoom) increases', () => {
    const zoomedIn: Camera = { offsetX: 0, offsetY: 0, cellSize: 40 }
    const range = computeVisibleRange(zoomedIn, 200, 100)
    const cols = range.maxX - range.minX
    const zoomedOutRange = computeVisibleRange(camera, 200, 100)
    const zoomedOutCols = zoomedOutRange.maxX - zoomedOutRange.minX
    expect(cols).toBeLessThan(zoomedOutCols)
  })

  it('shifts with a fractional camera offset', () => {
    const panned: Camera = { offsetX: 4.7, offsetY: -3.2, cellSize: 20 }
    const range = computeVisibleRange(panned, 200, 100)
    expect(range.minX).toBe(Math.floor(4.7) - 2)
    expect(range.minY).toBe(Math.floor(-3.2) - 2)
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
