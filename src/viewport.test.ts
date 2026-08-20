import { describe, expect, it } from 'vitest'
import type { ContentBounds } from './gameOfLife'
import {
  applyWheelInput,
  cellsInRange,
  centeredCamera,
  clampCellSize,
  computeMajorGridlines,
  computeScrollbarMetrics,
  computeThumbGeometry,
  computeVisibleRange,
  DEFAULT_CELL_SIZE,
  isMajorGridline,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  panCamera,
  panCameraByScrollbarDrag,
  screenToWorld,
  worldToScreen,
  zoomCameraAtPoint,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
  type VisibleRange,
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

describe('cellsInRange', () => {
  it('enumerates every coordinate in the range, row-major (y outer, x inner)', () => {
    const range: VisibleRange = { minX: 0, maxX: 2, minY: 0, maxY: 1 }
    expect(cellsInRange(range)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ])
  })

  it('returns an empty array when the range is inverted (max < min)', () => {
    const range: VisibleRange = { minX: 5, maxX: 2, minY: 0, maxY: 1 }
    expect(cellsInRange(range)).toEqual([])
  })

  it('returns a single cell for a single-cell range', () => {
    const range: VisibleRange = { minX: 3, maxX: 3, minY: -1, maxY: -1 }
    expect(cellsInRange(range)).toEqual([{ x: 3, y: -1 }])
  })

  it('matches the cell count implied by computeVisibleRange', () => {
    const range = computeVisibleRange(camera, 200, 100)
    const width = range.maxX - range.minX + 1
    const height = range.maxY - range.minY + 1
    expect(cellsInRange(range)).toHaveLength(width * height)
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

describe('isMajorGridline', () => {
  it('is true for zero and positive multiples of 10', () => {
    expect(isMajorGridline(0)).toBe(true)
    expect(isMajorGridline(10)).toBe(true)
    expect(isMajorGridline(100)).toBe(true)
  })

  it('is true for negative multiples of 10', () => {
    expect(isMajorGridline(-10)).toBe(true)
    expect(isMajorGridline(-100)).toBe(true)
  })

  it('is false for non-multiples of 10', () => {
    expect(isMajorGridline(5)).toBe(false)
    expect(isMajorGridline(11)).toBe(false)
    expect(isMajorGridline(-3)).toBe(false)
  })
})

describe('computeMajorGridlines', () => {
  it('returns every multiple of 10 within an arbitrary range', () => {
    const range: VisibleRange = { minX: -23, maxX: 17, minY: -5, maxY: 26 }
    expect(computeMajorGridlines(range)).toEqual({
      x: [-20, -10, 0, 10],
      y: [0, 10, 20],
    })
  })

  it('returns an empty array when the range spans no multiple of 10', () => {
    const range: VisibleRange = { minX: 1, maxX: 9, minY: 1, maxY: 9 }
    expect(computeMajorGridlines(range)).toEqual({ x: [], y: [] })
  })

  it('includes both bounds when they are themselves exact multiples of 10', () => {
    const range: VisibleRange = { minX: -10, maxX: 10, minY: -10, maxY: 10 }
    expect(computeMajorGridlines(range)).toEqual({
      x: [-10, 0, 10],
      y: [-10, 0, 10],
    })
  })

  it("finds the gridline at exactly 0 for the default camera's visible range, not -0", () => {
    // computeVisibleRange's own test above produces exactly this range for the
    // default camera. Math.ceil(-2 / 10) is -0, not 0 -- toEqual distinguishes
    // them (Object.is semantics), so this specifically guards that regression.
    const range: VisibleRange = { minX: -2, maxX: 12, minY: -2, maxY: 7 }
    const gridlines = computeMajorGridlines(range)
    expect(gridlines).toEqual({ x: [0, 10], y: [0] })
    expect(Object.is(gridlines.x[0], -0)).toBe(false)
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
})

describe('computeScrollbarMetrics', () => {
  it('fills the entire track on both axes when there is no content', () => {
    const metrics = computeScrollbarMetrics(camera, null, 800, 600)
    expect(metrics).toEqual({
      horizontal: { thumbRatio: 1, thumbOffsetRatio: 0 },
      vertical: { thumbRatio: 1, thumbOffsetRatio: 0 },
    })
  })

  it('still fills the track when content is smaller than the viewport', () => {
    const bounds: ContentBounds = { minX: 5, maxX: 6, minY: 5, maxY: 6 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbRatio).toBe(1)
    expect(metrics.vertical.thumbRatio).toBe(1)
  })

  it('shrinks only the horizontal thumb when content is wider than the viewport', () => {
    // Content spans 200 world units * 20px cellSize = 4000px wide, 2 units tall.
    const bounds: ContentBounds = { minX: 0, maxX: 200, minY: 0, maxY: 2 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbRatio).toBeCloseTo(800 / 4000)
    expect(metrics.vertical.thumbRatio).toBe(1)
  })

  it('keeps the thumb offset ratio within [0, 1] when panned far from all content', () => {
    const panned: Camera = { offsetX: 500, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }
    const bounds: ContentBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    const metrics = computeScrollbarMetrics(panned, bounds, 800, 600)
    expect(metrics.horizontal.thumbOffsetRatio).toBe(1)
    expect(metrics.horizontal.thumbRatio).toBeLessThan(1)
  })

  it('bottoms the offset ratio out at 0 when content sits entirely off the opposite edge', () => {
    // Content entirely to the RIGHT of the viewport this time (opposite of the case above).
    const bounds: ContentBounds = { minX: 500, maxX: 501, minY: 0, maxY: 1 }
    const metrics = computeScrollbarMetrics(camera, bounds, 800, 600)
    expect(metrics.horizontal.thumbOffsetRatio).toBe(0)
  })
})

describe('computeThumbGeometry', () => {
  it('sizes and positions the thumb proportionally to the track in the normal case', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 0.5, thumbOffsetRatio: 0.5 }, 800)
    expect(geometry.lengthPx).toBe(400)
    expect(geometry.offsetPx).toBe(200)
  })

  it('clamps the thumb up to MIN_THUMB_PX when the ratio would make it too small to grab', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 0.01, thumbOffsetRatio: 1 }, 800)
    expect(geometry.lengthPx).toBe(24)
    expect(geometry.offsetPx).toBe(776)
  })

  it('clamps the thumb down to the track length when MIN_THUMB_PX would exceed a small track', () => {
    const geometry = computeThumbGeometry({ thumbRatio: 1, thumbOffsetRatio: 0 }, 20)
    expect(geometry.lengthPx).toBe(20)
    expect(geometry.offsetPx).toBe(0)
  })
})

describe('panCameraByScrollbarDrag', () => {
  it('increases offsetX when dragging the horizontal thumb, the opposite sign from drag-to-pan', () => {
    const next = panCameraByScrollbarDrag(camera, 'x', 50, 1)
    expect(next.offsetX).toBeGreaterThan(camera.offsetX)
    expect(next.offsetY).toBe(camera.offsetY)
  })

  it('increases offsetY when dragging the vertical thumb', () => {
    const next = panCameraByScrollbarDrag(camera, 'y', 50, 1)
    expect(next.offsetY).toBeGreaterThan(camera.offsetY)
  })

  it('scales the offset delta inversely with thumbRatio', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 1).offsetX).toBeCloseTo(2.5)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0.5).offsetX).toBeCloseTo(5)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0.25).offsetX).toBeCloseTo(10)
  })

  it('is a no-op when thumbRatio is zero or negative', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 0)).toBe(camera)
    expect(panCameraByScrollbarDrag(camera, 'x', 50, -1)).toBe(camera)
  })

  it('preserves cellSize', () => {
    expect(panCameraByScrollbarDrag(camera, 'x', 50, 1).cellSize).toBe(camera.cellSize)
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
