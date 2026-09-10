import { describe, expect, it } from 'vitest'
import {
  checkAll,
  checkAllowAbsentDisjoint,
  checkMentionedInRationale,
  checkNoDuplicatePaths,
  checkNonEmptyInputs,
  checkStrykerIgnoreCoverage,
  checkVitestExcludeCoverage,
  checkWrittenArgumentTracked,
  type CheckInput,
  type VitestProject,
} from './checks.ts'
import type { AllowEntry, MutationInvarianceConfig } from './config-file.ts'

function config(overrides: Partial<MutationInvarianceConfig> = {}): MutationInvarianceConfig {
  return { scope: 'npm run test:mutation', allow: [], absent: [], ...overrides }
}

function allowEntry(overrides: Partial<AllowEntry> = {}): AllowEntry {
  return { path: 'features/**', securedBy: 'stryker-ignore-patterns', ...overrides }
}

function input(overrides: Partial<CheckInput> = {}): CheckInput {
  return {
    config: config({ allow: [allowEntry({ path: 'features/**' })] }),
    vitestProjects: [{ name: 'unit', exclude: ['features/**'] }],
    strykerIgnorePatterns: ['/features'],
    trackedFiles: new Set(['CLAUDE.md']),
    rationaleText: 'features/** CLAUDE.md',
    ...overrides,
  }
}

describe('checkVitestExcludeCoverage (C1)', () => {
  it('passes when every vitest project excludes the directory', () => {
    const cfg = config({ allow: [allowEntry({ path: 'ideas/**', securedBy: 'vitest-exclude' })] })
    const projects: VitestProject[] = [
      { name: 'unit', exclude: ['ideas/**'] },
      { name: 'dom', exclude: ['ideas/**'] },
    ]
    expect(checkVitestExcludeCoverage(cfg, projects)).toEqual([])
  })

  it('names the specific project missing coverage', () => {
    const cfg = config({ allow: [allowEntry({ path: 'ideas/**', securedBy: 'vitest-exclude' })] })
    const projects: VitestProject[] = [
      { name: 'unit', exclude: ['ideas/**'] },
      { name: 'dom', exclude: [] },
    ]
    const failures = checkVitestExcludeCoverage(cfg, projects)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('vitest-exclude-covers')
    expect(failures[0].message).toContain('"dom"')
  })

  it('fails a vitest-exclude entry that does not use the dir/** form', () => {
    const cfg = config({ allow: [allowEntry({ path: 'ideas', securedBy: 'vitest-exclude' })] })
    const failures = checkVitestExcludeCoverage(cfg, [{ name: 'unit', exclude: ['ideas/**'] }])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('vitest-exclude-covers')
    expect(failures[0].message).toContain('dir/**')
  })

  it('ignores allow entries secured by a different tier', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**', securedBy: 'stryker-ignore-patterns' })] })
    expect(checkVitestExcludeCoverage(cfg, [])).toEqual([])
  })
})

describe('checkStrykerIgnoreCoverage (C2)', () => {
  it('passes when ignorePatterns covers the directory', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })] })
    expect(checkStrykerIgnoreCoverage(cfg, ['/features'])).toEqual([])
  })

  it('fails a directory a later negation re-includes (last-wins)', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })] })
    const failures = checkStrykerIgnoreCoverage(cfg, ['/features', '!/features'])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('stryker-ignore-covers')
    expect(failures[0].message).toContain('negation')
  })

  it('passes when a negation is later re-covered by a third pattern', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })] })
    expect(checkStrykerIgnoreCoverage(cfg, ['/features', '!/features', '/features'])).toEqual([])
  })

  // Pins isIgnoredByStrykerPatterns' walk itself: a non-covering pattern
  // must be skipped (`if (!covers) continue`) rather than setting `ignored`
  // from its own `negated` flag, and the walk's initial `ignored` must start
  // false -- both only diverge when no pattern in the list ever covers the
  // directory, which every other C2 fixture here happens not to exercise.
  it('fails when no ignorePatterns entry mentions the directory at all', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })] })
    const failures = checkStrykerIgnoreCoverage(cfg, ['/unrelated'])
    expect(failures).toHaveLength(1)
  })

  it('fails a stryker-ignore-patterns entry that does not use the dir/** form', () => {
    const failures = checkStrykerIgnoreCoverage(config({ allow: [allowEntry({ path: 'features' })] }), ['/features'])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('stryker-ignore-covers')
    expect(failures[0].message).toContain('dir/**')
  })
})

describe('checkWrittenArgumentTracked (C3)', () => {
  it('passes when the path is a tracked file', () => {
    const cfg = config({
      allow: [
        allowEntry({ path: 'CLAUDE.md', securedBy: 'written-argument', argument: 'x', verifiedOn: '2026-09-08' }),
      ],
    })
    expect(checkWrittenArgumentTracked(cfg, new Set(['CLAUDE.md']))).toEqual([])
  })

  it('fails when the path is not tracked', () => {
    const cfg = config({
      allow: [
        allowEntry({ path: 'MISSING.md', securedBy: 'written-argument', argument: 'x', verifiedOn: '2026-09-08' }),
      ],
    })
    const failures = checkWrittenArgumentTracked(cfg, new Set(['CLAUDE.md']))
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('written-argument-tracked')
    expect(failures[0].file).toBe('MISSING.md')
    expect(failures[0].message).toBe('MISSING.md is not a tracked file')
  })
})

