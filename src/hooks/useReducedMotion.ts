import { useMatchMedia } from './useMatchMedia'

// Whether the user has asked the OS/browser to minimize non-essential
// motion. src/hooks/useZoomGlide.ts is the one consumer: a reduced-motion
// reading feeds src/zoomGlide.ts's glideDurationMs to collapse the toolbar
// zoom glide to an instantaneous snap (duration 0) rather than skipping the
// glide machinery outright, so there is exactly one code path rather than an
// animated one and a snapping one maintained in parallel. See
// useMatchMedia.ts for the shared subscribe/getSnapshot plumbing (also used
// by useSystemAppearance.ts) and for why there's no `typeof matchMedia`
// guard.
export function useReducedMotion(): boolean {
  return useMatchMedia('(prefers-reduced-motion: reduce)')
}
