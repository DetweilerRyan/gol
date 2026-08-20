import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computeThumbGeometry, type ScrollbarMetrics } from '../viewport'
import Scrollbar from './Scrollbar'

// jsdom doesn't implement pointer capture -- stub it out (as spies, so the
// pointer-down/pointer-up handlers' calls into it can be asserted on below)
// so setPointerCapture/hasPointerCapture/releasePointerCapture calls in the
// component don't throw when fireEvent.pointerDown/pointerUp run. Reassigned
// fresh per test so call counts/return values from one test don't leak into
// the next.
let setPointerCapture: ReturnType<typeof vi.fn>
let hasPointerCapture: ReturnType<typeof vi.fn>
let releasePointerCapture: ReturnType<typeof vi.fn>

beforeEach(() => {
  setPointerCapture = vi.fn()
  hasPointerCapture = vi.fn(() => true)
  releasePointerCapture = vi.fn()
  Element.prototype.setPointerCapture = setPointerCapture
  Element.prototype.hasPointerCapture = hasPointerCapture
  Element.prototype.releasePointerCapture = releasePointerCapture
})

const metrics: ScrollbarMetrics = { thumbRatio: 0.4, thumbOffsetRatio: 0.25 }
const trackLengthPx = 200

describe('Scrollbar', () => {
  it.each([
    ['x', 'horizontal', 'grid-content', 'Horizontal scroll'],
    ['y', 'vertical', 'grid-viewport', 'Vertical scroll'],
  ] as const)(
    'renders %s-axis ARIA attributes reflecting axis/metrics/contentId props',
    (axis, orientation, contentId, label) => {
      render(
        <Scrollbar
          axis={axis}
          metrics={metrics}
          trackLengthPx={trackLengthPx}
          onDrag={vi.fn()}
          contentId={contentId}
        />,
      )
      const thumb = screen.getByRole('scrollbar')
      expect(thumb).toHaveAttribute('aria-orientation', orientation)
      expect(thumb).toHaveAttribute('aria-controls', contentId)
      expect(thumb).toHaveAttribute('aria-valuemin', '0')
      expect(thumb).toHaveAttribute('aria-valuemax', '100')
      expect(thumb).toHaveAttribute('aria-valuenow', String(Math.round(metrics.thumbOffsetRatio * 100)))
      expect(thumb).toHaveAttribute('aria-label', label)
    },
  )

  it('reflects a different thumbOffsetRatio in aria-valuenow', () => {
    const otherMetrics: ScrollbarMetrics = { thumbRatio: 0.5, thumbOffsetRatio: 0.9 }
    render(
      <Scrollbar axis="x" metrics={otherMetrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />,
    )
    expect(screen.getByRole('scrollbar')).toHaveAttribute('aria-valuenow', '90')
  })

  it.each([
    ['x', ['absolute', 'inset-x-0', 'right-2.5', 'bottom-0', 'h-2.5']],
    ['y', ['absolute', 'inset-y-0', 'bottom-2.5', 'right-0', 'w-2.5']],
  ] as const)('positions/sizes the track and thumb per computeThumbGeometry for the %s axis', (axis, trackClasses) => {
    render(<Scrollbar axis={axis} metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />)
    const { lengthPx, offsetPx } = computeThumbGeometry(metrics, trackLengthPx)
    const thumb = screen.getByRole('scrollbar')
    const track = thumb.parentElement
    expect(track).toHaveClass(...trackClasses)
    if (axis === 'x') {
      expect(thumb).toHaveStyle({ width: `${lengthPx}px`, height: '100%', transform: `translateX(${offsetPx}px)` })
    } else {
      expect(thumb).toHaveStyle({ height: `${lengthPx}px`, width: '100%', transform: `translateY(${offsetPx}px)` })
    }
  })

  it('a pointerdown -> pointermove -> pointerup drag sequence calls onDrag with (axis, deltaTrackPx, thumbRatio)', () => {
    const onDrag = vi.fn()
    render(<Scrollbar axis="x" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={onDrag} contentId="grid" />)
    const thumb = screen.getByRole('scrollbar')

    fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 50, clientY: 0 })
    expect(onDrag).not.toHaveBeenCalled()

    fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 65, clientY: 0 })
    expect(onDrag).toHaveBeenCalledTimes(1)
    expect(onDrag).toHaveBeenLastCalledWith('x', 15, metrics.thumbRatio)

    fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 70, clientY: 0 })
    expect(onDrag).toHaveBeenCalledTimes(2)
    expect(onDrag).toHaveBeenLastCalledWith('x', 5, metrics.thumbRatio)

    fireEvent.pointerUp(thumb, { pointerId: 1, clientX: 70, clientY: 0 })

    // Further pointermove after pointerup shouldn't call onDrag again --
    // the drag gesture has ended.
    fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 90, clientY: 0 })
    expect(onDrag).toHaveBeenCalledTimes(2)
  })

  it('a y-axis drag sequence uses clientY and calls onDrag with axis "y"', () => {
    const onDrag = vi.fn()
    render(<Scrollbar axis="y" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={onDrag} contentId="grid" />)
    const thumb = screen.getByRole('scrollbar')

    fireEvent.pointerDown(thumb, { pointerId: 2, clientX: 0, clientY: 20 })
    fireEvent.pointerMove(thumb, { pointerId: 2, clientX: 0, clientY: 32 })
    expect(onDrag).toHaveBeenCalledWith('y', 12, metrics.thumbRatio)
  })

  it('calls setPointerCapture on pointerdown and releasePointerCapture on pointerup when capture is still held', () => {
    render(<Scrollbar axis="x" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />)
    const thumb = screen.getByRole('scrollbar')

    fireEvent.pointerDown(thumb, { pointerId: 3, clientX: 10, clientY: 0 })
    expect(setPointerCapture).toHaveBeenCalledWith(3)
    expect(releasePointerCapture).not.toHaveBeenCalled()

    fireEvent.pointerUp(thumb, { pointerId: 3, clientX: 10, clientY: 0 })
    expect(hasPointerCapture).toHaveBeenCalledWith(3)
    expect(releasePointerCapture).toHaveBeenCalledWith(3)
  })

  it('does not call releasePointerCapture on pointerup once the pointer no longer has capture', () => {
    hasPointerCapture.mockReturnValue(false)
    render(<Scrollbar axis="x" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />)
    const thumb = screen.getByRole('scrollbar')

    fireEvent.pointerDown(thumb, { pointerId: 4, clientX: 10, clientY: 0 })
    fireEvent.pointerUp(thumb, { pointerId: 4, clientX: 10, clientY: 0 })
    expect(releasePointerCapture).not.toHaveBeenCalled()
  })
})
