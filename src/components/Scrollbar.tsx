import { useRef } from 'react'
import { computeThumbGeometry, type ScrollbarAxis, type ScrollbarMetrics } from '../scrollbars'

interface ScrollbarProps {
  axis: ScrollbarAxis
  metrics: ScrollbarMetrics
  trackLengthPx: number
  onDrag: (axis: ScrollbarAxis, deltaTrackPx: number, thumbRatio: number) => void
  contentId: string
}

interface ScrollbarDragState {
  lastClientPos: number
  thumbRatio: number
}

export default function Scrollbar({ axis, metrics, trackLengthPx, onDrag, contentId }: ScrollbarProps) {
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

  // aria-valuenow announces POSITION only; thumbRatio (what fraction of the
  // content is visible, which is what drives the thumb's rendered LENGTH via
  // computeThumbGeometry above) was never announced at all. Exposed via
  // aria-describedby -> a visually-hidden span rather than aria-valuetext,
  // which supersedes aria-valuenow per spec and which CDP reports empty for
  // scrollbar/slider/spinbutton/progressbar alike -- see
  // src/test-support/scrollbarQuery.ts's header. aria-label stays untouched
  // ('Horizontal scroll' / 'Vertical scroll'): it's identity, not state, and
  // churning it per pan would break the stable-name contract.
  //
  // The id and the wording below are a deliberate duplicate of
  // src/test-support/scrollbarQuery.ts's visibleProportionText() --
  // rules/no-test-support-in-product-tsx.yml forbids importing that
  // directory here, the same reason GridRuler.tsx duplicates
  // rulerGroupLabel() and Cell.tsx duplicates cellLabel(). Scrollbar.test.tsx
  // pins both copies so they can't drift.
  //
  // Deliberately UNCLAMPED at the bottom: a span wide enough to round to zero
  // (~12,800 cells at the default 20px) announces '0 percent'. Clamping to 1
  // would make this disagree with the arithmetic everywhere else in
  // scrollbars.ts for one degenerate case, and would pass every existing test
  // here silently -- no unit test reaches a ratio that small.
  const descriptionId = `${axis}-scrollbar-visible-proportion`
  const visibleProportionPercent = Math.round(metrics.thumbRatio * 100)

  // No click-to-jump on the empty track area, by design -- only the thumb
  // below has pointer handlers.
  return (
    <div className={`${trackClass} rounded bg-gray-200/60`}>
      <div
        role={'scrollbar'}
        aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
        aria-controls={contentId}
        aria-label={axis === 'x' ? 'Horizontal scroll' : 'Vertical scroll'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(metrics.thumbOffsetRatio * 100)}
        aria-describedby={descriptionId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute top-0 left-0 touch-none rounded bg-gray-900/70 transition-colors hover:bg-gray-900"
        style={thumbStyle}
      >
        <span id={descriptionId} className="sr-only">
          {`${visibleProportionPercent} percent of the grid is in view`}
        </span>
      </div>
    </div>
  )
}
