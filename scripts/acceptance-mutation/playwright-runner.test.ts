import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bddgenSpawn,
  genSpawnFailureReason,
  playwrightTestSpawn,
  readPlaywrightSummary,
  runGenSpawn,
  runLevelAbortReason,
  type PlaywrightRunSummary,
} from './playwright-runner.ts'

describe('bddgenSpawn', () => {
  it('spawns bddgen against the mutation config with ACCEPTANCE_MUTATION_DIR set', () => {
    const spawn = bddgenSpawn('/tmp/some-dir')
    expect(spawn.command).toBe('npx')
    expect(spawn.args).toEqual(['bddgen', '--config', 'playwright.acceptance-mutation.config.ts'])
    expect(spawn.env.ACCEPTANCE_MUTATION_DIR).toBe('/tmp/some-dir')
  })

  it('carries the rest of the parent env through, not just the one variable it sets', () => {
    const spawn = bddgenSpawn('/tmp/some-dir')
    expect(spawn.env.PATH).toBe(process.env.PATH)
  })
})

describe('playwrightTestSpawn', () => {
  it('spawns playwright test against the mutation config with both env vars set', () => {
    const spawn = playwrightTestSpawn('/tmp/some-dir', '/tmp/some-dir/out.json')
    expect(spawn.command).toBe('npx')
    expect(spawn.args).toEqual(['playwright', 'test', '--config', 'playwright.acceptance-mutation.config.ts'])
    expect(spawn.env.ACCEPTANCE_MUTATION_DIR).toBe('/tmp/some-dir')
    expect(spawn.env.PLAYWRIGHT_JSON_OUTPUT_FILE).toBe('/tmp/some-dir/out.json')
  })

  // bddgenSpawn never sets this -- generation has no JSON reporter output to
  // redirect, and giving it one anyway would be a silent no-op that reads
  // like intent.
  it('does not set PLAYWRIGHT_JSON_OUTPUT_FILE on the generation spawn', () => {
    const spawn = bddgenSpawn('/tmp/some-dir')
    expect(spawn.env.PLAYWRIGHT_JSON_OUTPUT_FILE).toBeUndefined()
  })
})

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))

describe('runGenSpawn', () => {
  afterEach(() => {
    vi.mocked(spawnSync).mockReset()
  })

  it('passes the spawn shape straight through to spawnSync', () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      signal: null,
      output: [],
      pid: 0,
      stdout: '',
      stderr: '',
    })

    const spawn = playwrightTestSpawn('/tmp/some-dir', '/tmp/some-dir/out.json')
    runGenSpawn(spawn)

    expect(spawnSync).toHaveBeenCalledWith(spawn.command, spawn.args, { encoding: 'utf8', env: spawn.env })
  })
})

