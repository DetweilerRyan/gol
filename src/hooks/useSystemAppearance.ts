import type { Appearance } from '../appearance'
import { useMatchMedia } from './useMatchMedia'

const QUERY = '(prefers-color-scheme: dark)'

// Which appearance the OS/browser is currently asking for, live. The one
// input useAppearance.ts resolves a 'system' preference against -- see
// appearance.ts's resolveAppearance. See useMatchMedia.ts for the shared
// subscribe/getSnapshot plumbing (also used by useReducedMotion.ts) and for
// why there's no `typeof matchMedia` guard.
export function useSystemAppearance(): Appearance {
  return useMatchMedia(QUERY) ? 'dark' : 'light'
}
