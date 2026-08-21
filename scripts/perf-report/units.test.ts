import { describe, expect, it } from 'vitest'
import { convertMetricsDeltaToMs, convertSampleMetricsToMs, DURATION_METRIC_KEYS } from './units.ts'
import type { RawScenarioSample, RepSample } from './raw-sample.ts'

function rep(overrides: Partial<RepSample> = {}): RepSample {
  return {
    frameIntervalsMs: [16, 17, 18],
    eventDurationsMs: [],
    longTaskCount: 0,
    moveEventCount: 100,
    renderedCellCount: 2000,
    metricsDelta: {},
    wallClockMs: 1000,
    ...overrides,
  }
}

function sample(overrides: Partial<RawScenarioSample> = {}): RawScenarioSample {
  return {
    scenario: 'some-scenario',
    project: '1280x900',
    url: 'http://localhost:5173/',
    cpuThrottlingRate: 1,
    chromiumVersion: '140.0.0.0',
    buildMode: 'perf',
    reps: [rep(), rep()],
    ...overrides,
  }
}

describe('convertMetricsDeltaToMs', () => {
  it('scales every named duration key by 1000 (CDP seconds -> ms)', () => {
    const result = convertMetricsDeltaToMs({
      TaskDuration: 2.021731,
      ScriptDuration: 0.204327,
      RecalcStyleDuration: 1.49908,
      LayoutDuration: 0.078886,
      DevToolsCommandDuration: 0.007983,
      V8CompileDuration: 0,
      TaskOtherDuration: 0.231455,
      ThreadTime: 2.016358,
      ProcessTime: 2.727196,
    })
    expect(result.TaskDuration).toBeCloseTo(2021.731, 5)
    expect(result.ScriptDuration).toBeCloseTo(204.327, 5)
    expect(result.RecalcStyleDuration).toBeCloseTo(1499.08, 5)
    expect(result.LayoutDuration).toBeCloseTo(78.886, 5)
    expect(result.DevToolsCommandDuration).toBeCloseTo(7.983, 5)
    expect(result.V8CompileDuration).toBe(0)
    expect(result.TaskOtherDuration).toBeCloseTo(231.455, 5)
    expect(result.ThreadTime).toBeCloseTo(2016.358, 5)
    expect(result.ProcessTime).toBeCloseTo(2727.196, 5)
  })

  it('passes count and byte-size keys through unscaled', () => {
    const result = convertMetricsDeltaToMs({
      LayoutCount: 40,
      RecalcStyleCount: 50,
      Nodes: -153,
      JSEventListeners: 17733,
      JSHeapUsedSize: 10093472,
      JSHeapTotalSize: 18087936,
    })
    expect(result).toEqual({
      LayoutCount: 40,
      RecalcStyleCount: 50,
      Nodes: -153,
      JSEventListeners: 17733,
      JSHeapUsedSize: 10093472,
      JSHeapTotalSize: 18087936,
    })
  })

  it('leaves an unrecognised key unscaled rather than guessing it is a duration', () => {
    const result = convertMetricsDeltaToMs({ SomeFutureCdpMetric: 3 })
    expect(result.SomeFutureCdpMetric).toBe(3)
  })

  it('leaves the epoch/paint timestamp fields unscaled -- points in time, not durations', () => {
    const result = convertMetricsDeltaToMs({
      Timestamp: 2.352462,
      FirstMeaningfulPaint: 0,
      DomContentLoaded: 0,
      NavigationStart: 0,
    })
    expect(result.Timestamp).toBe(2.352462)
    expect(result.FirstMeaningfulPaint).toBe(0)
  })

  it('does not mutate its input', () => {
    const input = { TaskDuration: 1 }
    convertMetricsDeltaToMs(input)
    expect(input.TaskDuration).toBe(1)
  })

  it('handles an empty metricsDelta', () => {
    expect(convertMetricsDeltaToMs({})).toEqual({})
  })
})

describe('DURATION_METRIC_KEYS', () => {
  it('contains exactly the keys the conversion treats as CDP-seconds durations', () => {
    expect([...DURATION_METRIC_KEYS].sort()).toEqual([
      'DevToolsCommandDuration',
      'LayoutDuration',
      'ProcessTime',
      'RecalcStyleDuration',
      'ScriptDuration',
      'TaskDuration',
      'TaskOtherDuration',
      'ThreadTime',
      'V8CompileDuration',
    ])
  })
})

describe('convertSampleMetricsToMs', () => {
  it('converts metricsDelta on every rep, leaving every other field untouched', () => {
    const input = sample({
      reps: [
        rep({ metricsDelta: { TaskDuration: 1, Nodes: 5 }, wallClockMs: 111 }),
        rep({ metricsDelta: { TaskDuration: 2, Nodes: 6 }, wallClockMs: 222 }),
      ],
    })
    const result = convertSampleMetricsToMs(input)
    expect(result.reps[0].metricsDelta).toEqual({ TaskDuration: 1000, Nodes: 5 })
    expect(result.reps[1].metricsDelta).toEqual({ TaskDuration: 2000, Nodes: 6 })
    expect(result.reps[0].wallClockMs).toBe(111)
    expect(result.scenario).toBe(input.scenario)
  })

  it('does not mutate its input', () => {
    const input = sample({ reps: [rep({ metricsDelta: { TaskDuration: 1 } })] })
    convertSampleMetricsToMs(input)
    expect(input.reps[0].metricsDelta.TaskDuration).toBe(1)
  })

  it('handles a sample with no reps carrying metricsDelta entries at all', () => {
    const input = sample({ reps: [rep({ metricsDelta: {} }), rep({ metricsDelta: {} })] })
    const result = convertSampleMetricsToMs(input)
    expect(result.reps[0].metricsDelta).toEqual({})
    expect(result.reps[1].metricsDelta).toEqual({})
  })
})
