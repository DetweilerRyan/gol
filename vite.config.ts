import { configDefaults, defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devPort, previewPort } from './dev-port.ts'

const sharedExclude = [
  ...configDefaults.exclude,
  '**/*.e2e.spec.ts',
  '**/*.perf.spec.ts',
  '**/*.browser.test.ts?(x)',
  'scripts/**',
  '.claude/worktrees/**',
  '.stryker-tmp*/**',
]

const domTests = ['src/components/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'src/hooks/**/*.{test,spec}.?(c|m)[jt]s?(x)']
const propertyTests = ['**/*.property.test.ts']
const acceptanceTests = ['features/*.steps.test.tsx']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  // One dev server per worktree, on that worktree's own port. strictPort makes
  // a collision a crash instead of a silent slide to 5174 -- see dev-port.ts
  // for why an auto-incremented port lets another worktree's Playwright run
  // report green against this worktree's build.
  server: { port: devPort(), strictPort: true },
  // Serves the perf-harness production build (see playwright.perf.config.ts
  // / package.json's preview:perf) on its own per-worktree port, same
  // reasoning as `server` above.
  preview: { port: previewPort(), strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Playwright's black-box e2e specs live in features/ alongside the
    // .feature files and step tests (see playwright.config.ts) -- the whole
    // directory is `product`'s manifest, and the *suffix* is what separates
    // the layers, not the directory. Excluded here so vitest doesn't try to
    // run them as unit tests (wrong runner, no browser/dev-server available
    // in this process).
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
    // .claude, so without that entry a run from the primary checkout would
    // collect and run another slice's src/ and features/ tests as its own.
    //
    // .stryker-tmp*/ is the same failure with a different source. Stryker
    // sandboxes a full copy of the tree there and only removes it on a clean
    // exit, so any aborted mutation run (a failed dry run aborts before a
    // single mutant executes) leaves one behind -- and the `unit` and
    // `property` projects below inherit configDefaults.include, which is
    // unrooted and matches straight into it. Measured: `npm test` collected
    // 3,299 tests instead of 861 against a leftover src/ sandbox. The `dom`
    // project is immune only incidentally, because its include list happens
    // to be rooted at src/. The glob covers .stryker-tmp-scripts too (see
    // stryker.scripts.config.json's tempDirName).
    exclude: sharedExclude,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
    // SPLIT INTO FOUR PROJECTS ON PURPOSE. jsdom construction measured at
    // ~78% of CPU on a run where fewer than half the collected files touch
    // the DOM -- most of the suite (framework-free modules under src/,
    // property tests, Gherkin steps) never needs a document. Splitting lets
    // only the files that actually render pay for jsdom.
    //
    // `unit` SUBTRACTS domTests+propertyTests+acceptanceTests rather than
    // declaring its own `include`, on purpose: it inherits
    // configDefaults.include and narrows from there, so a newly added test
    // file lands in `unit` by default and fails loudly with "document is not
    // defined" if it actually needed jsdom. A file can never fall between all
    // four projects and run nowhere -- with one deliberate exception, see the
    // `acceptance` project's own comment below on what happens if its glob
    // goes dead.
    //
    // THE ONE THING THAT CAN GO SILENTLY DEAD: `dom`'s include list names the
    // directories src/components/ and src/hooks/ by path. A vitest project
    // whose glob matches nothing exits 0 with no warning -- measured on
    // 4.1.10. Rename either directory and `dom` silently stops running its
    // 15 test files while `npm test` stays green. It stays green only at that
    // granularity, though: the next quality gate fails loudly, because the
    // hook/component coverage those 15 files provide is exactly what keeps
    // crap4ts under its threshold and Stryker above its break score. Renaming
    // either directory means updating this list, plus every other place those
    // two directory names are hardcoded: crap4ts.config.ts and
    // stryker.config.json (their src/components/LifeBoard.tsx exclusion), the
    // `ignores` lists in all three of rules/no-dom-in-domain.yml,
    // rules/no-react-in-domain.yml and rules/domain-imports-upward.yml, and
    // the `files:` glob in rules/no-logic-in-composition-root.yml -- that
    // last one is the only one that reports its own breakage, via the
    // npm run ast-grep:rules gate.
    //
    // `--exclude` on the CLI is a no-op once `projects` is set -- vitest's
    // cliExclude override is not in the cliOverrides allowlist for a
    // multi-project run. Filter which project(s) run with `--project`
    // instead; that's why package.json's test:unit changed shape.
    //
    // Root `environment`/`setupFiles`/`coverage` stay set even though every
    // leaf project now sets its own. `coverage` is structurally root-only
    // (ProjectConfig has no coverage field), and root env/setup are kept so
    // this config degrades to today's exact single-project behavior if
    // `projects` is ever removed.
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          setupFiles: [],
          exclude: [...sharedExclude, ...domTests, ...propertyTests, ...acceptanceTests],
        },
      },
      {
        test: {
          name: 'property',
          environment: 'node',
          setupFiles: [],
          include: propertyTests,
          exclude: sharedExclude,
        },
      },
      {
        plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.ts'],
          include: domTests,
          exclude: sharedExclude,
        },
      },
      // `acceptance` is a fourth, distinct project rather than a widened `dom`
      // include, because the file *extension* is the discriminator and it's
      // load-bearing: `.steps.test.ts` step files import framework-free
      // modules and call them directly (node, no DOM), while `.steps.test.tsx`
      // drives real components through Testing Library/ARIA in jsdom. Only the
      // extension differs -- the two forms can describe the same feature --
      // so a project `include` glob is the only lever that can split them,
      // since it can't split one extension by file content. A feature
      // converts from the direct-call form to the black-box form by being
      // renamed .steps.test.ts -> .steps.test.tsx, nothing else.
      //
      // The react-compiler preset here is not optional the way it might look:
      // Cell/CellTile's pan-stability (bailing out of re-render on an
      // unchanged tile) depends on compiler memoization, so an acceptance
      // layer that skipped the preset would compile differently than
      // production and could pass here while failing in the app.
      //
      // `acceptanceTests` (features/*.steps.test.tsx) does NOT cross `/` --
      // vitest/picomatch glob semantics (architect verified this with a
      // throwaway probe). The *same-looking* glob string in a rules/*.yml
      // `files:` key DOES cross `/`, because ast-grep's `*` is a different
      // matcher (see CLAUDE.md's Architecture section, which documents that
      // as a measured fact). Don't port one glob into the other assuming
      // they mean the same thing -- here it only ever matches a file directly
      // under features/, never features/**/*.steps.test.tsx.
      //
      // What fails if this glob goes dead is louder than `dom`'s silent-green
      // failure above: `unit`'s exclude list still subtracts
      // features/*.steps.test.tsx unconditionally, so a file that stops
      // matching here doesn't fall back into `unit` -- it runs in NO project.
      // `npm run acceptance-mutation` is what notices: its baseline check
      // (assertBaselineGreen) throws on numTotalTests < 1 before scoring a
      // single mutant, so the very next routine run of `product`'s own
      // command aborts by name instead of quietly reporting nothing.
      {
        plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
        test: {
          name: 'acceptance',
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.ts'],
          include: acceptanceTests,
          exclude: sharedExclude,
        },
      },
    ],
  },
})
