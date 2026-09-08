import { useMatchMedia } from './useMatchMedia'

/**
 * Whether the user has asked the OS/browser to minimize non-essential motion.
 * A true reading is meant to be fed to src/zoomGlide.ts's glideDurationMs,
 * which collapses a glide to an instantaneous snap (duration 0) -- not to gate
 * the glide machinery out of the render path, so that there is exactly one
 * code path rather than an animated one and a snapping one maintained in
 * parallel.
 */
// See useMatchMedia.ts for the shared subscribe/getSnapshot plumbing and for
// why there's no `typeof matchMedia` guard.
export function useReducedMotion(): boolean {
  return useMatchMedia('(prefers-reduced-motion: reduce)')
}
