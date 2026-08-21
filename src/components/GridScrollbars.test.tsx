import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Camera } from '../camera'
import { cellKey, computeContentBounds, type LiveCells } from '../gameOfLife'
import type { ElementSize } from '../hooks/useElementSize'
import { computeScrollbarMetrics, computeThumbGeometry } from '../scrollbars'
import { stubPointerCapture } from '../test-support/domStubs'
import GridScrollbars from './GridScrollbars'

// jsdom doesn't implement pointer capture; Scrollbar (rendered by
// GridScrollbars) calls it on pointerdown/pointerup, so the drag-forwarding
// test below needs it stubbed.
beforeEach(() => {
  stubPointerCapture()
})

const camera: Camera = { offsetX: -2, offsetY: -1, cellSize: 20 }
const size: ElementSize = { width: 400, height: 300 }
const contentBounds = computeContentBounds(new Set([cellKey(2, 3), cellKey(10, 10)]) as LiveCells)

function renderScrollbars(props: Partial<React.ComponentProps<typeof GridScrollbars>> = {}) {
  const merged: React.ComponentProps<typeof GridScrollbars> = {
    camera,
    contentBounds,
    size,
    contentId: 'grid-content',
    onDrag: vi.fn(),
    ...props,
  }
  return { ...render(<GridScrollbars {...merged} />), ...merged }
}

describe('GridScrollbars measured gate', () => {
  it('renders no scrollbars while width is still zero', () => {
    renderScrollbars({ size: { width: 0, height: 300 } })
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)
  })

  it('renders no scrollbars while height is still zero', () => {
    renderScrollbars({ size: { width: 400, height: 0 } })
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)
  })

  it('renders no scrollbars while both dimensions are still zero', () => {
    renderScrollbars({ size: { width: 0, height: 0 } })
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(0)
  })

  it('renders both scrollbars once both dimensions are nonzero', () => {
    renderScrollbars()
    expect(screen.queryAllByRole('scrollbar')).toHaveLength(2)
  })
})

describe('GridScrollbars metrics/geometry', () => {
  it('sizes and positions each scrollbar from computeScrollbarMetrics(camera, contentBounds, size)', () => {
    renderScrollbars()

    const metrics = computeScrollbarMetrics(camera, contentBounds, size.width, size.height)
    const scrollbars = screen.getAllByRole('scrollbar')
    const horizontal = scrollbars.find((el) => el.getAttribute('aria-orientation') === 'horizontal')
    const vertical = scrollbars.find((el) => el.getAttribute('aria-orientation') === 'vertical')

    expect(horizontal).toHaveAttribute('aria-valuenow', String(Math.round(metrics.horizontal.thumbOffsetRatio * 100)))
    expect(vertical).toHaveAttribute('aria-valuenow', String(Math.round(metrics.vertical.thumbOffsetRatio * 100)))

    const { lengthPx: hLength } = computeThumbGeometry(metrics.horizontal, size.width)
    const { lengthPx: vLength } = computeThumbGeometry(metrics.vertical, size.height)
    // Asserting on the inline style directly (not toHaveStyle's getComputedStyle-based
    // comparison) -- jsdom's cssstyle rounds getComputedStyle's serialized px values to 3
    // decimal places, which a non-terminating thumbLengthPx would fail on even though the
    // actual rendered style is exact.
    expect(horizontal?.style.width).toBe(`${hLength}px`)
    expect(vertical?.style.height).toBe(`${vLength}px`)
  })

  it('passes trackLengthPx from size.width/size.height, reflected in a different size', () => {
    const bigSize: ElementSize = { width: 800, height: 600 }
    renderScrollbars({ size: bigSize })

    const metrics = computeScrollbarMetrics(camera, contentBounds, bigSize.width, bigSize.height)
    const { lengthPx: hLength } = computeThumbGeometry(metrics.horizontal, bigSize.width)
    const horizontal = screen
      .getAllByRole('scrollbar')
      .find((el) => el.getAttribute('aria-orientation') === 'horizontal')
    expect(horizontal?.style.width).toBe(`${hLength}px`)
  })
})

describe('GridScrollbars wiring', () => {
  it('derives aria-controls on both scrollbars from the contentId prop', () => {
    renderScrollbars({ contentId: 'some-other-id' })
    const scrollbars = screen.getAllByRole('scrollbar')
    expect(scrollbars).toHaveLength(2)
    for (const el of scrollbars) {
      expect(el).toHaveAttribute('aria-controls', 'some-other-id')
    }
  })

  it('forwards drag gestures on either scrollbar to the onDrag prop', () => {
    const onDrag = vi.fn()
    renderScrollbars({ onDrag })
    const horizontal = screen
      .getAllByRole('scrollbar')
      .find((el) => el.getAttribute('aria-orientation') === 'horizontal')!

    fireEvent.pointerDown(horizontal, { pointerId: 1, clientX: 10, clientY: 0 })
    fireEvent.pointerMove(horizontal, { pointerId: 1, clientX: 25, clientY: 0 })

    expect(onDrag).toHaveBeenCalledWith('x', 15, expect.any(Number))
  })
})
