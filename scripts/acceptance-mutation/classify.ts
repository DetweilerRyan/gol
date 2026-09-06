// Classifies one mutant run against the green baseline for its target, and
// validates that baseline itself before any mutant result is trusted.
//
// This module used to read vitest's JSON reporter (one spawn per mutant); it
// now reads Playwright's, produced by one batched `playwright test`
// invocation per phase (see run.ts's two-phase design and
// playwright-runner.ts). The defect the old module existed to close still
// applies at the new granularity, closed the same way: a generated spec file
// that fails to *load* is absent from the JSON report's `suites[]` array
// entirely, not present with zero specs (measured: an import-broken batch
// produces `suites: []`, `errors: 5`, every counter 0). Looking a mutant's
// result up by its expected spec filename -- rather than iterating whatever
// `suites[]` happens to contain -- means a wholly missing file surfaces as
// `summary === undefined`, the same `error` outcome as a spec count
// mismatch, instead of silently contributing nothing to the tally.
import type { SpecSummary } from './playwright-runner.ts'

export type Outcome = 'killed' | 'survived' | 'error'

/**
 * `killed` requires the *same* number of specs collected as the unmutated
 * baseline, at least one of them `unexpected` (Playwright's own label for "a
 * test failed when it wasn't expected to" -- see playwright-runner.ts), and
 * none of them `skipped`. A skipped spec is scored as `error`, not folded
 * into either count: `spec.ok` is `true` for a skipped spec (Playwright's
 * own `ok()` returns true for `expected | flaky | skipped`), so skip
 * detection has to read `status`, never `ok` -- see
 * playwright-runner.test.ts's fixture pinning that.
 */
export function classifyMutant(baselineTotalTests: number, summary: SpecSummary | undefined): Outcome {
  if (summary === undefined) return 'error'
  if (summary.numTotalTests !== baselineTotalTests) return 'error'
  if (summary.numSkippedTests > 0) return 'error'
  return summary.numFailedTests > 0 ? 'killed' : 'survived'
}

/**
 * A green baseline is the precondition every mutant classification for its
 * target depends on: classifyMutant treats a spec-count mismatch against
 * *this* number as an infrastructure error, so if the baseline spec itself
 * isn't green there is no trustworthy count to compare mutants against --
 * every mutant for this target would then misreport rather than merely
 * under-report. `< 1`, not `<= 1`: a baseline that collected exactly one
 * test is the smallest count that must still pass.
 *
 * @throws Error naming the feature and spec file, if the baseline is not green.
 */
// `< 1` mirrors the boundary the vitest-based predecessor of this function pinned.
export function assertBaselineSpecGreen(
  featureFileName: string,
  specFileName: string,
  summary: SpecSummary | undefined,
): number {
  const isGreen =
    summary !== undefined && summary.numTotalTests >= 1 && summary.numFailedTests === 0 && summary.numSkippedTests === 0
  if (!isGreen) {
    const detail =
      summary === undefined
        ? 'no matching entry in the Playwright report'
        : `numTotalTests=${summary.numTotalTests}, numFailedTests=${summary.numFailedTests}, numSkippedTests=${summary.numSkippedTests}`
    throw new Error(
      `Baseline is not green for ${featureFileName} (spec: ${specFileName}) -- aborting before any mutation (${detail})`,
    )
  }
  return summary.numTotalTests
}

export interface ResultSummary {
  total: number
  killed: number
  survived: number
  errored: number
  scorePercent: string
}

/**
 * Zero mutants (a target with no Examples table, or excluded by --feature)
 * is vacuously a clean run -- nothing survived because nothing ran -- so
 * `scorePercent` is `"100.0"`, the same convention coverage tools use for an
 * empty denominator, rather than `NaN` from a killed/0 division.
 */
// The defect this function exists to close: `npm run acceptance-mutation --
// --feature camera-pan-and-zoom` printed "mutation score: NaN%" at exit 0,
// since that feature no longer carries an Examples table. The load-bearing
// part is that the count is legible as `0 mutants` and the score is a
// defined string, not that 100.0% specifically is the "right" number for
// nothing having run.
export function summarizeResults(results: { outcome: Outcome }[]): ResultSummary {
  const total = results.length
  const killed = results.filter((r) => r.outcome === 'killed').length
  const survived = results.filter((r) => r.outcome === 'survived').length
  const errored = results.filter((r) => r.outcome === 'error').length
  const scorePercent = total === 0 ? '100.0' : ((killed / total) * 100).toFixed(1)
  return { total, killed, survived, errored, scorePercent }
}
