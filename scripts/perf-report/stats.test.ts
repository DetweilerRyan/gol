import { describe, expect, it } from 'vitest'
import { aggregate, median, percentile, taskDurationToWallClockRatio } from './stats.ts'
import { rep, sample } from './test-support.ts'

describe('percentile', () => {
  it('interpolates the median of an even-length array', () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5)
  })

  it('interpolates the median of an odd-length array', () => {
    expect(percentile([1, 2, 3], 50)).toBe(2)
  })

  it('returns the minimum at p0', () => {
    expect(percentile([1, 2, 3, 4], 0)).toBe(1)
  })

  it('returns the maximum at p100', () => {
    expect(percentile([1, 2, 3, 4], 100)).toBe(4)
  })

  it('returns the single element regardless of p', () => {
    expect(percentile([5], 0)).toBe(5)
    expect(percentile([5], 50)).toBe(5)
    expect(percentile([5], 100)).toBe(5)
  })

  it('interpolates p95 of a ten-element array by hand-computed fixture', () => {
    // rank = 0.95 * 9 = 8.55 -> between index 8 (9) and 9 (10), weight 0.55
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBeCloseTo(9.55, 10)
  })

  it('throws on empty input', () => {
    expect(() => percentile([], 50)).toThrow(/empty/)
  })

  it.each([-1, 101])('throws on an out-of-range p (%s)', (p) => {
    expect(() => percentile([1, 2, 3], p)).toThrow(/between 0 and 100/)
  })

  it('does not mutate its input', () => {
    const input = [4, 2, 3, 1]
    percentile(input, 50)
    expect(input).toEqual([4, 2, 3, 1])
  })
})

