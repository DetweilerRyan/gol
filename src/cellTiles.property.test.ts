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
// cellLattice.property.test.ts's 'nextLattice (property)' block. Most of the
// rest was added at the architect review pass; the 'retention, not
// admission' and 'bounded wobble' describes near the bottom were specified
// at that same review but landed with the fix-tile-hysteresis policy change
// itself (coder, on the architect's explicit written delegation).

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

  // The rebuild FREQUENCY the whole cost model rests on -- the rate
  // cellTiles.ts's nextTileRange comment states as "up to twice per
  // TILE_SPAN_CELLS of travel". Nothing pinned that rate until this
  // property, and the rate itself was discovered BY this property's own
  // generator (a 0x7px viewport, cellSize 8, desynchronizes the two edges of
  // a single axis within 21 steps of ~0.34-cell travel), not modelled first
  // -- the ratified design had predicted the frequency was unchanged.
  //
  // The bound is 2x a single edge's own cadence, not 1x, because of
  // nextTileRange's retention policy: an exact-replace policy resets BOTH
  // the leading and trailing edge to `required` on every rebuild, so
  // whichever edge triggers a rebuild gives the other a free reset too, and
  // the two edges stay synchronized. Retention only tightens the edge that
  // actually failed (axisRetained leaves the other edge wherever it was, up
  // to EVICT_LAG_TILES stale), so the two desynchronize and each pays its
  // own cadence -- see this file's 'eviction hysteresis' block and
  // cellTiles.ts's axisRetained comment.
  //
  // WHY EXACTLY 2*floor(T/span) + 1, rather than a round 2x of the
  // single-edge bound. Counting the two edges separately over a pan of total
  // travel T, where A = the number of times a covering-set edge advances a
  // tile = at most floor(T/span) + 1:
  //
  //   - LEADING fires only when requiredMax passes previousMax, and each
  //     fire sets previousMax = requiredMax, so consecutive fires need >= 1
  //     advance each: at most A fires.
  //   - TRAILING fires only when requiredMin - previousMin > EVICT_LAG_TILES
  //     (= 1). The range starts as an exact cover (slack 0), so the FIRST
  //     fire needs 2 advances; each later fire restores slack to exactly 1
  //     and so needs 1 more: at most A - 1 fires.
  //   - A step where both edges fail counts as ONE rebuild, so summing the
  //     two is still an upper bound.
  //
  // Total <= A + (A - 1) = 2*floor(T/span) + 1. That derivation and an
  // independent search agree exactly: the architect's 400k-trial sweep
  // (biased toward degenerate viewports and the stepCells ~ span/2 regime
  // where the edges desynchronize hardest) found 0 violations and reached
  // the bound with EQUALITY, as did cleaner's ~2M trials plus hill-climbing
  // to 2000 steps. So this is the achievable maximum rather than a safety
  // margin, which is why the constant is stated in that exact form.
  //
  // BE HONEST ABOUT WHAT THIS CATCHES, so nobody reads the tightness above
  // as more assurance than it is. This bound is load-bearing at the 1x
  // level -- it was 1x until retention landed, and the fix genuinely broke
  // it -- and it still catches any mutant that rebuilds EAGERLY, because
  // those make rebuilds track `steps` rather than travel. Demonstrated, not
  // just argued: short-circuiting nextTileRange's `tileRangeHolds` guard so
  // it always returns a fresh object fails THIS bound in its tightened form
  // after a single generated case ("expected 2 to be less than or equal to
  // 1"). It does NOT discriminate the clamp's own bounds: the
  // architect measured four axisRetained mutants (min floor +1, max ceiling
  // -1, and a one-sided retention) at 300k trials each, and although each
  // changes the rebuild count in ~34% of trials, NONE exceeds this bound or
  // even the looser 2*(floor+1) it replaced -- because retaining less
  // re-synchronizes the two edges, which LOWERS the count. Those mutants
  // are caught by the bounded-slack and no-speculative-admission properties
  // instead. Tightening by one bought exactness, not extra detection.
  //
  // The rebuilds this adds are eviction-only, never admission: when
  // containment holds but the margin check fails, axisRetained's clamp can
  // only move the failing bound TOWARD `required` (min up, max down), so the
  // extra range-identity churn this bound permits admits zero additional
  // tiles over what a single synchronized rebuild would have. The
  // cost-model's admitted-cell rate is unaffected; only how many times the
  // (possibly-empty) strip event fires can double.
  it.prop([
    camera,
    viewportPx,
    viewportPx,
    fc.float({ min: Math.fround(-8), max: Math.fround(8), noNaN: true }),
    fc.integer({ min: 1, max: 40 }),
    fc.constantFrom<'x' | 'y'>('x', 'y'),
  ])(
    'a monotone pan rebuilds at most 2*floor(travel/TILE_SPAN_CELLS) + 1 times, the achievable maximum',
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

      expect(rebuilds).toBeLessThanOrEqual(2 * Math.floor(Math.abs(steps * stepCells) / TILE_SPAN_CELLS) + 1)
    },
  )

  // The bound above is tight, not just generous, on a SINGLE edge's own
  // cadence (the 1x floor(T/span)+1 the 2x bound is built from -- see that
  // property's comment): a pan travelling exactly one tile span per step
  // rebuilds on (almost) every step, so a mutant that rebuilt more eagerly
  // has nowhere to hide. This axis-aligned pan never desynchronizes the two
  // edges (the leading edge alone drives every rebuild here, so the 2x
  // factor never engages), which is why 10-of-10 demonstrates the 1x
  // cadence rather than the 2x ceiling. Pinned deterministically because the
  // property's own generator reaches this only by luck.
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

