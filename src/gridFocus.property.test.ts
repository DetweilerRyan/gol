import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { panCamera, type Camera } from './camera'
import { centerCell, jumpToRowEdge, panToRevealPx, stepFocus, type FocusCell, type FocusDirection } from './gridFocus'
import { computeOnScreenRange, type VisibleRange } from './gridGeometry'
import { cellSizeArbitrary } from './test-support/arbitraries'

// The keyboard focus cursor's invariants, owed by architect since this module
// landed at step 1 of collapse-dead-cell-layer and written at that slice's
// closing REVIEW pass. Each property below is paired with the fault it was
// shown to catch -- a property nobody has seen fail is documentation, and the
// two that survived their first fault injection are called out as such.

const worldCoordinate = fc.integer({ min: -5000, max: 5000 })
const focusArbitrary: fc.Arbitrary<FocusCell> = fc.record({ x: worldCoordinate, y: worldCoordinate })
const directionArbitrary = fc.constantFrom<FocusDirection>('left', 'right', 'up', 'down')

// VIEWPORTS OF AT LEAST ONE CELL PER AXIS, and this scope is load-bearing
// rather than tidy. computeOnScreenRange clamps maxX/maxY up to minX/minY so
// the range is never empty, and that clamp is a deliberate, documented
// weakening of its own "every returned cell is fully visible" contract below
// one cell per axis (see its comment in gridGeometry.ts, recorded by coder
// during this slice). A reveal property quantified over a 0x0 pre-measurement
// viewport would be asserting against a range whose single cell is admittedly
// not on screen, and would fail for a reason that is not a defect.
const viewportArbitrary = fc
  .record({ widthPx: fc.integer({ min: 8, max: 2000 }), heightPx: fc.integer({ min: 8, max: 2000 }) })
  .chain(({ widthPx, heightPx }) =>
    cellSizeArbitrary
      .filter((cellSize) => cellSize <= widthPx && cellSize <= heightPx)
      .map((cellSize) => ({ widthPx, heightPx, cellSize })),
  )

// Integer offsets: computeOnScreenRange's own ceil/floor arithmetic is exact
// on integers, and a fractional offset would put the "reveal lands the cursor
// exactly at the edge" assertions a sub-pixel either side of the boundary for
// reasons that are about float rounding rather than about this module.
const cameraFor = (cellSize: number, offsetX: number, offsetY: number): Camera => ({ offsetX, offsetY, cellSize })
const offsetArbitrary = fc.integer({ min: -500, max: 500 })

const RANGE_BOUND = fc.integer({ min: -400, max: 400 })
const rangeArbitrary: fc.Arbitrary<VisibleRange> = fc
  .tuple(RANGE_BOUND, RANGE_BOUND, RANGE_BOUND, RANGE_BOUND)
  .map(([a, b, c, d]) => ({
    minX: Math.min(a, b),
    maxX: Math.max(a, b),
    minY: Math.min(c, d),
    maxY: Math.max(c, d),
  }))

const OPPOSITE: Readonly<Record<FocusDirection, FocusDirection>> = {
  left: 'right',
  right: 'left',
  up: 'down',
  down: 'up',
}

describe('stepFocus (property)', () => {
  it.prop([focusArbitrary, directionArbitrary])('is inverted by its opposite direction', (focus, direction) => {
    // Caught: swapping the x and y branches for 'up'/'down' (still a
    // one-cell move, still invertible by its own opposite -- and this
    // property still passes; see the sibling below, which is what catches
    // it). Caught here instead: 'left' returning x - 2, and 'right'
    // returning the input unchanged.
    expect(stepFocus(stepFocus(focus, direction), OPPOSITE[direction])).toEqual(focus)
  })

  it.prop([focusArbitrary, directionArbitrary])('moves exactly one cell along exactly one axis', (focus, direction) => {
    const next = stepFocus(focus, direction)
    const movedX = Math.abs(next.x - focus.x)
    const movedY = Math.abs(next.y - focus.y)
    expect([movedX, movedY].sort()).toEqual([0, 1])
    // The axis itself, not just the distance: this is what separates the
    // four directions from each other, and the pair with the inverse
    // property above is what makes an axis swap fail. (Measured: swapping
    // the up/down and left/right branches leaves the inverse property green
    // and reds this one.)
    const horizontal = direction === 'left' || direction === 'right'
    expect(movedX === 1).toBe(horizontal)
  })

  it('is exact at the origin in all four directions, where a sign error is invisible to a distance check', () => {
    const origin: FocusCell = { x: 0, y: 0 }
    expect(stepFocus(origin, 'left')).toEqual({ x: -1, y: 0 })
    expect(stepFocus(origin, 'right')).toEqual({ x: 1, y: 0 })
    expect(stepFocus(origin, 'up')).toEqual({ x: 0, y: -1 })
    expect(stepFocus(origin, 'down')).toEqual({ x: 0, y: 1 })
  })
})

