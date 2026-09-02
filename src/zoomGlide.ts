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

// THE UPPER HALF OF THIS CLAMP IS DEAD, AND STRYKER GENERATES NO MUTANT THAT
// SAYS SO -- do not go hunting for a survivor here, and do not delete the
// half either. The previous version of this comment was headed "EQUIVALENT
// MUTANT, measured", which sent hardener looking for one; the two mutants
// Stryker does generate on the line below are MethodExpression swaps
// (`Math.min(0, t)` and `Math.max(1, Math.max(0, t))`) and both are Killed.
// No mutator expresses "remove the Math.min", so the score cannot speak to it
// in either direction -- which is exactly why the claim is hand-applied.
//
// Hand-applied, and re-measured after glideCellSizeAt was rekeyed onto the
// eased value: replacing this body with `Math.max(0, t)` leaves all 889 tests
// green. A progress above 1 reaches easeOutCubic, which maps it to a value
// above 1, which the `eased >= 1` branch short-circuits to toCellSize -- the
// same answer clamping would have given. THE LOWER HALF IS NOT DEAD: it is
// what makes a backwards clock hold at fromCellSize, and removing it reds
// three properties in zoomGlide.property.test.ts. Kept whole because clamp01
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
  const eased = easeOutCubic(progressAt(glide, nowMs))
  // Exact landing: return toCellSize itself rather than
  // fromCellSize + (toCellSize - fromCellSize) * 1, which is algebraically
  // identical but not float-identical -- and this module's callers
  // (useZoomGlide.ts's fromCamera recompute, in particular) depend on the
  // completion frame matching an instantaneous zoom bit-for-bit.
  //
  // KEYED OFF THE EASED VALUE, NOT OFF progress, and that is a correctness
  // fix rather than a tidy-up (hardener found it, architect ruled it,
  // smooth-zoom-transitions ADJUDICATE). easeOutCubic rounds to exactly 1.0
  // for progress values strictly below 1 -- 1 - (1-t)**3 with t within an ULP
  // of 1 cubes to a subnormal that vanishes in the subtraction -- so keying
  // off `progress >= 1` left a window in which this function fell through to
  // the interpolation with a multiplier of exactly 1 and returned
  // fromCellSize + (toCellSize - fromCellSize). That sum is NOT toCellSize
  // for 7.2% of cellSize pairs drawn from [MIN_CELL_SIZE, MAX_CELL_SIZE]
  // (measured, 14,482 of 200,000), so in that window the module could return
  // a value up to ~2e-15 OUTSIDE the closed interval between its own two
  // endpoints -- violating the no-overshoot guarantee this module publishes
  // and the .feature states as "should never have gone past".
  //
  // The fix is strictly conservative: progress >= 1 implies eased >= 1, so
  // every input that landed exactly before still lands exactly, and the only
  // behaviour that changes is on inputs where this function was leaving its
  // own stated interval. Measured over 20,000 replayed property runs (111
  // sampled instants each): 1 escape before, 0 after; and the returned
  // expression was probed adversarially at the extreme representable eased
  // values (nextDown(1), nextUp(0), the smallest subnormal) across 400,000
  // endpoint pairs with 0 escapes.
  //
  // DO NOT "improve" this to the endpoint-anchored form
  // `toCellSize - (toCellSize - fromCellSize) * (1 - eased)`, which reads as
  // the more symmetric way to guarantee the landing. It was measured on the
  // same harness and is four orders of magnitude WORSE -- 8,250 escapes in
  // those same 20,000 runs -- because it moves the inexactness to the
  // fromCellSize end, where nothing short-circuits it.
  if (eased >= 1) return glide.toCellSize
  return glide.fromCellSize + (glide.toCellSize - glide.fromCellSize) * eased
}

export function isGlideComplete(glide: ZoomGlide, nowMs: number): boolean {
  return progressAt(glide, nowMs) >= 1
}
