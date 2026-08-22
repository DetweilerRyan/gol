import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import { useLiveCell } from './useLiveCell'

describe('useLiveCell', () => {
  it('reports the initial snapshot for a live cell', () => {
    const store = createLiveCellStore(new Set([cellKey(1, 1)]))
    const { result } = renderHook(() => useLiveCell(store, cellKey(1, 1)))
    expect(result.current).toBe(true)
  })

  it('reports the initial snapshot for a dead cell', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCell(store, cellKey(1, 1)))
    expect(result.current).toBe(false)
  })

  it('re-renders with the new value when its own cell toggles', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCell(store, cellKey(2, 2)))
    expect(result.current).toBe(false)

    act(() => store.toggle(2, 2))
    expect(result.current).toBe(true)

    act(() => store.toggle(2, 2))
    expect(result.current).toBe(false)
  })

  it('does not re-render when a different cell toggles', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCell(store, cellKey(2, 2)))

    act(() => store.toggle(9, 9))

    expect(result.current).toBe(false)
  })

  // React Compiler is assumed to keep useLiveCell's subscribe/getSnapshot
  // closures stable across re-renders with identical (store, key) args, so
  // useSyncExternalStore doesn't resubscribe every render -- this matters on
  // the pan path, where every Cell re-renders. This test converts that
  // assumption into a checked fact rather than leaving it implicit.
  it('does not resubscribe on a re-render with identical store/key', () => {
    const store = createLiveCellStore()
    const subscribeSpy = vi.spyOn(store, 'subscribeCell')

    const { rerender } = renderHook(() => useLiveCell(store, cellKey(3, 3)))
    const callCountAfterMount = subscribeSpy.mock.calls.length

    rerender()
    rerender()

    expect(subscribeSpy.mock.calls.length).toBe(callCountAfterMount)
  })
})
