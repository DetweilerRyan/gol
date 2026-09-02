import { describe, expect, it } from 'vitest'
import { DEFAULT_CELL_SIZE, worldToScreen, type Camera } from './camera'
import {
  computeMajorGridlines,
  computeOnScreenRange,
  computeVisibleRange,
  gridLinePhasePx,
  isMajorGridline,
  type VisibleRange,
} from './gridGeometry'

const camera: Camera = { offsetX: 0, offsetY: 0, cellSize: DEFAULT_CELL_SIZE }

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

describe('computeOnScreenRange', () => {
  it('covers exactly the fully-visible cells, with no buffer', () => {
    // 200px / 20px = 10 cells wide, 100px / 20px = 5 cells tall, and offsetX/Y
    // is exactly 0 so every cell divides evenly -- no partial cell at either
    // edge, unlike computeVisibleRange's own first test above.
    const range = computeOnScreenRange(camera, 200, 100)
    expect(range).toEqual({ minX: 0, maxX: 9, minY: 0, maxY: 4 })
  })

  it('excludes a cell partially clipped by a fractional offset, on both edges', () => {
    // Mirrors the default camera's own offsetY (-22.5) at a smaller scale:
    // the leading and trailing cell are both half cut off, so neither is
    // "fully visible" and the range shrinks on both sides.
    const panned: Camera = { offsetX: 0, offsetY: 4.5, cellSize: 20 }
    const range = computeOnScreenRange(panned, 200, 100)
    expect(range.minY).toBe(5)
    expect(range.maxY).toBe(8)
  })

  it('every cell in the range is fully within the viewport, and the cell one beyond it is not', () => {
    const panned: Camera = { offsetX: 4.7, offsetY: -3.2, cellSize: 20 }
    const widthPx = 243
    const heightPx = 137
    const range = computeOnScreenRange(panned, widthPx, heightPx)

    const left = worldToScreen(panned, range.minX, 0).x
    const right = worldToScreen(panned, range.maxX + 1, 0).x
    expect(left).toBeGreaterThanOrEqual(0)
    expect(right).toBeLessThanOrEqual(widthPx)

    const oneBeyondLeft = worldToScreen(panned, range.minX - 1, 0).x
    const oneBeyondRight = worldToScreen(panned, range.maxX + 2, 0).x
    expect(oneBeyondLeft).toBeLessThan(0)
    expect(oneBeyondRight).toBeGreaterThan(widthPx)
  })

  it('clamps to a single cell rather than inverting, for a 0x0 viewport', () => {
    const range = computeOnScreenRange(camera, 0, 0)
    expect(range.maxX).toBeGreaterThanOrEqual(range.minX)
    expect(range.maxY).toBeGreaterThanOrEqual(range.minY)
  })

  it('finds minX/minY at exactly 0 for the default camera, not -0', () => {
    const range = computeOnScreenRange(camera, 200, 100)
    expect(Object.is(range.minX, -0)).toBe(false)
    expect(Object.is(range.minY, -0)).toBe(false)
  })

  it('matches the default 1280x900 viewport used throughout features/screenplay/viewport.ts', () => {
    const defaultCamera: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
    const range = computeOnScreenRange(defaultCamera, 1280, 900)
    expect(range).toEqual({ minX: -32, maxX: 31, minY: -22, maxY: 21 })
  })
})

describe('gridLinePhasePx', () => {
  it('is all zero when world 0,0 sits at the camera origin', () => {
    expect(gridLinePhasePx(camera)).toEqual({ minorXPx: 0, minorYPx: 0, majorXPx: 0, majorYPx: 0 })
  })

  it('wraps a positive offset into [0, cellSize) for the minor phase', () => {
    const panned: Camera = { offsetX: 3, offsetY: 7, cellSize: 20 }
    // rawXPx = -3 * 20 = -60, which is an exact multiple of 20 -- wraps to 0.
    expect(gridLinePhasePx(panned).minorXPx).toBe(0)
    expect(gridLinePhasePx(panned).minorYPx).toBe(0)
  })

  it('wraps a fractional offset to a positive in-period pixel value, never negative', () => {
    const panned: Camera = { offsetX: 0.25, offsetY: -0.25, cellSize: 20 }
    // rawXPx = -0.25 * 20 = -5 -> wraps to 20 - 5 = 15.
    expect(gridLinePhasePx(panned).minorXPx).toBe(15)
    // rawYPx = 0.25 * 20 = 5 -> already in [0, 20).
    expect(gridLinePhasePx(panned).minorYPx).toBe(5)
  })

  it('computes the major phase over a period ten times the minor one', () => {
    const panned: Camera = { offsetX: 1, offsetY: 0, cellSize: 20 }
    // rawXPx = -1 * 20 = -20; minor period 20 wraps to 0, major period 200
    // wraps to 180.
    const phase = gridLinePhasePx(panned)
    expect(phase.minorXPx).toBe(0)
    expect(phase.majorXPx).toBe(180)
  })

  it('always returns a non-negative value strictly less than the relevant period', () => {
    const cameras: Camera[] = [
      { offsetX: -32, offsetY: -22.5, cellSize: 20 },
      { offsetX: 1000.9, offsetY: -999.1, cellSize: 60 },
      { offsetX: -0.001, offsetY: 0.001, cellSize: 8 },
    ]
    for (const c of cameras) {
      const phase = gridLinePhasePx(c)
      expect(phase.minorXPx).toBeGreaterThanOrEqual(0)
      expect(phase.minorXPx).toBeLessThan(c.cellSize)
      expect(phase.minorYPx).toBeGreaterThanOrEqual(0)
      expect(phase.minorYPx).toBeLessThan(c.cellSize)
      expect(phase.majorXPx).toBeGreaterThanOrEqual(0)
      expect(phase.majorXPx).toBeLessThan(c.cellSize * 10)
      expect(phase.majorYPx).toBeGreaterThanOrEqual(0)
      expect(phase.majorYPx).toBeLessThan(c.cellSize * 10)
    }
  })
})
