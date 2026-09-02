import { it } from '@fast-check/vitest'
import fc from 'fast-check'
import { describe, expect } from 'vitest'
import {
  clampCellSize,
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  zoomCameraAtPoint,
  zoomCameraToCellSize,
  zoomPercentage,
  ZOOM_FACTOR,
  type Camera,
} from './camera'
import { advanceZoomTarget, glideCellSizeAt, GLIDE_DURATION_MS, isGlideComplete, type ZoomGlide } from './zoomGlide'
import { cameraArbitrary as camera, pixelArbitrary as pixel } from './test-support/arbitraries'

// FRACTIONAL cell sizes, not test-support/arbitraries.ts's integer
// cellSizeArbitrary, and the distinction is the whole point of this file.
// Every cellSize this app actually reaches past the first rung is fractional
// (20 -> 25 -> 31.25 -> 39.0625 ...; 20 -> 16 -> 12.8 -> 10.24 ...), and the
// float behaviour these properties are about -- an interpolation that lands
// one ULP off its endpoint, a clamp that is or isn't idempotent on the value
// just derived -- is invisible over integers. An integer arbitrary here would
// be an arbitrary narrowed until it could no longer see the thing.
const glideCellSize = fc.double({ min: MIN_CELL_SIZE, max: MAX_CELL_SIZE, noNaN: true })

// Both directions and both magnitudes, spanning past the clamp on each side:
// ZOOM_FACTOR and 1/ZOOM_FACTOR are what the toolbar actually sends, and the
// wider range is what makes the clamp reachable within one step.
const zoomFactor = fc.double({ min: 0.05, max: 20, noNaN: true })

const timestamp = fc.double({ min: -1e6, max: 1e6, noNaN: true })
const duration = fc.integer({ min: 0, max: 2000 })

const glideArbitrary: fc.Arbitrary<ZoomGlide> = fc.record({
  fromCellSize: glideCellSize,
  toCellSize: glideCellSize,
  startedAtMs: timestamp,
  durationMs: duration,
})

function low(glide: ZoomGlide) {
  return Math.min(glide.fromCellSize, glide.toCellSize)
}

function high(glide: ZoomGlide) {
  return Math.max(glide.fromCellSize, glide.toCellSize)
}

