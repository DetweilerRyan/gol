#!/usr/bin/env tsx
// I/O shell for prose-lint: two spawns and one git read, handed to decide()'s
// pure decision. Mirrors reference-check's/ast-grep-rule-check's run.ts
// split -- lint-targets.ts, decide.ts and the shared ../vale-probe.ts are pure,
// everything
// here is genuinely I/O (two subprocess spawns, console.log, process.exit).
// vale-probe.ts sits at scripts/ root rather than here because a second program,
// vale-fixture-check, needs the same classifier -- that is the layout rule's
// "shared by two or more programs" test.
// This replaces a shell script (run.sh) that ran the same four checks with
// no test of its own: a .sh file is unreachable by npm run test:scripts,
// crap4ts:scripts and test:mutation:scripts, since all three are
// TypeScript-scoped configs, so that shell form could not be reached by any
// of this program's own siblings' gates.
// reference-check: allow run.sh -- deleted by prose-lint-runner-is-shell-not-typescript; named here as dated history of what this file replaced
//
// `cwd: REPO_ROOT` on both spawns is load-bearing, not incidental: vale
// resolves `.vale.ini` relative to its own working directory, so a spawn
// without it would silently lint against whatever directory happened to be
// current. Threading `repoRoot` through `runCheck` rather than hardcoding
// `REPO_ROOT` inside the two spawns below is what lets a test point this
// whole shell at a throwaway tree and read back the directory vale ran in.

import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSingleStringFlag } from '../single-flag-arg.ts'
import { decide, type DecideResult } from './decide.ts'
import { excludeCatalyst, pathspecsFor } from './lint-targets.ts'
import { classifyProbe } from '../vale-probe.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

/**
 * Runs the check against `repoRoot` and returns the result, without printing
 * anything or exiting. Spawns `vale` twice and reads `git ls-files`, all three
 * against `repoRoot` rather than the current directory, so a caller may point
 * it at a throwaway tree. Nothing is written to either stream here; the caller
 * owes `stdout` and `stderr` their own streams -- see `DecideResult`.
 *
 * @param repoRoot Directory every subprocess runs in.
 * @param scope Lint only this directory or pathspec. Omit for the whole tree.
 */
export function runCheck(repoRoot: string, scope?: string): DecideResult {
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
  // stdin and exits 0 silently instead, but the tracked-file list this
  // program selects is permanently in the many-paths case). A helpful
  // existsSync filter would quietly turn that loud E100 into a partial lint
  // that still prints a clean count line -- the confident-zero failure this
  // whole program exists to prevent.
  // A scope that matches nothing falls through to decide()'s empty-list
  // branch and exits 1. That is the same refusal an empty tracked set gets,
  // and it is the one that matters under a scope: `--scope src/nosuch` must
  // not print a clean count line over zero files.
  const tracked = execFileSync('git', ['ls-files', ...pathspecsFor(scope)], { cwd: repoRoot, encoding: 'utf8' })
  const files = excludeCatalyst(tracked.split('\n').filter((line) => line.length > 0))

  return decide({ probe, files }, (paths) => {
    // `stdio: 'inherit'` is deliberate: vale's own `--output=line` findings
    // must stream to this process's real stdout as they run, and only the
    // spawn's status -- never its captured output -- is read back here.
    return spawnSync('vale', ['--no-exit', '--output=line', ...paths], { cwd: repoRoot, stdio: 'inherit' }).status
  })
}

function main(): void {
  const scope = parseSingleStringFlag(process.argv.slice(2), 'scope', '--scope <path>')
  const { exitCode, stdout, stderr } = runCheck(REPO_ROOT, scope)
  for (const line of stdout) console.log(line)
  for (const line of stderr) console.error(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for
// tests -- a test imports `runCheck` directly, and that must never trigger a
// real process.exit.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
