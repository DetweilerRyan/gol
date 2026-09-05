import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useReducedMotion } from './useReducedMotion'

let matchMedia: MatchMediaController

describe('useReducedMotion', () => {
  // No standalone mount-value test: useReducedMotion is a raw passthrough of
  // useMatchMedia with no transformation, so a mount assertion here was a
  // dry4ts-flagged duplicate of useMatchMedia.test.ts's own -- AND already
  // redundant within this file, since the `updates` case below asserts the
  // mount-time value (`from`) for both booleans before it ever calls
  // changeTo. Same reasoning covers `subscribes exactly one listener while
  // mounted`, dropped entirely: proven once, generically, in
  // useMatchMedia.test.ts.

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

  // Listener cleanup on unmount is useMatchMedia.ts's own contract, proven
  // once in that hook's test file rather than duplicated here and in
  // useSystemAppearance.test.ts (dry4ts flagged the two verbatim copies).
})
