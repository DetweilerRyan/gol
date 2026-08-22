import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { coveringTileRange, EVICT_LAG_TILES, nextTileRange, tileRangeHolds, TILE_SPAN_CELLS } from './cellTiles'
import { cameraArbitrary as camera } from './test-support/arbitraries'

// Only the two contracts the ratified tile-virtualized-cells design (§4/§5,
// step 1) calls load-bearing enough to land before any consumer exists: the
// no-infinite-loop guarantee behind useCellTiles' setState-during-render
// pattern (step 3). Every other property for this module (the no-hole
// containment guarantee, bounded hysteresis, tileRangeCellCount monotonicity,
// tileIndexOf/tileOriginCell round-tripping) is architect's, at its review
// pass -- see cellLattice.property.test.ts for the lattice-side precedent
// these two are ported from ('nextLattice (property)' describe block).

const viewportPx = fc.integer({ min: 0, max: 4000 })

describe('nextTileRange (property)', () => {
  it.prop([camera, camera, viewportPx, viewportPx])(
    'keeps the previous range by reference exactly when it still holds, and never otherwise',
    (previousCam, cam, width, height) => {
      const previous = coveringTileRange(previousCam, width, height, TILE_SPAN_CELLS)
      const required = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)

      expect(nextTileRange(previous, cam, width, height) === previous).toBe(
        tileRangeHolds(previous, required, EVICT_LAG_TILES),
      )
    },
  )

  it.prop([camera, camera, viewportPx, viewportPx])(
    'is idempotent BY REFERENCE -- applying it to its own result cannot rebuild again, so useCellTiles cannot loop',
    (previousCam, cam, width, height) => {
      const previous = coveringTileRange(previousCam, width, height, TILE_SPAN_CELLS)
      const first = nextTileRange(previous, cam, width, height)
      expect(nextTileRange(first, cam, width, height)).toBe(first)
    },
  )
})
