import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cellKey, isCellAlive, type LiveCells } from '../gameOfLife'
import { useCamera } from '../hooks/useCamera'
import { computeMajorGridlines, computeVisibleRange, isMajorGridline, screenToWorld, worldToScreen, type Camera } from '../viewport'

interface GridProps {
  liveCells: LiveCells
  onToggleCell: (x: number, y: number) => void
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
      className={`absolute ${edgeClass} rounded bg-gray-50/80 px-0.5 text-[10px] leading-none text-gray-500 pointer-events-none`}
      style={{ transform }}
    >
      {coordinate}
    </span>
  )
}

const DRAG_THRESHOLD_PX = 4
const ZOOM_FACTOR = 1.25

interface DragState {
  startX: number
  startY: number
  lastX: number
  lastY: number
}

export default function Grid({ liveCells, onToggleCell }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const hasCenteredRef = useRef(false)

  const { camera, panByPixels, zoomAtPoint, centerView } = useCamera()

  const dragStateRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)

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
      const pixelX = e.clientX - rect.left
      const pixelY = e.clientY - rect.top
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      zoomAtPoint(pixelX, pixelY, factor)
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [zoomAtPoint])

  const visibleRange = useMemo(
    () => computeVisibleRange(camera, containerSize.width, containerSize.height),
    [camera, containerSize],
  )

  const cells = useMemo(() => {
    const result: { x: number; y: number }[] = []
    for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
      for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
        result.push({ x, y })
      }
    }
    return result
  }, [visibleRange])

  const majorGridlines = useMemo(() => computeMajorGridlines(visibleRange), [visibleRange])

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY }
    didDragRef.current = false
  }

  function handlePointerMove(e: React.PointerEvent) {
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
      const rect = e.currentTarget.getBoundingClientRect()
      const { x, y } = screenToWorld(camera, e.clientX - rect.left, e.clientY - rect.top)
      onToggleCell(x, y)
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

  function handleCellClick(x: number, y: number) {
    onToggleCell(x, y)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`relative w-full max-w-3xl h-[32rem] overflow-hidden touch-none border border-gray-300 bg-gray-100 ${
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

      {/* Coordinate ruler: labels every 10th gridline. pointer-events-none keeps
          these from interfering with cell clicks/dragging underneath. */}
      {majorGridlines.x.map((x) => (
        <RulerLabel key={`x-${x}`} axis="x" coordinate={x} camera={camera} />
      ))}
      {majorGridlines.y.map((y) => (
        <RulerLabel key={`y-${y}`} axis="y" coordinate={y} camera={camera} />
      ))}

      {/* stopPropagation keeps toolbar clicks from reaching the grid's pan/toggle
          handlers below, which would otherwise capture the pointer and either
          suppress the button's click or toggle the cell underneath it. */}
      <div className="absolute top-2 right-2 flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, ZOOM_FACTOR)}
          className="h-8 w-8 rounded bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomAtPoint(containerSize.width / 2, containerSize.height / 2, 1 / ZOOM_FACTOR)}
          className="h-8 w-8 rounded bg-gray-900 text-white font-medium hover:bg-gray-700 transition-colors"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset view"
          onClick={() => centerView(containerSize.width, containerSize.height)}
          className="h-8 px-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
