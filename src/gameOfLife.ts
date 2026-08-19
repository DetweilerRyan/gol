export type CellKey = string
export type LiveCells = Set<CellKey>

export function cellKey(x: number, y: number): CellKey {
  return `${x},${y}`
}

function parseCellKey(key: CellKey): [number, number] {
  const [x, y] = key.split(',')
  return [Number(x), Number(y)]
}

export function createEmptyLiveCells(): LiveCells {
  return new Set()
}

export function isCellAlive(liveCells: LiveCells, x: number, y: number): boolean {
  return liveCells.has(cellKey(x, y))
}

export function toggleCell(draft: LiveCells, x: number, y: number): void {
  const key = cellKey(x, y)
  if (draft.has(key)) {
    draft.delete(key)
  } else {
    draft.add(key)
  }
}

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

function countNeighbors(liveCells: LiveCells): Map<CellKey, number> {
  const neighborCounts = new Map<CellKey, number>()
  for (const key of liveCells) {
    const [x, y] = parseCellKey(key)
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const neighborKey = cellKey(x + dx, y + dy)
      neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1)
    }
  }
  return neighborCounts
}

function willSurvive(isAlive: boolean, liveNeighborCount: number): boolean {
  if (isAlive) {
    return liveNeighborCount === 2 || liveNeighborCount === 3
  }
  return liveNeighborCount === 3
}

export function getNextGeneration(liveCells: LiveCells): LiveCells {
  const neighborCounts = countNeighbors(liveCells)

  const next: LiveCells = new Set()
  for (const [key, count] of neighborCounts) {
    if (willSurvive(liveCells.has(key), count)) {
      next.add(key)
    }
  }
  return next
}

export type PatternCategory = 'Still Life' | 'Oscillators' | 'Spaceships'

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

export interface ContentBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// maxX/maxY are the highest live cell coordinate plus one, so a single live
// cell yields a full 1x1 footprint (matching how it actually renders) rather
// than a zero-size point.
export function computeContentBounds(liveCells: LiveCells): ContentBounds | null {
  if (liveCells.size === 0) return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const key of liveCells) {
    const [x, y] = parseCellKey(key)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  return { minX, maxX: maxX + 1, minY, maxY: maxY + 1 }
}
