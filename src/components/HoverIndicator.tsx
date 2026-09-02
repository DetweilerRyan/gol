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
// disagreement band this removes AT THE INSTANT THE POINTER MOVES.
//
// WHAT IT DOES NOT REMOVE -- MEASURED, AND OPEN. This paragraph used to end
// "removes by construction rather than patching". That overclaimed, and the
// correction is the whole point of this block: it is true of the ~0.9px
// band and FALSE of a camera that moves while the pointer does not.
// `hovered` is a WORLD cell resolved once per pointermove, and nothing
// re-resolves it when the camera changes underneath a stationary pointer --
// so the indicator stays glued to that world cell and rides the content
// away from the pointer, while a click still resolves from live pixels. The
// criterion above says "at every point"; between two pointermoves it does
// not hold. Measured in Chromium at the suite's own 1280x900 viewport, DPR
// 1, 100% zoom (architect ADJUDICATE; full probe table in that commit's
// message):
//
//   wheel-pan 130px, pointer stationary -- indicator at y=420, the pointer's
//     own cell drawn at y=540. 120px = 6 cells of disagreement, and one 1px
//     pointer move snaps it back, which is what says "stale", not "wrong
//     arithmetic".
//   drag-pan -- NOT correct by construction, correct by INPUT GRANULARITY:
//     off by the whole drag distance when the gesture arrives as one coarse
//     pointermove, exact when it arrives as 40 fine ones. A fine-grained
//     drag test passes here by luck.
//   shift+wheel ZOOM -- agrees, and structurally so: zoom-at-point holds the
//     world point under the cursor fixed, so its cell cannot change.
//   toolbar zoom / scrollbar drag -- indicator cleared, because the pointer
//     left the grid to reach the control. Benign.
//   arrow-key navigation -- same class, unmeasured: useGridFocus's moveFocus
//     reveal-pans the camera with the mouse resting wherever it was.
//
// AND IT IS A REGRESSION, which product's report could not yet claim: run on
// `main` (190dfde), the browser's own :hover chain -- the channel the old
// per-cell `hover:` classes painted from -- followed that same wheel-pan on
// its own and landed on exactly the cell the click toggles. Chromium
// re-runs hit-testing after the transform commits without needing a pointer
// event; this cache does not.
//
// RULED: fix, pre-merge, routed to `coder`. The invariant to restore is one
// sentence -- the indicator is screenToWorld(CURRENT camera, CURRENT pointer
// pixels), the click's own resolver at the same instant -- and it is the
// same single mechanism behind every failing route above. Whoever lands that
// owns rewriting this block to describe the mechanism that replaced the
// cache; do not leave this paragraph standing next to a fixed one.
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
