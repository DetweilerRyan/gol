import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import { useLiveCells } from './useLiveCells'

describe('useLiveCells', () => {
  it('reports an empty set for an empty store', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCells(store))
    expect(result.current.size).toBe(0)
  })

  it('reports the initial live cells for a pre-seeded store', () => {
    const store = createLiveCellStore(new Set([cellKey(1, 2), cellKey(3, 4)]))
    const { result } = renderHook(() => useLiveCells(store))
    expect(result.current.has(cellKey(1, 2))).toBe(true)
    expect(result.current.has(cellKey(3, 4))).toBe(true)
    expect(result.current.size).toBe(2)
  })

  it('re-renders with the new set when a single cell toggles', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useLiveCells(store))

    act(() => store.toggle(5, 5))

    expect(result.current.has(cellKey(5, 5))).toBe(true)
  })

  it('re-renders with the new set after a generation advances', () => {
    // A blinker: (1,0),(1,1),(1,2) -> (0,1),(1,1),(2,1) next tick.
    const store = createLiveCellStore(new Set([cellKey(1, 0), cellKey(1, 1), cellKey(1, 2)]))
    const { result } = renderHook(() => useLiveCells(store))

    act(() => store.advance())

    expect(Array.from(result.current).sort()).toEqual([cellKey(0, 1), cellKey(1, 1), cellKey(2, 1)].sort())
  })

  it('reflects store.getLiveCells() directly -- same object identity across an unrelated render', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    const { result, rerender } = renderHook(() => useLiveCells(store))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
