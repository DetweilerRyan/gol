import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { TILE_SPAN_CELLS, tileOriginCell, type TileRange } from './cellTiles'
import { cellKey, createEmptyLiveCells, type CellKey, type LiveCells } from './gameOfLife'
import { liveCellsInRange, type WindowCell } from './liveCellWindow'

// The render window's invariants, owed by architect since this module landed
// at step 1 of collapse-dead-cell-layer and written at that slice's closing
// REVIEW pass.
//
// THE ONE THAT IS NOT OBVIOUS, and the reason this file matters more than a
// sorting check: the mounted set is NOT a window. It is "every live cell in
// range, PLUS the focus cursor's own cell wherever that is" -- including
// entirely outside the range, which is what keeps the grid reachable by Tab
// after a pan carries the cursor off screen. That +1 is what made
// aliveCellCount (features/screenplay/questions.ts) read 3 where a step
// expected 2 during this slice's step-4 verification, and the properties
// below state it in both directions rather than leaving it to a comment.

const coordinate = fc.integer({ min: -12, max: 12 })
const point = fc.tuple(coordinate, coordinate)
const liveCellsArbitrary = fc.uniqueArray(point, { maxLength: 30 }).map(makeLiveCells)

// Tile indices, not world cells: a range of [-3, 3] tiles at the real
// TILE_SPAN_CELLS covers world cells [-12, 15], which straddles the
// coordinate space above so both "live cell inside" and "live cell outside"
// are ordinary draws rather than lucky ones.
const tileIndex = fc.integer({ min: -3, max: 3 })
const rangeArbitrary: fc.Arbitrary<TileRange> = fc
  .tuple(tileIndex, tileIndex, tileIndex, tileIndex)
  .map(([a, b, c, d]) => ({
    minTileX: Math.min(a, b),
    maxTileX: Math.max(a, b),
    minTileY: Math.min(c, d),
    maxTileY: Math.max(c, d),
    spanCells: TILE_SPAN_CELLS,
  }))

// Deliberately reaches well outside every generated range as well as inside
// it, so the out-of-range focus case is drawn on most runs instead of
// occasionally.
const focusArbitrary = fc.option(
  fc.record({ x: fc.integer({ min: -40, max: 40 }), y: fc.integer({ min: -40, max: 40 }) }),
  {
    nil: null,
  },
)

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

// THE ORACLE, AND IT ENUMERATES RATHER THAN COMPARES -- deliberately, on two
// counts, and the second is the one to preserve if this is ever rewritten.
//
// INDEPENDENCE. It must never import cellInRange: Stryker does not mutate test
// files, so an oracle that is a second, fixed expression of the same rule is
// what makes a mutant in the implementation's comparisons observable at all.
// Importing the real function would recreate the self-referential oracle the
// same slice deleted from gridGeometry.property.test.ts, where a mutant on
// MAJOR_GRIDLINE_INTERVAL moved both sides together and the property stayed
// green.
//
// SHAPE. Independence does not require textual identity, and the first form of
// this helper was a byte-for-byte copy of cellInRange's four-comparison body
// -- which npm run dry4ts (a gate: failOnFound, exit 3) reported as a
// duplicate, correctly. Enumerating restates the DEFINITION instead of the
// formula: a tile covers spanCells x spanCells cells starting at its own
// origin, walked tile by tile. That is strictly further from the code under
// test than a min/max pair was -- it never writes `+ spanCells - 1` at all, so
// the implementation's inclusive-bound arithmetic is checked against a
// derivation rather than against a copy of itself. Same shape as
// gridGeometry.property.test.ts's bruteForceGridlines, for the same reason.
//
// What it still shares with the module is tileOriginCell, so a mutant in THAT
// moves both sides together -- unchanged from the previous form, and covered
// where tileOriginCell is the subject rather than a helper
// (cellTiles.property.test.ts).
function coveredCells(range: TileRange): ReadonlySet<CellKey> {
  const covered = new Set<CellKey>()
  for (let tileX = range.minTileX; tileX <= range.maxTileX; tileX++) {
    for (let tileY = range.minTileY; tileY <= range.maxTileY; tileY++) {
      const originX = tileOriginCell(tileX, range.spanCells)
      const originY = tileOriginCell(tileY, range.spanCells)
      for (let offsetX = 0; offsetX < range.spanCells; offsetX++) {
        for (let offsetY = 0; offsetY < range.spanCells; offsetY++) {
          covered.add(cellKey(originX + offsetX, originY + offsetY))
        }
      }
    }
  }
  return covered
}

// Which live cells the oracle says should be mounted. A membership test now,
// rather than a parse-then-compare -- which also drops this file's own
// hand-rolled copy of parseCellKey.
function liveInRange(cells: LiveCells, covered: ReadonlySet<CellKey>): CellKey[] {
  return [...cells].filter((key) => covered.has(key))
}

function isSortedRowMajor(cells: readonly WindowCell[]): boolean {
  return cells.every(
    (cell, i) => i === 0 || cells[i - 1].y < cell.y || (cells[i - 1].y === cell.y && cells[i - 1].x < cell.x),
  )
}

