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
    // Playwright's black-box e2e specs live alongside the Gherkin steps
    // files in features/ (see playwright.config.ts) -- excluded here so
    // vitest doesn't try to run them as unit tests (wrong runner, no
    // browser/dev-server available in this process).
    //
    // scripts/ is excluded because it's a separate Node project with its own
    // pipeline (vitest.scripts.config.ts and the *:scripts npm scripts): plain
    // Node CLI tools that need neither jsdom nor src/test-setup.ts, and whose
    // coverage/CRAP/mutation numbers are scored on their own, not blended into
    // src/'s. See .claude/agents/articles/engineering.md.
    exclude: [...configDefaults.exclude, '**/*.e2e.spec.ts', 'scripts/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
})
