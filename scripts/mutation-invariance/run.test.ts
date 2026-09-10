// The one live-tree test in this program, mirroring agent-doc-check's and
// reference-check's own run.test.ts: a smoke test that the shipped config
// validates and the real gate exits 0 against this tree, run through
// runCheck rather than main() so it never calls process.exit.
//
// HAZARD, flagged by architect and recorded rather than buried: this test
// (via runCheck -> gatherDecideInput) reads several live-tree files, which
// is the same shape CLAUDE.md's merge-protocol step 5 warns about for
// rules/** -- a scripts/ test reading something off a live directory is
// exactly what could silently invalidate an invariance-allowlist entry for
// that directory. This is the one place recording that inventory does any
// good, since the reads themselves happen in run.ts, not here -- the
// re-derivation method CLAUDE.md records for point 3 ("grep every .test.ts
// under scripts/ for node:fs read APIs") stops at this file and would miss
// them.
//
// Two different reasons cover the two different buckets of what's read:
//   - vite.config.ts, stryker.config.json, mutation-invariance.config.json,
//     schemas/mutation-invariance.schema.json: each sits on the config's
//     own `absent` list, so no allowlist entry rests on the claim that any
//     of them goes unread by the scripts/ suite -- editing one is already
//     defined to re-arm the gate.
//   - .claude/agents/articles/mutation-testing.rationale.md (read for C4)
//     and `git ls-files` output (read for C3, which checks the
//     tracked-ness of CLAUDE.md/README.md/.vale.ini/.oxlintrc.json): these
//     *do* fall under an `allow[]` entry (.claude/** is vitest-exclude
//     allowlisted). Sound for a different reason -- the config's own
//     `scope` declares the predicate for `npm run test:mutation` (the src/
//     run), where nothing in scripts/ is visible at all. Whether it's also
//     sound for `npm run test:mutation:scripts` is the open question filed
//     as the-invariance-predicate-does-not-say-which-mutation-run-it-covers,
//     not settled by this comment.

import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runCheck } from './run.ts'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..')

describe('runCheck (live tree)', () => {
  it('exits 0 with no --diff: the shipped config is valid and self-consistent', async () => {
    const result = await runCheck(REPO_ROOT, [])
    expect(result.exitCode).toBe(0)
    expect(result.lines).toEqual(['mutation-invariance -- config valid, no --diff given.'])
  })

  it('exits 2 for a degenerate range with no changed paths', async () => {
    // HEAD...HEAD is a real, valid git range that always reports zero
    // changed paths -- evaluateDiff treats that as "check the range" rather
    // than a vacuous pass (see diff-verdict.ts). Exercised as a real
    // subprocess call, not a fixture, so this test would fail if loadDiff
    // ever stopped shelling out the way it does today.
    const result = await runCheck(REPO_ROOT, ['--diff', 'HEAD...HEAD'])
    expect(result.exitCode).toBe(2)
    expect(result.lines.join('\n')).toContain('no changed paths')
  })

  it('exits 2 for the range since the repo root, which always contains src/**', async () => {
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
