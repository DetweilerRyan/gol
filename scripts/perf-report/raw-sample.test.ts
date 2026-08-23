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

  // The exact "expected an object, got <kind>" message, not just "it threw
  // something" -- a value this guard rejects still often makes a *later*
  // field-level check throw its own, differently-worded error (e.g. a bare
  // number has no .scenario property, so requireField's own "invalid or
  // missing" fires instead) -- so a bare toThrow() can't tell "the top-level
  // shape guard caught this" from "it slipped past that guard and failed
  // downstream instead."
  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    [1, 'number'],
    ['string', 'string'],
    [[], 'an array'],
  ] as const)('rejects a non-object top-level value %s, naming its kind in the message', (value, description) => {
    expect(() => parseRawScenarioSample(value)).toThrow(
      new RegExp(`^raw scenario sample: expected an object, got ${description}$`),
    )
  })

  it.each(['scenario', 'project', 'url', 'chromiumVersion', 'buildMode'])(
    'rejects a missing %s, with the field context in the message',
    (key) => {
      const sample = validSample()
      delete (sample as Record<string, unknown>)[key]
      expect(() => parseRawScenarioSample(sample)).toThrow(
        new RegExp(`^raw scenario sample\\.${key}: invalid or missing \\(got undefined\\)$`),
      )
    },
  )

  it('rejects an empty-string scenario', () => {
    expect(() => parseRawScenarioSample(validSample({ scenario: '' }))).toThrow(/scenario/)
  })

  it('rejects a non-finite cpuThrottlingRate, with the field context in the message', () => {
    expect(() => parseRawScenarioSample(validSample({ cpuThrottlingRate: Number.NaN }))).toThrow(
      /^raw scenario sample\.cpuThrottlingRate: invalid or missing \(got number\)$/,
    )
  })

  it('rejects a non-numeric cpuThrottlingRate', () => {
    expect(() => parseRawScenarioSample(validSample({ cpuThrottlingRate: 'fast' }))).toThrow(/cpuThrottlingRate/)
  })

  it('rejects a missing reps field, with the field context in the message', () => {
    const sample = validSample()
    delete (sample as Record<string, unknown>).reps
    expect(() => parseRawScenarioSample(sample)).toThrow(
      /^raw scenario sample\.reps: invalid or missing \(got undefined\)$/,
    )
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

  it.each([
    {
      name: 'a non-array frameIntervalsMs',
      field: 'frameIntervalsMs',
      value: 'not an array',
      pattern: /frameIntervalsMs/,
    },
    {
      name: 'a frameIntervalsMs containing a non-finite value',
      field: 'frameIntervalsMs',
      value: [16, Number.NaN],
      pattern: /frameIntervalsMs/,
    },
    {
      name: 'a non-finite longTaskCount',
      field: 'longTaskCount',
      value: Number.POSITIVE_INFINITY,
      pattern: /longTaskCount/,
    },
    {
      name: 'a metricsDelta that is an array rather than an object',
      field: 'metricsDelta',
      value: [1, 2, 3],
      pattern: /metricsDelta/,
    },
    { name: 'a null metricsDelta', field: 'metricsDelta', value: null, pattern: /metricsDelta/ },
    {
      name: 'a metricsDelta that is not an object at all (a bare number)',
      field: 'metricsDelta',
      value: 5,
      pattern: /metricsDelta/,
    },
    {
      name: 'a metricsDelta containing a non-finite value',
      field: 'metricsDelta',
      value: { TaskDuration: Number.NaN },
      pattern: /metricsDelta/,
    },
  ])('rejects a rep with $name', ({ field, value, pattern }) => {
    const rep = { ...validRep(), [field]: value }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(pattern)
  })

  // nodeChurnCount is the one optional RepSample field. Absent is a valid
  // sample (every scenario outside the tile-boundary wobble family), and the
  // parse must leave it undefined rather than defaulting it to 0 -- a 0
  // would read downstream as "measured no churn" instead of "did not
  // measure churn".
  it('accepts a rep with no nodeChurnCount and leaves it undefined, not 0', () => {
    const result = parseRawScenarioSample(validSample())
    expect(result.reps[1].nodeChurnCount).toBeUndefined()
  })

  it('carries a present nodeChurnCount through verbatim', () => {
    const rep = { ...validRep(), nodeChurnCount: 35840 }
    const result = parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))
    expect(result.reps[1].nodeChurnCount).toBe(35840)
  })

  it('accepts a nodeChurnCount of 0, distinguishing a measured zero from an absent field', () => {
    const rep = { ...validRep(), nodeChurnCount: 0 }
    const result = parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))
    expect(result.reps[1].nodeChurnCount).toBe(0)
  })

  it.each([
    { name: 'a non-numeric nodeChurnCount', value: 'lots', kind: 'string' },
    { name: 'a non-finite nodeChurnCount', value: Number.NaN, kind: 'number' },
    { name: 'a null nodeChurnCount', value: null, kind: 'null' },
  ])('rejects $name rather than treating it as not measured', ({ value, kind }) => {
    const rep = { ...validRep(), nodeChurnCount: value }
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(
      new RegExp(`^raw scenario sample\\.reps\\[1\\]\\.nodeChurnCount: present but invalid \\(got ${kind}\\)$`),
    )
  })

  it('rejects a rep with a missing wallClockMs', () => {
    const rep = validRep() as Record<string, unknown>
    delete rep.wallClockMs
    expect(() => parseRawScenarioSample(validSample({ reps: [validRep(), rep] }))).toThrow(/wallClockMs/)
  })
})
