import { useRef, type ReactNode } from 'react'
import { screenToWorld, type Camera, type WheelInput } from '../camera'
import { type LiveCells } from '../gameOfLife'
import { cellsInRange, computeVisibleRange, type VisibleRange } from '../gridGeometry'
import { useElementSize, type ElementSize } from '../hooks/useElementSize'
import { useGridPointerGestures } from '../hooks/useGridPointerGestures'
import { useInitialCentering } from '../hooks/useInitialCentering'
import { useWheelInput } from '../hooks/useWheelInput'
import GridCells from './GridCells'

export interface GridOverlayContext {
  size: ElementSize
  visibleRange: VisibleRange
}

export const GRID_CONTENT_ID = 'grid-content'

interface GridProps {
  camera: Camera
  liveCells: LiveCells
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
  liveCells,
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
  const cells = cellsInRange(visibleRange)

  // trackHover mirrors the isPatternArmed check the place-vs-toggle branch
  // below also makes: only in placing mode does a pointermove need
  // pointer-to-world resolution for the preview, so an ordinary pan drag
  // doesn't pay for that per-move getBoundingClientRect call. See
  // useGridPointerGestures for the guard itself.
  const { isPanning, handlers } = useGridPointerGestures({
    trackHover: isPatternArmed,
    onPan,
    onTap: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      activateCell(x, y)
    },
    onHover: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      onPreviewCell(x, y)
    },
  })

  // Single-shot stamping (disarming immediately after a placement) belongs to
  // whoever owns the placement state -- usePatternPlacement's
  // stampArmedPattern -- not here: this branch only decides which of the two
  // upward callbacks a given activation resolves to.
  function activateCell(x: number, y: number) {
    if (isPatternArmed) {
      onStampPattern(x, y)
    } else {
      onToggleCell(x, y)
    }
  }

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
        {/* Grid -> GridCells is a real component edge, kept even though every
            other sibling component was inverted into the overlay slot: cells
            must render *inside* #grid-content, and owning that containment is
            exactly why Grid exists as a component rather than folding into
            LifeBoard. Do not invert this edge too. */}
        <GridCells
          camera={camera}
          cells={cells}
          liveCells={liveCells}
          previewPositions={previewPositions}
          onActivateCell={activateCell}
        />
      </div>

      {renderOverlays({ size: containerSize, visibleRange })}
    </div>
  )
}
