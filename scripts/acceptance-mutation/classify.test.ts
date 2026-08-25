import { describe, expect, it } from 'vitest'
import { assertBaselineSpecGreen, classifyMutant, summarizeResults, type Outcome } from './classify.ts'

const green = (numTotalTests: number) => ({ numTotalTests, numFailedTests: 0, numSkippedTests: 0 })

describe('classifyMutant', () => {
  it('is survived when the mutant run passed with the same spec count as the baseline', () => {
    expect(classifyMutant(25, green(25))).toBe('survived')
  })

  it('is killed when the mutant run failed with the same spec count as the baseline', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 1, numSkippedTests: 0 })).toBe('killed')
  })

  it('is killed when more than one spec failed, as long as the collected count still matches', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 3, numSkippedTests: 0 })).toBe('killed')
  })

  it('is error when there is no matching spec-file entry at all (a generated spec that failed to load)', () => {
    expect(classifyMutant(25, undefined)).toBe('error')
  })

  // The exact defect this module exists to close: a spec file that failed to
  // *load* is absent from the JSON report's suites[] entirely, not present
  // with zero specs -- measured, an import-broken batch produces
  // `suites: []`, `errors: 5`, every counter 0. Looking a mutant up by its
  // expected spec filename means that surfaces as `summary === undefined`
  // above, the same case this test pins, rather than being silently missing
  // from the tally.
  it('is error when the collected spec count does not match the baseline, even though the run failed', () => {
    expect(classifyMutant(25, { numTotalTests: 0, numFailedTests: 0, numSkippedTests: 0 })).toBe('error')
  })

  it('is error when the collected spec count is merely different from the baseline, not just zero', () => {
    expect(classifyMutant(25, { numTotalTests: 24, numFailedTests: 1, numSkippedTests: 0 })).toBe('error')
  })

  // spec.ok is true for a skipped spec (Playwright's ok() returns true for
  // expected | flaky | skipped), so a skipped spec must still classify as
  // error even when numFailedTests is 0 -- it can never be read as "passed"
  // by way of `ok`, since this module never reads that field at all.
  it('is error when a spec was skipped, even with the right count and no failures', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 0, numSkippedTests: 1 })).toBe('error')
  })

  it('is error when a spec was skipped, even alongside a failure that would otherwise read as killed', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 1, numSkippedTests: 1 })).toBe('error')
  })
})

describe('assertBaselineSpecGreen', () => {
  it('returns the collected spec count when the baseline is green', () => {
    expect(assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', green(25))).toBe(25)
  })

  // The boundary itself: exactly one collected spec is the smallest count
  // that must still pass -- `>= 1`, not `> 1`.
  it('returns 1 when the baseline collected exactly one spec', () => {
    expect(assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', green(1))).toBe(1)
  })

  it('throws naming the feature and spec file when there is no matching entry at all', () => {
    expect(() => assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', undefined)).toThrow(
      /alpha\.feature.*alpha\.baseline\.feature\.spec\.js.*no matching entry/s,
    )
  })

  it('throws when the baseline collected zero specs', () => {
    expect(() =>
      assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', {
        numTotalTests: 0,
        numFailedTests: 0,
        numSkippedTests: 0,
      }),
    ).toThrow(/alpha\.feature.*numTotalTests=0, numFailedTests=0, numSkippedTests=0/s)
  })

  it('throws when the baseline has at least one failed spec', () => {
    expect(() =>
      assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', {
        numTotalTests: 25,
        numFailedTests: 1,
        numSkippedTests: 0,
      }),
    ).toThrow(/numFailedTests=1/)
  })

  it('throws when the baseline has at least one skipped spec, even with zero failures', () => {
    expect(() =>
      assertBaselineSpecGreen('alpha.feature', 'alpha.baseline.feature.spec.js', {
        numTotalTests: 25,
        numFailedTests: 0,
        numSkippedTests: 1,
      }),
    ).toThrow(/numSkippedTests=1/)
  })
})

describe('summarizeResults', () => {
  it.each<{ name: string; outcomes: Outcome[]; expected: ReturnType<typeof summarizeResults> }>([
    {
      name: 'tallies each outcome and computes a percentage score',
      outcomes: ['killed', 'killed', 'survived'],
      expected: { total: 3, killed: 2, survived: 1, errored: 0, scorePercent: '66.7' },
    },
    {
      name: 'counts errored separately from survived',
      outcomes: ['killed', 'error'],
      expected: { total: 2, killed: 1, survived: 0, errored: 1, scorePercent: '50.0' },
    },
    {
      name: 'is 0.0%, not NaN%, when every mutant survived',
      outcomes: ['survived', 'survived'],
      expected: { total: 2, killed: 0, survived: 2, errored: 0, scorePercent: '0.0' },
    },
  ])('$name', ({ outcomes, expected }) => {
    expect(summarizeResults(outcomes.map((outcome) => ({ outcome })))).toEqual(expected)
  })

  it('is 100.0% killed of 100.0%, not NaN%, when there are zero mutants at all', () => {
    // The defect this exists to close: `npm run acceptance-mutation
    // --feature camera-pan-and-zoom` printed "0 mutants | 0 killed | 0
    // survived | 0 errored | mutation score: NaN%" at exit 0, because
    // `killed / results.length` divides by zero when a target's Examples
    // table (or the whole selection) contributes no mutants at all.
    expect(summarizeResults([])).toEqual({ total: 0, killed: 0, survived: 0, errored: 0, scorePercent: '100.0' })
  })
})
