import { describe, expect, it } from 'vitest'
import type { Camera } from './camera'
import {
  coveringTileRange,
  enteringStripCellCount,
  EVICT_LAG_TILES,
  nextTileRange,
  tileIndexOf,
  tileKey,
  tileOriginCell,
  TILE_SPAN_CELLS,
  tileRangeCellCount,
  tileRangeHolds,
  type TileRange,
} from './cellTiles'

describe('tileIndexOf', () => {
  it('floors toward negative infinity, matching cellKey/slotWorldCoordinate elsewhere', () => {
    expect(tileIndexOf(0, 4)).toBe(0)
    expect(tileIndexOf(3, 4)).toBe(0)
    expect(tileIndexOf(4, 4)).toBe(1)
    expect(tileIndexOf(-1, 4)).toBe(-1)
    expect(tileIndexOf(-4, 4)).toBe(-1)
    expect(tileIndexOf(-5, 4)).toBe(-2)
  })
})

describe('tileOriginCell', () => {
  it('is the inverse of tileIndexOf at a tile boundary', () => {
    expect(tileOriginCell(0, 4)).toBe(0)
    expect(tileOriginCell(1, 4)).toBe(4)
    expect(tileOriginCell(-1, 4)).toBe(-4)
    expect(tileIndexOf(tileOriginCell(7, 4), 4)).toBe(7)
  })
})

describe('tileKey', () => {
  it('matches the "x,y" convention gameOfLife.ts\'s cellKey already uses', () => {
    expect(tileKey(3, -2)).toBe('3,-2')
  })

  it('gives distinct keys to distinct tile coordinates', () => {
    expect(tileKey(1, 2)).not.toBe(tileKey(2, 1))
  })
})

describe('coveringTileRange', () => {
  it('never inverts for a 0x0 pre-measurement viewport', () => {
    const range = coveringTileRange({ offsetX: 0, offsetY: 0, cellSize: 20 }, 0, 0, TILE_SPAN_CELLS)
    expect(range.minTileX).toBeLessThanOrEqual(range.maxTileX)
    expect(range.minTileY).toBeLessThanOrEqual(range.maxTileY)
    // Cell (0, 0) must be inside the covering range, matching
    // Grid.test.tsx's "renders a small cell grid immediately on mount".
    expect(range.minTileX).toBeLessThanOrEqual(tileIndexOf(0, TILE_SPAN_CELLS))
    expect(range.maxTileX).toBeGreaterThanOrEqual(tileIndexOf(0, TILE_SPAN_CELLS))
  })
})

describe('tileRangeHolds', () => {
  const required: TileRange = { minTileX: 0, maxTileX: 5, minTileY: 0, maxTileY: 5, spanCells: 4 }

  it('holds when previous equals required (zero margin)', () => {
    expect(tileRangeHolds(required, required, EVICT_LAG_TILES)).toBe(true)
  })

  it('holds when previous exceeds required by exactly the lag tolerance on one side', () => {
    const previous: TileRange = { ...required, minTileX: -1 }
    expect(tileRangeHolds(previous, required, EVICT_LAG_TILES)).toBe(true)
  })

  it('rebuilds when previous exceeds the lag tolerance on one side', () => {
    const previous: TileRange = { ...required, minTileX: -2 }
    expect(tileRangeHolds(previous, required, EVICT_LAG_TILES)).toBe(false)
  })

  it('rebuilds when previous no longer contains required at all (a hole in the viewport)', () => {
    const previous: TileRange = { ...required, maxTileX: 4 }
    expect(tileRangeHolds(previous, required, EVICT_LAG_TILES)).toBe(false)
  })

  it('rebuilds when previous no longer contains required on the leading (min) side', () => {
    // The above case is a hole on the trailing (max) side only; this pins the
    // other side of axisHolds's containment check, which the trailing-side
    // case alone leaves unexercised.
    const previous: TileRange = { ...required, minTileX: 1 }
    expect(tileRangeHolds(previous, required, EVICT_LAG_TILES)).toBe(false)
  })

  it('rebuilds when previous exceeds the lag tolerance on the trailing (max) side, with the leading side exact', () => {
    // The lag-tolerance test above varies only the leading (min) side; this
    // pins the trailing side of the same check with the leading side held at
    // zero margin, so the two conditions can't be satisfied by coincidence.
    const previous: TileRange = { ...required, maxTileX: 7 }
    expect(tileRangeHolds(previous, required, EVICT_LAG_TILES)).toBe(false)
  })
})

