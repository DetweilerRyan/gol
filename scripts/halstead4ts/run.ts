#!/usr/bin/env tsx
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
// The file set is crap4ts.config.ts's, resolved from that config rather than
// restated here. It used to be a hand-maintained copy of the same 21 paths,
// which is a list that goes stale silently: a module missing from it is simply
// never reported on, and nothing fails.

import { globSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runFta, type AnalyzedFile } from 'fta-cli'
import crap4tsConfig from '../../crap4ts.config.ts'
import { buildReport, type FileAnalysis } from './report.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

const FILES = globSync(crap4tsConfig.include ?? [], {
  cwd: REPO_ROOT,
  exclude: crap4tsConfig.exclude ?? [],
}).sort()

function analyzeFile(file: string): FileAnalysis {
  const absolutePath = path.join(REPO_ROOT, file)
  const [result] = JSON.parse(runFta(absolutePath, { json: true })) as AnalyzedFile[]
  // fta-cli returns an empty file_name when given a single-file path rather
  // than a directory to walk -- fill it in ourselves.
  return { ...result, file }
}

function main(): void {
  const results = FILES.map(analyzeFile)
  console.log(buildReport(results))
}

main()
