import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import { useLiveCell } from './useLiveCell'

// Stryker's per-expression instrumentation inserts an impure mutant-tracking
// call into every wrapped expression, including this hook's two
// useSyncExternalStore callback arguments -- which correctly defeats React
// Compiler's closure memoization (the compiler can no longer prove those
// closures are pure/stable across renders). globalThis.__stryker__ is set at
// module load by any instrumented file's own bootstrap, before test
// collection, so it reliably distinguishes a mutation-testing run from a
// normal one.
const underStryker = '__stryker__' in globalThis

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

  // Both toggle cases below watch the same cell from an empty store and differ
  // only in which cell gets toggled, so the setup is shared and each case
  // keeps its own act/assert sequence.
  function renderWatcherOnEmptyStore(x: number, y: number) {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCell(store, cellKey(x, y)))
    return { store, result }
  }

  it('re-renders with the new value when its own cell toggles', () => {
    const { store, result } = renderWatcherOnEmptyStore(2, 2)
    expect(result.current).toBe(false)

    act(() => store.toggle(2, 2))
    expect(result.current).toBe(true)

    act(() => store.toggle(2, 2))
    expect(result.current).toBe(false)
  })

  it('does not re-render when a different cell toggles', () => {
    const { store, result } = renderWatcherOnEmptyStore(2, 2)

    act(() => store.toggle(9, 9))

    expect(result.current).toBe(false)
  })

  // React Compiler is assumed to keep useLiveCell's subscribe/getSnapshot
  // closures stable across re-renders with identical (store, key) args, so
  // useSyncExternalStore doesn't resubscribe every render -- this matters on
  // the pan path, where every Cell re-renders. This test converts that
  // assumption into a checked fact rather than leaving it implicit. Skipped
  // under Stryker -- see underStryker's comment above; this file's other
  // four tests still run and still cover every mutant here under mutation
  // testing.
  it.skipIf(underStryker)('does not resubscribe on a re-render with identical store/key', () => {
    const store = createLiveCellStore()
    const subscribeSpy = vi.spyOn(store, 'subscribeCell')

    const { rerender } = renderHook(() => useLiveCell(store, cellKey(3, 3)))
    const callCountAfterMount = subscribeSpy.mock.calls.length

    rerender()
    rerender()

    expect(subscribeSpy.mock.calls.length).toBe(callCountAfterMount)
  })
})
