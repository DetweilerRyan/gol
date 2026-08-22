import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { screenToWorld, type Camera } from './camera'
import {
  coveringTileRange,
  EVICT_LAG_TILES,
  nextTileRange,
  tileIndexOf,
  tileOriginCell,
  tileRangeCellCount,
  tileRangeHolds,
  TILE_SPAN_CELLS,
  type TileRange,
} from './cellTiles'
import { cameraArbitrary as camera } from './test-support/arbitraries'

// The first two properties (reference identity, idempotence) landed with the
// module in step 1 -- they are the no-infinite-loop guarantee behind
// useCellTiles' setState-during-render pattern, and were ported forward from
// cellLattice.property.test.ts's 'nextLattice (property)' block. Everything
// below them was added at the architect review pass.

const viewportPx = fc.integer({ min: 0, max: 4000 })
const spanCellsArbitrary = fc.integer({ min: 1, max: 16 })

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

describe('nextTileRange coverage and slack (property)', () => {
  // The no-hole guarantee and the mounted-count guard, stated together
  // because they are the two halves of one contract: the range must never be
  // SMALLER than the covering set (a hole is a viewport region with no
  // mounted cells at all -- an invisible, unclickable band at the leading
  // edge), and never LARGER than it by more than EVICT_LAG_TILES per side
  // (which is what bounds the mounted-cell count at the four-sided 37,296 of
  // cellTiles.test.ts, rather than letting a long pan accumulate slack).
  it.prop([camera, camera, viewportPx, viewportPx])(
    'always contains the covering set and never exceeds it by more than EVICT_LAG_TILES on any side',
    (previousCam, cam, width, height) => {
      const previous = coveringTileRange(previousCam, width, height, TILE_SPAN_CELLS)
      const result = nextTileRange(previous, cam, width, height)
      const required = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)

      // No hole, on all four sides.
      expect(result.minTileX).toBeLessThanOrEqual(required.minTileX)
      expect(result.minTileY).toBeLessThanOrEqual(required.minTileY)
      expect(result.maxTileX).toBeGreaterThanOrEqual(required.maxTileX)
      expect(result.maxTileY).toBeGreaterThanOrEqual(required.maxTileY)

      // Bounded slack, on all four sides.
      expect(required.minTileX - result.minTileX).toBeLessThanOrEqual(EVICT_LAG_TILES)
      expect(required.minTileY - result.minTileY).toBeLessThanOrEqual(EVICT_LAG_TILES)
      expect(result.maxTileX - required.maxTileX).toBeLessThanOrEqual(EVICT_LAG_TILES)
      expect(result.maxTileY - required.maxTileY).toBeLessThanOrEqual(EVICT_LAG_TILES)
    },
  )

  // The rebuild FREQUENCY the whole cost model rests on. cellTiles.ts's
  // header prices a pan as "one strip event per TILE_SPAN_CELLS cells of
  // travel"; nothing pinned that rate until this property. A monotone pan of
  // T cells rebuilds at most floor(T / spanCells) + 1 times -- the +1 is the
  // first crossing, which can land arbitrarily soon after the start
  // depending on where in its tile the camera began.
  it.prop([
    camera,
    viewportPx,
    viewportPx,
    fc.float({ min: Math.fround(-8), max: Math.fround(8), noNaN: true }),
    fc.integer({ min: 1, max: 40 }),
    fc.constantFrom<'x' | 'y'>('x', 'y'),
  ])(
    'a monotone pan rebuilds at most once per TILE_SPAN_CELLS cells of travel',
    (cam, width, height, stepCells, steps, axis) => {
      let range = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)
      let rebuilds = 0

      for (let k = 1; k <= steps; k++) {
        const travelled = k * stepCells
        const moved: Camera =
          axis === 'x' ? { ...cam, offsetX: cam.offsetX + travelled } : { ...cam, offsetY: cam.offsetY + travelled }
        const next = nextTileRange(range, moved, width, height)
        if (next !== range) rebuilds++
        range = next
      }

      expect(rebuilds).toBeLessThanOrEqual(Math.floor(Math.abs(steps * stepCells) / TILE_SPAN_CELLS) + 1)
    },
  )

  // The bound above is tight rather than generous: a pan travelling exactly
  // one tile span per step rebuilds on (almost) every step, so a mutant that
  // rebuilt more eagerly has nowhere to hide. Pinned deterministically
  // because the property's own generator reaches this only by luck.
  it('and that bound is tight: a pan of exactly TILE_SPAN_CELLS per step rebuilds on nearly every step', () => {
    const cam: Camera = { offsetX: 0, offsetY: 0, cellSize: 20 }
    let range = coveringTileRange(cam, 160, 160, TILE_SPAN_CELLS)
    let rebuilds = 0

    for (let k = 1; k <= 10; k++) {
      const moved: Camera = { ...cam, offsetX: cam.offsetX + k * TILE_SPAN_CELLS }
      const next = nextTileRange(range, moved, 160, 160)
      if (next !== range) rebuilds++
      range = next
    }

    expect(rebuilds).toBe(10)
  })
})

