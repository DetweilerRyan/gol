import { describe, expect, it } from 'vitest'
import { cellKey, createEmptyLiveCells, getNextGeneration, isCellAlive, toggleCell, type LiveCells } from './gameOfLife'

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