describe('liveCellsInRange (property)', () => {
  it.prop([liveCellsArbitrary, rangeArbitrary, focusArbitrary])(
    'mounts every live cell in range, and nothing else except the focus cursor',
    (cells, range, focus) => {
      const result = liveCellsInRange(cells, range, focus)
      const keys = new Set(result.map((cell) => cell.key))
      const covered = coveredCells(range)

      // Both directions, because each alone is satisfiable by a wrong
      // implementation: mounting everything satisfies the first, mounting
      // nothing satisfies the second.
      for (const key of liveInRange(cells, covered)) expect(keys.has(key)).toBe(true)
      for (const cell of result) {
        const isFocus = focus !== null && cell.x === focus.x && cell.y === focus.y
        expect(isFocus || (cells.has(cell.key) && covered.has(cell.key))).toBe(true)
      }
    },
  )

  it.prop([liveCellsArbitrary, rangeArbitrary, focusArbitrary])(
    'costs at most one extra cell over the live-in-range set, and exactly one when the cursor is not already in it',
    (cells, range, focus) => {
      // The performance claim the whole slice rests on, as an assertion
      // rather than as prose: a dead cell costs nothing unless it is the
      // cursor. An implementation that mounted the focus cell's whole tile
      // -- the obvious wrong way to keep the cursor reachable -- fails here
      // and nowhere else in this file.
      const expected = liveInRange(cells, coveredCells(range))
      const focusAlreadyIn = focus !== null && expected.includes(cellKey(focus.x, focus.y))
      const extra = focus !== null && !focusAlreadyIn ? 1 : 0
      expect(liveCellsInRange(cells, range, focus).length).toBe(expected.length + extra)
    },
  )

  it.prop([liveCellsArbitrary, rangeArbitrary, focusArbitrary])(
    'reports each mounted cell exactly once, in row-major order, with its real aliveness',
    (cells, range, focus) => {
      const result = liveCellsInRange(cells, range, focus)
      expect(new Set(result.map((cell) => cell.key)).size).toBe(result.length)
      expect(isSortedRowMajor(result)).toBe(true)
      // key and (x, y) must agree, and isAlive must be read from the set
      // rather than assumed from why the cell was included -- the focus
      // cursor is the one entry where those two answers can differ.
      for (const cell of result) {
        expect(cell.key).toBe(cellKey(cell.x, cell.y))
        expect(cell.isAlive).toBe(cells.has(cell.key))
      }
    },
  )

  it.prop([liveCellsArbitrary, rangeArbitrary, focusArbitrary])(
    'always mounts the focus cursor, wherever it is',
    (cells, range, focus) => {
      const result = liveCellsInRange(cells, range, focus)
      if (focus === null) return
      expect(result.some((cell) => cell.x === focus.x && cell.y === focus.y)).toBe(true)
    },
  )

  // Degenerate and boundary cases pinned deterministically rather than left
  // to the draw -- the same discipline the store's blinker case records.
  it('mounts nothing at all for an empty board with no cursor', () => {
    const range: TileRange = { minTileX: -2, maxTileX: 2, minTileY: -2, maxTileY: 2, spanCells: TILE_SPAN_CELLS }
    expect(liveCellsInRange(createEmptyLiveCells(), range, null)).toEqual([])
  })

  it('mounts a DEAD cursor sitting far outside the range, and marks it dead', () => {
    // The +1 in its purest form: nothing is alive, the cursor is nowhere near
    // the viewport, and it still has an element -- which is what keeps the
    // grid a tab stop. Cell.tsx paints this one transparent.
    const range: TileRange = { minTileX: 0, maxTileX: 0, minTileY: 0, maxTileY: 0, spanCells: TILE_SPAN_CELLS }
    expect(liveCellsInRange(createEmptyLiveCells(), range, { x: 199, y: 0 })).toEqual([
      { key: cellKey(199, 0), x: 199, y: 0, isAlive: false },
    ])
  })

  it('mounts an ALIVE cursor sitting far outside the range, which is what makes a mounted count not a live count', () => {
    // The exact shape that failed grid-scrollbars during this slice's step-4
    // verification: a live cell far off screen is counted by anything reading
    // the DOM, but only while it happens to be the cursor.
    const range: TileRange = { minTileX: 0, maxTileX: 0, minTileY: 0, maxTileY: 0, spanCells: TILE_SPAN_CELLS }
    const cells = makeLiveCells([
      [0, 0],
      [199, 0],
    ])
    expect(liveCellsInRange(cells, range, { x: 199, y: 0 })).toEqual([
      { key: cellKey(0, 0), x: 0, y: 0, isAlive: true },
      { key: cellKey(199, 0), x: 199, y: 0, isAlive: true },
    ])
  })

  it('includes both corners of a single tile, the boundary tileOriginCell arithmetic decides', () => {
    // spanCells - 1 is where an off-by-one in either bound shows up, and it
    // is exactly the arithmetic this file's own oracle restates, so it is
    // pinned here against hand-written literals instead.
    const range: TileRange = { minTileX: 0, maxTileX: 0, minTileY: 0, maxTileY: 0, spanCells: TILE_SPAN_CELLS }
    const corners = makeLiveCells([
      [0, 0],
      [TILE_SPAN_CELLS - 1, TILE_SPAN_CELLS - 1],
      [TILE_SPAN_CELLS, 0],
      [-1, 0],
    ])
    expect(liveCellsInRange(corners, range, null).map((cell) => cell.key)).toEqual([
      cellKey(0, 0),
      cellKey(TILE_SPAN_CELLS - 1, TILE_SPAN_CELLS - 1),
    ])
  })
})