describe('coveringTileRange (property)', () => {
  // The independent cross-check the two properties above cannot make: they
  // compare nextTileRange against coveringTileRange, so a coveringTileRange
  // that is systematically wrong satisfies both. This one ties the mounted
  // set back to screenToWorld -- the SAME function useGridPointerGestures
  // resolves a tap with -- so it states the user-facing invariant directly:
  // every cell you can click on is a cell that is mounted.
  it.prop([camera, viewportPx, viewportPx, spanCellsArbitrary])(
    'mounts every world cell screenToWorld can resolve inside the viewport, wasting less than one tile per side',
    (cam, width, height, spanCells) => {
      const range = coveringTileRange(cam, width, height, spanCells)

      // The two extreme viewport pixels. Math.max(0, ...) keeps the
      // degenerate 0x0 viewport (Grid's pre-measurement render) meaningful
      // rather than sampling a negative pixel.
      const first = screenToWorld(cam, 0, 0)
      const last = screenToWorld(cam, Math.max(0, width - 1), Math.max(0, height - 1))

      const leftEdge = tileOriginCell(range.minTileX, spanCells)
      const topEdge = tileOriginCell(range.minTileY, spanCells)
      const rightEdge = tileOriginCell(range.maxTileX + 1, spanCells) - 1
      const bottomEdge = tileOriginCell(range.maxTileY + 1, spanCells) - 1

      expect(leftEdge).toBeLessThanOrEqual(first.x)
      expect(topEdge).toBeLessThanOrEqual(first.y)
      expect(rightEdge).toBeGreaterThanOrEqual(last.x)
      expect(bottomEdge).toBeGreaterThanOrEqual(last.y)

      // Waste: strictly under a tile on the leading side (tileIndexOf's own
      // quantization), and at most a full tile on the trailing side, where
      // coveringTileRange's ceil() edge can sit one cell past the last pixel
      // screenToWorld samples.
      expect(first.x - leftEdge).toBeLessThan(spanCells)
      expect(first.y - topEdge).toBeLessThan(spanCells)
      expect(rightEdge - last.x).toBeLessThanOrEqual(spanCells)
      expect(bottomEdge - last.y).toBeLessThanOrEqual(spanCells)
    },
  )

  it.prop([camera, viewportPx, viewportPx, viewportPx, viewportPx])(
    'is monotone in viewport size: a larger viewport mounts a superset of tiles, never fewer cells',
    (cam, width, height, extraWidth, extraHeight) => {
      const small = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)
      const large = coveringTileRange(cam, width + extraWidth, height + extraHeight, TILE_SPAN_CELLS)

      expect(large.minTileX).toBeLessThanOrEqual(small.minTileX)
      expect(large.minTileY).toBeLessThanOrEqual(small.minTileY)
      expect(large.maxTileX).toBeGreaterThanOrEqual(small.maxTileX)
      expect(large.maxTileY).toBeGreaterThanOrEqual(small.maxTileY)
      expect(tileRangeCellCount(large)).toBeGreaterThanOrEqual(tileRangeCellCount(small))
    },
  )

  // Degenerate viewport, pinned rather than left to the generator: Grid
  // renders once at containerSize {0, 0} before its ResizeObserver fires, and
  // coveringTileRange's Math.max clamp is the only thing stopping that render
  // from inverting into an empty (or negative-extent) range. Grid.test.tsx's
  // "renders a small cell grid immediately on mount" depends on this.
  it('a 0x0 viewport still mounts exactly the one tile containing the camera origin', () => {
    const range = coveringTileRange({ offsetX: 0, offsetY: 0, cellSize: 20 }, 0, 0, TILE_SPAN_CELLS)

    expect(range).toEqual({ minTileX: 0, maxTileX: 0, minTileY: 0, maxTileY: 0, spanCells: TILE_SPAN_CELLS })
    expect(tileRangeCellCount(range)).toBe(TILE_SPAN_CELLS * TILE_SPAN_CELLS)
  })
})

