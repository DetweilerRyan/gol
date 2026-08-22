import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen, type Camera } from './camera'
import { ANCHOR_DRIFT_CELLS, anchorHolds, anchorOffsetPx, cellOffsetPx, computeAnchor, nextAnchor } from './cellAnchor'
import { EVICT_LAG_TILES, TILE_SPAN_CELLS } from './cellTiles'
import { cameraArbitrary as camera } from './test-support/arbitraries'

// The first three properties (the worldToScreen round trip, ported from
// cellLattice.property.test.ts's "slot placement" block, and nextAnchor's
// reference-identity and idempotence contracts) landed with the module in
// step 2. The precision bound below -- the reason this module exists at all
// -- was added at the architect review pass.

const spanCells = fc.integer({ min: 1, max: 16 })

// cameraArbitrary's offsets are +-1000 (tuned for the camera-side modules
// generally, where "some plausible camera" is all that's needed), but
// ANCHOR_DRIFT_CELLS is 4096 -- so any two cameraArbitrary-drawn cameras are
// always within the drift bound of each other, and anchorHolds is true over
// the entire domain cameraArbitrary can reach. Reusing it here would make
// nextAnchor's rebuild branch -- and the requantize-then-reapply half of
// idempotence -- untestable by construction, the same trap
// cellLattice.property.test.ts's header warns cellSizeArbitrary would fall
// into for this module's neighbour. A wide-offset camera, spanning well past
// the drift bound on both sides, is defined locally instead.
const wideOffset = fc.integer({ min: -3 * ANCHOR_DRIFT_CELLS, max: 3 * ANCHOR_DRIFT_CELLS })
const wideCamera: fc.Arbitrary<Camera> = fc.record({
  offsetX: wideOffset,
  offsetY: wideOffset,
  cellSize: fc.integer({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE }),
})

describe('anchorOffsetPx / cellOffsetPx (property)', () => {
  // THE invariant the whole anchor design rests on, carried over verbatim
  // from cellLattice.property.test.ts's "a slot painted at latticeOffsetPx +
  // slotPixelPosition lands exactly where worldToScreen puts its world
  // coordinate": if this identity fails, a click lands on a different cell
  // than the one under the cursor, because taps are resolved via
  // screenToWorld -- worldToScreen's inverse -- while cells are painted via
  // anchorOffsetPx + cellOffsetPx.
  it.prop([camera, spanCells, fc.integer({ min: -2000, max: 2000 }), fc.integer({ min: -2000, max: 2000 })])(
    'a cell painted at anchorOffsetPx + cellOffsetPx lands exactly where worldToScreen puts its world coordinate',
    (cam, span, worldX, worldY) => {
      const anchor = computeAnchor(cam, span)

      const offsetPx = anchorOffsetPx(anchor, cam)
      const painted = {
        x: offsetPx.xPx + cellOffsetPx(worldX, anchor.x, cam.cellSize),
        y: offsetPx.yPx + cellOffsetPx(worldY, anchor.y, cam.cellSize),
      }
      const expected = worldToScreen(cam, worldX, worldY)

      expect(painted.x).toBeCloseTo(expected.x, 6)
      expect(painted.y).toBeCloseTo(expected.y, 6)
    },
  )
})

describe('nextAnchor (property)', () => {
  it.prop([wideCamera, wideCamera, spanCells])(
    'keeps the previous anchor by reference exactly when it still holds, and never otherwise',
    (previousCam, cam, span) => {
      const previous = computeAnchor(previousCam, span)
      expect(nextAnchor(previous, cam, span) === previous).toBe(anchorHolds(previous, cam))
    },
  )

  it.prop([wideCamera, wideCamera, spanCells])(
    'is idempotent BY REFERENCE -- applying it to its own result cannot re-quantise again, so useCellTiles cannot loop',
    (previousCam, cam, span) => {
      const previous = computeAnchor(previousCam, span)
      const first = nextAnchor(previous, cam, span)
      expect(nextAnchor(first, cam, span)).toBe(first)
    },
  )
})

// The float32 integer-exactness cliff: above 2**24 a float32 can no longer
// represent every integer, so a compositor transform starts snapping pixel
// offsets to even multiples. Keeping every painted offset below this is the
// anchor's ENTIRE job (see ANCHOR_DRIFT_CELLS' comment), and until this
// property it was prose in a header rather than a checked invariant.
const FLOAT32_EXACT_INTEGER_LIMIT = 2 ** 24

// The largest viewport this design budgets for, in cells: 4000px (the bound
// cellTiles.property.test.ts also generates against) at MIN_CELL_SIZE, which
// is the zoom level that fits the most cells on screen.
const MAX_VIEWPORT_CELLS = Math.ceil(4000 / MIN_CELL_SIZE)

// How far past the camera's own offset a MOUNTED cell can sit: the viewport
// itself, plus the slack cellTiles.ts's range may still be carrying on that
// side (EVICT_LAG_TILES whole tiles). Imported from cellTiles.ts rather than
// restated, deliberately: the two modules are independent by design (neither
// imports the other), so this test file is the one place the two policies are
// tied together -- if TILE_SPAN_CELLS or EVICT_LAG_TILES is ever retuned, the
// bound this property quantifies over moves with them instead of going stale.
const MAX_MOUNTED_OFFSET_CELLS = MAX_VIEWPORT_CELLS + EVICT_LAG_TILES * TILE_SPAN_CELLS

