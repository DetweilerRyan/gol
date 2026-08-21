import { describe, expect, it } from 'vitest'
import {
  checkAllRules,
  checkFilesGlobsResolve,
  checkFixtureExists,
  checkFixtureHasInvalidCases,
  checkIdMatchesFilename,
  checkNoDuplicateIds,
  checkSeverityValid,
} from './checks.ts'
import type { FixtureFile } from './fixture-file.ts'
import type { RuleFile } from './rule-file.ts'

function rule(overrides: Partial<RuleFile> = {}): RuleFile {
  return {
    path: 'rules/example.yml',
    filenameStem: 'example',
    id: 'example',
    severity: 'warning',
    files: undefined,
    unresolvedFilesMarker: { present: false, reason: null },
    ...overrides,
  }
}

function fixture(overrides: Partial<FixtureFile> = {}): FixtureFile {
  return {
    path: 'rule-tests/example-test.yml',
    filenameStem: 'example-test',
    id: 'example',
    hasInvalidCases: true,
    ...overrides,
  }
}

describe('checkFixtureExists', () => {
  it('reports a rule with no fixture at rule-tests/<id>-test.yml', () => {
    const failures = checkFixtureExists(
      [rule({ id: 'orphan' })],
      [fixture({ id: 'other', filenameStem: 'other-test' })],
    )
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('fixture-exists')
    expect(failures[0].file).toBe('rules/example.yml')
  })

  it('passes when a matching fixture exists', () => {
    const failures = checkFixtureExists([rule({ id: 'x' })], [fixture({ id: 'x', filenameStem: 'x-test' })])
    expect(failures).toEqual([])
  })

  it('reports a rule with no id, since its fixture cannot be located', () => {
    const failures = checkFixtureExists([rule({ id: undefined })], [])
    expect(failures).toHaveLength(1)
  })
})

describe('checkIdMatchesFilename', () => {
  it('reports a rule whose id does not equal its filename stem', () => {
    const failures = checkIdMatchesFilename([rule({ filenameStem: 'no-dom-in-domain', id: 'no-dom-in-domian' })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('id-matches-filename')
  })

  it('passes when id equals the filename stem', () => {
    const failures = checkIdMatchesFilename([rule({ filenameStem: 'x', id: 'x' })])
    expect(failures).toEqual([])
  })
})

describe('checkNoDuplicateIds', () => {
  it('reports every rule file sharing a duplicated id', () => {
    const a = rule({ path: 'rules/a.yml', id: 'dup' })
    const b = rule({ path: 'rules/b.yml', id: 'dup' })
    const failures = checkNoDuplicateIds([a, b])
    expect(failures).toHaveLength(2)
    expect(failures.map((f) => f.file).sort()).toEqual(['rules/a.yml', 'rules/b.yml'])
    expect(failures.every((f) => f.check === 'no-duplicate-ids')).toBe(true)
  })

  it('passes when every rule has a unique id', () => {
    const failures = checkNoDuplicateIds([
      rule({ path: 'rules/a.yml', id: 'a' }),
      rule({ path: 'rules/b.yml', id: 'b' }),
    ])
    expect(failures).toEqual([])
  })
})

describe('checkSeverityValid', () => {
  it('reports a rule with a missing severity (the typoed-key case)', () => {
    const failures = checkSeverityValid([rule({ severity: undefined })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('severity-valid')
  })

  it('reports a rule with a severity value ast-grep does not recognize', () => {
    const failures = checkSeverityValid([rule({ severity: 'bogus' })])
    expect(failures).toHaveLength(1)
  })

  it('passes for every valid ast-grep severity level', () => {
    for (const severity of ['hint', 'info', 'warning', 'error', 'off']) {
      expect(checkSeverityValid([rule({ severity })])).toEqual([])
    }
  })
})

describe('checkFixtureHasInvalidCases', () => {
  it('reports a fixture with only valid: cases', () => {
    const failures = checkFixtureHasInvalidCases([fixture({ hasInvalidCases: false })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('fixture-has-invalid-cases')
  })

  it('passes for a fixture carrying at least one invalid: case', () => {
    expect(checkFixtureHasInvalidCases([fixture({ hasInvalidCases: true })])).toEqual([])
  })
})

describe('checkFilesGlobsResolve', () => {
  it('reports a files: glob that matches no file', () => {
    const failures = checkFilesGlobsResolve([rule({ files: ['src/does-not-exist-*.ts'] })], () => false)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('files-globs-resolve')
  })

  it('passes when every files: glob resolves', () => {
    const failures = checkFilesGlobsResolve([rule({ files: ['src/*.ts'] })], () => true)
    expect(failures).toEqual([])
  })

  it('passes with no files: key at all', () => {
    expect(checkFilesGlobsResolve([rule({ files: undefined })], () => false)).toEqual([])
  })

  it('suppresses the check when the marker is present with a non-empty reason', () => {
    const failures = checkFilesGlobsResolve(
      [rule({ files: ['src/does-not-exist-*.ts'], unresolvedFilesMarker: { present: true, reason: 'not built yet' } })],
      () => false,
    )
    expect(failures).toEqual([])
  })

  it('does not suppress the check when the marker has no reason, and reports the marker itself as invalid', () => {
    const failures = checkFilesGlobsResolve(
      [rule({ files: ['src/does-not-exist-*.ts'], unresolvedFilesMarker: { present: true, reason: null } })],
      () => false,
    )
    expect(failures).toHaveLength(2)
    expect(failures.some((f) => f.message.includes('no reason'))).toBe(true)
    expect(failures.some((f) => f.message.includes('matches no file'))).toBe(true)
  })
})

describe('checkAllRules', () => {
  it('combines every check, so a rule with multiple problems yields multiple failures', () => {
    const brokenRule = rule({
      path: 'rules/broken.yml',
      filenameStem: 'broken',
      id: 'different-id',
      severity: undefined,
      files: ['src/nothing-*.ts'],
    })
    const failures = checkAllRules([brokenRule], [], () => false)
    const checkNames = failures.map((f) => f.check).sort()
    expect(checkNames).toEqual(
      ['files-globs-resolve', 'fixture-exists', 'id-matches-filename', 'severity-valid'].sort(),
    )
  })

  it('reports nothing for a fully well-formed rule and fixture', () => {
    const goodRule = rule({ id: 'x', filenameStem: 'x', files: ['src/*.ts'] })
    const goodFixture = fixture({ id: 'x', filenameStem: 'x-test' })
    expect(checkAllRules([goodRule], [goodFixture], () => true)).toEqual([])
  })
})
