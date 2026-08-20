#!/usr/bin/env node
// Halstead complexity report, run alongside crap4ts on the same tested-core
// files. FTA (fta-cli) computes real Halstead metrics (volume, difficulty,
// effort, bugs) plus its own file-level cyclomatic complexity and FTA Score,
// but only at file granularity -- unlike crap4ts's per-function CRAP table,
// there's no per-function Halstead breakdown available. The two reports
// aren't merged for that reason: this prints a second, file-level table
// rather than blending file-level numbers into crap4ts's per-function rows.
//
// FTA's own FTA Score formula (how it weights Halstead vs. cyclomatic
// complexity vs. line count) isn't published, so unlike crap4ts's threshold
// gate, this script is report-only -- it always exits 0, the same stance
// gherkin-dry-checker takes for the same "advisory signal, not a transparent
// formula to gate on" reason.
//
// Keep FILES in sync with crap4ts.config.ts's `include` array -- both target
// the same unit-tested modules: the framework-free logic (grid rules, camera
// math, the pattern-placing state machine), the four hooks that adapt it to
// React, the four presentational components that have their own
// render()-based unit tests, and Grid.tsx itself.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runFta } from 'fta-cli'
import { buildReport } from './report.mjs'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

const FILES = [
  'src/gameOfLife.ts',
  'src/viewport.ts',
  'src/patternPlacement.ts',
  'src/hooks/useCamera.ts',
  'src/hooks/useElementSize.ts',
  'src/hooks/usePatternPlacement.ts',
  'src/hooks/useWheelInput.ts',
  'src/components/GridToolbar.tsx',
  'src/components/PatternLibraryModal.tsx',
  'src/components/RulerLabel.tsx',
  'src/components/Scrollbar.tsx',
  'src/components/Grid.tsx',
]

function analyzeFile(file) {
  const absolutePath = path.join(REPO_ROOT, file)
  const [result] = JSON.parse(runFta(absolutePath, { json: true }))
  // fta-cli returns an empty file_name when given a single-file path rather
  // than a directory to walk -- fill it in ourselves.
  return { ...result, file }
}

function main() {
  const results = FILES.map(analyzeFile)
  console.log(buildReport(results))
}

main()
