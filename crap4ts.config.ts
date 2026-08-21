import { defineConfig } from 'crap4ts'

// Scoped to the unit-tested modules: the framework-free logic (grid rules, the
// pattern catalog, camera math, the pattern-placing state machine), the hooks
// that adapt it to React, and the presentational components that have their own
// render()-based unit tests.
//
// Expressed as globs-minus-exclusions rather than a hand-listed file set, so a
// new module is measured the day it lands. The old enumeration had to be
// repeated identically here, in stryker.config.json's `mutate`, and in
// scripts/halstead4ts/run.ts, and forgetting one left the file silently
// unmeasured while every tool still reported success. The exclusions below are
// the actual rule: React composition roots (App/main/LifeBoard) are exercised
// by browser/e2e testing rather than unit tests and would be scored against a
// coverage bar they can't clear; test-support/ is test infrastructure, not
// product code; and catalyst/ is vendored third-party source this repo doesn't
// author. scripts/halstead4ts/run.ts now resolves this same list from here
// rather than keeping a copy.
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['src'],
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts',
    'src/App.tsx',
    'src/main.tsx',
    'src/components/LifeBoard.tsx',
    'src/test-setup.ts',
    'src/test-support/**',
    'src/catalyst/**',
  ],
  // format: "table",
  // breakdown: "off",
  // sort: "crap",
  // top: 10,
  // summary: false,
})
