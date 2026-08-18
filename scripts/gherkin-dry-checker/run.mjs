#!/usr/bin/env node
// Gherkin DRY checker, following the concept of
// https://github.com/unclebob/Acceptance-Pipeline-Specification's
// gherkin-ir-dry-checker: find step-text vocabulary duplication/drift across
// our .feature files. Report-only and advisory, matching the spec's own
// stance -- it never rewrites feature files, and (per ir-dry-checker-spec.md)
// exits 0 on a successful run regardless of findings; only a genuine error
// exits nonzero.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeSteps } from './analyze.mjs'
import { parseSteps } from './step-parser.mjs'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const FEATURES_DIR = path.resolve(SCRIPT_DIR, '../../features')
const REPORT_PATH = path.resolve(SCRIPT_DIR, '../../reports/gherkin-dry/report.json')

const FEATURE_FILES = [
  'cell-life-and-death.feature',
  'infinite-grid.feature',
  'camera-pan-and-zoom.feature',
  'grid-reference-lines.feature',
  'mouse-wheel-controls.feature',
]

function loadAllSteps() {
  const steps = []
  for (const file of FEATURE_FILES) {
    const text = readFileSync(path.join(FEATURES_DIR, file), 'utf8')
    for (const step of parseSteps(text)) {
      steps.push({ feature: file, ...step })
    }
  }
  return steps
}

function formatLocation(location) {
  const scene = location.scenario_name ? ` "${location.scenario_name}"` : ''
  return `${location.feature} / ${location.section}${scene}`
}

function printReport(report) {
  console.log(`Gherkin DRY check -- ${report.summary.step_occurrences} step occurrences, ${report.summary.unique_steps} unique, ${report.findings.length} findings\n`)

  if (report.findings.length === 0) {
    console.log('No findings.')
    return
  }

  for (const finding of report.findings) {
    const scoreSuffix = finding.score === undefined ? '' : ` (score ${finding.score})`
    console.log(`[${finding.confidence.toUpperCase()}] ${finding.kind}${scoreSuffix}`)
    console.log(`  ${finding.reason}`)
    for (const member of finding.members) {
      console.log(`    - ${formatLocation(member.location)}: ${member.location.keyword} ${member.text}`)
    }
    console.log(`  suggested: ${finding.suggested_action}\n`)
  }
}

function main() {
  const steps = loadAllSteps()
  const report = analyzeSteps(steps)

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  printReport(report)
  console.log(`Full JSON report: ${path.relative(process.cwd(), REPORT_PATH)}`)
}

main()
