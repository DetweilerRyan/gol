import { describe, expect, it } from 'vitest'
import { parseAgentFrontmatter } from './agent-frontmatter.ts'

const GOOD =
  '---\nname: coder\ndescription: Does things.\ntools: Read, Write, Edit, Bash, Grep, Glob, LSP\nmodel: sonnet\n---\n\nBody text.\n'

describe('parseAgentFrontmatter', () => {
  it('reads name/description/tools/model off a well-formed block', () => {
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', GOOD)
    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.filenameStem).toBe('coder')
    expect(parsed.name).toBe('coder')
    expect(parsed.description).toBe('Does things.')
    expect(parsed.tools).toEqual(['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'LSP'])
    expect(parsed.model).toBe('sonnet')
  })

  it('reads a description containing a literal ": " without choking, unlike a real YAML parser', () => {
    const text =
      '---\nname: architect\ndescription: It has four invocation modes. REVIEW (the default, and its slot in the cycle) -- invoke after.\ntools: Read\nmodel: opus\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/architect.md', text)
    expect(parsed.description).toBe(
      'It has four invocation modes. REVIEW (the default, and its slot in the cycle) -- invoke after.',
    )
  })

  it('reports hasFrontmatter: false when there is no leading `---`-delimited block', () => {
    const parsed = parseAgentFrontmatter('.claude/agents/broken.md', 'no frontmatter here\n')
    expect(parsed.hasFrontmatter).toBe(false)
    expect(parsed.name).toBeUndefined()
  })

  it('leaves a missing field undefined rather than throwing', () => {
    const text = '---\nname: coder\ndescription: Does things.\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.tools).toBeUndefined()
    expect(parsed.model).toBeUndefined()
  })

  it('trims whitespace around each comma-separated tool', () => {
    const text = '---\nname: coder\ndescription: x\ntools: Read,  Write ,Edit\nmodel: sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.tools).toEqual(['Read', 'Write', 'Edit'])
  })
})