// A camera that has travelled ARBITRARILY far from the world origin -- which
// is the only setting in which this module's job is even visible. wideCamera
// above spans +-3 * ANCHOR_DRIFT_CELLS, which is the right domain for
// exercising nextAnchor's rebuild branch but far too narrow here: at 12,288
// cells * MAX_CELL_SIZE the raw, un-anchored pixel position is still only
// ~737k, comfortably under the float32 cliff, so a cellOffsetPx that ignored
// its anchor entirely would satisfy the bound and the property would be
// documentation. The grid is conceptually infinite and a pan has no limit, so
// the offsets below do too (2**31 cells at MAX_CELL_SIZE is ~1.3e11 px, four
// orders of magnitude PAST the cliff).
//
// The offsets are deliberately FRACTIONAL, not whole cells: a camera offset
// is fractional for all but an instant of any real pan, and the fractional
// part is what discriminates a tile-aligned anchor (computeAnchor floors to a
// whole multiple of spanCells, so every anchor-relative offset stays an exact
// integer) from an anchor that merely tracked the camera.
const farOffset = fc
  .tuple(fc.integer({ min: -(2 ** 31), max: 2 ** 31 }), fc.float({ min: 0, max: Math.fround(0.999), noNaN: true }))
  .map(([whole, fraction]) => whole + fraction)

const farCamera: fc.Arbitrary<Camera> = fc.record({
  offsetX: farOffset,
  offsetY: farOffset,
  cellSize: fc.integer({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE }),
})

describe('cellOffsetPx precision bound (property)', () => {
  it.prop([
    farCamera,
    spanCells,
    farOffset,
    farOffset,
    fc.integer({ min: -MAX_MOUNTED_OFFSET_CELLS, max: MAX_MOUNTED_OFFSET_CELLS }),
  ])(
    'however far the camera pans, every mounted cell offset stays exactly representable in float32',
    (cam, span, panX, panY, mountedOffset) => {
      // Exactly what useCellTiles does across a pan: hold the anchor it had,
      // and let nextAnchor decide whether it still bounds the new camera.
      // Driving the property through nextAnchor rather than asserting against
      // a freshly computed anchor is what makes anchorHolds' drift bound
      // load-bearing here -- an anchorHolds that always returned true would
      // never re-quantise, and the pan below would carry the offset straight
      // past the cliff.
      const moved = { ...cam, offsetX: cam.offsetX + panX, offsetY: cam.offsetY + panY }
      const anchor = nextAnchor(computeAnchor(cam, span), moved, span)

      // A mounted cell's world coordinate: an integer cell somewhere between
      // the camera's own offset and the far edge of the mounted region.
      const worldX = Math.floor(moved.offsetX) + mountedOffset
      const worldY = Math.floor(moved.offsetY) + mountedOffset

      for (const px of [
        cellOffsetPx(worldX, anchor.x, moved.cellSize),
        cellOffsetPx(worldY, anchor.y, moved.cellSize),
      ]) {
        expect(Math.abs(px)).toBeLessThan(FLOAT32_EXACT_INTEGER_LIMIT)
        // The bound is the means; THIS is the end. A tile-aligned anchor and
        // an integer cell coordinate make the offset an exact integer, and an
        // integer under the cliff round trips through float32 unchanged --
        // which is what makes the compositor's matrix exact.
        expect(Math.fround(px)).toBe(px)
      }
    },
  )

  // The worst case the design argues for, pinned deterministically rather
  // than waited on: maximum drift, maximum zoom, and a cell at the far edge
  // of the widest budgeted viewport, all at once. ANCHOR_DRIFT_CELLS' own
  // comment quotes a 68x margin, which is the drift-only figure (4096 * 60 =
  // 245,760px); including the viewport and the eviction slack it is this.
  it('the worst mounted offset the design admits is still two orders of magnitude below the cliff', () => {
    const worst = cellOffsetPx(ANCHOR_DRIFT_CELLS + MAX_MOUNTED_OFFSET_CELLS, 0, MAX_CELL_SIZE)

    expect(worst).toBe((4096 + 504) * 60)
    expect(FLOAT32_EXACT_INTEGER_LIMIT / worst).toBeGreaterThan(60)
    expect(Math.fround(worst)).toBe(worst)
  })

  // Degenerate values, pinned: a cell sitting exactly on the anchor, and one
  // sitting behind it. The zero case is the one a naive implementation gets
  // right by accident and a sign-flipped one gets wrong silently -- a
  // negative offset is entirely ordinary here, since the mounted region
  // straddles the anchor on both axes.
  it.each([
    [0, 0, MAX_CELL_SIZE, 0],
    [0, 0, MIN_CELL_SIZE, 0],
    [-1, 0, MIN_CELL_SIZE, -8],
    [-4096, 0, MAX_CELL_SIZE, -245_760],
    [4096, 0, MAX_CELL_SIZE, 245_760],
  ])('cellOffsetPx(%i, %i, %i) is %i px', (worldCoordinate, anchorCoordinate, cellSize, expected) => {
    const px = cellOffsetPx(worldCoordinate, anchorCoordinate, cellSize)
    expect(px).toBe(expected)
    // Object.is, not ==: a -0 here would flow into a CSS transform string as
    // "translate(-0px, ...)". Harmless to paint, but it is the kind of value
    // that makes two structurally identical transforms compare unequal.
    expect(Object.is(px, 0)).toBe(expected === 0)
  })
})
