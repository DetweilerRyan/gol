import { defineConfig } from '@playwright/test'
import { defineBddProject } from 'playwright-bdd'
import { baseURL, chromium1280x900 } from './playwright-shared.ts'

// Playwright config for the acceptance-mutation runner (see
// scripts/acceptance-mutation/). It is never invoked directly -- the runner
// spawns `bddgen` and `playwright test` against it with
// ACCEPTANCE_MUTATION_DIR pointing at a temp tree the runner has already
// populated with `features/*.feature` (one file per mutant, plus the
// baselines) before either process starts. Nothing in this config creates
// that directory or writes into it beyond what bddgen/playwright do on their
// own.
//
// This is a batched design, not a per-mutant config: every mutant and every
// baseline is generated and run as its own `.feature` file inside one
// `features/` directory, so one `bddgen` + one `playwright test` invocation
// covers the whole run. architect measured this against the per-mutant-spawn
// alternative and found it far cheaper at full scale (215.3s vs. a >400s
// floor for the per-mutant form) with an identical verdict.
//
// Deliberately does NOT import playwright.config.ts -- that config throws if
// its own generated-output guard finds .features-gen/bdd/features stale or
// missing, which has nothing to do with this run and would make this config
// fail to even load on a fresh clone. The two configs share only the values
// in playwright-shared.ts, never each other.
const dir = process.env.ACCEPTANCE_MUTATION_DIR
if (!dir) {
  throw new Error(
    'ACCEPTANCE_MUTATION_DIR must be set -- this config is only ever invoked by ' +
      'scripts/acceptance-mutation/, never directly.',
  )
}

const bdd = defineBddProject({
  name: 'bdd',
  features: [`${dir}/features/*.feature`],
  featuresRoot: `${dir}/features`,
  steps: 'features/steps/*.ts',
  outputDir: `${dir}/out`,
})

export default defineConfig({
  projects: [{ ...bdd, use: chromium1280x900 }],
  // Hardcoded, not `process.env.CI ? 1 : 0` -- a retry would silently re-run
  // a mutant, and "the mutant run passed" and "the mutant run passed on
  // retry after an unrelated flake" must not be indistinguishable. Keeping
  // this unconditional is what makes "flaky > 0 means someone tampered" a
  // sound invariant to check for, even under CI.
  retries: 0,
  reporter: [['json']],
  // A DEDICATED artifact directory, not Playwright's default `test-results`,
  // and the reason is retention rather than tidiness. Both this config and
  // playwright.config.ts would otherwise resolve artifacts to the same
  // `test-results/`, and Playwright deletes a project's outputDir during run
  // SETUP (createRemoveOutputDirsTask in playwright 1.62.1's
  // lib/runner/index.js, unconditional unless preserveOutputDir is set). So
  // a shared directory means the very next `npm run test:e2e` destroys the
  // evidence from an aborted acceptance-mutation run -- and re-running is
  // exactly what an abort provokes. Kept out of git by .gitignore.
  //
  // Not fully safe from itself: the mutant phase's own run wipes what the
  // baseline phase left, and re-running acceptance-mutation wipes everything.
  // That is acceptable because an ABORT stops the run inside the baseline
  // phase, so the baseline artifacts survive it -- but read this directory
  // BEFORE re-running the tool.
  outputDir: 'test-results-acceptance-mutation',
  use: {
    baseURL,
    // On, deliberately, even though ~55 of this run's specs fail ON PURPOSE.
    // The run's failure mode that matters is the baseline phase aborting
    // under parallel load (see ideas/candidates/
    // pattern-library-e2e-flakes-under-load.md), which is not reproducible
    // on demand -- ~1,300 pattern-library executions across nine load models
    // produced zero failures. An opt-in flag is therefore worthless here:
    // evidence has to be captured on the run that fails, because there is no
    // re-run that reproduces it.
    //
    // Measured on this tree, `npm run acceptance-mutation -- --feature
    // pattern-library` (24 mutants, 24 killed) back to back on one machine:
    // 1:35.97 and 3.0M of artifacts with 'off', 1:46.59 and 40M with
    // 'retain-on-failure' -- +11% wall clock, +37M into a gitignored
    // directory Playwright wipes at the start of every run. That +11% is the
    // only true A/B here, and it is scoped to that one --feature command.
    // The unscoped `npm run acceptance-mutation` was measured only WITH the
    // change (55 mutants, 55 killed, 3:39.08, 100M) -- an absolute, not a
    // delta, since no trace-off run of the full scope was taken on this
    // machine to subtract from it. Note the A/B moved the trace line ONLY,
    // so the +11%/+37M is attributable to trace alone; `screenshot` was
    // never separately A/B'd and its cost is bounded only by that full-run
    // absolute, which was taken with both flags already on.
    //
    // Note 'off' was never artifact-free: playwright already wrote a ~116K
    // error-context.md (an ARIA snapshot) per failed spec, which is the 3.0M
    // above. This raises the ceiling on what an abort leaves behind; it does
    // not introduce the cost.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // reuseExistingServer is safe unconditionally here, the same way it is in
  // playwright.config.ts: the port is per-worktree (dev-port.ts) and
  // vite.config.ts sets strictPort, so anything answering on this URL is
  // this worktree's own dev server or nothing at all -- never another
  // worktree's build. Unlike playwright.config.ts's own `!process.env.CI`
  // form, this is hardcoded `true` because this config has no CI job of its
  // own that would need `reuseExistingServer: false`'s stricter guarantee.
  webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: true },
})
