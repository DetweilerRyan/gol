import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect } from 'vitest'

// For a test that builds a throwaway repo tree under a temp directory in
// order to exercise a program's I/O-reading exports (listRuleIds /
// listAgentFiles and the like) end to end. Extracted once a second program
// produced a byte-identical copy -- dry4ts caught it. `git grep -l
// "test-support" scripts` answers which tests use it, which a list here
// cannot do without rotting.
//
// Excluded from crap4ts/Stryker's scripts/ scope the same way
// scripts/perf-report/test-support.ts already is -- see
// crap4ts.scripts.config.ts and stryker.scripts.config.json's shared
// `test-support.ts` exclusion (matched at any depth). This is test infrastructure, not product
// code.
export function writeFile(root: string, relativePath: string, contents: string): void {
  const full = path.join(root, relativePath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, contents)
}

// Initializes a real git repo at `root` with a committer identity, for a
// test that shells out to `git` against a throwaway tree rather than
// mocking it. Extracted for the same reason as `writeFile` above -- a
// second program produced a byte-identical copy, and dry4ts caught it.
export function initGitRepo(root: string): void {
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root })
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
}

/**
 * A `mkdtempSync` tracker for a spawn-based `run.test.ts`: `tempDir(prefix)`
 * hands back a fresh directory and records it, `cleanup()` removes every
 * directory handed out so far. Extracted once a second program's `run.ts`
 * test needed the same tracked-tempdir shape a first one already had --
 * dry4ts caught it. Resolves symlinks (`realpathSync`) before handing the
 * directory back: on macOS, `os.tmpdir()` sits under `/var`, itself a
 * symlink to `/private/var`, and `git rev-parse --show-toplevel` resolves
 * symlinks -- a caller comparing an unresolved path against a git-reported
 * root would otherwise fail closed.
 */
export function tempDirTracker(): { tempDir: (prefix: string) => string; cleanup: () => void } {
  const dirs: string[] = []
  return {
    tempDir: (prefix: string) => {
      const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), prefix)))
      dirs.push(dir)
      return dir
    },
    cleanup: () => {
      for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
      dirs.length = 0
    },
  }
}

/**
 * Parses a hook's delivered `hookSpecificOutput` envelope off `stdout` and
 * asserts its `additionalContext` contains `expected`.
 */
export function expectEnvelopeContext(stdout: string, expected: string): void {
  const parsed = JSON.parse(stdout) as { hookSpecificOutput: { additionalContext: string } }
  expect(parsed.hookSpecificOutput.additionalContext).toContain(expected)
}
