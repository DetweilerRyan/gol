import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useElementSize } from './useElementSize'

// A browser-required unit test, not an e2e spec: it imports useElementSize
// directly and never boots the app, but it needs real Chromium because it
// verifies this hook's own contract against the real ResizeObserver -- which
// jsdom has no faithful equivalent for. The sibling useElementSize.test.ts
// stubs ResizeObserver, and that stub only fires when a test calls .resize(),
// whereas the real API delivers an initial callback from observe() itself.
// Run via `npm run test:browser` (vitest.browser.config.ts).
//
// This file is additive only. Never move an assertion here out of the jsdom
// sibling: neither crap4ts nor test:mutation can see *.browser.test.ts (both
// run through vite.config.ts, which excludes the suffix), so anything deleted
// there in favor of here silently drops coverage and mutation score on
// useElementSize.ts. Everything jsdom can express deterministically -- the 0x0
// initial state, the null-ref no-op, disconnect-on-unmount, reobserve on ref
// identity change -- deliberately stays there and is not repeated here.
let mounted: HTMLElement | null = null

afterEach(() => {
  mounted?.remove()
  mounted = null
})

// border-box with zero padding and border keeps contentRect exactly equal to
// the styled size, rather than hostage to whatever the UA stylesheet adds.
function sizedElement(width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `box-sizing: border-box; padding: 0; border: 0; width: ${width}px; height: ${height}px`
  document.body.append(el)
  mounted = el
  return el
}

describe('useElementSize against a real ResizeObserver', () => {
  it('reports the size from the observation observe() fires on its own, with no manual trigger', async () => {
    const el = sizedElement(300, 120)
    const { result } = renderHook(() => useElementSize({ current: el }))

    await expect.poll(() => result.current, { timeout: 2000 }).toEqual({ width: 300, height: 120 })
  })

  it('reports the new size after the element really resizes', async () => {
    const el = sizedElement(300, 120)
    const { result } = renderHook(() => useElementSize({ current: el }))
    await expect.poll(() => result.current, { timeout: 2000 }).toEqual({ width: 300, height: 120 })

    el.style.width = '500px'

    await expect.poll(() => result.current, { timeout: 2000 }).toEqual({ width: 500, height: 120 })
  })
})
