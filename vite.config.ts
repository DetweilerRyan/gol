import { configDefaults, defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devPort } from './dev-port.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  // One dev server per worktree, on that worktree's own port. strictPort makes
  // a collision a crash instead of a silent slide to 5174 -- see dev-port.ts
  // for why an auto-incremented port lets another worktree's Playwright run
  // report green against this worktree's build.
  server: { port: devPort(), strictPort: true },
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
    //
    // Claude Code's native worktrees land in .claude/worktrees/, inside this
    // checkout. configDefaults.exclude covers node_modules/dist/.git but not
    // .claude, so without that last entry a run from the primary checkout would
    // collect and run another slice's src/ and features/ tests as its own.
    exclude: [
      ...configDefaults.exclude,
      '**/*.e2e.spec.ts',
      '**/*.browser.test.ts?(x)',
      'scripts/**',
      '.claude/worktrees/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
})
