import type { Appearance } from '../appearance'
import { useMatchMedia } from './useMatchMedia'

const QUERY = '(prefers-color-scheme: dark)'

/**
 * Which appearance the OS/browser is currently asking for, live. This is the
 * live system reading a stored 'system' preference has to be resolved against;
 * the resolution rule itself is appearance.ts's resolveAppearance.
 */
// See useMatchMedia.ts for the shared subscribe/getSnapshot plumbing and for
// why there's no `typeof matchMedia` guard.
export function useSystemAppearance(): Appearance {
  return useMatchMedia(QUERY) ? 'dark' : 'light'
}
