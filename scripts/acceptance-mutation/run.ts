#!/usr/bin/env tsx
// Acceptance mutation runner, following the concept (not the toolchain) of
// https://github.com/unclebob/Acceptance-Pipeline-Specification: mutate one
// Gherkin example cell at a time and check whether the acceptance scenario
// notices. This mutates *specification data*, never source code -- see
// scripts/acceptance-mutation/mutation-rules.ts for the value rules and
// gherkin-examples.ts for the table locator/rewriter.
//
// Each mutant is written to a temp file and the *entire* corresponding
// .steps.test.ts file is run against it via ACCEPTANCE_MUTATION_FEATURE_FILE
// (never a filtered subset of steps -- splitting a scenario's Given/When/Then
// across independent runs breaks the shared-closure state they rely on).

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listMutableCells, applyMutation } from './gherkin-examples.ts'
import { mutateValue } from './mutation-rules.ts'

// A .feature file paired 1:1 with the .steps.test.ts file that implements it.
interface MutationTarget {
  feature: string
  steps: string
}

// `killed` = the scenario failed, i.e. it noticed the mutated example value.
// `survived` = it passed anyway. `error` = the run never got as far as
// executing a test, so it proves nothing either way.
type Outcome = 'killed' | 'survived' | 'error'

// spawnSync reports a null status when the child was terminated by a signal
// rather than exiting normally.
interface SuiteRun {
  exitCode: number | null
  output: string
}

interface MutantResult {
  feature: string
  row: number
  column: string
  original: string
  mutated: string
  outcome: Outcome
}

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../features')

const TARGETS: MutationTarget[] = [
  { feature: 'cell-life-and-death.feature', steps: 'cell-life-and-death.steps.test.ts' },
  { feature: 'infinite-grid.feature', steps: 'infinite-grid.steps.test.ts' },
  { feature: 'camera-pan-and-zoom.feature', steps: 'camera-pan-and-zoom.steps.test.ts' },
  { feature: 'grid-reference-lines.feature', steps: 'grid-reference-lines.steps.test.ts' },
  { feature: 'mouse-wheel-controls.feature', steps: 'mouse-wheel-controls.steps.test.ts' },
  { feature: 'grid-scrollbars.feature', steps: 'grid-scrollbars.steps.test.ts' },
  { feature: 'pattern-library.feature', steps: 'pattern-library.steps.test.ts' },
]

function runScenarioSuite(stepsFile: string, featureFilePath: string): SuiteRun {
  const result = spawnSync('npx', ['vitest', 'run', path.join(FEATURES_DIR, stepsFile)], {
    encoding: 'utf8',
    env: { ...process.env, ACCEPTANCE_MUTATION_FEATURE_FILE: featureFilePath },
  })
  return { exitCode: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

function classify({ exitCode, output }: SuiteRun): Outcome {
  if (exitCode === 0) return 'survived'
  // A normal vitest failure prints a "Test Files" summary line even when
  // some tests failed. Its absence means the run crashed before any test
  // could execute (e.g. the mutated file failed to parse) -- an
  // infrastructure error, not a genuine detection of the mutation.
  return /Test Files\s+\d+/.test(output) ? 'killed' : 'error'
}

function main(): void {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'gol-acceptance-mutation-'))
  const results: MutantResult[] = []

  try {
    for (const target of TARGETS) {
      const featurePath = path.join(FEATURES_DIR, target.feature)
      const originalText = readFileSync(featurePath, 'utf8')
      const cells = listMutableCells(originalText)

      for (const cell of cells) {
        const seedKey = `${target.feature}:${cell.rowIndex}:${cell.columnName}`
        const mutatedValue = mutateValue(cell.value, seedKey)
        const mutatedText = applyMutation(originalText, cell, mutatedValue)

        const mutantPath = path.join(tmpDir, target.feature)
        writeFileSync(mutantPath, mutatedText)

        const outcome = classify(runScenarioSuite(target.steps, mutantPath))
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
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }

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

main()
