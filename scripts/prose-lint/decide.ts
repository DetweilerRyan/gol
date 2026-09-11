// Four abort guards in sequence, then success -- cyclomatic 5. A fifth guard
// would take this to 6, which crap4ts's threshold of 6 still passes but only
// at exactly 100% coverage, since CRAP collapses to the cyclomatic number
// only there. Treat a fifth as a design question rather than a free slot.
//
// The four mirror the four failure branches of the shell script this program
// replaced (a `command -v vale` check, a `vale ls-config` check, an
// empty-file-list check, and an `xargs`-status check), with `RunVale`'s
// `number | null` return folded into "could not lint" only here, in guard 4.
// That is deliberate: run.ts's spawnSync closure hands back `status`
// unmodified, so this module -- covered by test:mutation:scripts, unlike
// run.ts -- is the one place that mapping is actually exercised.
//
// Measured against vale 3.20.0, and re-derived 2026-09-11 on that same
// version, under `--no-exit`: a clean run and a warning-only run both exit 0;
// an error-severity alert exits 1, which `--no-exit` turns into 0; a runtime
// error exits 2, which `--no-exit` does NOT suppress. Both runtime forms were
// checked -- E100 for a missing `.vale.ini`, E201 for a `StylesPath` naming a
// directory that does not exist, which is the fresh-worktree case before
// `vale sync`. So under `--no-exit`, any nonzero status guard 4 sees means
// vale could not lint, never that it found something.
//
// No ARG_MAX chunking here, unlike the shell version's `xargs`: run.ts
// passes every selected path as a single spawnSync argv. Measured 2026-09-10
// on this repo's tracked tree, that list was 410 paths and 15,622 bytes of
// argv joined by spaces -- 1.5% of `getconf ARG_MAX`'s 1,048,576-byte ceiling
// on that machine, and `xargs` itself never had to split it into more than
// one invocation either. Re-derive with `npm run prose-lint`'s trailing count
// against `getconf ARG_MAX` before assuming the margin still holds. That
// headroom is why `RunVale` takes the whole file list at once rather than
// batching it.

import type { ValeProbe } from './vale-probe.ts'

/**
 * Runs vale over `files` and returns its exit status, or `null` if the
 * spawn never produced one -- see `node:child_process`'s
 * `SpawnSyncReturns.status`. `decide` treats both alike as "vale could not
 * lint"; see this module's header for why any nonzero status means that
 * under `--no-exit`.
 */
export type RunVale = (files: string[]) => number | null

export interface ProseLintInput {
  probe: ValeProbe
  files: string[]
}

/**
 * `stdout` and `stderr` are kept apart deliberately, mirroring this
 * program's shell predecessor's own `>&2` routing: only the trailing count
 * line belongs on stdout, and a caller must write each array to its own
 * stream to preserve that contract.
 */
export interface DecideResult {
  exitCode: number
  stdout: string[]
  stderr: string[]
}

function countLine(fileCount: number): string {
  return `prose-lint: linted ${fileCount} tracked file(s). A zero above is a measured zero.`
}

/**
 * The whole program's decision as one pure function. `run.ts`'s job is
 * reduced to gathering `input` off disk and git, and to running `runVale`
 * -- which lets a test pin every branch below without spawning vale.
 *
 * @param runVale invoked only once every earlier guard has passed, over
 * exactly `input.files`.
 */
export function decide(input: ProseLintInput, runVale: RunVale): DecideResult {
  const { probe, files } = input

  if (!probe.valeOnPath) {
    return {
      exitCode: 1,
      stdout: [],
      stderr: [
        'prose-lint: vale is not on PATH. See .claude/agents/articles/prose-linting.md, Setup.',
        'prose-lint: a machine without it lints nothing, which reads exactly like a clean run.',
      ],
    }
  }

  if (!probe.configLoaded) {
    return {
      exitCode: 1,
      stdout: [],
      stderr: [
        "prose-lint: vale cannot load .vale.ini. Run 'vale sync' -- .vale/ is gitignored,",
        'prose-lint: so a fresh worktree has none and the run aborts before reaching a rule.',
        ...probe.output.split('\n').slice(0, 3),
      ],
    }
  }

  if (files.length === 0) {
    return {
      exitCode: 1,
      stdout: [],
      stderr: ['prose-lint: no tracked files matched. That is not a clean run, it is an empty one.'],
    }
  }

  const status = runVale(files)
  if (status !== 0) {
    return {
      exitCode: 1,
      stdout: [],
      stderr: [
        `prose-lint: vale could not lint (vale exit ${status}), so the output above is not a result.`,
        "prose-lint: with --no-exit a finding cannot cause this. See prose-linting.md's confident-zero list.",
      ],
    }
  }

  return { exitCode: 0, stdout: [countLine(files.length)], stderr: [] }
}
