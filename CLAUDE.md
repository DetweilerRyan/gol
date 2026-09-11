# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Conway's Game of Life, built as an infinite, pannable/zoomable grid (React 19 + TypeScript + Vite + Tailwind v4). Cells are toggled by click; generations advance manually via the Next generation button.

## Documentation map

`CLAUDE.md` is a **routing index**, not the whole account. It carries the command list, a compact module map, the orchestrating session's own procedures, the conventions, and one pointer per article. The detail lives in `.claude/agents/articles/`, which is **not** auto-loaded — a role reads an article when its own file tells it to.

**This file takes a sidecar of its own**, `.claude/agents/articles/CLAUDE.rationale.md`. That is branch 5 below applied to this file. The sidecar sits in `articles/` rather than beside `CLAUDE.md` at the repo root, and it carries the measurement behind that choice.

Three articles are house rules every role reads unconditionally — **and the orchestrating session reads them too.** They were labelled per-role because the seat that invokes the roles has no role file; the content was never role-specific.

- **`.claude/agents/articles/engineering.md`** — design, test-layer placement, property tests, gate scoping, claim discipline. Its evidence lives in the sidecar `engineering.rationale.md`, which no role reads.
- **`.claude/agents/articles/workflow.md`** — lint/format, role boundaries, commit messages, worktrees and branches.
- **`.claude/agents/articles/handoffs.md`** — handoff shape, concurrent slices, defect adjudication, when blocked.

One article belongs to nobody in `.claude/agents/` at all, because its audience runs the roles rather than being one:

- **`.claude/agents/articles/orchestration.md`** — the invocation contracts roles expect the prompt to satisfy, and the state only that seat carries between stateless invocations. It also covers the escalation lanes that end there, and what that seat runs that no role does. Read at session start and before composing any role invocation.

Ten are topic articles, read on the trigger each one names in its own header:

- **`.claude/agents/articles/architecture.md`** — the cross-module contracts no single hover can state, and the acyclic dependency graph. What one module owns is that module's own JSDoc hover. Read before adding, moving, or splitting a module.
- **`.claude/agents/articles/state-flow.md`** — where state lives, the hooks, the hook-identity contract, and the composition roots. Its sidecar `state-flow.rationale.md` carries the identity-churn measurements, the perf attribution and the resubscribe counts behind those rulings, and no role reads it. Read the article before touching a hook or a composition root.
- **`.claude/agents/articles/testing-layers.md`** — the test layers, the Gherkin contract, playwright-bdd, `.features-gen/`, the step registry, and the `features/screenplay/` decomposition. Its sidecar `testing-layers.rationale.md` carries the test-count history, the barrel curation figures and the fault runs behind those rulings, and no role reads it. Read the article when authoring a `.feature`, a step module, or an e2e spec.
- **`.claude/agents/articles/mutation-testing.md`** — Stryker's incremental cache, the ways a run reports a confident number about nothing, and the `:full` triggers. It also carries the seed-pinning account, the sandbox exclusion, **how to rule a survivor equivalent, and when `it.skipIf` is an accepted idiom**. Read before ruling a survivor equivalent, and at `hardener`'s mutation stage.
- **`.claude/agents/articles/ast-grep-rules.md`** — the rule list check 5 reads, how to read a finding, and how to author a rule that is not silently inert. Its sidecar `ast-grep-rules.rationale.md` carries each rule's scope, what it matches and how it was verified. Read the article before authoring or narrowing a rule, and the sidecar when changing one.
- **`.claude/agents/articles/acceptance-mutation.md`** — the Gherkin Examples-table mutation runner, its guards, and its two mutation classes. Its sidecar `acceptance-mutation.rationale.md` carries the delimiter runs, the decimal regression and the per-assertion measurement behind those rulings, and no role reads it. Read the article before the first `npm run acceptance-mutation` in a slice.
- **`.claude/agents/articles/doc-comments.md`** — the interface/implementation comment split, and what belongs in JSDoc versus `//`. It also carries the hover budget, the paired `<module>.md` / `<module>.rationale.md` sidecar tier, the measured JSDoc syntax hazards, and the hover-before-Read reading habit. Read before writing or moving a comment block in `src/` or `scripts/`.
- **`.claude/agents/articles/prose-linting.md`** — how agent-facing prose is written, and what Vale checks of it. **It owns the instruction-versus-explanation split between every instruction file and its `.rationale.md` sidecar**, which the routing branches above deliberately do not carry. Its mechanical half runs Vale over the agent docs, `CLAUDE.md`, the module sidecars, and the JSDoc blocks in `src/` and `scripts/`. That half says which of the six enabled `STE` rules apply mechanically and which are prompts to look, and lists the exempt classes for each. It also carries the ways a run reports a confident zero, and how a pass damages the file it cleans. `architect` alone authors the tracked `vale-styles/JsDoc` style, on the `rules/*.yml` precedent, and the article carries its fixture run. Read before moving a sentence between a file and its sidecar, before acting on a Vale finding, and before enabling or re-levelling a rule. The file name predates the wider job; `ideas/candidates/` carries the rename.
- **`.claude/agents/articles/quality-tooling.md`** — the crap4ts patch, the advisory `scripts/` programs, `.gherkin-lintrc`, and `.oxlintrc.json`'s `jsdoc/*` tier. Its sidecar `quality-tooling.rationale.md` carries the patch mechanism, the probe methods and the declined-rule roster, and no role reads it. Read the article on an unexpected crap4ts number, on a `jsdoc/*` lint finding, or when touching the lint config.
- **`.claude/agents/articles/archive.md`** — layers that no longer exist, kept for their method. No role has a trigger for this one; it is research material.

**Which files have a sidecar today, and nothing checks this list.** A sidecar is named `<name>.rationale.md` and sits beside its instruction file, except where a checker's path glob forces it elsewhere. No role file names one as a read trigger. **This is the index of which pairs exist. It does not say what fills them** — that is `.claude/agents/articles/prose-linting.md`'s question, under "Instruction stays. Explanation moves.", and no line here should begin to answer it.

- **Articles that have one** — `acceptance-mutation`, `ast-grep-rules`, `doc-comments`, `engineering`, `mutation-testing`, `prose-linting`, `quality-tooling`, `state-flow`, `testing-layers`.
- **Articles that do not** — `architecture`, `archive`, `handoffs`, `orchestration`, `workflow`.
- **Role files that have one** — `architect`, `cleaner`, `hardener`. `coder` and `product` do not. All three sidecars sit in `articles/` rather than beside the role file, and branch 5 says why that placement is forced.
- **`CLAUDE.md` has one**, `CLAUDE.rationale.md`, also in `articles/` — chosen rather than forced.
- **Module sidecars are a different tier**, under branch 4. The live ones are `src/cache.rationale.md`, `src/hooks/useZoomGlide.rationale.md` and `src/scrollbars.rationale.md`.

**Where new documentation goes.** CLAUDE.md is auto-loaded into every session and every subagent, so its size is a tax on all six audiences. Route new prose by this test, in order:

1. Is it a **procedure the orchestrating session executes**, or a **predicate that gates** (a path allowlist a checker or a protocol step reads)? → CLAUDE.md, which is auto-loaded and so is the only surface guaranteed to be read before anything else happens. **Conduct and rationale for that seat go to `orchestration.md` instead.** This clause once claimed that seat had no other instruction surface; `CLAUDE.rationale.md` carries the correction.
2. Is it a **measured fact, a rationale, or a discovery record** about a topic that already has an article? → that article — **or its `.rationale.md` sidecar if it has one, which branch 5 decides.** Read branch 5 before settling this one; it is the narrower rule and it wins where both apply. CLAUDE.md gets **at most one pointer sentence**, and only if a reader would otherwise not know the article covers it.
3. Is it **conduct guidance that applies to more than one role**? → `engineering.md`, `workflow.md`, or `handoffs.md`.
4. Is it **depth about one module** that overflows a JSDoc hover? → a **pair of sidecars beside the source**, split by filename so the register is visible before a word is read. `<module>.md` is for whoever is _calling_ the module, and `<module>.rationale.md` for whoever is _changing_ it. Which half a given sentence belongs in is a question for `prose-linting.md`, not for this branch. Either may be absent, and usually one is. Reference from the JSDoc as `@see {@link ./useZoomGlide.rationale.md}`.

   This is the one documentation surface that lives outside `.claude/**`. Its audience is whoever is holding a call site rather than whoever is running a role.

   **Note what `npm run reference-check` actually reaches.** A **repo-relative** token naming a sidecar is resolved, since `check-md-references` added `.md` to the extractor. But a **leading-dot** token is discarded before any check, so the mandated `@see {@link ./useZoomGlide.rationale.md}` form is unverified. Cite a sidecar repo-relative in a `//` comment for that reason. Nothing checks a sidecar's **contents** either, and basename matching means one moved to another directory still resolves.

   Vale lints `<module>.md` and exempts `<module>.rationale.md`, mirroring the article tier. See `.claude/agents/articles/doc-comments.md`, rule 7. The live instances are `src/cache.rationale.md`, `src/hooks/useZoomGlide.rationale.md` and `src/scrollbars.rationale.md`.