describe('centerCell (property)', () => {
  it.prop([rangeArbitrary])('lands inside its own range on both axes', (range) => {
    const center = centerCell(range)
    expect(center.x).toBeGreaterThanOrEqual(range.minX)
    expect(center.x).toBeLessThanOrEqual(range.maxX)
    expect(center.y).toBeGreaterThanOrEqual(range.minY)
    expect(center.y).toBeLessThanOrEqual(range.maxY)
  })

  it.prop([rangeArbitrary])('is no more than half a cell off the true midpoint', (range) => {
    // The rounding rule this module chose (+1 before flooring, so an even
    // cell count breaks toward the higher-numbered cell) is pinned exactly by
    // the deterministic cases below; here it only has to be A center.
    const center = centerCell(range)
    expect(Math.abs(center.x - (range.minX + range.maxX) / 2)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(center.y - (range.minY + range.maxY) / 2)).toBeLessThanOrEqual(0.5)
  })

  it('breaks an even-count tie toward the higher cell, and never returns -0', () => {
    // The default 1280x900 camera's own range, the case
    // keyboard-grid-navigation.feature's first scenario is stated against:
    // (0, 0), not (-1, -1). Pinned deterministically because the generator
    // has no reason to draw an exactly-symmetric range, and because -0 is
    // invisible to every comparison except Object.is.
    const symmetric: VisibleRange = { minX: -32, maxX: 31, minY: -23, maxY: 22 }
    const center = centerCell(symmetric)
    expect(center).toEqual({ x: 0, y: 0 })
    expect(Object.is(center.x, -0)).toBe(false)
    expect(Object.is(center.y, -0)).toBe(false)
    expect(centerCell({ minX: 0, maxX: 0, minY: 0, maxY: 0 })).toEqual({ x: 0, y: 0 })
  })
})

describe('jumpToRowEdge (property)', () => {
  it.prop([focusArbitrary, rangeArbitrary, fc.constantFrom<'left' | 'right'>('left', 'right')])(
    'stays on its own row and lands on the named edge of the range',
    (focus, onScreen, edge) => {
      // Both clauses matter together: an implementation that also moved to
      // the middle row would satisfy the edge clause alone, and one that
      // jumped to the wrong edge would satisfy the row clause alone. This is
      // the unit-level twin of the two-clause Then in
      // keyboard-grid-navigation.feature's Home/End outline.
      const jumped = jumpToRowEdge(focus, edge, onScreen)
      expect(jumped.y).toBe(focus.y)
      expect(jumped.x).toBe(edge === 'left' ? onScreen.minX : onScreen.maxX)
    },
  )

  it.prop([focusArbitrary, rangeArbitrary, fc.constantFrom<'left' | 'right'>('left', 'right')])(
    'is idempotent -- jumping to an edge you are already on moves nothing',
    (focus, onScreen, edge) => {
      const once = jumpToRowEdge(focus, edge, onScreen)
      expect(jumpToRowEdge(once, edge, onScreen)).toEqual(once)
    },
  )
})

describe('panToRevealPx (property)', () => {
  it.prop([focusArbitrary, viewportArbitrary, offsetArbitrary, offsetArbitrary])(
    'applied through the real panCamera, always brings the focus inside the new on-screen range',
    (focus, { widthPx, heightPx, cellSize }, offsetX, offsetY) => {
      // The sign convention is derived in this function's own comment against
      // camera.ts's panCamera; this checks the derivation rather than
      // restating it, by applying the returned pixels through that same
      // panCamera (not a mock) and asking the resulting range where the
      // cursor is. A flipped sign on either axis fails immediately.
      const camera = cameraFor(cellSize, offsetX, offsetY)
      const onScreen = computeOnScreenRange(camera, widthPx, heightPx)
      const { dxPixels, dyPixels } = panToRevealPx(focus, camera, onScreen)

      const revealed = computeOnScreenRange(panCamera(camera, dxPixels, dyPixels), widthPx, heightPx)
      expect(focus.x).toBeGreaterThanOrEqual(revealed.minX)
      expect(focus.x).toBeLessThanOrEqual(revealed.maxX)
      expect(focus.y).toBeGreaterThanOrEqual(revealed.minY)
      expect(focus.y).toBeLessThanOrEqual(revealed.maxY)
    },
  )

  it.prop([viewportArbitrary, offsetArbitrary, offsetArbitrary])(
    'asks for no pan at all for a cursor already on screen',
    ({ widthPx, heightPx, cellSize }, offsetX, offsetY) => {
      // Quantified over every cell of the range rather than one sampled cell:
      // the four comparisons in panToRevealPx are independent, and a wrong
      // one only shows at its own edge. A single interior sample would miss
      // all four.
      const camera = cameraFor(cellSize, offsetX, offsetY)
      const onScreen = computeOnScreenRange(camera, widthPx, heightPx)
      for (const x of [onScreen.minX, onScreen.maxX]) {
        for (const y of [onScreen.minY, onScreen.maxY]) {
          expect(panToRevealPx({ x, y }, camera, onScreen)).toEqual({ dxPixels: 0, dyPixels: 0 })
        }
      }
    },
  )

  it.prop([viewportArbitrary, offsetArbitrary, offsetArbitrary])(
    'moves one axis only when the cursor left by one axis only',
    ({ widthPx, heightPx, cellSize }, offsetX, offsetY) => {
      // `dxPixels !== 0 || dyPixels !== 0` in useGridFocus is satisfied by its
      // left operand on every horizontal reveal, so a purely vertical one is
      // what separates the axes here too.
      const camera = cameraFor(cellSize, offsetX, offsetY)
      const onScreen = computeOnScreenRange(camera, widthPx, heightPx)

      const left = panToRevealPx({ x: onScreen.minX - 1, y: onScreen.minY }, camera, onScreen)
      expect(left.dyPixels).toBe(0)
      expect(left.dxPixels).toBe(cellSize)

      const up = panToRevealPx({ x: onScreen.minX, y: onScreen.minY - 1 }, camera, onScreen)
      expect(up.dxPixels).toBe(0)
      expect(up.dyPixels).toBe(cellSize)
    },
  )
})
