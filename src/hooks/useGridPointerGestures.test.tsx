import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DRAG_THRESHOLD_PX } from '../dragGesture'
import { stubBoundingClientRect, stubPointerCapture, type PointerCaptureStubs } from '../test-support/domStubs'
import { useGridPointerGestures, type GridPointerGestureCallbacks } from './useGridPointerGestures'

// useGridPointerGestures reads e.currentTarget, setPointerCapture, and
// getBoundingClientRect -- all real DOM behavior renderHook can't provide
// without fabricated event objects (`as unknown as React.PointerEvent`), a
// pattern this repo has already been bitten by (see domStubs.ts's typing
// comment). This ~10-line harness renders a single real element instead, and
// fireEvent drives real PointerEvents at it.
let pointerCapture: PointerCaptureStubs

beforeEach(() => {
  pointerCapture = stubPointerCapture()
  stubBoundingClientRect({ left: 0, top: 0, width: 400, height: 300 })
})

function Harness(props: GridPointerGestureCallbacks) {
  const { isPanning, handlers } = useGridPointerGestures(props)
  return <div data-testid="surface" data-panning={isPanning} {...handlers} />
}

function renderHarness(overrides: Partial<GridPointerGestureCallbacks> = {}) {
  const callbacks: GridPointerGestureCallbacks = {
    trackHover: true,
    onPan: vi.fn(),
    onPanEnd: vi.fn(),
    onTap: vi.fn(),
    onHover: vi.fn(),
    ...overrides,
  }
  render(<Harness {...callbacks} />)
  return { surface: screen.getByTestId('surface'), ...callbacks }
}

describe('onTap', () => {
  it('resolves a plain pointerdown -> pointerup with no intervening move to onTap at the rect-relative pointerup coordinates', () => {
    const { surface, onTap } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 50, clientY: 60 })

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onTap).toHaveBeenCalledWith(50, 60)
  })

  it('resolves pointerup coordinates relative to a non-zero-origin rect, not raw clientX/clientY', () => {
    stubBoundingClientRect({ left: 50, top: 30, width: 400, height: 300 })
    const { surface, onTap } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 150, clientY: 130 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 150, clientY: 130 })

    expect(onTap).toHaveBeenCalledWith(150 - 50, 130 - 30)
  })

  it('a pointerup with no prior pointerdown still resolves as a tap rather than throwing', () => {
    const { surface, onTap } = renderHarness()

    fireEvent.pointerUp(surface, { pointerId: 99, clientX: 10, clientY: 10 })

    expect(onTap).toHaveBeenCalledWith(10, 10)
  })

  it(`a move of exactly ${DRAG_THRESHOLD_PX}px does not cross the drag threshold -- the check is strictly greater-than, so it still taps`, () => {
    const { surface, onTap, onPan } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: DRAG_THRESHOLD_PX, clientY: 0 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: DRAG_THRESHOLD_PX, clientY: 0 })

    expect(onPan).not.toHaveBeenCalled()
    expect(onTap).toHaveBeenCalledWith(DRAG_THRESHOLD_PX, 0)
  })
})

describe('onPan', () => {
  it('reports each incremental pointer-move delta once the drag threshold is crossed, not the cumulative distance', () => {
    const { surface, onPan, onTap } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 110, clientY: 100 }) // crosses threshold, delta (10, 0)
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 120, clientY: 90 }) // delta since last move: (10, -10)

    expect(onPan).toHaveBeenNthCalledWith(1, 10, 0)
    expect(onPan).toHaveBeenNthCalledWith(2, 10, -10)

    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 120, clientY: 90 })
    expect(onTap).not.toHaveBeenCalled()
  })

  it('latches: a drag that crosses the threshold then returns near its origin stays a pan and does not tap on release', () => {
    const { surface, onPan, onTap } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 200, clientY: 100 }) // well past threshold
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 101, clientY: 100 }) // back near origin
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 101, clientY: 100 })

    expect(onPan).toHaveBeenCalledTimes(2)
    expect(onTap).not.toHaveBeenCalled()
  })

  it('sets isPanning true only once the drag threshold is crossed, and resets it on pointerup', () => {
    const { surface } = renderHarness()

    expect(surface.dataset.panning).toBe('false')

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 2, clientY: 0 }) // within threshold
    expect(surface.dataset.panning).toBe('false')

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 10, clientY: 0 }) // crosses threshold
    expect(surface.dataset.panning).toBe('true')

    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 10, clientY: 0 })
    expect(surface.dataset.panning).toBe('false')
  })
})

