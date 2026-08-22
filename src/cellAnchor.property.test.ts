import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { MAX_CELL_SIZE, MIN_CELL_SIZE, worldToScreen, type Camera } from './camera'
import { ANCHOR_DRIFT_CELLS, anchorHolds, anchorOffsetPx, cellOffsetPx, computeAnchor, nextAnchor } from './cellAnchor'
import { cameraArbitrary as camera } from './test-support/arbitraries'

// Only the three contracts the ratified tile-virtualized-cells design (§4/§5,
// step 2) calls load-bearing enough to land before any consumer exists: the
// worldToScreen round trip (ported from cellLattice.property.test.ts's "slot
// placement" describe block) and the same two no-infinite-loop stickiness
// contracts cellTiles.property.test.ts ports for nextTileRange (reference
// identity, idempotence) -- here for nextAnchor instead. Every other property
// for this module (the precision bound |cellOffsetPx| < 2**24, degenerate
// ANCHOR_DRIFT_CELLS/MAX_CELL_SIZE combinations) is architect's, at its
// review pass -- see the design document's §7.

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
