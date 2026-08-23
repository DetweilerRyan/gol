import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runScenarioSuite } from './vitest-runner.ts'

// Separate file from vitest-runner.test.ts on purpose: that file's spawn
// test runs a real subprocess to pin the classification-defect regression
// (see its own comment), and `vi.mock('node:child_process')` is hoisted
// file-wide -- a factory mock here would silently break that real subprocess
// test if the two shared a file. This file only pins the *shape* of the
// spawnSync call (argv and options), which the real-subprocess test has no
// way to observe from the outside.
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))

describe('runScenarioSuite spawnSync call shape', () => {
  afterEach(() => {
    vi.mocked(spawnSync).mockReset()
  })

  it('spawns vitest run against the steps file with the JSON reporter and an output file', () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      signal: null,
      output: [],
      pid: 0,
      stdout: '',
      stderr: '',
    })

    runScenarioSuite('/steps/alpha.steps.test.ts', '/features/alpha.feature', '/tmp/out.json')

    expect(spawnSync).toHaveBeenCalledWith(
      'npx',
      ['vitest', 'run', '/steps/alpha.steps.test.ts', '--reporter=json', '--outputFile=/tmp/out.json'],
      {
        encoding: 'utf8',
        env: expect.objectContaining({ ACCEPTANCE_MUTATION_FEATURE_FILE: '/features/alpha.feature' }),
      },
    )
  })
})
