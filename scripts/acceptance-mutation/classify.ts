// Classifies one mutant run against the green baseline for its target.
//
// The bug this module exists to close: a plain vitest failure always prints
// a "Test Files ... failed" summary line, whether the *mutated feature* was
// noticed by a passing-turned-failing scenario, or the *steps file itself*
// is broken (a bad import, a syntax error) and never collected a single
// test. Both look identical from exit code and console text alone -- both
// exit nonzero, both print the failure chrome. Scoring the second case as a
// "kill" is what let a wholly broken suite report a perfect mutation score.
//
// The fix is to classify from vitest's JSON reporter's collected/failed test
// counts, never a regex over console output: `killed` requires the *same*
// number of tests collected as the unmutated baseline, plus at least one
// failure among them. Any other collected count -- typically 0, but treated
// generally -- means collection itself changed, which is an infrastructure
// error, not evidence the scenario noticed anything.
export type Outcome = 'killed' | 'survived' | 'error'

export interface VitestRunSummary {
  numTotalTests: number
  numFailedTests: number
}

export function classifyMutant(baselineTotalTests: number, summary: VitestRunSummary | null): Outcome {
  if (summary === null) return 'error'
  if (summary.numTotalTests !== baselineTotalTests) return 'error'
  return summary.numFailedTests > 0 ? 'killed' : 'survived'
}
