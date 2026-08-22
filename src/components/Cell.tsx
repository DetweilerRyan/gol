import { cellKey } from '../gameOfLife'
import { isMajorGridline } from '../gridGeometry'
import { useLiveCell } from '../hooks/useLiveCell'
import type { LiveCellStore } from '../liveCellStore'

interface CellProps {
  x: number // world coordinate: aria-label, gridline classes, store key
  y: number
  leftPx: number
  topPx: number
  cellSize: number
  store: LiveCellStore
  onActivate: (x: number, y: number) => void
}

// One cell button, split out of GridCells so it can own its own aliveness
// subscription: useLiveCell(store, key) means a generation only re-renders
// the cells whose membership actually flipped, instead of every visible cell
// re-rendering because liveCells is a prop-drilled Set with a new identity
// each tick -- see liveCellStore.ts's module header. The key is computed once
// here (not passed down from GridCells' map) so getCellSnapshot stays an
// allocation-free Set.has rather than building a string every render.
//
// Takes leftPx/topPx/cellSize as plain scalars rather than a Camera: a
// Camera's identity changes on every pointermove during a pan, and this
// component sits at the base of the render tree GridCells maps over, so a
// Camera-typed prop here would defeat the pan-stable lattice GridCells reads
// from (see useCellLattice.ts) -- every Cell would still re-render on every
// pan tick even though its own world position never moved. leftPx/topPx come
// from the lattice's per-slot pixel math, not from worldToScreen(camera, x, y)
// -- see GridCells.tsx.
export default function Cell({ x, y, leftPx, topPx, cellSize, store, onActivate }: CellProps) {
  const key = cellKey(x, y)
  const isAlive = useLiveCell(store, key)
  return (
    <button
      type="button"
      aria-label={`Cell ${x}, ${y}`}
      // Keyboard activation (Enter/Space) never goes through pointer
      // capture (see useGridPointerGestures' pointer-capture comment),
      // so it needs the same place-vs-toggle branch as the pointer
      // path.
      onClick={() => onActivate(x, y)}
      style={{
        width: cellSize,
        height: cellSize,
        transform: `translate(${leftPx}px, ${topPx}px)`,
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
