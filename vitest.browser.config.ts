import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { playwright } from '@vitest/browser-playwright'

// The browser-required unit-test layer (npm run test:browser): the same kind of
// module-level unit test as src/**/*.test.ts, but for the handful of contracts
// jsdom has no faithful equivalent for (today: the real ResizeObserver's
// auto-fire on observe()). Deliberately NOT the Playwright e2e layer -- these
// import a module directly and never boot the app; see CLAUDE.md's Testing
// structure section and .claude/agents/articles/engineering.md.
//
// It reuses @playwright/test's already-installed Chromium binary rather than a
// second browser download, and stays a separate config from vite.config.ts so
// the jsdom suite (and, through it, crap4ts/test:mutation) never tries to run
// these files -- vite.config.ts excludes the *.browser.test.ts suffix for that
// reason. Tailwind is intentionally absent here: these tests assert measured
// geometry from inline styles, not from utility classes.
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  test: {
    include: ['src/**/*.browser.test.ts?(x)'],
    setupFiles: ['./src/test-setup.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
      // Failure screenshots default to a __screenshots__/ directory beside the
      // test file; redirected into the already-gitignored test-results/ so a
      // failed run can't leave binary artifacts sitting in src/.
      screenshotDirectory: 'test-results/browser-screenshots',
    },
  },
})