5. Is it **the evidence behind a rule in an article**, rather than the rule itself? → a sidecar `<article>.rationale.md` **beside the article** (`doc-comments.rationale.md` next to `doc-comments.md`).

   **These branches route by topic, and explicitly not by register.** They answer which article a subject belongs to, and where its sidecar file sits.

   They do **not** answer how prose is split between an instruction file and its sidecar. **`.claude/agents/articles/prose-linting.md` answers all of that**, under "Instruction stays. Explanation moves." Open it when you are holding a sentence rather than a subject, and nothing here restates it.

   `archive.md` is the same tier predating the convention, and keeps its name. A rename to fit the convention was considered and declined by the user, since it has no parent article to pair with.

   **A role file takes the same pair, and its sidecar lives in `articles/` — that placement is forced, not preferred.** `scripts/agent-doc-check` reads the direct `.md` children of `.claude/agents/` as the agent roster. A sidecar there fails the frontmatter check outright. The only way to pass it is to give a prose file agent frontmatter, which then enrols it as a sixth agent. Measured both ways.

   **`CLAUDE.md` takes the same pair, and its sidecar lives in `articles/` too — that placement is chosen, not forced.** Nothing refuses a root-level `CLAUDE.rationale.md`, and that is the objection to it: `npm run reference-check` and `npm run agent-doc-check` both scan `CLAUDE.md`, `README.md` and `.claude/**/*.md`, and neither reaches a third root-level `.md`. At the root the sidecar would pass both gates by being invisible to them. So it sits beside the articles, where both checkers reach it. `CLAUDE.rationale.md` carries the measurement and the rejected placement.

   **Two branches can both claim a passage, and this one is the tie-break: subject wins.** A measurement about a single module goes beside that module under branch 4, even when it is also the evidence behind an article's rule. The rule stays in the article, and the worked case goes to `<module>.rationale.md`. `src/scrollbars.rationale.md` under `architecture.md`'s provenance rule is the live precedent. That is a question about what the passage is _about_, which is why it is settled here rather than in `prose-linting.md`.

   **Keeping the pair consistent is manual and nothing checks it.** `prose-linting.md` carries the hand audit and what it is looking for; `CLAUDE.rationale.md` carries the measured drift on the first pair.

6. Is it specific to one role's own responsibilities? → that role's file.

A new topic gets a new article, never a new CLAUDE.md section. When you add one, add its pointer line here **and** the read trigger to every role file that needs it. An article nobody is told to read is worse than no article, because the fact is now invisible rather than merely long.

## Commands

```bash
npm run dev              # start dev server (vite; http://localhost:5173 in the primary checkout, a per-worktree port elsewhere -- see dev-port.ts)
npm run build             # tsc -b && vite build
npm run lint               # gate (nonzero on any error-severity finding): oxlint, whole tree. Includes the jsdoc/* tier -- see quality-tooling.md
npm run format             # prettier --write . (covers .feature Examples-table alignment too, via prettier-plugin-gherkin)
npm run format:check       # prettier --check .

npm test                    # vitest run (all three projects: unit + property + dom -- see `.claude/agents/articles/testing-layers.md`)
npm run test:unit           # vitest run --project '!property' -- fast path for iterative TDD (runs the unit and dom projects, node + jsdom; --exclude flags do not work here, since --exclude is a no-op once `projects` is set -- filter with --project instead)
npm run test:property       # vitest run --project property -- only the property project (*.property.test.ts)
npm run test:coverage       # vitest run --coverage
npm run test:browser        # vitest run --config vitest.browser.config.ts -- only *.browser.test.ts, real Chromium
npx vitest run <path>       # run a single test file
npx vitest run -t "<name>"  # run tests matching a name pattern

npm run test:e2e            # bddgen && playwright test -- BOTH Playwright projects (`e2e`, the hand-written features/*.e2e.spec.ts; `bdd`, the specs playwright-bdd generates from features/*.feature into .features-gen/). Real browser, auto-starts dev server. The `bddgen &&` prefix is not optional and this is the only supported entry point -- see the generated-output guard in playwright.config.ts
<!-- reference-check: allow latest.md -- generated by npm run perf-report and gitignored, so it never resolves against the tracked tree -->


npm run test:perf           # playwright test --config playwright.perf.config.ts -- the render-perf harness (perf/), ~5 min (measured: 28 scenarios in 4.8 min on an M2 Pro), builds and serves a production perf build. Does NOT write reports/perf/latest.md -- it only writes raw samples; run perf-report after it (see `.claude/agents/articles/quality-tooling.md`)
npm run build:perf          # vite build --mode perf --outDir dist-perf (the only build where src/liveCellSeed.ts's seeder survives tree-shaking)
npm run preview:perf        # vite preview --outDir dist-perf --strictPort -- what test:perf's webServer serves
npm run perf-report         # turns reports/perf/raw/*.json into reports/perf/latest.md + latest.json (report-only, tsx scripts/perf-report/run.ts). Required after test:perf -- skipping it leaves the previous run's latest.md in place, which reads as a successful run of the current tree
npm run test:e2e -- features/grid-scrollbars.e2e.spec.ts  # run a single e2e spec (npm appends the argument to the script's tail, so bddgen still runs first; measured). A bare `npx playwright test <path>` never consults .features-gen/ -- also measured -- but the guard in playwright.config.ts refuses the run anyway, deliberately, because the same bare form is what silently skips the whole `bdd` project
npx playwright install chromium   # one-time browser install after npm install

npm run test:mutation       # stryker mutation testing, --incremental (scoped to stryker.config.json's `mutate` list; features/ never reaches the sandbox at all, via that config's `ignorePatterns` -- see `.claude/agents/articles/mutation-testing.md`)
npm run test:mutation:full  # same scope, --force: re-runs every mutant and rebuilds the incremental cache
npm run acceptance-mutation # custom Gherkin-example mutation runner (scripts/acceptance-mutation, tsx scripts/acceptance-mutation/run.ts) -- owned by `product`, not `hardener`
npm run acceptance-mutation -- --feature <name>   # same runner scoped to one target; also accepts --feature=<name>. <name> takes either `infinite-grid` or `infinite-grid.feature`. `--feature` is the only flag and the only way to scope -- argv goes through node:util's parseArgs in strict mode, so a bare positional or an unrecognized flag throws rather than being ignored
npm run gherkin-dry         # checks .feature files for step-text vocabulary duplication (report-only, tsx scripts/gherkin-dry-checker/run.ts)
npm run gherkin-lint        # gate (nonzero on findings): structural/style lint for .feature files, plus no-restricted-patterns' domain-altitude vocabulary check -- gherkin-lint-plus, see .gherkin-lintrc
npm run ast-grep            # structural lint for architectural invariants (report-only, rules/*.yml via sgconfig.yml)
npm run ast-grep:test       # runs rules/ against their rule-tests/ fixtures -- proves each rule still fires
npm run ast-grep:rules      # gate (nonzero on failure): rules/*.yml + rule-tests/ are well-formed and actually live (tsx scripts/ast-grep-rule-check/run.ts)
npm run agent-doc-check     # gate (nonzero on failure): binary facts about .claude/** + CLAUDE.md -- every referenced npm script resolves, agent frontmatter validates, no stale retired-role references, the cycle string matches everywhere, every rules/*.yml is documented in the ast-grep-rules article and every rules/<id>.yml path the docs name resolves (tsx scripts/agent-doc-check/run.ts)
npm run reference-check     # gate (nonzero on failure): every filename-shaped token and <file>'s <symbol> citation in a source comment or doc file resolves against the live tree, no source comment cites a <file>:NN line number, and every allow-marker opt-out is still live rather than stale (tsx scripts/reference-check/run.ts)
npm run mutation-invariance # gate (nonzero on failure): validates mutation-invariance.config.json -- the mutation-invariant merge allowlist -- against the tree, and with `-- --diff <range>` answers whether a landing diff is invariant. Exit 0 invariant, 2 not invariant, 1 the config failed validation so no verdict was computed (tsx scripts/mutation-invariance/run.ts). Run by the orchestrating session at merge step 3, not by any role, and not one of hardener's eight stages
npm run crap4ts             # CRAP complexity/coverage score, src/ only (same files as stryker)
npm run halstead4ts         # Halstead complexity report via FTA, same files as crap4ts (report-only, tsx scripts/halstead4ts/run.ts)
npm run dry4ts              # gate (exits 3 on findings): duplication checker over src/ -- `.dry4tsrc.json` carries failOnFound: true

npm run test:scripts          # vitest run, scripts/ only -- separate node-env config from the src/ suite above
npm run test:coverage:scripts # vitest run --coverage, scripts/ only, writes to coverage-scripts/
npm run crap4ts:scripts       # CRAP complexity/coverage score, scripts/ only
npm run dry4ts:scripts        # gate, same `.dry4tsrc.json` and the same failOnFound: true -- duplication checker over scripts/
npm run test:mutation:scripts # stryker mutation testing, scripts/ only
```

