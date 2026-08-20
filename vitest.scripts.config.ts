import { defineConfig } from 'vitest/config'

// scripts/ is a fully independent Node project -- the custom quality tools
// (acceptance-mutation, gherkin-dry-checker, halstead4ts) that the rest of the
// pipeline runs against src/. It gets its own vitest config rather than
// riding along on vite.config.ts's: no jsdom, no src/test-setup.ts, no React
// plugin chain, and a separate coverage directory so a scripts-scoped run
// never overwrites the src/ coverage report (and vice versa).
//
// vite.config.ts excludes scripts/** for the same reason -- the two suites
// never run in the same process. See .claude/agents/articles/engineering.md
// for which role runs which of the two pipelines.
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: 'coverage-scripts',
    },
  },
})
