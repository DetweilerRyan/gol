// Runs one .steps.test.ts file against one feature-file path (the real,
// unmutated file for a baseline check, or a mutant written to a temp path)
// via vitest's own JSON reporter -- never a regex over console text, which
// is precisely the defect classify.ts's module comment documents. The JSON
// reporter is asked to write to a file (`--outputFile`) rather than parsed
// off stdout, since stdout can carry other console output ahead of it; the
// file is either valid JSON with the two fields this module cares about, or
// it doesn't exist / doesn't parse, and either of those is treated the same
// way -- no summary at all.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import type { VitestRunSummary } from './classify.ts'
import type { MutationTarget } from './discovery.ts'

export interface SuiteRun {
  exitCode: number | null
  summary: VitestRunSummary | null
}

export function readSummary(jsonOutputPath: string): VitestRunSummary | null {
  try {
    const parsed = JSON.parse(readFileSync(jsonOutputPath, 'utf8')) as {
      numTotalTests?: unknown
      numFailedTests?: unknown
    }
    if (typeof parsed.numTotalTests !== 'number' || typeof parsed.numFailedTests !== 'number') return null
    return { numTotalTests: parsed.numTotalTests, numFailedTests: parsed.numFailedTests }
  } catch {
    // Covers both "the reporter never got to write a file" (a crash before
    // vitest could even start reporting) and "the file exists but isn't
    // valid JSON" -- classifyMutant already treats a missing summary as an
    // infrastructure error regardless of which one happened.
    return null
  }
}

export function runScenarioSuite(stepsFilePath: string, featureFilePath: string, jsonOutputPath: string): SuiteRun {
  const result = spawnSync(
    'npx',
    ['vitest', 'run', stepsFilePath, '--reporter=json', `--outputFile=${jsonOutputPath}`],
    { encoding: 'utf8', env: { ...process.env, ACCEPTANCE_MUTATION_FEATURE_FILE: featureFilePath } },
  )
  return { exitCode: result.status, summary: readSummary(jsonOutputPath) }
}

// A green baseline (the unmutated feature file) is the precondition every
// mutant classification depends on: classifyMutant treats a test-count
// mismatch against *this* number as an infrastructure error, so if the
// baseline run itself didn't execute cleanly there is no trustworthy number
// to compare mutants against -- every mutant for this target would then
// misreport rather than merely under-report. Throws naming the target so an
// aborted run says exactly which feature/steps pair was the problem.
export function assertBaselineGreen(target: MutationTarget, run: SuiteRun): number {
  if (run.exitCode !== 0 || run.summary === null || run.summary.numTotalTests < 1) {
    const detail =
      run.summary === null
        ? 'no readable test summary'
        : `exitCode=${run.exitCode}, numTotalTests=${run.summary.numTotalTests}, numFailedTests=${run.summary.numFailedTests}`
    throw new Error(
      `Baseline is not green for ${target.feature} (steps: ${target.steps}) -- aborting before any mutation (${detail})`,
    )
  }
  return run.summary.numTotalTests
}
