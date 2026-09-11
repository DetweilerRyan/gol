#!/usr/bin/env tsx
// I/O shell for prose-lint: two spawns and one git read, handed to decide()'s
// pure decision. Mirrors reference-check's/ast-grep-rule-check's run.ts
// split -- lint-targets.ts, vale-probe.ts and decide.ts are pure, everything
// here is genuinely I/O (two subprocess spawns, console.log, process.exit).
// This replaces a shell script that ran the same four checks with no test
// of its own -- see CLAUDE.md's "Custom quality tooling in scripts/" section
// for why that shell form could not be reached by any of this program's own
// siblings' gates.
//
// `cwd: REPO_ROOT` on both spawns is load-bearing, not incidental: vale
// resolves `.vale.ini` relative to its own working directory, so a spawn
// without it would silently lint against whatever directory happened to be
// current. Passing `repoRoot` through `runCheck` rather than hardcoding
// `REPO_ROOT` inside the two spawns below is also what lets run.test.ts
// point this whole shell at a throwaway git tree.

import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decide, type DecideResult } from './decide.ts'
import { excludeCatalyst, LINT_PATHSPECS } from './lint-targets.ts'
import { classifyProbe } from './vale-probe.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

/**
 * Runs the whole check against `repoRoot` and returns the result, without
 * printing anything or exiting -- what lets a test assert on `exitCode`,
 * `stdout` and `stderr` directly, the way `run.test.ts` does against a
 * throwaway git tree.
 */
export function runCheck(repoRoot: string): DecideResult {
  const probeResult = spawnSync('vale', ['ls-config'], { cwd: repoRoot, encoding: 'utf8' })
  // `SpawnSyncReturns.error` is typed as the bare `Error`, but Node actually
  // sets a `NodeJS.ErrnoException` with a `.code` at runtime -- narrowing it
  // here is what lets classifyProbe's own parameter type stay the plain
  // `{ code?: string }` shape the ratified design calls for, rather than
  // importing node:child_process's types into a module that has no other
  // reason to know about spawning.
  const probe = classifyProbe({
    error: probeResult.error as NodeJS.ErrnoException | undefined,
    status: probeResult.status,
    stdout: probeResult.stdout,
    stderr: probeResult.stderr,
  })

  // Deliberately NOT filtered through existsSync: `git ls-files` can name a
  // tracked file that was deleted from the working tree without the
  // deletion being staged, and that is exactly the case this program must
  // fail loudly on. Vale itself raises E100 across the whole list when one
  // of several paths is missing (measured: a single missing path is read as
  // stdin and exits 0 silently instead, but this program is permanently in
  // the many-paths case at 410 tracked files). A helpful existsSync filter
  // would quietly turn that loud E100 into a partial lint that still prints
  // a clean count line -- the confident-zero failure this whole program
  // exists to prevent.
  const tracked = execFileSync('git', ['ls-files', ...LINT_PATHSPECS], { cwd: repoRoot, encoding: 'utf8' })
  const files = excludeCatalyst(tracked.split('\n').filter((line) => line.length > 0))

  return decide({ probe, files }, (paths) => {
    // `stdio: 'inherit'` is deliberate: vale's own `--output=line` findings
    // must stream to this process's real stdout as they run, and only the
    // spawn's status -- never its captured output -- is read back here.
    return spawnSync('vale', ['--no-exit', '--output=line', ...paths], { cwd: repoRoot, stdio: 'inherit' }).status
  })
}

function main(): void {
  const { exitCode, stdout, stderr } = runCheck(REPO_ROOT)
  for (const line of stdout) console.log(line)
  for (const line of stderr) console.error(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for
// tests -- run.test.ts imports runCheck directly, and that should never
// trigger a real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
