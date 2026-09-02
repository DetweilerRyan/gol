import { worldToScreen, type Camera } from '../camera'

interface HoverIndicatorProps {
  camera: Camera
  hovered: { x: number; y: number } | null
}

// The single cursor-following affordance that replaces ~19,680 per-cell
// `hover:bg-gray-100`/`hover:bg-gray-700` rules (collapse-dead-cell-layer
// step 4) -- see Cell.tsx's own header for why those had to go: most of the
// grid's area is unmounted dead cells now, and CSS :hover has nothing to
// attach to there.
//
// Camera-exact like PatternPreview.tsx (worldToScreen recomputed every
// render, not the pan-stable transformed layer GridCells sits inside) and
// for the same reason that component gives -- bounded cost, here by "at most
// one hovered cell" rather than by an armed pattern's size. Grid resolves
// `hovered` from the SAME pixel->world path as a click (screenToWorld off
// pointer-relative pixels), which is this slice's own inherited acceptance
// criterion from the idea file: "the hover indicator and the click must
// resolve to the same cell at every point" -- today's CSS :hover went
// through the browser's own hit-test path instead, which measured ~0.9px
// looser than screenToWorld at every zoom/DPR, a real (if tiny) hover/click
// disagreement band this removes by construction rather than patching.
//
// pointer-events-none so hovering the indicator itself can never block the
// pointermove tracking that feeds it. Renders BEFORE PatternPreview in DOM
// order (see Grid.tsx) so an armed pattern's preview paints over it rather
// than under it -- the two affordances would otherwise fight for the same
// pixels while a pattern is being aimed.
export default function HoverIndicator({ camera, hovered }: HoverIndicatorProps) {
  if (hovered === null) return null
  const { x: left, y: top } = worldToScreen(camera, hovered.x, hovered.y)
  return (
    <div
      aria-hidden="true"
      style={{
        width: camera.cellSize,
        height: camera.cellSize,
        transform: `translate(${left}px, ${top}px)`,
        boxSizing: 'border-box',
      }}
      className="pointer-events-none absolute top-0 left-0 bg-gray-500/20"
    />
  )
}
