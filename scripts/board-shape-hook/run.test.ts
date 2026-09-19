// run.ts executes at import -- it reads stdin and argv the moment it loads
// -- so it cannot be imported for a test the way every other program's
// run.ts is. These tests spawn bare node on it instead, pinning the shell
// contract (mode dispatch, envelope on stdout only in --hook mode, log
// stream per mode, exit 0 always, and the zero-byte silence of an
// out-of-scope --hook payload). board-shape.test.ts carries every decision
// this file delegates to.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { expectEnvelopeContext, tempDirTracker } from '../test-support.ts'

const RUN_TS = fileURLToPath(new URL('./run.ts', import.meta.url))
const { tempDir, cleanup } = tempDirTracker()
afterEach(cleanup)

function runArgv(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [RUN_TS, ...args], { cwd, encoding: 'utf8' })
}

function runHook(payload: string) {
  return spawnSync(process.execPath, [RUN_TS, '--hook'], { input: payload, encoding: 'utf8' })
}

const CLEAN = [
  '---',
  'name: clean',
  'title: Fixture',
  'created: 2026-09-18',
  '---',
  '',
  '## Situation',
  '',
  '## Question',
  '',
  '## Open questions',
  '',
].join('\n')

describe('argv mode', () => {
  it('writes the report to stdout, nothing to stderr, and exits 0 for a clean file', () => {
    const dir = tempDir('board-shape-hook-')
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    writeFileSync(path.join(dir, 'backlog', 'ideas', 'clean.md'), CLEAN)
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('LAYER1 backlog/ideas/clean.md: 6 checks, 0 findings')
  })

  it('never emits a hookSpecificOutput envelope, even when findings exist', () => {
    const dir = tempDir('board-shape-hook-')
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    writeFileSync(path.join(dir, 'backlog', 'ideas', 'bad.md'), '---\nname: nope\n---\n')
    const result = runArgv(dir, ['backlog/ideas/bad.md'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('6 checks,')
    expect(result.stdout).not.toContain('hookSpecificOutput')
  })
})

describe('--hook mode', () => {
  it('delivers the envelope on stdout and the log on stderr when a check fails', () => {
    const dir = tempDir('board-shape-hook-')
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    const target = path.join(dir, 'backlog', 'ideas', 'bad.md')
    writeFileSync(target, '---\nname: nope\n---\n')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('LAYER1')
    expectEnvelopeContext(result.stdout, 'LAYER1')
  })

  // Object-table it.each, the resolveTarget shape in board-shape.test.ts: both
  // rows exercise a target that never reaches the envelope, differing only in
  // why -- off-board entirely versus on-board but not a candidate -- so the
  // stderr assertion is carried per row rather than duplicating the harness.
  it.each([
    {
      name: 'stays silent on both streams for a path outside the board',
      relPath: ['src', 'camera.ts'],
      content: '// not a board file',
      expectStderr: (stderr: string) => expect(stderr).toBe(''),
    },
    {
      name: 'logs a per-item artifact to stderr and delivers no envelope',
      relPath: ['backlog', 'ready', 'item', 'spec.md'],
      content: '# Spec\n',
      expectStderr: (stderr: string) => expect(stderr).toContain('not a candidate'),
    },
  ])('$name', ({ relPath, content, expectStderr }) => {
    const dir = tempDir('board-shape-hook-')
    const target = path.join(dir, ...relPath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expectStderr(result.stderr)
  })

  it('reports the empty-extraction finding for a malformed payload', () => {
    const result = runHook('not json')
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('extraction returned empty')
    expectEnvelopeContext(result.stdout, 'extraction returned empty')
  })
})
