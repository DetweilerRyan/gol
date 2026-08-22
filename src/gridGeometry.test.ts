import { describe, expect, it } from 'vitest'
import { DEFAULT_CELL_SIZE, type Camera } from './camera'
import { computeMajorGridlines, computeVisibleRange, isMajorGridline, type VisibleRange } from './gridGeometry'

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
