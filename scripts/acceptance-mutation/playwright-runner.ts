// Spawn args/env and JSON-reporter reading for the batched Playwright design
// (see playwright.acceptance-mutation.config.ts's header comment). This
// replaces scripts/acceptance-mutation/vitest-runner.ts's role -- spawning
// the test process and reading back a trustworthy collected/failed count --
// but for one batched `playwright test` invocation covering every mutant's
// generated spec at once, rather than one vitest spawn per mutant.
//
// Two spawns, not one: `bddgen` (writes ${dir}/features/*.feature ->
// ${dir}/out/*.feature.spec.js, see mutant-tree.ts) and `playwright test`
// (runs what bddgen wrote). Both read ACCEPTANCE_MUTATION_DIR from the
// config; only the test spawn also needs PLAYWRIGHT_JSON_OUTPUT_FILE, the
// one env var Playwright 1.62.1 honors to redirect its `json` reporter's
// output (see CLAUDE.md's Commands section on the _OUTPUT_FILE resolution
// order, verified against node_modules/playwright/lib/runner/index.js).
//
// Never a regex over console text, mirroring classify.ts's/vitest-runner.ts's
// existing contract: a summary is read from the JSON reporter's own output,
// or it's null and callers treat that as an infrastructure error rather than
// guessing from exit code and stdout chrome.
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const CONFIG_PATH = 'playwright.acceptance-mutation.config.ts'

// A label-prefixed reason string, or null when the spawn is unremarkable --
// this is checked after bddgen only. The playwright-test spawn's own exit
// code must never gate on this: a killed mutant makes `playwright test` exit
// nonzero by design, so that signal has to come from the JSON report
// (runLevelAbortReason below), never from SpawnSyncReturns.status.
export function genSpawnFailureReason(label: string, result: SpawnSyncReturns<string>): string | null {
  if (result.status === 0) return null
  return `${label} exited ${result.status}: ${(result.stderr || result.stdout || '').trim()}`
}

export interface GenSpawn {
  command: string
  args: string[]
  env: NodeJS.ProcessEnv
}

// Nothing here decides *which* mutants exist -- writing ${dir}/features/*
// before calling this is the caller's job, same division vitest-runner.ts
// had with its own temp feature-file path.
export function bddgenSpawn(dir: string): GenSpawn {
  return {
    command: 'npx',
    args: ['bddgen', '--config', CONFIG_PATH],
    env: { ...process.env, ACCEPTANCE_MUTATION_DIR: dir },
  }
}

export function playwrightTestSpawn(dir: string, jsonOutputPath: string): GenSpawn {
  return {
    command: 'npx',
    args: ['playwright', 'test', '--config', CONFIG_PATH],
    env: { ...process.env, ACCEPTANCE_MUTATION_DIR: dir, PLAYWRIGHT_JSON_OUTPUT_FILE: jsonOutputPath },
  }
}

export function runGenSpawn(spawn: GenSpawn): SpawnSyncReturns<string> {
  return spawnSync(spawn.command, spawn.args, { encoding: 'utf8', env: spawn.env })
}

export interface SpecSummary {
  numTotalTests: number
  numFailedTests: number
  numSkippedTests: number
}

// bySpecFile is keyed by the generated spec file's basename (e.g.
// "infinite-grid.mutant-0.feature.spec.js", exactly what mutant-tree.ts's
// specFileName produces) rather than by the path Playwright reports, since
// that path carries the ACCEPTANCE_MUTATION_DIR prefix and callers only ever
// have the basename to look a result up by.
//
// flaky is the run-level stats.flaky count. retries is hardcoded to 0 in
// playwright.acceptance-mutation.config.ts specifically so a nonzero flaky
// count here is never an ordinary retry succeeding -- it means something
// outside this module re-ran a test (a stray --retries flag, a custom
// reporter), which is a signal worth surfacing rather than silently folding
// into "failed" or "passed".
//
// errors is the run-level `errors[]` array's length -- a config problem or a
// webServer failure Playwright can't attach to any one spec. Defaults to 0
// when the field is absent or malformed rather than invalidating the whole
// summary the way a missing `stats.flaky` does: unlike flaky, this repo has
// no contract that the field is always present, only that a nonzero count
// (when it is) means something outside normal mutant scoring went wrong.
export interface PlaywrightRunSummary {
  bySpecFile: Record<string, SpecSummary>
  flaky: number
  errors: number
}

