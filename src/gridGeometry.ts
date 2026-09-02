import type { Camera } from './camera'

// What part of the conceptually-infinite grid is on screen, and which of those
// coordinates are reference lines. Everything here is derived from a
// VisibleRange, which is the only thing that ties it to the camera -- these
// functions never produce a new Camera, unlike camera.ts's transforms.
//
// computeVisibleRange is used two ways: Grid's renderOverlays context (the
// ruler needs the exact camera-derived range so its label set matches what's
// actually on screen), and, historically, to enumerate exactly the cells to
// render. That second use is gone -- the cell button layer now reads
// cellTiles.ts's world-anchored TileRange instead (see useCellTiles.ts and
// GridCells.tsx), which is pan-stable in a way a fresh VisibleRange every
// render never was. This module no longer has a cell-enumeration function;
// it stays camera-exact because the ruler's correctness depends on that,
// unlike the cell layer's.

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

// The keyboard focus cursor's own range: which cells render FULLY inside the
// viewport, no VISIBLE_BUFFER_CELLS margin and no partially-clipped edge
// cell either. computeVisibleRange answers "what might need a DOM node" (the
// ruler's use, and the old cell-enumeration use this module's header
// describes as gone); this answers "what a keyboard user can actually see
// in full" -- Home/End and the edge-reveal scenarios in
// keyboard-grid-navigation.feature are stated against that stricter
// boundary, and computing them from the buffered range would land the
// focus cursor two cells off from where the scenario expects it.
//
// A cell x is fully inside the viewport iff worldToScreen(camera, x, y).x is
// >= 0 and worldToScreen(camera, x + 1, y).x <= widthPx (i.e. neither edge
// of the cell's own screen box is clipped). Solved for the integer x this
// gives minX = ceil(offsetX) and maxX = floor(offsetX + widthPx / cellSize)
// - 1 -- NOT coveringTileRange's floor/ceil-minus-one pair, which
// deliberately includes a partially-visible edge cell because it answers a
// different question (what must be MOUNTED to avoid a hole, not what is
// fully ON SCREEN). The `|| 0` normalizes the -0 Math.ceil/Math.floor can
// produce at a camera offset that lands exactly on a cell boundary (the
// same defensive normalization gridlinesInRange uses above, for the same
// reason -- see computeMajorGridlines' own -0 regression test).
//
// Clamped so maxX never falls below minX (an empty range would make
// centerCell and jumpToRowEdge's "furthest cell" answer undefined) -- the
// same clamp shape coveringTileRange uses for the pre-measurement 0x0
// viewport case.
export function computeOnScreenRange(camera: Camera, viewportWidthPx: number, viewportHeightPx: number): VisibleRange {
  const minX = Math.ceil(camera.offsetX) || 0
  const minY = Math.ceil(camera.offsetY) || 0
  const maxX = Math.max(minX, Math.floor(camera.offsetX + viewportWidthPx / camera.cellSize) - 1)
  const maxY = Math.max(minY, Math.floor(camera.offsetY + viewportHeightPx / camera.cellSize) - 1)
  return { minX, maxX, minY, maxY }
}

// Proper modulo (always non-negative for a positive `period`), unlike JS's
// `%` which keeps the sign of its left operand -- (-5) % 20 === -5, not 15.
function positiveMod(value: number, period: number): number {
  return ((value % period) + period) % period
}

// The pixel offset a CSS repeating background pattern needs (as its own
// background-position) to align a grid line to world coordinate 0, at both
// the per-cell (minor) and every-MAJOR_GRIDLINE_INTERVAL-cells (major)
// period -- the phase Cell.tsx's own per-button border classes currently
// encode implicitly, and this module's future caller draws as a background
// instead once dead cells no longer carry an element of their own to put a
// border on.
//
// worldToScreen(camera, 0, y).x is exactly -offsetX * cellSize -- the
// screen-space position world x=0 currently sits at -- so that is the raw
// phase; positiveMod wraps it into [0, period) so a background-position
// declaration never carries an arbitrarily large (or negative) offset.
export interface GridLinePhase {
  minorXPx: number
  minorYPx: number
  majorXPx: number
  majorYPx: number
}

export function gridLinePhasePx(camera: Camera): GridLinePhase {
  const minorPeriod = camera.cellSize
  const majorPeriod = camera.cellSize * MAJOR_GRIDLINE_INTERVAL
  const rawXPx = -camera.offsetX * camera.cellSize
  const rawYPx = -camera.offsetY * camera.cellSize
  return {
    minorXPx: positiveMod(rawXPx, minorPeriod),
    minorYPx: positiveMod(rawYPx, minorPeriod),
    majorXPx: positiveMod(rawXPx, majorPeriod),
    majorYPx: positiveMod(rawYPx, majorPeriod),
  }
}
