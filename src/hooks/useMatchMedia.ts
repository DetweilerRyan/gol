import { useSyncExternalStore } from 'react'

// Shared useSyncExternalStore plumbing for a boolean matchMedia query --
// useReducedMotion.ts and useSystemAppearance.ts both compose this rather
// than each carrying its own identical subscribe/getSnapshot pair (dry4ts
// flagged that pair as a score-1.00 duplicate once the second hook landed).
//
// No `typeof window.matchMedia === 'function'` guard: this repo's jsdom
// project leaves window.matchMedia undefined, so an unstubbed test throws
// loudly instead of silently exercising a fallback branch the real app never
// takes. See src/test-support/domStubs.ts's stubMatchMedia, which every test
// that reaches this hook -- directly or through one of its two composers --
// must use.
//
// getSnapshot constructs a MediaQueryList per call rather than caching one --
// through useCamera, useReducedMotion.ts is read once per pointermove of a
// drag-pan, the hottest path in the app, and a throwaway arm skipping the
// allocation entirely was MEASURED AND RULED OUT (zoom-glide-regressed-the-
// pan-path, architect's DESIGN pass) to cost nothing: 49.82/50.00 against a
// 49.97/50.00 control, i.e. no movement -- the actual regression that pass
// chased was useZoomGlide.ts returning a non-memoizable controller every
// render, unrelated to this function. A module-scope
// `const mql = window.matchMedia(query)` would run at IMPORT time and throw
// under jsdom, where matchMedia is undefined, taking down every test that
// transitively imports a composing hook rather than only the ones that
// render it; a lazily-memoised module-level cache would be mutable state
// surviving across tests, defeating stubMatchMedia's per-test overrides.
export function useMatchMedia(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(query).matches,
  )
}
