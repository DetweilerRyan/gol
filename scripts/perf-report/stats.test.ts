import { describe, expect, it } from 'vitest'
import { aggregate, median, percentile, taskDurationToWallClockRatio } from './stats.ts'
import type { RawScenarioSample, RepSample } from './raw-sample.ts'

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

  it('throws on empty input', () => {
    expect(() => median([])).toThrow(/empty/)
  })
})

function rep(overrides: Partial<RepSample> = {}): RepSample {
  return {
    frameIntervalsMs: [16, 17, 18],
    eventDurationsMs: [],
    longTaskCount: 0,
    moveEventCount: 100,
    renderedCellCount: 2000,
    metricsDelta: { TaskDuration: 10, JSHeapUsedSize: 500 },
    wallClockMs: 1000,
    ...overrides,
  }
}

function sample(overrides: Partial<RawScenarioSample> = {}): RawScenarioSample {
  return {
    scenario: 'pan-across-populated-grid',
    project: '1280x900',
    url: 'http://localhost:5173/',
    cpuThrottlingRate: 1,
    chromiumVersion: '140.0.0.0',
    buildMode: 'perf',
    reps: [rep(), rep(), rep()],
    ...overrides,
  }
}

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

  it('takes the max, not the average, of per-rep p95s', () => {
    const warmup = rep()
    const low = rep({ frameIntervalsMs: [10, 10, 10] })
    const high = rep({ frameIntervalsMs: [100, 100, 100] })
    const stats = aggregate(sample({ reps: [warmup, low, high] }))
    expect(stats.frameIntervalsMs.maxOfP95s).toBe(100)
  })

  it('normalises metricsDelta per move-event, median across reps', () => {
    const warmup = rep()
    const repA = rep({ moveEventCount: 100, metricsDelta: { TaskDuration: 200 } })
    const repB = rep({ moveEventCount: 50, metricsDelta: { TaskDuration: 100 } })
    const stats = aggregate(sample({ reps: [warmup, repA, repB] }))
    // repA: 200/100 = 2, repB: 100/50 = 2 -> median 2
    expect(stats.metricsDeltaPerMoveEvent.TaskDuration).toBe(2)
  })

  it('normalises metricsDelta per 1000 rendered cells', () => {
    const warmup = rep()
    const measured = rep({ renderedCellCount: 2000, metricsDelta: { TaskDuration: 40 } })
    const stats = aggregate(sample({ reps: [warmup, measured] }))
    // 40 / (2000/1000) = 20
    expect(stats.metricsDeltaPer1000Cells.TaskDuration).toBe(20)
  })

  it('reports null (not a divide-by-zero) for a key whose denominator is 0 in every rep', () => {
    const warmup = rep()
    const measured = rep({ moveEventCount: 0, metricsDelta: { TaskDuration: 40 } })
    const stats = aggregate(sample({ reps: [warmup, measured] }))
    expect(stats.metricsDeltaPerMoveEvent.TaskDuration).toBeNull()
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
