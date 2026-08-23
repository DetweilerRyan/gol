import { describe, expect, it } from 'vitest'
import {
  checkAgentFrontmatterValid,
  checkCycleStringConsistent,
  checkNoStaleRoleReferences,
  checkNpmRunReferencesResolve,
  checkRulesNamedInClaudeMd,
  type Failure,
} from './checks.ts'

const GOOD_FRONTMATTER = (name: string, tools = 'Read, Write, Edit, Bash, Grep, Glob, LSP', model = 'sonnet') =>
  `---\nname: ${name}\ndescription: Does things.\ntools: ${tools}\nmodel: ${model}\n---\n\nBody.\n`

// The "exactly one failure, shaped like this" assertion recurs across
// several checks below -- named here rather than repeated inline so two
// single-failure assertions for unrelated checks don't read as duplicate
// blocks to dry4ts (or to a reader) just because Failure has few fields.
function expectSingleFailure(failures: Failure[], expected: { check: string; file: string; messageIncludes: string }) {
  expect(failures).toHaveLength(1)
  expect(failures[0]).toMatchObject({ check: expected.check, file: expected.file })
  expect(failures[0].message).toContain(expected.messageIncludes)
}

describe('checkNpmRunReferencesResolve', () => {
  it('passes when every reference resolves', () => {
    const docFiles = [{ path: 'CLAUDE.md', text: '`npm run build` and `npm run test:unit`' }]
    expect(checkNpmRunReferencesResolve(docFiles, new Set(['build', 'test:unit']))).toEqual([])
  })

  it('fails once per (file, script) pair for an unresolved reference, not once per occurrence', () => {
    const docFiles = [{ path: 'CLAUDE.md', text: '`npm run typo` then `npm run typo` again' }]
    const failures = checkNpmRunReferencesResolve(docFiles, new Set(['build']))
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({ check: 'npm-run-references-resolve', file: 'CLAUDE.md' })
    expect(failures[0].message).toContain('npm run typo')
  })

  it('checks each doc file independently', () => {
    const docFiles = [
      { path: 'a.md', text: '`npm run build`' },
      { path: 'b.md', text: '`npm run typo`' },
    ]
    const failures = checkNpmRunReferencesResolve(docFiles, new Set(['build']))
    expect(failures).toHaveLength(1)
    expect(failures[0].file).toBe('b.md')
  })
})

describe('checkAgentFrontmatterValid', () => {
  it('passes a well-formed agent file', () => {
    const files = [{ path: '.claude/agents/coder.md', text: GOOD_FRONTMATTER('coder') }]
    expect(checkAgentFrontmatterValid(files)).toEqual([])
  })

  // Each row leaves every field but the one under test valid (via
  // GOOD_FRONTMATTER's defaults), so each produces exactly one failure --
  // this is one table rather than ten near-identical blocks, each of which
  // was only "construct a file, call the check, assert the message
  // contains X." Mirrors ast-grep-rule-check/checks.test.ts's it.each use
  // for the same reason.
  it.each([
    { name: 'no frontmatter block at all', text: 'no frontmatter\n', includes: ['no frontmatter'] },
    {
      name: 'name does not match the filename stem',
      text: GOOD_FRONTMATTER('cleaner'),
      includes: ['does not match filename stem'],
    },
    {
      name: 'name missing entirely, not just wrong',
      text: '---\ndescription: Does things.\ntools: Read\nmodel: sonnet\n---\n',
      includes: ['`(missing)` does not match'],
    },
    {
      name: 'description missing',
      text: '---\nname: coder\ntools: Read\nmodel: sonnet\n---\n',
      includes: ['description'],
    },
    {
      name: 'description present but whitespace-only',
      text: GOOD_FRONTMATTER('coder').replace('Does things.', '   '),
      includes: ['no non-empty `description`'],
    },
    { name: 'tools present but empty', text: GOOD_FRONTMATTER('coder', ''), includes: ['no `tools` list'] },
    {
      name: 'tools includes tool(s) outside the known set, comma-separated in the message',
      text: GOOD_FRONTMATTER('coder', 'Read, Sudo, Eval'),
      includes: ['Sudo, Eval', 'known tools are Read, Write, Edit, Bash, Grep, Glob, LSP'],
    },
    {
      name: 'model is not one of opus/sonnet/haiku',
      text: GOOD_FRONTMATTER('coder', 'Read', 'gpt5'),
      includes: ['gpt5', 'is not one of: opus, sonnet, haiku'],
    },
    {
      name: 'model missing entirely, not just invalid',
      text: '---\nname: coder\ndescription: Does things.\ntools: Read\n---\n',
      includes: ['`(missing)` is not one of'],
    },
  ])('fails when $name', ({ text, includes }) => {
    const failures = checkAgentFrontmatterValid([{ path: '.claude/agents/coder.md', text }])
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('agent-frontmatter-valid')
    for (const substring of includes) expect(failures[0].message).toContain(substring)
  })

  it.each(['opus', 'sonnet', 'haiku'])('passes model %s as a known model', (model) => {
    const files = [{ path: '.claude/agents/coder.md', text: GOOD_FRONTMATTER('coder', 'Read', model) }]
    expect(checkAgentFrontmatterValid(files)).toEqual([])
  })
})