There is no separate typecheck script — `npm run build` runs `tsc -b` as its first step. Lint (oxlint) has type-aware rules disabled by default; see README.md if enabling `oxlint-tsgolint`. An oxlint `warn` exits 0, so only an `error`-severity rule gates anything — measured, and the reason `.oxlintrc.json`'s jsdoc tier is `error` throughout.

## Architecture

**The compact module map.** This is the map, not the account: names, layer, and one clause each. **`.claude/agents/articles/architecture.md`** carries the cross-module contracts and the dependency graph. What a single module owns lives in that module's own hover, not there. **`.claude/agents/articles/state-flow.md`** carries where state lives, the hook contracts, and the composition roots.

Read the article before adding, moving, or splitting anything named here. A bullet here is a routing entry and cannot tell you why a module is shaped the way it is.

**Twenty framework-free modules** hold every non-UI rule in the repo. Sixteen sit at `src/` root:

- `appearance.ts` — light/dark preference resolution
- `gameOfLife.ts` — the Life rules over a sparse `Set<CellKey>`
- `patternLibrary.ts` — the 8-pattern catalog
- `camera.ts` — pan/zoom/wheel over `{offsetX, offsetY, cellSize}`
- `zoomGlide.ts` — the toolbar zoom glide as arithmetic over elapsed time
- `gridGeometry.ts` — visible range and major gridlines
- `cellTiles.ts` — the tile-virtualized mounting policy and its eviction hysteresis
- `cellAnchor.ts` — float32 precision bounding
- `dragGesture.ts` — drag-vs-tap in client pixels
- `scrollbars.ts` — thumb sizing and drag math
- `patternPlacement.ts` — the idle/browsing/placing state machine
- `liveCellStore.ts` — the live-cell state as a factory with two `useSyncExternalStore` pairs
- `liveCellWindow.ts` — which cells get a DOM element at all
- `gridFocus.ts` — the keyboard focus cursor
- `liveCellSeed.ts` — deterministic seeding for the perf harness
- `cache.ts` — a keypath-trie cache

The other four are in `src/equality/`: `container-equality.ts`, `is-shallow-equal.ts`, `is-deep-equal.ts`, `is-strict-equal.ts`.

Six of the twenty import nothing at all — `appearance`, `gameOfLife`, `camera`, `dragGesture`, `cache`, `is-strict-equal`. The rest form a small acyclic graph, and keeping it acyclic is the point of the split.

**Sixteen hooks** in `src/hooks/`, each owning exactly one piece of state or one browser API and delegating the rules down to a module: `useCamera.ts`, `useElementSize.ts`, `usePatternPlacement.ts`, `useWheelInput.ts`, `useGridPointerGestures.ts`, `useInitialCentering.ts`, `useLiveCells.ts`, `useGridFocus.ts`, `useContentBounds.ts`, `useCellTiles.ts`, `useRafCoalescedPan.ts`, `useZoomGlide.ts`, `useReducedMotion.ts`, `useMatchMedia.ts`, `useSystemAppearance.ts`, `useAppearance.ts`.

**Thirteen unit-tested components** in `src/components/`: `GridToolbar.tsx`, `PatternLibraryModal.tsx`, `RulerLabel.tsx`, `Scrollbar.tsx`, `Grid.tsx`, `GridCells.tsx`, `GridLines.tsx`, `HoverIndicator.tsx`, `Cell.tsx`, `PatternPreview.tsx`, `GridRuler.tsx`, `GridScrollbars.tsx`, `GenerationHud.tsx`.

`stryker.config.json` and `crap4ts.config.ts` scope by glob-minus-exclusions rather than by an enumerated list, and `scripts/halstead4ts/run.ts` resolves crap4ts's globs rather than restating them. So a new module at `src/` root, `src/hooks/`, or `src/components/` is covered the day it lands, with no config edit.

`src/App.tsx`, `src/main.tsx` and `src/components/LifeBoard.tsx` are excluded as composition-root and bootstrap code, exercised by browser testing. `src/test-support/` is shared test infrastructure, and nothing in `src/` outside a test file may import from it. `rules/no-test-support-in-product-ts.yml` and `rules/no-test-support-in-product-tsx.yml` check that mechanically. `src/catalyst/` is vendored third-party Tailwind Catalyst UI, deliberately outside every gate — treat it as a library boundary.

Keep new domain logic in a framework-free module rather than in a component, whenever it can be expressed as pure logic. It then stays covered by property tests and mutation testing, not just unit tests.

**The test layers are described in `.claude/agents/articles/testing-layers.md`.** There are three executable layers: unit and property in Node, browser-required unit tests in real Chromium, and black-box Playwright specs. The Gherkin contract in `features/` sits alongside them. It is `product`'s manifest, and playwright-bdd executes it rather than it being a test layer of its own.

### Custom quality tooling in `scripts/`

`scripts/` is TypeScript, not JavaScript, and is its own project. It has a separate `tsconfig.scripts.json`, `vitest.scripts.config.ts`, `crap4ts.scripts.config.ts`, and `stryker.scripts.config.json` from the ones covering `src/` and `features/`. It is the tooling every other role's quality gate runs on, so it is held to the same CRAP threshold (6) as `src/`. That runs via its own parallel commands: `npm run test:scripts`, `npm run test:coverage:scripts`, `npm run crap4ts:scripts`, `npm run dry4ts:scripts`, `npm run test:mutation:scripts`. See `.claude/agents/articles/engineering.md`'s "Working inside scripts/" for exactly which command each pipeline role substitutes for its usual `src/`-scoped one.

Its layout is two levels and no more. **`scripts/<program>/` holds one program's own modules** — its `run.ts` shell plus the pure modules that shell delegates to. **A file at `scripts/` root is shared by two or more programs**, and `scripts/feature-files.ts` is one example. **Imports run program → shared and never the reverse.**

**Nine programs, and only the four below gate.** Four of the other five are advisory — `scripts/acceptance-mutation/` (owned by `product`, not `hardener`), `scripts/gherkin-dry-checker/`, `scripts/halstead4ts/`, and `scripts/perf-report/` — and **`.claude/agents/articles/quality-tooling.md`** describes them. The acceptance-mutation runner has its own article, **`.claude/agents/articles/acceptance-mutation.md`**.

The fifth non-gating program is `scripts/prose-lint/` (`npm run prose-lint`), which runs Vale over the tracked file list: it never fails on a finding, and fails when it cannot lint. **It is also the only program here that is not TypeScript, which `architect` ruled a defect on 2026-09-10.** A `.sh` reaches none of `test:scripts`, `crap4ts:scripts`, `dry4ts:scripts`, `test:mutation:scripts`, or `reference-check`'s comment scan. `ideas/todo/prose-lint-runner-is-shell-not-typescript.md` carries the port.

The four gating checkers keep their full entries here, because they are what polices `rules/`, `.claude/**`, the comment/doc-comment surface, and the mutation-invariance allowlist itself:

