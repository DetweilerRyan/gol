import { describe, expect, it } from 'vitest'
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE, ZOOM_FACTOR } from './camera'
import {
  advanceZoomTarget,
  glideCellSizeAt,
  glideDurationMs,
  GLIDE_DURATION_MS,
  isGlideComplete,
  REDUCED_MOTION_DURATION_MS,
  type ZoomGlide,
} from './zoomGlide'

describe('glideDurationMs', () => {
  it('returns the ordinary glide duration when motion is not reduced', () => {
    expect(glideDurationMs(false)).toBe(GLIDE_DURATION_MS)
  })

  it('returns zero -- collapsing the glide to an instantaneous snap -- when motion is reduced', () => {
    expect(glideDurationMs(true)).toBe(REDUCED_MOTION_DURATION_MS)
    expect(glideDurationMs(true)).toBe(0)
  })
})

describe('advanceZoomTarget', () => {
  it('from rest, creates a glide from the current cellSize to factor * current, clamped', () => {
    const glide = advanceZoomTarget(null, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 1000, 200)
    expect(glide).toEqual({
      fromCellSize: DEFAULT_CELL_SIZE,
      toCellSize: DEFAULT_CELL_SIZE * ZOOM_FACTOR,
      startedAtMs: 1000,
      durationMs: 200,
    })
  })

  it('returns null (no glide) for a factor that leaves the clamped cellSize unchanged', () => {
    expect(advanceZoomTarget(null, DEFAULT_CELL_SIZE, 1, 0, 200)).toBeNull()
  })

  // The "two quick clicks -> 156%" guard: the SECOND click's base is the
  // FIRST glide's own target, not the still-unmoved displayed cellSize, so
  // successive clicks chain rungs instead of repeatedly re-requesting the
  // same one.
  it('chains a second click onto the pending glide target rather than repeating the first rung', () => {
    const first = advanceZoomTarget(null, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 0, 200)
    expect(first).not.toBeNull()
    // No frame has run yet -- the displayed cellSize is still DEFAULT_CELL_SIZE.
    const second = advanceZoomTarget(first, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 5, 200)
    expect(second?.toCellSize).toBeCloseTo(DEFAULT_CELL_SIZE * ZOOM_FACTOR * ZOOM_FACTOR)
    expect(second?.fromCellSize).toBe(DEFAULT_CELL_SIZE)
  })

  // Ruling 4's worked example, verbatim: at rest 100% (cellSize 20), click
  // zoom-in creates a glide targeting 25 while nothing has rendered yet
  // (displayed cellSize still 20), then an immediate opposite click must
  // clear that pending glide -- returning null -- rather than leaving it to
  // run, which would land the user a rung above where they started despite
  // clicking in and then straight back out.
  describe('an immediate opposite click clears the pending glide (returns null), rather than leaving it running', () => {
    it('zoom-in then zoom-out, before any frame has moved the displayed cellSize, nets to null', () => {
      const zoomedIn = advanceZoomTarget(null, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 0, 200)
      expect(zoomedIn).toEqual({
        fromCellSize: DEFAULT_CELL_SIZE,
        toCellSize: DEFAULT_CELL_SIZE * ZOOM_FACTOR,
        startedAtMs: 0,
        durationMs: 200,
      })

      // currentCellSize is still DEFAULT_CELL_SIZE: no frame has run, so
      // nothing has actually been displayed yet.
      const clearedByZoomOut = advanceZoomTarget(zoomedIn, DEFAULT_CELL_SIZE, 1 / ZOOM_FACTOR, 5, 200)
      expect(clearedByZoomOut).toBeNull()
    })

    it('is symmetric: zoom-out then zoom-in also nets to null', () => {
      const zoomedOut = advanceZoomTarget(null, DEFAULT_CELL_SIZE, 1 / ZOOM_FACTOR, 0, 200)
      expect(zoomedOut).not.toBeNull()

      const clearedByZoomIn = advanceZoomTarget(zoomedOut, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 5, 200)
      expect(clearedByZoomIn).toBeNull()
    })
  })

  // The clamp identity carries through the base-chaining rule: once the
  // pending target has already saturated, further clicks in the same
  // direction keep re-deriving the same clamped target and therefore keep
  // returning null -- no glide, no rAF, no spin.
  it('repeated zoom-in clicks once already at MAX_CELL_SIZE bank nothing', () => {
    expect(advanceZoomTarget(null, MAX_CELL_SIZE, ZOOM_FACTOR, 0, 200)).toBeNull()
  })

  it('repeated zoom-out clicks once already at MIN_CELL_SIZE bank nothing', () => {
    expect(advanceZoomTarget(null, MIN_CELL_SIZE, 1 / ZOOM_FACTOR, 0, 200)).toBeNull()
  })

  it('a pending glide already targeting the clamp, once the displayed cellSize has also reached it, banks nothing on a further click', () => {
    const atMax = advanceZoomTarget(null, MAX_CELL_SIZE / ZOOM_FACTOR, ZOOM_FACTOR, 0, 200)
    expect(atMax).toEqual({
      fromCellSize: MAX_CELL_SIZE / ZOOM_FACTOR,
      toCellSize: MAX_CELL_SIZE,
      startedAtMs: 0,
      durationMs: 200,
    })
    // The display has now caught up to MAX_CELL_SIZE (the glide finished).
    const stillAtClamp = advanceZoomTarget(atMax, MAX_CELL_SIZE, ZOOM_FACTOR, 5, 200)
    expect(stillAtClamp).toBeNull()
  })

  it('a pending glide targeting the clamp, while the display has not yet caught up, still produces a fresh glide (not null) -- it is a real, unfinished transition', () => {
    const nearMax = advanceZoomTarget(null, MAX_CELL_SIZE / ZOOM_FACTOR, ZOOM_FACTOR, 0, 200)
    expect(nearMax?.toCellSize).toBe(MAX_CELL_SIZE)
    // Still displaying the pre-glide cellSize -- no frame has run yet, so
    // there is genuine ground left to cover between 48 and 60.
    const stillGliding = advanceZoomTarget(nearMax, MAX_CELL_SIZE / ZOOM_FACTOR, ZOOM_FACTOR, 5, 200)
    expect(stillGliding).toEqual({
      fromCellSize: MAX_CELL_SIZE / ZOOM_FACTOR,
      toCellSize: MAX_CELL_SIZE,
      startedAtMs: 5,
      durationMs: 200,
    })
  })

  it('carries the requested startedAtMs and durationMs onto the new glide unchanged', () => {
    const glide = advanceZoomTarget(null, DEFAULT_CELL_SIZE, ZOOM_FACTOR, 12345, 0)
    expect(glide?.startedAtMs).toBe(12345)
    expect(glide?.durationMs).toBe(0)
  })
})

