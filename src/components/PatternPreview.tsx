import { worldToScreen, type Camera } from '../camera'

interface PatternPreviewProps {
  camera: Camera
  positions: ReadonlyArray<readonly [number, number]>
}

// The placing-mode preview overlay, split out of GridCells so the cell button
// layer can move into the pan-stable lattice (see useCellLattice.ts) while
// this stays deliberately camera-exact: worldToScreen(camera, x, y) recomputes
// every position on every camera change, which is fine here because it's
// bounded by however many cells the armed pattern covers, not by the whole
// visible viewport. Grid renders this as a sibling *after* GridCells inside
// #grid-content, preserving the DOM order the previous single-component
// version relied on: the preview must paint after the cell buttons or it
// disappears behind them (both are absolutely positioned with auto z-index,
// so later-in-DOM wins) -- nothing in e2e/ covers preview stacking, so
// keeping that ordering as a Grid.test.tsx assertion is what keeps it inside
// a tested unit rather than untested composition.
//
// pointer-events-none so hovering the preview itself doesn't block the
// underlying pointermove tracking.
export default function PatternPreview({ camera, positions }: PatternPreviewProps) {
  return (
    <>
      {positions.map(([x, y]) => {
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
