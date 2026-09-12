import { describe, expect, it } from 'vitest'
import { decide, type ProseLintInput } from './decide.ts'

const ON_PATH_LOADED: ProseLintInput['probe'] = { valeOnPath: true, configLoaded: true, output: '' }

function input(overrides: Partial<ProseLintInput> = {}): ProseLintInput {
  return { probe: ON_PATH_LOADED, files: ['CLAUDE.md'], ...overrides }
}

describe('decide', () => {
  it('aborts with exit 1 when vale is not on PATH, and never calls runVale', () => {
    const runVale = () => {
      throw new Error('must not be called')
    }
    const result = decide(input({ probe: { valeOnPath: false, configLoaded: false, output: '' } }), runVale)
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([
      'prose-lint: vale is not on PATH. See .claude/agents/articles/prose.md, Setup.',
      'prose-lint: a machine without it lints nothing, which reads exactly like a clean run.',
    ])
  })

  it('aborts with exit 1 when the config will not load, appending the first three output lines', () => {
    const probe: ProseLintInput['probe'] = {
      valeOnPath: true,
      configLoaded: false,
      output: 'E100 [.vale.ini not found] Runtime error\n\nno config file found\n\nExecution stopped with code 1.\n',
    }
    const result = decide(input({ probe }), () => 0)
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([
      "prose-lint: vale cannot load .vale.ini. Run 'vale sync' -- .vale/ is gitignored,",
      'prose-lint: so a fresh worktree has none and the run aborts before reaching a rule.',
      'E100 [.vale.ini not found] Runtime error',
      '',
      'no config file found',
    ])
  })

  it('aborts with exit 1 when no tracked files matched, and never calls runVale', () => {
    const runVale = () => {
      throw new Error('must not be called')
    }
    const result = decide(input({ files: [] }), runVale)
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([
      'prose-lint: no tracked files matched. That is not a clean run, it is an empty one.',
    ])
  })

  it('aborts with exit 1 and names vale’s own exit code when runVale returns nonzero', () => {
    const result = decide(input(), () => 2)
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr).toEqual([
      'prose-lint: vale could not lint (vale exit 2), so the output above is not a result.',
      "prose-lint: with --no-exit a finding cannot cause this. See prose.md's confident-zero list.",
    ])
  })

  it('aborts with exit 1 when runVale returns null, folding it into the same nonzero branch', () => {
    const result = decide(input(), () => null)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toEqual([
      'prose-lint: vale could not lint (vale exit null), so the output above is not a result.',
      "prose-lint: with --no-exit a finding cannot cause this. See prose.md's confident-zero list.",
    ])
  })

  it('passes exactly input.files to runVale, in order', () => {
    const seen: string[][] = []
    const files = ['CLAUDE.md', 'src/App.tsx', 'README.md']
    decide(input({ files }), (calledWith) => {
      seen.push(calledWith)
      return 0
    })
    expect(seen).toEqual([files])
  })

  it('succeeds with exit 0 and one count line on stdout when runVale returns 0', () => {
    const result = decide(input({ files: ['a.md', 'b.ts'] }), () => 0)
    expect(result).toEqual({
      exitCode: 0,
      stdout: ['prose-lint: linted 2 tracked file(s). A zero above is a measured zero.'],
      stderr: [],
    })
  })
})
