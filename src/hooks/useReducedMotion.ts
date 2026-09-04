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

// Constructs a MediaQueryList per call, and useSyncExternalStore calls this
// on every render of whatever composes it -- which, through useCamera, means
// once per camera change, i.e. once per pointermove of a drag-pan, the
// hottest path in the app. Left uncached deliberately: both alternatives are
// worse than a few microseconds of media-query parsing. A module-scope
// `const mql = window.matchMedia(...)` would run at IMPORT time and throw in
// jsdom, where matchMedia is undefined, taking down every test that
// transitively imports this file rather than only the ones that render it; a
// lazily-memoised module-level `let` would be global mutable state surviving
// across tests, defeating stubMatchMedia's per-test overrides.
//
// MEASURED AND RULED OUT (zoom-glide-regressed-the-pan-path, architect's
// DESIGN pass): this comment used to nominate the per-call allocation as
// "the first thing to look at" if the pan-min-zoom-* numbers moved. They did
// (~+8ms at 1280x900), and this was checked first and is NOT the cause -- a
// throwaway arm returning a constant from getSnapshot (no MediaQueryList
// allocation at all) scored 49.82/50.00 against a 49.97/50.00 control, i.e.
// no movement. The actual cause was useZoomGlide.ts returning a
// non-memoizable controller every render, fixed in that same slice -- see
// this hook's one consumer, useZoomGlide.ts, for the ref that now reads this
// hook's value instead of closing over it.
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
