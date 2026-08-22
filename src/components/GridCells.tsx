import { worldToScreen, type Camera } from '../camera'
import { cellKey } from '../gameOfLife'
import type { LiveCellStore } from '../liveCellStore'
import Cell from './Cell'

interface GridCellsProps {
  camera: Camera
  cells: readonly { x: number; y: number }[]
  store: LiveCellStore
  previewPositions: ReadonlyArray<readonly [number, number]>
  onActivateCell: (x: number, y: number) => void
}

// The cell button layer and the placing-mode preview overlay, kept in one
// component and in this DOM order deliberately: the preview must render
// *after* the cells or it disappears behind them (both are absolutely
// positioned with auto z-index, so later-in-DOM wins), and nothing in e2e/
// covers preview stacking -- keeping both here keeps that ordering inside a
// tested unit rather than pushing it into untested composition.
//
// Aliveness itself is no longer computed here -- each Cell subscribes to its
// own membership via useLiveCell(store, key), so a generation only re-renders
// the cells that actually changed. See liveCellStore.ts's module header.
export default function GridCells({ camera, cells, store, previewPositions, onActivateCell }: GridCellsProps) {
  return (
    <>
      {cells.map(({ x, y }) => (
        <Cell key={cellKey(x, y)} x={x} y={y} camera={camera} store={store} onActivate={onActivateCell} />
      ))}

      {/* Placing-mode preview. pointer-events-none so hovering the preview
          itself doesn't block the underlying pointermove tracking. */}
      {previewPositions.map(([x, y]) => {
        const { x: left, y: top } = worldToScreen(camera, x, y)
        return (
          <div
            key={`preview-${x}-${y}`}
            aria-label={`Pattern preview cell ${x}, ${y}`}
            style={{
              width: camera.cellSize,
              height: camera.cellSize,
              transform: `translate(${left}px, ${top}px)`,
              boxSizing: 'border-box',
            }}
            className="pointer-events-none absolute top-0 left-0 border border-green-600 bg-green-400/60"
          />
        )
      })}
    </>
  )
}
