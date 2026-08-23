import { describe, expect, it } from 'vitest'
import { filenameStemOf, parseAgentFrontmatter } from './agent-frontmatter.ts'

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

  it('ignores a blank line inside the frontmatter block rather than treating it as a field', () => {
    const text = '---\nname: coder\n\ndescription: Does things.\ntools: Read\nmodel: sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.name).toBe('coder')
    expect(parsed.description).toBe('Does things.')
  })

  it('requires the `---` block to open at the very start of the file, not merely appear somewhere in it', () => {
    const text = 'some preamble line\n---\nname: coder\ndescription: x\ntools: Read\nmodel: sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.hasFrontmatter).toBe(false)
  })

  it('reads a field with no space after the colon', () => {
    const text = '---\nname:coder\ndescription: x\ntools: Read\nmodel:sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.name).toBe('coder')
    expect(parsed.model).toBe('sonnet')
  })

  it('does not read an indented line as a field -- every field starts at column 0', () => {
    const text = '---\n  name: coder\ndescription: x\ntools: Read\nmodel: sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.name).toBeUndefined()
  })

  it('does not parse a CRLF-terminated field line -- this repo writes LF only', () => {
    // See the module comment: the trailing `\r` a CRLF line leaves behind
    // stops the field regex's `$` from ever reaching end-of-line, so the
    // field is silently skipped rather than misread. The block delimiters
    // stay LF-only here (block parsing splits only on `\n`, so a `\r` right
    // before one of them would break the block match itself, which is a
    // different failure than the one this test pins down) -- only the
    // `name` field's own line carries a stray trailing `\r`.
    const text = '---\nname: coder\r\ndescription: x\ntools: Read\nmodel: sonnet\n---\n'
    const parsed = parseAgentFrontmatter('.claude/agents/coder.md', text)
    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.name).toBeUndefined()
    expect(parsed.description).toBe('x')
  })
})

describe('filenameStemOf', () => {
  it('strips a trailing .md extension', () => {
    expect(filenameStemOf('.claude/agents/coder.md')).toBe('coder')
  })

  it('only strips .md at the very end, not a `.md` substring anywhere earlier', () => {
    // A real .mdx file would otherwise lose its trailing "x" to a
    // non-anchored `.md` match.
    expect(filenameStemOf('.claude/agents/coder.mdx')).toBe('coder.mdx')
  })
})
