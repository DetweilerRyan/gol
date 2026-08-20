import { fireEvent, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stubBoundingClientRect } from '../test-support/domStubs'
import type { WheelInput } from '../viewport'
import { useWheelInput } from './useWheelInput'

// jsdom's Element.prototype.getBoundingClientRect returns an all-zero rect by
// default; converting client coordinates against that rect is this hook's
// whole job, so a controlled non-zero stub is what tells the two apart.
function stubRectAt(left: number, top: number) {
  stubBoundingClientRect({ left, top, width: 800, height: 600 })
}

beforeEach(() => {
  stubRectAt(0, 0)
})

function renderWithElement(onWheelInput: (input: WheelInput) => void) {
  const el = document.createElement('div')
  document.body.append(el)
  const utils = renderHook(() => useWheelInput({ current: el }, onWheelInput))
  return { el, ...utils }
}

describe('useWheelInput', () => {
  it('reports deltas, modifier state, and element-relative pixels for a wheel event', () => {
    stubRectAt(50, 30)
    const onWheelInput = vi.fn()
    const { el } = renderWithElement(onWheelInput)

    fireEvent.wheel(el, { clientX: 450, clientY: 330, deltaX: 12, deltaY: -34, shiftKey: true })

    expect(onWheelInput).toHaveBeenCalledWith({
      pixelX: 400,
      pixelY: 300,
      deltaX: 12,
      deltaY: -34,
      shiftKey: true,
    })
  })

  it('passes shiftKey false through unchanged', () => {
    const onWheelInput = vi.fn()
    const { el } = renderWithElement(onWheelInput)

    fireEvent.wheel(el, { clientX: 0, clientY: 0, deltaX: 0, deltaY: 5, shiftKey: false })

    expect(onWheelInput).toHaveBeenCalledWith({ pixelX: 0, pixelY: 0, deltaX: 0, deltaY: 5, shiftKey: false })
  })

  it('preventDefaults the event, which requires the listener to be non-passive', () => {
    const { el } = renderWithElement(vi.fn())

    // dispatchEvent returns false only when preventDefault actually took
    // effect, which needs both the call and a non-passive listener (jsdom
    // no-ops preventDefault on passive listeners, same as real browsers) --
    // so this one assertion covers both halves.
    const notCancelled = fireEvent.wheel(el, { clientX: 0, clientY: 0, deltaX: 0, deltaY: 1, shiftKey: false })
    expect(notCancelled).toBe(false)
  })

  it('stops listening once unmounted', () => {
    const onWheelInput = vi.fn()
    const { el, unmount } = renderWithElement(onWheelInput)
    unmount()

    fireEvent.wheel(el, { clientX: 0, clientY: 0, deltaX: 0, deltaY: 1, shiftKey: false })

    expect(onWheelInput).not.toHaveBeenCalled()
  })

  it('does nothing when the ref is still empty', () => {
    const onWheelInput = vi.fn()
    expect(() => renderHook(() => useWheelInput({ current: null }, onWheelInput))).not.toThrow()
    expect(onWheelInput).not.toHaveBeenCalled()
  })
})
