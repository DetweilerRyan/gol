import { defineConfig, devices } from '@playwright/test'

// One-time setup after `npm install`: run `npx playwright install chromium`
// to fetch the browser binary this config drives.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5173',
    // Fixed viewport is required: Grid centers its camera via a
    // ResizeObserver on first measurement, so every pixel/cell formula in
    // this suite assumes exactly this size.
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // devices['Desktop Chrome'] carries its own viewport (1280x720), which
  // would otherwise win over the 900-height override above -- reasserted
  // explicitly here so every pixel-math formula in this suite can rely on
  // exactly 1280x900.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
})
