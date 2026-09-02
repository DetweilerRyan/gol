// The toolbar zoom-in/out glide: a pure function of elapsed time, deliberately
// taking nowMs as a parameter rather than reading a clock itself (see
// rules/no-ambient-time-in-domain.yml). src/hooks/useZoomGlide.ts is the
// adapter that reads performance.now() and drives requestAnimationFrame;
// this module only ever answers "given a glide and a timestamp, where has it
// got to" and "given a glide and a new click, what's the next target".
//
// Only the toolbar zoom buttons glide -- wheel zoom, drag-pan, scrollbar drag
// and reset all stay instantaneous, so nothing here is reached from those
// routes.
import { clampCellSize } from './camera'

// Measured against the ease-out curve below: 200ms is long enough that
// GLIDE_PERCENTAGES-many intermediate readings are observable
// (features/steps/camera-pan-and-zoom.ts's zoomAtRest confirms rest over
// ~150ms of unchanged readings), short enough that a rapid clicker doesn't
// feel input lag.
export const GLIDE_DURATION_MS = 200

// A duration of 0 rather than a second code path -- see glideCellSizeAt and
// isGlideComplete, both of which read progress as `durationMs <= 0 ? 1 : ...`,
// so a reduced-motion glide is complete (and lands exactly on toCellSize) the
// instant it's created, with no branch anywhere in this module or the hook
// that owns the clock.
export const REDUCED_MOTION_DURATION_MS = 0

export interface ZoomGlide {
  readonly fromCellSize: number
  readonly toCellSize: number
  readonly startedAtMs: number
  readonly durationMs: number
}

// A rule rather than a ternary inline in the hook, so the reduced-motion
// choice carries its own mutant and its own test instead of being folded,
// untested, into useZoomGlide.ts's wiring.
export function glideDurationMs(prefersReducedMotion: boolean): number {
  return prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : GLIDE_DURATION_MS
}

// The base is the PENDING glide's own target, not the currently-displayed
// cellSize -- glide?.toCellSize ?? currentCellSize. That's what makes two
// quick clicks land two rungs up (20 -> 25 -> 31.25) rather than the second
// click merely re-requesting the rung the first one already asked for. The
// null-vs-currentCellSize equality check is against the ACTUAL, DISPLAYED
// cellSize the caller passes in, though, never against the pending glide's
// own start -- an in-then-out double-click must net zero motion and clear
// the pending glide entirely, not leave it running (see useZoomGlide.ts's
// header comment on why returning null has to mean "clear", not "no-op").
export function advanceZoomTarget(
  glide: ZoomGlide | null,
  currentCellSize: number,
  factor: number,
  nowMs: number,
  durationMs: number,
): ZoomGlide | null {
  const base = glide?.toCellSize ?? currentCellSize
  const target = clampCellSize(base * factor)
  if (target === currentCellSize) return null
  return { fromCellSize: currentCellSize, toCellSize: target, startedAtMs: nowMs, durationMs }
}

// EQUIVALENT MUTANT, measured -- do not chase the Math.min(1, ...) half. Both
// readers of progressAt below test `>= 1` (glideCellSizeAt returns toCellSize
// outright, isGlideComplete answers true), so a progress of 5 and a progress
// of 1 are indistinguishable everywhere and the upper clamp is unreachable
// dead weight given the exact-landing branch. Verified rather than argued:
// replacing this with `Math.max(0, t)` leaves all 889 tests green, including
// the 17 properties in zoomGlide.property.test.ts. The lower clamp is NOT
// equivalent -- it is what makes a backwards clock hold at fromCellSize, and
// removing it reds three of those properties. Kept as written because clamp01
// is a named, self-contained helper and half a clamp is a worse thing to read
// than a redundant one.
function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

function progressAt(glide: ZoomGlide, nowMs: number): number {
  return glide.durationMs <= 0 ? 1 : clamp01((nowMs - glide.startedAtMs) / glide.durationMs)
}

// Ease-out cubic -- fast departure from fromCellSize, slow convergence onto
// toCellSize. Not ease-in, not ease-in-out: the direction of the asymmetry is
// load-bearing, not a feel choice. A glide that lingers near its START (as an
// ease-in-out curve does on a short span) reads as at-rest before it has
// moved, because features/steps/camera-pan-and-zoom.ts's zoomAtRest treats
// several unchanged rounded readings as "stopped". Lingering near the END is
// safe, because by then it genuinely is settling. On this curve the
// one-percentage-point 41%->40% rung -- the narrowest span this app ever
// glides, and the one with no second reading to fall back on -- crosses its
// rounding boundary at 1 - (1-t)^3 = 0.5, i.e. t = 1 - 0.5^(1/3) ≈ 0.2063, or
// ~41ms into a 200ms glide: comfortably inside zoomAtRest's ~150ms
// confirmation window, on the correct (already-moved) side of it. Swapping in
// a different easing family, or even a different exponent, moves that
// crossing and has to be re-checked against this same rung -- don't do it
// without redoing the arithmetic in this comment.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Linear interpolation in cellSize, over an eased progress -- not a
// geometric interpolation (i.e. not fromCellSize * (toCellSize/fromCellSize)
// ** progress). The two are observably indistinguishable at this app's zoom
// ratios and glide duration; linear has fewer float traps (no fractional
// exponent, no risk of a negative or zero base) for no visible cost.
export function glideCellSizeAt(glide: ZoomGlide, nowMs: number): number {
  const progress = progressAt(glide, nowMs)
  // Exact landing: at progress >= 1, return toCellSize itself rather than
  // easeOutCubic(1) * (toCellSize - fromCellSize) + fromCellSize, which is
  // algebraically identical but not guaranteed float-identical -- and this
  // module's callers (useZoomGlide.ts's fromCamera recompute, in particular)
  // depend on the completion frame matching an instantaneous zoom bit-for-bit.
  if (progress >= 1) return glide.toCellSize
  return glide.fromCellSize + (glide.toCellSize - glide.fromCellSize) * easeOutCubic(progress)
}

export function isGlideComplete(glide: ZoomGlide, nowMs: number): boolean {
  return progressAt(glide, nowMs) >= 1
}
