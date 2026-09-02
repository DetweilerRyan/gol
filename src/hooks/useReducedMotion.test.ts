import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useReducedMotion } from './useReducedMotion'

let matchMedia: MatchMediaController

describe('useReducedMotion', () => {
  it.each([
    { initial: false, label: 'does not match' },
    { initial: true, label: 'already matches' },
  ])('reports $initial when the media query $label at mount', ({ initial }) => {
    matchMedia = stubMatchMedia(initial)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(initial)
  })

  // Pins the actual query text -- stubMatchMedia's mock ignores the query
  // string entirely for its `matches` behavior (any query gets the same
  // stubbed answer), so nothing else in this file would notice QUERY going
  // empty.
  it('queries prefers-reduced-motion, not an unconditional match', () => {
    matchMedia = stubMatchMedia(false)
    renderHook(() => useReducedMotion())
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it.each([
    { from: false, to: true },
    { from: true, to: false },
  ])('updates when the underlying media query changes from $from to $to', ({ from, to }) => {
    matchMedia = stubMatchMedia(from)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(from)

    matchMedia.changeTo(to)
    expect(result.current).toBe(to)
  })

  it('subscribes exactly one listener while mounted', () => {
    matchMedia = stubMatchMedia(false)
    renderHook(() => useReducedMotion())
    expect(matchMedia.listenerCount()).toBe(1)
  })

  it('removes its change listener on unmount, so a later change is not observed by a stale subscription', () => {
    matchMedia = stubMatchMedia(false)
    const { unmount } = renderHook(() => useReducedMotion())
    expect(matchMedia.listenerCount()).toBe(1)

    unmount()
    expect(matchMedia.listenerCount()).toBe(0)
  })
})
