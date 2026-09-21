import { describe, expect, it } from 'vitest'
import { blobIdOf, isAssessmentRecordPath, siblingRecordPathFor, storedBlobOf } from './assessment-record.ts'

// One table for both predicates: a record path is exactly the input where
// isAssessmentRecordPath is true and siblingRecordPathFor is undefined, and
// a candidate path is exactly its dual. Asserting the pair per fixture is
// what the two functions' contract actually promises -- pulling them apart
// into two it.each blocks over near-identical fixtures scored 1.00 on
// dry4ts, since the two tables differed only in which function they called.
describe('isAssessmentRecordPath and siblingRecordPathFor', () => {
  it.each([
    { name: 'the ideas-lane record form', path: 'backlog/ideas/foo.assessment.md', isRecord: true, sibling: undefined },
    {
      name: 'the promoted ready-lane record form',
      path: 'backlog/ready/foo/assessment.md',
      isRecord: true,
      sibling: undefined,
    },
    {
      name: 'the promoted done-lane record form',
      path: 'backlog/done/foo/assessment.md',
      isRecord: true,
      sibling: undefined,
    },
    {
      name: 'an absolute path carrying the record form',
      path: '/repo/backlog/ready/foo/assessment.md',
      isRecord: true,
      sibling: undefined,
    },
    {
      name: 'a flat idea file',
      path: 'backlog/ideas/foo.md',
      isRecord: false,
      sibling: 'backlog/ideas/foo.assessment.md',
    },
    {
      name: 'a ready-lane proposal',
      path: 'backlog/ready/foo/proposal.md',
      isRecord: false,
      sibling: 'backlog/ready/foo/assessment.md',
    },
    {
      name: 'a done-lane proposal',
      path: 'backlog/done/foo/proposal.md',
      isRecord: false,
      sibling: 'backlog/done/foo/assessment.md',
    },
    {
      name: 'an absolute path prefix that precedes backlog/, preserved on the sibling',
      path: '/repo/backlog/ideas/foo.md',
      isRecord: false,
      sibling: '/repo/backlog/ideas/foo.assessment.md',
    },
    {
      name: 'a per-item artifact that is neither a record nor a candidate',
      path: 'backlog/ready/foo/design.md',
      isRecord: false,
      sibling: undefined,
    },
    { name: 'an off-board path', path: 'src/camera.ts', isRecord: false, sibling: undefined },
  ])('$name', ({ path, isRecord, sibling }) => {
    expect(isAssessmentRecordPath(path)).toBe(isRecord)
    expect(siblingRecordPathFor(path)).toBe(sibling)
  })
})

describe('storedBlobOf', () => {
  const frontmatter = (line: string) => ['---', 'name: foo', line, '---', ''].join('\n')

  it.each([
    { name: 'reads a well-formed idea-blob value', text: frontmatter('idea-blob: abc123'), expected: 'abc123' },
    {
      name: 'returns undefined when the field is missing entirely',
      text: frontmatter('assessed: 2026-09-20'),
      expected: undefined,
    },
    { name: 'returns undefined when the value is empty', text: frontmatter('idea-blob:'), expected: undefined },
    {
      name: 'returns undefined when the value is only whitespace',
      text: frontmatter('idea-blob:   '),
      expected: undefined,
    },
    { name: 'returns undefined for text with no frontmatter at all', text: 'just some prose\n', expected: undefined },
  ])('$name', ({ text, expected }) => {
    expect(storedBlobOf(text)).toBe(expected)
  })
})

describe('blobIdOf', () => {
  // Pinned against `git hash-object`, never recomputed here -- see the
  // module's own doc comment on blobIdOf for the algorithm this literal
  // proves.
  it.each([
    {
      name: 'matches git hash-object for an empty blob',
      text: '',
      expected: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
    },
    {
      name: 'matches git hash-object for an ASCII blob',
      text: 'hello\n',
      expected: 'ce013625030ba8dba906f756967f9e9ca394464a',
    },
    {
      name: 'matches git hash-object for a multi-byte blob, proving byte length rather than character length',
      text: 'héllo\n',
      expected: '5fb50d3c93474f139362304b663fe44e9d17a26e',
    },
  ])('$name', ({ text, expected }) => {
    expect(blobIdOf(new TextEncoder().encode(text))).toBe(expected)
  })

  it('distinguishes the multi-byte fixture from its own character length', () => {
    const bytes = new TextEncoder().encode('héllo\n')
    expect(bytes.byteLength).toBe(7)
    expect('héllo\n'.length).toBe(6)
  })
})