describe('trackHover', () => {
  it('calls onHover with rect-relative pixels on pointermove when true', () => {
    const { surface, onHover } = renderHarness({ trackHover: true })

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 30, clientY: 40 })

    expect(onHover).toHaveBeenCalledWith(30, 40)
  })

  it('does not call getBoundingClientRect on pointermove when false, since onHover is a no-op guard, not a computed-and-discarded value', () => {
    const rectSpy = stubBoundingClientRect({ left: 0, top: 0, width: 400, height: 300 })
    const { surface, onHover } = renderHarness({ trackHover: false })
    rectSpy.mockClear()

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 30, clientY: 40 })

    expect(rectSpy).not.toHaveBeenCalled()
    expect(onHover).not.toHaveBeenCalled()
  })

  it('calls onHover on a plain hover move (no drag in progress) even once a PRIOR drag has ended', () => {
    const { surface, onHover } = renderHarness({ trackHover: true })

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 20, clientY: 0 }) // crosses threshold, now panning
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 20, clientY: 0 })
    vi.mocked(onHover).mockClear()

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 30, clientY: 40 })

    expect(onHover).toHaveBeenCalledWith(30, 40)
  })

  it('does not call onHover once a drag has crossed the pan threshold, even though trackHover is true', () => {
    const { surface, onHover } = renderHarness({ trackHover: true })

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 20, clientY: 0 }) // crosses threshold, now panning
    vi.mocked(onHover).mockClear()

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 40, clientY: 0 })

    expect(onHover).not.toHaveBeenCalled()
  })

  it('still calls onHover for a sub-threshold move, since the drag has not become a pan yet', () => {
    const { surface, onHover } = renderHarness({ trackHover: true })

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    vi.mocked(onHover).mockClear()

    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 2, clientY: 0 }) // within DRAG_THRESHOLD_PX

    expect(onHover).toHaveBeenCalledWith(2, 0)
  })
})

describe('pointer capture', () => {
  it('captures the pointer on pointerdown with its pointerId', () => {
    const { surface } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 7, clientX: 0, clientY: 0 })

    expect(pointerCapture.setPointerCapture).toHaveBeenCalledWith(7)
  })

  // Shared by both pointerup and pointercancel: each only releases pointer capture when the
  // element currently reports having it.
  function expectReleaseGuardedByHasPointerCapture(fireUp: typeof fireEvent.pointerUp) {
    const { surface } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireUp(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(pointerCapture.releasePointerCapture).toHaveBeenCalledWith(1)

    pointerCapture.releasePointerCapture.mockClear()
    pointerCapture.hasPointerCapture.mockReturnValue(false)
    fireEvent.pointerDown(surface, { pointerId: 2, clientX: 0, clientY: 0 })
    fireUp(surface, { pointerId: 2, clientX: 0, clientY: 0 })
    expect(pointerCapture.releasePointerCapture).not.toHaveBeenCalled()
  }

  it('pointerup releases capture only when the element currently has it', () => {
    expectReleaseGuardedByHasPointerCapture(fireEvent.pointerUp)
  })

  it('pointercancel releases capture only when the element currently has it', () => {
    expectReleaseGuardedByHasPointerCapture(fireEvent.pointerCancel)
  })
})

describe('onPanEnd', () => {
  it('is called on pointerup, whether or not the release resolves as a tap', () => {
    const { surface, onPanEnd } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 0, clientY: 0 })

    expect(onPanEnd).toHaveBeenCalledTimes(1)
  })

  it('is called on pointercancel', () => {
    const { surface, onPanEnd } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 20, clientY: 0 })
    fireEvent.pointerCancel(surface, { pointerId: 1, clientX: 20, clientY: 0 })

    expect(onPanEnd).toHaveBeenCalledTimes(1)
  })

  it('runs before onTap is resolved on pointerup', () => {
    const callOrder: string[] = []
    const onPanEnd = vi.fn(() => callOrder.push('onPanEnd'))
    const onTap = vi.fn(() => callOrder.push('onTap'))
    const { surface } = renderHarness({ onPanEnd, onTap })

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 0, clientY: 0 })

    expect(callOrder).toEqual(['onPanEnd', 'onTap'])
  })

  it('runs before pointer capture is released on pointerup', () => {
    const callOrder: string[] = []
    const onPanEnd = vi.fn(() => callOrder.push('onPanEnd'))
    pointerCapture.releasePointerCapture.mockImplementation(() => callOrder.push('release'))
    const { surface } = renderHarness({ onPanEnd })

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 0, clientY: 0 })

    expect(callOrder).toEqual(['onPanEnd', 'release'])
  })
})

describe('pointercancel', () => {
  it('resets drag state without tapping, and clears isPanning', () => {
    const { surface, onTap } = renderHarness()

    fireEvent.pointerDown(surface, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 20, clientY: 0 })
    expect(surface.dataset.panning).toBe('true')

    fireEvent.pointerCancel(surface, { pointerId: 1, clientX: 20, clientY: 0 })

    expect(onTap).not.toHaveBeenCalled()
    expect(surface.dataset.panning).toBe('false')
  })
})
