import { describe, expect, it } from 'vitest'
import { decide, type DecideInput } from './decide.ts'

// Same in-memory schema shape as config-file.test.ts -- kept local rather
// than imported, so each test file stays a self-contained fixture the way
// this repo's other decide.test.ts files do.
const SCHEMA = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  required: ['scope', 'allow', 'absent'],
  properties: {
    $schema: { type: 'string' },
    scope: { type: 'string' },
    allow: { type: 'array', items: { $ref: '#/definitions/allowEntry' } },
    absent: { type: 'array', items: { $ref: '#/definitions/absentEntry' } },
  },
  definitions: {
    path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*(/\\*\\*)?$' },
    allowEntry: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'securedBy'],
      properties: {
        path: { $ref: '#/definitions/path' },
        securedBy: { enum: ['vitest-exclude', 'stryker-ignore-patterns', 'written-argument'] },
        argument: { type: 'string' },
        verifiedOn: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      },
      if: { properties: { securedBy: { const: 'written-argument' } } },
      then: {
        required: ['argument', 'verifiedOn'],
        properties: { path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$' } },
      },
      else: {
        properties: { path: { type: 'string', pattern: '^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*/\\*\\*$' } },
      },
    },
    absentEntry: {
      type: 'object',
      additionalProperties: false,
      required: ['path', 'reason'],
      properties: { path: { $ref: '#/definitions/path' }, reason: { type: 'string' } },
    },
  },
})

const VALID_CONFIG = JSON.stringify({
  scope: 'npm run test:mutation',
  allow: [
    { path: 'features/**', securedBy: 'stryker-ignore-patterns' },
    { path: 'CLAUDE.md', securedBy: 'written-argument', argument: 'never mutated', verifiedOn: '2026-09-08' },
  ],
  absent: [{ path: 'src/**', reason: "stryker's own mutate scope" }],
})

function baseInput(overrides: Partial<DecideInput> = {}): DecideInput {
  return {
    configText: VALID_CONFIG,
    schemaText: SCHEMA,
    configPath: 'mutation-invariance.config.json',
    vitestProjects: [{ name: 'unit', exclude: [] }],
    strykerIgnorePatterns: ['/features'],
    trackedFiles: new Set(['CLAUDE.md']),
    rationaleText: 'features/** CLAUDE.md src/**',
    ...overrides,
  }
}

describe('decide', () => {
  it('exits 0 for a sound config with no --diff given', () => {
    const result = decide(baseInput())
    expect(result.exitCode).toBe(0)
    expect(result.lines.some((line) => line.includes('no --diff given'))).toBe(true)
  })

  it('exits 1 on a config-parse failure, never reaching checkAll or the diff', () => {
    const result = decide(
      baseInput({ configText: '{ not json', diff: { range: 'x', command: 'y', changedPaths: ['z'] } }),
    )
    expect(result.exitCode).toBe(1)
    // Pins formatFailureLines' whole shape (the 'config invalid' label, the
    // header template, the blank separator line, and the per-failure
    // `[check] file` / `  message` pair) -- a substring-only check on the
    // failure line alone can't tell the header or separator apart from an
    // emptied one.
    expect(result.lines[0]).toBe('mutation-invariance -- config invalid, 1 failure(s):')
    expect(result.lines[1]).toBe('')
    expect(result.lines[2]).toBe('[config-parse] mutation-invariance.config.json')
    expect(result.lines[3]).toMatch(/^ {2}invalid JSON: /)
    expect(result.lines).toHaveLength(4)
    // If the diff had been evaluated it would report invariant/not-invariant
    // language; a parse failure must short-circuit before that.
    expect(result.lines.some((line) => line.includes('invariant'))).toBe(false)
  })

  it('exits 1 on a checkAll failure, never evaluating the diff even when the diff would pass', () => {
    const result = decide(
      baseInput({
        vitestProjects: [], // empties C7's vitest-projects-non-empty check
        diff: { range: 'x', command: 'y', changedPaths: ['features/foo.feature'] },
      }),
    )
    expect(result.exitCode).toBe(1)
    // Same shape-pinning as the config-parse case above, for the
    // 'config unsound' label instead.
    expect(result.lines[0]).toBe('mutation-invariance -- config unsound, 1 failure(s):')
    expect(result.lines[1]).toBe('')
    expect(result.lines[2]).toBe('[vitest-projects-non-empty] (none)')
    expect(result.lines[3]).toBe('  no vitest projects were provided -- C1 would pass vacuously')
    expect(result.lines).toHaveLength(4)
    expect(result.lines.some((line) => line.includes('is mutation-invariant'))).toBe(false)
  })

  // The disqualifying-path guard reads `verdict.disqualifying?.absentReason`
  // -- an empty diff is the one verdict shape where `disqualifying` itself
  // is never set (see diff-verdict.ts), so this is the only input that can
  // tell the optional chain, and the `if` guard itself, apart from a mutant
  // that drops either: both would dereference `undefined` and throw.
  it('does not crash on an empty diff, where disqualifying is never set', () => {
    const result = decide(baseInput({ diff: { range: 'x', command: 'y', changedPaths: [] } }))
    expect(result.exitCode).toBe(2)
    expect(result.lines[1]).toContain('check the range')
  })

  it('exits 0 and reports the range when the diff is invariant', () => {
    const result = decide(
      baseInput({ diff: { range: 'main...HEAD', command: 'git diff', changedPaths: ['CLAUDE.md'] } }),
    )
    expect(result.exitCode).toBe(0)
    expect(result.lines).toEqual(['mutation-invariance -- main...HEAD is mutation-invariant.'])
  })

  it('exits 2 and names the disqualifying path when the diff is not invariant', () => {
    const result = decide(
      baseInput({ diff: { range: 'main...HEAD', command: 'git diff', changedPaths: ['README.md'] } }),
    )
    expect(result.exitCode).toBe(2)
    expect(result.lines[0]).toContain('NOT mutation-invariant')
    expect(result.lines.some((line) => line.includes('README.md'))).toBe(true)
  })

  it('surfaces the absent[] reason on a 2-exit verdict when the disqualifying path is in absent[]', () => {
    const result = decide(
      baseInput({ diff: { range: 'main...HEAD', command: 'git diff', changedPaths: ['src/gameOfLife.ts'] } }),
    )
    expect(result.exitCode).toBe(2)
    expect(result.lines.some((line) => line.includes("stryker's own mutate scope"))).toBe(true)
  })
})