describe('checkNoStaleRoleReferences', () => {
  it('passes clean, qualified historical prose', () => {
    const docFiles = [{ path: 'x.md', text: 'moved here from the old `qa` role' }]
    expect(checkNoStaleRoleReferences(docFiles)).toEqual([])
  })

  it('fails an unqualified retired-role mention, naming the file', () => {
    const docFiles = [{ path: 'x.md', text: 'Invoke `qa` to run the tests.' }]
    const failures = checkNoStaleRoleReferences(docFiles)
    expectSingleFailure(failures, { check: 'no-stale-role-references', file: 'x.md', messageIncludes: '`qa`' })
  })
})

describe('checkCycleStringConsistent', () => {
  const roles = new Set(['product', 'coder', 'cleaner', 'architect', 'hardener'])
  const canonical = 'product → coder → cleaner → architect → hardener → product'

  it('passes when every mention is byte-identical', () => {
    const docFiles = [
      { path: 'a.md', text: canonical },
      { path: 'b.md', text: `see: ${canonical} here` },
    ]
    expect(checkCycleStringConsistent(docFiles, roles)).toEqual([])
  })

  it('fails the divergent mention(s), not the majority form', () => {
    // Reordered rather than a different arrow glyph, so it still matches
    // findCycleMentions and the divergence is genuinely in the check's own
    // byte-identical comparison, not in cycle-mention detection upstream.
    const reordered = 'coder → product → cleaner → architect → hardener → product'
    const docFiles = [
      { path: 'a.md', text: canonical },
      { path: 'b.md', text: canonical },
      { path: 'c.md', text: reordered },
    ]
    const failures = checkCycleStringConsistent(docFiles, roles)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('cycle-string-consistent')
    expect(failures[0].file).toBe('c.md')
    expect(failures[0].message).toContain(reordered)
  })

  it('picks the true majority by count, not whichever form was inserted first', () => {
    // The minority form is seen before the majority form ever appears, and
    // the majority form is repeated enough times that only an actual
    // descending sort by count -- not map insertion order -- picks it as
    // canonical. This is what pins down the sort in checkCycleStringConsistent
    // itself, as distinct from findCycleMentions above.
    const reordered = 'coder → product → cleaner → architect → hardener → product'
    const docFiles = [
      { path: 'x.md', text: reordered },
      { path: 'a.md', text: canonical },
      { path: 'b.md', text: canonical },
      { path: 'c.md', text: canonical },
    ]
    const failures = checkCycleStringConsistent(docFiles, roles)
    expect(failures).toHaveLength(1)
    expect(failures[0].file).toBe('x.md')
    expect(failures[0].message).toContain(reordered)
    expect(failures[0].message).toContain(canonical)
  })

  it('fails with a single, clearly-flagged failure when no cycle mention is found at all', () => {
    const docFiles = [{ path: 'a.md', text: 'nothing relevant here' }]
    const failures = checkCycleStringConsistent(docFiles, roles)
    expectSingleFailure(failures, {
      check: 'cycle-string-consistent',
      file: '(none)',
      messageIncludes: 'no cycle-shaped string',
    })
  })
})

describe('checkRulesNamedInClaudeMd', () => {
  it('passes when every rule id is mentioned and every path mention resolves', () => {
    const text = 'the `no-react-in-domain` rule, see also `rules/no-dom-in-domain.yml`'
    expect(checkRulesNamedInClaudeMd(text, ['no-react-in-domain', 'no-dom-in-domain'])).toEqual([])
  })

  it('fails a real rule id never mentioned in CLAUDE.md', () => {
    const failures = checkRulesNamedInClaudeMd('nothing here', ['no-tile-policy-in-components'])
    expectSingleFailure(failures, {
      check: 'rules-named-in-claude-md',
      file: 'CLAUDE.md',
      messageIncludes: 'no-tile-policy-in-components',
    })
  })

  it('fails a `rules/<id>.yml` path mention that names no real rule file', () => {
    const text = 'see `rules/no-longer-exists.yml`'
    const failures = checkRulesNamedInClaudeMd(text, [])
    expectSingleFailure(failures, {
      check: 'rules-named-in-claude-md',
      file: 'CLAUDE.md',
      messageIncludes: 'no-longer-exists',
    })
  })
})
