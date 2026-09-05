import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { stubMatchMedia, type MatchMediaController } from '../test-support/domStubs'
import { useMatchMedia } from './useMatchMedia'

const QUERY = '(prefers-test: probe)'

let matchMedia: MatchMediaController

// Gates the identity-stability test below, on useCamera.test.ts's,
// useZoomGlide.test.ts's and Grid.test.tsx's precedent: Stryker's
// per-expression instrumentation defeats React Compiler's memoization, so an
// ungated identity assertion reds the dry run and npm run test:mutation never
// starts. globalThis.__stryker__ is set at module load by any instrumented
// file's own bootstrap, before test collection.
const underStryker = '__stryker__' in globalThis

// Every test below that doesn't need a changing query mounts the hook the
// same way (stub the system value, then render against the fixed QUERY), so
// the arrange is extracted and each test body is only the part that
// differs -- two of those bodies were flagged as dry4ts duplicates at score
// 0.83 before this extraction. The one test that mutates its own query
// (below) renders inline instead, since it needs a `let` binding the
// closure captures rather than the fixed QUERY this helper always passes.
function mountMatchMedia(initial: boolean) {
  matchMedia = stubMatchMedia(initial)
  return renderHook(() => useMatchMedia(QUERY))
}

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
      const { result } = mountMatchMedia(initial)
      expect(result.current).toBe(initial)
    },
  )

  it('updates when the underlying media query changes', () => {
    const { result } = mountMatchMedia(false)

    matchMedia.changeTo(true)
    expect(result.current).toBe(true)
  })

  it('subscribes exactly one listener while mounted', () => {
    mountMatchMedia(false)
    expect(matchMedia.listenerCount()).toBe(1)
  })

  // Both subscribe and getSnapshot are INLINE closures over `query` rather
  // than the module-level named functions useReducedMotion.ts carried before
  // this hook was extracted, so their identity stability -- and therefore
  // useSyncExternalStore's resubscribe avoidance -- is provided by React
  // Compiler rather than being structural. That is invisible to every gate
  // here (mutation testing, crap4ts and the e2e layer all pass while it
  // churns), which is the class stable-hook-identities closed, so it is
  // pinned rather than assumed. MEASURED with the shipped config: 1
  // addEventListener and 0 removeEventListener calls across three
  // re-renders. With the babel react-compiler preset removed from the same
  // probe: 4 adds and 3 removes -- one resubscribe per render, on the hook
  // useZoomGlide.ts reads once per pointermove of a drag-pan.
  //
  // listenerCount() cannot stand in for this: a resubscribe removes and
  // re-adds, so the NET count is 1 throughout either way.
  it.skipIf(underStryker)('does not resubscribe across a re-render, so a hot-path consumer pays nothing', () => {
    const { rerender } = mountMatchMedia(false)
    expect(matchMedia.addCallCount()).toBe(1)

    rerender()
    rerender()
    rerender()

    expect(matchMedia.addCallCount()).toBe(1)
    expect(matchMedia.removeCallCount()).toBe(0)
    expect(matchMedia.listenerCount()).toBe(1)
  })

  // The unskipped companion to the test above, and deliberately built on a
  // CHANGING QUERY rather than on a deliberately-unstable closure: a fresh
  // closure per render is flattened by the compiler (measured -- a probe
  // constructing one showed the same 1 add / 0 removes), so a companion built
  // that way would red the shipped config. A query change resubscribes in
  // BOTH configs (measured: 3 adds, 2 removes across two changes), so this
  // proves the counters above can see a real resubscribe -- and it pins a
  // contract in its own right, since a hook that kept its old subscription
  // after the query changed would report the wrong media query's state.
  it('resubscribes when the query itself changes, so the counters above can see a real resubscribe', () => {
    matchMedia = stubMatchMedia(false)
    let query = QUERY
    const { rerender } = renderHook(() => useMatchMedia(query))
    expect(matchMedia.addCallCount()).toBe(1)

    query = '(prefers-test: other)'
    rerender()

    expect(matchMedia.addCallCount()).toBe(2)
    expect(matchMedia.removeCallCount()).toBe(1)
    expect(matchMedia.listenerCount()).toBe(1)
  })

  it('removes its change listener on unmount, so a later change is not observed by a stale subscription', () => {
    const { unmount } = mountMatchMedia(false)
    expect(matchMedia.listenerCount()).toBe(1)

    unmount()
    expect(matchMedia.listenerCount()).toBe(0)
  })
})
