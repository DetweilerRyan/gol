import { describe, expect, it } from 'vitest'
import { evaluateDiff } from './diff-verdict.ts'
import type { MutationInvarianceConfig } from './config-file.ts'

function config(overrides: Partial<MutationInvarianceConfig> = {}): MutationInvarianceConfig {
  return {
    scope: 'npm run test:mutation',
    allow: [
      { path: 'features/**', securedBy: 'stryker-ignore-patterns' },
      { path: 'CLAUDE.md', securedBy: 'written-argument', argument: 'x', verifiedOn: '2026-09-08' },
    ],
    absent: [{ path: 'src/**', reason: "Stryker's own mutate scope; obviously moves the score." }],
    ...overrides,
  }
}

describe('evaluateDiff', () => {
  it('is invariant when every changed path is covered by an allow[] entry', () => {
    const verdict = evaluateDiff(['features/foo.feature', 'CLAUDE.md'], config())
    expect(verdict).toEqual({ invariant: true })
  })

  it('is not invariant when a changed path matches no allow[] entry', () => {
    const verdict = evaluateDiff(['README.md'], config())
    expect(verdict.invariant).toBe(false)
    expect(verdict.reason).toContain('README.md')
    expect(verdict.disqualifying?.path).toBe('README.md')
  })

  it('attaches the absent[] reason when the disqualifying path was explicitly ruled unsafe', () => {
    const verdict = evaluateDiff(['src/gameOfLife.ts'], config())
    expect(verdict.invariant).toBe(false)
    expect(verdict.disqualifying?.path).toBe('src/gameOfLife.ts')
    expect(verdict.disqualifying?.absentReason).toBe("Stryker's own mutate scope; obviously moves the score.")
  })

  it('leaves absentReason undefined when the disqualifying path is not in absent[] either', () => {
    const verdict = evaluateDiff(['some/unlisted/path.ts'], config())
    expect(verdict.invariant).toBe(false)
    expect(verdict.disqualifying?.absentReason).toBeUndefined()
  })

  it('is not invariant on an empty diff, with a reason to check the range', () => {
    const verdict = evaluateDiff([], config())
    expect(verdict.invariant).toBe(false)
    expect(verdict.reason).toContain('no changed paths')
    expect(verdict.disqualifying).toBeUndefined()
  })

  it('stops at the first uncovered path rather than scanning every path', () => {
    const verdict = evaluateDiff(['features/a.feature', 'NOPE.md', 'README.md'], config())
    expect(verdict.disqualifying?.path).toBe('NOPE.md')
  })

  it('is invariant for a single changed path under a allowed directory nested more than one level deep', () => {
    const verdict = evaluateDiff(['features/steps/some-step.ts'], config())
    expect(verdict.invariant).toBe(true)
  })
})
