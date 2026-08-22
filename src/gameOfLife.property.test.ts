import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import {
  advanceGeneration,
  cellKey,
  computeContentBounds,
  createEmptyLiveCells,
  getNextGeneration,
  isCellAlive,
  toggleCell,
  type LiveCells,
} from './gameOfLife'
import {
  expectNoChangeFromEmptyGrid,
  referenceChangedCells,
  referenceNextGeneration,
} from './test-support/lifeReference'

// Bounded coordinate/pattern generators keep the brute-force reference
// implementations in test-support/lifeReference cheap while still exercising negative coordinates,
// which is the case the old fixed-array implementation couldn't represent.
const coordinate = fc.integer({ min: -8, max: 8 })
const point = fc.tuple(coordinate, coordinate)
const pattern = fc.uniqueArray(point, { maxLength: 25 })

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describe('cellKey (property)', () => {
  it.prop([point, point])('is injective: distinct coordinates never share a key', ([x1, y1], [x2, y2]) => {
    fc.pre(x1 !== x2 || y1 !== y2)
    expect(cellKey(x1, y1)).not.toBe(cellKey(x2, y2))
  })
})

describe('toggleCell (property)', () => {
  it.prop([pattern, point])('is its own inverse: toggling twice restores the original state', (coords, [x, y]) => {
    const cells = makeLiveCells(coords)
    const before = isCellAlive(cells, x, y)
    toggleCell(cells, x, y)
    toggleCell(cells, x, y)
    expect(isCellAlive(cells, x, y)).toBe(before)
  })

  it.prop([pattern, point, point])(
    'only changes the state of the targeted cell',
    (coords, [x, y], [otherX, otherY]) => {
      fc.pre(x !== otherX || y !== otherY)
      const cells = makeLiveCells(coords)
      const otherBefore = isCellAlive(cells, otherX, otherY)
      toggleCell(cells, x, y)
      expect(isCellAlive(cells, otherX, otherY)).toBe(otherBefore)
    },
  )
})

describe('getNextGeneration (property)', () => {
  it.prop([pattern])('is deterministic for the same input', (coords) => {
    const cells = makeLiveCells(coords)
    expect(getNextGeneration(cells)).toEqual(getNextGeneration(cells))
  })

  it.prop([pattern, fc.integer({ min: -1_000_000, max: 1_000_000 }), fc.integer({ min: -1_000_000, max: 1_000_000 })])(
    'is translation invariant: shifting the pattern shifts the result by the same amount',
    (coords, shiftX, shiftY) => {
      const cells = makeLiveCells(coords)
      const shifted = makeLiveCells(coords.map(([x, y]) => [x + shiftX, y + shiftY]))

      const next = getNextGeneration(cells)
      const nextShifted = getNextGeneration(shifted)
      const nextTranslated = makeLiveCells(
        [...next].map((key) => {
          const [x, y] = key.split(',').map(Number)
          return [x + shiftX, y + shiftY]
        }),
      )

      expect(nextShifted).toEqual(nextTranslated)
    },
  )

  it.prop([pattern], { numRuns: 500 })(
    'matches an independent brute-force reference implementation of the same rule',
    (coords) => {
      const cells = makeLiveCells(coords)
      expect(getNextGeneration(cells)).toEqual(referenceNextGeneration(cells))
    },
  )
})

describe('createEmptyLiveCells (property)', () => {
  it.prop([point])('never reports any cell as alive', ([x, y]) => {
    expect(isCellAlive(createEmptyLiveCells(), x, y)).toBe(false)
  })
})

describe('advanceGeneration (property)', () => {
  it.prop([pattern])('reports exactly the symmetric difference between the two generations', (coords) => {
    const previous = makeLiveCells(coords)
    const { next, changed } = advanceGeneration(previous)
    expect(new Set(changed)).toEqual(referenceChangedCells(previous, next))
  })

  it.prop([pattern])('reports every changed key exactly once', (coords) => {
    // Not implied by the set-equality property above: a duplicate collapses
    // in a Set. The store turns each entry into one listener dispatch, so a
    // repeat is a double re-render of the same cell.
    const { changed } = advanceGeneration(makeLiveCells(coords))
    expect(changed.length).toBe(new Set(changed).size)
  })

  it.prop([pattern])('never reports a cell whose aliveness is the same in both generations', (coords) => {
    const previous = makeLiveCells(coords)
    const { next, changed } = advanceGeneration(previous)
    for (const key of changed) {
      expect(previous.has(key)).not.toBe(next.has(key))
    }
  })

  it.prop([pattern])('leaves next identical to getNextGeneration, which projects it', (coords) => {
    const cells = makeLiveCells(coords)
    expect(advanceGeneration(cells).next).toEqual(getNextGeneration(cells))
  })

  // Degenerate inputs pinned deterministically rather than left to the
  // generator: the empty grid (no candidates at all), the isolated live cell
  // (the only case whose candidacy depends on countNeighbors' zero seed), and
  // a still life (every candidate survives, so the delta must be empty even
  // though the candidate map is full).
  it('reports nothing for the empty grid', () => {
    expectNoChangeFromEmptyGrid(advanceGeneration(createEmptyLiveCells()))
  })

  it('reports the isolated live cell that dies with zero live neighbors', () => {
    expect(advanceGeneration(makeLiveCells([[0, 0]])).changed).toEqual([cellKey(0, 0)])
  })

  it('reports nothing for a still life whose every cell survives', () => {
    const block = makeLiveCells([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
    expect(advanceGeneration(block).changed).toEqual([])
  })
})

describe('computeContentBounds (property)', () => {
  const nonEmptyPattern = fc.uniqueArray(point, { minLength: 1, maxLength: 25 })

  it.prop([nonEmptyPattern])('is the tightest half-open box containing every live cell', (coords) => {
    const bounds = computeContentBounds(makeLiveCells(coords))
    if (!bounds) throw new Error('expected bounds for a non-empty grid')

    // Containment: maxX/maxY are exclusive (one past the last live cell), so
    // every cell satisfies min <= c < max on both axes.
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(bounds.minX)
      expect(x).toBeLessThan(bounds.maxX)
      expect(y).toBeGreaterThanOrEqual(bounds.minY)
      expect(y).toBeLessThan(bounds.maxY)
    }

    // Tightness: some live cell touches each of the four edges, so no smaller
    // box would still contain them all.
    expect(coords.some(([x]) => x === bounds.minX)).toBe(true)
    expect(coords.some(([x]) => x === bounds.maxX - 1)).toBe(true)
    expect(coords.some(([, y]) => y === bounds.minY)).toBe(true)
    expect(coords.some(([, y]) => y === bounds.maxY - 1)).toBe(true)
  })

  it.prop([
    nonEmptyPattern,
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
  ])(
    'is translation equivariant: shifting every cell shifts the bounds by the same amount',
    (coords, shiftX, shiftY) => {
      const bounds = computeContentBounds(makeLiveCells(coords))
      if (!bounds) throw new Error('expected bounds for a non-empty grid')

      const shifted = computeContentBounds(makeLiveCells(coords.map(([x, y]) => [x + shiftX, y + shiftY])))
      expect(shifted).toEqual({
        minX: bounds.minX + shiftX,
        maxX: bounds.maxX + shiftX,
        minY: bounds.minY + shiftY,
        maxY: bounds.maxY + shiftY,
      })
    },
  )
})
