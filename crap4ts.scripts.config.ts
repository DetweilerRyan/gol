import { defineConfig } from 'crap4ts'

// The scripts/-scoped twin of crap4ts.config.ts. scripts/ holds this repo's
// own quality tooling -- the Gherkin acceptance mutator, the Gherkin DRY
// checker, the Halstead reporter, the perf reporter, the ast-grep rule
// checker, and the agent-doc checker -- which sits underneath every other
// role's quality gate and so gets held to the same bar as src/ rather than
// being exempt from it.
//
// The run.ts entry points are excluded: they're I/O shells (argv-free CLI mains
// that read the filesystem, spawn vitest, and console.log a table), exercised
// end to end by actually running `npm run acceptance-mutation` / `gherkin-dry`
// / `halstead4ts` / `perf-report` / `ast-grep:rules` / `agent-doc-check`, not
// by unit tests -- the same reason App.tsx/main.tsx are excluded from
// crap4ts.config.ts. Everything they delegate to is a pure module, and every
// such module is picked up by the glob below without being registered by hand
// -- see crap4ts.config.ts for why the enumerated version was a liability.
//
// Threshold 6 is deliberately the same number crap4ts.config.ts uses rather
// than a looser scripts-specific bar. The parsing/dispatch code here does read
// branchier than src/'s pure math at first glance, but every function that
// exceeded 6 turned out to be a dispatcher inlining its branches' bodies
// (mutateValue's typed-rule chain, mutateString's strategy switch, parseSteps'
// line classifier) and split cleanly, so no special pleading was needed.
//
// **/test-support.ts is excluded for the same reason src/test-support/** is
// excluded from crap4ts.config.ts: it's shared test infrastructure for the
// test files that import it, not product code -- currently
// scripts/perf-report/test-support.ts's fixture builders (used by that
// program's own format.test.ts/stats.test.ts/units.test.ts) and the
// scripts-root scripts/test-support.ts's writeFile helper (used by
// agent-doc-check/run.test.ts and ast-grep-rule-check/run.test.ts).
export default defineConfig({
  threshold: 6,
  coverageMetric: 'line',
  src: ['scripts'],
  include: ['scripts/**/*.ts'],
  exclude: ['**/*.test.*', '**/run.ts', '**/test-support.ts'],
})
