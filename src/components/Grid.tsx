import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '../catalyst/button'
import {
  cellKey,
  computeContentBounds,
  isCellAlive,
  patternCellPositions,
  PATTERNS,
  type LiveCells,
  type Pattern,
  type PatternCategory,
} from '../gameOfLife'
import { useCamera } from '../hooks/useCamera'
import {
  computeMajorGridlines,
  computeScrollbarMetrics,
  computeVisibleRange,
  isMajorGridline,
  screenToWorld,
  worldToScreen,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
  type ScrollbarAxis,
  type ScrollbarMetrics,
} from '../viewport'

interface GridProps {
  liveCells: LiveCells
  onToggleCell: (x: number, y: number) => void
  onPlacePattern: (pattern: Pattern, anchorX: number, anchorY: number) => void
  onSuppressEnterChange: (suppressed: boolean) => void
}

interface RulerLabelProps {
  axis: 'x' | 'y'
  coordinate: number
  camera: Camera
}

// pointer-events-none keeps these from interfering with cell clicks/dragging
// underneath. axis picks which worldToScreen component positions the label
// and which edge it's pinned to -- otherwise the x and y rulers are identical.
function RulerLabel({ axis, coordinate, camera }: RulerLabelProps) {
  const screen = axis === 'x' ? worldToScreen(camera, coordinate, 0) : worldToScreen(camera, 0, coordinate)
  const edgeClass = axis === 'x' ? 'top-0.5' : 'left-0.5'
  const transform = axis === 'x' ? `translateX(${screen.x + 2}px)` : `translateY(${screen.y + 2}px)`

  return (
    <span
      className={`absolute ${edgeClass} pointer-events-none rounded bg-gray-50/80 px-0.5 text-[10px] leading-none text-gray-500`}
      style={{ transform }}
    >
      {coordinate}
    </span>
  )
}

const MIN_THUMB_PX = 24

interface ScrollbarProps {
  axis: ScrollbarAxis
  metrics: ScrollbarMetrics
  trackLengthPx: number
  onDrag: (axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) => void
}

interface ScrollbarDragState {
  lastClientPos: number
  thumbRatio: number
}

// The thumb's rendered size/position (thumbLengthPx/thumbPositionPx) is a
// pure rendering concern, separate from the drag math in
// panCameraByScrollbarDrag -- MIN_THUMB_PX keeps the thumb grabbable even
// when the content is enormous relative to the viewport.
function Scrollbar({ axis, metrics, trackLengthPx, onDrag }: ScrollbarProps) {
  const dragStateRef = useRef<ScrollbarDragState | null>(null)

  const thumbLengthPx = Math.min(trackLengthPx, Math.max(MIN_THUMB_PX, metrics.thumbRatio * trackLengthPx))
  const thumbPositionPx = metrics.thumbOffsetRatio * (trackLengthPx - thumbLengthPx)

  // thumbRatio is frozen at pointer-down and reused for the whole gesture --
  // recomputing it mid-drag from live metrics would feed back on itself,
  // since panning the camera changes the content's own pixel position.
  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = {
      lastClientPos: axis === 'x' ? e.clientX : e.clientY,
      thumbRatio: metrics.thumbRatio,
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragStateRef.current
    if (!drag) return
    const clientPos = axis === 'x' ? e.clientX : e.clientY
    onDrag(axis, clientPos - drag.lastClientPos, drag.thumbRatio)
    drag.lastClientPos = clientPos
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragStateRef.current = null
  }

  const trackClass =
    axis === 'x' ? 'absolute inset-x-0 right-2.5 bottom-0 h-2.5' : 'absolute inset-y-0 bottom-2.5 right-0 w-2.5'
  const thumbStyle: React.CSSProperties =
    axis === 'x'
      ? { width: thumbLengthPx, height: '100%', transform: `translateX(${thumbPositionPx}px)` }
      : { height: thumbLengthPx, width: '100%', transform: `translateY(${thumbPositionPx}px)` }

  // stopPropagation on the track keeps clicks/drags anywhere on the
  // scrollbar (including empty track area -- no click-to-jump here, by
  // design) from reaching the grid's own pan/toggle handlers underneath.
  // Pointer capture on the thumb retargets pointermove/pointerup to fire
  // there instead of wherever the cursor physically is, but those events
  // still bubble THROUGH this track div same as pointerdown does -- stopping
  // propagation on down alone left up (and move) reaching the grid's own
  // handlers, which could spuriously toggle a cell under the button on
  // release. All four pointer event types need to be stopped here.
  const stopPropagation = (e: React.PointerEvent) => e.stopPropagation()
  return (
    <div
      className={`${trackClass} rounded bg-gray-200/60`}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onPointerCancel={stopPropagation}
    >
      <div
        role="scrollbar"
        aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute top-0 left-0 touch-none rounded bg-gray-900/70 transition-colors hover:bg-gray-900"
        style={thumbStyle}
      />
    </div>
  )
}

