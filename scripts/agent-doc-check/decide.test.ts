import { describe, expect, it } from 'vitest'
import { decide } from './decide.ts'

const GOOD_AGENT = (name: string) =>
  `---\nname: ${name}\ndescription: Does things.\ntools: Read, Write, Edit, Bash, Grep, Glob, LSP\nmodel: sonnet\n---\n\nBody.\n`

const CYCLE = 'product → coder → cleaner → architect → hardener → product'
const ROLES = ['product', 'coder', 'cleaner', 'architect', 'hardener']

function baseInput() {
  const claudeMdText = `\`npm run build\`\n${CYCLE}\nthe \`no-foo\` rule (\`rules/no-foo.yml\`)`
  return {
    docFiles: [
      { path: 'CLAUDE.md', text: claudeMdText },
      ...ROLES.map((role) => ({ path: `.claude/agents/${role}.md`, text: `${GOOD_AGENT(role)}\n${CYCLE}\n` })),
    ],
    agentFiles: ROLES.map((role) => ({ path: `.claude/agents/${role}.md`, text: GOOD_AGENT(role) })),
    claudeMdText,
    packageScripts: new Set(['build']),
    ruleIds: ['no-foo'],
  }
}

describe('decide', () => {
  it('exits 0 with a summary line when every check passes', () => {
    const result = decide(baseInput())
    expect(result.exitCode).toBe(0)
    expect(result.lines.join('\n')).toContain('no failures')
  })

  it('exits 1 and reports every failing check when something is wrong', () => {
    const input = baseInput()
    input.packageScripts = new Set() // "npm run build" no longer resolves
    const result = decide(input)
    expect(result.exitCode).toBe(1)
    expect(result.lines.join('\n')).toContain('npm-run-references-resolve')
  })

  it('reports a failure count and one block per failure', () => {
    const input = baseInput()
    input.ruleIds = ['no-foo', 'no-bar-never-mentioned']
    const result = decide(input)
    expect(result.exitCode).toBe(1)
    expect(result.lines.join('\n')).toContain('no-bar-never-mentioned')
  })

  it('formats the failure header, a blank separator, then one two-line block per failure', () => {
    const input = baseInput()
    input.packageScripts = new Set()
    const result = decide(input)
    expect(result.lines[0]).toBe('agent-doc-check -- 1 failure(s):')
    expect(result.lines[1]).toBe('')
    expect(result.lines[2]).toContain('[npm-run-references-resolve]')
  })
})
