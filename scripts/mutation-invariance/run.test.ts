// The one live-tree test in this program, mirroring agent-doc-check's and
// reference-check's own run.test.ts: a smoke test that the shipped config
// validates and the real gate exits 0 against this tree, run through
// runCheck rather than main() so it never calls process.exit.
//
// HAZARD, flagged by architect and recorded rather than buried: this test
// reads vite.config.ts, stryker.config.json and mutation-invariance.config.json
// off the live tree, which is the same shape CLAUDE.md's merge-protocol
// step 5 warns about for rules/** -- a scripts/ test asserting something
// over a live directory is exactly what could silently invalidate an
// invariance-allowlist entry for that directory. It is sound here only
// because all three files sit on mutation-invariance.config.json's own
// `absent` list (none of them is allowlisted), so no allowlist entry rests
// on the claim that this file goes unread by the scripts/ suite.

import path from 'node:path'
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

  it('exits 2 for this slice’s own diff against main, which touches package.json/vite.config.ts/scripts/**', async () => {
    // The exact command the slice's own handoff verification ran by hand:
    // this diff includes several paths mutation-invariance.config.json's
    // own absent[] names (package.json, vite.config.ts, scripts/**), so it
    // must answer not-invariant. Requires `main` to be a reachable local
    // ref, true in every worktree set up per CLAUDE.md's "Setting up a
    // slice" (git worktree add ... main).
    const result = await runCheck(REPO_ROOT, ['--diff', 'main...HEAD'])
    expect(result.exitCode).toBe(2)
  })
})