describe('glideCellSizeAt (property)', () => {
  it.prop([glideArbitrary, timestamp])(
    'never leaves the closed interval between fromCellSize and toCellSize, at any timestamp at all',
    (glide, nowMs) => {
      const value = glideCellSizeAt(glide, nowMs)
      expect(value).toBeGreaterThanOrEqual(low(glide))
      expect(value).toBeLessThanOrEqual(high(glide))
    },
  )

  // NO OVERSHOOT IS A CLAIM ABOUT THE WHOLE TRAJECTORY, not about sampled
  // instants -- the .feature's "should never have gone past 125" is read off
  // a MutationObserver trail that sees every commit. A bounded check at 100
  // random instants can miss a curve that bulges past its endpoint briefly,
  // so this walks a dense, ordered sweep across the glide and its
  // surroundings rather than trusting isolated samples.
  it.prop([glideArbitrary])('never overshoots anywhere along a dense sweep of its own duration', (glide) => {
    const span = glide.durationMs > 0 ? glide.durationMs : 1
    for (let step = -5; step <= 105; step++) {
      const value = glideCellSizeAt(glide, glide.startedAtMs + (span * step) / 100)
      expect(value).toBeGreaterThanOrEqual(low(glide))
      expect(value).toBeLessThanOrEqual(high(glide))
    }
  })

  it.prop([glideArbitrary, timestamp, timestamp])(
    'moves monotonically toward toCellSize as time advances, in whichever direction it is travelling',
    (glide, a, b) => {
      const earlier = Math.min(a, b)
      const later = Math.max(a, b)
      const travelled = glideCellSizeAt(glide, later) - glideCellSizeAt(glide, earlier)
      const direction = glide.toCellSize - glide.fromCellSize
      // >= 0 rather than > 0: a completed, a not-yet-started, or a
      // zero-distance glide all legitimately stand still.
      expect(travelled * direction).toBeGreaterThanOrEqual(0)
    },
  )

  // EXACT LANDING, and the reason this is quantified over FRACTIONAL sizes
  // rather than asserted on a hand-picked pair: `progress >= 1 ? toCellSize
  // : ...` is only distinguishable from the eased fallback beneath it when
  // `fromCellSize + (toCellSize - fromCellSize)` is not bit-identical to
  // toCellSize, which no "nice" integer pair ever manages. An exact-landing
  // test built on 20 -> 40 passes just as happily with the exact-landing
  // branch deleted -- that is a measured failure of an earlier draft in this
  // slice, not a hypothetical.
  it.prop([glideArbitrary, fc.double({ min: 0, max: 1e6, noNaN: true })])(
    'returns toCellSize bit-for-bit at and after completion, never an eased value near it',
    (glide, overshootMs) => {
      const nowMs = glide.startedAtMs + glide.durationMs + overshootMs
      // "AFTER COMPLETION" IS A CLAIM ABOUT ELAPSED TIME, and elapsed time is
      // what progressAt actually computes -- see the boundary property below
      // for the full measurement of why the two differ. Adding durationMs to
      // a timestamp can round DOWN, so for a small enough overshoot this
      // expression names an instant that is still, correctly, mid-glide.
      // Measured at 2 failing runs in 400 before this guard.
      fc.pre(nowMs - glide.startedAtMs >= glide.durationMs)
      expect(glideCellSizeAt(glide, nowMs)).toBe(glide.toCellSize)
    },
  )

  it.prop([glideArbitrary, fc.double({ min: 0, max: 1e6, noNaN: true })])(
    'returns fromCellSize bit-for-bit at its start, and stays there for any earlier timestamp',
    (glide, backwardsMs) => {
      expect(glideCellSizeAt(glide, glide.startedAtMs)).toBe(
        glide.durationMs > 0 ? glide.fromCellSize : glide.toCellSize,
      )
      // A clock that runs backwards -- fast-check will not stumble onto a
      // negative elapsed time on its own, since startedAtMs is itself
      // generated, so it is constructed here.
      expect(glideCellSizeAt(glide, glide.startedAtMs - backwardsMs)).toBe(
        glide.durationMs > 0 ? glide.fromCellSize : glide.toCellSize,
      )
    },
  )

  // The contract useZoomGlide.ts leans on when it clears stateRef the moment
  // isGlideComplete says so: by then the value it has just applied must
  // ALREADY be the exact target, or the glide stops one ULP short of the
  // rung and the readout can rest on the wrong percentage. Only the forward
  // direction is stated -- the converse is false for a zero-distance glide,
  // where every value equals toCellSize from the start.
  it.prop([glideArbitrary, timestamp])(
    'whenever isGlideComplete says so, glideCellSizeAt has already landed exactly on toCellSize',
    (glide, nowMs) => {
      fc.pre(isGlideComplete(glide, nowMs))
      expect(glideCellSizeAt(glide, nowMs)).toBe(glide.toCellSize)
    },
  )

  // Sampled AT the boundary rather than around it: the property above draws
  // nowMs freely and essentially never hits startedAtMs + durationMs exactly,
  // which is the single instant where `progress >= 1` and `progress > 1`
  // disagree.
  it.prop([glideArbitrary])('is complete, and exactly landed, at the instant its duration elapses', (glide) => {
    const atBoundary = glide.startedAtMs + glide.durationMs
    // MEASURED FLAKE (hardener, smooth-zoom-transitions): as first written
    // this property failed 7 runs in 60, and the module was right every
    // time. `startedAtMs + durationMs` is a REAL-number instant, and
    // fl(startedAtMs + durationMs) rounds DOWN whenever the sum crosses into
    // a coarser binade -- so the representable timestamp it yields denotes an
    // instant a fraction of an ULP BEFORE completion, and "not complete" is
    // the correct answer there. Counterexample from seed=-1448494908:
    // startedAtMs 52.212484599652846, durationMs 1996, where
    // (startedAtMs + 1996) - startedAtMs is 1995.9999999999998 and progress
    // is 0.9999999999999999.
    //
    // NOT AN ARBITRARY NARROWED UNTIL IT STOPPED SEEING THE THING -- the
    // draws stay full-precision (this file's header explains why integers
    // would be), and what is excluded is only a timestamp that does not
    // denote the instant this property is about. progressAt reads
    // (nowMs - startedAtMs), so the boundary instant, in the module's own
    // arithmetic, is any nowMs where THAT difference is the whole duration;
    // the line below says exactly that and nothing weaker. It retains ~98% of
    // draws, and every retained case sits exactly on progress === 1, so the
    // `>= 1` vs `> 1` discrimination this test exists for is untouched --
    // verified by hand-applying that mutant, which still reds this property.
    // zoomGlide.test.ts pins the same boundary deterministically at 1000/200
    // besides.
    fc.pre(atBoundary - glide.startedAtMs === glide.durationMs)
    expect(isGlideComplete(glide, atBoundary)).toBe(true)
    expect(glideCellSizeAt(glide, atBoundary)).toBe(glide.toCellSize)
  })

  // DEGENERATE VALUES, PINNED DETERMINISTICALLY rather than left to the
  // generator -- each is a single point in a continuous space the arbitraries
  // above would essentially never sample.
  it('duration 0 (reduced motion) lands on toCellSize at every timestamp, including before it started', () => {
    const snap: ZoomGlide = { fromCellSize: 20, toCellSize: 31.25, startedAtMs: 500, durationMs: 0 }
    for (const nowMs of [-1e9, 0, 499, 500, 501, 1e9]) {
      expect(glideCellSizeAt(snap, nowMs)).toBe(31.25)
      expect(isGlideComplete(snap, nowMs)).toBe(true)
    }
  })

  it('a zero-distance glide stands exactly still for its whole duration', () => {
    const still: ZoomGlide = { fromCellSize: 12.8, toCellSize: 12.8, startedAtMs: 0, durationMs: GLIDE_DURATION_MS }
    for (const nowMs of [-100, 0, 1, 100, 199, 200, 5000]) {
      expect(glideCellSizeAt(still, nowMs)).toBe(12.8)
    }
  })
})

