// The live-tree tests for this program: a smoke check that the shipped
// config still validates against this tree, run through runCheck rather
// than main() so it never calls process.exit. This is what makes the
// allowlist's coupling to the tree fail at `npm run test:scripts` rather
// than only at merge step 3, which is the worst moment to discover it.
//
// UNLIKE agent-doc-check's, ast-grep-rule-check's and reference-check's own
// run.test.ts, which build a mkdtempSync temp repo per case and read the
// live tree never. Do not read this file as mirroring them: it is the
// deliberate exception, and the two paragraphs below are the price of it.
//
// HAZARD, flagged by architect and recorded rather than buried: this test
// (via runCheck -> gatherDecideInput) reads several live-tree files, which
// is the shape .claude/agents/articles/mutation-testing.md warns about
// under "The same gap reaches the vitest-exclude tier" -- a test reading
// something off a live allowlisted directory is exactly what could
// silently invalidate that directory's entry. This is the one place
// recording the inventory does any good, since the reads themselves happen
// in run.ts, not here: that article's re-derivation method is a grep of the
// collecting test files for node:fs read APIs, and it stops at this file
// and would miss them.
//
// Different reasons cover what's read, in three buckets:
//   - vite.config.ts, stryker.config.json, mutation-invariance.config.json,
//     schemas/mutation-invariance.schema.json: each sits on the config's
//     own `absent` list, so no allowlist entry rests on the claim that any
//     of them goes unread by the scripts/ suite -- editing one is already
//     defined to re-arm the gate.
//   - .claude/agents/articles/mutation-testing.rationale.md (read for C4):
//     falls under the `.claude/**` allow[] entry, securedBy vitest-exclude.
//   - `git ls-files` output (read for C3, which checks the tracked-ness of
//     every `written-argument` entry): each such entry falls under its own
//     `allow[]` entry too, but securedBy written-argument, not
//     vitest-exclude -- a different tier, since a written-argument path is
//     never a directory a test glob could reach. The config is the
//     enumeration; do not restate the current members here.
//   The last two, unlike the absent-tier bucket above, fall under `allow[]`
//   entries -- but both are sound for the same further reason regardless of
//   tier: the config's own `scope` declares the predicate for
//   `npm run test:mutation` (the src/ run), where nothing in scripts/ is
//   visible at all. Whether it's also sound for
//   `npm run test:mutation:scripts` is the open question filed as
//   the-invariance-predicate-does-not-say-which-mutation-run-it-covers,
//   not settled by this comment.
//
// AND ONE MORE PRICE, MEASURED RATHER THAN ANTICIPATED: these three tests
// cannot run under Stryker's scripts/ mutation runner, so each carries its
// own `skipIf`. Stryker sandboxes the tree into `.stryker-tmp-scripts/`,
// which is gitignored, and loadTrackedFiles shells out to
// `git ls-files --cached --others --exclude-standard` with the sandbox as
// its cwd. That reports **zero** files there and exits 0 -- measured, not
// inferred -- so checkNonEmptyInputs (C7) correctly fires, decide() answers
// exit 1, and every assertion below is about a repository that isn't
// present. Left unskipped it fails in the DRY RUN, before a single mutant
// executes, so `npm run test:mutation:scripts` never starts at all.
// Ruled an accepted use of the idiom by architect against the four
// conditions in .claude/agents/articles/mutation-testing.md: the runner's
// environment destroys the asserted behavior rather than perturbing it,
// the skip is per test, run.ts is outside stryker.scripts.config.json's
// `mutate` list so no mutant depends on these three, and this comment
// names the mechanism.

import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runCheck } from './run.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

// The house idiom for "this process is Stryker's" -- see
// fast-check-stryker-seed.ts's isRunningUnderStryker for the verification
// that the namespace is present before any setupFiles entry runs, in both
// the dry-run and the mutant-run phases.
const UNDER_STRYKER = '__stryker__' in globalThis

describe('runCheck (live tree)', () => {
  it.skipIf(UNDER_STRYKER)('exits 0 with no --diff: the shipped config is valid and self-consistent', async () => {
    const result = await runCheck(REPO_ROOT, [])
    expect(result.exitCode).toBe(0)
    expect(result.lines).toEqual(['mutation-invariance -- config valid, no --diff given.'])
  })

  it.skipIf(UNDER_STRYKER)('exits 2 for a degenerate range with no changed paths', async () => {
    // HEAD...HEAD is a real, valid git range that always reports zero
    // changed paths -- evaluateDiff treats that as "check the range" rather
    // than a vacuous pass (see diff-verdict.ts). Exercised as a real
    // subprocess call, not a fixture, so this test would fail if loadDiff
    // ever stopped shelling out the way it does today.
    const result = await runCheck(REPO_ROOT, ['--diff', 'HEAD...HEAD'])
    expect(result.exitCode).toBe(2)
    expect(result.lines.join('\n')).toContain('no changed paths')
  })

  it.skipIf(UNDER_STRYKER)('exits 2 for the range since the repo root, which always contains src/**', async () => {
    // Deliberately not `main...HEAD`: that range is branch-dependent, and a
    // future slice confined entirely to allowlisted paths (the exact case
    // this gate exists to bless) would make it answer invariant -- exit 0 --
    // which would red this assertion for a reason unrelated to whatever
    // that slice actually touched. The repo's own root commit is reachable
    // from every branch and is never itself the tip, so `${root}...HEAD`
    // always diffs in everything since, including src/**, and must answer
    // not-invariant on any branch, forever.
    const root = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim()
    const result = await runCheck(REPO_ROOT, ['--diff', `${root}...HEAD`])
    expect(result.exitCode).toBe(2)
  })
})