const PATTERN_CATEGORIES: readonly PatternCategory[] = ['Still Life', 'Oscillators', 'Spaceships']

interface PatternLibraryModalProps {
  onSelectPattern: (pattern: Pattern) => void
  onClose: () => void
}

// Full-screen backdrop, so it needs to block the grid/toolbar underneath the
// same way the toolbar itself does (see stopPropagation comment below): a
// click event is native and unaffected by pointer capture, so it fires
// directly on whichever element the pointerdown/pointerup pair actually hit
// (here, the backdrop, since it's rendered on top) -- but pointerdown/up
// still bubble to the container's own pan/toggle handlers unless stopped,
// which would otherwise let a click-through toggle the cell underneath.
function PatternLibraryModal({ onSelectPattern, onClose }: PatternLibraryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pattern library"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
      >
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Pattern Library</h2>
        {PATTERN_CATEGORIES.map((category) => (
          <section key={category} className="mb-4 last:mb-0">
            <h3 className="mb-1 text-sm font-semibold text-gray-500">{category}</h3>
            <div className="flex flex-col">
              {PATTERNS.filter((pattern) => pattern.category === category).map((pattern) => (
                <button
                  key={pattern.name}
                  type="button"
                  onClick={() => onSelectPattern(pattern)}
                  className="rounded px-2 py-1.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100"
                >
                  {pattern.name}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
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
      } else if (isPatternModalOpen) {
        setIsPatternModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placingPattern, isPatternModalOpen])

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

  const cells: { x: number; y: number }[] = []
  for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
    for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
      cells.push({ x, y })
    }
  }

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

  function handlePatternsButtonClick() {
    if (placingPattern) {
      cancelPlacing()
    } else if (isPatternModalOpen) {
      setIsPatternModalOpen(false)
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
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`relative h-full w-full touch-none overflow-hidden bg-gray-100 ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
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
          />
          <Scrollbar
            axis="y"
            metrics={scrollbarMetrics.vertical}
            trackLengthPx={containerSize.height}
            onDrag={panByScrollbarDrag}
          />
        </>
      )}

      {/* stopPropagation keeps toolbar clicks from reaching the grid's pan/toggle
          handlers below, which would otherwise capture the pointer and either
          suppress the button's click or toggle the cell underneath it. Both
          down and up need it -- pointerdown alone leaves pointerup free to
          bubble through and spuriously toggle whatever cell is positioned
          under the button on release. */}
      <div
        className="absolute top-2 right-2 flex gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <Button
          plain
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, ZOOM_FACTOR)}
          className="h-8! w-8! justify-center rounded! !bg-gray-900 font-medium! !text-white transition-colors hover:!bg-gray-700"
        >
          +
        </Button>
        <Button
          plain
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, 1 / ZOOM_FACTOR)}
          className="h-8! w-8! justify-center rounded! !bg-gray-900 font-medium! !text-white transition-colors hover:!bg-gray-700"
        >
          −
        </Button>
        <Button
          plain
          type="button"
          aria-label="Reset view"
          onClick={() => centerView(containerSize.width, containerSize.height)}
          className="h-8! justify-center rounded! !bg-gray-900 px-2! text-sm! font-medium! !text-white transition-colors hover:!bg-gray-700"
        >
          Reset
        </Button>
        {/* z-30 (above the modal's z-20 backdrop) so this button stays
            clickable as a close/cancel toggle while the modal it opens is
            showing, unlike the other toolbar buttons here -- those stay
            beneath the backdrop by design, per the flex-item z-index
            exception in the CSS flexbox spec (z-index applies to flex
            items even without an explicit `position`). */}
        <Button
          plain
          type="button"
          aria-label="Open pattern library"
          onClick={handlePatternsButtonClick}
          className="z-30 h-8! justify-center rounded! !bg-gray-900 px-2! text-sm! font-medium! !text-white transition-colors hover:!bg-gray-700"
        >
          Patterns
        </Button>
      </div>

      {isPatternModalOpen && (
        <PatternLibraryModal onSelectPattern={handleSelectPattern} onClose={() => setIsPatternModalOpen(false)} />
      )}
    </div>
  )
}
