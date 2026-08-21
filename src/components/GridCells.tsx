import { worldToScreen, type Camera } from '../camera'
import { cellKey, isCellAlive, type LiveCells } from '../gameOfLife'
import { isMajorGridline } from '../gridGeometry'

interface GridCellsProps {
  camera: Camera
  cells: readonly { x: number; y: number }[]
  liveCells: LiveCells
  previewPositions: ReadonlyArray<readonly [number, number]>
  onActivateCell: (x: number, y: number) => void
}

// The cell button layer and the placing-mode preview overlay, kept in one
// component and in this DOM order deliberately: the preview must render
// *after* the cells or it disappears behind them (both are absolutely
// positioned with auto z-index, so later-in-DOM wins), and nothing in e2e/
// covers preview stacking -- keeping both here keeps that ordering inside a
// tested unit rather than pushing it into untested composition.
export default function GridCells({ camera, cells, liveCells, previewPositions, onActivateCell }: GridCellsProps) {
  return (
    <>
      {cells.map(({ x, y }) => {
        const { x: left, y: top } = worldToScreen(camera, x, y)
        const isAlive = isCellAlive(liveCells, x, y)
        return (
          <button
            key={cellKey(x, y)}
            type="button"
            aria-label={`Cell ${x}, ${y}`}
            // Keyboard activation (Enter/Space) never goes through pointer
            // capture (see useGridPointerGestures' pointer-capture comment),
            // so it needs the same place-vs-toggle branch as the pointer
            // path.
            onClick={() => onActivateCell(x, y)}
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
      })}

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
