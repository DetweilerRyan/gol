import { slotIndex, slotPixelPosition, slotWorldCoordinate } from '../cellLattice'
import type { LiveCellStore } from '../liveCellStore'
import Cell from './Cell'

interface GridCellsProps {
  originX: number
  originY: number
  cols: number
  rows: number
  cellSize: number
  store: LiveCellStore
  onActivateCell: (x: number, y: number) => void
}

// The cell button layer, rendered as a fixed lattice of render "slots" (see
// cellLattice.ts) rather than from a camera-derived cells array: every prop
// here is pan-stable -- none of originX/originY/cols/rows/cellSize changes on
// a sub-cell pan tick, only the transformed layer div Grid wraps this in
// does (see Grid.tsx) -- which is what lets a pan stop re-rendering cells at
// all instead of walking every visible cell every frame.
//
// The React key is the slot's own linear index (slotIndex -- row-major,
// matching the nested loop order below), not the world coordinate: a slot's identity is
// "this position in the lattice," and keying on the world coordinate would
// force React to remount every cell on every pan tick, since the world
// coordinate a slot holds changes on every pan -- even a sub-cell one that
// doesn't rebase the lattice at all. Keying by index instead means a rebase
// (the lattice's origin moving, cols/rows unchanged) re-renders every Cell
// with new x/y props -- a new aria-label, a new store subscription key --
// but reuses the same DOM node rather than tearing it down. Only a zoom
// (cellSize change, which changes cols/rows) actually remounts everything,
// because the slot-index keyspace itself changes shape then.
//
// The placing-mode preview overlay used to live here too; it's now
// PatternPreview.tsx, rendered by Grid as a following sibling of this
// component -- see Grid.test.tsx's DOM-order assertion.
//
// This component owns slot-to-pixel mapping end to end: it derives each
// slot's pixel position and hands Cell the finished CSS transform, rather
// than passing leftPx/topPx numbers for Cell to concatenate. Cell holds no
// pixel geometry of its own as a result -- see Cell.tsx.
//
// Aliveness itself is no longer computed here -- each Cell subscribes to its
// own membership via useLiveCell(store, key), so a generation only re-renders
// the cells that actually changed. See liveCellStore.ts's module header.
export default function GridCells({ originX, originY, cols, rows, cellSize, store, onActivateCell }: GridCellsProps) {
  const slots: React.ReactNode[] = []
  for (let j = 0; j < rows; j++) {
    const y = slotWorldCoordinate(originY, j)
    const topPx = slotPixelPosition(j, cellSize)
    for (let i = 0; i < cols; i++) {
      const x = slotWorldCoordinate(originX, i)
      const leftPx = slotPixelPosition(i, cellSize)
      slots.push(
        <Cell
          key={slotIndex(i, j, cols)}
          x={x}
          y={y}
          cellSize={cellSize}
          transform={`translate(${leftPx}px, ${topPx}px)`}
          store={store}
          onActivate={onActivateCell}
        />,
      )
    }
  }
  return <>{slots}</>
}
