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
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

export function getNextGeneration(liveCells: LiveCells): LiveCells {
  const neighborCounts = new Map<CellKey, number>()

  for (const key of liveCells) {
    const [x, y] = parseCellKey(key)
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      const neighborKey = cellKey(x + dx, y + dy)
      neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1)
    }
  }

  const next: LiveCells = new Set()
  for (const [key, count] of neighborCounts) {
    const isAlive = liveCells.has(key)
    if (isAlive ? count === 2 || count === 3 : count === 3) {
      next.add(key)
    }
  }
  return next
}
