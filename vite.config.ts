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
  // Both entries below exist because vitest's `unit` project inherits the
  // unrooted default include (**/*.{test,spec}.?(c|m)[jt]s?(x)) and nothing
  // above subtracts it -- any directory in the repo is reachable unless
  // something in this array excludes it by name. Measured with throwaway
  // probes: `.claude/__probe.test.ts` and `ideas/__probe.test.ts` were both
  // collected into `unit` before these entries existed, and the ideas/ probe
  // imported src/gameOfLife -- so it would have run inside Stryker's sandbox
  // too. These two entries are what make CLAUDE.md's merge-protocol
  // mutation-invariant clause's path-allowlist predicate sound for ideas/
  // and .claude/: without them, a stray test file in either directory runs
  // inside Stryker's sandbox while the path check still answers "invariant."
  // `.claude/worktrees/**`, the narrower entry this replaces, is subsumed
  // by `.claude/**` -- a worktree is a whole other checkout with its own
  // node_modules and tests, so collecting one would run another slice's
  // suite as this one's. That has never been measured here; the 3,299-vs-861
  // figure below belongs to the .stryker-tmp sandbox incident, which is the
  // same class of failure from a different source, not to this entry.
  //
  // Trade-off: nothing under .claude/ is a test today, and scripts/ already
  // has its own separate pipeline -- but .claude/ is where agent
  // definitions live, so a future colocated checker test placed there would
  // be silently excluded by this entry rather than picked up. Worth knowing
  // before adding one.
  'ideas/**',
  '.claude/**',
  '.stryker-tmp*/**',
  // playwright-bdd generates .features-gen/<project>/features/<name>.feature.spec.js
  // (the project name is `bdd`, from defineBddProject in playwright.config.ts).
  // vitest's `unit` project inherits the unrooted default include
  // (**/*.{test,spec}.?(c|m)[jt]s?(x)) and nothing else subtracts it, so
  // without this entry those generated specs are collected into `unit` --
  // measured: 63 files instead of 61. The leading dot on the directory name
  // protects nothing (a non-dot directory was collected identically in the
  // same probe); this is the same hazard CLAUDE.md documents for
  // ideas/__probe.test.ts. Belongs in sharedExclude, not `unit`'s own list,
  // for the same reason .stryker-tmp*/** is here rather than scoped to one
  // project.
  '.features-gen/**',
]

const domTests = ['src/components/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'src/hooks/**/*.{test,spec}.?(c|m)[jt]s?(x)']
const propertyTests = ['**/*.property.test.ts']

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
    // .feature files (see playwright.config.ts) -- the whole directory is
    // `product`'s manifest, and the *suffix* is what separates the layers,
    // not the directory. Excluded here so vitest doesn't try to
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
    // .claude, so without sharedExclude's '.claude/**' entry a run from the
    // primary checkout would collect and run another slice's src/ and
    // features/ tests as its own -- see that entry's own comment for why it
    // covers the whole directory rather than just worktrees/.
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
    // SPLIT INTO THREE PROJECTS ON PURPOSE. jsdom construction measured at
    // ~78% of CPU on a run where fewer than half the collected files touch
    // the DOM -- most of the suite (framework-free modules under src/,
    // property tests) never needs a document. Splitting lets only the files
    // that actually render pay for jsdom.
    //
    // `unit` SUBTRACTS domTests+propertyTests rather than declaring its own
    // `include`, on purpose: it inherits configDefaults.include and narrows
    // from there, so a newly added test file lands in `unit` by default and
    // fails loudly with "document is not defined" if it actually needed
    // jsdom. A file can never fall between all three projects and run
    // nowhere.
    //
    // THE ONE THING THAT CAN GO SILENTLY DEAD: `dom`'s include list names the
    // directories src/components/ and src/hooks/ by path. A vitest project
    // whose glob matches nothing exits 0 with no warning -- measured on
    // 4.1.10. Rename either directory and `dom` silently stops running its
    // 23 test files while `npm test` stays green (measured on this tree: `dom`
    // collects 23 files, 175 tests). It stays green only at that
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
          exclude: [...sharedExclude, ...domTests, ...propertyTests],
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
    ],
  },
})
