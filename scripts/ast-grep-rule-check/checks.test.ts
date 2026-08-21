import { describe, expect, it } from 'vitest'
import {
  checkAllRules,
  checkAnyRulesFound,
  checkFilesGlobsResolve,
  checkFixtureExists,
  checkFixtureHasInvalidCases,
  checkFixtureIdMatchesFilename,
  checkIdMatchesFilename,
  checkNoDuplicateIds,
  checkSeverityValid,
  checkStaleOptOuts,
  type GlobHasMatch,
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
    expect(failures[0].message).toContain('rule-tests/orphan-test.yml')
  })

  it('passes when a matching fixture exists', () => {
    const failures = checkFixtureExists([rule({ id: 'x' })], [fixture({ id: 'x', filenameStem: 'x-test' })])
    expect(failures).toEqual([])
  })

  it('reports a rule with no id, since its fixture cannot be located', () => {
    const failures = checkFixtureExists([rule({ id: undefined })], [])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('fixture-exists')
    expect(failures[0].message).toContain('cannot be located')
  })
})

describe('checkIdMatchesFilename', () => {
  // Both mismatch cases assert the same three things about the one failure
  // they produce, so they're one table rather than two near-identical blocks:
  // a typoed id is reported verbatim, and an absent one as '(missing)' rather
  // than as the literal undefined.
  it.each([
    { mismatch: 'an id that does not equal its filename stem', id: 'no-dom-in-domian', shownAs: 'no-dom-in-domian' },
    { mismatch: 'a missing id', id: undefined, shownAs: '(missing)' },
  ])('reports $mismatch, naming it as `$shownAs`', ({ id, shownAs }) => {
    const failures = checkIdMatchesFilename([rule({ filenameStem: 'no-dom-in-domain', id })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('id-matches-filename')
    expect(failures[0].message).toContain(shownAs)
    expect(failures[0].message).toContain('no-dom-in-domain')
  })

  it('passes when id equals the filename stem', () => {
    const failures = checkIdMatchesFilename([rule({ filenameStem: 'x', id: 'x' })])
    expect(failures).toEqual([])
  })
})

describe('checkNoDuplicateIds', () => {
  it('reports every rule file sharing a duplicated id, naming only the *other* files in its message', () => {
    const a = rule({ path: 'rules/a.yml', id: 'dup' })
    const b = rule({ path: 'rules/b.yml', id: 'dup' })
    const c = rule({ path: 'rules/c.yml', id: 'dup' })
    const failures = checkNoDuplicateIds([a, b, c])
    expect(failures).toHaveLength(3)
    expect(failures.map((f) => f.file).sort()).toEqual(['rules/a.yml', 'rules/b.yml', 'rules/c.yml'])
    expect(failures.every((f) => f.check === 'no-duplicate-ids')).toBe(true)

    const failureForA = failures.find((f) => f.file === 'rules/a.yml')
    // Names the two *other* files, comma-separated -- and never itself.
    expect(failureForA?.message).toContain('rules/b.yml, rules/c.yml')
    expect(failureForA?.message).not.toContain('rules/a.yml')
  })

  it('reports a duplicate at exactly two files sharing an id (the boundary of "duplicate")', () => {
    const failures = checkNoDuplicateIds([
      rule({ path: 'rules/a.yml', id: 'dup' }),
      rule({ path: 'rules/b.yml', id: 'dup' }),
    ])
    expect(failures).toHaveLength(2)
  })

  // The two passing cases are the same two-rule call with different ids, so
  // they're one table. The id-less pair matters because an id-less rule is
  // already reported by checkFixtureExists -- grouping such rules together
  // here would pile on a second, spurious "duplicate id" failure.
  it.each<{ ids: string; first: string | undefined; second: string | undefined }>([
    { ids: 'unique', first: 'a', second: 'b' },
    { ids: 'both absent', first: undefined, second: undefined },
  ])('passes when the ids are $ids', ({ first, second }) => {
    const failures = checkNoDuplicateIds([
      rule({ path: 'rules/a.yml', id: first }),
      rule({ path: 'rules/b.yml', id: second }),
    ])
    expect(failures).toEqual([])
  })
})

describe('checkSeverityValid', () => {
  it('reports a rule with a missing severity (the typoed-key case)', () => {
    const failures = checkSeverityValid([rule({ severity: undefined })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('severity-valid')
    // "missing" distinguishes this from the bogus-value message below --
    // both would otherwise leave `failures` at the same length.
    expect(failures[0].message).toContain('missing')
  })

  it('reports a rule with a severity value ast-grep does not recognize', () => {
    const failures = checkSeverityValid([rule({ severity: 'bogus' })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('severity-valid')
    expect(failures[0].message).toContain('bogus')
    expect(failures[0].message).toContain('hint, info, warning, error, off')
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
    expect(failures[0].message).not.toBe('')
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
    expect(failures.every((f) => f.check === 'files-globs-resolve')).toBe(true)
    expect(failures.some((f) => f.message.includes('no reason'))).toBe(true)
    expect(failures.some((f) => f.message.includes('matches no file'))).toBe(true)
  })
})

describe('checkFixtureIdMatchesFilename', () => {
  it("reports a fixture whose id names another rule -- ast-grep binds by id, not filename, so that rule's fixture is untested", () => {
    const failures = checkFixtureIdMatchesFilename([fixture({ filenameStem: 'no-bar-test', id: 'no-foo' })])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('fixture-id-matches-filename')
    expect(failures[0].message).toContain('no-bar')
    expect(failures[0].message).toContain('no-foo')
    expect(failures[0].message).toContain('untested')
  })

  it('reports a fixture whose id names no rule at all', () => {
    const failures = checkFixtureIdMatchesFilename([fixture({ filenameStem: 'orphan-test', id: 'no-such-rule' })])
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('orphan')
    expect(failures[0].message).toContain('no-such-rule')
  })

  it('reports a fixture with no id at all, naming it as (missing)', () => {
    const failures = checkFixtureIdMatchesFilename([fixture({ filenameStem: 'orphan-test', id: undefined })])
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('(missing)')
  })

  it('passes when the id names exactly the rule the filename claims to test', () => {
    const failures = checkFixtureIdMatchesFilename([fixture({ filenameStem: 'no-foo-test', id: 'no-foo' })])
    expect(failures).toEqual([])
  })

  it('anchors the -test suffix strip to the end of the filename, not the first occurrence anywhere in it', () => {
    // 'no-test-thing' does not *end* in '-test', so the anchored regex leaves
    // it untouched and expectedId stays 'no-test-thing'. An unanchored strip
    // would instead delete the first '-test' it finds mid-string, producing
    // expectedId 'no-thing' and reporting a spurious mismatch here.
    const failures = checkFixtureIdMatchesFilename([fixture({ filenameStem: 'no-test-thing', id: 'no-test-thing' })])
    expect(failures).toEqual([])
  })
})

describe('checkAnyRulesFound', () => {
  it('reports when zero rules were found -- an empty rules dir would otherwise report "no failures" and exit 0', () => {
    const failures = checkAnyRulesFound([])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('rules-found')
    expect(failures[0].file).toBe('(none)')
  })

  it('passes when at least one rule was found', () => {
    expect(checkAnyRulesFound([rule()])).toEqual([])
  })
})

describe('checkStaleOptOuts', () => {
  it('reports a marker with a reason once every files: glob it excuses now resolves', () => {
    const failures = checkStaleOptOuts(
      [rule({ files: ['src/App.tsx'], unresolvedFilesMarker: { present: true, reason: 'not built yet' } })],
      () => true,
    )
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('stale-allow-unresolved-files')
    expect(failures[0].message).toContain('not built yet')
  })

  // One table for every negative-space combination -- each row's `files`/
  // `marker`/`globHasMatch` pins down one way the guard must stay silent, and
  // two rows exist specifically to distinguish real mutants: 'no reason' kills
  // a `||` -> `&&` mutant (with `||`, a present-but-reason-less marker already
  // short-circuits to "not stale" without even looking at files:), and 'only
  // some resolve' kills a `.every` -> `.some` mutant (one resolving glob
  // alongside one unresolved one must not count as "every glob resolves").
  it.each<{
    scenario: string
    files: string[] | undefined
    marker: RuleFile['unresolvedFilesMarker']
    globHasMatch: GlobHasMatch
  }>([
    {
      scenario: 'at least one glob still fails to resolve',
      files: ['src/App.tsx'],
      marker: { present: true, reason: 'not built yet' },
      globHasMatch: () => false,
    },
    {
      scenario: 'there is no marker at all, even though every glob resolves',
      files: ['src/App.tsx'],
      marker: { present: false, reason: null },
      globHasMatch: () => true,
    },
    {
      scenario: 'the rule has no files: glob to have excused in the first place',
      files: undefined,
      marker: { present: true, reason: 'not built yet' },
      globHasMatch: () => true,
    },
    {
      scenario: 'the marker is present but reason-less, even with a resolving glob',
      files: ['src/App.tsx'],
      marker: { present: true, reason: null },
      globHasMatch: () => true,
    },
    {
      scenario: 'only some of its files: globs resolve, not all',
      files: ['src/resolved.ts', 'src/unresolved.ts'],
      marker: { present: true, reason: 'not built yet' },
      globHasMatch: (pattern) => pattern === 'src/resolved.ts',
    },
  ])('does not report a marker when $scenario', ({ files, marker, globHasMatch }) => {
    const failures = checkStaleOptOuts([rule({ files, unresolvedFilesMarker: marker })], globHasMatch)
    expect(failures).toEqual([])
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

  it('reports checkAnyRulesFound when the rule list is empty', () => {
    const checkNames = checkAllRules([], [], () => true).map((f) => f.check)
    expect(checkNames).toEqual(['rules-found'])
  })
})
