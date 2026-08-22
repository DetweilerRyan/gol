import { expect } from 'vitest'
import { cellKey, type CellKey, type GenerationStep, type LiveCells, type ReadonlyLiveCells } from '../gameOfLife'

// Intentionally naive, obviously-correct reference implementations of the two
// things the Life model derives, plus the one assertion about a generation
// step that more than one test file needs to make. Shared by gameOfLife's and
// liveCellStore's property tests and by gameOfLife's unit tests. The
// references exist to be a *different* algorithm from the one under test --
// scan a padded bounding box, count by brute force, diff two finished sets --
// so a property comparing against them is a check rather than a restatement.
// Kept here rather than copied into each test file so they can't drift into
// disagreeing about what the rules are.
//
// Deliberately O(area) and O(n) with no cleverness: correctness by inspection
// is the whole value. Only ever called with the small bounded patterns those
// property tests generate.

export function referenceNextGeneration(liveCells: ReadonlyLiveCells): LiveCells {
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

export function referenceChangedCells(previous: ReadonlyLiveCells, next: ReadonlyLiveCells): Set<CellKey> {
  const onlyInPrevious = [...previous].filter((key) => !next.has(key))
  const onlyInNext = [...next].filter((key) => !previous.has(key))
  return new Set([...onlyInPrevious, ...onlyInNext])
}

// The empty-step assertion, shared because the unit and property layers both
// have to make it: the property file pins the empty grid as a degenerate value
// (see engineering.md's "Writing a property test"), and the unit file needs it
// on coder's `npm run test:unit` fast path, which skips property tests
// entirely. Two identical copies is what dry4ts flags -- one named assertion is
// what keeps both layers covered without them.
export function expectNoChangeFromEmptyGrid(step: GenerationStep): void {
  expect(step.next.size).toBe(0)
  expect(step.changed).toEqual([])
}
