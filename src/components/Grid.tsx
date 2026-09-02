import { useRef, type ReactNode } from 'react'
import { screenToWorld, type Camera, type WheelInput } from '../camera'
import { computeVisibleRange, type VisibleRange } from '../gridGeometry'
import { useCellTiles } from '../hooks/useCellTiles'
import { useElementSize, type ElementSize } from '../hooks/useElementSize'
import { useGridPointerGestures } from '../hooks/useGridPointerGestures'
import { useInitialCentering } from '../hooks/useInitialCentering'
import { useRafCoalescedPan } from '../hooks/useRafCoalescedPan'
import { useWheelInput } from '../hooks/useWheelInput'
import type { LiveCellStore } from '../liveCellStore'
import GridCells from './GridCells'
import GridLines from './GridLines'
import PatternPreview from './PatternPreview'

export interface GridOverlayContext {
  size: ElementSize
  visibleRange: VisibleRange
}

export const GRID_CONTENT_ID = 'grid-content'

interface GridProps {
  camera: Camera
  store: LiveCellStore
  previewPositions: ReadonlyArray<readonly [number, number]>
  isPatternArmed: boolean
  onToggleCell: (x: number, y: number) => void
  onStampPattern: (x: number, y: number) => void
  onPan: (dxPixels: number, dyPixels: number) => void
  onPreviewCell: (x: number, y: number) => void
  onWheelInput: (input: WheelInput) => void
  onFirstMeasure: (widthPx: number, heightPx: number) => void
  renderOverlays: (context: GridOverlayContext) => ReactNode
}

export default function Grid({
  camera,
  store,
  previewPositions,
  isPatternArmed,
  onToggleCell,
  onStampPattern,
  onPan,
  onPreviewCell,
  onWheelInput,
  onFirstMeasure,
  renderOverlays,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerSize = useElementSize(containerRef)

  useWheelInput(containerRef, onWheelInput)
  useInitialCentering(containerSize, onFirstMeasure)

  const visibleRange = computeVisibleRange(camera, containerSize.width, containerSize.height)
  const tiles = useCellTiles(camera, containerSize)

  // Single-shot stamping (disarming immediately after a placement) belongs to
  // whoever owns the placement state -- usePatternPlacement's
  // stampArmedPattern -- not here: this branch only decides which of the two
  // upward callbacks a given activation resolves to.
  //
  // Declared as a const arrow above its first use (rather than a hoisted
  // function declaration below it, as this used to read) so React Compiler
  // memoizes it against its own dependencies (isPatternArmed, onStampPattern,
  // onToggleCell) -- see the compiled output referenced from Grid.test.tsx's
  // tile pan-stability tests. A function declaration referenced from
  // inside the onTap closure below it compiled to a fresh function every
  // render, which defeated GridCells' own memoization even though every
  // tile-derived prop it receives was unchanged.
  const activateCell = (x: number, y: number) => {
    if (isPatternArmed) {
      onStampPattern(x, y)
    } else {
      onToggleCell(x, y)
    }
  }

  // Coalesces however many pointermove-driven onPan calls land within one
  // animation frame into a single call carrying their sum -- a real win for
  // trackpad input, which can deliver several pointermoves per frame; a
  // once-per-frame mouse cadence has nothing to coalesce either way. See
  // useRafCoalescedPan's own header for the invariant (net shift == sum of
  // pushes, regardless of flush timing) this must preserve.
  const coalescedPan = useRafCoalescedPan(onPan)

  // trackHover mirrors the isPatternArmed check the place-vs-toggle branch
  // above also makes: only in placing mode does a pointermove need
  // pointer-to-world resolution for the preview, so an ordinary pan drag
  // doesn't pay for that per-move getBoundingClientRect call. See
  // useGridPointerGestures for the guard itself.
  const { isPanning, handlers } = useGridPointerGestures({
    trackHover: isPatternArmed,
    onPan: coalescedPan.push,
    // Flushes synchronously on release/cancel so a pan mid-frame settles
    // immediately rather than waiting on a queued animation frame -- see
    // useGridPointerGestures' onPanEnd doc comment for why it must run
    // first, before capture release or tap resolution.
    onPanEnd: coalescedPan.flush,
    onTap: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      activateCell(x, y)
    },
    onHover: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      onPreviewCell(x, y)
    },
  })

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Owns the pan/toggle pointer handlers and sits below every overlay the
          caller supplies (today: ruler, zoom%, scrollbars, toolbar, modal) as
          a sibling rather than an ancestor, so overlay pointer events never
          bubble into these
          handlers in the first place -- no stopPropagation/open-state guards
          needed on either side. inset-0 keeps its rect identical to the
          outer container's, which useGridPointerGestures' pointer handlers
          and useWheelInput both rely on. The overlay slot below is invoked as
          a following sibling of this div, inside the same parent, for the
          same reason: callers supply *what* the overlays are, never *where*
          they sit, so this sibling-not-ancestor layering can't be broken
          from outside Grid. */}
      <div
        id={GRID_CONTENT_ID}
        {...handlers}
        className={`absolute inset-0 touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* NO transform here -- #grid-content's client rect is load-bearing.
            useGridPointerGestures and useWheelInput both call
            getBoundingClientRect() on this element, and a transform here
            would shift that rect, silently resolving every tap/hover to the
            wrong world cell (rectRelativePixels -> screenToWorld). The
            transform that makes a pan pan-stable-cell-cheap lives one level
            deeper, on the layer div below, which affects only where its
            children paint, not this element's own rect. */}
        {/* GridLines paints first -- furthest back in stacking order for two
            same-level absolutely-positioned siblings -- so every mounted Cell's
            own opaque border/background fully occludes it today. See
            GridLines.tsx's own header for why it sits here, untransformed,
            rather than as a background on the transformed layer div below. */}
        <GridLines camera={camera} />

        {/* Grid -> GridCells is a real component edge, kept even though every
            other sibling component was inverted into the overlay slot: cells
            must render *inside* #grid-content, and owning that containment is
            exactly why Grid exists as a component rather than folding into
            LifeBoard. Do not invert this edge too. */}
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${tiles.offsetXPx}px, ${tiles.offsetYPx}px)`, willChange: 'transform' }}
        >
          <GridCells
            range={tiles.range}
            anchorX={tiles.anchorX}
            anchorY={tiles.anchorY}
            cellSize={tiles.cellSize}
            store={store}
            onActivateCell={activateCell}
          />
        </div>

        {/* PatternPreview renders after GridCells' layer, deliberately: both
            are absolutely positioned with auto z-index, so later-in-DOM wins,
            and the preview must paint over the cell buttons rather than
            behind them. See Grid.test.tsx's DOM-order assertion below. It
            stays outside the transformed layer and camera-exact -- see
            PatternPreview.tsx. */}
        <PatternPreview camera={camera} positions={previewPositions} />
      </div>

      {renderOverlays({ size: containerSize, visibleRange })}
    </div>
  )
}