- `scripts/ast-grep-rule-check/` (`npm run ast-grep:rules`) — **this is the first of four checks in this list that gate.** Every other check in this list needs judgment to act on. This one is a set of binary facts about `rules/*.yml` and `rule-tests/*.yml`:

  - does every rule have a fixture
  - does its `id` match its filename, and are ids unique
  - does it declare a valid `severity`
  - does its fixture carry an `invalid:` case
  - does every `files:` glob resolve to a real file
  - does a fixture's own `id` name the rule its filename claims to test. ast-grep binds a fixture by `id`, not by filename, so this is the reverse of the fixture-exists check
  - was at least one rule found at all
  - is an `allow-unresolved-files` marker still excusing anything, or has every glob it named since resolved (a stale opt-out)

  So it exits nonzero on any failure, instead of always exiting 0.

  **Rule and fixture files are discovered by reading `sgconfig.yml`'s `ruleDirs` and `testConfigs[].testDir`, then recursing into them.** That mirrors ast-grep's own recursive scan of those directories, verified against 0.45.1. It is deliberately not a hand-maintained list, nor a non-recursive hardcoded `rules`/`rule-tests` pair.

  One exception: each testDir's snapshot subdirectory. That is `__snapshots__` by default, or whatever that `testConfigs[]` entry's `snapshotDir:` names. `ast-grep test` itself never treats those as fixtures, since they are Jest-style snapshot storage, and this checker skips them for the same reason.

  **That skip is scoped to a direct child of a testDir**, since that is the only place ast-grep gives the name a meaning. A rule at `rules/__snapshots__/no-foo.yml` is live in `ast-grep scan` — measured — so exempting it would hide a real rule from every check here.

  The `files:` check has an explicit, reason-required opt-out for a rule authored before the file it scopes exists: `# ast-grep-rule-check: allow-unresolved-files <reason>`. It deliberately does not check `ignores:` globs. An unresolved `files:` glob fails _open_, because the rule then silently checks nothing. An unresolved `ignores:` glob fails _safe_, because the rule just over-applies, which shows up as noisy findings.

  **One asymmetry to write a `files:` glob around.** This checker resolves those globs with `node:fs`'s `globSync`, whose `*` does **not** cross `/`, while ast-grep's own `*` does. So a rule scoped `src/*.test.tsx` is live for the scanner and reads as matching no file here. That is the checker being stricter than the scanner rather than wrong, and it fails **safe**. It refuses a glob whose reach depends on which reader you ask. The fix is the `**` form, never a relaxation here.

  Owned by `architect`, the only role that authors rules.

<!-- reference-check: allow no-foo.yml -- illustrative hypothetical rule filename, not a real file -->

- `scripts/agent-doc-check/` (`npm run agent-doc-check`) — **the second of four checkers in this list that gate**, over `.claude/**` + CLAUDE.md itself rather than over `rules/`. Five binary facts:

  1. Every `npm run <script>` reference in `.claude/**/*.md` + CLAUDE.md names a real `package.json` script. `.claude/worktrees/` is excluded: it is a sanctioned slice-worktree location holding whole other checkouts, with their own `.claude/` and their own `node_modules`, rather than this repo's docs.
  2. Every `.claude/agents/*.md` file's frontmatter validates — `name` matches the filename, `description` is non-empty, `tools` is a subset of the known tool set, and `model` is one of `opus`/`sonnet`/`haiku`. It is parsed with a bespoke line-anchored reader rather than a real YAML parser. Several agent descriptions contain a literal `": "` that a real YAML parser reads as a nested mapping and refuses. `CLAUDE.rationale.md` carries the measurement.
  3. No backticked mention of a retired role (`qa`, `refactorer`, `specifier`) without a historical qualifier (old/former/then/merge/...) on the same line. That is a short, git-verified list of every role ever deleted from `.claude/agents/`, not a generic "role-shaped token" scan. That generic form was tried and rejected; `CLAUDE.rationale.md` carries what it flagged.
  4. The role-cycle string (`product → coder → cleaner → architect → hardener → product`) is byte-identical everywhere it appears. It is built from whichever roles currently exist rather than a hardcoded chain, so a role rename is picked up for free.
  5. Every `rules/*.yml` is named in the rule documentation article, `.claude/agents/articles/ast-grep-rules.md`. The invariant is "documented somewhere roles will read". `run.ts`'s `RULE_DOC_PATH` reads that file through an `existsSync` guard that throws by name, rather than a glob that could match nothing and report a clean run. Every explicit `rules/<id>.yml` path mentioned in **any** doc file must also resolve to a real file, attributed to the file it was found in.

  Same shape as `ast-grep-rule-check` deliberately — pure `decide()` over parsed input, I/O isolated to `run.ts`, one file per parsing concern.

  **Check 1 has no notion of "just an example".** A hypothetical script name written in prose without angle brackets reads exactly like a real reference. It fails the gate the same way a genuine typo would. Write a hypothetical one as `npm run <script-name>` instead. See `npm-run-refs.ts`'s module comment; this checker's own development tripped over exactly that.

- `scripts/reference-check/` (`npm run reference-check`) — **the third of four checkers in this list that gate**, over the comment surface itself rather than over `rules/` or `.claude/**` alone. The defect it exists to catch: a comment or a doc line names another file, or a symbol inside one. That target is then renamed or deleted, and nothing notices.

  It scans comment lines only — trimmed start `//`, `*`, `/*`, or `#` — in every `.ts`/`.tsx`/`.yml`/`.yaml` file under `src/`, `scripts/`, `features/`, `perf/`, `rules/`, `rule-tests/`, and at the repo root, minus `src/catalyst/` (the vendored library boundary). It also scans **every** line of `CLAUDE.md`, `README.md`, and `.claude/**/*.md`, minus `.claude/worktrees/` (the same sanctioned exclusion `agent-doc-check` carries). A doc file's prose is itself the thing being checked, rather than commentary around code.

  Four checks, plus a double inertness guard shared with `ast-grep-rule-check`'s `checkAnyRulesFound` via `gate-report.ts`'s `checkNonEmpty`:

  - **`file-reference-resolves`** — every filename-shaped token must resolve, by basename, against `git ls-files --cached --others --exclude-standard`. That is the live tree, deliberately, and not git history. Resolving against history would spare a stale present-tense claim about a file deleted for the wrong reason. That is the exact defect this checker exists to catch, and it would turn the check into typo detection instead.
  - **`cited-symbol-exists`** — a `<file>'s <symbol>` citation must name a symbol that actually appears, as a whole word, in the cited file's own text.
  - **`no-file-line-references`** — source comments only. A `<file>:NN` line-number citation is banned outright, whether or not it currently resolves. Unlike the `'s` form, it does not survive a line being added above it.
  - **`stale-allow-marker`** — an opt-out marker is a failure in its own right, rather than a pass, in three cases. It carries no reason, its token now resolves, or its token appears nowhere else live in the file.

  The opt-out marker is `` `reference-check:` `` then `` `allow <token> -- <reason>` ``. It is written here as two adjacent code spans, for the same reason the checker's own `allow-markers.ts` module header is. This checker scans `CLAUDE.md`, so the two keywords written contiguously in a comment would read as a live, tokenless marker. It would then report itself as stale.

  **Matching is by basename everywhere in this checker, never full path**, which deliberately under-reports. A false negative on a same-named file living in a different directory is the safe failure direction.

  Sits at `hardener`'s stage 2, immediately after `build` and ahead of every other stage — see the hardener stage list below for why.

- `scripts/mutation-invariance/` (`npm run mutation-invariance`) — **the fourth of four checkers in this list that gate**, and the only one no role runs. It owns `mutation-invariance.config.json`, the allowlist behind the merge protocol's stage-5 exemption, and it exists because that list was prose restated in three files that drifted apart. Two modes, one command. With no argument it validates the config against the tree. With `-- --diff <range>` it also answers whether a landing diff is mutation-invariant. **Exit 0 invariant, 2 not invariant, 1 the config failed validation so no verdict was computed.** Read 1 as "run stage 5", never as a pass. The verdict sits in the exit code rather than in a string on stdout, for that reason. Seven checks, and the tiers are what make them possible. An entry declares how it is secured. A `vitest-exclude` entry is verified against **every vitest project's own `exclude`**, not against `vite.config.ts`'s shared constant. That distinction is the point. A project that stopped spreading the constant is the regression this catches, and checking the constant stays green through it. A `stryker-ignore-patterns` entry is verified against a last-wins walk of those patterns, negations included, and a `written-argument` entry against the tracked-file set. **That third tier is honest about what it does not prove.** It verifies only that a fixed filename can never become a test. That nothing in the run consults the file is an inventory on a date. `package.json` is the standing counterexample: a fixed filename on the absent list precisely because it can move the score. So a green exit is not a proof for that tier. **The report does not say which tier an entry is in** — it prints one line, the same line either way. Read the tier off the config. The `vitest-exclude` tier carries a narrower version of the same gap, which `.claude/agents/articles/mutation-testing.md` states along with the inventory it rests on. Check C4 binds each entry to its argument in `.claude/agents/articles/mutation-testing.rationale.md`, the same shape as `agent-doc-check`'s check 5. The inertness guard covers three collections, not one. An empty project list or an empty tracked-file set would make two checks pass vacuously. That is the fail-open direction this whole predicate is built against. The orchestrating session runs it at merge step 3. It is **not** one of `hardener`'s eight stages, and it grants nothing. `hardener` still runs stage 5 absent an instruction.

Eight of the nine run via `tsx`, each as `tsx scripts/.../run.ts`: `npm run halstead4ts`, `acceptance-mutation`, `gherkin-dry`, `perf-report`, `ast-grep:rules`, `agent-doc-check`, `reference-check`, `mutation-invariance`. The ninth, `npm run prose-lint`, is the `sh` script ruled a defect above. Each of those **eight** has its own `.test.ts` unit tests, runnable via `npm run test:scripts`, which is a dedicated Node-environment vitest config. The ninth has none, and cannot: `npm run test:scripts` is a vitest config over TypeScript, so a `.sh` program is unreachable by it. That is the same defect, seen from the test side rather than the gate side. `vite.config.ts` excludes `scripts/**` from the main `npm test` and `npm run test:unit` run, so scripts' tests no longer run there.