// The two properties specified at the architect's hysteresis-design review,
// which mechanically distinguish retention (the adopted policy) from
// admission overscan (the rejected one). Both were confirmed red against a
// deliberately broken implementation before landing -- see this commit's own
// message (the "rebuild onto a retained range instead of required exactly"
// commit) for exactly what was reverted to get each one to fail.
describe('nextTileRange retention, not admission (property)', () => {
  // Per-axis, not a 2D-set claim: a diagonal rebuild's corner tile really is
  // new (neither axis's own previous/required pair contains it alone), so
  // stating this over the whole 2D range would be false. Stated per axis,
  // it is the whole point of the design -- see cellTiles.ts's EVICT_LAG_TILES
  // and nextTileRange comments. Killing mutant: dropping the clamp's floor
  // (axisRetained's Math.max), which turns retention into unconditional
  // overscan.
  it.prop([camera, camera, viewportPx, viewportPx])(
    'never admits a bound outside the min/max of previous and required, on either axis',
    (previousCam, cam, width, height) => {
      const previous = coveringTileRange(previousCam, width, height, TILE_SPAN_CELLS)
      const required = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)
      const result = nextTileRange(previous, cam, width, height)

      expect(result.minTileX).toBeGreaterThanOrEqual(Math.min(previous.minTileX, required.minTileX))
      expect(result.maxTileX).toBeLessThanOrEqual(Math.max(previous.maxTileX, required.maxTileX))
      expect(result.minTileY).toBeGreaterThanOrEqual(Math.min(previous.minTileY, required.minTileY))
      expect(result.maxTileY).toBeLessThanOrEqual(Math.max(previous.maxTileY, required.maxTileY))
    },
  )

  // Degenerate/boundary values pinned deterministically rather than left to
  // the generator, per the pattern already used elsewhere in this file
  // (tileIndexOf/tileOriginCell's sign trap, coveringTileRange's 0x0
  // viewport): both axes, both directions.
  it.each<[string, Camera, Camera]>([
    // previous and required are FAR apart and non-overlapping on every
    // axis -- the same fixture cellTiles.test.ts's own retargeted test
    // uses. Both axes exercised, not just x.
    [
      'previous far below required on both axes',
      { offsetX: 500, offsetY: 500, cellSize: 20 },
      { offsetX: -0.1, offsetY: -0.1, cellSize: 20 },
    ],
    [
      'previous far above required on both axes',
      { offsetX: -0.1, offsetY: -0.1, cellSize: 20 },
      { offsetX: 500, offsetY: 500, cellSize: 20 },
    ],
    // previous and required are IDENTICAL: the min/max bounds collapse to a
    // single point, so this pins the boundary where >= and <= must still
    // hold as equalities, not just strict inequalities.
    [
      'previous equals required exactly',
      { offsetX: -0.1, offsetY: -0.1, cellSize: 20 },
      { offsetX: -0.1, offsetY: -0.1, cellSize: 20 },
    ],
  ])('%s', (_label, previousCam, cam) => {
    const width = 1280
    const height = 900
    const previous = coveringTileRange(previousCam, width, height, TILE_SPAN_CELLS)
    const required = coveringTileRange(cam, width, height, TILE_SPAN_CELLS)
    const result = nextTileRange(previous, cam, width, height)

    expect(result.minTileX).toBeGreaterThanOrEqual(Math.min(previous.minTileX, required.minTileX))
    expect(result.maxTileX).toBeLessThanOrEqual(Math.max(previous.maxTileX, required.maxTileX))
    expect(result.minTileY).toBeGreaterThanOrEqual(Math.min(previous.minTileY, required.minTileY))
    expect(result.maxTileY).toBeLessThanOrEqual(Math.max(previous.maxTileY, required.maxTileY))
  })
})

