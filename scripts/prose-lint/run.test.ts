// Two integration tests, both vale-free -- vale is a Go binary `npm ci`
// does not reproduce, so no test here shells out to it. `runCheck` itself
// is exercised only through decide.test.ts's and vale-probe.test.ts's unit
// coverage of the modules it wires together. A skipped vale-dependent test
// would reproduce the exact confident-zero failure this program exists to
// prevent -- see `.claude/agents/articles/prose-linting.md`.

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { initGitRepo, writeFile } from '../test-support.ts'
import { excludeCatalyst, LINT_PATHSPECS } from './lint-targets.ts'
import { classifyProbe } from './vale-probe.ts'

let repoRoot: string | undefined

afterEach(() => {
  if (repoRoot) rmSync(repoRoot, { recursive: true, force: true })
  repoRoot = undefined
})

function tempRepo(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'prose-lint-'))
  repoRoot = dir
  return dir
}

describe('spawning a binary absent from PATH', () => {
  it('pins the one Node contract vale-probe.ts assumes: ENOENT, status null', () => {
    const result = spawnSync('prose-lint-no-such-binary-xyz', ['ls-config'], { encoding: 'utf8' })
    const error = result.error as NodeJS.ErrnoException | undefined
    expect(error?.code).toBe('ENOENT')
    expect(classifyProbe({ error, status: result.status, stdout: result.stdout, stderr: result.stderr })).toEqual({
      valeOnPath: false,
      configLoaded: false,
      output: '',
    })
  })
})

describe('selecting lint targets against a real git tree', () => {
  it('picks tracked md/ts/tsx files and drops the vendored catalyst path and the untracked type', () => {
    const root = tempRepo()
    initGitRepo(root)
    writeFile(root, 'CLAUDE.md', 'prose')
    writeFile(root, 'src/App.tsx', '// tsx')
    writeFile(root, 'src/camera.ts', '// ts')
    writeFile(root, 'src/catalyst/button.tsx', '// vendored, must be excluded')
    writeFile(root, 'notes.txt', 'not a lint target')
    execFileSync('git', ['add', 'CLAUDE.md', 'src/App.tsx', 'src/camera.ts', 'src/catalyst/button.tsx'], {
      cwd: root,
    })
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })

    const tracked = execFileSync('git', ['ls-files', ...LINT_PATHSPECS], { cwd: root, encoding: 'utf8' })
    const files = excludeCatalyst(tracked.split('\n').filter((line) => line.length > 0))

    expect(files.sort()).toEqual(['CLAUDE.md', 'src/App.tsx', 'src/camera.ts'])
    expect(files).not.toContain('src/catalyst/button.tsx')
    expect(files).not.toContain('notes.txt')
  })
})
