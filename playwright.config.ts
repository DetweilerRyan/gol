import { defineConfig, devices } from '@playwright/test'
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
  projects: [{ name: 'e2e', testDir: './features', testMatch: '**/*.e2e.spec.ts', use: chromium1280x900 }],
  // reuseExistingServer is safe only because the port is per-worktree and
  // vite.config.ts sets strictPort: anything answering on this URL is this
  // worktree's own dev server, or nothing at all. On a shared 5173 it would
  // silently attach to another worktree's server and report a green suite
  // against the wrong build.
  webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: !process.env.CI },
})