describe('tileIndexOf / tileOriginCell (property)', () => {
  it.prop([fc.integer({ min: -100_000, max: 100_000 }), spanCellsArbitrary])(
    'round trip: a world cell sits inside its own tile, and a tile origin maps back to that tile',
    (worldCoordinate, spanCells) => {
      const tile = tileIndexOf(worldCoordinate, spanCells)
      const origin = tileOriginCell(tile, spanCells)

      expect(origin).toBeLessThanOrEqual(worldCoordinate)
      expect(worldCoordinate).toBeLessThan(origin + spanCells)
      expect(tileIndexOf(origin, spanCells)).toBe(tile)
    },
  )

  // The Math.floor sign trap, pinned deterministically: Math.trunc (or a
  // plain `| 0`) agrees with Math.floor on every non-negative coordinate, so
  // a generator weighted anywhere near zero can run green for a long time
  // against an implementation that puts world cell -1 in tile 0 -- which
  // would make tiles 0 and -1 both claim it and mount it twice.
  it.each([
    [0, 0, 0],
    [3, 0, 0],
    [4, 1, 4],
    [-1, -1, -4],
    [-4, -1, -4],
    [-5, -2, -8],
    [-8, -2, -8],
  ])('world cell %i is in tile %i, whose origin cell is %i', (worldCoordinate, tile, origin) => {
    expect(tileIndexOf(worldCoordinate, TILE_SPAN_CELLS)).toBe(tile)
    expect(tileOriginCell(tile, TILE_SPAN_CELLS)).toBe(origin)
  })
})