describe('glideCellSizeAt', () => {
  it('returns fromCellSize exactly at the glide start (progress 0)', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 1000, durationMs: 200 }
    expect(glideCellSizeAt(glide, 1000)).toBe(20)
  })

  it('returns toCellSize exactly once the duration has elapsed (exact landing)', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 1000, durationMs: 200 }
    expect(glideCellSizeAt(glide, 1200)).toBe(40)
  })

  it('returns toCellSize exactly well past the duration too, never an eased value near it', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 1000, durationMs: 200 }
    expect(glideCellSizeAt(glide, 50000)).toBe(40)
  })

  it('is ease-out: covers more than half the total distance in the first half of the duration', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 1000, durationMs: 200 }
    const atHalfway = glideCellSizeAt(glide, 1100)
    expect(atHalfway - glide.fromCellSize).toBeGreaterThan((glide.toCellSize - glide.fromCellSize) / 2)
  })

  it('never overshoots toCellSize or undershoots fromCellSize for a zoom-in glide, at any sampled time', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 0, durationMs: 200 }
    for (const nowMs of [0, 1, 25, 50, 100, 150, 199, 200, 500]) {
      const value = glideCellSizeAt(glide, nowMs)
      expect(value).toBeGreaterThanOrEqual(20)
      expect(value).toBeLessThanOrEqual(40)
    }
  })

  it('never overshoots toCellSize or undershoots fromCellSize for a zoom-out glide, at any sampled time', () => {
    const glide: ZoomGlide = { fromCellSize: 40, toCellSize: 20, startedAtMs: 0, durationMs: 200 }
    for (const nowMs of [0, 1, 25, 50, 100, 150, 199, 200, 500]) {
      const value = glideCellSizeAt(glide, nowMs)
      expect(value).toBeGreaterThanOrEqual(20)
      expect(value).toBeLessThanOrEqual(40)
    }
  })

  it('is monotonically non-decreasing for a zoom-in glide as nowMs advances', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 0, durationMs: 200 }
    const samples = [0, 25, 50, 75, 100, 125, 150, 175, 200].map((nowMs) => glideCellSizeAt(glide, nowMs))
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1])
    }
  })

  it('is monotonically non-increasing for a zoom-out glide as nowMs advances', () => {
    const glide: ZoomGlide = { fromCellSize: 40, toCellSize: 20, startedAtMs: 0, durationMs: 200 }
    const samples = [0, 25, 50, 75, 100, 125, 150, 175, 200].map((nowMs) => glideCellSizeAt(glide, nowMs))
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1])
    }
  })

  it('collapses to an immediate landing on toCellSize when durationMs is 0 (reduced motion), regardless of nowMs', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 500, durationMs: 0 }
    expect(glideCellSizeAt(glide, 500)).toBe(40)
    expect(glideCellSizeAt(glide, 0)).toBe(40)
  })

  it('clamps progress to 0 (returning fromCellSize) when nowMs is before the glide started', () => {
    const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 40, startedAtMs: 1000, durationMs: 200 }
    expect(glideCellSizeAt(glide, 500)).toBe(20)
  })

  // Pins the exact arithmetic the module header comment argues from: the
  // ease-out cubic 1 - (1-t)^3 crosses the midpoint of the interpolated
  // range at t = 1 - 0.5^(1/3), which is what makes the narrowest,
  // no-second-chance rung (41% -> 40%) cross its rounding boundary at
  // ~41ms into a 200ms glide rather than lingering near either end.
  it('crosses the midpoint of the range at t = 1 - cbrt(0.5), the exact fraction the ease-out curve is chosen for', () => {
    const glide: ZoomGlide = { fromCellSize: 0, toCellSize: 100, startedAtMs: 0, durationMs: 200 }
    const crossingMs = (1 - Math.cbrt(0.5)) * 200
    expect(glideCellSizeAt(glide, crossingMs)).toBeCloseTo(50, 6)
    // A moment before, still on the fromCellSize side of the midpoint.
    expect(glideCellSizeAt(glide, crossingMs - 1)).toBeLessThan(50)
    // A moment after, past it.
    expect(glideCellSizeAt(glide, crossingMs + 1)).toBeGreaterThan(50)
  })
})

describe('isGlideComplete', () => {
  const glide: ZoomGlide = { fromCellSize: 20, toCellSize: 25, startedAtMs: 1000, durationMs: 200 }

  it('is false before the duration elapses', () => {
    expect(isGlideComplete(glide, 1199)).toBe(false)
  })

  it('is true exactly at the duration boundary', () => {
    expect(isGlideComplete(glide, 1200)).toBe(true)
  })

  it('is true well past the duration', () => {
    expect(isGlideComplete(glide, 999999)).toBe(true)
  })

  it('is true immediately for a reduced-motion (duration 0) glide, even at its own start time', () => {
    const reducedMotionGlide: ZoomGlide = { fromCellSize: 20, toCellSize: 25, startedAtMs: 500, durationMs: 0 }
    expect(isGlideComplete(reducedMotionGlide, 500)).toBe(true)
  })
})
