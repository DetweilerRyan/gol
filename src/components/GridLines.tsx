import type { Camera } from '../camera'
import { gridLinePhasePx, MAJOR_GRIDLINE_INTERVAL } from '../gridGeometry'

interface GridLinesProps {
  camera: Camera
}

// Was staged pixel-for-pixel behind Cell.tsx's own per-cell border at step 2
// of collapse-dead-cell-layer, invisible until step 4 deleted that border --
// this is now the ONLY gridline source in the app: a 1px gray-200 line for
// every cell boundary, widened to 2px gray-400 every MAJOR_GRIDLINE_INTERVAL
// cells (the same convention Cell.tsx's isMajorGridline used to draw one
// cell's own edge at a time). The CSS custom properties are Tailwind v4's own
// generated theme variables (see dist/assets/*.css's `--color-gray-*` after a
// build) -- reading them rather than restating a hex literal is what keeps
// this in sync with the design system without a shared constant.
//
// Carries its own board (bg-board) base fill, deliberately, for the same
// reason: a dead cell used to paint solid white (border-gray-200 + bg-white),
// and dead cells mostly don't mount at all any more -- without a base fill
// here, the gaps between live cells would show #grid-content's own
// background through instead, a visible appearance change nothing asked
// for. See Cell.tsx's own header for the one place that fill is deliberately
// NOT repeated: a dead, focused cell (liveCellWindow.ts's +1) stays fully
// transparent, so it doesn't punch a hole of the board's own colour in these
// lines.
//
// bg-board / --color-board-line-* rather than bg-white / --color-gray-*
// literals -- see src/index.css's own comment on why these are declared as
// tokens rather than plain Tailwind colours: this component reads them
// through a raw CSS var (inline backgroundImage, below), which a dark:
// utility variant can't reach at all, so the token has to re-bind itself
// under html.dark instead.
const MINOR_LINE_COLOR = 'var(--color-board-line-minor)'
const MAJOR_LINE_COLOR = 'var(--color-board-line-major)'
const MINOR_LINE_WIDTH_PX = 1
const MAJOR_LINE_WIDTH_PX = 2

// A hard-stop gradient occupying [0, widthPx) of one repeat tile, everything
// after that transparent -- the same "border occupies the leading edge of
// its own box, inward" geometry a border-box CSS border already has. Two
// axes, one shape: `to right` for a vertical line (offset varies along X,
// full height), `to bottom` for a horizontal line (offset varies along Y,
// full width) -- see the background-size pairing below for how each stays a
// full-height/width strip rather than a small tile.
function lineImage(direction: 'to right' | 'to bottom', color: string, widthPx: number): string {
  return `linear-gradient(${direction}, ${color} 0, ${color} ${widthPx}px, transparent ${widthPx}px, transparent 100%)`
}

// The single-node, untransformed, camera-exact host the collapse-dead-cell-layer
// design ratified over the idea file's original "gradient on the transformed
// layer" sketch: that layer's own translate reaches +-245,760px at
// MAX_CELL_SIZE once cellAnchor.ts's ANCHOR_DRIFT_CELLS margin is spent (see
// cellAnchor.ts's own header), which carries a `background-image` off the
// viewport entirely -- a bug invisible until a long pan. This component sits
// outside that layer, sized to the viewport itself (absolute inset-0, no
// transform), and recomputes its background-position every render straight
// from `camera` via gridGeometry.ts's gridLinePhasePx -- the same shape
// PatternPreview.tsx already uses for "camera-exact, bounded cost, outside
// the transformed layer" (see that component's own header). Cost here is one
// style recompute per render, not per line -- there is exactly one DOM node.
//
// pointer-events-none (this is decoration, never a hit target) and
// aria-hidden (nothing here is content -- it's purely presentational, the
// same status a CSS background always had before this component existed).
//
// Rendered as #grid-content's FIRST child, before the transformed layer div
// wrapping GridCells -- "first" is load bearing for CSS painting order
// (later-in-DOM wins for equal-stacking-level boxes, the same rule
// PatternPreview's own header cites), so this paints furthest back and every
// mounted, alive Cell's own opaque background paints over it wherever the
// two overlap -- see Grid.tsx's own comment at the render site for the full
// occlusion picture, including the one case (a dead, focused cell) that
// deliberately does NOT occlude it.
export default function GridLines({ camera }: GridLinesProps) {
  const { minorXPx, minorYPx, majorXPx, majorYPx } = gridLinePhasePx(camera)
  const minorPeriodPx = camera.cellSize
  const majorPeriodPx = camera.cellSize * MAJOR_GRIDLINE_INTERVAL

  // Order is significant, not cosmetic: CSS paints the FIRST background
  // layer closest to the viewer, so listing the major (thicker, darker)
  // lines first makes them win at every intersection with a minor line --
  // the same outcome Cell.tsx gets by overriding a major cell's left/top
  // border class rather than letting the two borders combine.
  const backgroundImage = [
    lineImage('to right', MAJOR_LINE_COLOR, MAJOR_LINE_WIDTH_PX),
    lineImage('to bottom', MAJOR_LINE_COLOR, MAJOR_LINE_WIDTH_PX),
    lineImage('to right', MINOR_LINE_COLOR, MINOR_LINE_WIDTH_PX),
    lineImage('to bottom', MINOR_LINE_COLOR, MINOR_LINE_WIDTH_PX),
  ].join(', ')

  // Each layer is a full-height (vertical line) or full-width (horizontal
  // line) strip, `periodPx` wide/tall -- the browser then tiles that single
  // strip across the whole element via the default `background-repeat:
  // repeat`, so no explicit repeat declaration is needed.
  const backgroundSize = [
    `${majorPeriodPx}px 100%`,
    `100% ${majorPeriodPx}px`,
    `${minorPeriodPx}px 100%`,
    `100% ${minorPeriodPx}px`,
  ].join(', ')

  // The only coordinate that matters per layer is the one the line's offset
  // varies along (X for a vertical line, Y for a horizontal one) -- the
  // other axis is uniform across the whole strip, so it's pinned to 0.
  const backgroundPosition = [`${majorXPx}px 0`, `0 ${majorYPx}px`, `${minorXPx}px 0`, `0 ${minorYPx}px`].join(', ')

  return (
    <div
      aria-hidden="true"
      className="bg-board pointer-events-none absolute inset-0"
      style={{ backgroundImage, backgroundSize, backgroundPosition }}
    />
  )
}
