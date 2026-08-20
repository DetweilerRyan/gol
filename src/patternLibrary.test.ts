import { describe, expect, it } from 'vitest'
import { cellKey, createEmptyLiveCells, isCellAlive, type LiveCells } from './gameOfLife'
import {
  getPatternByName,
  PATTERN_CATEGORIES,
  PATTERNS,
  patternsByCategory,
  placePattern,
  type Pattern,
} from './patternLibrary'

function makeLiveCells(coords: [number, number][]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

function requirePattern(name: string): Pattern {
  const pattern = getPatternByName(name)
  if (!pattern) throw new Error(`${name} pattern not found`)
  return pattern
}

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

describe('patternsByCategory', () => {
  it("returns each category's patterns in PATTERNS declaration order", () => {
    expect(patternsByCategory('Still Life').map((pattern) => pattern.name)).toEqual(['Block', 'Beehive'])
    expect(patternsByCategory('Oscillators').map((pattern) => pattern.name)).toEqual([
      'Blinker',
      'Toad',
      'Beacon',
      'Pulsar',
    ])
    expect(patternsByCategory('Spaceships').map((pattern) => pattern.name)).toEqual([
      'Glider',
      'LWSS (Lightweight Spaceship)',
    ])
  })

  it('every pattern belongs to exactly one PATTERN_CATEGORIES group', () => {
    const grouped = PATTERN_CATEGORIES.flatMap((category) => patternsByCategory(category))
    expect(grouped).toHaveLength(PATTERNS.length)
    expect(new Set(grouped.map((pattern) => pattern.name))).toEqual(new Set(PATTERNS.map((pattern) => pattern.name)))
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
