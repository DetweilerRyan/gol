import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useSystemAppearance } from './useSystemAppearance'

let matchMedia: MatchMediaController

describe('useSystemAppearance', () => {
  it.each([
    { matches: false, expected: 'light' },
    { matches: true, expected: 'dark' },
  ])('reports $expected when the media query matches=$matches at mount', ({ matches, expected }) => {
    matchMedia = stubMatchMedia(matches)
    const { result } = renderHook(() => useSystemAppearance())
    expect(result.current).toBe(expected)
  })

  // Pins the actual query text -- stubMatchMedia's mock ignores the query
  // string entirely for its `matches` behavior, so nothing else in this file
  // would notice QUERY going empty or drifting from prefers-color-scheme.
  it('queries prefers-color-scheme, not an unconditional match', () => {
    matchMedia = stubMatchMedia(false)
    renderHook(() => useSystemAppearance())
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it.each([
    { from: false, to: true, expected: 'dark' },
    { from: true, to: false, expected: 'light' },
  ])('updates to $expected when the underlying media query changes from $from to $to', ({ from, to, expected }) => {
    matchMedia = stubMatchMedia(from)
    const { result } = renderHook(() => useSystemAppearance())
    matchMedia.changeTo(to)
    expect(result.current).toBe(expected)
  })

  it('removes its change listener on unmount', () => {
    matchMedia = stubMatchMedia(false)
    const { unmount } = renderHook(() => useSystemAppearance())
    expect(matchMedia.listenerCount()).toBe(1)

    unmount()
    expect(matchMedia.listenerCount()).toBe(0)
  })
})
