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

// Exported so liveCellWindow.ts's projection never re-splits a CellKey
// itself -- the "x,y" encoding stays owned by exactly this module (see
// cellKey's own definition just above), which is what an information-hiding
// review would otherwise flag a second parser as violating.
export function parseCellKey(key: CellKey): [number, number] {
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

// The candidate set for the next generation, with each candidate's live
// neighbor count. Keys are every live cell plus every cell adjacent to one --
// nothing outside that can change state, which is what makes this O(live
// cells) rather than O(area).
//
// The `?? 0` seed on the cell itself is load-bearing, not defensive: without
// it a live cell with zero live neighbors never becomes a key at all, and
// advanceGeneration's single pass could not see it die of underpopulation.
// Seeding it makes the key set a superset of the live set, so "absent from
// this map" stops being a state a caller has to compensate for. It cannot
// clobber a count already accumulated by an earlier neighbor (hence `??`),
// and it changes no survival outcome, since willSurvive(true, 0) is false.
function countNeighbors(liveCells: ReadonlyLiveCells): Map<CellKey, number> {
  const neighborCounts = new Map<CellKey, number>()
  for (const key of liveCells) {
    neighborCounts.set(key, neighborCounts.get(key) ?? 0)
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

// One generation, plus the exact set of cells whose aliveness flipped.
//
// The delta is collected in the same pass that decides survival rather than
// recovered afterwards by diffing the two sets: willSurvive(wasAlive, count)
// already answers "is it alive next" for a candidate whose "was it alive"
// this pass has in hand, so `isAlive !== wasAlive` is the change decision
// itself, not a re-derivation of it. Every cell that can change is a key of
// neighborCounts (see that function on why that includes the isolated live
// cell), so this single loop is exhaustive.
export interface GenerationStep {
  next: LiveCells
  // Every key whose membership differs between the previous generation and
  // `next`, in no particular order. The store notifies exactly these.
  changed: CellKey[]
}

export function advanceGeneration(previous: ReadonlyLiveCells): GenerationStep {
  const neighborCounts = countNeighbors(previous)

  const next: LiveCells = new Set()
  const changed: CellKey[] = []
  for (const [key, count] of neighborCounts) {
    const wasAlive = previous.has(key)
    const isAlive = willSurvive(wasAlive, count)
    if (isAlive) next.add(key)
    if (isAlive !== wasAlive) changed.push(key)
  }
  return { next, changed }
}

// The generation alone, for callers with no use for the delta (the Gherkin
// step definitions, which speak in whole generations). Deliberately a
// projection of advanceGeneration rather than a second implementation of the
// rules: two loops applying willSurvive could drift, and the survival rule
// living in exactly one place is the point.
export function getNextGeneration(liveCells: ReadonlyLiveCells): LiveCells {
  return advanceGeneration(liveCells).next
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
