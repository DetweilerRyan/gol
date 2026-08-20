import type { Camera } from './camera'

// What part of the conceptually-infinite grid is on screen, and which of those
// coordinates are reference lines. Everything here is derived from a
// VisibleRange, which is the only thing that ties it to the camera -- these
// functions never produce a new Camera, unlike camera.ts's transforms.

const VISIBLE_BUFFER_CELLS = 2

export interface VisibleRange {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function computeVisibleRange(camera: Camera, viewportWidthPx: number, viewportHeightPx: number): VisibleRange {
  return {
    minX: Math.floor(camera.offsetX) - VISIBLE_BUFFER_CELLS,
    maxX: Math.ceil(camera.offsetX + viewportWidthPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
    minY: Math.floor(camera.offsetY) - VISIBLE_BUFFER_CELLS,
    maxY: Math.ceil(camera.offsetY + viewportHeightPx / camera.cellSize) + VISIBLE_BUFFER_CELLS,
  }
}

// Enumerates every cell coordinate within a visible range, row-major (y outer,
// x inner) to match the order Grid renders them in. Pulled out of Grid.tsx as
// a pure function so the (x, y) enumeration itself stays independently
// testable rather than living only inside JSX-adjacent render logic.
export function cellsInRange(range: VisibleRange): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  for (let y = range.minY; y <= range.maxY; y++) {
    for (let x = range.minX; x <= range.maxX; x++) {
      cells.push({ x, y })
    }
  }
  return cells
}

export const MAJOR_GRIDLINE_INTERVAL = 10

export function isMajorGridline(coordinate: number): boolean {
  return coordinate % MAJOR_GRIDLINE_INTERVAL === 0
}

export interface MajorGridlines {
  x: number[]
  y: number[]
}

function gridlinesInRange(min: number, max: number): number[] {
  // `Math.ceil` of a small negative fraction (e.g. -2 / 10) yields -0, not 0.
  // `|| 0` normalizes that back to a plain 0 without affecting any other value.
  const start = Math.ceil(min / MAJOR_GRIDLINE_INTERVAL) * MAJOR_GRIDLINE_INTERVAL || 0
  const lines: number[] = []
  for (let line = start; line <= max; line += MAJOR_GRIDLINE_INTERVAL) {
    lines.push(line)
  }
  return lines
}

export function computeMajorGridlines(range: VisibleRange): MajorGridlines {
  return {
    x: gridlinesInRange(range.minX, range.maxX),
    y: gridlinesInRange(range.minY, range.maxY),
  }
}
