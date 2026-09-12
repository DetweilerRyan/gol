#!/usr/bin/env tsx
// I/O shell for vale-fixture-check: reads the tracked styles and the fixture
// directory, runs vale once over the fixtures, and hands all of it to decide()'s
// pure decision. Mirrors ast-grep-rule-check's and reference-check's run.ts
// split -- every module beside this one is pure.
//
// WHY THIS GATES WHEN VALE IS ABSENT rather than passing. Vale is a Go binary,
// not an npm dependency, so `npm ci` does not install it and a fresh machine has
// none. A missing binary produces no findings, and no findings is exactly what a
// clean fixture set produces. The probe is therefore not a convenience: without
// it this program's healthiest-looking output and its most broken state are the
// same text. `../vale-probe.ts` carries the spawn semantics it classifies, and
// is shared with prose-lint rather than reimplemented.
//
// The fixture harness is run through `vale-styles/fixtures/fixtures.vale.ini`,
// NOT the repo's own `.vale.ini`. That config exists so the fixtures -- which
// are deliberate bait -- are linted by the styles under test and by nothing
// else. Its StylesPath resolves relative to itself, so this needs no `.vale/`
// and works in a fresh worktree before `vale sync`.

import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { classifyProbe } from '../vale-probe.ts'
import { decide, type DecideResult, type RawRule } from './decide.ts'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const STYLES_DIR = 'vale-styles'
const FIXTURES_DIR = path.join(STYLES_DIR, 'fixtures')
const FIXTURE_CONFIG = path.join(FIXTURES_DIR, 'fixtures.vale.ini')

/**
 * Tracked style directories: every direct subdirectory of `vale-styles/` except
 * `fixtures/`, which holds the bait rather than a style. Downloaded packages
 * under `.vale/` are deliberately out of scope -- we do not own `STE` and have
 * no standing to fixture-test it.
 */
export function readRawRules(repoRoot: string): RawRule[] {
  const stylesRoot = path.join(repoRoot, STYLES_DIR)
  const styles = readdirSync(stylesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'fixtures')
    .map((entry) => entry.name)
  return styles.flatMap((style) =>
    readdirSync(path.join(stylesRoot, style), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
      .map((entry) => {
        const relative = path.join(STYLES_DIR, style, entry.name)
        return { style, path: relative, text: readFileSync(path.join(repoRoot, relative), 'utf8') }
      }),
  )
}

/** Fixture basenames, excluding the config that drives the harness. */
export function readFixtureNames(repoRoot: string): string[] {
  return readdirSync(path.join(repoRoot, FIXTURES_DIR), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== 'fixtures.vale.ini')
    .map((entry) => entry.name)
}

/**
 * Gathers the real tree and lints the fixtures. `valeFailure` is set when the
 * run cannot be trusted -- vale absent, or the harness config unloadable --
 * which decide() treats as a failure rather than as a silent clean run.
 */
export function runCheck(repoRoot: string): DecideResult {
  const probeResult = spawnSync('vale', ['--config', FIXTURE_CONFIG, 'ls-config'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  // `SpawnSyncReturns.error` is typed as the bare `Error`, but Node sets a
  // `NodeJS.ErrnoException` with a `.code` at runtime. Narrowed here for the
  // same reason prose-lint's run.ts narrows it: so vale-probe.ts's parameter
  // type stays the plain `{ code?: string }` shape and that shared module never
  // has to know about node:child_process.
  const probe = classifyProbe({
    error: probeResult.error as NodeJS.ErrnoException | undefined,
    status: probeResult.status,
    stdout: probeResult.stdout,
    stderr: probeResult.stderr,
  })
  if (!probe.valeOnPath) {
    return decide({ ...emptyInput(repoRoot), valeFailure: 'vale is not on PATH (brew install vale)' })
  }
  if (!probe.configLoaded) {
    return decide({ ...emptyInput(repoRoot), valeFailure: `${FIXTURE_CONFIG} would not load` })
  }
  // The lint's own exit status is deliberately ignored. Vale exits nonzero
  // whenever it reports anything, and the bad fixtures are built to be reported
  // -- so a nonzero status here is the EXPECTED case, not a failure. What makes
  // that safe is the probe above: an unusable vale or an unloadable config is
  // already ruled out before this runs. If the lint were to produce no output
  // for some third reason, every bad fixture fails check 3 loudly rather than
  // the run reading as clean. Measured: passing an unknown flag makes vale print
  // usage and emit no findings, and this program reported 13 failures.
  const lint = spawnSync('vale', ['--output=line', '--config', FIXTURE_CONFIG, FIXTURES_DIR], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return decide({ ...emptyInput(repoRoot), valeOutput: `${lint.stdout ?? ''}${lint.stderr ?? ''}` })
}

function emptyInput(repoRoot: string): Parameters<typeof decide>[0] {
  return {
    rawRules: readRawRules(repoRoot),
    fixtureNames: readFixtureNames(repoRoot),
    fixtureConfig: readFileSync(path.join(repoRoot, FIXTURE_CONFIG), 'utf8'),
    valeOutput: '',
  }
}

function main(): void {
  const { exitCode, lines } = runCheck(REPO_ROOT)
  for (const line of lines) console.log(line)
  process.exit(exitCode)
}

// Guards against running main() as a side effect of being imported for tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
