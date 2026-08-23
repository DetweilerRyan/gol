import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { listAgentFiles, listDocFiles, listRuleIds, loadPackageScripts, runCheck } from './run.ts'
import { writeFile } from '../test-support.ts'

let repoRoot: string | undefined

afterEach(() => {
  if (repoRoot) rmSync(repoRoot, { recursive: true, force: true })
  repoRoot = undefined
})

function tempRepo(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'agent-doc-check-'))
  repoRoot = dir
  return dir
}

const GOOD_AGENT =
  '---\nname: coder\ndescription: Does things.\ntools: Read, Write, Edit, Bash, Grep, Glob, LSP\nmodel: sonnet\n---\n\nBody.\n'

describe('listAgentFiles', () => {
  it('reads direct .md children of .claude/agents/ only, not the articles/ subdirectory', () => {
    const root = tempRepo()
    writeFile(root, '.claude/agents/coder.md', GOOD_AGENT)
    writeFile(root, '.claude/agents/articles/engineering.md', 'no frontmatter, shared house rules\n')
    const found = listAgentFiles(root)
    expect(found.map((file) => file.path)).toEqual(['.claude/agents/coder.md'])
  })
})

describe('listDocFiles', () => {
  it('reads CLAUDE.md plus every .md under .claude/**, agents and articles alike', () => {
    const root = tempRepo()
    writeFile(root, 'CLAUDE.md', '# root doc\n')
    writeFile(root, '.claude/agents/coder.md', GOOD_AGENT)
    writeFile(root, '.claude/agents/articles/engineering.md', 'house rules\n')
    const found = listDocFiles(root)
      .map((file) => file.path)
      .sort()
    expect(found).toEqual(['.claude/agents/articles/engineering.md', '.claude/agents/coder.md', 'CLAUDE.md'])
  })
})

describe('listRuleIds', () => {
  it('reads the filename stem of every rules/*.yml, not a parsed `id:` field', () => {
    const root = tempRepo()
    writeFile(root, 'rules/no-foo.yml', 'id: something-else\nseverity: warning\n')
    const found = listRuleIds(root)
    expect(found).toEqual(['no-foo'])
  })
})

describe('loadPackageScripts', () => {
  it('reads the keys of package.json scripts', () => {
    const root = tempRepo()
    writeFile(root, 'package.json', JSON.stringify({ scripts: { build: 'vite build', lint: 'oxlint' } }))
    expect(loadPackageScripts(root)).toEqual(new Set(['build', 'lint']))
  })
})

describe('runCheck', () => {
  it('exits 0 on a fully consistent, minimal repo', () => {
    const root = tempRepo()
    const cycle = 'product → coder → cleaner → architect → hardener → product'
    writeFile(root, 'package.json', JSON.stringify({ scripts: { build: 'vite build' } }))
    writeFile(root, 'CLAUDE.md', `\`npm run build\`\n${cycle}\nthe \`no-foo\` rule.\n`)
    writeFile(root, 'rules/no-foo.yml', 'id: no-foo\n')
    for (const role of ['product', 'coder', 'cleaner', 'architect', 'hardener']) {
      writeFile(
        root,
        `.claude/agents/${role}.md`,
        `---\nname: ${role}\ndescription: Does things.\ntools: Read\nmodel: sonnet\n---\n\n${cycle}\n`,
      )
    }
    const result = runCheck(root)
    expect(result.exitCode).toBe(0)
  })

  it('exits 1 and names the offending file when an agent frontmatter name is wrong', () => {
    const root = tempRepo()
    writeFile(root, 'package.json', JSON.stringify({ scripts: {} }))
    writeFile(root, 'CLAUDE.md', 'nothing relevant\n')
    mkdirSync(path.join(root, 'rules'), { recursive: true })
    writeFile(root, '.claude/agents/coder.md', GOOD_AGENT.replace('name: coder', 'name: cleaner'))
    const result = runCheck(root)
    expect(result.exitCode).toBe(1)
    expect(result.lines.some((line) => line.includes('.claude/agents/coder.md'))).toBe(true)
  })
})
