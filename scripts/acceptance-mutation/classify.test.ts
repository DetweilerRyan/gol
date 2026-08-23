import { describe, expect, it } from 'vitest'
import { classifyMutant } from './classify.ts'

describe('classifyMutant', () => {
  it('is survived when the mutant run passed with the same test count as the baseline', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 0 })).toBe('survived')
  })

  it('is killed when the mutant run failed with the same test count as the baseline', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 1 })).toBe('killed')
  })

  it('is killed when more than one test failed, as long as the collected count still matches', () => {
    expect(classifyMutant(25, { numTotalTests: 25, numFailedTests: 3 })).toBe('killed')
  })

  it('is error when there is no readable summary at all (a hard crash before the reporter could write one)', () => {
    expect(classifyMutant(25, null)).toBe('error')
  })

  // The exact defect this module exists to close: a broken *steps* file
  // still exits nonzero and still prints vitest's normal failure chrome, but
  // it never collects any tests -- 0, not 25. Scoring that as a "kill" is
  // what let a wholly broken suite report a perfect mutation score.
  it('is error when the collected test count does not match the baseline, even though the run failed', () => {
    expect(classifyMutant(25, { numTotalTests: 0, numFailedTests: 0 })).toBe('error')
  })

  it('is error when the collected test count is merely different from the baseline, not just zero', () => {
    expect(classifyMutant(25, { numTotalTests: 24, numFailedTests: 1 })).toBe('error')
  })
})
