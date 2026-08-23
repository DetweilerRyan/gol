import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { classifyMutant } from './classify.ts'
import { assertBaselineGreen, readSummary, runScenarioSuite } from './vitest-runner.ts'

describe('readSummary', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  function jsonPath(contents: string | undefined): string {
    dir = mkdtempSync(path.join(os.tmpdir(), 'vitest-runner-'))
    const file = path.join(dir, 'summary.json')
    if (contents !== undefined) writeFileSync(file, contents)
    return file
  }

  it('reads numTotalTests/numFailedTests off a real vitest JSON report', () => {
    const file = jsonPath('{"numTotalTests":25,"numFailedTests":1,"success":false}')
    expect(readSummary(file)).toEqual({ numTotalTests: 25, numFailedTests: 1 })
  })

  it('is null when the file was never written -- a hard crash before the reporter ran', () => {
    const file = jsonPath(undefined)
    expect(readSummary(file)).toBeNull()
  })

  it('is null on invalid JSON', () => {
    const file = jsonPath('not json')
    expect(readSummary(file)).toBeNull()
  })

  it('is null when the expected numeric fields are missing or the wrong type', () => {
    const file = jsonPath('{"numTotalTests":"25","numFailedTests":1}')
    expect(readSummary(file)).toBeNull()
  })
})

describe('assertBaselineGreen', () => {
  const target = { feature: 'alpha.feature', steps: 'alpha.steps.test.ts' }

  it('returns the collected test count when the baseline exited 0 with at least one test', () => {
    expect(assertBaselineGreen(target, { exitCode: 0, summary: { numTotalTests: 25, numFailedTests: 0 } })).toBe(25)
  })

  it('throws, naming the target, when the baseline exited nonzero', () => {
    expect(() =>
      assertBaselineGreen(target, { exitCode: 1, summary: { numTotalTests: 25, numFailedTests: 1 } }),
    ).toThrow(/alpha\.feature/)
  })

  it('throws when there is no readable summary at all', () => {
    expect(() => assertBaselineGreen(target, { exitCode: 1, summary: null })).toThrow(/alpha\.feature/)
  })

  it('throws when the baseline collected zero tests, even if it somehow exited 0', () => {
    expect(() =>
      assertBaselineGreen(target, { exitCode: 0, summary: { numTotalTests: 0, numFailedTests: 0 } }),
    ).toThrow(/alpha\.feature/)
  })
})

// The regression test for the defect this whole slice exists to fix: point a
// *broken* steps file at a real feature and confirm the runner reports
// `error`, never `killed`. This spawns a real vitest subprocess -- slow, but
// deliberately: a mocked spawnSync would only prove the classification logic
// is self-consistent, not that it actually holds against vitest's real exit
// code and JSON output for a steps file that fails to even parse. See
// classify.ts's module comment for the bug this closes.
describe('runScenarioSuite against a genuinely broken steps file', () => {
  let dir: string | undefined
  let fixtureDir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    if (fixtureDir) rmSync(fixtureDir, { recursive: true, force: true })
    dir = undefined
    fixtureDir = undefined
  })

  it('classifies as error, not killed, against a real vitest run', () => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'vitest-runner-broken-'))
    const jsonOutputPath = path.join(dir, 'out.json')

    // The broken file has to live inside the repo tree for the root
    // vite.config.ts's `unit` project to collect it at all (its include is
    // unrooted, but vitest never matches a file outside its resolved root) --
    // and it can't live under features/ (that directory is product's
    // manifest) or scripts/ (excluded from the main vitest config, since
    // scripts/ has its own separate vitest.scripts.config.ts). A throwaway
    // top-level directory, created and removed within this one test, is
    // therefore both a real match for the config the runner actually uses and
    // outside every directory this slice is scoped away from.
    const repoRoot = path.resolve(import.meta.dirname, '../..')
    fixtureDir = mkdtempSync(path.join(repoRoot, 'tmp-acceptance-mutation-fixture-'))
    const brokenStepsPath = path.join(fixtureDir, 'broken.steps.test.ts')
    writeFileSync(brokenStepsPath, 'this is not valid typescript syntax !!!\n')

    const run = runScenarioSuite(brokenStepsPath, '/does/not/matter.feature', jsonOutputPath)

    // vitest's JSON reporter still writes a report for a file that failed to
    // parse -- 0 tests collected, exit code 1 -- which is exactly why the old
    // regex-over-console-text classifier got this wrong: it saw a nonzero
    // exit and the normal failure chrome and called it `killed`. A nonzero
    // baseline test count makes the mismatch, and therefore the `error`
    // classification, unambiguous.
    expect(run.exitCode).not.toBe(0)
    expect(run.summary).toEqual({ numTotalTests: 0, numFailedTests: 0 })
    expect(classifyMutant(25, run.summary)).toBe('error')
  }, 20000)
})
