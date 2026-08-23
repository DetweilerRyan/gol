import { defineConfig, devices } from '@playwright/test'
import { previewPort } from './dev-port.ts'

// Render-performance harness config -- deliberately separate from
// playwright.config.ts (black-box e2e), not a project variant of it: this
// suite measures render cost, and anything that config carries for
// correctness testing (trace/video/screenshot capture, retries) actively
// perturbs the numbers this one exists to produce.
//
// The port is this worktree's own preview port (see dev-port.ts), disjoint
// from both the dev-server range playwright.config.ts uses and the
// browser-api range vitest.browser.config.ts uses.
const baseURL = `http://localhost:${previewPort()}`

export default defineConfig({
  testDir: './perf',
  testMatch: '**/*.perf.spec.ts',
  // Perf measurements must not interleave -- a second worker's script/layout
  // work would land inside the CDP metrics window of the first's rep. Serial
  // by construction, not by forbidOnly/retries conventions borrowed from the
  // e2e config.
  fullyParallel: false,
  workers: 1,
  // A retry silently produces a second set of numbers for the same scenario
  // with no signal which run was kept -- reports/perf/raw/'s one-file-per-
  // scenario-per-project layout would have the retry's write clobber the
  // first attempt's, indistinguishable from a clean single run.
  retries: 0,
  // A cold `npm run build:perf` plus dev-port startup can comfortably exceed
  // the black-box e2e suite's default per-test timeout.
  timeout: 120_000,
  reporter: [['html', { open: 'never' }]],
  outputDir: 'test-results/perf',
  use: {
    baseURL,
    // The tracer/video/screenshot pipeline is itself CPU and IPC work,
    // perturbing exactly the ScriptDuration/LayoutDuration numbers this
    // suite measures -- off unconditionally, not just on success like the
    // e2e config's `retain-on-failure`/`only-on-failure`.
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  // Two viewports. 1280x900 matches playwright.config.ts's fixed e2e
  // viewport (see e2e/e2e-helpers.ts's CENTER comment), so numbers from this
  // project land in a world already pinned down by that suite; 1920x1080
  // is the second reference size the design calls for. Every scenario runs
  // under both, so each raw sample is keyed on (scenario, project) -- see
  // perf/raw-sink.ts's filename comment.
  projects: [
    {
      name: 'chromium-1280x900',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'chromium-1920x1080',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
      // The tile-boundary wobble family is a 1280x900 scenario and only a
      // 1280x900 scenario. Its whole subject is a viewport that is a whisker
      // wider than a whole number of tiles: 1280px at cellSize 8.192 is
      // 39.0625 tiles, so the leading and trailing tile edges cross 0.25
      // cells (2.048px) apart and a 5px wobble spans both. 1920px at the
      // same cellSize is 58.5938 tiles -- the crossings sit 2.375 cells
      // (19.5px) apart, further than any hand tremor travels, and no rung of
      // the zoom ladder brings them closer at this width. Excluded here,
      // loudly and with the reason, rather than left to fail its own
      // precondition search at runtime (which would fail the suite) or to
      // skip itself silently (which would hide why).
      testIgnore: '**/tile-boundary.perf.spec.ts',
    },
  ],
  // Deliberately the opposite of playwright.config.ts's
  // reuseExistingServer: !CI -- a stale `vite preview` server would silently
  // serve whatever was built last, including a non-perf build with no
  // seeder in it (see src/main.tsx), which is exactly the "green report
  // against the wrong build" failure this harness exists to avoid. Always
  // rebuild and reserve.
  webServer: {
    command: 'npm run build:perf && npm run preview:perf',
    url: baseURL,
    reuseExistingServer: false,
    // Must cover a cold production build (tsc -b + vite build --mode perf)
    // plus vite preview's own startup.
    timeout: 180_000,
  },
})
