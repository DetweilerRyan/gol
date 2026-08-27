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
    // Pins fast-check's global seed, but only when this process is itself
    // running under Stryker -- see fast-check-stryker-seed.ts's header
    // comment and vite.config.ts's `property` project, which carries the
    // other setupFiles entry (scripts/'s two *.property.test.ts files need
    // the same pin as src/'s fourteen, and this config is the only one that
    // reaches them). Applied to every test in this project rather than only
    // the property files -- harmless, since the pin is a no-op unless
    // fast-check is actually in use, and scoping setupFiles any narrower
    // than the whole project isn't a vitest option.
    setupFiles: ['./fast-check-stryker-seed.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: 'coverage-scripts',
    },
  },
})
