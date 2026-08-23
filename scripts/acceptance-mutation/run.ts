#!/usr/bin/env tsx
// Acceptance mutation runner, following the concept (not the toolchain) of
// https://github.com/unclebob/Acceptance-Pipeline-Specification: mutate one
// Gherkin example cell at a time and check whether the acceptance scenario
// notices. This mutates *specification data*, never source code -- see
// scripts/acceptance-mutation/mutation-rules.ts for the value rules and
// gherkin-examples.ts for the table locator/rewriter.
//
// Each mutant is written to a temp file and the *entire* corresponding
// .steps.test file is run against it via ACCEPTANCE_MUTATION_FEATURE_FILE
// (never a filtered subset of steps -- splitting a scenario's Given/When/Then
// across independent runs breaks the shared-closure state they rely on).
//
// Two invariants that used to be missing, both closed by this file's split
// into discovery.ts / vitest-runner.ts / classify.ts:
//   1. A mutant's outcome is read from vitest's JSON reporter's
//      collected/failed test counts, not a regex over console text -- see
//      classify.ts's module comment for the exact false-"killed" bug that
//      let a wholly broken steps file report a perfect score.
//   2. Every target's steps file is run once against its *unmutated* feature
//      before any mutant is generated, and the whole run aborts loudly if
//      that baseline isn't green -- see vitest-runner.ts's
//      assertBaselineGreen. A broken suite has no trustworthy test count to
//      compare mutants against, so proceeding would misreport every mutant
//      for that target, not just under-report.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyMutant, type Outcome } from './classify.ts'
import { discoverTargets, filterTargets, parseArgs, type MutationTarget } from './discovery.ts'
import { applyMutation, listMutableCells } from './gherkin-examples.ts'
import { mutateValue } from './mutation-rules.ts'
import { assertBaselineGreen, runScenarioSuite } from './vitest-runner.ts'

interface MutantResult {
  feature: string
  row: number
  column: string
  original: string
  mutated: string
  outcome: Outcome
}

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../features')

function resolveTargets(): MutationTarget[] {
  const { feature } = parseArgs(process.argv.slice(2))
  return filterTargets(discoverTargets(FEATURES_DIR), feature)
}

function runTarget(target: MutationTarget, tmpDir: string, results: MutantResult[]): void {
  const featurePath = path.join(FEATURES_DIR, target.feature)
  const stepsPath = path.join(FEATURES_DIR, target.steps)
  const originalText = readFileSync(featurePath, 'utf8')

  const baselineJsonPath = path.join(tmpDir, `baseline-${target.feature}.json`)
  const baselineRun = runScenarioSuite(stepsPath, featurePath, baselineJsonPath)
  const baselineTotalTests = assertBaselineGreen(target, baselineRun)

  for (const cell of listMutableCells(originalText)) {
    const seedKey = `${target.feature}:${cell.rowIndex}:${cell.columnName}`
    const mutatedValue = mutateValue(cell.value, seedKey)
    const mutatedText = applyMutation(originalText, cell, mutatedValue)

    const mutantPath = path.join(tmpDir, target.feature)
    writeFileSync(mutantPath, mutatedText)

    const jsonOutputPath = path.join(tmpDir, `mutant-${results.length}.json`)
    const run = runScenarioSuite(stepsPath, mutantPath, jsonOutputPath)
    const outcome = classifyMutant(baselineTotalTests, run.summary)
    results.push({
      feature: target.feature,
      row: cell.rowIndex + 1,
      column: cell.columnName,
      original: cell.value,
      mutated: mutatedValue,
      outcome,
    })
  }
}

function main(): void {
  let targets: MutationTarget[]
  try {
    targets = resolveTargets()
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }

  const tmpDir = mkdtempSync(path.join(tmpdir(), 'gol-acceptance-mutation-'))
  const results: MutantResult[] = []

  try {
    for (const target of targets) runTarget(target, tmpDir, results)
  } catch (err) {
    rmSync(tmpDir, { recursive: true, force: true })
    console.error((err as Error).message)
    process.exit(1)
  }

  rmSync(tmpDir, { recursive: true, force: true })

  report(results)

  const survivedOrErrored = results.filter((r) => r.outcome !== 'killed')
  process.exit(survivedOrErrored.length > 0 ? 1 : 0)
}

function report(results: MutantResult[]): void {
  const widths = {
    feature: Math.max(7, ...results.map((r) => r.feature.length)),
    row: 3,
    column: Math.max(6, ...results.map((r) => r.column.length)),
    original: Math.max(8, ...results.map((r) => r.original.length)),
    mutated: Math.max(7, ...results.map((r) => r.mutated.length)),
    outcome: 8,
  }
  const pad = (s: string | number, w: number) => String(s).padEnd(w)
  const header = `${pad('Feature', widths.feature)}  ${pad('Row', widths.row)}  ${pad('Column', widths.column)}  ${pad('Original', widths.original)}  ${pad('Mutated', widths.mutated)}  Outcome`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of results) {
    const marker = r.outcome === 'killed' ? '✓' : r.outcome === 'survived' ? '✗' : '!'
    console.log(
      `${pad(r.feature, widths.feature)}  ${pad(r.row, widths.row)}  ${pad(r.column, widths.column)}  ${pad(r.original, widths.original)}  ${pad(r.mutated, widths.mutated)}  ${marker} ${r.outcome}`,
    )
  }

  const killed = results.filter((r) => r.outcome === 'killed').length
  const survived = results.filter((r) => r.outcome === 'survived').length
  const errored = results.filter((r) => r.outcome === 'error').length
  console.log('-'.repeat(header.length))
  console.log(
    `${results.length} mutants | ${killed} killed | ${survived} survived | ${errored} errored | mutation score: ${((killed / results.length) * 100).toFixed(1)}%`,
  )
}

// Guards against running main() as a side effect of an import -- if run.ts
// ever grows tests of its own that import resolveTargets/runTarget, none of
// them should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
