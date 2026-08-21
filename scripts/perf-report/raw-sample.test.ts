import { describe, expect, it } from 'vitest'
import { parseRawScenarioSample, type RawScenarioSample } from './raw-sample.ts'

function validRep() {
  return {
    frameIntervalsMs: [16.6, 16.7, 33.2],
    eventDurationsMs: [],
    longTaskCount: 0,
    moveEventCount: 120,
    renderedCellCount: 1500,
    metricsDelta: { TaskDuration: 12.5, JSHeapUsedSize: 1024 },
    wallClockMs: 2000,
  }
}

function validSample(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    scenario: 'pan-across-populated-grid',
    project: '1280x900',
    url: 'http://localhost:5173/?cells=50000',
    cpuThrottlingRate: 1,
    chromiumVersion: '140.0.7000.0',
    buildMode: 'perf',
    reps: [validRep(), validRep(), validRep()],
    ...overrides,
  }
}

describe('parseRawScenarioSample', () => {
  it('accepts a well-formed sample and returns it verbatim', () => {
    const input = validSample()
    const result = parseRawScenarioSample(input)
    expect(result).toEqual<RawScenarioSample>(input as RawScenarioSample)
  })

  it('accepts empty frameIntervalsMs/eventDurationsMs arrays -- the common case for a fast machine', () => {
    const rep = { ...validRep(), frameIntervalsMs: [], eventDurationsMs: [] }
    const result = parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))
    expect(result.reps[1].eventDurationsMs).toEqual([])
    expect(result.reps[1].frameIntervalsMs).toEqual([])
  })

  it('accepts an empty metricsDelta object', () => {
    const rep = { ...validRep(), metricsDelta: {} }
    const result = parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))
    expect(result.reps[1].metricsDelta).toEqual({})
  })

  it.each([null, undefined, 1, 'string', []])('rejects a non-object top-level value: %s', (value) => {
    expect(() => parseRawScenarioSample(value)).toThrow()
  })

  it.each(['scenario', 'project', 'url', 'chromiumVersion', 'buildMode'])('rejects a missing %s', (key) => {
    const sample = validSample()
    delete (sample as Record<string, unknown>)[key]
    expect(() => parseRawScenarioSample(sample)).toThrow(new RegExp(key))
  })

  it('rejects an empty-string scenario', () => {
    expect(() => parseRawScenarioSample(validSample({ scenario: '' }))).toThrow(/scenario/)
  })

  it('rejects a non-finite cpuThrottlingRate', () => {
    expect(() => parseRawScenarioSample(validSample({ cpuThrottlingRate: Number.NaN }))).toThrow(/cpuThrottlingRate/)
  })

  it('rejects a missing reps field', () => {
    const sample = validSample()
    delete (sample as Record<string, unknown>).reps
    expect(() => parseRawScenarioSample(sample)).toThrow(/reps/)
  })

  it('rejects reps that is not an array', () => {
    expect(() => parseRawScenarioSample(validSample({ reps: {} }))).toThrow(/reps/)
  })

  it('rejects fewer than 2 reps -- rep 0 alone leaves no measured data after the warm-up is discarded', () => {
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep()] }))).toThrow(/at least 2/)
  })

  it('rejects zero reps', () => {
    expect(() => parseRawScenarioSample(validSample({ reps: [] }))).toThrow(/at least 2/)
  })

  it('rejects a rep that is not an object', () => {
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), 'nope'] }))).toThrow(/reps\[1\]/)
  })

  it('rejects a rep with a non-array frameIntervalsMs', () => {
    const rep = { ...validRep(), frameIntervalsMs: 'not an array' }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/frameIntervalsMs/)
  })

  it('rejects a rep whose frameIntervalsMs contains a non-finite value', () => {
    const rep = { ...validRep(), frameIntervalsMs: [16, Number.NaN] }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/frameIntervalsMs/)
  })

  it('rejects a rep with a non-finite longTaskCount', () => {
    const rep = { ...validRep(), longTaskCount: Number.POSITIVE_INFINITY }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/longTaskCount/)
  })

  it('rejects a rep whose metricsDelta is an array rather than an object', () => {
    const rep = { ...validRep(), metricsDelta: [1, 2, 3] }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/metricsDelta/)
  })

  it('rejects a rep whose metricsDelta contains a non-finite value', () => {
    const rep = { ...validRep(), metricsDelta: { TaskDuration: Number.NaN } }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/metricsDelta/)
  })

  it('rejects a rep with a missing wallClockMs', () => {
    const rep = validRep() as Record<string, unknown>
    delete rep.wallClockMs
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/wallClockMs/)
  })
})
