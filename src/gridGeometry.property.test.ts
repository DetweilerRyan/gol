import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen, type Camera } from './camera'
import { computeMajorGridlines, computeVisibleRange, gridLinePhasePx, type VisibleRange } from './gridGeometry'
import { cameraArbitrary as camera } from './test-support/arbitraries'

const worldCoord = fc.integer({ min: -10_000, max: 10_000 })

describe('computeVisibleRange (property)', () => {
  const viewportDimension = fc.integer({ min: 0, max: 4000 })

  it.prop([camera, viewportDimension, viewportDimension])(
    'always produces a well-formed, non-inverted range',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.minX).toBeLessThanOrEqual(range.maxX)
      expect(range.minY).toBeLessThanOrEqual(range.maxY)
    },
  )

  it.prop([camera, viewportDimension, viewportDimension])(
    'is always wide/tall enough to cover the requested viewport size in cells',
    (cam, width, height) => {
      const range = computeVisibleRange(cam, width, height)
      expect(range.maxX - range.minX).toBeGreaterThanOrEqual(width / cam.cellSize)
      expect(range.maxY - range.minY).toBeGreaterThanOrEqual(height / cam.cellSize)
    },
  )
})

describe('computeMajorGridlines (property)', () => {
  const rangeEndpoint = fc.integer({ min: -500, max: 500 })

  // THE LITERAL 10 IS DELIBERATE -- do not "tidy" it into
  // MAJOR_GRIDLINE_INTERVAL. This is the oracle, and an oracle importing the
  // constant its subject also reads moves with it: measured on this file
  // before the restatement, mutating the constant 10 -> 11 left this property
  // green, because both sides changed together. The same restate-rather-than-
  // import discipline Scrollbar.test.tsx applies to SCROLLBAR_THICKNESS_PX,
  // for the same reason. This oracle used to be spelled isMajorGridline(i),
  // which is where that self-reference came from; that predicate is gone
  // (see gridGeometry.ts) and this is what replaced it.
  const EVERY_TENTH_COORDINATE = 10

  function bruteForceGridlines(min: number, max: number): number[] {
    const lines: number[] = []
    for (let i = min; i <= max; i++) {
      if (i % EVERY_TENTH_COORDINATE === 0) lines.push(i)
    }
    return lines
  }

  it.prop([rangeEndpoint, rangeEndpoint, rangeEndpoint, rangeEndpoint])(
    'matches a brute-force scan of every coordinate in range, on both axes',
    (a, b, c, d) => {
      const range: VisibleRange = {
        minX: Math.min(a, b),
        maxX: Math.max(a, b),
        minY: Math.min(c, d),
        maxY: Math.max(c, d),
      }
      const gridlines = computeMajorGridlines(range)
      expect(gridlines.x).toEqual(bruteForceGridlines(range.minX, range.maxX))
      expect(gridlines.y).toEqual(bruteForceGridlines(range.minY, range.maxY))
    },
  )

  it.prop([rangeEndpoint, rangeEndpoint])('every returned gridline is within range and a multiple of 10', (a, b) => {
    const range: VisibleRange = { minX: Math.min(a, b), maxX: Math.max(a, b), minY: 0, maxY: 0 }
    for (const x of computeMajorGridlines(range).x) {
      expect(x).toBeGreaterThanOrEqual(range.minX)
      expect(x).toBeLessThanOrEqual(range.maxX)
      // `=== 0` rather than toBe(0) on the remainder itself: (-20) % 10 is
      // -0 in JS and toBe uses Object.is, which separates -0 from 0. The
      // retired isMajorGridline hid this behind its own `=== 0`.
      expect(x % EVERY_TENTH_COORDINATE === 0).toBe(true)
    }
  })
})

// gridLinePhasePx (property): the coincidence identity GridLines.tsx's own
// spike checked -- that its background-position phase lands on the exact
// same screen pixel worldToScreen would place a cell's own border at. The
// spike (see GridLines.test.tsx) hand-picked two cellSize points (20 and
// 12.8, the default and two zoom-out steps) rather than sweeping the whole
// reachable range; this closes that gap by quantifying over the entire
// [MIN_CELL_SIZE, MAX_CELL_SIZE] span with a fractional cellSize (the app
// reaches non-integer values like 12.8 and 8.192 via repeated ZOOM_FACTOR
// steps -- arbitraries.ts's shared cellSizeArbitrary is integer-only, so a
// local fractional one is built here instead, the same "build your own when
// the shared one doesn't fit" pattern camera.property.test.ts's own comment
// documents for exact-offset cameras).
const fractionalCellSizeCameraArbitrary: fc.Arbitrary<Camera> = fc.record({
  offsetX: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
  offsetY: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
  cellSize: fc.float({ min: Math.fround(MIN_CELL_SIZE), max: Math.fround(MAX_CELL_SIZE), noNaN: true }),
})

function wrapIntoPeriod(value: number, period: number): number {
  return ((value % period) + period) % period
}

// Circular (modular) distance, not a plain difference: two phases pinned
// right at opposite sides of a period boundary -- e.g. 0 and period - 1e-15
// are the SAME line, approached from a different rounding direction, not a
// seam. A plain toBeCloseTo treats those as ~period apart and fails; this
// is what an early draft of the property below did, and shrinking found the
// counterexample {offsetX: 5.55e-17, cellSize: 8, worldCoordinate: -1} in
// under a second -- confirming the comparison, not gridLinePhasePx, was
// wrong (GridLines.test.tsx's own toBeCloseTo never hit this because its
// two hand-picked cameras don't land that close to a boundary).
function circularDeltaPx(a: number, b: number, period: number): number {
  const raw = wrapIntoPeriod(a - b, period)
  return Math.min(raw, period - raw)
}

describe('gridLinePhasePx (property)', () => {
  it.prop([fractionalCellSizeCameraArbitrary, worldCoord])(
    'coincides with worldToScreen, wrapped into one cellSize period, at every cellSize -- not just the two points the GridLines.tsx spike hand-checked',
    (cam, worldCoordinate) => {
      const { minorXPx, minorYPx } = gridLinePhasePx(cam)
      const screen = worldToScreen(cam, worldCoordinate, worldCoordinate)
      // Congruent over the reals, not bit-exact: the two sides reach the same
      // phase via a different sequence of floating-point operations (a
      // multiply-then-wrap vs a subtract-then-multiply), and can land on
      // opposite sides of the wrap boundary -- see circularDeltaPx above.
      expect(circularDeltaPx(wrapIntoPeriod(screen.x, cam.cellSize), minorXPx, cam.cellSize)).toBeLessThan(1e-6)
      expect(circularDeltaPx(wrapIntoPeriod(screen.y, cam.cellSize), minorYPx, cam.cellSize)).toBeLessThan(1e-6)
    },
  )

  it.prop([fractionalCellSizeCameraArbitrary])(
    'always returns a value in [0, period) on every axis, minor and major alike',
    (cam) => {
      const phase = gridLinePhasePx(cam)
      expect(phase.minorXPx).toBeGreaterThanOrEqual(0)
      expect(phase.minorXPx).toBeLessThan(cam.cellSize)
      expect(phase.minorYPx).toBeGreaterThanOrEqual(0)
      expect(phase.minorYPx).toBeLessThan(cam.cellSize)
      expect(phase.majorXPx).toBeGreaterThanOrEqual(0)
      expect(phase.majorXPx).toBeLessThan(cam.cellSize * 10)
      expect(phase.majorYPx).toBeGreaterThanOrEqual(0)
      expect(phase.majorYPx).toBeLessThan(cam.cellSize * 10)
    },
  )
})