describe('nextTileRange', () => {
  const camera: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize: 20 }

  it('rebuilds onto exactly the covering set when there is no previous coverage', () => {
    const previous = coveringTileRange({ offsetX: 500, offsetY: 500, cellSize: 20 }, 1280, 900, TILE_SPAN_CELLS)
    const next = nextTileRange(previous, camera, 1280, 900)
    expect(next).toEqual(coveringTileRange(camera, 1280, 900, TILE_SPAN_CELLS))
  })

  it('keeps the previous range by reference exactly when it still holds', () => {
    const previous = coveringTileRange(camera, 1280, 900, TILE_SPAN_CELLS)
    // A sub-cell pan too small to move any tile boundary: still holds.
    const next = nextTileRange(previous, { ...camera, offsetX: camera.offsetX + 0.01 }, 1280, 900)
    expect(next).toBe(previous)
  })
})

describe('tileRangeCellCount / enteringStripCellCount', () => {
  const range: TileRange = { minTileX: 0, maxTileX: 2, minTileY: 0, maxTileY: 1, spanCells: 4 }

  it('multiplies tile counts by spanCells on each axis', () => {
    // 3 tiles wide, 2 tiles tall, 4 cells per tile side -> 12 x 8 cells.
    expect(tileRangeCellCount(range)).toBe(12 * 8)
  })

  it('an entering x-strip is one tile wide and spans the full mounted height', () => {
    expect(enteringStripCellCount(range, 'x')).toBe(4 * 8)
  })

  it('an entering y-strip is one tile tall and spans the full mounted width', () => {
    expect(enteringStripCellCount(range, 'y')).toBe(4 * 12)
  })

  it('subtracts tile bounds rather than adding them, for a range not anchored at tile 0', () => {
    // `range` above has minTileX/minTileY at 0, where maxTileX - minTileX and
    // maxTileX + minTileX coincide -- too weak to distinguish the two. This
    // range is offset so they diverge: 5 tiles wide (1..5), 3 tiles tall
    // (2..4).
    const offsetRange: TileRange = { minTileX: 1, maxTileX: 5, minTileY: 2, maxTileY: 4, spanCells: 4 }
    expect(enteringStripCellCount(offsetRange, 'y')).toBe(5 * 4 * 4)
  })
})

