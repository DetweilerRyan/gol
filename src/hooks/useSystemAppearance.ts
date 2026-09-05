import { useSyncExternalStore } from 'react'
import type { Appearance } from '../appearance'

const QUERY = '(prefers-color-scheme: dark)'

// No `typeof window.matchMedia === 'function'` guard, mirroring
// useReducedMotion.ts exactly: this repo's jsdom project leaves
// window.matchMedia undefined, so an unstubbed test throws loudly instead of
// silently exercising a fallback branch the real app never takes. See
// src/test-support/domStubs.ts's stubMatchMedia.
function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot(): Appearance {
  return window.matchMedia(QUERY).matches ? 'dark' : 'light'
}

// Which appearance the OS/browser is currently asking for, live. The one
// input useAppearance.ts resolves a 'system' preference against -- see
// appearance.ts's resolveAppearance.
export function useSystemAppearance(): Appearance {
  return useSyncExternalStore(subscribe, getSnapshot)
}
