import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { computeThumbGeometry, type ScrollbarMetrics } from '../viewport'
import Scrollbar from './Scrollbar'

// jsdom doesn't implement pointer capture -- stub it out so
// setPointerCapture/hasPointerCapture/releasePointerCapture calls in the
// component don't throw when fireEvent.pointerDown/pointerUp run.
beforeAll(() => {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => true
  Element.prototype.releasePointerCapture = () => {}
})

const metrics: ScrollbarMetrics = { thumbRatio: 0.4, thumbOffsetRatio: 0.25 }
const trackLengthPx = 200

describe('Scrollbar', () => {
  it('renders horizontal-axis ARIA attributes reflecting axis/metrics/contentId props', () => {
    render(
      <Scrollbar axis="x" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid-content" />,
    )
    const thumb = screen.getByRole('scrollbar')
    expect(thumb).toHaveAttribute('aria-orientation', 'horizontal')
    expect(thumb).toHaveAttribute('aria-controls', 'grid-content')
    expect(thumb).toHaveAttribute('aria-valuemin', '0')
    expect(thumb).toHaveAttribute('aria-valuemax', '100')
    expect(thumb).toHaveAttribute('aria-valuenow', String(Math.round(metrics.thumbOffsetRatio * 100)))
    expect(thumb).toHaveAttribute('aria-label', 'Horizontal scroll')
  })

  it('renders vertical-axis ARIA attributes reflecting axis/metrics/contentId props', () => {
    render(
      <Scrollbar axis="y" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid-viewport" />,
    )
    const thumb = screen.getByRole('scrollbar')
    expect(thumb).toHaveAttribute('aria-orientation', 'vertical')
    expect(thumb).toHaveAttribute('aria-controls', 'grid-viewport')
    expect(thumb).toHaveAttribute('aria-valuemin', '0')
    expect(thumb).toHaveAttribute('aria-valuemax', '100')
    expect(thumb).toHaveAttribute('aria-valuenow', String(Math.round(metrics.thumbOffsetRatio * 100)))
    expect(thumb).toHaveAttribute('aria-label', 'Vertical scroll')
  })

  it('reflects a different thumbOffsetRatio in aria-valuenow', () => {
    const otherMetrics: ScrollbarMetrics = { thumbRatio: 0.5, thumbOffsetRatio: 0.9 }
    render(
      <Scrollbar axis="x" metrics={otherMetrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />,
    )
    expect(screen.getByRole('scrollbar')).toHaveAttribute('aria-valuenow', '90')
  })

  it('positions/sizes the thumb per computeThumbGeometry for the x axis', () => {
    render(<Scrollbar axis="x" metrics={metrics} trackLengthPx={trackLengthPx} onDrag={vi.fn()} contentId="grid" />)
    const { lengthPx, offsetPx } = computeThumbGeometry(metrics, trackLengthPx)
    const thumb = screen.getByRole('scrollbar')
    expect(thumb).toHaveStyle({ width: `${lengthPx}px`, transform: `translateX(${offsetPx}px)` })
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
})
