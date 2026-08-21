import { defineConfig } from 'crap4ts'

// The scripts/-scoped twin of crap4ts.config.ts. scripts/ holds this repo's
// own quality tooling -- the Gherkin acceptance mutator, the Gherkin DRY
// checker, and the Halstead reporter -- which sits underneath every other
// role's quality gate and so gets held to the same bar as src/ rather than
// being exempt from it.
//
// The four run.ts entry points are excluded: they're I/O shells (argv-free
// CLI mains that read the filesystem, spawn vitest, and console.log a table),
// exercised end to end by actually running `npm run acceptance-mutation` /
// `gherkin-dry` / `halstead4ts` / `ast-grep:rules`, not by unit tests -- the
// same reason App.tsx/main.tsx are excluded from crap4ts.config.ts. Everything
// they delegate to is a pure module listed below.
//
// Threshold 6 is deliberately the same number crap4ts.config.ts uses rather
// than a looser scripts-specific bar. The parsing/dispatch code here does read
// branchier than src/'s pure math at first glance, but every function that
// exceeded 6 turned out to be a dispatcher inlining its branches' bodies
// (mutateValue's typed-rule chain, mutateString's strategy switch, parseSteps'
// line classifier) and split cleanly, so no special pleading was needed.
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['scripts'],
  include: [
    'scripts/acceptance-mutation/gherkin-examples.ts',
    'scripts/acceptance-mutation/mutation-rules.ts',
    'scripts/gherkin-dry-checker/analyze.ts',
    'scripts/gherkin-dry-checker/similarity.ts',
    'scripts/gherkin-dry-checker/step-parser.ts',
    'scripts/halstead4ts/report.ts',
    'scripts/ast-grep-rule-check/checks.ts',
    'scripts/ast-grep-rule-check/decide.ts',
    'scripts/ast-grep-rule-check/rule-file.ts',
    'scripts/ast-grep-rule-check/fixture-file.ts',
  ],
  exclude: ['**/*.test.*'],
})