describe('median', () => {
  it('sorts before computing, unlike percentile', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('does not mutate its input', () => {
    const input = [4, 1, 3, 2]
    median(input)
    expect(input).toEqual([4, 1, 3, 2])
  })

  // Exact message, not just /empty/ -- percentile() throws its own "must not
  // be empty" error too, on a message that also matches /empty/, so a loose
  // pattern here can't tell "median's own guard fired" from "median's guard
  // was skipped and percentile's fired instead" (which happens to produce a
  // very similar-looking failure for this input, since median just sorts
  // and delegates).
  it('throws its own error on empty input, distinct from percentile', () => {
    expect(() => median([])).toThrow(/^median: values must not be empty$/)
  })
})

describe('aggregate', () => {
  it('discards rep 0 (the warm-up) from every computed field', () => {
    const warmup = rep({ frameIntervalsMs: [1000], longTaskCount: 99, wallClockMs: 999999 })
    const real = rep({ frameIntervalsMs: [16, 16], longTaskCount: 0, wallClockMs: 1000 })
    const stats = aggregate(sample({ reps: [warmup, real, real] }))
    expect(stats.repCount).toBe(2)
    expect(stats.longTaskCount.median).toBe(0)
    expect(stats.wallClockMs.median).toBe(1000)
    expect(stats.frameIntervalsMs.medianOfMedians).toBe(16)
  })

  it('reports count/medianOfMedians/maxOfP95s null when every measured rep has an empty series', () => {
    const empty = rep({ eventDurationsMs: [] })
    const stats = aggregate(sample({ reps: [empty, empty, empty] }))
    expect(stats.eventDurationsMs).toEqual({ count: 0, medianOfMedians: null, maxOfP95s: null })
  })

  it('skips empty-series reps when aggregating a mixed set, without corrupting the reps that do have data', () => {
    const warmup = rep()
    const withEvents = rep({ eventDurationsMs: [20, 30] })
    const withoutEvents = rep({ eventDurationsMs: [] })
    const stats = aggregate(sample({ reps: [warmup, withEvents, withoutEvents] }))
    expect(stats.eventDurationsMs.count).toBe(2)
    expect(stats.eventDurationsMs.medianOfMedians).toBe(25)
    expect(stats.eventDurationsMs.maxOfP95s).not.toBeNull()
  })

  it.each([
    {
      name: 'takes the max, not the average, of per-rep p95s',
      measuredReps: [rep({ frameIntervalsMs: [10, 10, 10] }), rep({ frameIntervalsMs: [100, 100, 100] })],
      field: 'maxOfP95s' as const,
      expected: 100,
    },
    {
      name: 'sorts each rep own series before taking its median/p95, not just its input order',
      measuredReps: [rep({ frameIntervalsMs: [30, 10, 20] })],
      field: 'medianOfMedians' as const,
      expected: 20,
    },
  ])('$name', ({ measuredReps, field, expected }) => {
    const stats = aggregate(sample({ reps: [rep(), ...measuredReps] }))
    expect(stats.frameIntervalsMs[field]).toBe(expected)
  })

  it('computes moveEventCount/renderedCellCount medians, not a placeholder', () => {
    const warmup = rep()
    const repA = rep({ moveEventCount: 10, renderedCellCount: 100 })
    const repB = rep({ moveEventCount: 20, renderedCellCount: 200 })
    const stats = aggregate(sample({ reps: [warmup, repA, repB] }))
    expect(stats.moveEventCount.median).toBe(15)
    expect(stats.renderedCellCount.median).toBe(150)
  })

  it('collects metricsDelta keys across reps sorted alphabetically, not in insertion order', () => {
    const warmup = rep()
    const measured = rep({ metricsDelta: { Zebra: 1, Apple: 2 } })
    const stats = aggregate(sample({ reps: [warmup, measured] }))
    expect(Object.keys(stats.metricsDeltaPerMoveEvent)).toEqual(['Apple', 'Zebra'])
  })

  it('normalises metricsDelta per move-event, median across reps', () => {
    const warmup = rep()
    const repA = rep({ moveEventCount: 100, metricsDelta: { TaskDuration: 200 } })
    const repB = rep({ moveEventCount: 50, metricsDelta: { TaskDuration: 100 } })
    const stats = aggregate(sample({ reps: [warmup, repA, repB] }))
    // repA: 200/100 = 2, repB: 100/50 = 2 -> median 2
    expect(stats.metricsDeltaPerMoveEvent.TaskDuration).toBe(2)
  })

  it.each([
    {
      name: 'normalises metricsDelta per 1000 rendered cells',
      measuredOverrides: { renderedCellCount: 2000, metricsDelta: { TaskDuration: 40 } },
      field: 'metricsDeltaPer1000Cells' as const,
      expected: 20, // 40 / (2000/1000) = 20
    },
    {
      name: 'reports null (not a divide-by-zero) for a key whose denominator is 0 in every rep',
      measuredOverrides: { moveEventCount: 0, metricsDelta: { TaskDuration: 40 } },
      field: 'metricsDeltaPerMoveEvent' as const,
      expected: null,
    },
  ])('$name', ({ measuredOverrides, field, expected }) => {
    const warmup = rep()
    const measured = rep(measuredOverrides)
    const stats = aggregate(sample({ reps: [warmup, measured] }))
    expect(stats[field].TaskDuration).toBe(expected)
  })

  it('reports nodeChurnPerMoveEvent as null when no rep measured churn -- not 0', () => {
    const stats = aggregate(sample())
    expect(stats.nodeChurnPerMoveEvent).toBeNull()
  })

  it('medians nodeChurnCount/moveEventCount per rep, not summed numerator over summed denominator', () => {
    const warmup = rep()
    // Per-rep ratios 8 and 4 -> median 6. A summed-over-summed computation
    // would give (800 + 200) / (100 + 50) = 6.67 instead.
    const repA = rep({ moveEventCount: 100, nodeChurnCount: 800 })
    const repB = rep({ moveEventCount: 50, nodeChurnCount: 200 })
    const stats = aggregate(sample({ reps: [warmup, repA, repB] }))
    expect(stats.nodeChurnPerMoveEvent).toBe(6)
  })

  it('reports a genuinely measured zero churn as 0, distinct from the unmeasured null above', () => {
    const stats = aggregate(sample({ reps: [rep(), rep({ nodeChurnCount: 0 })] }))
    expect(stats.nodeChurnPerMoveEvent).toBe(0)
  })

  it('skips a rep with zero move events rather than dividing by zero', () => {
    const measured = rep({ moveEventCount: 0, nodeChurnCount: 100 })
    const stats = aggregate(sample({ reps: [rep(), measured] }))
    expect(stats.nodeChurnPerMoveEvent).toBeNull()
  })

  it('ignores a nodeChurnCount that only the discarded warm-up rep carried', () => {
    const stats = aggregate(sample({ reps: [rep({ nodeChurnCount: 999 }), rep()] }))
    expect(stats.nodeChurnPerMoveEvent).toBeNull()
  })

  it('never reports a key present only in the discarded warm-up rep', () => {
    const warmup = rep({ metricsDelta: { OnlyInWarmup: 1 } })
    const measured = rep({ metricsDelta: {} })
    const stats = aggregate(sample({ reps: [warmup, measured] }))
    expect(stats.metricsDeltaPerMoveEvent.OnlyInWarmup).toBeUndefined()
  })

  it('reports null for a key present in some measured reps but missing from others', () => {
    const warmup = rep()
    const withKey = rep({ metricsDelta: { Sometimes: 10 } })
    const withoutKey = rep({ metricsDelta: {} })
    const stats = aggregate(sample({ reps: [warmup, withKey, withoutKey] }))
    // withKey contributes one ratio (10/100), withoutKey is skipped (key absent)
    expect(stats.metricsDeltaPerMoveEvent.Sometimes).toBe(0.1)
  })

  it('passes through scenario metadata unchanged', () => {
    const stats = aggregate(sample())
    expect(stats.scenario).toBe('pan-across-populated-grid')
    expect(stats.project).toBe('1280x900')
    expect(stats.buildMode).toBe('perf')
    expect(stats.chromiumVersion).toBe('140.0.0.0')
  })
})

describe('taskDurationToWallClockRatio', () => {
  it('computes the ratio from raw sums across every rep of every sample', () => {
    const s1 = sample({ reps: [rep({ metricsDelta: { TaskDuration: 100 }, wallClockMs: 1000 })] })
    const s2 = sample({ reps: [rep({ metricsDelta: { TaskDuration: 50 }, wallClockMs: 500 })] })
    expect(taskDurationToWallClockRatio([s1, s2])).toBeCloseTo(150 / 1500, 10)
  })

  it('returns undefined when no rep records a TaskDuration key', () => {
    const s = sample({ reps: [rep({ metricsDelta: { JSHeapUsedSize: 1 } })] })
    expect(taskDurationToWallClockRatio([s])).toBeUndefined()
  })

  it('returns undefined rather than NaN/Infinity when total wall clock is 0', () => {
    const s = sample({ reps: [rep({ metricsDelta: { TaskDuration: 5 }, wallClockMs: 0 })] })
    expect(taskDurationToWallClockRatio([s])).toBeUndefined()
  })

  it('returns undefined for an empty sample list', () => {
    expect(taskDurationToWallClockRatio([])).toBeUndefined()
  })
})