// The table-driven test pinning this design's own numbers (ratified
// tile-virtualized-cells design, §1b/§Q1/§Q2/§9, re-derived against
// reports/perf/latest.md @ 5042ab3, 2026-08-22). A future change to
// TILE_SPAN_CELLS or EVICT_LAG_TILES must confront this table rather than
// drift past it silently.
//
// All three rows use the same worst-case-misaligned camera offset
// (offsetX: offsetY: -0.1) on purpose: it is not any one real camera this
// app produces, it is the offset (any small negative fraction works, see
// coveringTileRange's floor/ceil edge convention) that makes both axes hit
// their maximum possible tile count simultaneously -- ceil(L / spanCells) +
// 1 tiles for a viewport spanning L cells along an axis -- which is what
// Guard 1 (the mounted-count ceiling) has to hold against. This is also why
// the same offset reproduces every column of every row exactly.
//
// Measured constants the design chose TILE_SPAN_CELLS = 4 against, not
// reproducible here as assertions (no exported function of this module
// computes a cost -- see cellTiles.ts's header for the full F(S) table):
// c_rerender = 5.35-5.81 us/cell (four independent pan measurements),
// c_remount = 12.7-15.4 us/cell (six independent zoom measurements), and the
// validated relation p95 (frame interval) ~= mounted cell count x c_rerender
// -- predicted 110.3ms / 192.2ms against 108.2ms / 197.0ms observed at
// 20,618 / 35,856 mounted cells, both within +/-2.4%.
describe('design table: TILE_SPAN_CELLS = 4 mounted/tile/entering counts', () => {
  const cases: ReadonlyArray<{
    readonly name: string
    readonly cellSize: number
    readonly widthPx: number
    readonly heightPx: number
    readonly tileGrid: readonly [number, number] // [cols, rows]
    readonly mounted: readonly [number, number] // [widthCells, heightCells]
    readonly mountedCount: number
    readonly tileCount: number
    readonly enteringX: number
  }> = [
    {
      name: 'min zoom, 1920x1080',
      cellSize: 8,
      widthPx: 1920,
      heightPx: 1080,
      tileGrid: [61, 35],
      mounted: [244, 140],
      mountedCount: 34_160,
      tileCount: 2_135,
      enteringX: 560,
    },
    {
      name: 'min zoom, 1280x900',
      cellSize: 8,
      widthPx: 1280,
      heightPx: 900,
      tileGrid: [41, 30],
      mounted: [164, 120],
      mountedCount: 19_680,
      tileCount: 1_230,
      enteringX: 480,
    },
    {
      name: 'default zoom, 1280x900',
      cellSize: 20,
      widthPx: 1280,
      heightPx: 900,
      tileGrid: [17, 13],
      mounted: [68, 52],
      mountedCount: 3_536,
      tileCount: 221,
      enteringX: 208,
    },
  ]

  it.each(cases)(
    '$name: $tileGrid.0 x $tileGrid.1 tiles, $mounted.0 x $mounted.1 mounted cells',
    ({ cellSize, widthPx, heightPx, tileGrid, mounted, mountedCount, tileCount, enteringX }) => {
      const camera: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize }
      const range = coveringTileRange(camera, widthPx, heightPx, TILE_SPAN_CELLS)

      const tilesX = range.maxTileX - range.minTileX + 1
      const tilesY = range.maxTileY - range.minTileY + 1
      expect([tilesX, tilesY]).toEqual(tileGrid)
      expect(tilesX * TILE_SPAN_CELLS).toBe(mounted[0])
      expect(tilesY * TILE_SPAN_CELLS).toBe(mounted[1])
      expect(tileRangeCellCount(range)).toBe(mountedCount)
      expect(tilesX * tilesY).toBe(tileCount)
      expect(enteringStripCellCount(range, 'x')).toBe(enteringX)
    },
  )

  // Guard 1's non-steady-state figures: how large a HELD (not freshly
  // rebuilt) range can get before it would be rebuilt instead, per
  // tileRangeHolds's "exceeds by at most EVICT_LAG_TILES on every side"
  // tolerance. Both stay under today's measured 35,856 mounted cells at
  // min-zoom/1920x1080 (see cellLattice.ts's header for that figure's
  // provenance).
  //
  // A note on the design document's own label for the first of these: it
  // calls 35,712 the "single-axis-pan" transient. That label doesn't survive
  // scrutiny -- an x-only pan can only ever add lag on the x sides (the y
  // covering range is invariant under it, and is already at its own
  // per-axis maximum in the steady state below), so a genuine single-axis
  // transient tops out at 248 x 140 = 34,720, not 248 x 144. The number
  // 35,712 = 248 x 144 is real and coherent, though: it is what a range
  // carries when EVERY side is patient right up to the EVICT_LAG_TILES
  // tolerance in the least favourable independent combination available under
  // that rule (one lag tile on one side of x, one lag tile on one side of y)
  // -- the two-sided sibling of the design's own four-sided worst case below.
  // (It also happens to equal the S=8 mounted figure elsewhere in the design
  // document's exploratory table, which is very likely where the number was
  // actually carried from -- coincidence, not the same quantity.) Pinned
  // here as what it actually is, per the design's own instruction to report
  // a disagreement rather than silently resolve it.
  // The figure the perf run's Guard 1 is actually measured against, and the
  // one the design document did NOT carry (it labelled 35,712 below as the
  // single-axis transient; coder's correction, ratified at the architect
  // review pass, is that 35,712 is the two-sided bound). perf/'s pan
  // scenarios drive PAN_DELTA = { x: 400, y: 0 } -- purely horizontal -- so
  // the y covering range is invariant across the whole gesture and is already
  // at its own per-axis maximum (35 tiles for a 135-cell viewport, whatever
  // the alignment), which leaves 62 x 35 tiles = 248 x 140 cells as the most
  // a genuine single-axis pan can hold.
  it('the most a SINGLE-AXIS pan can hold: one lag tile on the x side only, 248x140 = 34,720 mounted', () => {
    const camera: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize: 8 }
    const steady = coveringTileRange(camera, 1920, 1080, TILE_SPAN_CELLS)
    const held: TileRange = { ...steady, minTileX: steady.minTileX - 1 }

    expect(tileRangeHolds(held, steady, EVICT_LAG_TILES)).toBe(true)
    expect(tileRangeCellCount(held)).toBe(34_720)
    expect(tileRangeCellCount(held)).toBeLessThan(35_856)
    // The y half of the claim, asserted rather than assumed: an x-only pan
    // cannot add a y lag tile, because the y cover never moves.
    const panned: Camera = { ...camera, offsetX: camera.offsetX + 400 / camera.cellSize }
    const afterPan = coveringTileRange(panned, 1920, 1080, TILE_SPAN_CELLS)
    expect([afterPan.minTileY, afterPan.maxTileY]).toEqual([steady.minTileY, steady.maxTileY])
  })

  it('a range held one tile of lag past the steady 61x35 cover, on one side of each axis: 248x144 = 35,712 mounted, still under 35,856', () => {
    const camera: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize: 8 }
    const steady = coveringTileRange(camera, 1920, 1080, TILE_SPAN_CELLS)
    const held: TileRange = {
      ...steady,
      minTileX: steady.minTileX - 1,
      maxTileY: steady.maxTileY + 1,
    }

    expect(tileRangeHolds(held, steady, EVICT_LAG_TILES)).toBe(true)
    expect(tileRangeCellCount(held)).toBe(35_712)
    expect(tileRangeCellCount(held)).toBeLessThan(35_856)
    // Deterministic mutation coverage for EVICT_LAG_TILES itself: a
    // nextTileRange that used a lag of 0 (or any implementation not actually
    // wired to the constant) would rebuild `held` down to `steady` here
    // instead of returning it by reference.
    expect(nextTileRange(held, camera, 1920, 1080)).toBe(held)
  })

  // The design's disclosed (not gated) worst case: every one of the four
  // sides carries a full tile of lag at once -- e.g. a diagonal pan out and
  // then back, never exceeding the tolerance on any side individually.
  it('a range held one tile of lag on every side of the steady 61x35 cover: 252x148 = 37,296 mounted (+4.0% over today, disclosed not gated)', () => {
    const camera: Camera = { offsetX: -0.1, offsetY: -0.1, cellSize: 8 }
    const steady = coveringTileRange(camera, 1920, 1080, TILE_SPAN_CELLS)
    const held: TileRange = {
      minTileX: steady.minTileX - 1,
      maxTileX: steady.maxTileX + 1,
      minTileY: steady.minTileY - 1,
      maxTileY: steady.maxTileY + 1,
      spanCells: steady.spanCells,
    }

    expect(tileRangeHolds(held, steady, EVICT_LAG_TILES)).toBe(true)
    expect(tileRangeCellCount(held)).toBe(37_296)
    expect(nextTileRange(held, camera, 1920, 1080)).toBe(held)
  })
})
