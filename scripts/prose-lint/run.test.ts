// No test here shells out to real vale: it is a Go binary `npm ci` does not
// reproduce, so a test needing it would be skipped on a fresh checkout --
// reproducing the exact confident-zero failure this program exists to
// prevent. See `.claude/agents/articles/prose.md`.
//
// The wiring tests below stub it instead. A `vale` script on a prepended
// PATH is what lets `runCheck` be exercised end to end -- the spawn argv,
// the `--no-exit` flag, the git pathspecs and the catalyst exclusion -- with
// no real binary involved. That matters because run.ts is excluded from
// crap4ts, dry4ts and Stryker by the `**/run.ts` glob every scripts/ config
// carries, so these tests are the only thing covering its four wiring lines.

import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { initGitRepo, writeFile } from '../test-support.ts'
import { runCheck } from './run.ts'
import { classifyProbe } from './vale-probe.ts'

let tempDirs: string[] = []
let savedPath: string | undefined

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true })
  tempDirs = []
  if (savedPath !== undefined) process.env.PATH = savedPath
  savedPath = undefined
})

function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

// A repo carrying one file of every shape the selection has to decide on:
// two that must be linted, one under the vendored boundary that must not,
// one of an unmatched extension, and one left untracked.
function seedRepo(): string {
  const root = tempDir('prose-lint-repo-')
  initGitRepo(root)
  writeFile(root, 'CLAUDE.md', 'prose')
  writeFile(root, 'src/camera.ts', '// ts')
  writeFile(root, 'src/catalyst/button.tsx', '// vendored, must be excluded')
  writeFile(root, 'notes.txt', 'not a lint target')
  writeFile(root, 'untracked.md', 'never added to the index')
  execFileSync('git', ['add', 'CLAUDE.md', 'src/camera.ts', 'src/catalyst/button.tsx', 'notes.txt'], { cwd: root })
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })
  return root
}

// Puts a fake `vale` first on PATH and returns the two files it records its
// lint invocation into -- the argv it was handed, and the directory it was
// run from. `ls-config` always succeeds here, so every test below reaches
// past the two probe guards; `lintStatus` is what the fourth guard reads.
function stubVale(lintStatus: number): { argvFile: string; cwdFile: string } {
  const binDir = tempDir('prose-lint-bin-')
  const argvFile = path.join(binDir, 'argv.txt')
  const cwdFile = path.join(binDir, 'cwd.txt')
  writeFile(
    binDir,
    'vale',
    `#!/bin/sh\nif [ "$1" = "ls-config" ]; then echo "StylesPath = vale-styles"; exit 0; fi\nprintf '%s\\n' "$@" > ${argvFile}\npwd > ${cwdFile}\nexit ${lintStatus}\n`,
  )
  chmodSync(path.join(binDir, 'vale'), 0o755)
  savedPath = process.env.PATH
  process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH ?? ''}`
  return { argvFile, cwdFile }
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

describe('runCheck against a stubbed vale and a real git tree', () => {
  it('narrows the file set to a scope, and still excludes the vendored boundary', () => {
    const { argvFile } = stubVale(0)
    const result = runCheck(seedRepo(), 'src')

    // `src` holds camera.ts and catalyst/button.tsx. Only the first is a
    // lint target, so a scope that reported 2 here would mean the scope had
    // widened past excludeCatalyst rather than narrowing the tree.
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toEqual(['prose-lint: linted 1 tracked file(s). A zero above is a measured zero.'])
    expect(readFileSync(argvFile, 'utf8').split('\n').filter(Boolean)).toEqual([
      '--no-exit',
      '--output=line',
      'src/camera.ts',
    ])
  })

  it('refuses a scope that matches nothing rather than reporting a clean zero', () => {
    stubVale(0)
    const result = runCheck(seedRepo(), 'src/nosuchdir')

    // The whole point of the scope: a mistyped one must land in the
    // empty-list refusal, not print a count line over zero files.
    expect(result).toEqual({
      exitCode: 1,
      stdout: [],
      stderr: ['prose-lint: no tracked files matched. That is not a clean run, it is an empty one.'],
    })
  })

  it('reports exit 0 and a count naming only the files it actually handed to vale', () => {
    const { argvFile, cwdFile } = stubVale(0)
    const repoRoot = seedRepo()
    const result = runCheck(repoRoot)

    // The numeral is the discriminating part. A wiring bug dropping
    // excludeCatalyst prints 3 here while still exiting 0, which is the
    // confident-zero shape in miniature.
    expect(result).toEqual({
      exitCode: 0,
      stdout: ['prose-lint: linted 2 tracked file(s). A zero above is a measured zero.'],
      stderr: [],
    })
    expect(readFileSync(argvFile, 'utf8').split('\n').filter(Boolean)).toEqual([
      '--no-exit',
      '--output=line',
      'CLAUDE.md',
      'src/camera.ts',
    ])
    // vale resolves `.vale.ini` relative to its own working directory, so a
    // spawn that inherited this process's instead would lint the repo's
    // files against whatever config happened to be above the caller.
    expect(realpathSync(readFileSync(cwdFile, 'utf8').trim())).toBe(realpathSync(repoRoot))
  })

  it('reports exit 1 and names vale’s status when the lint run cannot complete', () => {
    stubVale(2)
    const result = runCheck(seedRepo())

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toEqual([])
    expect(result.stderr[0]).toBe('prose-lint: vale could not lint (vale exit 2), so the output above is not a result.')
  })
})
