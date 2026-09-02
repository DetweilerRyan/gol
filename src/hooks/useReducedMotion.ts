import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

// No `typeof window.matchMedia === 'function'` guard: this repo's jsdom
// project leaves window.matchMedia undefined (unlike requestAnimationFrame
// and performance.now, which jsdom does implement), so an unstubbed test
// throws loudly instead of silently exercising a fallback branch that would
// never run in the real app and would carry mutants nothing exercises. See
// src/test-support/domStubs.ts's stubMatchMedia, which every test of this
// hook (and of anything that composes it) must use.
function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

// Whether the user has asked the OS/browser to minimize non-essential
// motion. src/hooks/useZoomGlide.ts is the one consumer: a reduced-motion
// reading feeds src/zoomGlide.ts's glideDurationMs to collapse the toolbar
// zoom glide to an instantaneous snap (duration 0) rather than skipping the
// glide machinery outright, so there is exactly one code path rather than an
// animated one and a snapping one maintained in parallel.
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
