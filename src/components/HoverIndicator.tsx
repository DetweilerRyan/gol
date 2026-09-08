import { worldToScreen, type Camera } from '../camera'

interface HoverIndicatorProps {
  camera: Camera
  hovered: { x: number; y: number } | null
}

/**
 * The id this component's own DOM node carries, on the GRID_CONTENT_ID
 * precedent in Grid.tsx: a stable, non-visual handle for anything that needs
 * to reach this element without depending on its Tailwind paint class.
 */
// Added alongside collapse-dead-cell-layer's own corrective fix rather than as a separate
// pass -- see the module comment below for why the class alone was never
// meant to be load-bearing.
export const HOVER_INDICATOR_ID = 'hover-indicator'

/**
 * The single cursor-following hover affordance -- paints a highlight over
 * `hovered`, recomputed from `camera` on every render (no internal caching).
 *
 * `hovered` must always equal `screenToWorld(camera, pointerPixels)` at the
 * same instant camera and pointer are read -- this component has no way to
 * enforce that itself, so it's a contract on the caller (Grid.tsx), not on
 * this file. Render before PatternPreview in DOM order, so an armed
 * pattern's preview paints over the hover highlight rather than under it.
 */
// Replaces ~19,680 per-cell `hover:bg-gray-100`/`hover:bg-gray-700` rules
// (collapse-dead-cell-layer step 4) -- see Cell.tsx's own header for why
// those had to go: most of the grid's area is unmounted dead cells now, and
// CSS :hover has nothing to attach to there.
//
// Camera-exact like PatternPreview.tsx (worldToScreen recomputed every
// render, not the pan-stable transformed layer GridCells sits inside) and
// for the same reason that component gives -- bounded cost, here by "at most
// one hovered cell" rather than by an armed pattern's size.
//
// See Grid.tsx's own comment at lastPointerPixelsRef and its camera-change
// effect for how the invariant above is upheld: `hovered` is re-resolved
// from the last known pointer pixels whenever `camera` changes for ANY
// reason (a pointermove, a wheel-pan with the pointer stationary, a drag
// settling, or an arrow-key reveal-pan), which is what a naive "resolve once
// per pointermove" cache -- this component's own first implementation --
// got wrong: it went stale the instant the camera moved without a pointer
// event, a measured, then-shipped regression against `main`'s browser-native
// :hover behavior. Corrected here pre-merge (architect ADJUDICATE).
//
// pointer-events-none so hovering the indicator itself can never block the
// pointermove tracking that feeds it.
export default function HoverIndicator({ camera, hovered }: HoverIndicatorProps) {
  if (hovered === null) return null
  const { x: left, y: top } = worldToScreen(camera, hovered.x, hovered.y)
  return (
    <div
      id={HOVER_INDICATOR_ID}
      aria-hidden="true"
      style={{
        width: camera.cellSize,
        height: camera.cellSize,
        transform: `translate(${left}px, ${top}px)`,
        boxSizing: 'border-box',
      }}
      className="pointer-events-none absolute top-0 left-0 bg-gray-500/20 dark:bg-zinc-100/10"
    />
  )
}
