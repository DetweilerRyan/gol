// run.ts executes at import -- it reads stdin the moment it loads -- so it
// cannot be imported for a test the way every other program's run.ts is.
// These tests spawn bare node on it instead, pinning the shell contract
// (envelope on stdout only when there is something to report, log on
// stderr always, exit 0 always, and the zero-byte silence of an
// out-of-scope or .meta.md payload). audit.test.ts carries every decision
// this file delegates to. No test here shells out to a real vale binary --
// see prose-lint/run.test.ts's header for why a stub is used instead.
//
// The seeded repo is built once in beforeAll and shared read-only across
// every test that needs one: no test here commits or otherwise mutates it,
// and repoRootFor only needs a `.git` directory to exist. Rebuilding it
// per test paid for `git init` plus two `git config` spawns -- three
// process forks -- on top of the run.ts spawn under test; sharing it cut
// this file from ~1.2s to well under the ~1s per-file budget.
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { expectEnvelopeContext, initGitRepo, tempDirTracker, writeFile } from '../test-support.ts'

const RUN_TS = fileURLToPath(new URL('./run.ts', import.meta.url))
const { tempDir, cleanup } = tempDirTracker()

let savedPath: string | undefined
afterEach(() => {
  cleanup()
  if (savedPath !== undefined) process.env.PATH = savedPath
  savedPath = undefined
})

let sharedRoot: string
beforeAll(() => {
  // Not tempDirTracker's tempDir(): that tracker's cleanup() runs on every
  // afterEach, and this directory must outlive the first test.
  sharedRoot = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'prose-write-hook-repo-')))
  initGitRepo(sharedRoot)
  writeFile(sharedRoot, '.claude/skills/scratch/SKILL.md', '# scratch\n')
  writeFile(sharedRoot, '.claude/skills/scratch/notes.meta.md', '# scratch\n')
  writeFile(sharedRoot, 'notes.txt', 'not in scope\n')
})
afterAll(() => {
  rmSync(sharedRoot, { recursive: true, force: true })
})

function stubVale(lintStatus: number, output: string): void {
  const binDir = tempDir('prose-write-hook-bin-')
  const script = `#!/bin/sh\nprintf '%s' "${output.replace(/'/g, "'\\''")}"\nexit ${lintStatus}\n`
  writeFile(binDir, 'vale', script)
  chmodSync(path.join(binDir, 'vale'), 0o755)
  savedPath = process.env.PATH
  process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH ?? ''}`
}

function pathWithoutVale(): string {
  const gitDir = path.dirname(execFileSync('which', ['git'], { encoding: 'utf8' }).trim())
  const nodeDir = path.dirname(process.execPath)
  return [nodeDir, gitDir].join(path.delimiter)
}

function runHook(payload: string, env?: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [RUN_TS], { input: payload, encoding: 'utf8', env })
}

describe('a scoped write that trips vale findings', () => {
  it('streams the vale text to stderr before the summary, and delivers both on stdout', () => {
    stubVale(1, 'SKILL.md:1:1:Rule.Name:message\n')
    const target = path.join(sharedRoot, '.claude/skills/scratch/SKILL.md')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toBe(
      'SKILL.md:1:1:Rule.Name:message\nPROSEHOOK .claude/skills/scratch/SKILL.md: 1 finding(s) -- run /prose-audit on this file, and fix before landing\n',
    )
    expectEnvelopeContext(result.stdout, 'Rule.Name')
  })
})

describe('a scoped write that vale reports clean', () => {
  it('writes only the count line to stderr and delivers nothing on stdout', () => {
    stubVale(0, '')
    const target = path.join(sharedRoot, '.claude/skills/scratch/SKILL.md')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('PROSEHOOK .claude/skills/scratch/SKILL.md: 0 findings\n')
    expect(result.stdout).toBe('')
  })
})

describe('a payload the hook does not act on', () => {
  it.each([
    { name: 'a .meta.md sidecar', relativePath: '.claude/skills/scratch/notes.meta.md' },
    { name: 'a path outside skills/ and references/', relativePath: 'notes.txt' },
  ])('stays silent on both streams for $name', ({ relativePath }) => {
    const target = path.join(sharedRoot, relativePath)
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
  })
})

describe('a payload that cannot be resolved to a write', () => {
  it('reports the empty-extraction finding for a malformed payload', () => {
    const result = runHook('not json')
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('PROSEHOOK (no path): extraction returned empty\n')
    expectEnvelopeContext(result.stdout, 'extraction returned empty')
  })

  it('reports no repo root found for a path outside any git repository', () => {
    const root = tempDir('prose-write-hook-non-repo-')
    const target = path.join(root, 'foo.md')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toBe(`PROSEHOOK ${target}: no repo root found -- NOT RUN\n`)
    expectEnvelopeContext(result.stdout, 'no repo root found')
  })
})

describe('vale absent from PATH', () => {
  it('reports NOT RUN rather than reading the absence as clean', () => {
    const target = path.join(sharedRoot, '.claude/skills/scratch/SKILL.md')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }), { PATH: pathWithoutVale() })
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('PROSEHOOK .claude/skills/scratch/SKILL.md: vale absent -- NOT RUN\n')
    expectEnvelopeContext(result.stdout, 'vale absent')
  })
})