// Signals a mutant classification must never explain, so the whole phase
// aborts instead of trying to attribute one of these to a mutant: a run-level
// error unattached to any spec (a config problem, a webServer failure), or a
// nonzero `flaky` count, which retries:0 in
// playwright.acceptance-mutation.config.ts makes impossible except by
// something outside this module re-running a test.
export function runLevelAbortReason(summary: PlaywrightRunSummary | null): string | null {
  if (summary === null) return 'no readable Playwright JSON summary'
  if (summary.errors > 0) return `Playwright reported ${summary.errors} run-level error(s)`
  if (summary.flaky > 0) return `Playwright reported ${summary.flaky} flaky test(s) under retries:0`
  return null
}

// The JSON reporter's own shape (Playwright 1.62.1, measured directly by
// running playwright.acceptance-mutation.config.ts against a planted
// feature). Only the fields this module actually reads are declared --
// `suites` nests recursively (Feature -> Scenario -> spec/test), and one
// *top-level* entry in `suites` corresponds to exactly one generated spec
// file, named by its own `file` property.
interface RawTest {
  status: unknown
}
interface RawSpec {
  tests: unknown
}
interface RawSuite {
  file: unknown
  suites: unknown
  specs: unknown
}
interface RawReport {
  suites: unknown
  stats: unknown
  errors: unknown
}

function isRawSuite(value: unknown): value is RawSuite {
  return typeof value === 'object' && value !== null && 'file' in value
}

function isRawSpec(value: unknown): value is RawSpec {
  return typeof value === 'object' && value !== null && 'tests' in value
}

function isRawTest(value: unknown): value is RawTest {
  return typeof value === 'object' && value !== null && 'status' in value
}

// Recursively collects every leaf test's outcome under one top-level file
// suite -- Feature/Scenario/Examples nesting all funnel through here, so the
// per-file total doesn't have to know how deep bddgen's own suite tree goes.
function collectTestStatuses(suite: RawSuite, out: string[]): void {
  for (const rawSpec of Array.isArray(suite.specs) ? suite.specs : []) {
    if (!isRawSpec(rawSpec)) continue
    for (const rawTest of Array.isArray(rawSpec.tests) ? rawSpec.tests : []) {
      if (isRawTest(rawTest) && typeof rawTest.status === 'string') out.push(rawTest.status)
    }
  }
  for (const child of Array.isArray(suite.suites) ? suite.suites : []) {
    if (isRawSuite(child)) collectTestStatuses(child, out)
  }
}

function summarize(statuses: string[]): SpecSummary {
  return {
    numTotalTests: statuses.length,
    // 'unexpected' is Playwright's own outcome label for a test that failed
    // when it wasn't expected to (measured: a scenario broken by a mutated
    // Examples cell reports status "unexpected", a passing one "expected").
    numFailedTests: statuses.filter((status) => status === 'unexpected').length,
    // Read from `status`, never `ok`: `spec.ok` is `true` for a skipped spec
    // (Playwright's own ok() returns true for expected | flaky | skipped --
    // measured against 1.62.1), so a reader keyed on `ok` would silently
    // fold a skipped scenario into "passed" instead of surfacing it as the
    // infrastructure error it is (see classify.ts's classifyMutant).
    numSkippedTests: statuses.filter((status) => status === 'skipped').length,
  }
}

export function readPlaywrightSummary(jsonOutputPath: string): PlaywrightRunSummary | null {
  let parsed: RawReport
  try {
    parsed = JSON.parse(readFileSync(jsonOutputPath, 'utf8')) as RawReport
  } catch {
    // Covers both "the reporter never wrote a file" (a crash before
    // Playwright could start reporting) and "the file exists but isn't
    // valid JSON" -- same treatment as vitest-runner.ts's readSummary.
    return null
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.suites)) return null
  const stats = parsed.stats
  if (typeof stats !== 'object' || stats === null || typeof (stats as { flaky?: unknown }).flaky !== 'number') {
    return null
  }

  const bySpecFile: Record<string, SpecSummary> = {}
  for (const rawSuite of parsed.suites) {
    if (!isRawSuite(rawSuite) || typeof rawSuite.file !== 'string') continue
    const statuses: string[] = []
    collectTestStatuses(rawSuite, statuses)
    bySpecFile[path.basename(rawSuite.file)] = summarize(statuses)
  }

  const errors = Array.isArray(parsed.errors) ? parsed.errors.length : 0
  return { bySpecFile, flaky: (stats as { flaky: number }).flaky, errors }
}
