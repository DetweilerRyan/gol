import { cellOffsetPx } from '../cellAnchor'
import type { FocusCell } from '../gridFocus'
import type { WindowCell } from '../liveCellWindow'
import Cell from './Cell'

interface GridCellsProps {
  // The render window itself -- Grid computes this once per render from
  // liveCellWindow.ts's liveCellsInRange(liveCells, tiles.range,
  // gridFocus.focus) and hands it down already filtered. GridCells no
  // longer decides which cells are live-in-range; it only lays them out.
  // See this slice's step-4 handoff for why that call lives in Grid rather
  // than here (its identity has to stay stable across a within-range pan
  // for React Compiler to bail on the unchanged tail of the tree, and its
  // three inputs -- the store's live-cell Set, the tile range, the focus
  // cursor -- are all already Grid's own values).
  cells: WindowCell[]
  anchorX: number
  anchorY: number
  cellSize: number
  onActivateCell: (x: number, y: number) => void
  // Which of `cells` (if any) is the roving-tabindex keyboard cursor -- see
  // useGridFocus.ts. Every entry in `cells` is compared against this by
  // coordinate rather than joined structurally, mirroring CellTile.tsx's own
  // former isFocused comparison one layer up before this replaced it.
  focus: FocusCell
}

// The cell layer, replacing collapse-dead-cell-layer's pre-step-4
// "CellTile per tile in range, dead or alive" renderer with "one Cell per
// entry in `cells`" -- exactly the live-cell set liveCellWindow.ts computed,
// so a dead cell costs nothing here at all unless it happens to be the focus
// cursor (liveCellsInRange's own +1 guarantee -- see that module's header).
// CellTile.tsx is deleted along with the tile-slot loop it used to wrap; the
// intra-tile pixel math (cellOffsetPx) it owned moves down into this
// component instead, since there is no longer a tile-sized unit to own it.
//
// `cells` arrives pre-sorted in row-major order (liveCellsInRange's own
// contract) and keyed by its own CellKey string -- a real, stable identity
// per live cell, unlike CellTile's intra-tile linear index, which only ever
// had to be unique within one fixed-shape tile. A live cell keeps the same
// key for as long as it stays alive, so React reconciles a cell that merely
// moves in and out of `cells`' filtered view (a pan crossing the window
// boundary) as a mount/unmount of that one element, never a remount of
// anything else in the array.
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