describe('advanceZoomTarget (property)', () => {
  it.prop([fc.option(glideArbitrary, { nil: null }), glideCellSize, zoomFactor, timestamp, duration])(
    'never proposes a target outside [MIN_CELL_SIZE, MAX_CELL_SIZE], however far the factor reaches',
    (prev, currentCellSize, factor, nowMs, durationMs) => {
      const next = advanceZoomTarget(prev, currentCellSize, factor, nowMs, durationMs)
      fc.pre(next !== null)
      expect(next.toCellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZE)
      expect(next.toCellSize).toBeLessThanOrEqual(MAX_CELL_SIZE)
    },
  )

  it.prop([fc.option(glideArbitrary, { nil: null }), glideCellSize, zoomFactor, timestamp, duration])(
    'starts every glide it does propose from the cellSize actually on screen, and returns null exactly when there is nowhere to travel',
    (prev, currentCellSize, factor, nowMs, durationMs) => {
      const next = advanceZoomTarget(prev, currentCellSize, factor, nowMs, durationMs)
      if (next === null) {
        // Nothing to travel: the only sanctioned reason to refuse a click.
        expect(clampCellSize((prev?.toCellSize ?? currentCellSize) * factor)).toBe(currentCellSize)
        return
      }
      expect(next.fromCellSize).toBe(currentCellSize)
      expect(next.toCellSize).not.toBe(currentCellSize)
      expect(next.startedAtMs).toBe(nowMs)
      expect(next.durationMs).toBe(durationMs)
    },
  )

  // THE HEADLINE INVARIANT OF THIS MODULE, and the one clause the .feature
  // can only ever state at n = 2, in one direction, from one starting rung:
  // CLICKING FASTER THAN THE VIEW CAN FOLLOW LANDS EXACTLY WHERE CLICKING
  // SLOWLY DOES. The fast path chains each click off the PENDING glide's own
  // target while the displayed cellSize has not moved at all; the settled
  // path chains off a displayed cellSize that has caught up every time. Two
  // different code paths through one function, required to agree.
  //
  // Quantified over ARBITRARY MIXED SEQUENCES, not a single repeated
  // direction, because that is what subsumes the rest of this module's
  // contract into one statement: "two quick clicks -> 156%" is an
  // in-in prefix, "extra clicks past the maximum bank nothing" is an
  // in^n-out sequence, and "an immediate opposite click nets to nothing" is
  // in-out. An earlier draft of this file stated that last one on its own,
  // as "an opposite click never moves the view", and fast-check refuted it in
  // five cases: from 8.000000000000002, a zoom-out CLAMPS to 8 and the
  // following zoom-in then chains off the clamp to 10 -- a real move, and the
  // correct one, since settled clicking goes 41% -> 40% -> 50% and arrives at
  // exactly the same place. The over-claim was the property, not the code.
  //
  // REST AFTER A NULL IS THE START, NOT THE PREVIOUS TARGET. A null return
  // means the pending glide is CLEARED and the view stays where it is
  // displayed -- modelling it as "keep the last target" is what makes the
  // in-out case look like a divergence when it is the whole point of Ruling
  // 4's clear-don't-no-op rule.
  it.prop([glideCellSize, fc.array(fc.constantFrom(ZOOM_FACTOR, 1 / ZOOM_FACTOR), { minLength: 1, maxLength: 12 })])(
    'any burst of clicks faster than the view can follow rests exactly where the same clicks settled one at a time do',
    (startCellSize, factors) => {
      let fastGlide: ZoomGlide | null = null
      let fastResting = startCellSize
      factors.forEach((factor, click) => {
        // The display never moves in this path: currentCellSize stays at the
        // start throughout, which is what a burst inside one frame looks like.
        fastGlide = advanceZoomTarget(fastGlide, startCellSize, factor, click, GLIDE_DURATION_MS)
        fastResting = fastGlide === null ? startCellSize : fastGlide.toCellSize
      })

      let settledResting = startCellSize
      factors.forEach((factor, click) => {
        // Each click starts from a settled view: no pending glide, and the
        // displayed cellSize is wherever the previous click came to rest.
        const next = advanceZoomTarget(null, settledResting, factor, click, GLIDE_DURATION_MS)
        if (next !== null) settledResting = next.toCellSize
      })

      expect(fastResting).toBe(settledResting)
    },
  )

  // THE BANKED-CLICKS CLAUSE, GENERALIZED. Once the target has saturated at
  // a clamp, further clicks in the same direction must bank NOTHING, so the
  // first opposite click answers immediately with one rung back -- which is
  // the .feature's "zooming out answers the first click after the maximum is
  // reached" (300% -> 240%), stated here for any number of extra clicks and
  // both clamps.
  it.prop([fc.integer({ min: 0, max: 20 }), fc.boolean()])(
    'extra clicks past a clamp bank nothing: the first opposite click still answers with exactly one rung back',
    (extraClicks, towardMax) => {
      const clamp = towardMax ? MAX_CELL_SIZE : MIN_CELL_SIZE
      const saturating = towardMax ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      const opposite = towardMax ? 1 / ZOOM_FACTOR : ZOOM_FACTOR

      let glide: ZoomGlide | null = null
      for (let click = 0; click < extraClicks; click++) {
        glide = advanceZoomTarget(glide, clamp, saturating, click, GLIDE_DURATION_MS)
        expect(glide).toBeNull()
      }

      const back = advanceZoomTarget(glide, clamp, opposite, extraClicks, GLIDE_DURATION_MS)
      expect(back?.toCellSize).toBe(clampCellSize(clamp * opposite))
    },
  )

  // DEGENERATE VALUES, PINNED DETERMINISTICALLY. A factor of exactly 1 is a
  // single point the double arbitrary above will not sample, and it is the
  // one factor that must never produce a glide from any state at all.
  it.prop([fc.option(glideArbitrary, { nil: null }), glideCellSize, timestamp, duration])(
    'a factor of exactly 1 from a settled view never starts a glide',
    (_prev, currentCellSize, nowMs, durationMs) => {
      expect(advanceZoomTarget(null, currentCellSize, 1, nowMs, durationMs)).toBeNull()
    },
  )

  // THE EXACT CASE, PINNED: at a rung whose factor round-trip is float-exact,
  // the opposite click really does return null and no glide runs at all.
  // These four are the ones the .feature and the e2e specs actually exercise.
  it('at a float-exact rung, an immediate opposite click clears the pending glide outright', () => {
    for (const [start, first, second] of [
      [20, ZOOM_FACTOR, 1 / ZOOM_FACTOR],
      [20, 1 / ZOOM_FACTOR, ZOOM_FACTOR],
      [25, 1 / ZOOM_FACTOR, ZOOM_FACTOR],
      [31.25, ZOOM_FACTOR, 1 / ZOOM_FACTOR],
    ] as const) {
      const pending = advanceZoomTarget(null, start, first, 0, GLIDE_DURATION_MS)
      expect(pending).not.toBeNull()
      expect(advanceZoomTarget(pending, start, second, 1, GLIDE_DURATION_MS)).toBeNull()
    }
  })

  // THE INEXACT CASE, PINNED, because it is a real property of this app's
  // rungs and not a hypothetical: 12.8 is the 64% rung, and
  // clampCellSize((12.8 / 1.25) * 1.25) is 12.800000000000002, not 12.8. So
  // an out-then-in double click there returns a GLIDE of two ULP rather than
  // null, and 200ms of frames run to move the camera by ~1e-15 world units.
  //
  // Deliberately not "fixed" with an epsilon comparison in advanceZoomTarget.
  // The arithmetic is clampCellSize(base * factor), which is exactly what
  // camera.ts's zoomCameraAtPoint has always done -- zooming out and back in
  // at this rung landed on 12.800000000000002 before this slice existed too,
  // so the residual predates the glide and the glide only makes it visible as
  // a non-null return. An epsilon would be new behaviour, and it would have
  // to agree with zoomCameraToCellSize's own exact-equality same-reference
  // bail or the two would disagree about what "no change" means.
  //
  // What makes it harmless is measurable rather than asserted by hand:
  // the readout rounds both values to the same whole percent, so nothing a
  // player or the MutationObserver trail can see ever moves.
  it('at an inexact rung the same double click leaves a sub-ULP residual glide, which is invisible at every observable', () => {
    const pending = advanceZoomTarget(null, 12.8, 1 / ZOOM_FACTOR, 0, GLIDE_DURATION_MS)
    const residual = advanceZoomTarget(pending, 12.8, ZOOM_FACTOR, 1, GLIDE_DURATION_MS)
    expect(residual).not.toBeNull()
    expect(residual?.toCellSize).toBe(12.800000000000002)
    expect(zoomPercentage({ offsetX: 0, offsetY: 0, cellSize: residual!.toCellSize })).toBe(
      zoomPercentage({ offsetX: 0, offsetY: 0, cellSize: 12.8 }),
    )
  })
})

