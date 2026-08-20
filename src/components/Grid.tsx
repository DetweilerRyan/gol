import { useRef } from 'react'
import { screenToWorld, worldToScreen, zoomPercentage } from '../camera'
import { cellKey, computeContentBounds, isCellAlive, type LiveCells } from '../gameOfLife'
import { cellsInRange, computeMajorGridlines, computeVisibleRange, isMajorGridline } from '../gridGeometry'
import { useCamera } from '../hooks/useCamera'
import { useElementSize } from '../hooks/useElementSize'
import { useGridPointerGestures } from '../hooks/useGridPointerGestures'
import { useInitialCentering } from '../hooks/useInitialCentering'
import { usePatternPlacement } from '../hooks/usePatternPlacement'
import { useWheelInput } from '../hooks/useWheelInput'
import { type Pattern } from '../patternLibrary'
import { armedPattern, isLibraryOpen, previewPositions } from '../patternPlacement'
import { computeScrollbarMetrics } from '../scrollbars'
import GridToolbar from './GridToolbar'
import PatternLibraryModal from './PatternLibraryModal'
import RulerLabel from './RulerLabel'
import Scrollbar from './Scrollbar'

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
  const scrollbarMetrics = computeScrollbarMetrics(camera, contentBounds, containerSize.width, containerSize.height)

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
        {cells.map(({ x, y }) => {
          const { x: left, y: top } = worldToScreen(camera, x, y)
          const isAlive = isCellAlive(liveCells, x, y)
          return (
            <button
              key={cellKey(x, y)}
              type="button"
              aria-label={`Cell ${x}, ${y}`}
              // Keyboard activation (Enter/Space) never goes through pointer
              // capture (see useGridPointerGestures' pointer-capture
              // comment), so it needs the same place-vs-toggle branch as the
              // pointer path.
              onClick={() => placeOrToggleAt(x, y)}
              style={{
                width: camera.cellSize,
                height: camera.cellSize,
                transform: `translate(${left}px, ${top}px)`,
                boxSizing: 'border-box',
              }}
              className={`absolute top-0 left-0 border border-gray-200 transition-colors ${
                isAlive ? 'bg-gray-900 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              } ${isMajorGridline(x) ? 'border-l-2 border-l-gray-400' : ''} ${isMajorGridline(y) ? 'border-t-2 border-t-gray-400' : ''}`}
            />
          )
        })}

        {/* Placing-mode preview. pointer-events-none so hovering the preview
            itself doesn't block the underlying pointermove tracking. */}
        {previewPositions(placement).map(([x, y]) => {
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
      </div>

      {/* Coordinate ruler: labels every 10th gridline. pointer-events-none keeps
          these from interfering with cell clicks/dragging underneath. */}
      {majorGridlines.x.map((x) => (
        <RulerLabel key={`x-${x}`} axis="x" coordinate={x} camera={camera} />
      ))}
      {majorGridlines.y.map((y) => (
        <RulerLabel key={`y-${y}`} axis="y" coordinate={y} camera={camera} />
      ))}

      {/* Bottom-right, not top-left, so it never overlaps the coordinate
          ruler labels above, which can appear anywhere along the top/left
          edges depending on pan position. Nudged in from the corner (rather
          than the plain right-2/bottom-2 it used before the scrollbars were
          added) so it clears the new bottom/right scrollbar tracks. */}
      <span className="pointer-events-none absolute right-4 bottom-4 rounded bg-gray-50/80 px-1.5 py-1 text-xs font-medium text-gray-600">
        {zoomPercentage(camera)}%
      </span>

      {containerSize.width > 0 && containerSize.height > 0 && (
        <>
          <Scrollbar
            axis="x"
            metrics={scrollbarMetrics.horizontal}
            trackLengthPx={containerSize.width}
            onDrag={panByScrollbarDrag}
            contentId="grid-content"
          />
          <Scrollbar
            axis="y"
            metrics={scrollbarMetrics.vertical}
            trackLengthPx={containerSize.height}
            onDrag={panByScrollbarDrag}
            contentId="grid-content"
          />
        </>
      )}

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
