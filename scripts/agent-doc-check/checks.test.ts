import { describe, expect, it } from 'vitest'
import {
  checkAgentFrontmatterValid,
  checkCycleStringConsistent,
  checkNoStaleRoleReferences,
  checkNpmRunReferencesResolve,
  checkRulesNamedInClaudeMd,
} from './checks.ts'

const GOOD_FRONTMATTER = (name: string, tools = 'Read, Write, Edit, Bash, Grep, Glob, LSP', model = 'sonnet') =>
  `---\nname: ${name}\ndescription: Does things.\ntools: ${tools}\nmodel: ${model}\n---\n\nBody.\n`

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

  it('fails when there is no frontmatter block at all', () => {
    const files = [{ path: '.claude/agents/broken.md', text: 'no frontmatter\n' }]
    const failures = checkAgentFrontmatterValid(files)
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toMatch(/no frontmatter/)
  })

  it('fails when name does not match the filename stem', () => {
    const files = [{ path: '.claude/agents/coder.md', text: GOOD_FRONTMATTER('cleaner') }]
    const failures = checkAgentFrontmatterValid(files)
    expect(failures.some((f) => f.message.includes('does not match filename stem'))).toBe(true)
  })

  it('fails when description is missing', () => {
    const text = '---\nname: coder\ntools: Read\nmodel: sonnet\n---\n'
    const failures = checkAgentFrontmatterValid([{ path: '.claude/agents/coder.md', text }])
    expect(failures.some((f) => f.message.includes('description'))).toBe(true)
  })

  it('fails when tools includes a tool outside the known set', () => {
    const files = [{ path: '.claude/agents/coder.md', text: GOOD_FRONTMATTER('coder', 'Read, Sudo') }]
    const failures = checkAgentFrontmatterValid(files)
    expect(failures.some((f) => f.message.includes('Sudo'))).toBe(true)
  })

  it('fails when model is not one of opus/sonnet/haiku', () => {
    const files = [{ path: '.claude/agents/coder.md', text: GOOD_FRONTMATTER('coder', 'Read', 'gpt5') }]
    const failures = checkAgentFrontmatterValid(files)
    expect(failures.some((f) => f.message.includes('gpt5'))).toBe(true)
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
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({ check: 'no-stale-role-references', file: 'x.md' })
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
    expect(failures[0].file).toBe('c.md')
    expect(failures[0].message).toContain(reordered)
  })

  it('fails with a single, clearly-flagged failure when no cycle mention is found at all', () => {
    const docFiles = [{ path: 'a.md', text: 'nothing relevant here' }]
    const failures = checkCycleStringConsistent(docFiles, roles)
    expect(failures).toHaveLength(1)
    expect(failures[0].check).toBe('cycle-string-consistent')
  })
})

describe('checkRulesNamedInClaudeMd', () => {
  it('passes when every rule id is mentioned and every path mention resolves', () => {
    const text = 'the `no-react-in-domain` rule, see also `rules/no-dom-in-domain.yml`'
    expect(checkRulesNamedInClaudeMd(text, ['no-react-in-domain', 'no-dom-in-domain'])).toEqual([])
  })

  it('fails a real rule id never mentioned in CLAUDE.md', () => {
    const failures = checkRulesNamedInClaudeMd('nothing here', ['no-tile-policy-in-components'])
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('no-tile-policy-in-components')
  })

  it('fails a `rules/<id>.yml` path mention that names no real rule file', () => {
    const text = 'see `rules/no-longer-exists.yml`'
    const failures = checkRulesNamedInClaudeMd(text, [])
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toContain('no-longer-exists')
  })
})
