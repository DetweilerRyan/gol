import { describe, expect, it } from 'vitest'
import { findStaleRoleReferences, RETIRED_ROLES } from './roles.ts'

describe('RETIRED_ROLES', () => {
  it('is exactly the three roles git history shows were ever deleted from .claude/agents/ (excluding articles/)', () => {
    // `git log --all --diff-filter=D --name-only -- '.claude/agents/*.md'`
    // names exactly these three -- see roles.ts's module comment.
    expect(RETIRED_ROLES).toEqual(['qa', 'refactorer', 'specifier'])
  })
})

describe('findStaleRoleReferences', () => {
  it('finds a backticked retired-role mention with no historical qualifier on the same line', () => {
    const found = findStaleRoleReferences('Invoke `qa` to run the tests.')
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ role: 'qa', line: 1 })
  })

  it('does not flag a retired-role mention qualified by "old" on the same line', () => {
    expect(findStaleRoleReferences('This ownership moved here from the old `qa` role.')).toEqual([])
  })

  it('does not flag a retired-role mention qualified by "then" on the same line', () => {
    expect(findStaleRoleReferences('the verification role (then `qa`, now `product`) found it')).toEqual([])
  })

  it('does not flag a retired-role mention qualified by "merge" on the same line', () => {
    expect(findStaleRoleReferences('(The `specifier`+`qa` -> `product` merge, directed by the user.)')).toEqual([])
  })

  it('does not flag a current role name at all', () => {
    expect(findStaleRoleReferences('Invoke `coder` next.')).toEqual([])
  })

  it('reports the 1-based line number of a multi-line passage', () => {
    const text = 'line one\nline two\nInvoke `refactorer` here.\n'
    const found = findStaleRoleReferences(text)
    expect(found).toEqual([{ role: 'refactorer', line: 3, lineText: 'Invoke `refactorer` here.' }])
  })

  it('finds every stale reference on a line with more than one', () => {
    const found = findStaleRoleReferences('Invoke `qa` before `specifier` runs.')
    expect(found.map((reference) => reference.role)).toEqual(['qa', 'specifier'])
  })
})
