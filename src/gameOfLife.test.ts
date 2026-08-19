import { describe, expect, it } from 'vitest'
import {
  cellKey,
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  getPatternByName,
  isCellAlive,
  PATTERNS,
  placePattern,
  toggleCell,
  type LiveCells,
  type Pattern,
} from './gameOfLife'

function makeLiveCells(coords: [number, number][]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

function requirePattern(name: string): Pattern {
  const pattern = getPatternByName(name)
  if (!pattern) throw new Error(`${name} pattern not found`)
  return pattern
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

describe('getPatternByName', () => {
  it('finds a pattern by exact name', () => {
    expect(getPatternByName('Glider')?.category).toBe('Spaceships')
  })

  it('returns undefined for an unknown name', () => {
    expect(getPatternByName('Not A Real Pattern')).toBeUndefined()
  })

  it('has all 8 patterns with unique names', () => {
    expect(PATTERNS).toHaveLength(8)
    expect(new Set(PATTERNS.map((pattern) => pattern.name)).size).toBe(8)
  })
})

describe('placePattern', () => {
  it('translates the pattern so its bounding-box top-left corner sits at the anchor', () => {
    const cells = createEmptyLiveCells()
    placePattern(cells, requirePattern('Blinker'), 10, 10)
    expect(cells).toEqual(
      makeLiveCells([
        [10, 10],
        [11, 10],
        [12, 10],
      ]),
    )
  })

  it('unions the pattern into existing live cells rather than replacing them', () => {
    const cells = makeLiveCells([[0, 0]])
    placePattern(cells, requirePattern('Block'), 5, 5)
    expect(isCellAlive(cells, 0, 0)).toBe(true)
    expect(isCellAlive(cells, 5, 5)).toBe(true)
    expect(isCellAlive(cells, 6, 6)).toBe(true)
  })

  it('keeps an already-live cell alive rather than toggling it off', () => {
    const cells = makeLiveCells([[5, 5]])
    placePattern(cells, requirePattern('Block'), 5, 5)
    expect(isCellAlive(cells, 5, 5)).toBe(true)
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
