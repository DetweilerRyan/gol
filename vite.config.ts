import { configDefaults, defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  test: {
    environment: 'jsdom',
    // Playwright's black-box e2e specs live alongside the Gherkin steps
    // files in features/ (see playwright.config.ts) -- excluded here so
    // vitest doesn't try to run them as unit tests (wrong runner, no
    // browser/dev-server available in this process).
    exclude: [...configDefaults.exclude, '**/*.e2e.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
})
