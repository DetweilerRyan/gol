import { useRef } from 'react'
import { computeThumbGeometry, type ScrollbarAxis, type ScrollbarMetrics } from '../viewport'

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

export default function Scrollbar({ axis, metrics, trackLengthPx, onDrag }: ScrollbarProps) {
  const dragStateRef = useRef<ScrollbarDragState | null>(null)

  const { lengthPx: thumbLengthPx, offsetPx: thumbPositionPx } = computeThumbGeometry(metrics, trackLengthPx)

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

  // No click-to-jump on the empty track area, by design -- only the thumb
  // below has pointer handlers.
  return (
    <div className={`${trackClass} rounded bg-gray-200/60`}>
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
