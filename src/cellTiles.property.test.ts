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

// THE WOBBLE BOUND, AND THE FLOAT BOUNDARY IT IS NOT ALLOWED TO CLAIM. Two
// separate statements live here, and keeping them apart is the whole
// correction this block carries (qa blocked the slice on the old version;
// this is that finding's fix):
//
//   THE THEOREM, over the REALS: an offset shift of at most one tile span
//   moves any single floor/ceil-derived tile boundary by at most one tile,
//   which is exactly what EVICT_LAG_TILES = 1 retains -- so once the first
//   rebuild has absorbed that shift, the range contains both positions'
//   covering sets and every further reversal holds.
//
//   WHAT THE CODE ACTUALLY RUNS ON: doubles. This property used to state its
//   precondition on the REQUESTED float amplitude (|amp| <= TILE_SPAN_CELLS)
//   while the loop drove nextTileRange with the REALIZED offset
//   `camA.offsetX + ampX` -- and that addition rounds. At an offset within
//   half an ulp below a tile boundary the sum lands exactly ON the next
//   boundary, so Math.floor jumps TWO tile indices rather than one:
//   floor(-Number.MIN_VALUE) is -1 but floor(-Number.MIN_VALUE + 4) is 4, a
//   five-cell shift. The theorem is untouched -- the exact amplitude there
//   is 4 + 5e-324, genuinely MORE than one span, so it lands in the
//   >= 2-boundary residual cellTiles.ts already discloses. The TEST was the
//   thing asserting more than the design guarantees, and it failed ~13% of
//   runs of this file (measured: 9 of 60) because fc.float biases hard
//   toward both subnormals and range extremes and so hits that conjunction
//   often. A single green run is what let it through.
//
// So the precondition is now stated where it can be checked EXACTLY -- on
// the realized covering sets, which are integers -- rather than on a float
// amplitude, and as an EQUIVALENCE rather than an implication. That makes
// the degenerate band an ASSERTED case of this property rather than one
// filtered out of it: the arbitraries below are unchanged and still generate
// it, the reverse direction states what it must do, and the 'float boundary'
// rows below pin it deterministically on both axes and both signs, per this
// repo's pin-the-edge-values convention.
describe('nextTileRange bounded wobble (property)', () => {
  // The largest per-bound gap between two covering sets, in tiles. Tile
  // indices are integers, so unlike the float amplitude this replaces, this
  // quantity is exact -- which is the entire point of restating the
  // precondition in terms of it.
  const maxBoundShiftTiles = (a: TileRange, b: TileRange) =>
    Math.max(
      Math.abs(b.minTileX - a.minTileX),
      Math.abs(b.maxTileX - a.maxTileX),
      Math.abs(b.minTileY - a.minTileY),
      Math.abs(b.maxTileY - a.maxTileY),
    )

  // camB FIRST, and that ordering is load-bearing rather than incidental --
  // see the reverse direction in the property's comment below. Flipping it
  // to camA-first makes the reverse direction false at steps = 2 and this
  // property flaky again in a brand new way (measured: 8,158 of 32,632
  // band cases drop to a single rebuild under camA-first).
  const oscillationRebuilds = (camA: Camera, camB: Camera, width: number, height: number, steps: number) => {
    let range = coveringTileRange(camA, width, height, TILE_SPAN_CELLS)
    let rebuilds = 0

    for (let k = 0; k < steps; k++) {
      const next = nextTileRange(range, k % 2 === 0 ? camB : camA, width, height)
      if (next !== range) rebuilds++
      range = next
    }

    return rebuilds
  }

  // FORWARD direction (rebuilds <= 1 when the two covering sets sit within
  // EVICT_LAG_TILES on every bound) is the design guarantee this whole slice
  // exists to deliver, and it is where this block's detection lives.
  //
  // REVERSE direction (a bound shifted two or more tiles really does rebuild
  // at least twice) is what makes this an EQUIVALENCE, and it is why the
  // degenerate band can stay inside the property instead of being filtered
  // out of it. It is a theorem of the clamp rather than an observation: the
  // loop starts from an EXACT cover of camA, so any bound of camB's covering
  // set sitting >= 2 tiles away either breaks containment or exceeds the
  // slack tolerance, and step 0 rebuilds; that rebuild retains at most
  // EVICT_LAG_TILES = 1 tile of the gap, so camA is still out of tolerance
  // at step 1 and rebuilds again. Checked at over 80,000 genuine >= 2-tile
  // cases across three sweeps (structured band offsets over tile boundaries
  // -2000..2000 x cellSize 8..60 x viewports including 0x0 and 4000x4000 x
  // both axes x both signs, plus an independent randomized one): zero
  // violations, and every case rebuilt on EVERY step rather than merely
  // twice.
  //
  // WHAT THIS ACTUALLY CATCHES, measured against five hand-built mutants
  // rather than asserted -- stated here because a property nobody has seen
  // fail is documentation, and because the sibling monotone-pan bound above
  // had to make the opposite admission:
  //
  //   - Rebuilding onto `required` exactly (the pre-fix policy this slice
  //     removed): RED here, and red on all six guaranteed-regime rows below.
  //     The 'eviction hysteresis' block's sub-cell-wobble test also catches
  //     it; the bounded-slack and no-speculative-admission properties do not.
  //   - One-sided retention (axisRetained's max clamp collapsed to
  //     `requiredMax`): RED here, and on the two -span rows below. NOTHING
  //     ELSE IN THIS FILE CATCHES IT -- this is the property's own unique
  //     kill, and the reason it earns its place rather than restating the
  //     bounded-slack property in other words.
  //   - Dropping axisRetained's clamp floor (retention -> unconditional
  //     overscan): RED here, and also caught by no-speculative-admission.
  //   - Never returning `previous` by reference: RED here, and caught by
  //     four other blocks -- not this property's to claim.
  //   - Dropping axisHolds' max-side containment check: caught by
  //     bounded-slack and by the two ceil-edge 'float boundary' rows below;
  //     the property itself stays green, so the pins are load-bearing here
  //     and not merely illustrative.
  it.prop([
    camera,
    viewportPx,
    viewportPx,
    fc.float({ min: Math.fround(-TILE_SPAN_CELLS), max: Math.fround(TILE_SPAN_CELLS), noNaN: true }),
    fc.float({ min: Math.fround(-TILE_SPAN_CELLS), max: Math.fround(TILE_SPAN_CELLS), noNaN: true }),
    fc.integer({ min: 2, max: 40 }),
  ])(
    'a two-position oscillation rebuilds at most once exactly when the two covering sets sit within EVICT_LAG_TILES on every bound',
    (camA, width, height, ampX, ampY, steps) => {
      const camB: Camera = { ...camA, offsetX: camA.offsetX + ampX, offsetY: camA.offsetY + ampY }
      const rebuilds = oscillationRebuilds(camA, camB, width, height, steps)

      const withinLag =
        maxBoundShiftTiles(
          coveringTileRange(camA, width, height, TILE_SPAN_CELLS),
          coveringTileRange(camB, width, height, TILE_SPAN_CELLS),
        ) <= EVICT_LAG_TILES

      expect(rebuilds <= 1).toBe(withinLag)
    },
  )

  // The GUARANTEED regime, pinned deterministically: an amplitude exactly at
  // the TILE_SPAN_CELLS boundary -- the edge between the guarantee and the
  // residual -- on each axis independently, on both signs, diagonally, and at
  // the 0x0 pre-measurement viewport. offsetX/offsetY of -0.1 is chosen
  // deliberately: a mid-cell phase, far enough from any tile boundary that
  // adding a span rounds exactly, so these rows exercise the real-arithmetic
  // theorem rather than the float band the next block pins.
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

    expect(
      maxBoundShiftTiles(
        coveringTileRange(camA, width, height, TILE_SPAN_CELLS),
        coveringTileRange(camB, width, height, TILE_SPAN_CELLS),
      ),
    ).toBeLessThanOrEqual(EVICT_LAG_TILES)
    expect(oscillationRebuilds(camA, camB, width, height, 20)).toBeLessThanOrEqual(1)
  })

  // THE FLOAT BOUNDARY, pinned deterministically -- the band that made this
  // block 13% flaky, now asserted on rather than generated by luck. Each row
  // REQUESTS an amplitude of exactly one tile span and REALIZES a two-tile
  // shift, because `camA.offset + amp` rounds onto the boundary exactly; in
  // exact arithmetic the amplitude is a hair over one span, so these are the
  // >= 2-boundary residual (cellTiles.ts's nextTileRange comment), not a
  // defect. qa swept phase 0-32px x amplitude {1,2,3,5,8}px through the real
  // UI and found zero sustained churn, so this is unreachable by a user: an
  // ulp-wide band cannot be landed on by a pointer.
  //
  // Two things each row asserts, deliberately both: that the shift really is
  // two tiles (the mechanism -- otherwise a future rounding change could
  // quietly move the row out of the band and leave it passing for the wrong
  // reason), and that the oscillation therefore rebuilds on EVERY step
  // rather than merely twice, which is the residual's actual cost.
  //
  // Note the two families differ in WHICH edge rounds. The +span rows are
  // the floor-derived leading edge (Math.floor rounds toward -infinity, so
  // rounding UP onto a multiple crosses a tile boundary and rounding DOWN
  // onto one does not -- which is why a positive amplitude from just BELOW a
  // boundary is degenerate and its mirror image is not). The -span rows are
  // the ceil-derived trailing edge, so they depend on the viewport as well
  // as the offset: the x row below is not degenerate at a 0x0 viewport, and
  // its y twin needs the viewport transposed too.
  it.each<[string, Camera, number, number, number, number]>([
    [
      '+span from the largest double below tile boundary 0, on x',
      { offsetX: -Number.MIN_VALUE, offsetY: -0.1, cellSize: 20 },
      TILE_SPAN_CELLS,
      0,
      1280,
      900,
    ],
    [
      '+span from the largest double below tile boundary 0, on y',
      { offsetX: -0.1, offsetY: -Number.MIN_VALUE, cellSize: 20 },
      0,
      TILE_SPAN_CELLS,
      1280,
      900,
    ],
    [
      '+span from just below cell 4: the band sits at EVERY tile boundary, not only 0',
      { offsetX: 3.9999999999999996, offsetY: -0.1, cellSize: 20 },
      TILE_SPAN_CELLS,
      0,
      1280,
      900,
    ],
    [
      '-span at the ceil-derived trailing edge, on x',
      { offsetX: -63.99999999999999, offsetY: -0.1, cellSize: 20 },
      -TILE_SPAN_CELLS,
      0,
      1280,
      900,
    ],
    [
      '-span at the ceil-derived trailing edge, on y (viewport transposed with it)',
      { offsetX: -0.1, offsetY: -63.99999999999999, cellSize: 20 },
      0,
      -TILE_SPAN_CELLS,
      900,
      1280,
    ],
    [
      '+span diagonally, at the 0x0 pre-measurement viewport',
      { offsetX: -Number.MIN_VALUE, offsetY: -Number.MIN_VALUE, cellSize: 20 },
      TILE_SPAN_CELLS,
      TILE_SPAN_CELLS,
      0,
      0,
    ],
  ])('the float boundary: %s', (_label, camA, ampX, ampY, width, height) => {
    const camB: Camera = { ...camA, offsetX: camA.offsetX + ampX, offsetY: camA.offsetY + ampY }

    expect(
      maxBoundShiftTiles(
        coveringTileRange(camA, width, height, TILE_SPAN_CELLS),
        coveringTileRange(camB, width, height, TILE_SPAN_CELLS),
      ),
    ).toBe(2)
    expect(oscillationRebuilds(camA, camB, width, height, 20)).toBe(20)
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
// The residual limit, disclosed rather than fixed: an oscillation whose
// REALIZED tile indices swing two or more tiles still rebuilds once per
// reversal, because one tile of lag can't cover a two-tile swing. At
// cellSize 8.192 that's a 65px sweep each way -- deliberate panning, whose
// churn is proportional to real travel -- so EVICT_LAG_TILES stays 1 rather
// than widening to absorb it. "Realized" is load-bearing there: float
// rounding puts an amplitude of exactly one span into this same residual
// whenever the offset sits within half an ulp below a tile boundary, which
// is what the bounded-wobble block's 'float boundary' rows pin.
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