**The ast-grep structural rules.** `sgconfig.yml` + `rules/*.yml` are a tenth checker, and the only one that is not a `scripts/` program. [ast-grep](https://ast-grep.github.io) structural rules encode the architectural invariants that were previously prose only.

Report-only **for findings**. Every rule is `severity: warning`, so a rule matching your code does not move the exit code — read the output rather than `$?`. The exit code answers a different question. Measured against ast-grep 0.45.1, **8** means a rule file failed to parse and **1** means an `error`-severity rule matched. So a nonzero exit always warrants investigation.

**Every rule's scope, what it matches, how it was verified, and the measured argument behind it live in one place.** That place is `.claude/agents/articles/ast-grep-rules.rationale.md`, the sidecar beside `ast-grep-rules.md`. `ast-grep-rules.md` is also the file `npm run agent-doc-check`'s check 5 reads, so a rule added to `rules/` without a mention there reds the gate. That article is the one place the rules are enumerated. An index here would be a second copy of the same list, maintained by hand and checked by nothing. Rule files themselves belong to `architect` alone.

Note which rules fire on ordinary feature work rather than only on structural change:

- the two `no-manual-memo` rules, which are unscoped by path
- `no-logic-in-composition-root`, which covers exactly the kind of UI wiring a slice normally adds
- `no-unbraced-accessible-name`, the moment a component grows a new `aria-label`, `role`, `title` or `aria-valuetext`
- `no-unbraced-name-from-contents`, the moment one grows a heading or a button whose own text is its name — if anything the commoner of the two

`no-dead-doc-on-annotated-return-literal` joins that list from the other direction. It fires on documentation rather than on code. The trigger is a new hook with an annotated return type carrying a JSDoc block on a property of its `return { … }` literal. The measured evidence says that placement reaches no caller.

That is why `coder` runs `npm run ast-grep` in its own workflow rather than waiting for `architect`. See "Structural rules (ast-grep)" in `.claude/agents/articles/engineering.md` for the shared convention on reading a report-only checker. Note that rule files themselves belong to `architect` alone.

## Idea board

`ideas/` is a two-lane kanban of slices not yet started — one Markdown file per idea, and the lane is the directory:

- **`ideas/candidates/`** — raw and unjudged, no limit. An idea lands here the moment it is worth not forgetting.
- **`ideas/todo/`** — examined, and concrete enough to hand to `product`. The orchestrating session owns this board: no role reads it, and an idea reaches `product` as prompt content rather than as a file path. Keep this to about three, matching the two-or-three concurrent-slice ceiling below. A `todo/` lane longer than the number of slices you can actually run is a candidates lane wearing a different hat.

`ideas/TEMPLATE.md` is the file shape: frontmatter (`name`, `title`, `created`) over Context / Sketch / Touches / Open questions.

**There is deliberately no `doing/` or `done/` lane.** `git worktree list` already says what is in flight, and `git tag -l 'slice/*'` already lists what is finished. A lane duplicating either is a second source of truth that can disagree with the first.

**`name` is the slice's identity end to end.** It matches the file's own basename, becomes the branch in `git worktree add -b <slice>`, and becomes the `slice/<name>` tag at merge. One slug from idea to tag, so `git log` and the board agree on what a thing is called.

Two rules keep the board honest:

- **Promote with a move-only commit, then edit.** Run `git mv ideas/candidates/<name>.md ideas/todo/<name>.md` and commit _that alone_, before fleshing the file out. Git infers renames from content similarity, and a candidate being expanded into a todo is precisely the case that defeats it.

  Git records a move made in its own commit as a rename, and the history survives. It records a move plus a rewrite as delete-plus-add, and the history does not. `CLAUDE.rationale.md` carries the similarity scores. (You need `--follow` to read across the move either way; a plain `git log -- ideas/todo/<name>.md` starts at the promotion regardless.)

- **The slice deletes its own idea file.** Run `git rm ideas/todo/<name>.md` as part of the slice's work. The deletion then lands on the branch alongside the change it describes. The `slice/<name>` tag in merge-protocol step 6 then marks a tree that no longer carries it. The tag is the permanent record and carries its own message. A file left behind becomes a third lane nobody maintains.

<!-- reference-check: allow Backlog.md -- an external project on GitHub, linked by URL on the same line; not a file in this repo -->

The lane-as-directory choice runs against the prevailing convention. [Backlog.md](https://github.com/MrLesk/Backlog.md), [MADR](https://adr.github.io/madr/), and most git-native trackers keep a `status:` field and never move the file. Moves conflict when several people edit one board. That objection does not reach this repo: slices land **serially** (see the merge protocol), and the board has a single editor. Since the directory _is_ the status, **do not also put a `status:` field in the frontmatter** — one fact, one home.

Nothing enforces any of this. `ideas/` has no gate, no checker, and no test. Prettier formats the Markdown, and its ignore list is exclusion-based, so a new top-level path is covered with no config edit. That is the extent of the tooling.

A board-rendering script would have to live in `scripts/`, which would subject it to CRAP ≤ 6, its own vitest suite, `dry4ts`, and mutation testing. That is more machinery than the board is worth. `ls ideas/todo/` is the board.

## Subagent pipeline

`.claude/agents/` defines a five-role pipeline adapted from unclebob/swarm-forge's six-pack branch. It is scoped to this repo's actual commands — Gherkin features, `crap4ts`, `halstead4ts`, `dry4ts`, Stryker, `acceptance-mutation`, Playwright — rather than swarm-forge's tmux and file-based-handoff orchestration. Worktrees are used, but per _slice_ rather than per _role_; see "Running slices concurrently" below.

Each role's full instructions and boundaries live in its own file. Read the relevant one before invoking it, rather than relying on this summary. Shared house rules ported from swarm-forge's `main`-branch constitution live in `.claude/agents/articles/`: `engineering.md`, `workflow.md`, `handoffs.md`. Every role reads those three unconditionally.

The same directory also holds nine **topic** articles, which a role reads only when its own file names the trigger. It also holds `orchestration.md`, addressed to the session that invokes the roles rather than to any role. See the Documentation map above for the list and what each one is for.

Cycle order for a feature: **product → coder → cleaner → architect → hardener → product** — `product` opens and closes every slice, in its SPECIFY and VERIFY modes respectively.

1. `product` (**SPECIFY** mode) — drafts or revises `features/*.feature` scenarios, the `features/steps/*.ts` step modules playwright-bdd compiles them against, and a plain-English end-to-end outline. It runs the **acceptance spike** and `acceptance-mutation` scoped to the feature. It stops for explicit user approval before handing off. Never writes `src/` or `scripts/`.
2. `coder` — implements one approved slice via TDD; never writes anything under `features/` and never runs the quality-gate tools.
3. `cleaner` — structure-preserving cleanup only (CRAP/DRY/scoped mutation scan on touched files); no new functionality. This is the four-pack's old `refactorer`, narrowed: it no longer runs a full mutation suite, only the scoped scan.
4. `architect` — **four modes: REVIEW, DESIGN, CONTRACT, ADJUDICATE.** In its normal slot it reviews module boundaries, dependency direction and property-test coverage. It also reads `halstead4ts`'s Halstead report as an advisory, no-threshold complexity signal alongside that review. Unlike the old four-pack architect, it does **not** run the full quality gate itself — that moved to `hardener`.
5. `hardener` — owns the full final verification sequence, **eight stages**: `build` → `reference-check` → `test:property` → `test:browser`/`test:scripts` → `test:mutation` → `crap4ts` → `dry4ts` → `agent-doc-check`, in that order, fixing whatever each stage surfaces before moving to the next. It does **not** run `acceptance-mutation` — that belongs to `product`.
6. `product` (**VERIFY** mode) — builds and runs `features/*.e2e.spec.ts` (Playwright) from its own outline, as the final independent black-box check through the real UI. It runs the full `acceptance-mutation`, and re-confirms `crap4ts` and `dry4ts` clean before declaring the feature done. It **reports** `src/` defects to `architect` rather than fixing them. `architect` rules on whether the code or the contract is wrong, in its ADJUDICATE mode. See `.claude/agents/articles/handoffs.md`'s "Defect adjudication".

There is no daemon or persistent process wiring these together. The orchestrating session invokes each role in turn via the `Agent` tool, and sequences the handoffs itself.

### The optional architect design pass

> `architect` has four modes. **DESIGN** ratifies an _implementation_ — a file set, interfaces, an ordering — and is what this section is about. **CONTRACT** ratifies a _specification_ during `product`'s acceptance spike. It asks three questions. Is the drafted contract observable through the UI at all? What accessible affordance does it need that does not exist? Is it at the right altitude for Gherkin? **ADJUDICATE** rules on a defect `product` reports at the end of the cycle. A slice may use several. Contract review comes first, since there is no point planning an implementation for a contract that cannot be verified.

The orchestrating session may invoke `architect` a **second time, before `coder`**, as a design pass that ratifies a file set and interface rather than reviewing landed code. It still runs in its normal post-`cleaner` slot afterward, so the slice gets both a design and a review. The two jobs compete for one pass otherwise. That is the same reasoning that split `hardener` out of the four-pack architect.

**The orchestrating session decides this, not `product`.** Every trigger below is a fact about the current shape of `src/`, and `product` is deliberately blind to it. It reads `src/` but never writes it, precisely so its reach stays honest. `product` may _flag_ that a slice smells structurally large; it does not make the call.

Reach for a design pass when:

- The slice is a refactor or restructure with no behavior change. Then the design **is** the deliverable, and there is nothing for `coder` to TDD against without one.
- It will create new modules, or move/split existing ones.
- It crosses the framework-free module → hook → component layering.
- A target file is already flagged as oversized — `cleaner`'s 100+ mutant heuristic, or `coder`'s ~1s per-file test-duration budget.
- The change spans three or more existing modules.

A design pass writes **no product code**. Its output is a ratified file set, the interfaces between the new pieces, and an ordering of behavior-preserving steps. Each step must leave the suite green. Where useful it also produces a mechanical guard — an `ast-grep` rule and fixture — for an invariant the design depends on. `coder` then executes that ordering, usually in more than one invocation, with the existing test suite as the regression net at each step.

The `split-grid-render-props` slice is the worked example. The design pass corrected the prop shape before any code existed, and split the riskiest step in two so the pre-existing tests could verify it. It also authored `rules/no-logic-in-composition-root.yml`, to keep the new composition root wiring-only.

**All five roles carry the `LSP` tool** in their frontmatter allowlist. That gives them go-to-definition, find-references, and type errors reported in-turn rather than at the next `npm run build`. Every role writes TypeScript. The four implementing roles write `src/` and `scripts/`, and `product` writes the `features/steps/*.ts` step modules and the Playwright specs.

What separates them is no longer the tool allowlist. It is the **write boundary**, stated in prose: `product` reads `src/` freely and writes nothing there or in `scripts/`, in either mode. A tool allowlist used to carry that boundary instead, and the merge that created `product` made the arrangement dishonest in both directions. `CLAUDE.rationale.md` carries the account.

This needs the `typescript-lsp` plugin installed (`/plugin`), plus a **global** `npm install -g typescript-language-server typescript`. The binary is not a project dependency, so `npm ci` alone does not reproduce it on a new machine. If the server is missing the roles silently fall back to `Grep` and `Read`, so a clean `npm test` is not evidence it is working. Check `claude --debug`, which names any LSP server it skipped and why.

The file names in the compact module map above are a current snapshot, not a frozen contract. `cleaner` and `architect` are expected to update both that map and the article behind it, as part of performing a behavior-preserving split. The article is `.claude/agents/articles/architecture.md` or `state-flow.md`. They must also fix any file-list mention elsewhere in these docs that a split makes stale. See "Where guidance and file names live" in `.claude/agents/articles/engineering.md`.

## Running slices concurrently

You can work two or three slices at once: **one slice = one git worktree = one branch = one Claude Code session.** Every role in a cycle runs inside that slice's worktree and commits to that slice's branch. Only the merge protocol below writes to `main`, and the orchestrating session drives it. The role-facing half of this lives in `.claude/agents/articles/workflow.md` ("Worktrees and branches") and `handoffs.md` ("Concurrent slices").

Isolation is what makes it safe. Each worktree gets its own `node_modules`, `coverage/`, `reports/` (including the Stryker incremental cache and `reports/perf/`), `test-results/`, `.stryker-tmp*`, `dist/`, and `dist-perf/`. Those are all fixed relative paths, so separate checkouts separate them for free.

The one thing a worktree does **not** separate on its own is a TCP port. That is why `dev-port.ts` derives per-checkout ports in three disjoint ranges: a dev-server port (5173+), a Vitest browser-API port (21000+), and a `vite preview` port (41000+, used by `playwright.perf.config.ts`). The primary checkout keeps 5173, and each linked worktree hashes its own directory to its own slot. `vite.config.ts` sets `strictPort` on both the dev server and the preview server.

Without that, `playwright.config.ts`'s `reuseExistingServer` finds another worktree's server answering on 5173, attaches, and reports a green e2e suite against the wrong build.

### Setting up a slice

```bash
git worktree add ../gol-claude-worktrees/<slice> -b <slice> main    # or .claude/worktrees/<slice>
cd ../gol-claude-worktrees/<slice> && npm ci && vale sync
```

`vale sync` is **not** optional and `npm ci` does not cover it. `.vale/` holds the downloaded style package and is gitignored, so a fresh worktree has none. A run without it reports zero findings through a `grep -c` pipeline, rather than an error. `.claude/agents/articles/prose-linting.md` carries that mechanism, and the other ways a run reports a confident zero.

Then start a session there, or `EnterWorktree({ path: '../gol-claude-worktrees/<slice>' })`. Both locations work and both are ignored by git, Prettier, oxlint, and vitest. `npx playwright install chromium` is **not** needed — that binary lives in a machine-global cache.

If you use the native `EnterWorktree({ name })` or `Agent({ isolation: 'worktree' })` path, set `"worktree": { "baseRef": "head" }` in `.claude/settings.json`: the default `fresh` branches from `origin/<default-branch>`, which is stale unless `main` is pushed after every merge.

### Merge protocol

**Slices land one at a time, serially.** Parallelism buys concurrent _authoring_, not concurrent _landing_ — the second slice to land pays a full re-verification. That cost is why two or three is the sensible ceiling.

1. **Rebase, do not merge.** In the slice's worktree: `git fetch && git rebase main`. This keeps `main` linear, which is what `workflow.md`'s "a prior role's commit" ordinal reasoning assumes, and keeps each slice's `By <role>.` chain readable in order.
2. **The slice's own session resolves its own conflicts**, in its own worktree — it has the context the orchestrator does not. `main` never enters a conflicted state.
3. **Re-run the gate on the rebased branch, still in the worktree.** Invoke `hardener` again. It must use `npm run test:mutation:full`. The rebase brought in another slice's moved and renamed files, which is exactly the file-level assumption the incremental cache cannot survive. **The one exception: if the merge is mutation-invariant, stage 5 does not run at all.** See the clause under step 5, and evaluate its predicate here, at this step.

   Pay attention to `npm run ast-grep:rules` here specifically. It is the gate most likely to have been broken by the _other_ slice's renames invalidating a `files:` glob. Post-rebase, that breakage is legitimately yours.

4. **Fast-forward `main`:** `git checkout main && git merge --ff-only <slice>` from the primary checkout. `--ff-only` is the assertion that step 1 actually happened.
5. **Run the full gate on `main`.** Mandatory, even though step 3 just passed on an identical tree — step 3 ran against a different Stryker cache and a different `coverage/`. This run is what rebuilds `main`'s own caches into a state the next merge can trust. **The one exception: if this is a mutation-invariant merge, skip the deletion below entirely.** Read the clause below before running it:

   ```bash
   rm -f reports/stryker-incremental.json
   ```

   then invoke `hardener` on `main` with the whole tree as its scope. Deleting the cache is the honest expression of intent. It is not stale; it is describing a tree that no longer exists, which is the situation `.claude/agents/articles/mutation-testing.md` already names.

   **One path, not two, and that is deliberate.** `npm run test:mutation:scripts` passes no `--incremental` flag, so the `scripts/` side **never writes `reports/stryker-incremental-scripts.json` at all** — see `.claude/agents/articles/mutation-testing.md` for the source-level verification of that. Adding the flag is what re-arms this deletion, so a slice that adds it must put the second path back here.

   **Mutation-invariant merges — the one exemption, and it is stage 5 only.** Steps 3 and 5 both mandate `npm run test:mutation:full`, and for some diffs that is two full runs measuring a quantity that provably did not move. `stryker.config.json`'s `mutate` list covers only `src/**`, and its `ignorePatterns` keeps `features/` out of the sandbox entirely. So for a diff confined to the paths below, neither a mutant nor a test that could kill one is reachable.

   **The predicate quantifies over `npm run test:mutation`, the `src/` run, and that scope is load-bearing rather than incidental.** `stryker.scripts.config.json` carries no `ignorePatterns` at all. Two `scripts/` tests read `features/*.feature` from the live tree. So a `features/**`-only diff can change a `scripts/` test's outcome, and therefore a mutant's fate, under `npm run test:mutation:scripts`. Nobody has ruled on whether the whole-tree gate at step 5 includes that run. Until someone does, **read every entry below as argued for the `src/` run only**, and treat `features/**` under the `scripts/` run as unverified rather than safe.

   Left unaddressed this is not merely a cost. It is a standing incentive to bundle unrelated features into one slice, to pay the bill once. That is the opposite of what the serial-landing rule is for.

   **The predicate is an allowlist of paths that cannot move the score, not a list of the paths that can.** That direction is the whole design. A blocklist fails **open**: a path nobody thought to list silently skips the mutation gate, and a skipped run reads exactly like a passing one. That is the same dangerous direction as the `ignorePatterns` glob that matches nothing, already described in `.claude/agents/articles/mutation-testing.md`. An allowlist fails safe: an unanticipated path simply runs the gate.

   **The predicate is computed, not recalled.** The allowlist lives in `mutation-invariance.config.json`, and `npm run mutation-invariance` evaluates it. Run it in the slice's worktree, after step 1's rebase:

   ```bash
   npm run mutation-invariance -- --diff main...HEAD
   ```

   Exit **0** means the diff is mutation-invariant. Exit **2** means it is not, and the output names the first disqualifying path. Exit **1** means the config itself failed validation, so **no verdict was computed** — read that as "run stage 5", never as a pass. Redirect to a file and read `$?` on the next line. A pipe replaces the exit status with the pipe's own.

   **The list is not restated here, and that is deliberate.** It once lived in this file, in `mutation-testing.md` and in `hardener.md` at the same time, and the three drifted apart. Each entry's argument now lives in `.claude/agents/articles/mutation-testing.rationale.md`, which the checker binds to the config: its check C4 fails when a config path has no prose there. So add an entry by editing the config and writing its argument, never by editing prose alone. **Adding a path requires the argument, not the intuition.** The failure mode of a wrong entry is a skipped stage that reads exactly like a passing one.

   **`mutation-invariance.config.json` and `schemas/**` are themselves on the absent list.** A diff that widens the allowlist therefore re-arms the full run in that same diff. Without those two entries, the first slice to edit the allowlist would be granting itself an exemption.

   **A comment-only edit under `src/` cannot move the mutation score, and that is a ruling with an argument rather than an intuition.** Ruled 2026-09-09 by the user. Stryker's mutators operate on AST nodes: arithmetic, conditionals, literals. A comment is not one, so a comment-only diff creates no mutant, removes none, and re-fates none. **This is not an allowlist entry.** `src/**` stays off the list, and the exemption is claimed per diff, by demonstrating the diff is comment-only rather than by matching a path.

   **One carve-out, and it is why the demonstration has to be per diff.** A comment carrying a _directive_ is not inert. `// prettier-ignore`, `@ts-expect-error`, an `eslint-disable`, and this repo's own `` `reference-check:` `` and `# ast-grep-rule-check:` markers all change what a tool does. Any of those re-arms the full run. So show the diff contains no such line before claiming this, the same way the path predicate is computed rather than recalled.

   **Every other stage still runs — but re-derive which of them can actually move, because the old argument here died with the `acceptance` project.** That argument was that `npm run test:coverage` ran four projects, the `acceptance` one mounted `<App />`, and its coverage landed on `src/`. So `crap4ts` genuinely moved on a `features/`-only diff.

   `delete-step-test-layer` removed that project. **Measured on the landed tree, `coverage/coverage-final.json` now contains zero `features/` entries.** No vitest project loads anything in that directory, so a `features/`-only diff moves neither `crap4ts` nor `dry4ts`, which scores `src` alone.

   What still moves on such a diff is **`npm run build`**: `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error there fails stage 1. For the `.claude/**` and `CLAUDE.md` entries, **`npm run agent-doc-check`** moves too.

   **That list is per-entry, not universal, so re-derive it for the entry you are exempting.** A `rules/**` or `rule-tests/**`-only diff moves a different set. `build` is not among them, since `tsconfig.app.json`'s `include` names neither directory. **Stage 2, `npm run reference-check`, does move**, because a deleted rule file breaks any doc line citing its filename. So does **stage 8, `npm run agent-doc-check`**, whose check 5 reads the live `rules/` listing against `.claude/agents/articles/ast-grep-rules.md`.

   Note this does not weaken the exemption. The predicate is an allowlist of paths that cannot move the **mutation score**, and that is more clearly true now, not less. It does mean the honest claim is narrower than it used to be. This exempts one stage from one run, and the stages that remain are fewer than the sentence this replaces implied. It is still not a fast path through the gate.

   **Compute the predicate once, in step 3's worktree after the rebase, and carry the answer to step 5.** Step 4 is a fast-forward, so the tree step 5 gates is byte-identical to the one step 3 gated. There is no second diff worth taking, and reconstructing one from `main`'s reflog is a worse way to ask the same question.

   **When stage 5 is skipped, step 5 does not delete the incremental cache.** The `rm -f` above exists because the cache describes a tree that no longer exists. Under this predicate **no mutated file and no collected test differs** from the one it was built from.

   State it that way, and not as "the tree Stryker sees is byte-identical". That stronger claim is literally false, and false in the dangerous direction. `ideas/`, `.claude/` and `CLAUDE.md` are tracked and _are_ copied into the sandbox; only `/features` is ignored. A reader might check the stronger claim, find it false, and reason "well, these are in the sandbox too". That would extend the allowlist by exactly the wrong logic.

   Deleting the cache would tax the next merge with a full cold run in exchange for nothing. That answers step 5's own "different cache" justification on its own terms, rather than waiving it.

   **`hardener` may refuse an exemption; it may never grant itself one.** The rule is deliberately asymmetric, because the two errors differ. Wrongly granting is silent and permanent; wrongly refusing costs one mutation run.

   So the orchestrating session evaluates the predicate and hands it to `hardener` in the invoking prompt, naming the diff it was computed over. Absent that instruction, `hardener` runs stage 5, full stop. But `hardener` **may** check the handed-down claim against `git diff --name-only`, and **must** run stage 5 anyway if it can falsify it. A verification that comes back "invariant" grants nothing on its own; only the instruction does.

   That is the narrower prohibition the safety argument actually justifies. A role that can excuse itself from its own gate is not a gate, which says nothing about a role that can decline an excuse.

   **Record every skip, and know which option was not taken.** A skipped stage produces no artifact, which is the same property that makes wrongly granting an exemption dangerous. So `hardener`'s handoff must name the skip, the instruction it was handed, and the diff that instruction covered, and this merge carries that forward. A written record is not a score, but it makes a skip distinguishable from a pass, which was the actual gap.

   **The middle option was considered and is not what this clause does.** Since the cache is retained here by design, a plain `npm run test:mutation` would still produce a real score — most of the saving _plus_ the missing evidence. Its cost argument got considerably stronger once `pin-stryker-seed-to-unblind-the-mutation-gate` removed the `@fast-check/vitest` floor. A warm run on an unchanged tree is now 24s, rather than the ~3m45s that paragraph used to record.

   It is still not adopted, for a reason the collapse does not touch and which is specific to step 3. That branch was **just rebased onto a `main` that moved**, so the worktree's cache is stale with respect to everything the rebase brought in. That is the protocol's own stated reason for mandating `:full` there. The 24s figure is measured for a warm cache on an unchanged tree, and says nothing about that case.

   The argument is much stronger at step 5, where `main`'s own cache differs from the tree by exactly the invariant diff. So the middle option is really a step-5 proposal. It changes what the gate measures, so it is a slice of its own rather than a paragraph here.

   **The exemption is self-revoking.** If `hardener`'s own remediation at any stage writes a file outside the allowlist, the exemption is void from that point and stage 5 runs.

   This is not hypothetical, and **the trigger is stage 1**. `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type error a `features/`-only diff introduces is a real `npm run build` failure, and its fix can reach `src/`. That adds a file Stryker mutates, _after_ the stage that would have measured it was skipped.

   **Stage 6 was the example this clause used to give, and the paragraph above now refutes it.** That example rested on the `acceptance` project, whose removal left `coverage/coverage-final.json` with zero `features/` entries, so `crap4ts` cannot legitimately move on an allowlist-only diff. The example outlived its premise and was repaired by `the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`. Read this as a caution about examples in this clause. **The rule is what binds.** An example a later slice can falsify is what produced the defect.

   Stage 8, `npm run agent-doc-check`, is not a replacement trigger. It moves on the doc entries, but its remediation is prose and cannot reach `src/`.

   It is written as a self-revocation rather than as a caveat, because it then resolves safely for a careless reader. The skip instruction is the more specific and more recent one, so anything phrased as an exception to it loses. See `.claude/agents/hardener.md`'s stage 5.

6. **Tag the slice's final commit**, annotated, as `slice/<slice-name>`:

   ```bash
   git tag -a slice/<slice> -m "<slice>: <one line on what the slice delivered>"
   ```

   After the fast-forward in step 4 the slice's tip _is_ `main`'s tip, so this marks both. Tag after step 5 rather than before it. The tag says the slice is done, and it is not done until the gate on `main` passes.

   The `slice/` prefix is load-bearing. A bare tag sharing the slice branch's name makes every `git log <name>` ambiguous until the branch is deleted in step 9. It also makes `git tag -l 'slice/*'` a list of every completed slice. Annotated rather than lightweight, so the tag carries its own date and message.

   If the slice began as an entry on the idea board, its `ideas/todo/<slice>.md` is already gone by now. The slice deletes its own idea file as part of its work — see "Idea board" above. This tag is what carries the record forward in its place.

7. **Push `main` and the tag:** `git push --follow-tags` (plain `git push` leaves the tag behind).

   This repo sets `push.followTags = true` locally, so a plain `git push` already carries the tag. The flag stays written out here because `.git/config` is not tracked, so a fresh clone or a CI checkout will not have the setting. Note the setting only follows **annotated** tags reachable from what you are pushing. A lightweight tag is silently left behind, which is one more reason step 6 specifies `git tag -a`.

8. **Carry the acceptance-mutation figure forward** from `product`'s VERIFY handoff — it comes from there now rather than from `hardener`'s. This is a read, not an edit. `engineering.md` deliberately records **no literal**, and says why in the same breath: "a literal in this file is wrong the moment the second one lands". So there is nothing in that file to re-record.

   What the step is actually for is noticing when the figure moved, and whether the slice explains it. A slice that touched no `.feature` and no `features/steps/*.ts` leaves the Examples-table mutant surface byte-identical, so a moved figure wants an explanation before it is accepted. Those are the two inputs since `acceptance-mutation-on-playwright`; `*.steps.test.*` was the second one before it, and the runner no longer touches that layer at all.

   Note the surface being identical does not by itself guarantee identical kill outcomes. A `src/` change to a module the steps exercise can flip a mutant's fate while the unmutated baseline stays green. That is exactly why a move is a finding to understand rather than a new baseline to record.

9. **Retire the worktree:**

   ```bash
   git worktree remove <path>
   git merge-base --is-ancestor <slice> main && git branch -D <slice>
   git worktree prune
   ```

   Assert the ancestry yourself rather than leaning on `git branch -d`. `-d`'s built-in "fully merged" test measures against whatever branch is currently checked out. Under concurrency the primary checkout is normally sitting on some _other_ slice's branch, so `-d` refuses a slice that is in fact already `main`. (Safe, but it stops you every time.) The check above asserts the condition you actually care about, and `-D` cannot do damage because it only runs once that assertion has passed. The tag is what preserves the slice's identity once the branch is gone.

The next slice repeats from step 1 against the new `main`.

**`npm run test:perf` is owned by the orchestrating session, not by any role.** It appears in no role's checklist deliberately. Render performance is meant to be held by the architecture — the world-anchored tile keys, the eviction hysteresis — rather than re-measured on every slice. A per-slice harness stage would quietly recast an architectural guarantee as a test result.

So the orchestrator decides when a slice is perf-relevant, and runs `npm run test:perf` **followed by** `npm run perf-report`. Skipping the second leaves the previous run's `reports/perf/latest.md` in place, reading as a successful run of the current tree. The orchestrator also regenerates the `main` baseline first whenever `src/` or `perf/` has moved since that report's own commit. Check it: the report names the commit it was generated from. A role may _recommend_ a run in its handoff, which is a useful signal; no role runs it.

There is deliberately no seventh role for this. The post-merge gate is `hardener`, invoked on `main` and told that it is verifying an integration rather than a slice. The whole tree is then in scope. It already owns exactly that sequence, and already knows when to reach for `test:mutation:full`.

## Conventions

- No semicolons, single quotes, 120-char print width (Prettier; `prettier-plugin-tailwindcss` sorts class strings — do not hand-order Tailwind classes).
- Comments are reserved for non-obvious _why_: subtle invariants, browser quirks, sign-convention mismatches between related functions. This codebase leans heavily on that style in `camera.ts`, `scrollbars.ts` and `Grid.tsx`. Read existing comments fully before touching the code they explain, since the reasoning is often not re-derivable from the code alone. Examples are pointer-capture propagation, scroll-direction sign conventions, and shift+wheel axis workarounds.

  **Which comment marker to use is a separate decision from what to write.** A `//` comment reaches neither `LSP` hover nor declaration emit. So what a caller needs in order to use a thing belongs in JSDoc above the declaration, and only the internals stay `//`. See `.claude/agents/articles/doc-comments.md`.

  **What a comment may _assert_ is a third decision again**, and it binds `.md` as hard as `//`. A comment or a doc line may state why. It may not state an undated present-tense fact about another file. That means no caller rosters, no `<file>:NN`, no quoted test titles, no bare counts, and no "this slice" in anything that is a record. `npm run reference-check` machine-checks that where it can. The rest is convention, and it lives in `.claude/agents/articles/engineering.md` under "A comment may state why…", because every role and this session read that article unconditionally.

- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`, `react/react-compiler` oxlint rule set to `error`) — avoid manual `useMemo`/`useCallback` unless the compiler cannot handle the case.
- **Accessible names are sentence case** — capital on the first word only, and no role word inside the name, since AT appends "group" or "button" itself. The authored control labels, as shipped: `Cell 3, 5`, `Zoom in`, `Zoom out`, `Reset view`, `Open pattern library`, `Next generation`, `Appearance`, `Pattern preview cell 3, 5`, `Horizontal scroll`, `Vertical scroll`, `Column ruler`, `Row ruler`.

  **Read that as a snapshot, not a closed set.** It is not machine-checked, and it has carried a false universal twice. `CLAUDE.rationale.md` names both, and who caught each.

- **The rule covers authored control labels, not content.** A name may be a piece of the app's _subject matter_ rather than a label someone wrote for a control. Such a name is outside the rule and keeps its own capitalisation. That covers:

  - the `Conway's Game of Life` heading
  - the pattern library's category headings — `Still Life`, `Oscillators`, `Spaceships`, from `PATTERN_CATEGORIES` in `patternLibrary.ts`
  - its pattern names, such as `Block` and `LWSS (Lightweight Spaceship)`
  - any future catalog entry

  The test is whether renaming it would be a copy change or a content change.

- **Exactly one authored label is deliberately title case: the pattern library dialog is `Pattern Library`.** It is the dialog's own title, naming the surface itself rather than labelling a control on it. **One instance is an exception, not a principle.** `Next Generation` was title case too, and was ruled a defect rather than a second exception. So do not reason from `Pattern Library` to any new name.

  `features/screenplay/elements.ts` matches it with `exact: true`, and that flag is load-bearing. `getByRole`'s default name matching is case-insensitive _and_ substring, measured against playwright-core 1.62.1, this repo's installed version. So a drift back to `Pattern library` would pass a lax matcher silently. That is exactly how the lowercase form survived long enough to reach this line.

- **An accessible name says what a thing _means_, not what shape it is.** The `Scrollbar.tsx` / `GridRuler.tsx` mismatch is deliberate, not drift to tidy up. `Scrollbar.tsx` names its axes `Horizontal scroll` and `Vertical scroll`. `GridRuler.tsx` names its two axis groups `Column ruler` and `Row ruler`, and `Horizontal ruler`/`Vertical ruler` was rejected on the record.

  Scrolling is a _geometric action_ — you genuinely scroll horizontally — so geometry is the right vocabulary and there is no coordinate meaning to lose. Ruler digits _are_ coordinates. "Horizontal ruler: 0, 10, 20" is mapping-neutral, and tells a user nothing about whether `10` is the first or the second coordinate of `Cell 10, 5`. `Column ruler` says exactly that.

  The mapping is the one failure mode that leaves every test green while being confidently wrong. **Top strip = `Column ruler` = the first coordinate of `Cell x, y`. Left strip = `Row ruler` = the second.** Note the top strip is itself a _horizontal_ run of labels carrying _column_ numbers. Naming a strip after its own geometry is precisely the inversion to avoid.

  `GridRuler.test.tsx`'s membership test is what pins it — asserting the two names exist is not enough, since that passes with the wrappers swapped. `rules/no-ruler-axis-by-paint-class*.yml` keeps the black-box layers reading the group rather than the edge class.
