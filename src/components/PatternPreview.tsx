import { worldToScreen, type Camera } from '../camera'

interface PatternPreviewProps {
  camera: Camera
  positions: ReadonlyArray<readonly [number, number]>
}

/**
 * The placing-mode preview overlay: renders one highlighted cell per
 * `positions` entry, camera-exact (`worldToScreen` recomputed every
 * render) -- fine here because it's bounded by however many cells the
 * armed pattern covers, not by the whole viewport.
 *
 * Render as a sibling AFTER GridCells inside `#grid-content` -- both are
 * absolutely positioned with auto z-index, so later-in-DOM wins, and the
 * preview must paint after the cell buttons or it disappears behind them.
 */
// Split out of GridCells so the cell button layer could move into the
// pan-stable, world-anchored tile range (see useCellTiles.ts) while this
// stays camera-exact. Nothing in e2e/ covers preview stacking, so keeping
// the DOM-order precondition above as a Grid.test.tsx assertion is what
// keeps it inside a tested unit rather than untested composition.
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
