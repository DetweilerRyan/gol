import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { stubResizeObserver, type ResizeObserverController } from '../test-support/domStubs'
import { useElementSize } from './useElementSize'

// jsdom has no ResizeObserver at all; the shared stub records what was
// observed/disconnected and lets these tests push a controlled contentRect
// through the callback the hook registered.
let resizeObserver: ResizeObserverController

beforeEach(() => {
  resizeObserver = stubResizeObserver()
})

describe('useElementSize', () => {
  it('reports 0x0 until the first observation arrives', () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useElementSize(ref))
    expect(result.current).toEqual({ width: 0, height: 0 })
  })

  it('observes the referenced element and reports its observed content size', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useElementSize({ current: el }))

    expect(resizeObserver.latest().observed).toEqual([el])

    resizeObserver.resize(800, 600)
    expect(result.current).toEqual({ width: 800, height: 600 })

    resizeObserver.resize(1024, 120)
    expect(result.current).toEqual({ width: 1024, height: 120 })
  })

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderHook(() => useElementSize({ current: document.createElement('div') }))
    expect(resizeObserver.latest().disconnectCount).toBe(0)
    unmount()
    expect(resizeObserver.latest().disconnectCount).toBe(1)
  })

  it('observes nothing when the ref is still empty', () => {
    const { result } = renderHook(() => useElementSize({ current: null }))
    expect(resizeObserver.instances).toHaveLength(0)
    expect(result.current).toEqual({ width: 0, height: 0 })
  })

  it('disconnects the old observer and observes the new element when the ref object identity changes', () => {
    const elA = document.createElement('div')
    const elB = document.createElement('div')
    const { rerender } = renderHook(({ ref }) => useElementSize(ref), {
      initialProps: { ref: { current: elA } as { current: HTMLElement | null } },
    })
    const firstInstance = resizeObserver.latest()
    expect(firstInstance.observed).toEqual([elA])

    rerender({ ref: { current: elB } })

    expect(firstInstance.disconnectCount).toBe(1)
    expect(resizeObserver.latest().observed).toEqual([elB])
  })
})
