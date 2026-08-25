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
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
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
