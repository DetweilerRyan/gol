import { cellOffsetPx } from '../cellAnchor'
import type { FocusCell } from '../gridFocus'
import type { WindowCell } from '../liveCellWindow'
import Cell from './Cell'

interface GridCellsProps {
  /**
   * The render window itself: already filtered to exactly the live-in-range
   * cells (plus the focus cursor's own cell, per liveCellsInRange's +1
   * guarantee), pre-sorted in row-major order, each keyed by its own stable
   * CellKey string. GridCells does not decide which cells are live-in-range;
   * it only lays out what it's given.
   */
  cells: WindowCell[]
  anchorX: number
  anchorY: number
  cellSize: number
  onActivateCell: (x: number, y: number) => void
  /**
   * Which of `cells` (if any) is the roving-tabindex keyboard cursor -- see
   * useGridFocus.ts. Compared against every entry in `cells` by coordinate
   * rather than joined structurally.
   */
  focus: FocusCell
}

/**
 * The cell layer: renders one Cell per entry in `cells` -- a dead cell
 * costs nothing here at all unless it happens to be the focus cursor.
 */
// Replaces collapse-dead-cell-layer's pre-step-4 "CellTile per tile in
// range, dead or alive" renderer. The CellTile component is deleted along with the
// tile-slot loop it used to wrap; the intra-tile pixel math (cellOffsetPx)
// it owned moves down into this component instead, since there is no longer
// a tile-sized unit to own it.
//
// A live cell keeps the same CellKey for as long as it stays alive, so
// React reconciles a cell that merely moves in and out of `cells`' filtered
// view (a pan crossing the window boundary) as a mount/unmount of that one
// element, never a remount of anything else in the array -- unlike
// CellTile's intra-tile linear index, which only ever had to be unique
// within one fixed-shape tile.
//
// Aliveness is no longer computed here or subscribed to per cell -- each
// WindowCell already carries its own isAlive, read once by Grid's
// liveCellsInRange call against the whole store snapshot (see
// hooks/useLiveCells.ts). Cell.tsx no longer owns a useLiveCell subscription
// of its own; see that component's header for the consequence (a generation
// tick now re-renders every mounted cell, not just the ones that flipped).
export default function GridCells({ cells, anchorX, anchorY, cellSize, onActivateCell, focus }: GridCellsProps) {
  return (
    <>
      {cells.map(({ key, x, y, isAlive }) => {
        const leftPx = cellOffsetPx(x, anchorX, cellSize)
        const topPx = cellOffsetPx(y, anchorY, cellSize)
        return (
          <Cell
            key={key}
            x={x}
            y={y}
            cellSize={cellSize}
            transform={`translate(${leftPx}px, ${topPx}px)`}
            isAlive={isAlive}
            onActivate={onActivateCell}
            isFocused={x === focus.x && y === focus.y}
          />
        )
      })}
    </>
  )
}
