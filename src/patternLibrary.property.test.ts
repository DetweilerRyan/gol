import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import { cellKey, isCellAlive, type LiveCells } from './gameOfLife'
import { PATTERN_CATEGORIES, PATTERNS, patternsByCategory, placePattern } from './patternLibrary'

const anyPattern = fc.constantFrom(...PATTERNS)
const anchor = fc.integer({ min: -10_000, max: 10_000 })
const coordinate = fc.integer({ min: -8, max: 8 })
const existingCells = fc.uniqueArray(fc.tuple(coordinate, coordinate), { maxLength: 25 })

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describe('patternsByCategory (property)', () => {
  it.prop([fc.constantFrom(...PATTERN_CATEGORIES)])('only returns patterns matching the given category', (category) => {
    expect(patternsByCategory(category).every((pattern) => pattern.category === category)).toBe(true)
  })
})

describe('PATTERNS catalog (property)', () => {
  // Pattern.cells documents its coordinates as being relative to the pattern's
  // own bounding-box top-left corner, which is the convention every anchor in
  // patternCellPositions/placePattern/the placing preview is measured against.
  // Nothing enforces it at the type level, so a new catalog entry drawn with a
  // stray margin would silently offset itself from the pointer -- this pins the
  // convention down across every entry at once rather than per pattern.
  it.prop([anyPattern])('anchors every pattern at its own bounding-box top-left corner', (pattern) => {
    expect(Math.min(...pattern.cells.map(([dx]) => dx))).toBe(0)
    expect(Math.min(...pattern.cells.map(([, dy]) => dy))).toBe(0)
  })

  it.prop([anyPattern])('describes every pattern with at least one cell, none of them duplicated', (pattern) => {
    expect(pattern.cells.length).toBeGreaterThan(0)
    expect(new Set(pattern.cells.map(([dx, dy]) => cellKey(dx, dy))).size).toBe(pattern.cells.length)
  })
})

describe('placePattern (property)', () => {
  it.prop([existingCells, anyPattern, anchor, anchor])(
    'only ever adds cells -- every previously live cell is still alive afterwards',
    (coords, pattern, x, y) => {
      const cells = makeLiveCells(coords)
      placePattern(cells, pattern, x, y)
      for (const [cellX, cellY] of coords) {
        expect(isCellAlive(cells, cellX, cellY)).toBe(true)
      }
    },
  )

  it.prop([existingCells, anyPattern, anchor, anchor])(
    'is idempotent: stamping the same pattern at the same anchor twice changes nothing the second time',
    (coords, pattern, x, y) => {
      const once = makeLiveCells(coords)
      placePattern(once, pattern, x, y)
      const twice = new Set(once)
      placePattern(twice, pattern, x, y)
      expect(twice).toEqual(once)
    },
  )

  it.prop([existingCells, anyPattern, anchor, anchor])(
    'adds exactly the pattern, so the grid grows by at most the pattern cell count',
    (coords, pattern, x, y) => {
      const cells = makeLiveCells(coords)
      const before = cells.size
      placePattern(cells, pattern, x, y)
      expect(cells.size).toBeGreaterThanOrEqual(before)
      expect(cells.size).toBeLessThanOrEqual(before + pattern.cells.length)
    },
  )
})