describe('readPlaywrightSummary', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  function jsonPath(contents: string | undefined): string {
    dir = mkdtempSync(path.join(os.tmpdir(), 'playwright-runner-'))
    const file = path.join(dir, 'result.json')
    if (contents !== undefined) writeFileSync(file, contents)
    return file
  }

  // Shape pinned against a real Playwright 1.62.1 JSON-reporter run of
  // playwright.acceptance-mutation.config.ts (see playwright-runner.ts's
  // module comment) -- trimmed to the fields this module actually reads,
  // plus a handful of the surrounding fields a real report also carries, so
  // the reader is proven to ignore what it doesn't need rather than merely
  // to accept an artificially minimal fixture.
  function twoFileReport(): string {
    return JSON.stringify({
      config: { rootDir: '/repo' },
      errors: [],
      suites: [
        {
          title: 'out/infinite-grid.baseline.feature.spec.js',
          file: 'out/infinite-grid.baseline.feature.spec.js',
          suites: [
            {
              title: 'Infinite grid',
              file: 'out/infinite-grid.baseline.feature.spec.js',
              specs: [
                { title: 'a', ok: true, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
                { title: 'b', ok: true, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
              ],
            },
          ],
          specs: [],
        },
        {
          title: 'out/infinite-grid.mutant-0.feature.spec.js',
          file: 'out/infinite-grid.mutant-0.feature.spec.js',
          suites: [
            {
              title: 'Infinite grid',
              file: 'out/infinite-grid.mutant-0.feature.spec.js',
              specs: [
                { title: 'a', ok: false, tests: [{ status: 'unexpected', results: [{ status: 'failed' }] }] },
                { title: 'b', ok: true, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
              ],
            },
          ],
          specs: [],
        },
      ],
      stats: {
        startTime: '2026-08-25T00:00:00.000Z',
        duration: 1000,
        expected: 3,
        skipped: 0,
        unexpected: 1,
        flaky: 0,
      },
    })
  }

  it('summarizes each top-level suite as one generated spec file, keyed by basename', () => {
    const summary = readPlaywrightSummary(jsonPath(twoFileReport())) as PlaywrightRunSummary
    expect(summary.bySpecFile['infinite-grid.baseline.feature.spec.js']).toEqual({
      numTotalTests: 2,
      numFailedTests: 0,
      numSkippedTests: 0,
    })
    expect(summary.bySpecFile['infinite-grid.mutant-0.feature.spec.js']).toEqual({
      numTotalTests: 2,
      numFailedTests: 1,
      numSkippedTests: 0,
    })
  })

  it('counts only "unexpected" tests as failures, not "expected"', () => {
    const summary = readPlaywrightSummary(jsonPath(twoFileReport())) as PlaywrightRunSummary
    expect(summary.bySpecFile['infinite-grid.baseline.feature.spec.js'].numFailedTests).toBe(0)
  })

  // The pin the invocation flagged: spec.ok is true for a skipped spec
  // (Playwright's own ok() returns true for expected | flaky | skipped), so
  // a reader keyed on `ok` instead of `status` would silently count this as
  // passed. status must be the only thing this module reads.
  it('counts a spec with ok: true but status "skipped" as skipped, never as passed', () => {
    const withSkip = JSON.parse(twoFileReport())
    withSkip.suites[0].suites[0].specs.push({
      title: 'c',
      ok: true,
      tests: [{ status: 'skipped', results: [] }],
    })
    const summary = readPlaywrightSummary(jsonPath(JSON.stringify(withSkip))) as PlaywrightRunSummary
    expect(summary.bySpecFile['infinite-grid.baseline.feature.spec.js']).toEqual({
      numTotalTests: 3,
      numFailedTests: 0,
      numSkippedTests: 1,
    })
  })

  it('reads the run-level flaky count', () => {
    const summary = readPlaywrightSummary(jsonPath(twoFileReport())) as PlaywrightRunSummary
    expect(summary.flaky).toBe(0)
  })

  it('reports a nonzero flaky count when present, the tamper signal retries:0 exists to make meaningful', () => {
    const withFlaky = JSON.parse(twoFileReport())
    withFlaky.stats.flaky = 2
    const summary = readPlaywrightSummary(jsonPath(JSON.stringify(withFlaky))) as PlaywrightRunSummary
    expect(summary.flaky).toBe(2)
  })

  it('reads the run-level errors[] length', () => {
    const summary = readPlaywrightSummary(jsonPath(twoFileReport())) as PlaywrightRunSummary
    expect(summary.errors).toBe(0)
  })

  it('reports a nonzero errors count when present', () => {
    const withErrors = JSON.parse(twoFileReport())
    withErrors.errors = [{ message: 'config problem' }, { message: 'webServer failure' }]
    const summary = readPlaywrightSummary(jsonPath(JSON.stringify(withErrors))) as PlaywrightRunSummary
    expect(summary.errors).toBe(2)
  })

  it('defaults errors to 0 when the field is absent, rather than invalidating the whole summary', () => {
    const noErrorsField = JSON.parse(twoFileReport())
    delete noErrorsField.errors
    const summary = readPlaywrightSummary(jsonPath(JSON.stringify(noErrorsField))) as PlaywrightRunSummary
    expect(summary.errors).toBe(0)
  })

  it('is null when the file was never written -- a hard crash before the reporter could write one', () => {
    expect(readPlaywrightSummary(jsonPath(undefined))).toBeNull()
  })

  it('is null on invalid JSON', () => {
    expect(readPlaywrightSummary(jsonPath('not json'))).toBeNull()
  })

  it('is null when suites is missing entirely', () => {
    expect(readPlaywrightSummary(jsonPath(JSON.stringify({ stats: { flaky: 0 } })))).toBeNull()
  })

  it('is null when suites is present but not an array', () => {
    expect(readPlaywrightSummary(jsonPath(JSON.stringify({ suites: {}, stats: { flaky: 0 } })))).toBeNull()
  })

  it('is null when stats.flaky is missing', () => {
    expect(readPlaywrightSummary(jsonPath(JSON.stringify({ suites: [], stats: {} })))).toBeNull()
  })

  it('is null when stats.flaky is the wrong type', () => {
    expect(readPlaywrightSummary(jsonPath(JSON.stringify({ suites: [], stats: { flaky: '0' } })))).toBeNull()
  })

  it('skips a top-level suite entry with no file property rather than crashing', () => {
    const malformed = JSON.stringify({
      suites: [{ title: 'no file here', suites: [], specs: [] }],
      stats: { flaky: 0 },
    })
    const summary = readPlaywrightSummary(jsonPath(malformed)) as PlaywrightRunSummary
    expect(summary.bySpecFile).toEqual({})
  })

  it('reports zero tests for a suite with no specs at all, rather than throwing', () => {
    const empty = JSON.stringify({
      suites: [{ title: 'x', file: 'out/empty.feature.spec.js', suites: [], specs: [] }],
      stats: { flaky: 0 },
    })
    const summary = readPlaywrightSummary(jsonPath(empty)) as PlaywrightRunSummary
    expect(summary.bySpecFile['empty.feature.spec.js']).toEqual({
      numTotalTests: 0,
      numFailedTests: 0,
      numSkippedTests: 0,
    })
  })
})

describe('genSpawnFailureReason', () => {
  it('is null when the spawn exited 0', () => {
    expect(
      genSpawnFailureReason('bddgen', {
        status: 0,
        signal: null,
        output: [],
        pid: 0,
        stdout: '',
        stderr: '',
      }),
    ).toBeNull()
  })

  it('names the label and exit code, plus stderr, when the spawn exited nonzero', () => {
    const reason = genSpawnFailureReason('bddgen (baseline phase)', {
      status: 1,
      signal: null,
      output: [],
      pid: 0,
      stdout: '',
      stderr: 'missing step definition',
    })
    expect(reason).toMatch(/bddgen \(baseline phase\)/)
    expect(reason).toMatch(/exited 1/)
    expect(reason).toMatch(/missing step definition/)
  })

  it('falls back to stdout when stderr is empty', () => {
    const reason = genSpawnFailureReason('bddgen', {
      status: 1,
      signal: null,
      output: [],
      pid: 0,
      stdout: 'stdout detail',
      stderr: '',
    })
    expect(reason).toMatch(/stdout detail/)
  })
})

describe('runLevelAbortReason', () => {
  const clean: PlaywrightRunSummary = { bySpecFile: {}, flaky: 0, errors: 0 }

  it('is null for a clean summary', () => {
    expect(runLevelAbortReason(clean)).toBeNull()
  })

  it('names "no readable Playwright JSON summary" when the summary is null', () => {
    expect(runLevelAbortReason(null)).toMatch(/no readable Playwright JSON summary/)
  })

  it('names the errors count when errors[] is nonempty', () => {
    expect(runLevelAbortReason({ ...clean, errors: 3 })).toMatch(/3 run-level error/)
  })

  // Never the playwright-test spawn's own exit code -- a killed mutant makes
  // that exit nonzero by design, so only the JSON-derived flaky/errors
  // signals may abort a phase.
  it('names the flaky count when nonzero, the tamper signal retries:0 exists to make meaningful', () => {
    expect(runLevelAbortReason({ ...clean, flaky: 1 })).toMatch(/1 flaky test/)
  })

  it('checks errors before flaky when both are nonzero', () => {
    expect(runLevelAbortReason({ ...clean, errors: 1, flaky: 1 })).toMatch(/run-level error/)
  })
})