describe('checkMentionedInRationale (C4)', () => {
  it('passes when every allow and absent path appears verbatim', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })], absent: [{ path: 'src/**', reason: 'x' }] })
    const failures = checkMentionedInRationale(cfg, 'features/** and src/** are both discussed')
    expect(failures).toHaveLength(0)
  })

  it('fails a path missing from the rationale text', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })] })
    const failures = checkMentionedInRationale(cfg, 'no mention here')
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('mentioned-in-rationale')
    expect(failures[0].file).toBe('features/**')
    expect(failures[0].message).toBe('features/** does not appear verbatim in the rationale text')
  })

  it('checks absent paths too, independently of allow', () => {
    const cfg = config({ absent: [{ path: 'src/**', reason: 'x' }] })
    const failures = checkMentionedInRationale(cfg, 'nothing here')
    expect(failures).toHaveLength(1)
    expect(failures[0].file).toBe('src/**')
  })
})

describe('checkNoDuplicatePaths (C5)', () => {
  it('passes on a config with no duplicates in either list', () => {
    const cfg = config({
      allow: [allowEntry({ path: 'features/**' }), allowEntry({ path: 'ideas/**' })],
      absent: [
        { path: 'src/**', reason: 'a' },
        { path: 'rules/**', reason: 'b' },
      ],
    })
    expect(checkNoDuplicatePaths(cfg)).toEqual([])
  })

  it('fails a duplicate allow path', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' }), allowEntry({ path: 'features/**' })] })
    const failures = checkNoDuplicatePaths(cfg)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('no-duplicate-paths')
    expect(failures[0].message).toContain('allow[]')
  })

  it('fails a duplicate absent path, independently of allow', () => {
    const cfg = config({
      absent: [
        { path: 'src/**', reason: 'a' },
        { path: 'src/**', reason: 'b' },
      ],
    })
    const failures = checkNoDuplicatePaths(cfg)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('no-duplicate-paths')
    expect(failures[0].message).toContain('absent[]')
  })

  it('does not cross-report an allow path duplicated in absent (that is C6, not C5)', () => {
    expect(
      checkNoDuplicatePaths(config({ allow: [allowEntry({ path: 'x' })], absent: [{ path: 'x', reason: 'r' }] })),
    ).toEqual([])
  })
})

describe('checkAllowAbsentDisjoint (C6)', () => {
  it('passes when allow and absent share no path', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })], absent: [{ path: 'src/**', reason: 'x' }] })
    expect(checkAllowAbsentDisjoint(cfg)).toEqual([])
  })

  it('fails a path appearing in both allow and absent verbatim', () => {
    const cfg = config({ allow: [allowEntry({ path: 'features/**' })], absent: [{ path: 'features/**', reason: 'x' }] })
    const failures = checkAllowAbsentDisjoint(cfg)
    const matched = failures.find((failure) => failure.message.includes('both allow[] and absent[]'))
    expect(matched?.check).toBe('allow-absent-disjoint')
  })

  it('fails an absent path nested inside an allowed directory', () => {
    const cfg = config({
      allow: [allowEntry({ path: 'src/**', securedBy: 'vitest-exclude' })],
      absent: [{ path: 'src/index.ts', reason: 'x' }],
    })
    const failures = checkAllowAbsentDisjoint(cfg)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('allow-absent-disjoint')
    expect(failures[0].message).toContain('src/**')
  })
})

describe('checkNonEmptyInputs (C7)', () => {
  it('passes when allow, vitestProjects and trackedFiles are all non-empty', () => {
    expect(checkNonEmptyInputs(input())).toEqual([])
  })

  it('fails on an empty allow[]', () => {
    const failures = checkNonEmptyInputs(input({ config: config({ allow: [] }) }))
    expect(failures).toEqual([{ check: 'allow-non-empty', file: '(none)', message: 'allow[] is empty' }])
  })

  it('fails on empty vitestProjects -- otherwise C1 would pass vacuously', () => {
    const failures = checkNonEmptyInputs(input({ vitestProjects: [] }))
    expect(failures).toEqual([
      {
        check: 'vitest-projects-non-empty',
        file: '(none)',
        message: 'no vitest projects were provided -- C1 would pass vacuously',
      },
    ])
  })

  it('fails on empty trackedFiles -- otherwise C3 would pass vacuously', () => {
    const failures = checkNonEmptyInputs(input({ trackedFiles: new Set() }))
    expect(failures).toEqual([
      {
        check: 'tracked-files-non-empty',
        file: '(none)',
        message: 'no tracked files were provided -- C3 would pass vacuously',
      },
    ])
  })
})

describe('checkAll', () => {
  it('is clean for a config that passes every check', () => {
    const cfg = config({
      allow: [allowEntry({ path: 'features/**' })],
      absent: [{ path: 'src/**', reason: 'x' }],
    })
    const failures = checkAll(
      input({ config: cfg, rationaleText: 'features/** and src/** are both discussed in the merge protocol' }),
    )
    expect(failures).toEqual([])
  })

  it('aggregates failures across more than one check', () => {
    const cfg = config({ allow: [] })
    const failures = checkAll(input({ config: cfg, vitestProjects: [], trackedFiles: new Set() }))
    const checkNames = new Set(failures.map((failure) => failure.check))
    expect(checkNames.has('allow-non-empty')).toBe(true)
    expect(checkNames.has('vitest-projects-non-empty')).toBe(true)
    expect(checkNames.has('tracked-files-non-empty')).toBe(true)
  })
})
