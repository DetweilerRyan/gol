import { cellKey, parseCellKey, type CellKey, type ReadonlyLiveCells } from './gameOfLife'
import { tileOriginCell, type TileRange } from './cellTiles'

// The live-cell rendering projection: which cells get a DOM element (a Cell
// button) this tick. Replaces "one Cell per mounted tile slot, dead or
// alive" with "one Cell per LIVE cell actually in range, plus the keyboard
// focus cursor's own cell" -- the whole point of collapse-dead-cell-layer,
// which measured an empty board costing the same as a 50,000-cell one under
// the old policy (see collapse-dead-cell-layer's own handoff for the frame-time numbers).
//
// Sits above both gameOfLife.ts (the live-cell Set) and cellTiles.ts (the
// mounting-policy TileRange) -- the one sanctioned position for a module
// that touches both the game model and the camera-derived tiling side,
// mirroring scrollbars.ts's own position over camera.ts + gameOfLife.ts (see
// CLAUDE.md's Architecture section). Never imports gridFocus.ts or
// camera.ts directly: `focus` arrives as a plain world coordinate, computed
// by gridFocus.ts's own transitions, so this module stays agnostic to how a
// focus cell was chosen.

export interface WindowCell {
  key: CellKey
  x: number
  y: number
  /** False only for the injected focus-cursor cell; every other entry is live by construction. */
  isAlive: boolean
}

// Whether (x, y) falls within the world-cell bounds `range`'s tiles cover.
// tileOriginCell is the inverse of cellTiles.ts's tileIndexOf -- see that
// module's own comments for the floor-based, negative-safe convention.
function cellInRange(x: number, y: number, range: TileRange): boolean {
  const minX = tileOriginCell(range.minTileX, range.spanCells)
  const maxX = tileOriginCell(range.maxTileX, range.spanCells) + range.spanCells - 1
  const minY = tileOriginCell(range.minTileY, range.spanCells)
  const maxY = tileOriginCell(range.maxTileY, range.spanCells) + range.spanCells - 1
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function byRowMajor(a: WindowCell, b: WindowCell): number {
  return a.y !== b.y ? a.y - b.y : a.x - b.x
}

/**
 * Every live cell within `range`, in row-major order (top-to-bottom,
 * left-to-right within a row), plus `focus`'s own cell whenever it isn't
 * already one of those -- whether it sits outside `range` entirely or is
 * simply dead. Either way `isAlive` is read fresh from `cells`, so a
 * focused-but-dead cell costs exactly one extra WindowCell, never a whole
 * tile's worth.
 *
 * Culls to `range`, which is what makes an off-screen live cell cost
 * nothing -- but that is NOT the same as bounding what a caller can
 * observe: the focus cell above can sit OUTSIDE `range`, so an empty result
 * does not by itself mean nothing renders alive. A caller relying on that
 * must also establish where the focus cursor is.
 */
// The earlier form of this comment claimed this function itself settles
// what the black-box layers can observe; it doesn't. infinite-grid.feature's
// "toHaveCount(0) on alive cells after panning away" holds because product's
// own step parks the keyboard cursor off the cells it asserts absent
// (features/screenplay/tasks.ts's parkKeyboardCursorAt).
export function liveCellsInRange(
  cells: ReadonlyLiveCells,
  range: TileRange,
  focus: { x: number; y: number } | null,
): WindowCell[] {
  const result: WindowCell[] = []
  for (const key of cells) {
    const [x, y] = parseCellKey(key)
    if (cellInRange(x, y, range)) {
      result.push({ key, x, y, isAlive: true })
    }
  }
  result.sort(byRowMajor)

  if (focus !== null) {
    const focusKey = cellKey(focus.x, focus.y)
    const alreadyIncluded = result.some((cell) => cell.key === focusKey)
    if (!alreadyIncluded) {
      result.push({ key: focusKey, x: focus.x, y: focus.y, isAlive: cells.has(focusKey) })
      result.sort(byRowMajor)
    }
  }

  return result
}