// THE EXACTNESS CLAIM useZoomGlide.ts's fixed-fromCamera design rests on,
// quantified. Its completion frame is zoomCameraToCellSize(fromCamera,
// anchor, toCellSize), and the whole argument for recomputing every frame
// from one fixed camera is that this lands BIT-IDENTICALLY on the camera an
// instantaneous zoom would have produced -- which is what keeps
// useCamera.test.ts's exact toEqual(zoomCameraAtPoint(...)) assertions and
// features/camera-pan-and-zoom.e2e.spec.ts's zero-tolerance pixel reads
// meaning what they meant before this slice. It holds because
// advanceZoomTarget clamps with the same bounds zoomCameraToCellSize clamps
// with, and clampCellSize is idempotent; a target rounded, quantized or
// clamped differently on the way through would break it silently.
describe('the glide completion frame against an instantaneous zoom (property)', () => {
  it.prop([camera, pixel, pixel, zoomFactor])(
    'lands on exactly the camera a single instantaneous zoom of the same factor produces',
    (cam: Camera, anchorX, anchorY, factor) => {
      const glide = advanceZoomTarget(null, cam.cellSize, factor, 0, GLIDE_DURATION_MS)
      const instantaneous = zoomCameraAtPoint(cam, anchorX, anchorY, factor)
      if (glide === null) {
        // No glide is proposed exactly when the zoom is a clamped no-op, and
        // then the instantaneous form returns the same camera by reference.
        expect(instantaneous).toBe(cam)
        return
      }
      const completionFrame = zoomCameraToCellSize(
        cam,
        anchorX,
        anchorY,
        glideCellSizeAt(glide, glide.startedAtMs + glide.durationMs),
      )
      expect(completionFrame).toEqual(instantaneous)
    },
  )
})
