import { describe, expect, it } from 'vitest'
import { cellKey, createEmptyLiveCells, type LiveCells } from './gameOfLife'
import type { TileRange } from './cellTiles'
import { liveCellsInRange } from './liveCellWindow'

function makeLiveCells(coords: [number, number][]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

// Two tiles square, spanCells 4 -- covers world cells [-4, 3] on both axes.
const range: TileRange = { minTileX: -1, maxTileX: 0, minTileY: -1, maxTileY: 0, spanCells: 4 }

describe('liveCellsInRange', () => {
  it('returns nothing for an empty grid and no focus', () => {
    expect(liveCellsInRange(createEmptyLiveCells(), range, null)).toEqual([])
  })

  it('returns every live cell that falls inside the range', () => {
    const cells = makeLiveCells([
      [0, 0],
      [-4, -4],
      [3, 3],
    ])
    const result = liveCellsInRange(cells, range, null)
    expect(result).toEqual([
      { key: '-4,-4', x: -4, y: -4, isAlive: true },
      { key: '0,0', x: 0, y: 0, isAlive: true },
      { key: '3,3', x: 3, y: 3, isAlive: true },
    ])
  })

  // BOTH AXES, ONE ROW EACH, and the second row is not decoration:
  // cellInRange checks all four bounds, and only the x pair had a
  // boundary-exclusion regression test until a scoped mutation scan found
  // minY/maxY unexercised (3 of the 4
  // ArithmeticOperator/ConditionalExpression mutants on cellInRange's y
  // bounds survived a full unfiltered `npm test` run with no test noticing).
  // A row per axis is what keeps that independence -- a mutant on one axis'
  // bounds is killed by that axis' row alone -- while stating the shared
  // claim once instead of as two hand-copied twins.
  it.each<[string, [number, number], [number, number]]>([
    ['x', [4, 0], [-5, 0]],
    ['y', [0, 4], [0, -5]],
  ])('excludes a live cell past either %s bound of the range', (_axis, beyondMax, beforeMin) => {
    const cells = makeLiveCells([[0, 0], beyondMax, beforeMin])
    expect(liveCellsInRange(cells, range, null)).toEqual([{ key: '0,0', x: 0, y: 0, isAlive: true }])
  })

  it('orders results row-major: top-to-bottom, then left-to-right within a row', () => {
    const cells = makeLiveCells([
      [2, 1],
      [-1, -1],
      [0, 1],
      [3, -2],
    ])
    const result = liveCellsInRange(cells, range, null)
    expect(result.map((c) => [c.x, c.y])).toEqual([
      [3, -2],
      [-1, -1],
      [0, 1],
      [2, 1],
    ])
  })

  it('includes an alive focus cell inside the range only once, not duplicated', () => {
    const cells = makeLiveCells([[0, 0]])
    const result = liveCellsInRange(cells, range, { x: 0, y: 0 })
    expect(result).toEqual([{ key: '0,0', x: 0, y: 0, isAlive: true }])
  })

  it('includes a dead focus cell inside the range as one extra element', () => {
    const cells = createEmptyLiveCells()
    const result = liveCellsInRange(cells, range, { x: 1, y: 1 })
    expect(result).toEqual([{ key: '1,1', x: 1, y: 1, isAlive: false }])
  })

  it('includes a dead focus cell OUTSIDE the range as one extra element', () => {
    const cells = createEmptyLiveCells()
    const result = liveCellsInRange(cells, range, { x: 1000, y: -1000 })
    expect(result).toEqual([{ key: '1000,-1000', x: 1000, y: -1000, isAlive: false }])
  })

  it('includes an alive focus cell OUTSIDE the range as one extra element, still alive', () => {
    const cells = makeLiveCells([[1000, -1000]])
    const result = liveCellsInRange(cells, range, { x: 1000, y: -1000 })
    expect(result).toEqual([{ key: '1000,-1000', x: 1000, y: -1000, isAlive: true }])
  })

  it('never adds more than one element for the focus cell, regardless of live-cell population elsewhere', () => {
    const cells = makeLiveCells([
      [0, 0],
      [1, 1],
      [2, 2],
    ])
    const result = liveCellsInRange(cells, range, { x: 1000, y: -1000 })
    expect(result).toHaveLength(4)
  })

  // A focus cell inserted after the sort must be re-sorted into place, not
  // merely appended -- appending would leave row-major order intact only by
  // coincidence when the focus cell's own row already sorts last, which the
  // 'keeps row-major order' case just below happens to do. This one puts the
  // focus cell at the *front* by row, so a missing second sort produces a
  // detectably wrong order rather than one that happens to still be right.
  it('re-sorts, rather than appends, when an out-of-range focus cell belongs before the existing cells', () => {
    const cells = makeLiveCells([
      [0, 1],
      [0, 2],
    ])
    const result = liveCellsInRange(cells, range, { x: 0, y: -100 })
    expect(result.map((c) => [c.x, c.y])).toEqual([
      [0, -100],
      [0, 1],
      [0, 2],
    ])
  })

  it('keeps row-major order after inserting an out-of-range focus cell', () => {
    const cells = makeLiveCells([
      [-2, 0],
      [2, 0],
    ])
    const result = liveCellsInRange(cells, range, { x: 0, y: 100 })
    expect(result.map((c) => [c.x, c.y])).toEqual([
      [-2, 0],
      [2, 0],
      [0, 100],
    ])
  })

  it('a null focus adds nothing beyond the live cells actually in range', () => {
    const cells = makeLiveCells([[0, 0]])
    expect(liveCellsInRange(cells, range, null)).toEqual([{ key: '0,0', x: 0, y: 0, isAlive: true }])
  })
})
