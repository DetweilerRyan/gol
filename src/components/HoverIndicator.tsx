import { worldToScreen, type Camera } from '../camera'

interface HoverIndicatorProps {
  camera: Camera
  hovered: { x: number; y: number } | null
}

// The id this component's own DOM node carries, on the GRID_CONTENT_ID
// precedent in Grid.tsx: a stable, non-visual handle for anything that needs
// to reach this element without depending on its Tailwind paint class. Added
// alongside this slice's own corrective fix rather than as a separate pass --
// see the module comment below for why the class alone was never meant to be
// load-bearing.
export const HOVER_INDICATOR_ID = 'hover-indicator'

// The single cursor-following affordance that replaces ~19,680 per-cell
// `hover:bg-gray-100`/`hover:bg-gray-700` rules (collapse-dead-cell-layer
// step 4) -- see Cell.tsx's own header for why those had to go: most of the
// grid's area is unmounted dead cells now, and CSS :hover has nothing to
// attach to there.
//
// Camera-exact like PatternPreview.tsx (worldToScreen recomputed every
// render, not the pan-stable transformed layer GridCells sits inside) and
// for the same reason that component gives -- bounded cost, here by "at most
// one hovered cell" rather than by an armed pattern's size.
//
// THE INVARIANT THIS COMPONENT RENDERS, STATED ONCE HERE RATHER THAN
// RE-DERIVED AT EVERY CALL SITE: `hovered` must always equal
// screenToWorld(the CURRENT camera, the CURRENT pointer pixels) -- the same
// resolver a click uses, at the same instant. That is this slice's own
// inherited acceptance criterion (see the idea file): "the hover indicator
// and the click must resolve to the same cell at every point." This
// component itself has no way to keep that invariant -- it only paints
// whatever `hovered` it is handed via worldToScreen -- so the invariant is a
// contract on Grid.tsx's caller, not on this file. See Grid.tsx's own
// comment at lastPointerPixelsRef and its camera-change effect for how it is
// upheld: `hovered` is re-resolved from the last known pointer pixels
// whenever `camera` changes for ANY reason (a pointermove, a wheel-pan with
// the pointer stationary, a drag settling, or an arrow-key reveal-pan),
// which is what a naive "resolve once per pointermove" cache -- this
// component's own first implementation -- got wrong: it went stale the
// instant the camera moved without a pointer event, a measured, then-shipped
// regression against `main`'s browser-native :hover behavior. Corrected here
// pre-merge (architect ADJUDICATE); this paragraph intentionally states only
// the invariant and where it is upheld, not the defect's own numbers -- see
// this slice's git history for those.
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
      id={HOVER_INDICATOR_ID}
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
