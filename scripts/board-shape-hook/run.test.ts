// run.ts executes at import -- it reads stdin and argv the moment it loads
// -- so it cannot be imported for a test the way every other program's
// run.ts is. These tests spawn bare node on it instead, pinning the shell
// contract (mode dispatch, envelope on stdout only in --hook mode, log
// stream per mode, exit 0 always, the zero-byte silence of an out-of-scope
// --hook payload, and the off-board refusal in argv mode). board-shape.test.ts
// carries every decision this file delegates to.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import { expectEnvelopeContext, tempDirTracker, writeFile } from '../test-support.ts'
import { blobIdOf } from './assessment-record.ts'

const RUN_TS = fileURLToPath(new URL('./run.ts', import.meta.url))
const { tempDir, cleanup } = tempDirTracker()
afterEach(cleanup)

function runArgv(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [RUN_TS, ...args], { cwd, encoding: 'utf8' })
}

// `cwd` is optional: the malformed-payload row below never resolves a path
// far enough to reach checkTarget's declarations read, so it has nothing to
// seed and spawns with the caller's own inherited cwd, same as before this
// parameter existed.
function runHook(payload: string, cwd?: string) {
  return spawnSync(process.execPath, [RUN_TS, '--hook'], { cwd, input: payload, encoding: 'utf8' })
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

// board-lanes.config.json is CWD-relative (run.ts's readLaneDeclarationsText),
// mirroring the tracked config's three lanes. Every argv-mode spawn below
// sets cwd to a throwaway temp dir, which starts with no such file, so
// without a seeded copy every existing row would hit the
// declarations-unavailable branch instead of the outcome it means to pin.
// tempDirWithLanes wraps tempDir with that seed; the missing-config tests
// below use bare tempDir instead, which is what makes the unavailable
// branch spawn-testable by omission.
const LANES_CONFIG = JSON.stringify({
  lanes: {
    ideas: { shape: 'flat' },
    ready: { shape: 'folder', item: 'proposal.md' },
    done: { shape: 'folder', item: 'proposal.md' },
  },
})

function tempDirWithLanes(prefix: string): string {
  const dir = tempDir(prefix)
  writeFile(dir, 'board-lanes.config.json', LANES_CONFIG)
  return dir
}

describe('argv mode', () => {
  it('writes the report to stdout, nothing to stderr, and exits 0 for a clean file', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('LAYER1 backlog/ideas/clean.md: 7 checks, 0 findings')
  })

  it('never emits a hookSpecificOutput envelope, even when findings exist', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/bad.md', '---\nname: nope\n---\n')
    const result = runArgv(dir, ['backlog/ideas/bad.md'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('7 checks,')
    expect(result.stdout).not.toContain('hookSpecificOutput')
  })

  it('refuses an existing off-board target rather than reading its shape', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'src/camera.ts', '// not a board file')
    const result = runArgv(dir, ['src/camera.ts'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('off the board')
    expect(result.stdout).not.toContain('6 checks')
    expect(result.stderr).toBe('')
  })

  it('reports the target as missing rather than off the board when it does not resolve at all', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    const result = runArgv(dir, ['no-such-slug'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('path missing or unreadable')
    expect(result.stdout).not.toContain('off the board')
  })

  it('prints the lane-declarations-unavailable line instead of resolving when the config is missing', () => {
    const dir = tempDir('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('lane declarations unavailable')
    expect(result.stdout).not.toContain('path missing or unreadable')
  })
})

// The filesystem half of the RecordLookup plumbing: run.ts's recordLookupFor
// reads the sibling record real run.ts cannot exercise via checkShape alone,
// since board-shape.test.ts hands checkShape a constructed RecordLookup
// directly. These pin the read, the hash, and the two ways a record reads as
// unreadable (a directory at the sibling path; a record with no idea-blob
// field) against a real temp tree.
describe('sibling assessment record', () => {
  it('reports assessment current when the sibling record blob matches the idea file', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    writeFile(dir, 'backlog/ideas/clean.assessment.md', `---\nidea-blob: ${blobIdOf(Buffer.from(CLEAN))}\n---\n`)
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.stdout).toContain('assessment current')
  })

  it('reports assessment stale in the ideas lane when the sibling record blob no longer matches', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    writeFile(dir, 'backlog/ideas/clean.assessment.md', '---\nidea-blob: not-the-current-blob\n---\n')
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.stdout).toContain('assessment stale')
  })

  it('reports assessment frozen in the ready lane when the sibling record blob no longer matches', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ready/my-slug/proposal.md', CLEAN.replace('name: clean', 'name: my-slug'))
    writeFile(dir, 'backlog/ready/my-slug/assessment.md', '---\nidea-blob: not-the-current-blob\n---\n')
    const result = runArgv(dir, ['backlog/ready/my-slug/proposal.md'])
    expect(result.stdout).toContain('assessment frozen')
  })

  it('reports the record unreadable when the sibling path is a directory rather than a file', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    mkdirSync(path.join(dir, 'backlog', 'ideas', 'clean.assessment.md'), { recursive: true })
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.stdout).toContain('assessment record unreadable')
  })

  it('reports the record unreadable when it carries no idea-blob field', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    writeFile(dir, 'backlog/ideas/clean.md', CLEAN)
    writeFile(dir, 'backlog/ideas/clean.assessment.md', '---\nassessed: 2026-09-20\n---\n')
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.stdout).toContain('assessment record unreadable')
  })
})

describe('--hook mode', () => {
  it('delivers the envelope on stdout and the log on stderr when a check fails', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    const target = path.join(dir, 'backlog', 'ideas', 'bad.md')
    writeFileSync(target, '---\nname: nope\n---\n')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }), dir)
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('LAYER1')
    expectEnvelopeContext(result.stdout, 'LAYER1')
  })

  // Object-table it.each, the resolveTarget shape in board-shape.test.ts: both
  // rows exercise a target that never reaches the envelope, differing only in
  // why -- off-board entirely versus on-board but not a candidate -- so the
  // stderr assertion is carried per row rather than duplicating the harness.
  // The first row's target never reaches checkTarget at all (isBoardPath
  // gates ahead of it), so a seeded config would go unread either way --
  // seeded regardless, for the same reason every row in this file is.
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
    const dir = tempDirWithLanes('board-shape-hook-')
    const target = path.join(dir, ...relPath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }), dir)
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expectStderr(result.stderr)
  })

  it('logs an undeclared-lane warning to stderr and delivers no envelope', () => {
    const dir = tempDirWithLanes('board-shape-hook-')
    const target = path.join(dir, 'backlog', 'unknown', 'foo.md')
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, CLEAN)
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }), dir)
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('undeclared lane')
  })

  it('delivers the config envelope instead of a shape report when the config is missing', () => {
    const dir = tempDir('board-shape-hook-')
    const target = path.join(dir, 'backlog', 'ideas', 'clean.md')
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, CLEAN)
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }), dir)
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('lane declarations unavailable')
    expectEnvelopeContext(result.stdout, 'lane declarations unavailable')
  })

  it('reports the empty-extraction finding for a malformed payload', () => {
    const result = runHook('not json')
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('extraction returned empty')
    expectEnvelopeContext(result.stdout, 'extraction returned empty')
  })
})
