// Conway's Game of Life itself: the live-cell representation and the rules
// that advance it. Deliberately holds only the model -- the pattern catalog
// lives in patternLibrary.ts, which depends on this module rather than the
// other way round.

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
