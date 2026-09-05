import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useMatchMedia } from './useMatchMedia'

const QUERY = '(prefers-test: probe)'

let matchMedia: MatchMediaController

// The generic subscribe/unsubscribe lifecycle both useReducedMotion.ts and
// useSystemAppearance.ts inherit by composing this hook -- proven once here
// rather than once per composer, which is what a `removes its change
// listener on unmount` test duplicated verbatim in both of those files' own
// suites used to do (dry4ts flagged it at score 1.00). Each composer's own
// test file keeps only what's genuinely its: the exact query it passes and
// the value it derives from the raw boolean.
describe('useMatchMedia', () => {
  it.each([{ initial: false }, { initial: true }])(
    'reports the raw matchMedia boolean, $initial, at mount',
    ({ initial }) => {
      matchMedia = stubMatchMedia(initial)
      const { result } = renderHook(() => useMatchMedia(QUERY))
      expect(result.current).toBe(initial)
    },
  )

  it('updates when the underlying media query changes', () => {
    matchMedia = stubMatchMedia(false)
    const { result } = renderHook(() => useMatchMedia(QUERY))

    matchMedia.changeTo(true)
    expect(result.current).toBe(true)
  })

  it('subscribes exactly one listener while mounted', () => {
    matchMedia = stubMatchMedia(false)
    renderHook(() => useMatchMedia(QUERY))
    expect(matchMedia.listenerCount()).toBe(1)
  })

  it('removes its change listener on unmount, so a later change is not observed by a stale subscription', () => {
    matchMedia = stubMatchMedia(false)
    const { unmount } = renderHook(() => useMatchMedia(QUERY))
    expect(matchMedia.listenerCount()).toBe(1)

    unmount()
    expect(matchMedia.listenerCount()).toBe(0)
  })
})
