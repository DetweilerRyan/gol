import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
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

// Bounded coordinate/pattern generators keep the brute-force reference
// implementation below cheap while still exercising negative coordinates,
// which is the case the old fixed-array implementation couldn't represent.
const coordinate = fc.integer({ min: -8, max: 8 })
const point = fc.tuple(coordinate, coordinate)
const pattern = fc.uniqueArray(point, { maxLength: 25 })

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

// An intentionally naive, obviously-correct implementation of the same rule:
// scan every cell in the padded bounding box and count neighbors by brute
// force. This is the specification getNextGeneration's sparse, O(live cells)
// algorithm is supposed to be a faster reformulation of.
function referenceNextGeneration(liveCells: LiveCells): LiveCells {
  const coords = [...liveCells].map((key) => key.split(',').map(Number) as [number, number])
  const next: LiveCells = new Set()
  if (coords.length === 0) return next

  const xs = coords.map(([x]) => x)
  const ys = coords.map(([, y]) => y)
  const minX = Math.min(...xs) - 1
  const maxX = Math.max(...xs) + 1
  const minY = Math.min(...ys) - 1
  const maxY = Math.max(...ys) + 1

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      let liveNeighbors = 0
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          if (liveCells.has(cellKey(x + dx, y + dy))) liveNeighbors++
        }
      }
      const isAlive = liveCells.has(cellKey(x, y))
      if (isAlive ? liveNeighbors === 2 || liveNeighbors === 3 : liveNeighbors === 3) {
        next.add(cellKey(x, y))
      }
    }
  }
  return next
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

// Brute-force oracle: the symmetric difference, computed with plain array
// filtering rather than changedCells' own O(n) loop, so the property doesn't
// just restate the implementation.
function referenceChangedCells(previous: LiveCells, next: LiveCells): Set<string> {
  const previousKeys = [...previous]
  const nextKeys = [...next]
  const onlyInPrevious = previousKeys.filter((key) => !next.has(key))
  const onlyInNext = nextKeys.filter((key) => !previous.has(key))
  return new Set([...onlyInPrevious, ...onlyInNext])
}

describe('changedCells (property)', () => {
  it.prop([pattern, pattern])('matches an independent brute-force symmetric-difference reference', (a, b) => {
    const previous = makeLiveCells(a)
    const next = makeLiveCells(b)
    expect(new Set(changedCells(previous, next))).toEqual(referenceChangedCells(previous, next))
  })

  it.prop([pattern, pattern])(
    'is symmetric: changedCells(a, b) and changedCells(b, a) contain the same keys',
    (a, b) => {
      const previous = makeLiveCells(a)
      const next = makeLiveCells(b)
      expect(new Set(changedCells(previous, next))).toEqual(new Set(changedCells(next, previous)))
    },
  )

  it.prop([pattern])('is empty when compared against itself', (coords) => {
    const cells = makeLiveCells(coords)
    expect(changedCells(cells, cells)).toEqual([])
  })

  it.prop([pattern, pattern])('every reported key is a member of exactly one of the two sets', (a, b) => {
    const previous = makeLiveCells(a)
    const next = makeLiveCells(b)
    for (const key of changedCells(previous, next)) {
      expect(previous.has(key)).not.toBe(next.has(key))
    }
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
