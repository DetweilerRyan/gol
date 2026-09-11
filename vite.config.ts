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
  // reference-check: allow ideas/__probe.test.ts -- a throwaway measurement probe, never committed to git, so it can never resolve
  //
  // The four entries below exist because vitest's `unit` project inherits the
  // unrooted default include (**/*.{test,spec}.?(c|m)[jt]s?(x)) and nothing
  // above subtracts it -- any directory in the repo is reachable unless
  // something in this array excludes it by name. Measured with throwaway
  // probes: `.claude/__probe.test.ts` and `ideas/__probe.test.ts` were both
  // collected into `unit` before these entries existed, and the ideas/ probe
  // imported src/gameOfLife -- so it would have run inside Stryker's sandbox
  // too. A probe placed in each of rules/ and rule-tests/ was collected the
  // same way, both of them, measured 2026-09-08 by
  // `the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`
  // before it added those two entries. These four entries are what make
  // CLAUDE.md's merge-protocol mutation-invariant clause's path-allowlist
  // predicate sound for ideas/, .claude/, rules/ and rule-tests/: without
  // them, a stray test file in any of those directories runs inside
  // Stryker's sandbox while the path check still answers "invariant."
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
  // before adding one. The same caveat covers rules/ and rule-tests/, which
  // hold only .yml today: a test colocated with the rule it exercises would
  // be excluded here, and belongs under scripts/ast-grep-rule-check/ with
  // the rest of that checker's suite. That cost is the price of the
  // allowlist entry -- an exclusion a future author must not quietly drop.
  'ideas/**',
  '.claude/**',
  'rules/**',
  'rule-tests/**',
  '.stryker-tmp*/**',
  // playwright-bdd generates .features-gen/<project>/features/<name>.feature.spec.js
  // (the project name is `bdd`, from defineBddProject in playwright.config.ts).
  // vitest's `unit` project inherits the unrooted default include
  // (**/*.{test,spec}.?(c|m)[jt]s?(x)) and nothing else subtracts it, so
  // without this entry those generated specs are collected into `unit` --
  // measured by adopt-playwright-bdd, which read 63 collected files against
  // that tree's usual 61. The leading dot on the directory name
  // protects nothing (a non-dot directory was collected identically in the
  // same probe); this is the same hazard CLAUDE.md documents for
  // ideas/__probe.test.ts. Belongs in sharedExclude, not `unit`'s own list,
  // for the same reason .stryker-tmp*/** is here rather than scoped to one
  // project.
  '.features-gen/**',
  // .vale/ holds Vale's synced style package -- a downloaded artifact, gitignored,
  // and third-party YAML this repo does not author. It needs this entry for the same
  // reason ideas/** and .claude/** do, and for one more that makes it sharper: the
  // mutation-invariant merge allowlist in CLAUDE.md's step 5 names `.vale/**`, added
  // by rationale-sidecar-pilot. Without this exclusion a `git add -f`'d test file
  // under .vale/ would be tracked, MATCH that allowlist so stage 5 is skipped, and
  // still be collected here and run inside Stryker's sandbox -- the hole
  // shared-exclude-covers-docs-dirs closed for the other two directories, re-opened
  // by an allowlist entry added without this precondition. Measured 2026-09-08 by
  // split-mutation-testing-article: `npx vitest list` collected
  // `[unit] .vale/__probe.test.ts` before this entry existed.
  '.vale/**',
  // The tracked half of the same hazard, closed by enumeration rather than by
  // rule. Every tracked top-level directory is now either named in this array
  // or deliberately reachable, and the second half of that sentence is the
  // interesting one -- src/, features/ and perf/ stay reachable on purpose,
  // each for its own reason below. Measured 2026-09-11 by
  // vale-styles-is-reachable-by-vitests-default-include, and re-measured
  // under that slice's architectural review: a throwaway __probe.test.ts in each
  // directory named here was collected into `unit` before that directory's own
  // entry existed, and absent after. One probe per directory rather than one
  // probe generalised across the set.
  //
  // NOTHING CHECKS THAT ENUMERATION. It is a snapshot of a date, so a
  // top-level directory added later is reachable until someone names it here.
  // Read that as a cost of the shape rather than as a hole in the merge
  // predicate: the gate-bearing invariant is not this array but check C1 in
  // scripts/mutation-invariance, which verifies each `vitest-exclude` entry of
  // mutation-invariance.config.json against every vitest project's own
  // `exclude`. A directory nobody has named here therefore cannot be secured
  // that way in the first place, which is the allowlist failing safe.
  //
  // Only vale-styles/** is load-bearing today. It is a tracked directory of
  // rule and fixture files, the same shape as rules/** and rule-tests/**
  // above, so it is a plausible next addition to that `vitest-exclude` tier --
  // and C1 can only pass for it once this entry exists. The other five answer
  // no live pairing: adr/**, patches/**, public/**, schemas/** and spikes/**
  // hold no test-shaped filename today. Each carries the same cost the
  // trade-off note above names for .claude/, rules/ and rule-tests/ -- a
  // colocated test placed there later is silently excluded rather than picked
  // up.
  //
  // public/** deserves its own note, because it is the one whose contents
  // reach the shipped build. It is vite's default publicDir (this config sets
  // none), so its files are copied verbatim into the build output -- a
  // mechanism a `test.exclude` array has no reach into at all. Excluding it
  // from test collection changes nothing about what `npm run build` ships.
  //
  // Three directories are deliberately NOT named, and the reasons differ:
  //
  //   src/ is where the tests live.
  //
  //   features/ carries the Gherkin contract and the black-box specs. Its
  //   allowlist entry rests on stryker.config.json's ignorePatterns keeping
  //   the whole directory out of the mutation sandbox, not on this array, so
  //   an entry here would secure nothing that is not already secured. Nothing
  //   under it is collected today in any case -- the *.e2e.spec.ts suffix is
  //   subtracted above, and a step module is not test-shaped.
  //
  //   perf/ is the render-perf harness, and excluding it was measured and
  //   then rejected by that same review. Its only test-shaped files are
  //   *.perf.spec.ts, already subtracted above. It sits on
  //   mutation-invariance.config.json's `absent` list because it is inside
  //   tsconfig.app.json's build scope, so no diff touching it can claim
  //   invariance and no allow entry will ever rest on excluding it. What an
  //   entry would buy is nothing; what it would cost is real, because perf/
  //   holds pure TypeScript modules whose natural unit test is a colocated
  //   *.test.ts with no other home. That file would then run in no project at
  //   all, which is the single failure the `unit` project's subtract-rather-
  //   than-include shape exists to prevent.
  'adr/**',
  'patches/**',
  'public/**',
  'schemas/**',
  'spikes/**',
  'vale-styles/**',
  // The generated half, and the half that has actually bitten: every incident
  // this array records -- the .stryker-tmp sandbox copy, .features-gen's
  // generated specs, .vale's synced package -- was a directory a tool wrote
  // rather than one a person tracked. The entries below are derived from
  // .gitignore's own directory-shaped entries rather than from anyone's
  // recollection, and each was probed the same way as the tracked half above.
  // Each one collected. Unlike the tracked half these cost nothing: no
  // legitimate colocated test can live in a build artifact or an editor
  // directory, so the trade-off note above does not apply to them.
  //
  // dist/** is the sharp one, because a reader can easily believe vitest
  // already handles it. It does not -- see the configDefaults note in the
  // `test` block below.
  'dist/**',
  'dist-ssr/**',
  'dist-perf/**',
  'coverage/**',
  'coverage-scripts/**',
  'reports/**',
  'playwright-report/**',
  'blob-report/**',
  'test-results/**',
  'test-results-acceptance-mutation/**',
  '.vitest-attachments/**',
  '.idea/**',
  '.vscode/**',
  'logs/**',
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
    // checkout. configDefaults.exclude does not reach them, so without
    // sharedExclude's '.claude/**' entry a run from the primary checkout would
    // collect and run another slice's src/ and features/ tests as its own --
    // see that entry's own comment for why it covers the whole directory
    // rather than just worktrees/.
    //
    // DO NOT ASSUME configDefaults.exclude COVERS A BUILD DIRECTORY. On
    // vitest 4.1.10, this repo's installed version, it is exactly two globs:
    // node_modules and .git. Measured 2026-09-11, after this comment had
    // claimed for some time that it also covered dist -- a probe placed in
    // dist/ was collected into `unit`, and the build-output entries in
    // sharedExclude are what subtract it now. Re-measure rather than reading
    // this forward; the list is upstream's and has narrowed before.
    //
    // .stryker-tmp*/ is the same failure with a different source. Stryker
    // sandboxes a full copy of the tree there and only removes it on a clean
    // exit, so any aborted mutation run (a failed dry run aborts before a
    // single mutant executes) leaves one behind -- and the `unit` and
    // `property` projects below inherit configDefaults.include, which is
    // unrooted and matches straight into it. Measured by
    // render-perf-improvements: `npm test` collected 3,299 tests against a
    // leftover src/ sandbox, where that tree's whole suite was 861. The `dom`
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
    // 4.1.10. Rename either directory and `dom` silently stops running every
    // test file it collects while `npm test` stays green -- measured by
    // delete-step-test-layer at 23 files / 175 tests, a figure that moves with
    // the suite, so re-derive it with `npx vitest list --project dom` rather
    // than reading it forward. It stays green only at that granularity,
    // though: the next quality gate fails loudly, because the hook/component
    // coverage those files provide is exactly what keeps crap4ts under its
    // threshold and Stryker above its break score. Renaming
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
          // Pins fast-check's global seed, but only when this process is
          // itself running under Stryker -- see fast-check-stryker-seed.ts's
          // header comment for why an unpinned seed makes a property test
          // structurally unable to kill a mutant in that gate, and
          // vitest.scripts.config.ts for the other setupFiles entry this
          // needs (property tests live in both src/ and scripts/, and this
          // config only reaches the former). A plain `npm run test:property`
          // run stays exploratory -- the guard inside is what keeps it that
          // way, not this config.
          setupFiles: ['./fast-check-stryker-seed.ts'],
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
