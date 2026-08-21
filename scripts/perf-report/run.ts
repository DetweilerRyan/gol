#!/usr/bin/env tsx
// CLI shell for the render-perf reporter: reads every raw sample under
// reports/perf/raw/ (written by perf/) and
// writes reports/perf/latest.json, reports/perf/latest.md (also echoed to
// stdout), and one appended reports/perf/history.jsonl line. Report-only,
// no thresholds -- same stance as gherkin-dry-checker and halstead4ts.
//
// Everything with a decision to test lives in stats.ts/format.ts/
// environment.ts/raw-sample.ts; this file is the untested I/O shell that
// wires the real filesystem, git, and os reads to those pure modules, the
// same split halstead4ts/run.ts already uses.
//
// The boundary to perf/ is a JSON file on disk, not a module import -- see
// raw-sample.ts. Don't add an import from this file into perf/, and don't
// add one from perf/ into scripts/perf-report/;
// rules/no-value-import-across-perf-boundary.yml checks both directions.

import { appendFileSync, existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readRunEnvironment } from './environment.ts'
import { parseRawScenarioSample, type RawScenarioSample } from './raw-sample.ts'
import {
  buildLatestReport,
  formatHistoryLine,
  formatLatestJson,
  renderLatestMarkdown,
  renderNoSamplesMessage,
} from './format.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')
const RAW_DIR = path.join(REPO_ROOT, 'reports/perf/raw')
const LATEST_JSON_PATH = path.join(REPO_ROOT, 'reports/perf/latest.json')
const LATEST_MD_PATH = path.join(REPO_ROOT, 'reports/perf/latest.md')
const HISTORY_PATH = path.join(REPO_ROOT, 'reports/perf/history.jsonl')

function readGitSha(): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' })
  if (result.status !== 0 || !result.stdout) return 'unknown'
  return result.stdout.trim()
}

function readRawSamples(): RawScenarioSample[] {
  if (!existsSync(RAW_DIR)) return []
  const files = globSync('*.json', { cwd: RAW_DIR }).sort()
  return files.map((file) => {
    const filePath = path.join(RAW_DIR, file)
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    } catch (cause) {
      throw new Error(`${file}: not valid JSON`, { cause })
    }
    try {
      return parseRawScenarioSample(parsed)
    } catch (cause) {
      throw new Error(`${file}: ${(cause as Error).message}`, { cause })
    }
  })
}

function main(): void {
  const samples = readRawSamples()
  if (samples.length === 0) {
    console.log(renderNoSamplesMessage())
    return
  }

  const environment = readRunEnvironment({
    gitSha: readGitSha,
    cpus: os.cpus,
    nodeVersion: () => process.version,
    now: () => new Date(),
  })
  const report = buildLatestReport(environment, samples)

  mkdirSync(path.dirname(LATEST_JSON_PATH), { recursive: true })
  writeFileSync(LATEST_JSON_PATH, formatLatestJson(report))
  const markdown = renderLatestMarkdown(report)
  writeFileSync(LATEST_MD_PATH, markdown)
  appendFileSync(HISTORY_PATH, `${formatHistoryLine(report)}\n`)

  console.log(markdown)
  console.log(`\nFull JSON report: ${path.relative(process.cwd(), LATEST_JSON_PATH)}`)
}

main()
