#!/usr/bin/env tsx
// I/O shell for reference-check: gathers the resolution universe and the
// scan surface off git and disk, builds the real FileIndex, and hands both
// to decide()'s pure decision. Mirrors ast-grep-rule-check's/
// agent-doc-check's run.ts split -- decide.ts and checks.ts are pure,
// everything here is genuinely I/O (a git subprocess, readFileSync,
// console.log, process.exit).
//
// Wired in as `hardener`'s stage 2, immediately after `npm run build` --
// see CLAUDE.md's hardener stage list and the reference-check entry in its
// programs section for why it sits there rather than last, where
// `agent-doc-check` sits: this checker's own remediation edits comment
// lines in `src/`/`scripts/`, which moves both `crap4ts` (coverage is keyed
// by source location) and Stryker's incremental cache, so its fixes need
// to land before mutation and CRAP run rather than after.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type CheckInput, type FileIndex, type ScannedFile } from './checks.ts'
import { decide, type DecideResult } from './decide.ts'
import { basenameOf } from './references.ts'
import { scanScopeOf } from './scan-scope.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

/**
 * Every tracked file plus every untracked-but-not-gitignored file --
 * `git ls-files --cached --others --exclude-standard`. This is both the
 * source scan-scope draws from (scanScopeOf filters it further) and,
 * unfiltered, the FileIndex's resolution universe (buildFileIndex below):
 * a just-created module resolves, and a gitignored tree like `dist/` or
 * `coverage/` never reaches either.
 */
export function listRepoPaths(repoRoot: string): string[] {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return output.split('\n').filter((line) => line.length > 0)
}

/**
 * The real FileIndex, built over the *whole* repo universe (`paths`), not
 * the narrower scan scope -- a citation can name any file in the repo, not
 * only ones this checker itself reads for comments. `containsSymbol` reads
 * lazily and memoises per path, since most runs cite only a small fraction
 * of the files they could.
 */
export function buildFileIndex(repoRoot: string, paths: string[]): FileIndex {
  const pathsByBasename = new Map<string, string[]>()
  for (const filePath of paths) {
    const basename = basenameOf(filePath)
    const existing = pathsByBasename.get(basename)
    if (existing) existing.push(filePath)
    else pathsByBasename.set(basename, [filePath])
  }

  const textCache = new Map<string, string>()
  function readCached(filePath: string): string {
    const cached = textCache.get(filePath)
    if (cached !== undefined) return cached
    const text = readFileSync(path.join(repoRoot, filePath), 'utf8')
    textCache.set(filePath, text)
    return text
  }

  return {
    hasBasename: (basename) => pathsByBasename.has(basename),
    containsSymbol: (basename, symbol) => {
      const candidatePaths = pathsByBasename.get(basename) ?? []
      const symbolPattern = new RegExp(`\\b${symbol}\\b`)
      return candidatePaths.some((filePath) => symbolPattern.test(readCached(filePath)))
    },
    size: paths.length,
  }
}

function readScannedFile(repoRoot: string, filePath: string, surface: ScannedFile['surface']): ScannedFile {
  return { path: filePath, surface, text: readFileSync(path.join(repoRoot, filePath), 'utf8') }
}

export function gatherCheckInput(repoRoot: string, paths: string[]): CheckInput {
  const { sourceFiles, docFiles } = scanScopeOf(paths)
  return {
    files: [
      ...sourceFiles.map((filePath) => readScannedFile(repoRoot, filePath, 'source')),
      ...docFiles.map((filePath) => readScannedFile(repoRoot, filePath, 'doc')),
    ],
  }
}

export function runCheck(repoRoot: string): DecideResult {
  const paths = listRepoPaths(repoRoot)
  const input = gatherCheckInput(repoRoot, paths)
  const index = buildFileIndex(repoRoot, paths)
  return decide(input, index)
}

function main(): void {
  const { exitCode, lines } = runCheck(REPO_ROOT)
  for (const line of lines) console.log(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for
// tests -- run.test.ts imports the exported helpers directly, and none of
// those should trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
