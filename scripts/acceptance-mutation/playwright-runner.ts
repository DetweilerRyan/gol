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
// NOT SPLIT, deliberately -- read this before reaching for the seam again.
// This file carries ~165 mutants, over `cleaner`'s 100+ "consider a split"
// guide, and the arithmetic doesn't rescue the obvious seam: the spawn half is
// ~30 of them, leaving ~135 in the report-reading half, still over. The density
// is intrinsic to defensive parsing of a foreign JSON shape -- three type
// guards, three status-string literals, and a fallback per nesting level --
// not two concerns sharing a file. Splitting the report half out would have to
// export RawSuite/RawSpec/RawTest across a file boundary, which trades a
// private representation (the same convention cache.ts states explicitly) for
// no reduction in coupling. Corroborating: CRAP <= 6 at 100% line coverage,
// and a scoped mutation scan at 98.27% whose five survivors are argued
// equivalent at their own sites.
//
// The falsifier, so this is a decision rather than a standing excuse: if a
// second consumer ever wants only the spawn half -- another batched runner, a
// scripts/-root shared spawner -- split along that seam then, and the spawn
// half keeps this filename (CLAUDE.md names it as the thing that spawns
// bddgen/playwright).
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

// Unlike flaky/errors (run-level, checked by runLevelAbortReason above), a
// skipped spec is enforced one spec at a time, by classifyMutant/
// assertBaselineSpecGreen in classify.ts -- so there is no single run-level
// count to read off `summary` directly, and this module is the one that
// owns `bySpecFile`'s shape well enough to sum across it. run.ts's own
// per-phase report calls this to make that per-spec enforcement auditable
// in its printed output rather than only implicit in a clean exit.
export function sumSkipped(summary: PlaywrightRunSummary): number {
  return Object.values(summary.bySpecFile).reduce((total, spec) => total + spec.numSkippedTests, 0)
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

// Each `Array.isArray(x) ? x : []` fallback below (here, and in
// collectStatusesFromSpecs/collectTestStatuses) is mutation-equivalent to
// any single-element non-array fallback, `["Stryker was here"]` included:
// the loop body's own isRawTest/isRawSpec/isRawSuite guard rejects a bare
// string on `typeof value === 'object'` before it can matter, the same way
// it rejects any other non-object entry (see the null/non-object tests
// below) -- so this scan's mutation survivor on that literal is expected.

// The innermost half of collectTestStatuses -- one spec's own tests.
function collectStatusesFromTests(tests: unknown, out: string[]): void {
  for (const rawTest of Array.isArray(tests) ? tests : []) {
    if (isRawTest(rawTest) && typeof rawTest.status === 'string') out.push(rawTest.status)
  }
}

// The middle half of collectTestStatuses -- one suite's own specs, with no
// recursion. Split out (along with collectStatusesFromTests above) so each
// of the three nesting dimensions (suite's children, spec's tests, test's
// status) carries its own, smaller branch count.
function collectStatusesFromSpecs(specs: unknown, out: string[]): void {
  for (const rawSpec of Array.isArray(specs) ? specs : []) {
    if (!isRawSpec(rawSpec)) continue
    collectStatusesFromTests(rawSpec.tests, out)
  }
}

// Recursively collects every leaf test's outcome under one top-level file
// suite -- Feature/Scenario/Examples nesting all funnel through here, so the
// per-file total doesn't have to know how deep bddgen's own suite tree goes.
function collectTestStatuses(suite: RawSuite, out: string[]): void {
  collectStatusesFromSpecs(suite.specs, out)
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

// Covers both "the reporter never wrote a file" (a crash before Playwright
// could start reporting) and "the file exists but isn't valid JSON" -- same
// treatment as vitest-runner.ts's readSummary. Its sole caller's `!parsed`
// guard treats a thrown-then-caught read the same as any other falsy
// result, so this function's own null-vs-undefined distinction is
// unobservable from outside the module -- a mutation scan emptying this
// catch block (dropping the explicit `return null`, leaving an implicit
// `return undefined`) is therefore an equivalent mutant, not a gap.
function parseRawReport(jsonOutputPath: string): RawReport | null {
  try {
    return JSON.parse(readFileSync(jsonOutputPath, 'utf8')) as RawReport
  } catch {
    return null
  }
}

// null when `stats` isn't a usable object or its `flaky` field isn't a
// number -- the one field this module treats as load-bearing enough to
// invalidate the whole summary over (see PlaywrightRunSummary's comment on
// why `errors` gets a default instead).
function readFlakyCount(parsed: RawReport): number | null {
  const stats = parsed.stats
  if (typeof stats !== 'object' || stats === null) return null
  const flaky = (stats as { flaky?: unknown }).flaky
  return typeof flaky === 'number' ? flaky : null
}

function buildBySpecFile(suites: unknown[]): Record<string, SpecSummary> {
  const bySpecFile: Record<string, SpecSummary> = {}
  for (const rawSuite of suites) {
    if (!isRawSuite(rawSuite) || typeof rawSuite.file !== 'string') continue
    const statuses: string[] = []
    collectTestStatuses(rawSuite, statuses)
    bySpecFile[path.basename(rawSuite.file)] = summarize(statuses)
  }
  return bySpecFile
}

export function readPlaywrightSummary(jsonOutputPath: string): PlaywrightRunSummary | null {
  const parsed = parseRawReport(jsonOutputPath)
  // The middle `typeof parsed !== 'object'` check is mutation-equivalent to
  // `false` here: JSON.parse can only produce a non-object `parsed` that is
  // also truthy (a string/number/boolean/array literal), and every one of
  // those has no `.suites` property, so `!Array.isArray(parsed.suites)`
  // already catches it on its own. Left in as defense-in-depth against a
  // `RawReport` shape change, not because a reachable input distinguishes
  // the two.
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.suites)) return null

  const flaky = readFlakyCount(parsed)
  if (flaky === null) return null

  const bySpecFile = buildBySpecFile(parsed.suites)
  const errors = Array.isArray(parsed.errors) ? parsed.errors.length : 0
  return { bySpecFile, flaky, errors }
}
