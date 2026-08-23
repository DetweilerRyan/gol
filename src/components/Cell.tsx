import { cellKey } from '../gameOfLife'
import { isMajorGridline } from '../gridGeometry'
import { useLiveCell } from '../hooks/useLiveCell'
import type { LiveCellStore } from '../liveCellStore'

interface CellProps {
  x: number // world coordinate: aria-label, gridline classes, store key
  y: number
  cellSize: number
  transform: string // finished CSS transform placing this cell -- see CellTile
  store: LiveCellStore
  onActivate: (x: number, y: number) => void
}

// One cell button, split out so it can own its own aliveness subscription:
// useLiveCell(store, key) means a generation only re-renders the cells whose
// membership actually flipped, instead of every visible cell re-rendering
// because liveCells is a prop-drilled Set with a new identity each tick --
// see liveCellStore.ts's module header. The key is computed once here (not
// passed down from CellTile's map) so getCellSnapshot stays an
// allocation-free Set.has rather than building a string every render.
//
// Takes plain scalars rather than a Camera: a Camera's identity changes on
// every pointermove during a pan, and this component sits at the base of the
// render tree CellTile maps over, so a Camera-typed prop here would defeat
// the world-anchored tile range CellTile reads from (see cellTiles.ts and
// cellAnchor.ts) -- every Cell would still re-render on every pan tick even
// though its own world position never moved.
//
// Positioning arrives as a finished `transform` string rather than as
// leftPx/topPx numbers this component would concatenate itself. Cell-to-pixel
// mapping is CellTile's job end to end (it owns the cellOffsetPx calls);
// splitting it -- caller derives the pixels, callee formats them, and both
// hold cellSize -- put half of one derivation on each side of the boundary.
// Cell now knows only its world coordinate and how to paint what it is told.
export default function Cell({ x, y, cellSize, transform, store, onActivate }: CellProps) {
  const key = cellKey(x, y)
  const isAlive = useLiveCell(store, key)
  return (
    <button
      type="button"
      aria-label={`Cell ${x}, ${y}`}
      // Not aria-checked: ARIA 1.2 limits aria-checked to checkbox, radio,
      // switch, option, menuitemcheckbox, menuitemradio and treeitem -- it
      // is not a supported state of role="button", so on this element it
      // would be invalid ARIA that assistive tech may simply ignore.
      // aria-pressed IS the supported toggle-button state. Always rendered
      // (never omitted for a dead cell, not even as a perf optimisation) --
      // omitting it means "this is not a toggle button at all", a different
      // and wrong statement from "pressed=false".
      aria-pressed={isAlive}
      // Keyboard activation (Enter/Space) never goes through pointer
      // capture (see useGridPointerGestures' pointer-capture comment),
      // so it needs the same place-vs-toggle branch as the pointer
      // path.
      onClick={() => onActivate(x, y)}
      style={{
        width: cellSize,
        height: cellSize,
        transform,
        boxSizing: 'border-box',
      }}
      // No transition-colors: a generation step flips thousands of cells at
      // once, and animating every one of those class changes simultaneously
      // is real paint cost this project can't afford at the frame budgets
      // perf/ tests against.
      className={`absolute top-0 left-0 border border-gray-200 ${
        isAlive ? 'bg-gray-900 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
      } ${isMajorGridline(x) ? 'border-l-2 border-l-gray-400' : ''} ${isMajorGridline(y) ? 'border-t-2 border-t-gray-400' : ''}`}
    />
  )
}
