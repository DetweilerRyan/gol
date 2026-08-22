import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { cellKey } from '../gameOfLife'
import { createLiveCellStore } from '../liveCellStore'
import { useContentBounds } from './useContentBounds'

describe('useContentBounds', () => {
  it('reports null for an empty store', () => {
    const store = createLiveCellStore()
    const { result } = renderHook(() => useContentBounds(store))
    expect(result.current).toBeNull()
  })

  it('reports the initial bounding box for a pre-seeded store', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    const { result } = renderHook(() => useContentBounds(store))
    expect(result.current).toEqual({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
  })

  it('re-renders with the new box when a mutation moves it', () => {
    const store = createLiveCellStore(new Set([cellKey(0, 0)]))
    const { result } = renderHook(() => useContentBounds(store))

    act(() => store.toggle(10, 10))

    expect(result.current).toEqual({ minX: 0, maxX: 11, minY: 0, maxY: 11 })
  })

  it('goes back to null once the last live cell dies', () => {
    const store = createLiveCellStore(new Set([cellKey(3, 3)]))
    const { result } = renderHook(() => useContentBounds(store))

    act(() => store.advance())

    expect(result.current).toBeNull()
  })
})
