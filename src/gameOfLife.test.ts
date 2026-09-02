import { describe, expect, it } from 'vitest'
import {
  advanceGeneration,
  cellKey,
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  isCellAlive,
  parseCellKey,
  toggleCell,
  type LiveCells,
} from './gameOfLife'
import { expectNoChangeFromEmptyGrid } from './test-support/lifeReference'

function makeLiveCells(coords: [number, number][]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describe('cellKey', () => {
  it('encodes coordinates as a stable string', () => {
    expect(cellKey(3, 5)).toBe('3,5')
    expect(cellKey(-3, -5)).toBe('-3,-5')
  })
})

describe('parseCellKey', () => {
  it('decodes a key back into its coordinates', () => {
    expect(parseCellKey('3,5')).toEqual([3, 5])
    expect(parseCellKey('-3,-5')).toEqual([-3, -5])
  })

  it('round-trips through cellKey', () => {
    expect(parseCellKey(cellKey(7, -2))).toEqual([7, -2])
  })

  it('decodes zero without producing -0 on either coordinate', () => {
    const [x, y] = parseCellKey('0,0')
    expect(Object.is(x, -0)).toBe(false)
    expect(Object.is(y, -0)).toBe(false)
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

describe('advanceGeneration', () => {
  it('reports no change for an empty grid', () => {
    expectNoChangeFromEmptyGrid(advanceGeneration(createEmptyLiveCells()))
  })

  it('reports the lone cell that dies of underpopulation', () => {
    // The zero-neighbor case: this cell contributes counts to its eight
    // neighbors but receives none, so it is only a key of the candidate map
    // because countNeighbors seeds it. Without that seed the delta pass
    // cannot see it die, and the cell would go dark on screen with nobody
    // notified.
    const { next, changed } = advanceGeneration(makeLiveCells([[4, 4]]))
    expect(next.size).toBe(0)
    expect(changed).toEqual([cellKey(4, 4)])
  })

  it('reports no change for a still life', () => {
    const block = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    const { next, changed } = advanceGeneration(block)
    expect(next).toEqual(block)
    expect(changed).toEqual([])
  })

  it('reports both the deaths and the births of an oscillator', () => {
    const horizontal = makeLiveCells([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
    const { next, changed } = advanceGeneration(horizontal)
    expect(next).toEqual(
      makeLiveCells([
        [1, -1],
        [1, 0],
        [1, 1],
      ]),
    )
    // (0,0) and (2,0) die; (1,-1) and (1,1) are born; (1,0) survives and is
    // deliberately absent -- notifying it would re-render an unchanged cell.
    expect(sortedKeys(changed)).toEqual(sortedKeys([cellKey(0, 0), cellKey(2, 0), cellKey(1, -1), cellKey(1, 1)]))
  })

  it('agrees with getNextGeneration, which is defined in terms of it', () => {
    const cells = makeLiveCells([
      [0, 0],
      [1, 0],
      [2, 0],
      [7, 7],
    ])
    expect(advanceGeneration(cells).next).toEqual(getNextGeneration(cells))
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
