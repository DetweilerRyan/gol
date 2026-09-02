import { cellKey, parseCellKey, type CellKey, type ReadonlyLiveCells } from './gameOfLife'
import { tileOriginCell, type TileRange } from './cellTiles'

// The live-cell rendering projection: which cells get a DOM element (a Cell
// button) this tick. Replaces "one Cell per mounted tile slot, dead or
// alive" with "one Cell per LIVE cell actually in range, plus the keyboard
// focus cursor's own cell" -- the whole point of collapse-dead-cell-layer,
// which measured an empty board costing the same as a 50,000-cell one under
// the old policy (see this slice's own handoff for the frame-time numbers).
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

// Every live cell within `range`, in row-major order (top-to-bottom,
// left-to-right within a row -- a stable, predictable order rather than
// `cells`' own Set insertion order), plus `focus`'s own cell whenever it
// isn't already one of those -- which covers both ways a focus cell can be
// missing from the live-in-range set: it sits outside `range` entirely, or
// it's dead (so it was never a candidate for the live-cell loop in the
// first place). Either way, `isAlive` is read fresh from `cells`, so a
// focused-but-dead cell costs exactly one extra WindowCell, never a whole
// tile's worth.
//
// Culls to `range` rather than returning every live cell regardless of
// camera position, which is what makes an off-screen live cell cost nothing.
// It does NOT settle what the black-box layers can observe, and the earlier
// form of this comment claimed it did: the focus +1 above can sit OUTSIDE
// `range`, so the mounted set is "live cells in the window, plus possibly
// one anywhere at all" -- not a window. infinite-grid.feature's
// "toHaveCount(0) on alive cells after panning away" holds because product's
// own step parks the keyboard cursor off the cells it asserts absent
// (features/screenplay/tasks.ts's parkKeyboardCursorAt), not because this
// function bounds the answer. A step that reads a cell count without
// establishing where the cursor is has a precondition, not a guarantee.
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
