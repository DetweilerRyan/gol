import { describe, expect, it } from 'vitest'
import {
  cellKey,
  changedCells,
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  isCellAlive,
  toggleCell,
  type LiveCells,
} from './gameOfLife'

function makeLiveCells(coords: [number, number][]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describe('cellKey', () => {
  it('encodes coordinates as a stable string', () => {
    expect(cellKey(3, 5)).toBe('3,5')
    expect(cellKey(-3, -5)).toBe('-3,-5')
  })
})

describe('createEmptyLiveCells', () => {
  it('returns an empty set', () => {
    expect(createEmptyLiveCells().size).toBe(0)
  })
})

describe('isCellAlive', () => {
  it('reflects membership in the live set', () => {
    const cells = makeLiveCells([[1, 1]])
    expect(isCellAlive(cells, 1, 1)).toBe(true)
    expect(isCellAlive(cells, 1, 2)).toBe(false)
  })
})

describe('toggleCell', () => {
  it('adds a dead cell', () => {
    const cells = createEmptyLiveCells()
    toggleCell(cells, 2, 2)
    expect(isCellAlive(cells, 2, 2)).toBe(true)
  })

  it('removes a live cell', () => {
    const cells = makeLiveCells([[2, 2]])
    toggleCell(cells, 2, 2)
    expect(isCellAlive(cells, 2, 2)).toBe(false)
  })
})

describe('getNextGeneration', () => {
  it('kills an isolated live cell (underpopulation)', () => {
    const cells = makeLiveCells([[0, 0]])
    const next = getNextGeneration(cells)
    expect(next.size).toBe(0)
  })

  it('keeps a stable block (still life) alive', () => {
    const block = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    const next = getNextGeneration(block)
    expect(next).toEqual(block)
  })

  it('oscillates a horizontal blinker into a vertical one', () => {
    const horizontal = makeLiveCells([
      [0, 1],
      [1, 1],
      [2, 1],
    ])
    const vertical = getNextGeneration(horizontal)
    expect(vertical).toEqual(
      makeLiveCells([
        [1, 0],
        [1, 1],
        [1, 2],
      ]),
    )
    const backToHorizontal = getNextGeneration(vertical)
    expect(backToHorizontal).toEqual(horizontal)
  })

  it('births a dead cell with exactly 3 live neighbors', () => {
    const cells = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    const next = getNextGeneration(cells)
    expect(isCellAlive(next, 1, 1)).toBe(true)
  })

  it('kills a live cell with 4+ neighbors (overpopulation)', () => {
    const cells = makeLiveCells([
      [1, 0],
      [0, 1],
      [2, 1],
      [1, 2],
      [1, 1],
    ])
    const next = getNextGeneration(cells)
    expect(isCellAlive(next, 1, 1)).toBe(false)
  })

  it('never births a cell with only 2 live neighbors', () => {
    const cells = makeLiveCells([
      [0, 0],
      [1, 0],
    ])
    const next = getNextGeneration(cells)
    expect(isCellAlive(next, 0, 1)).toBe(false)
    expect(isCellAlive(next, 1, 1)).toBe(false)
  })

  it('produces an empty set from an empty set', () => {
    expect(getNextGeneration(createEmptyLiveCells()).size).toBe(0)
  })

  it('applies the same rules regardless of how far the pattern is from the origin (unbounded)', () => {
    const OFFSET = 10_000
    const horizontal = makeLiveCells([
      [OFFSET, OFFSET + 1],
      [OFFSET + 1, OFFSET + 1],
      [OFFSET + 2, OFFSET + 1],
    ])
    const next = getNextGeneration(horizontal)
    expect(next).toEqual(
      makeLiveCells([
        [OFFSET + 1, OFFSET],
        [OFFSET + 1, OFFSET + 1],
        [OFFSET + 1, OFFSET + 2],
      ]),
    )
  })

  it('behaves identically for a pattern straddling negative and positive coordinates', () => {
    const horizontal = makeLiveCells([
      [-1, 0],
      [0, 0],
      [1, 0],
    ])
    const next = getNextGeneration(horizontal)
    expect(next).toEqual(
      makeLiveCells([
        [0, -1],
        [0, 0],
        [0, 1],
      ]),
    )
  })
})

function sortedKeys(keys: readonly string[]): string[] {
  return [...keys].sort()
}

describe('changedCells', () => {
  it('is empty for two empty sets', () => {
    expect(changedCells(createEmptyLiveCells(), createEmptyLiveCells())).toEqual([])
  })

  it('reports every cell of the non-empty side when the other is empty', () => {
    const next = makeLiveCells([
      [0, 0],
      [1, 1],
    ])
    expect(sortedKeys(changedCells(createEmptyLiveCells(), next))).toEqual(sortedKeys([cellKey(0, 0), cellKey(1, 1)]))
    expect(sortedKeys(changedCells(next, createEmptyLiveCells()))).toEqual(sortedKeys([cellKey(0, 0), cellKey(1, 1)]))
  })

  it('is empty for identical sets', () => {
    const cells = makeLiveCells([
      [0, 0],
      [3, 4],
    ])
    expect(changedCells(cells, cells)).toEqual([])
    expect(
      changedCells(
        cells,
        makeLiveCells([
          [0, 0],
          [3, 4],
        ]),
      ),
    ).toEqual([])
  })

  it('reports every cell of both sides for disjoint sets', () => {
    const previous = makeLiveCells([[0, 0]])
    const next = makeLiveCells([[9, 9]])
    expect(sortedKeys(changedCells(previous, next))).toEqual(sortedKeys([cellKey(0, 0), cellKey(9, 9)]))
  })

  it('reports only the added cell', () => {
    const previous = makeLiveCells([[0, 0]])
    const next = makeLiveCells([
      [0, 0],
      [1, 0],
    ])
    expect(changedCells(previous, next)).toEqual([cellKey(1, 0)])
  })

  it('reports only the removed cell', () => {
    const previous = makeLiveCells([
      [0, 0],
      [1, 0],
    ])
    const next = makeLiveCells([[0, 0]])
    expect(changedCells(previous, next)).toEqual([cellKey(1, 0)])
  })
})

describe('computeContentBounds', () => {
  it('returns null for an empty grid', () => {
    expect(computeContentBounds(createEmptyLiveCells())).toBeNull()
  })

  it('gives a single cell a full 1x1 footprint, not a zero-size point', () => {
    const cells = makeLiveCells([[5, 5]])
    expect(computeContentBounds(cells)).toEqual({ minX: 5, maxX: 6, minY: 5, maxY: 6 })
  })

  it('spans the furthest-apart live cells on each axis independently', () => {
    const cells = makeLiveCells([
      [-3, 10],
      [7, -2],
      [0, 0],
    ])
    expect(computeContentBounds(cells)).toEqual({ minX: -3, maxX: 8, minY: -2, maxY: 11 })
  })
})
