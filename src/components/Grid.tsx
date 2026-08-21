import { useRef } from 'react'
import { screenToWorld, zoomPercentage } from '../camera'
import { computeContentBounds, type LiveCells } from '../gameOfLife'
import { cellsInRange, computeMajorGridlines, computeVisibleRange } from '../gridGeometry'
import { useCamera } from '../hooks/useCamera'
import { useElementSize } from '../hooks/useElementSize'
import { useGridPointerGestures } from '../hooks/useGridPointerGestures'
import { useInitialCentering } from '../hooks/useInitialCentering'
import { usePatternPlacement } from '../hooks/usePatternPlacement'
import { useWheelInput } from '../hooks/useWheelInput'
import { type Pattern } from '../patternLibrary'
import { armedPattern, isLibraryOpen, previewPositions } from '../patternPlacement'
import GridCells from './GridCells'
import GridRuler from './GridRuler'
import GridScrollbars from './GridScrollbars'
import GridToolbar from './GridToolbar'
import PatternLibraryModal from './PatternLibraryModal'

interface GridProps {
  liveCells: LiveCells
  onToggleCell: (x: number, y: number) => void
  onPlacePattern: (pattern: Pattern, anchorX: number, anchorY: number) => void
}

export default function Grid({ liveCells, onToggleCell, onPlacePattern }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerSize = useElementSize(containerRef)

  const { camera, panByPixels, applyWheel, centerView, zoomInCentered, zoomOutCentered, panByScrollbarDrag } =
    useCamera()
  useWheelInput(containerRef, applyWheel)
  useInitialCentering(containerSize, centerView)

  const { placement, openOrCancelLibrary, closeLibrary, selectPattern, previewAt, disarm } = usePatternPlacement()

  const visibleRange = computeVisibleRange(camera, containerSize.width, containerSize.height)
  const cells = cellsInRange(visibleRange)
  const majorGridlines = computeMajorGridlines(visibleRange)

  const contentBounds = computeContentBounds(liveCells)

  // trackHover mirrors the armedPattern check the place-vs-toggle branch below
  // also makes: only in placing mode does a pointermove need pointer-to-world
  // resolution for the preview, so an ordinary pan drag doesn't pay for that
  // per-move getBoundingClientRect call. See useGridPointerGestures for the
  // guard itself.
  const { isPanning, handlers } = useGridPointerGestures({
    trackHover: !!armedPattern(placement),
    onPan: panByPixels,
    onTap: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      placeOrToggleAt(x, y)
    },
    onHover: (pixelX, pixelY) => {
      const { x, y } = screenToWorld(camera, pixelX, pixelY)
      previewAt(x, y)
    },
  })

  // Single-shot: stamping disarms the pattern immediately afterward, rather
  // than leaving it armed for repeat stamps.
  function placeOrToggleAt(x: number, y: number) {
    const pattern = armedPattern(placement)
    if (pattern) {
      onPlacePattern(pattern, x, y)
      disarm()
    } else {
      onToggleCell(x, y)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Owns the pan/toggle pointer handlers and sits below every overlay
          (ruler, zoom%, scrollbars, toolbar, modal) as a sibling rather than
          an ancestor, so overlay pointer events never bubble into these
          handlers in the first place -- no stopPropagation/open-state guards
          needed on either side. inset-0 keeps its rect identical to the
          outer container's, which useGridPointerGestures' pointer handlers
          and useWheelInput both rely on. */}
      <div
        id="grid-content"
        {...handlers}
        className={`absolute inset-0 touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <GridCells
          camera={camera}
          cells={cells}
          liveCells={liveCells}
          previewPositions={previewPositions(placement)}
          onActivateCell={placeOrToggleAt}
        />
      </div>

      <GridRuler gridlines={majorGridlines} camera={camera} />

      {/* Bottom-right, not top-left, so it never overlaps the coordinate
          ruler labels above, which can appear anywhere along the top/left
          edges depending on pan position. Nudged in from the corner (rather
          than the plain right-2/bottom-2 it used before the scrollbars were
          added) so it clears the new bottom/right scrollbar tracks. */}
      <span className="pointer-events-none absolute right-4 bottom-4 rounded bg-gray-50/80 px-1.5 py-1 text-xs font-medium text-gray-600">
        {zoomPercentage(camera)}%
      </span>

      <GridScrollbars
        camera={camera}
        contentBounds={contentBounds}
        size={containerSize}
        contentId="grid-content"
        onDrag={panByScrollbarDrag}
      />

      {/* No open-state guard on onPatterns: Headless UI's Dialog makes the
          rest of the page (including the toolbar) inert while the library is
          open, so that handler can't fire in the browsing state at all. */}
      <GridToolbar
        onZoomIn={() => zoomInCentered(containerSize.width, containerSize.height)}
        onZoomOut={() => zoomOutCentered(containerSize.width, containerSize.height)}
        onReset={() => centerView(containerSize.width, containerSize.height)}
        onPatterns={openOrCancelLibrary}
      />

      <PatternLibraryModal open={isLibraryOpen(placement)} onSelectPattern={selectPattern} onClose={closeLibrary} />
    </div>
  )
}