describe('nextTileRange bounded wobble (property)', () => {
  // Generalises the deterministic sub-cell-wobble counterexample above: ANY
  // two-position oscillation whose amplitude is at most TILE_SPAN_CELLS
  // cells on each axis rebuilds at most once, no matter how long it runs.
  // Provable from the clamp, not just observed: an offset shift of at most
  // one span moves any single floor/ceil-derived tile boundary by at most
  // one tile, which is exactly what EVICT_LAG_TILES=1 retains -- so once the
  // first rebuild (if any) has absorbed that shift, the range contains both
  // positions' covering sets and every further reversal holds. Killing
  // mutant: reverting the rebuild target from the retained union back to
  // `required` (i.e. axisRetained's clamp low/high collapsed to a single
  // value), which reintroduces the pre-fix defect this whole slice exists to
  // remove.
  //
  // The residual limit this does NOT cover -- an oscillation spanning two or
  // more tile boundaries still rebuilds once per reversal -- is disclosed,
  // not fixed; see cellTiles.ts's nextTileRange comment.
  it.prop([
    camera,
    viewportPx,
    viewportPx,
    fc.float({ min: Math.fround(-TILE_SPAN_CELLS), max: Math.fround(TILE_SPAN_CELLS), noNaN: true }),
    fc.float({ min: Math.fround(-TILE_SPAN_CELLS), max: Math.fround(TILE_SPAN_CELLS), noNaN: true }),
    fc.integer({ min: 2, max: 40 }),
  ])(
    'a two-position oscillation of amplitude <= TILE_SPAN_CELLS cells rebuilds at most once in total',
    (camA, width, height, ampX, ampY, steps) => {
      const camB: Camera = { ...camA, offsetX: camA.offsetX + ampX, offsetY: camA.offsetY + ampY }
      let range = coveringTileRange(camA, width, height, TILE_SPAN_CELLS)
      let rebuilds = 0

      for (let k = 0; k < steps; k++) {
        const cam = k % 2 === 0 ? camB : camA
        const next = nextTileRange(range, cam, width, height)
        if (next !== range) rebuilds++
        range = next
      }

      expect(rebuilds).toBeLessThanOrEqual(1)
    },
  )

  // Pinned deterministically: the amplitude EXACTLY at the TILE_SPAN_CELLS
  // boundary, on each axis independently and on both diagonally, and at the
  // 0x0 pre-measurement viewport -- edges a generator weighted toward the
  // interior of the range can miss for a long time.
  it.each<[string, number, number, number, number]>([
    ['exactly TILE_SPAN_CELLS on x only', TILE_SPAN_CELLS, 0, 1280, 900],
    ['exactly -TILE_SPAN_CELLS on x only', -TILE_SPAN_CELLS, 0, 1280, 900],
    ['exactly TILE_SPAN_CELLS on y only', 0, TILE_SPAN_CELLS, 1280, 900],
    ['exactly -TILE_SPAN_CELLS on y only', 0, -TILE_SPAN_CELLS, 1280, 900],
    ['exactly TILE_SPAN_CELLS on both axes (diagonal)', TILE_SPAN_CELLS, TILE_SPAN_CELLS, 1280, 900],
    ['exactly TILE_SPAN_CELLS on both axes, 0x0 pre-measurement viewport', TILE_SPAN_CELLS, TILE_SPAN_CELLS, 0, 0],
  ])('%s', (_label, ampX, ampY, width, height) => {
    const camA: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize: 20 }
    const camB: Camera = { ...camA, offsetX: camA.offsetX + ampX, offsetY: camA.offsetY + ampY }
    let range = coveringTileRange(camA, width, height, TILE_SPAN_CELLS)
    let rebuilds = 0

    for (let k = 0; k < 20; k++) {
      const cam = k % 2 === 0 ? camB : camA
      const next = nextTileRange(range, cam, width, height)
      if (next !== range) rebuilds++
      range = next
    }

    expect(rebuilds).toBeLessThanOrEqual(1)
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

// EVICTION HYSTERESIS, and the limit of it. The ratified design originally
// claimed a boundary wobble costs at most one rebuild on the grounds that
// "the leading edge (ceil) and trailing edge (floor) flip at least one cell
// apart, so a rebuild always lands on the momentarily-WIDER covering set".
// THAT ARGUMENT IS WRONG on its own: at a viewport width just over a whole
// number of tiles, both edges cross a tile boundary within the same
// sub-cell step, so the covering set SHIFTS instead of widening, and
// neither position's range contains the other's -- tileRangeHolds' own
// containment check cannot bound this wobble by itself.
//
// What DOES bound it is nextTileRange's retention policy (composing
// `previous` and `required` via axisRetained rather than replacing
// `previous` outright -- see cellTiles.ts). The counterexample below is the
// fix's own regression pin: the same shift that broke tileRangeHolds'
// containment argument settles to exactly one rebuild once retention
// supplies the tile of trailing-edge slack that argument was missing.
//
// The residual limit, disclosed rather than fixed: an oscillation spanning
// two or more tile boundaries still rebuilds once per reversal, because one
// tile of lag can't cover a two-tile swing. At cellSize 8.192 that's a 65px
// sweep each way -- deliberate panning, whose churn is proportional to real
// travel -- so EVICT_LAG_TILES stays 1 rather than widening to absorb it.
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

  // The counterexample to tileRangeHolds' containment check alone, and the
  // fix's own regression pin. 12.05 cells of viewport width (241px at
  // cellSize 20) puts the trailing edge a hair past three whole tiles, so
  // stepping the camera from 3.9 to 4.0 -- a TENTH of a cell -- moves the
  // covering range from tiles [0..3] to [1..4]: neither contains the other,
  // so a nextTileRange that replaced `previous` with `required` outright
  // would rebuild on every step of the oscillation. Retention doesn't: the
  // first crossing retains tile 0 as a lag tile on the trailing side (result
  // [0..4]), which then contains both [0..3] and [1..4], so every further
  // wobble across the SAME boundary holds.
  it('a sub-cell wobble rebuilds once, not on every step, once both tile edges cross together', () => {
    const low: Camera = { offsetX: 3.9, offsetY: 0, cellSize: 20 }
    const high: Camera = { ...low, offsetX: 4.0 }
    const width = 12.05 * 20

    expect(coveringTileRange(low, width, 80, TILE_SPAN_CELLS)).toMatchObject({ minTileX: 0, maxTileX: 3 })
    expect(coveringTileRange(high, width, 80, TILE_SPAN_CELLS)).toMatchObject({ minTileX: 1, maxTileX: 4 })

    const start = coveringTileRange(low, width, 80, TILE_SPAN_CELLS)
    expect(stepThrough(start, [high, low, high, low], width, 80)).toBe(1)
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