// EVICTION HYSTERESIS, and the limit of it. The ratified design claimed a
// boundary wobble costs at most one rebuild, arguing that "the leading edge
// (ceil) and trailing edge (floor) flip at least one cell apart, so a rebuild
// always lands on the momentarily-WIDER covering set". THAT ARGUMENT IS
// WRONG, and the counterexample below is the proof: at a viewport width just
// over a whole number of tiles, both edges cross a tile boundary within the
// same sub-cell step, so the covering set SHIFTS instead of widening, and
// neither position's range contains the other's. What is actually true --
// and what the properties above pin -- is the one-sided statement:
// nextTileRange tolerates `previous` being WIDER than required (up to
// EVICT_LAG_TILES per side), and can never tolerate it being narrower,
// because a narrower range is a hole. So hysteresis protects the TRAILING
// edge only.
//
// Left as a disclosed limit rather than fixed, deliberately. The cost of the
// thrash is one strip event per pointermove -- the same order as an ordinary
// pan's own cost, and still ~60x cheaper than the full-lattice rebase this
// slice replaced -- and the escape hatch, if the perf run ever shows it, is a
// three-line change with no new constant: rebuild onto `previous` clamped to
// within EVICT_LAG_TILES of `required` (i.e. keep the old trailing edge where
// the tolerance allows) instead of onto `required` exactly. That keeps every
// bound the properties above assert, at the cost of carrying one tile of lag
// through an ordinary pan rather than only after a reversal.
describe('eviction hysteresis (deterministic -- the wobble cases the generator will not find)', () => {
  const stepThrough = (start: TileRange, cameras: readonly Camera[], width: number, height: number) => {
    let range = start
    let rebuilds = 0
    for (const cam of cameras) {
      const next = nextTileRange(range, cam, width, height)
      if (next !== range) rebuilds++
      range = next
    }
    return rebuilds
  }

  // The PRODUCTION default camera, and the coincidence coder found while
  // writing useCellTiles.test.ts: -32 + 1280/20 = 32 is exactly 8 whole
  // tiles, so the viewport's trailing edge sits precisely on a tile boundary
  // and ANY positive x pan immediately grows the covering set by a tile. This
  // is the case a reader is most likely to reach for as "a small pan that
  // stays put", and it is the one camera where that is false -- hence
  // useCellTiles.test.ts using -30 for its within-hysteresis fixture. The
  // second half is the part that still holds: once that first rebuild has
  // happened, wobbling back and forth across the same boundary costs nothing
  // further.
  it('the default camera sits exactly on a tile boundary: the first pan rebuilds, and then it settles', () => {
    const settled: Camera = { offsetX: -32, offsetY: -22.5, cellSize: 20 }
    const nudged: Camera = { ...settled, offsetX: -31.9 }
    const start = coveringTileRange(settled, 1280, 900, TILE_SPAN_CELLS)

    expect(nextTileRange(start, nudged, 1280, 900)).not.toBe(start)
    // ...and once, not once per wobble.
    expect(stepThrough(start, [nudged, settled, nudged, settled, nudged], 1280, 900)).toBe(1)
  })

  // The counterexample to the design's own claim, above. 12.05 cells of
  // viewport width (241px at cellSize 20) puts the trailing edge a hair past
  // three whole tiles, so stepping the camera from 3.9 to 4.0 -- a TENTH of a
  // cell -- moves the covering range from tiles [0..3] to [1..4]: neither
  // contains the other, so every step of the oscillation rebuilds.
  it('a sub-cell wobble CAN rebuild on every step, when both tile edges cross together', () => {
    const low: Camera = { offsetX: 3.9, offsetY: 0, cellSize: 20 }
    const high: Camera = { ...low, offsetX: 4.0 }
    const width = 12.05 * 20

    expect(coveringTileRange(low, width, 80, TILE_SPAN_CELLS)).toMatchObject({ minTileX: 0, maxTileX: 3 })
    expect(coveringTileRange(high, width, 80, TILE_SPAN_CELLS)).toMatchObject({ minTileX: 1, maxTileX: 4 })

    const start = coveringTileRange(low, width, 80, TILE_SPAN_CELLS)
    expect(stepThrough(start, [high, low, high, low], width, 80)).toBe(4)
  })

  // The zoom contract, which nextTileRange deliberately drops from what
  // cellLattice.ts guaranteed: the lattice ALWAYS rebased on a cellSize
  // change (slot pixel positions were cellSize-scaled), whereas a TileRange
  // stores no cellSize at all, so a small zoom-in that shrinks the covering
  // set inside the eviction tolerance keeps the range untouched. That is
  // correct -- tile MOUNTING is world-anchored, and pixel scaling reaches the
  // DOM through Cell's own cellSize prop, not through the range -- but it is
  // a real behavioural difference from the module this replaced, so all three
  // directions are pinned here rather than left as prose.
  it.each([
    ['a one-pixel zoom-in stays inside the eviction tolerance and keeps the range', 21, true],
    ['a deep zoom-in shrinks the covering set past the tolerance and rebuilds', 60, false],
    ['any zoom-out grows the covering set past containment and rebuilds', 8, false],
  ])('%s', (_label, cellSize, retained) => {
    const cam: Camera = { offsetX: -30, offsetY: -22.5, cellSize: 20 }
    const start = coveringTileRange(cam, 1280, 900, TILE_SPAN_CELLS)
    const zoomed: Camera = { ...cam, cellSize }

    expect(nextTileRange(start, zoomed, 1280, 900) === start).toBe(retained)
  })
})
