import { configDefaults, defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Playwright's black-box e2e specs live in their own top-level e2e/
    // directory (see playwright.config.ts) -- excluded here so vitest doesn't
    // try to run them as unit tests (wrong runner, no browser/dev-server
    // available in this process).
    //
    // *.browser.test.ts is the browser-required unit-test layer, run by
    // vitest.browser.config.ts in real Chromium (npm run test:browser). It's
    // excluded here for the same reason as the e2e specs -- the suffix would
    // otherwise match vitest's default include and jsdom would try to run
    // tests that exist precisely because jsdom can't simulate the API under
    // test. That exclusion is also why crap4ts/test:mutation can't see this
    // layer: both run through this config.
    //
    // scripts/ is excluded because it's a separate Node project with its own
    // pipeline (vitest.scripts.config.ts and the *:scripts npm scripts): plain
    // Node CLI tools that need neither jsdom nor src/test-setup.ts, and whose
    // coverage/CRAP/mutation numbers are scored on their own, not blended into
    // src/'s. See .claude/agents/articles/engineering.md.
    exclude: [...configDefaults.exclude, '**/*.e2e.spec.ts', '**/*.browser.test.ts?(x)', 'scripts/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
})
