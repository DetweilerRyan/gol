import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { defineBddProject } from 'playwright-bdd'
import { devPort } from './dev-port.ts'

// One-time setup after `npm install`: run `npx playwright install chromium`
// to fetch the browser binary this config drives. The binary lives in a
// machine-global cache, so a new worktree needs `npm ci` but not this.
//
// The port is this worktree's own (see dev-port.ts), not a fixed 5173.
const baseURL = `http://localhost:${devPort()}`

// devices['Desktop Chrome'] carries its own viewport (1280x720), which
// would otherwise win over a 900-height override -- reasserted explicitly
// here so every pixel-math formula in this suite (and in the generated bdd
// project added alongside this one) can rely on exactly 1280x900.
const chromium1280x900 = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } }

const bdd = defineBddProject({
  name: 'bdd',
  features: ['features/*.feature'],
  steps: 'features/steps/*.ts',
})

// ---------------------------------------------------------------------------
// THE GENERATED-OUTPUT GUARD.
//
// bddgen writes .features-gen/bdd/features/<name>.feature.spec.js, and the
// `bdd` project's testDir IS that directory. When the output is absent
// Playwright does not complain -- it reports the `e2e` project's tests and
// nothing else, EXIT 0, no warning. Measured on this tree: `rm -rf
// .features-gen && npx playwright test --list` printed `Total: 59 tests in 8
// files` where a generated tree prints 105 in 15. A whole layer contributing
// zero, indistinguishable from a green run. Only `npm run test:e2e` was
// protected, by its own `bddgen &&` prefix; every other entry point (a bare
// `npx playwright test`, an IDE runner, a CI step, a per-mutant spawn) read
// green against half the suite.
//
// Two guarantees ride on bddgen having run, not one. The second is the step
// registry: it is global across features/steps/, so a step text defined twice
// is an ambiguous-step error and a step text moved out from under a borrowing
// feature is a missing-definition error -- BOTH decided by bddgen and by
// nothing else in the repo (measured: a duplicate 'a grid with no live cells'
// exits 1 naming both files; renaming the shared camera Given exits 1 naming
// the feature that borrowed it). No compiler and no import expresses that
// dependency, so skipping bddgen loses the cross-module check as well as the
// tests.
//
// PLAYWRIGHT_BDD_GEN is set to '1' by bddgen itself before it loads this
// config (playwright-bdd 9.2.0, setBddGenPhase() in dist/cli/commands/test.js)
// -- read as a bare env var rather than through that module, which is public
// in its own source but is not exported from the package index. Without this
// branch the guard would refuse to load the config bddgen needs in order to
// clear the guard.
//
// Staleness is checked, not just absence: playwright-bdd has no staleness
// detection of its own, so an edited .feature otherwise runs against last
// week's generated spec, just as silently. bddgen rewrites every output file
// unconditionally (measured: two consecutive runs on an unchanged tree
// advance every mtime), so the check self-heals -- a spurious fire costs one
// bddgen.
//
// The one thing mtimes cannot see is a DELETION: removing a .feature advances
// no input mtime, so its generated spec keeps running until the next bddgen.
// Left as a recorded limitation rather than fixed, because it fails in the
// safe direction -- the stale specs regenerate away on the next
// `npm run test:e2e`, and a deleted STEP MODULE fails loudly at runtime rather
// than quietly. A set-comparison against features/*.feature would close it.
const GENERATED_SPEC_DIR = path.join(import.meta.dirname, '.features-gen/bdd/features')
const FEATURES_DIR = path.join(import.meta.dirname, 'features')

const mtimesIn = (dir: string, suffix: string) =>
  readdirSync(dir)
    .filter((name) => name.endsWith(suffix))
    .map((name) => statSync(path.join(dir, name)).mtimeMs)

// The two problems have different consequences and say so: a missing output
// runs the `bdd` project's tests not at all, a stale one runs the previous
// generation's -- silently green in both cases, but only the first is a
// count anyone could notice.
const NOT_GENERATED =
  'has not been generated, so the `bdd` project would contribute zero tests and this run would report green ' +
  'against the `e2e` project alone'
const STALE =
  'is older than a .feature file or a step module, so the `bdd` project would run the previous generation of ' +
  'specs -- a scenario or step changed since would not be checked at all'

function generatedOutputProblem(): string | null {
  if (!existsSync(GENERATED_SPEC_DIR)) return NOT_GENERATED
  const generated = mtimesIn(GENERATED_SPEC_DIR, '.spec.js')
  if (generated.length === 0) return NOT_GENERATED
  const inputs = [...mtimesIn(FEATURES_DIR, '.feature'), ...mtimesIn(path.join(FEATURES_DIR, 'steps'), '.ts')]
  return Math.max(...inputs) > Math.min(...generated) ? STALE : null
}

if (!process.env.PLAYWRIGHT_BDD_GEN) {
  const problem = generatedOutputProblem()
  if (problem) {
    throw new Error(
      `.features-gen/ ${problem}. Run \`npm run test:e2e\` (which regenerates first) rather than ` +
        '`npx playwright test` -- to scope a run to one file, pass it through: ' +
        '`npm run test:e2e -- features/grid-scrollbars.e2e.spec.ts`.',
    )
  }
}

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    // Fixed viewport is required: Grid centers its camera via a
    // ResizeObserver on first measurement, so every pixel/cell formula in
    // this suite assumes exactly this size.
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // testDir/testMatch moved off the root and onto this one project:
  // a second project (added alongside this one, to run generated bdd specs)
  // would otherwise inherit a root-level testMatch built for hand-written
  // *.e2e.spec.ts files, match nothing under its own generated output, and
  // silently contribute zero tests while the suite still reports green.
  projects: [
    { name: 'e2e', testDir: './features', testMatch: '**/*.e2e.spec.ts', use: chromium1280x900 },
    { ...bdd, use: chromium1280x900 },
  ],
  // reuseExistingServer is safe only because the port is per-worktree and
  // vite.config.ts sets strictPort: anything answering on this URL is this
  // worktree's own dev server, or nothing at all. On a shared 5173 it would
  // silently attach to another worktree's server and report a green suite
  // against the wrong build.
  webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: !process.env.CI },
})
