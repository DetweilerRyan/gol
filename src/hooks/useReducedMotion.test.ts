import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useReducedMotion } from './useReducedMotion'

let matchMedia: MatchMediaController

describe('useReducedMotion', () => {
  it('reports false when the media query does not match at mount', () => {
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('reports true when the media query already matches at mount', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates when the underlying media query changes from false to true', () => {
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    matchMedia.changeTo(true)
    expect(result.current).toBe(true)
  })

  it('updates when the underlying media query changes from true to false', () => {
    matchMedia = stubMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)

    matchMedia.changeTo(false)
    expect(result.current).toBe(false)
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
