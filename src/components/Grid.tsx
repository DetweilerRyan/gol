import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  cellKey,
  computeContentBounds,
  isCellAlive,
  patternCellPositions,
  type LiveCells,
  type Pattern,
} from '../gameOfLife'
import { useCamera } from '../hooks/useCamera'
import {
  cellsInRange,
  computeMajorGridlines,
  computeScrollbarMetrics,
  computeVisibleRange,
  isMajorGridline,
  screenToWorld,
  worldToScreen,
  zoomPercentage,
  ZOOM_FACTOR,
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

const DRAG_THRESHOLD_PX = 4

interface DragState {
  startX: number
  startY: number
  lastX: number
  lastY: number
}

export default function Grid({ liveCells, onToggleCell, onPlacePattern, onSuppressEnterChange }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const hasCenteredRef = useRef(false)

  const { camera, panByPixels, zoomAtPoint, applyWheel, centerView, panByScrollbarDrag } = useCamera()

  const dragStateRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)

  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false)
  const [placingPattern, setPlacingPattern] = useState<Pattern | null>(null)
  const [previewCell, setPreviewCell] = useState<{ x: number; y: number } | null>(null)

  function cancelPlacing() {
    setPlacingPattern(null)
    setPreviewCell(null)
  }

  // Both the pattern modal and placing mode need to suppress App.tsx's
  // global Enter-to-advance-generation shortcut (placing mode especially --
  // otherwise pressing Enter while lining up a pattern would silently
  // advance the simulation out from under it). Reported up via a callback
  // rather than lifting this state entirely, since the modal-open/placing
  // flags are otherwise only relevant to Grid's own pointer/keyboard wiring.
  useEffect(() => {
    onSuppressEnterChange(isPatternModalOpen || placingPattern !== null)
  }, [isPatternModalOpen, placingPattern, onSuppressEnterChange])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (placingPattern) {
        cancelPlacing()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placingPattern])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
      if (!hasCenteredRef.current && width > 0 && height > 0) {
        hasCenteredRef.current = true
        centerView(width, height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [centerView])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = el!.getBoundingClientRect()
      applyWheel({
        pixelX: e.clientX - rect.left,
        pixelY: e.clientY - rect.top,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        shiftKey: e.shiftKey,
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [applyWheel])

  const visibleRange = computeVisibleRange(camera, containerSize.width, containerSize.height)
  const cells = cellsInRange(visibleRange)
  const majorGridlines = computeMajorGridlines(visibleRange)

  const contentBounds = computeContentBounds(liveCells)
  const scrollbarMetrics = computeScrollbarMetrics(camera, contentBounds, containerSize.width, containerSize.height)

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY }
    didDragRef.current = false
  }

  // Resolves a pointer event's client coordinates to the world cell under it,
  // relative to the grid container -- shared by cell-toggle resolution
  // (handlePointerUp) and placing-mode preview tracking (handlePointerMove).
  function pointerToWorldCell(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    return screenToWorld(camera, e.clientX - rect.left, e.clientY - rect.top)
  }

  function handlePointerMove(e: React.PointerEvent) {
    // Tracks the cursor's cell for the placing-mode preview on every move,
    // independent of drag state -- pointermove fires on hover too, not just
    // while a button is pressed, and the preview needs to follow the cursor
    // even before any drag threshold is crossed (or when the pointer never
    // goes down at all).
    if (placingPattern) {
      setPreviewCell(pointerToWorldCell(e))
    }

    const drag = dragStateRef.current
    if (!drag) return

    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    const totalDx = e.clientX - drag.startX
    const totalDy = e.clientY - drag.startY

    if (!didDragRef.current && Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD_PX) {
      didDragRef.current = true
      setIsPanning(true)
    }
    if (didDragRef.current) {
      panByPixels(dx, dy)
    }
    drag.lastX = e.clientX
    drag.lastY = e.clientY
  }

  // Pointer capture on the container retargets the subsequent native "click"
  // event to the container too, so per-button onClick never fires for
  // pointer-driven interaction — toggle is resolved here from pointerup
  // coordinates instead. Button onClick still handles keyboard activation
  // (Enter/Space), which never goes through pointer capture.
  function handlePointerUp(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (!didDragRef.current) {
      const { x, y } = pointerToWorldCell(e)
      placeOrToggleAt(x, y)
    }
    dragStateRef.current = null
    setIsPanning(false)
  }

  function handlePointerCancel(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragStateRef.current = null
    setIsPanning(false)
  }

  // Single-shot: stamping via placeOrToggleAt exits placing mode immediately
  // afterward, rather than leaving the pattern armed for repeat stamps.
  function placeOrToggleAt(x: number, y: number) {
    if (placingPattern) {
      onPlacePattern(placingPattern, x, y)
      cancelPlacing()
    } else {
      onToggleCell(x, y)
    }
  }

  // Keyboard activation (Enter/Space) of a cell button never goes through
  // pointer capture (see handlePointerUp's comment), so it needs the same
  // placing-vs-toggle branch as the pointer path to behave consistently.
  function handleCellClick(x: number, y: number) {
    placeOrToggleAt(x, y)
  }

  // No isPatternModalOpen branch here: Headless UI's Dialog makes the rest
  // of the page (including this button) inert while open, so this handler
  // can't fire in that state at all -- the modal closes only via its own
  // outside-click/Escape handling.
  function handlePatternsButtonClick() {
    if (placingPattern) {
      cancelPlacing()
    } else {
      setIsPatternModalOpen(true)
    }
  }

  function handleSelectPattern(pattern: Pattern) {
    setIsPatternModalOpen(false)
    setPlacingPattern(pattern)
    setPreviewCell(null)
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Owns the pan/toggle pointer handlers and sits below every overlay
          (ruler, zoom%, scrollbars, toolbar, modal) as a sibling rather than
          an ancestor, so overlay pointer events never bubble into these
          handlers in the first place -- no stopPropagation/open-state guards
          needed on either side. inset-0 keeps its rect identical to the
          outer container's, which pointerToWorldCell and the wheel handler
          both rely on. */}
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
              onClick={() => handleCellClick(x, y)}
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

        {/* Placing-mode preview: uses the same patternCellPositions helper
            placePattern itself is built on, so the preview can't drift from
            where a stamp would actually land. pointer-events-none so hovering
            the preview itself doesn't block the underlying pointermove tracking. */}
        {placingPattern &&
          previewCell &&
          patternCellPositions(placingPattern, previewCell.x, previewCell.y).map(([x, y]) => {
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

      <GridToolbar
        onZoomIn={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, ZOOM_FACTOR)}
        onZoomOut={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, 1 / ZOOM_FACTOR)}
        onReset={() => centerView(containerSize.width, containerSize.height)}
        onPatterns={handlePatternsButtonClick}
      />

      <PatternLibraryModal
        open={isPatternModalOpen}
        onSelectPattern={handleSelectPattern}
        onClose={() => setIsPatternModalOpen(false)}
      />
    </div>
  )
}
