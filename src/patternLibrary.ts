import { cellKey, type LiveCells } from './gameOfLife'

// The catalog of known Life patterns and the queries over it. Deliberately
// separate from gameOfLife.ts (which owns the rules) and from
// patternPlacement.ts (which owns the idle/browsing/placing *interaction*):
// this module is the data and the anchor convention, nothing about how a user
// picks or aims a pattern. The dependency runs one way -- the catalog knows
// about the live-cell model, the model knows nothing about the catalog.

// Canonical display order for the pattern library modal. PatternCategory is
// derived from this array rather than declared separately, so a new category
// can only be added in one place.
export const PATTERN_CATEGORIES = ['Still Life', 'Oscillators', 'Spaceships'] as const

export type PatternCategory = (typeof PATTERN_CATEGORIES)[number]

export interface Pattern {
  name: string
  category: PatternCategory
  // Live cells relative to the top-left corner of the pattern's own
  // bounding box (0, 0), as spec'd in features/pattern-library.feature.
  cells: ReadonlyArray<readonly [number, number]>
}

export const PATTERNS: readonly Pattern[] = [
  {
    name: 'Block',
    category: 'Still Life',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'Beehive',
    category: 'Still Life',
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [3, 1],
      [1, 2],
      [2, 2],
    ],
  },
  {
    name: 'Blinker',
    category: 'Oscillators',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    name: 'Toad',
    category: 'Oscillators',
    cells: [
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: 'Beacon',
    category: 'Oscillators',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ],
  },
  {
    name: 'Pulsar',
    category: 'Oscillators',
    cells: [
      [2, 0],
      [3, 0],
      [4, 0],
      [8, 0],
      [9, 0],
      [10, 0],
      [0, 2],
      [5, 2],
      [7, 2],
      [12, 2],
      [0, 3],
      [5, 3],
      [7, 3],
      [12, 3],
      [0, 4],
      [5, 4],
      [7, 4],
      [12, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [8, 5],
      [9, 5],
      [10, 5],
      [2, 7],
      [3, 7],
      [4, 7],
      [8, 7],
      [9, 7],
      [10, 7],
      [0, 8],
      [5, 8],
      [7, 8],
      [12, 8],
      [0, 9],
      [5, 9],
      [7, 9],
      [12, 9],
      [0, 10],
      [5, 10],
      [7, 10],
      [12, 10],
      [2, 12],
      [3, 12],
      [4, 12],
      [8, 12],
      [9, 12],
      [10, 12],
    ],
  },
  {
    name: 'Glider',
    category: 'Spaceships',
    cells: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    name: 'LWSS (Lightweight Spaceship)',
    category: 'Spaceships',
    cells: [
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
]

export function getPatternByName(name: string): Pattern | undefined {
  return PATTERNS.find((pattern) => pattern.name === name)
}

export function patternsByCategory(category: PatternCategory): readonly Pattern[] {
  return PATTERNS.filter((pattern) => pattern.category === category)
}

// Computes the absolute world-space positions a pattern's cells would occupy
// if its bounding-box top-left corner were placed at (anchorX, anchorY).
// Single source of truth for the anchor convention -- shared by placePattern
// (to stamp cells) and the placing-mode preview in Grid.tsx (to render them
// before committing), so preview and actual placement can't drift apart.
export function patternCellPositions(
  pattern: Pattern,
  anchorX: number,
  anchorY: number,
): ReadonlyArray<readonly [number, number]> {
  return pattern.cells.map(([dx, dy]) => [anchorX + dx, anchorY + dy] as const)
}

// Translates the pattern's shape so its bounding-box top-left corner sits at
// (anchorX, anchorY), then unions it into the existing live cells: cells
// already alive stay alive, matching stamping behavior rather than toggling.
export function placePattern(draft: LiveCells, pattern: Pattern, anchorX: number, anchorY: number): void {
  for (const [x, y] of patternCellPositions(pattern, anchorX, anchorY)) {
    draft.add(cellKey(x, y))
  }
}
