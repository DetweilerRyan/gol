// Conway's Game of Life itself: the live-cell representation and the rules
// that advance it. Deliberately holds only the model -- the pattern catalog
// lives in patternLibrary.ts, which depends on this module rather than the
// other way round.

export type CellKey = string
// The draft/mutable type -- immer producers (toggleCell, placePattern) need a
// mutable Set to write into.
export type LiveCells = Set<CellKey>
// Published state: application state is always immutable, so anything handed
// out to a reader (rather than a producer) is typed as a ReadonlySet.
export type ReadonlyLiveCells = ReadonlySet<CellKey>

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

export function isCellAlive(liveCells: ReadonlyLiveCells, x: number, y: number): boolean {
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

function countNeighbors(liveCells: ReadonlyLiveCells): Map<CellKey, number> {
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

export function getNextGeneration(liveCells: ReadonlyLiveCells): LiveCells {
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
export function computeContentBounds(liveCells: ReadonlyLiveCells): ContentBounds | null {
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

// The symmetric difference of two live-cell sets: every key present in
// exactly one of the two. Used by the store (not implemented in this module)
// to notify only the cells whose state actually changed between generations,
// rather than every subscriber. Lives here rather than fused into
// getNextGeneration because it's set math over two LiveCells in the model's
// own vocabulary, independent of how the next generation was produced.
export function changedCells(previous: ReadonlyLiveCells, next: ReadonlyLiveCells): CellKey[] {
  const changed: CellKey[] = []
  for (const key of previous) {
    if (!next.has(key)) changed.push(key)
  }
  for (const key of next) {
    if (!previous.has(key)) changed.push(key)
  }
  return changed
}
