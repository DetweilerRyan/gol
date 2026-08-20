import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useInitialCentering } from './useInitialCentering'

describe('useInitialCentering', () => {
  it('does not fire while size is zero', () => {
    const onFirstMeasure = vi.fn()
    renderHook(({ size }) => useInitialCentering(size, onFirstMeasure), {
      initialProps: { size: { width: 0, height: 0 } },
    })

    expect(onFirstMeasure).not.toHaveBeenCalled()
  })

  it('fires exactly once, on the first non-zero size', () => {
    const onFirstMeasure = vi.fn()
    const { rerender } = renderHook(({ size }) => useInitialCentering(size, onFirstMeasure), {
      initialProps: { size: { width: 0, height: 0 } },
    })

    rerender({ size: { width: 400, height: 300 } })
    expect(onFirstMeasure).toHaveBeenCalledTimes(1)
    expect(onFirstMeasure).toHaveBeenCalledWith(400, 300)
  })

  it('does not re-fire on later, different-size observations', () => {
    const onFirstMeasure = vi.fn()
    const { rerender } = renderHook(({ size }) => useInitialCentering(size, onFirstMeasure), {
      initialProps: { size: { width: 400, height: 300 } },
    })
    expect(onFirstMeasure).toHaveBeenCalledTimes(1)

    rerender({ size: { width: 900, height: 700 } })
    expect(onFirstMeasure).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['width', { width: 0, height: 300 }],
    ['height', { width: 400, height: 0 }],
  ])('does not fire while only %s is zero', (_label, size) => {
    const onFirstMeasure = vi.fn()
    renderHook(({ size }) => useInitialCentering(size, onFirstMeasure), {
      initialProps: { size },
    })

    expect(onFirstMeasure).not.toHaveBeenCalled()
  })
})
