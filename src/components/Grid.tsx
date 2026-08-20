import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cellKey, computeContentBounds, isCellAlive, type LiveCells, type Pattern } from '../gameOfLife'
import { useCamera } from '../hooks/useCamera'
import { useElementSize } from '../hooks/useElementSize'
import { usePatternPlacement } from '../hooks/usePatternPlacement'
import { useWheelInput } from '../hooks/useWheelInput'
import { armedPattern, isLibraryOpen, previewPositions, suppressesEnter } from '../patternPlacement'
import {
  advanceDrag,
  beginDrag,
  cellsInRange,
  computeMajorGridlines,
  computeScrollbarMetrics,
  computeVisibleRange,
  isMajorGridline,
  rectRelativePixels,
  screenToWorld,
  worldToScreen,
  zoomPercentage,
  ZOOM_FACTOR,
  type DragGesture,
} from '../viewport'
import GridToolbar from './GridToolbar'
import PatternLibraryModal from './PatternLibraryModal'
import RulerLabel from './RulerLabel'
import Scrollbar from './Scrollbar'

interface GridProps {
  liveCells: LiveCells
  onToggleCell: (x: number, y: number) => void
  onPlacePattern: (pattern: Pattern, anchorX: number, anchorY: number) => void
  onSuppressEnterChange: (suppressed: boolean) => void
}

export default function Grid({ liveCells, onToggleCell, onPlacePattern, onSuppressEnterChange }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerSize = useElementSize(containerRef)
  const hasCenteredRef = useRef(false)

  const { camera, panByPixels, zoomAtPoint, applyWheel, centerView, panByScrollbarDrag } = useCamera()
  useWheelInput(containerRef, applyWheel)

  const dragStateRef = useRef<DragGesture | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const { placement, openOrCancelLibrary, closeLibrary, selectPattern, previewAt, disarm } = usePatternPlacement()

  // Centers on the first measured size only. A layout effect (rather than a
  // plain effect) so the re-centered camera is committed before paint, leaving
  // no frame in which the grid is rendered at full size but still uncentered.
  useLayoutEffect(() => {
    const { width, height } = containerSize
    if (!hasCenteredRef.current && width > 0 && height > 0) {
      hasCenteredRef.current = true
      centerView(width, height)
    }
  }, [containerSize, centerView])

  // Both browsing the pattern library and placing a pattern need to suppress
  // App.tsx's global Enter-to-advance-generation shortcut. Reported up via a
  // callback rather than lifting the placement state entirely, since it's
  // otherwise only relevant to Grid's own pointer/keyboard wiring.
  useEffect(() => {
    onSuppressEnterChange(suppressesEnter(placement))
  }, [placement, onSuppressEnterChange])

  const visibleRange = computeVisibleRange(camera, containerSize.width, containerSize.height)
  const cells = cellsInRange(visibleRange)
  const majorGridlines = computeMajorGridlines(visibleRange)

  const contentBounds = computeContentBounds(liveCells)
  const scrollbarMetrics = computeScrollbarMetrics(camera, contentBounds, containerSize.width, containerSize.height)

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = beginDrag(e.clientX, e.clientY)
  }

  // Resolves a pointer event's client coordinates to the world cell under it,
  // relative to the grid container -- shared by cell-toggle resolution
  // (handlePointerUp) and placing-mode preview tracking (handlePointerMove).
  function pointerToWorldCell(e: React.PointerEvent) {
    const { pixelX, pixelY } = rectRelativePixels(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY)
    return screenToWorld(camera, pixelX, pixelY)
  }

  function handlePointerMove(e: React.PointerEvent) {
    // Tracks the cursor's cell for the placing-mode preview on every move,
    // independent of drag state -- pointermove fires on hover too, not just
    // while a button is pressed, and the preview needs to follow the cursor
    // even before any drag threshold is crossed (or when the pointer never
    // goes down at all). Guarded on something actually being armed even
    // though previewAt itself is a no-op otherwise, so an ordinary pan drag
    // doesn't force a synchronous layout (getBoundingClientRect) per move.
    if (armedPattern(placement)) {
      const { x, y } = pointerToWorldCell(e)
      previewAt(x, y)
    }

    const drag = dragStateRef.current
    if (!drag) return

    const advance = advanceDrag(drag, e.clientX, e.clientY)
    dragStateRef.current = advance.gesture
    // Guarded rather than panning by advanceDrag's zeroed deltas, so a
    // sub-threshold move doesn't re-render on a camera that didn't move.
    if (advance.gesture.isPanning) {
      panByPixels(advance.panDxPixels, advance.panDyPixels)
      setIsPanning(true)
    }
  }

  // Pointer capture on the container retargets the subsequent native "click"
  // event to the container too, so per-button onClick never fires for
  // pointer-driven interaction — toggle is resolved here from pointerup
  // coordinates instead. Button onClick still handles keyboard activation
  // (Enter/Space), which never goes through pointer capture.
  function handlePointerUp(e: React.PointerEvent) {
    releaseCapture(e)
    if (!dragStateRef.current?.isPanning) {
      const { x, y } = pointerToWorldCell(e)
      placeOrToggleAt(x, y)
    }
    dragStateRef.current = null
    setIsPanning(false)
  }

  function handlePointerCancel(e: React.PointerEvent) {
    releaseCapture(e)
    dragStateRef.current = null
    setIsPanning(false)
  }

  function releaseCapture(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

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
          outer container's, which pointerToWorldCell and useWheelInput both
          rely on. */}
      <div
        id="grid-content"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
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
              // capture (see handlePointerUp), so it needs the same
              // place-vs-toggle branch as the pointer path.
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
        onZoomIn={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, ZOOM_FACTOR)}
        onZoomOut={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, 1 / ZOOM_FACTOR)}
        onReset={() => centerView(containerSize.width, containerSize.height)}
        onPatterns={openOrCancelLibrary}
      />

      <PatternLibraryModal open={isLibraryOpen(placement)} onSelectPattern={selectPattern} onClose={closeLibrary} />
    </div>
  )
}
