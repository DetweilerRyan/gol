import { worldToScreen, type Camera } from '../camera'
import { cellKey } from '../gameOfLife'
import { isMajorGridline } from '../gridGeometry'
import { useLiveCell } from '../hooks/useLiveCell'
import type { LiveCellStore } from '../liveCellStore'

interface CellProps {
  x: number
  y: number
  camera: Camera
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
export default function Cell({ x, y, camera, store, onActivate }: CellProps) {
  const key = cellKey(x, y)
  const isAlive = useLiveCell(store, key)
  const { x: left, y: top } = worldToScreen(camera, x, y)
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
        width: camera.cellSize,
        height: camera.cellSize,
        transform: `translate(${left}px, ${top}px)`,
        boxSizing: 'border-box',
      }}
      className={`absolute top-0 left-0 border border-gray-200 transition-colors ${
        isAlive ? 'bg-gray-900 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
      } ${isMajorGridline(x) ? 'border-l-2 border-l-gray-400' : ''} ${isMajorGridline(y) ? 'border-t-2 border-t-gray-400' : ''}`}
    />
  )
}
