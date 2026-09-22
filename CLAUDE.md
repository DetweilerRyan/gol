# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Conway's Game of Life, built as an infinite, pannable/zoomable grid (React 19 + TypeScript + Vite + Tailwind v4). Cells are toggled by click; generations advance manually via the Next generation button.

## Documentation map

`CLAUDE.md` is a **routing index**, not the whole account. It carries the command list, a compact module map, the orchestrating session's own procedures, the conventions, and one pointer per article. The detail lives in `.claude/agents/articles/`, which is **not** auto-loaded — a role reads an article when its own file tells it to.

Four articles are house rules every role reads unconditionally — **and the orchestrating session reads them too.** They were labelled per-role because the seat that invokes the roles has no role file; the content was never role-specific.

- **`.claude/agents/articles/engineering.md`** — design, test-layer placement, property tests, gate scoping.
- **`.claude/agents/articles/claim-discipline.md`** — what a claim may say and how long it stays true: the scope of a measurement, a conclusion from an unmeasured mechanism, what a comment may assert about another file, and whether a gate still encodes its invariant. Split out of `engineering.md` because it binds every prose surface rather than only `src/` work.
- **`.claude/agents/articles/workflow.md`** — lint/format, role boundaries, commit messages, worktrees and branches.
- **`.claude/agents/articles/handoffs.md`** — handoff shape, concurrent slices, defect adjudication, when blocked.

One article belongs to nobody in `.claude/agents/` at all, because its audience runs the roles rather than being one:

- **`.claude/agents/articles/orchestration.md`** — the invocation contracts roles expect the prompt to satisfy, and the state only that seat carries between stateless invocations. It also covers the escalation lanes that end there, and what that seat runs that no role does. Read at session start and before composing any role invocation.

Ten are topic articles, read on the trigger each one names in its own header:

- **`.claude/agents/articles/architecture.md`** — the cross-module contracts no single hover can state, and the acyclic dependency graph. What one module owns is that module's own JSDoc hover. Read before adding, moving, or splitting a module.
- **`.claude/agents/articles/state-flow.md`** — where state lives, the hooks, the hook-identity contract, and the composition roots. Read the article before touching a hook or a composition root.
- **`.claude/agents/articles/testing-layers.md`** — the test layers, the Gherkin contract, playwright-bdd, `.features-gen/`, the step registry, and the `features/screenplay/` decomposition. Read the article when authoring a `.feature`, a step module, or an e2e spec.
- **`.claude/agents/articles/mutation-testing.md`** — Stryker's incremental cache, the ways a run reports a confident number about nothing, and the `:full` triggers. It also carries the seed-pinning account, the sandbox exclusion, **how to rule a survivor equivalent, and when `it.skipIf` is an accepted idiom**. Read before ruling a survivor equivalent, and at `hardener`'s mutation stage.
- **`.claude/agents/articles/ast-grep-rules.md`** — the rule list check 5 reads, how to read a finding, and how to author a rule that is not silently inert. Read the article before authoring or narrowing a rule.
- **`.claude/agents/articles/acceptance-mutation.md`** — the Gherkin Examples-table mutation runner, its guards, and its two mutation classes. Read the article before the first `npm run acceptance-mutation` in a slice.
- **`.claude/agents/articles/doc-comments.md`** — the interface/implementation comment split, and what belongs in JSDoc versus `//`. It also carries the hover budget, the paired module-sidecar tier, the measured JSDoc syntax hazards, and the hover-before-Read reading habit. Read before writing or moving a comment block in `src/` or `scripts/`.
- **`.claude/agents/articles/prose.md`** — how agent-facing prose is written, and what Vale checks of it. **It owns the instruction-versus-explanation split between every instruction file and its sidecar**, which the routing branches deliberately do not carry. Its mechanical half runs Vale over the agent docs, `CLAUDE.md`, the module sidecars, and the JSDoc blocks in `src/` and `scripts/`. That half says which enabled rules apply mechanically and lists the exempt classes for each. Since 2026-09-12 every rule in a default run is mechanical. `STE.PassiveVoice` alone sits below `MinAlertLevel`. It also carries the ways a run reports a confident zero, and how a pass damages the file it cleans. `architect` alone authors the tracked `vale-styles/` styles, on the `rules/*.yml` precedent. Five exist. `JsDoc` covers hovers, and `Instruction` guards the stripped role files. `Procedure` carries the two script rules that replaced the last `STE` prompts. `Board` holds the idea board's one structural rule, and `Claim` matches the fingerprinted claim forms. The article carries their fixture run. Read before moving a sentence between a file and its sidecar, before acting on a Vale finding, and before enabling or re-levelling a rule. The file name predates the wider job; `backlog/ideas/` carries the rename.
- **`.claude/agents/articles/quality-tooling.md`** — the crap4ts patch, the advisory `scripts/` programs, `.gherkin-lintrc`, and `.oxlintrc.json`'s `jsdoc/*` tier. Read the article on an unexpected crap4ts number, on a `jsdoc/*` lint finding, or when touching the lint config.
- **`.claude/agents/articles/archive.md`** — layers that no longer exist, kept for their method. No role has a trigger for this one; it is research material.

**One tier sits outside `agents/` because its consumers span tiers: `.claude/references/`.** A file lands there when skills, roles, and the orchestrating seat may all name it as a read trigger. An article's audience is roles and the seat; a skill's supporting file belongs to that skill alone. Four entries today:

- **`.claude/references/definition-of-ready.md`** — the idea board's readiness assessment: the kind discriminator, the six anchored predicates, the four dispositions, and the calibration record. It also states the assessment record's shape. The audience is the orchestrating seat and the `idea-*` skills — no role assesses a candidate. Read before assessing a candidate, promoting an idea, or ruling a disposition.
- **`.claude/references/merge-protocol.md`** — how a slice lands on `main`: the numbered steps from rebase to worktree retirement, the mutation-invariant stage-5 exemption and the computed predicate behind it, and the perf runs the seat owns rather than any role. The audience is the orchestrating seat, plus `hardener` when an invoking prompt names the exemption. Read before landing a slice, at step 1 rather than part-way through a merge.
- **`.claude/references/pipelines.md`** — the class of service per backlog item kind: which steps run for a story, an enabler, a spike, or an epic, what each invoking prompt must carry, the seat-held counters, and the escalation lanes as pipeline interrupts. Its gates cells cite each role's own file rather than restating any list. The audience is the orchestrating seat, the `idea-*` skills, and the process roles. Read before planning a promoted item's cycle and before composing any role invocation.
- **`.claude/references/role-file-shape.md`** — the shape a role file takes: the two-line JTBD job statement that opens every new role file, and the TROOP completeness checklist (Task, Role, Output, Objective, Perspective) mapped over the role-file anatomy. The audience is the orchestrating seat and the process roles. Read before authoring or restructuring a role file.

**One decision-record tier sits at the repo root: `adr/`.** Durable records of decisions whose reasoning would otherwise be lost, in MADR shape — `adr/README.md` carries the statuses, the immutability rule, and the correction path. `architect` checks the in-force records before a design, review, or adjudicate pass; no other role has a trigger.

**Sidecars, and where one sits.** Any instruction file in this repo may take a sidecar. Name it
`<name>.meta.md`, and put it beside the file it belongs to. A file owes one once it has
explanation to displace, and not before. A file whose evidence sits in another file's sidecar
says so in its own header.

**What fills a sidecar is `.claude/agents/articles/prose.md`'s question**, under "Instruction
stays. Explanation moves." No line here answers that one.

**Two classes sit in `.claude/agents/articles/` instead, and the reason differs.** A role file's
sidecar is forced there: `scripts/agent-doc-check` reads the direct `.md` children of
`.claude/agents/` as the agent roster, and a prose file there fails the frontmatter check. This
file keeps its own sidecar there by choice, so that both doc checkers reach it.

**The mechanics are the same for every `*.meta.md`.** Vale exempts the sidecar unconditionally,
and lints the instruction half only where `.vale.ini` scopes that file's tier. `npm run
reference-check` resolves a citation of one by basename, and checks no relative path in front of
the name. Nothing checks a sidecar's contents.

**No role file names a sidecar as a read trigger.** Read one when you are changing the rule it
stands behind, never in order to follow one.

**A module's pair splits by audience.** `<module>.md` is for whoever is _calling_ the module, and
`<module>.meta.md` for whoever is _changing_ it. Cite it from the JSDoc as
`@see {@link ./<module>.meta.md}`.

**A checker over which files have a sidecar is a closed decision, ruled 2026-09-21.** That set is
derivable from the tree, so a gate would only guard a hand-written copy of it. Do not re-propose
one, and do not add a list of instances here.

**A role may also hold mode files in its own subdirectory**, read on the trigger the invoking prompt names rather than unconditionally. `.claude/agents/architect/` holds `contract-mode.md` and `adjudicate-mode.md`. **The subdirectory is safe where a sidecar beside the role file is not**: `scripts/agent-doc-check`'s roster scan filters on `entry.isFile()`, so it never descends. A mode file therefore needs no agent frontmatter. `.vale.ini`'s `[.claude/agents/**/*.md]` section reaches the subdirectory, so the `Instruction` style applies there.

**Where new documentation goes.** CLAUDE.md is auto-loaded into every session and every subagent, so its size is a tax on all six audiences. Route new prose by this test, in order:

1. Is it a **procedure the orchestrating session executes**, or a **predicate that gates** (a path allowlist a checker or a protocol step reads)? → CLAUDE.md, which is auto-loaded and so is the only surface guaranteed to be read before anything else happens. **Conduct and rationale for that seat go to `orchestration.md` instead.** **One exception, ruled 2026-09-17: a long procedure only one audience executes may live in `.claude/references/`, provided this file keeps a pointer plus whatever binds before the procedure's first step.** `merge-protocol.md` is the instance. The test is whether a reader who never opens the reference can still fail safely.
2. Is it a **measured fact, a rationale, or a discovery record** about a topic that already has an article? → that article — **or its sidecar if it has one, which branch 5 decides.** Read branch 5 before settling this one; it is the narrower rule and it wins where both apply. CLAUDE.md gets **at most one pointer sentence**, and only if a reader would otherwise not know the article covers it.
3. Is it **conduct guidance that applies to more than one role**? → `engineering.md`, `workflow.md`, or `handoffs.md`. **Exception, ruled 2026-09-11: a standard that binds at authoring time goes in this file instead.** Only the auto-loaded surface is guaranteed to be in context before anything is written. A read trigger is the weaker guarantee, and that weakness is how the role files grew verbose. The instruction-register bullet under Conventions is the live instance.
4. Is it **depth about one module** that overflows a JSDoc hover? → a **pair of sidecars beside the source**, split by filename so the register is visible before a word is read. Which half a given sentence belongs in is a question for `prose.md`, not for this branch. Either may be absent, and usually one is. The sidecar section above names the pair and the citation form.

   This is the one documentation surface that lives outside `.claude/**`. Its audience is whoever is holding a call site rather than whoever is running a role.

   See `.claude/agents/articles/doc-comments.md`, rule 7, for what a hover may hand off to the pair.

5. Is it **the evidence behind a rule in an article**, rather than the rule itself? → that article's sidecar.

   **These branches route by topic, and explicitly not by register.** They answer which article a subject belongs to; the sidecar section above answers where the sidecar file sits.

   They do **not** answer how prose is split between an instruction file and its sidecar. **`.claude/agents/articles/prose.md` answers all of that**, under "Instruction stays. Explanation moves." Open it when you are holding a sentence rather than a subject, and nothing here restates it.

   `archive.md` is the same tier predating the convention, and keeps its name. A rename to fit the convention was considered and declined by the user, since it has no parent article to pair with.

   **Two branches can both claim a passage, and this one is the tie-break: subject wins.** A measurement about a single module goes beside that module under branch 4, even when it is also the evidence behind an article's rule. The rule stays in the article, and the worked case goes to that module's sidecar. That is a question about what the passage is _about_, which is why it is settled here rather than in `prose.md`.

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
npm run agent-doc-check     # gate (nonzero on failure): binary facts about .claude/** + CLAUDE.md -- every referenced npm script resolves, agent frontmatter validates, no stale retired-role references, every declared role cycle in role-cycles.config.json matches its bare mentions byte-for-byte, every rules/*.yml is documented in the ast-grep-rules article and every rules/<id>.yml path the docs name resolves (tsx scripts/agent-doc-check/run.ts)
npm run reference-check     # gate (nonzero on failure): every filename-shaped token and <file>'s <symbol> citation in a source comment or doc file resolves against the live tree, no source comment cites a <file>:NN line number, and every allow-marker opt-out is still live rather than stale (tsx scripts/reference-check/run.ts)
npm run vale-fixture-check  # gate (nonzero on failure): every rule in a tracked vale-styles/ style has a .bad/.good fixture pair per extension it claims, every .good reports nothing, every .bad reports its own rule, at least one rule was found, and every tracked style is wired into fixtures.vale.ini. Fails rather than passes when vale is absent, since a missing binary reports zero exactly like a clean fixture set (tsx scripts/vale-fixture-check/run.ts). Owned by `architect`, run whenever anything under vale-styles/ changes; NOT one of hardener's eight stages
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

**Ten programs, and only the five below gate.** Four of the other five are advisory — `scripts/acceptance-mutation/` (owned by `product`, not `hardener`), `scripts/gherkin-dry-checker/`, `scripts/halstead4ts/`, and `scripts/perf-report/` — and **`.claude/agents/articles/quality-tooling.md`** describes them. The acceptance-mutation runner has its own article, **`.claude/agents/articles/acceptance-mutation.md`**.

The fifth non-gating program is `scripts/prose-lint/` (`npm run prose-lint`), which runs Vale over the tracked file list: it never fails on a finding, and fails when it cannot lint.

**`scripts/vale-fixture-check/` is its gating counterpart**, and the split is the same one `rules/` already has. `prose-lint` reports on the tree; `vale-fixture-check` asserts binary facts about the styles themselves. It is described with the other gating checkers below.

The five gating checkers keep their full entries here, because they are what polices `rules/`, `.claude/**`, the comment/doc-comment surface, the mutation-invariance allowlist, and `vale-styles/` itself:

- `scripts/ast-grep-rule-check/` (`npm run ast-grep:rules`) — **this is the first of five checks in this list that gate.** Every other check in this list needs judgment to act on. This one is a set of binary facts about `rules/*.yml` and `rule-tests/*.yml`:

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

- `scripts/agent-doc-check/` (`npm run agent-doc-check`) — **the second of five checkers in this list that gate**, over `.claude/**` + CLAUDE.md itself rather than over `rules/`. Five binary facts:

  1. Every `npm run <script>` reference in `.claude/**/*.md` + CLAUDE.md names a real `package.json` script. `.claude/worktrees/` is excluded: it is a sanctioned slice-worktree location holding whole other checkouts, with their own `.claude/` and their own `node_modules`, rather than this repo's docs.
  2. Every `.claude/agents/*.md` file's frontmatter validates — `name` matches the filename, `description` is non-empty, `tools` is a subset of the known tool set, and `model` is one of `opus`/`sonnet`/`haiku`/`fable`. It is parsed with a bespoke line-anchored reader rather than a real YAML parser. Several agent descriptions contain a literal `": "` that a real YAML parser reads as a nested mapping and refuses.
  3. No backticked mention of a retired role (`qa`, `refactorer`, `specifier`) without a historical qualifier (old/former/then/merge/...) on the same line. That is a short, git-verified list of every role ever deleted from `.claude/agents/`, not a generic "role-shaped token" scan. That generic form was tried and rejected.
  4. Every bare role-cycle string (`product → coder → cleaner → architect → hardener → product`) is byte-identical to a cycle declared in `role-cycles.config.json`, which is the canonical authority per pipeline — the checker renders each declared role array itself, so the arrow glyph has one author. The role roster stays derived from whichever agent files currently exist; a declared role missing from that roster, an inert declared cycle, or an empty declaration each fail rather than pass vacuously. Mode-bearing sequences stay exempt.
  5. Every `rules/*.yml` is named in the rule documentation article, `.claude/agents/articles/ast-grep-rules.md`. The invariant is "documented somewhere roles will read". `run.ts`'s `RULE_DOC_PATH` reads that file through an `existsSync` guard that throws by name, rather than a glob that could match nothing and report a clean run. Every explicit `rules/<id>.yml` path mentioned in **any** doc file must also resolve to a real file, attributed to the file it was found in.

  Same shape as `ast-grep-rule-check` deliberately — pure `decide()` over parsed input, I/O isolated to `run.ts`, one file per parsing concern.

  **Check 1 has no notion of "just an example".** A hypothetical script name written in prose without angle brackets reads exactly like a real reference. It fails the gate the same way a genuine typo would. Write a hypothetical one as `npm run <script-name>` instead. See `npm-run-refs.ts`'s module comment; this checker's own development tripped over exactly that.

- `scripts/reference-check/` (`npm run reference-check`) — **the third of five checkers in this list that gate**, over the comment surface itself rather than over `rules/` or `.claude/**` alone. The defect it exists to catch: a comment or a doc line names another file, or a symbol inside one. That target is then renamed or deleted, and nothing notices.

  It scans comment lines only — trimmed start `//`, `*`, `/*`, or `#` — in every `.ts`/`.tsx`/`.yml`/`.yaml` file under `src/`, `scripts/`, `features/`, `perf/`, `rules/`, `rule-tests/`, `vale-styles/`, and at the repo root, minus `src/catalyst/` (the vendored library boundary). It also scans **every** line of every tracked/untracked-not-ignored `.md` file in the repo. It excludes two directories: `backlog/**` (a board file's own worked examples are dead references by design) and `.claude/worktrees/` (the same sanctioned exclusion `agent-doc-check` carries). That surface is not an enumerated list of `CLAUDE.md`, `README.md` and `.claude/**/*.md`. The enumerated form is what left `vale-styles/JsDoc/README.md` and 15 other citations in that directory unchecked until `reference-check-reach`. A doc file's prose is itself the thing being checked, rather than commentary around code.

  Four checks, plus a double inertness guard shared with `ast-grep-rule-check`'s `checkAnyRulesFound` via `gate-report.ts`'s `checkNonEmpty`:

  - **`file-reference-resolves`** — every filename-shaped token must resolve, by basename, against `git ls-files --cached --others --exclude-standard`. That is the live tree, deliberately, and not git history. Resolving against history would spare a stale present-tense claim about a file deleted for the wrong reason. That is the exact defect this checker exists to catch, and it would turn the check into typo detection instead.
  - **`cited-symbol-exists`** — a `<file>'s <symbol>` citation must name a symbol that actually appears, as a whole word, in the cited file's own text.
  - **`no-file-line-references`** — source comments only. A `<file>:NN` line-number citation is banned outright, whether or not it currently resolves. Unlike the `'s` form, it does not survive a line being added above it.
  - **`stale-allow-marker`** — an opt-out marker is a failure in its own right, rather than a pass, in three cases. It carries no reason, its token now resolves, or its token appears nowhere else live in the file.

  The opt-out marker is `` `reference-check:` `` then `` `allow <token> -- <reason>` ``. It is written here as two adjacent code spans, for the same reason the checker's own `allow-markers.ts` module header is. This checker scans `CLAUDE.md`, so the two keywords written contiguously in a comment would read as a live, tokenless marker. It would then report itself as stale.

  **Matching is by basename everywhere in this checker, never full path**, which deliberately under-reports. A false negative on a same-named file living in a different directory is the safe failure direction.

  Sits at `hardener`'s stage 2, immediately after `build` and ahead of every other stage — see stage 2 in `.claude/agents/hardener.md` for why.

- `scripts/mutation-invariance/` (`npm run mutation-invariance`) — **the fourth of five checkers in this list that gate**, and the only one no role runs. It owns `mutation-invariance.config.json`, the allowlist behind the merge protocol's stage-5 exemption, and it exists because that list was prose restated in three files that drifted apart. Two modes, one command. With no argument it validates the config against the tree. With `-- --diff <range>` it also answers whether a landing diff is mutation-invariant. **Exit 0 invariant, 2 not invariant, 1 the config failed validation so no verdict was computed.** Read 1 as "run stage 5", never as a pass. The verdict sits in the exit code rather than in a string on stdout, for that reason. Seven checks, and the tiers are what make them possible. An entry declares how it is secured. A `vitest-exclude` entry is verified against **every vitest project's own `exclude`**, not against `vite.config.ts`'s shared constant. That distinction is the point. A project that stopped spreading the constant is the regression this catches, and checking the constant stays green through it. A `stryker-ignore-patterns` entry is verified against a last-wins walk of those patterns, negations included, and a `written-argument` entry against the tracked-file set. **That third tier is honest about what it does not prove.** It verifies only that a fixed filename can never become a test. That nothing in the run consults the file is an inventory on a date. `package.json` is the standing counterexample: a fixed filename on the absent list precisely because it can move the score. So a green exit is not a proof for that tier. **The report does not say which tier an entry is in** — it prints one line, the same line either way. Read the tier off the config. The `vitest-exclude` tier carries a narrower version of the same gap, which `.claude/agents/articles/mutation-testing.md` states along with the inventory it rests on. The inertness guard covers three collections, not one. An empty project list or an empty tracked-file set would make two checks pass vacuously. That is the fail-open direction this whole predicate is built against. The orchestrating session runs it at merge step 3. It is **not** one of `hardener`'s eight stages, and it grants nothing. `hardener` still runs stage 5 absent an instruction.

- `scripts/vale-fixture-check/` (`npm run vale-fixture-check`) — **the fifth of five checkers in this list that gate**, over `vale-styles/` rather than `rules/`. It is `ast-grep:rules`'s counterpart for the Vale styles, and it exists because `vale-styles/fixtures/` already carried the same `.bad`/`.good` practice `rule-tests/` carries with nothing running it. `fixtures.vale.ini`'s own header named `ast-grep:rules` as the reason a missing fixture should fail, and then had no counterpart. Five binary facts:

  1. Every rule in a tracked style has a `.bad` and a `.good` fixture, for every extension its own `scope:` claims.
  2. Every `.good` fixture reports nothing.
  3. Every `.bad` fixture reports its own rule, by name, at least once.
  4. At least one rule was found at all — the shared `gate-report.ts` `checkNonEmpty` guard, reused rather than reimplemented.
  5. Every tracked style is enabled in `fixtures.vale.ini` for each extension its rules claim. A style wired into no section has fixtures nobody lints, and passes checks 1 to 3 **by being invisible to them**. That is how `Procedure` would have entered the tree untested.

  Scope is the tracked styles under `vale-styles/`, and only those. `.vale/`'s downloaded packages are excluded: we do not own `STE` and have no standing to fixture-test it.

  **It fails rather than passes when `vale` is absent**, which is why it probes first. Vale is a Go binary, not an npm dependency, so `npm ci` does not install it. A missing binary reports zero findings, and so does a clean fixture set. Without the probe, this program's healthiest output and its most broken state are the same text. It shares `scripts/vale-probe.ts` with `prose-lint` rather than reimplementing the classifier, which is what moved that module to `scripts/` root.

  **What it cannot check, and no heuristic should pretend otherwise.** Check 2 proves a `.good` fixture is clean. It does **not** prove the fixture discriminates. Knowing that `ProcedureLength.good.md`'s 23-word bullet would trip the rule without the numbered marker means knowing what that rule turns on, and no generic checker does.

  A word-overlap heuristic was considered and rejected: it would reject legitimate fixtures, and a false rejection is worse than an honest gap. **That judgement stays with `architect` at REVIEW time.** The same gap already exists in `ast-grep-rule-check`, whose fixture check never inspects the `valid:` side at all.

  Owned by `architect`, the only role that authors Vale styles. Run whenever anything under `vale-styles/` changes. **Not one of `hardener`'s eight stages** — those are whole-tree and run every slice, and a Vale stage would tax every slice whether or not `vale-styles/` moved.

All ten run via `tsx`, each as `tsx scripts/.../run.ts`: `npm run halstead4ts`, `acceptance-mutation`, `gherkin-dry`, `perf-report`, `ast-grep:rules`, `agent-doc-check`, `reference-check`, `mutation-invariance`, `prose-lint`, and `vale-fixture-check`. Each has its own `.test.ts` unit tests, runnable via `npm run test:scripts`, which is a dedicated Node-environment vitest config. `vite.config.ts` excludes `scripts/**` from the main `npm test` and `npm run test:unit` run, so scripts' tests no longer run there.

**The ast-grep structural rules.** `sgconfig.yml` + `rules/*.yml` are a tenth checker, and the only one that is not a `scripts/` program. [ast-grep](https://ast-grep.github.io) structural rules encode the architectural invariants that were previously prose only.

Report-only **for findings**. Every rule is `severity: warning`, so a rule matching your code does not move the exit code — read the output rather than `$?`. The exit code answers a different question. Measured against ast-grep 0.45.1, **8** means a rule file failed to parse and **1** means an `error`-severity rule matched. So a nonzero exit always warrants investigation.

**Every rule's scope, what it matches, how it was verified, and the measured argument behind it live in one place.** That place is `.claude/agents/articles/ast-grep-rules.md`'s sidecar. `ast-grep-rules.md` is also the file `npm run agent-doc-check`'s check 5 reads, so a rule added to `rules/` without a mention there reds the gate. That article is the one place the rules are enumerated. An index here would be a second copy of the same list, maintained by hand and checked by nothing. Rule files themselves belong to `architect` alone.

Note which rules fire on ordinary feature work rather than only on structural change:

- the two `no-manual-memo` rules, which are unscoped by path
- `no-logic-in-composition-root`, which covers exactly the kind of UI wiring a slice normally adds
- `no-unbraced-accessible-name`, the moment a component grows a new `aria-label`, `role`, `title` or `aria-valuetext`
- `no-unbraced-name-from-contents`, the moment one grows a heading or a button whose own text is its name — if anything the commoner of the two

`no-dead-doc-on-annotated-return-literal` joins that list from the other direction. It fires on documentation rather than on code. The trigger is a new hook with an annotated return type carrying a JSDoc block on a property of its `return { … }` literal. The measured evidence says that placement reaches no caller.

That is why `coder` runs `npm run ast-grep` in its own workflow rather than waiting for `architect`. See "Structural rules (ast-grep)" in `.claude/agents/articles/engineering.md` for the shared convention on reading a report-only checker. Note that rule files themselves belong to `architect` alone.

## Idea board

<!-- reference-check: allow tasks.md -- a per-item artifact-name convention; no ready item carries one yet, and the marker goes stale (delete it) when the first does -->

`backlog/` is a three-lane kanban of slices — it is the product backlog, in Agile Alliance terms, and the lane is the directory:

- **`backlog/ideas/<name>.md`** — raw and unjudged, no limit, one flat file per idea, plus `<name>.assessment.md` beside it once the idea has been assessed. An idea lands here the moment it is worth not forgetting.
- **`backlog/ready/<name>/`** — assessed against `.claude/references/definition-of-ready.md` (advisory, since this board has no gate) and concrete enough to start. A ready item is a **folder**:
  - `proposal.md` — the promoted idea file. Always.
  - `assessment.md` — the assessment the promotion was granted on. Always, from the move commit.
  - `design.md` — when the design-pass triggers fire.
  - `spec.md` — when a process enabler runs `coach` SPEC.
  - `tasks.md` — when dispatch is multi-unit.
  - `findings.md` — a spike's recorded answer.

  **Only `proposal.md` carries the idea-file shape**; `.claude/references/pipelines.md` states what a per-item artifact owes instead. The orchestrating session owns this board: no role reads it, except its own item's `spec.md` and `amendment-*.md` at paths the prompt names. A role never derives a board path to read one, and writing is a separate grant only a role's own file gives. Keep this lane to about three, matching the two-or-three concurrent-slice ceiling below.

- **`backlog/done/<name>/`** — completed, awaiting a retrospective. The retrospective extracts what the finished work can teach — durable halves of `design.md` and `tasks.md` deviations become new `backlog/ideas/` files, spike findings land in the parent's re-assessment or `adr/` — then deletes the folder. This lane records the one fact the `slice/*` tag cannot: _not yet retrospected_. Its trigger and owner are not yet ruled; folders simply wait.

`backlog/IDEA-TEMPLATE.md` is the `ideas/` lane's item shape: frontmatter (`name`, `title`, `created`, and `kind` once assessed) over Situation / Complication / Question, an optional shaped Answer and No-gos, then Open questions. It sits at the board root, not inside `ideas/`: a file in a flat lane is a candidate, and a template fails every identity check. Nothing machine-readable pairs a lane with a template — `board-lanes.config.json` declares each lane's `shape`, and a folder lane's `item`.

**`kind` lives in frontmatter**: `story | enabler-technical | enabler-process | spike | epic`, ruled by `/idea-assess`'s kind check per `definition-of-ready.md` and written into the proposal by `/idea-promote` after the move. The judging pass writes its own assessment record and nothing else. The directory carries the lane and the frontmatter carries the kind — it is not a `status:` field. Kind selects the expected role cycle (a technical enabler runs no `product`, a process enabler runs the `coach` family, a spike runs no pipeline) and **plans rather than authorizes**: the walk-every-path demonstration in `orchestration.md` still confirms any `product` skip at merge time. An epic gets no `ready/` folder — it stays an index file in `backlog/ideas/` and splits into children. Board files written before 2026-09-17 keep their historical `enabler` labels — they are records.

**`name` is the slice's identity end to end.** It is the file's basename in `ideas/`, the folder's basename in `ready/` and `done/`, becomes the branch in `git worktree add -b <slice>`, and becomes the `slice/<name>` tag at merge. One slug from idea to tag, so `git log` and the board agree on what a thing is called.

Two rules keep the board honest:

- **Promote with a move-only commit, then edit.** Run `git mv backlog/ideas/<name>.md backlog/ready/<name>/proposal.md`, move `<name>.assessment.md` to `assessment.md` in the same folder, and commit _those alone_, before fleshing the file out. Git infers renames from content similarity, and a candidate being expanded at promotion is precisely the case that defeats it. (The basename change to `proposal.md` does not — rename detection is content-based, measured at R100 across exactly this move.)

  Git records a move made in its own commit as a rename, and the history survives. It records a move plus a rewrite as delete-plus-add, and the history does not. (You need `--follow` to read across the move either way.)

  The assessment record already holds both halves — the judge's at assessment, and the human's per-letter ruling whenever `/idea-approve` recorded it. So the move commit's body carries the judge's summary rather than either record in full. `.claude/references/definition-of-ready.md` states the record shapes and why the order matters. `/idea-promote` executes this whole bullet.

- **The slice moves its own folder to `done/`.** Run `git mv backlog/ready/<name> backlog/done/<name>` as the slice's final commit before the merge gate — after the rebase, before step 3's re-verification, so the gated tip is the true tip. The `slice/<name>` tag stays the permanent completion record; the `done/` folder waits for its retrospective. Deleting the folder at completion is the retired rule — deletion now belongs to the retrospective alone.

<!-- reference-check: allow Backlog.md -- an external project on GitHub, linked by URL on the same line; not a file in this repo -->

The lane-as-directory choice runs against the prevailing convention. [Backlog.md](https://github.com/MrLesk/Backlog.md), [MADR](https://adr.github.io/madr/), and most git-native trackers keep a `status:` field and never move the file. Moves conflict when several people edit one board. That objection does not reach this repo: slices land **serially** (see `.claude/references/merge-protocol.md`), and the board has a single editor. Since the directory _is_ the status, **do not also put a `status:` field in the frontmatter** — one fact, one home; `kind` is a different fact and is allowed.

Nothing enforces any of this, and `backlog/` has no gate. The board-shape hook (`scripts/board-shape-hook/run.ts`) reads every `backlog/**` write and edit, and it always exits 0. It scores an idea file's shape and refuses everything else, so a line reporting `0 checks` is a refusal rather than a pass. Vale's advisory `Board` style also reads a board file.

Prettier formats the Markdown, and its ignore list is exclusion-based, so a new top-level path is covered with no config edit. That is the extent of the tooling.

A board-rendering script would have to live in `scripts/`, which would subject it to CRAP ≤ 6, its own vitest suite, `dry4ts`, and mutation testing. That is more machinery than the board is worth. `ls backlog/ready/` is the board.

## Subagent pipeline

`.claude/agents/` defines two role families: the story pipeline's roles, adapted from unclebob/swarm-forge's six-pack branch, and the process pipeline's roles (`coach`, `writer`, `editor`), which own change to the process corpus itself. It is scoped to this repo's actual commands — Gherkin features, `crap4ts`, `halstead4ts`, `dry4ts`, Stryker, `acceptance-mutation`, Playwright — rather than swarm-forge's tmux and file-based-handoff orchestration. Worktrees are used, but per _slice_ rather than per _role_; see "Running slices concurrently" below.

Each role's full instructions and boundaries live in its own file. Read the relevant one before invoking it, rather than relying on this summary. Shared house rules ported from swarm-forge's `main`-branch constitution live in `.claude/agents/articles/`: `engineering.md`, `workflow.md`, `handoffs.md`, `claim-discipline.md`. Every role reads those four unconditionally.

The same directory also holds the **topic** articles, which a role reads only when its own file names the trigger. It also holds `orchestration.md`, addressed to the session that invokes the roles rather than to any role. See the Documentation map above for the list and what each one is for.

Cycle order for a story: **product → coder → cleaner → architect → hardener → product** — `product` opens and closes the slice, in its SPECIFY and VERIFY modes respectively. Cycle order for a process enabler: **coach → writer → editor → coach** — `coach` opens with a spec the user signs off before `writer` executes, and closes with its own review. **Which steps run for which backlog kind, what each invoking prompt must carry, and where handoffs route is `.claude/references/pipelines.md`'s job** — the per-kind pipeline reference, which the orchestrating seat reads before composing any role invocation. A technical enabler runs no `product`, a spike runs no pipeline, and the step tables, the acceptance-spike sequence, and the escalation lanes all live there rather than here. What a role does inside its own invocation stays in that role's file.

There is no daemon or persistent process wiring these together. The orchestrating session invokes each role in turn via the `Agent` tool, and sequences the handoffs itself.

### The optional architect design pass

> `architect` has four modes. **DESIGN** ratifies an _implementation_ — a file set, interfaces, an ordering — and is what this section is about. **CONTRACT** ratifies a _specification_ during `product`'s acceptance spike. It asks three questions. Is the drafted contract observable through the UI at all? What accessible affordance does it need that does not exist? Is it at the right altitude for Gherkin? **ADJUDICATE** rules on a defect `product` reports at the end of the cycle. A slice may use several. Contract review comes first, since there is no point planning an implementation for a contract that cannot be verified.

The orchestrating session may invoke `architect` a **second time, before `coder`**, as a design pass that ratifies a file set and interface rather than reviewing landed code. It still runs in its normal post-`cleaner` slot afterward, so the slice gets both a design and a review. The two jobs compete for one pass otherwise. That is the same reasoning that split `hardener` out of the four-pack architect.

**"Optional" and the triggers below belong to the Story pipeline.** In the Enabler pipeline the design pass is **required** — ruled 2026-09-17 — because an Enabler has no `product` SPECIFY, so the DESIGN pass is its only pre-implementation gate. See the Enabler section of `.claude/references/pipelines.md`.

**The orchestrating session decides this, not `product`.** Every trigger below is a fact about the current shape of `src/`, and `product` is deliberately blind to it. It reads `src/` but never writes it, precisely so its reach stays honest. `product` may _flag_ that a slice smells structurally large; it does not make the call.

Reach for a design pass when:

- The slice is a refactor or restructure with no behavior change. Then the design **is** the deliverable, and there is nothing for `coder` to TDD against without one.
- It will create new modules, or move/split existing ones.
- It crosses the framework-free module → hook → component layering.
- A target file is already flagged as oversized — `cleaner`'s 100+ mutant heuristic, or `coder`'s ~1s per-file test-duration budget.
- The change spans three or more existing modules.

A design pass writes **no product code**. Its output is a ratified file set, the interfaces between the new pieces, and an ordering of behavior-preserving steps. Each step must leave the suite green. Where useful it also produces a mechanical guard — an `ast-grep` rule and fixture — for an invariant the design depends on. `coder` then executes that ordering, usually in more than one invocation, with the existing test suite as the regression net at each step.

The `split-grid-render-props` slice is the worked example. The design pass corrected the prop shape before any code existed, and split the riskiest step in two so the pre-existing tests could verify it. It also authored `rules/no-logic-in-composition-root.yml`, to keep the new composition root wiring-only.

**The five story-pipeline roles carry the `LSP` tool** in their frontmatter allowlist. That gives them go-to-definition, find-references, and type errors reported in-turn rather than at the next `npm run build`. Each of them writes TypeScript: the four implementing roles write `src/` and `scripts/`, and `product` writes the `features/steps/*.ts` step modules and the Playwright specs. **The three process roles carry no `LSP`** — their corpus is Markdown and JSON, and the out-of-band-write hazard `adr/0002` records scales with the number of LSP-bearing roles.

What separates them is no longer the tool allowlist. It is the **write boundary**, stated in prose: `product` reads `src/` freely and writes nothing there or in `scripts/`, in either mode. A tool allowlist used to carry that boundary instead, and the merge that created `product` made the arrangement dishonest in both directions.

This needs the `typescript-lsp` plugin installed (`/plugin`), plus a **global** `npm install -g typescript-language-server typescript`. The binary is not a project dependency, so `npm ci` alone does not reproduce it on a new machine. If the server is missing the roles silently fall back to `Grep` and `Read`, so a clean `npm test` is not evidence it is working. Check `claude --debug`, which names any LSP server it skipped and why.

The file names in the compact module map above are a current snapshot, not a frozen contract. A split makes that map and the article behind it — `.claude/agents/articles/architecture.md` or `state-flow.md` — stale, along with any other file-list mention in these docs. **The role that performs the split reports what went stale; this session makes the edit.** See "Where guidance and file names live" in `.claude/agents/articles/engineering.md`, and the no-role-edits rule under Conventions.

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

`vale sync` is **not** optional and `npm ci` does not cover it. `.vale/` holds the downloaded style package and is gitignored, so a fresh worktree has none. A run without it reports zero findings through a `grep -c` pipeline, rather than an error. `.claude/agents/articles/prose.md` carries that mechanism, and the other ways a run reports a confident zero.

Then start a session there, or `EnterWorktree({ path: '../gol-claude-worktrees/<slice>' })`. Both locations work and both are ignored by git, Prettier, oxlint, and vitest. `npx playwright install chromium` is **not** needed — that binary lives in a machine-global cache.

If you use the native `EnterWorktree({ name })` or `Agent({ isolation: 'worktree' })` path, set `"worktree": { "baseRef": "head" }` in `.claude/settings.json`: the default `fresh` branches from `origin/<default-branch>`, which is stale unless `main` is pushed after every merge.

### Merge protocol

**The protocol lives in `.claude/references/merge-protocol.md`. Open it at step 1, before the first command.** It carries the protocol's steps, the mutation-invariant stage-5 exemption and its computed predicate, and the perf runs this seat owns. A step skipped because nobody opened the file reads exactly like a step that passed.

**Slices land one at a time, serially.** Parallelism buys concurrent _authoring_, not concurrent _landing_ — the second slice to land pays a full re-verification. That cost is why two or three is the sensible ceiling. This one rule stays here because it binds before step 1: it decides how many slices the seat starts, not how one lands.

## Conventions

- No semicolons, single quotes, 120-char print width (Prettier; `prettier-plugin-tailwindcss` sorts class strings — do not hand-order Tailwind classes).
- Comments are reserved for non-obvious _why_: subtle invariants, browser quirks, sign-convention mismatches between related functions. This codebase leans heavily on that style in `camera.ts`, `scrollbars.ts` and `Grid.tsx`. Read existing comments fully before touching the code they explain, since the reasoning is often not re-derivable from the code alone. Examples are pointer-capture propagation, scroll-direction sign conventions, and shift+wheel axis workarounds.

  **Which comment marker to use is a separate decision from what to write.** A `//` comment reaches neither `LSP` hover nor declaration emit. So what a caller needs in order to use a thing belongs in JSDoc above the declaration, and only the internals stay `//`. See `.claude/agents/articles/doc-comments.md`.

  **What a comment may _assert_ is a third decision again**, and it binds `.md` as hard as `//`. A comment or a doc line may state why. It may not state an undated present-tense fact about another file. That means no caller rosters, no `<file>:NN`, no quoted test titles, no bare counts, and no "this slice" in anything that is a record. `npm run reference-check` machine-checks that where it can. The rest is convention, and it lives in `.claude/agents/articles/claim-discipline.md` under "A comment may state why…", because every role and this session read that article unconditionally.

- **No role edits a role file, an article, or `CLAUDE.md` on its own initiative.** `writer` edits them only to execute a ruled, user-signed `coach` spec whose path its prompt names — the authority `coder` has toward `product`'s approved contract. Every other role, and `writer` outside a spec, reports and hands off, however small the correction looks. The seat retains two residues. It records role-reported staleness — module maps, file lists, counts — each edit with the user's explicit approval as before. It also writes what its own procedures write: promotion records, merge records, and the board. Conduct changes — a rule, a boundary, a mode, a section — go through the process pipeline. This bullet does not reach `rules/*.yml` or `vale-styles/**`, which `architect` owns; authoring a rule never carries an edit to the prose that documents it. Ruled 2026-09-11; amended 2026-09-17.

- **Write instructions, not accounts, in every instruction file** — a role file, an article's rule text, this file. State what to do, when, and under what precondition; keep the why to one clause beside its rule. Route anything longer — the incident, the measurement, the rejected alternative — to the file's sidecar. No setting or inherited style asks any agent for terse prose, so this auto-loaded line is the only lever. It binds its own largest subject: this file. `.claude/agents/articles/prose.md` owns the split and the `Instruction` Vale style that guards stripped role files; read it before moving a sentence.

- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`, `react/react-compiler` oxlint rule set to `error`) — avoid manual `useMemo`/`useCallback` unless the compiler cannot handle the case.
- **Accessible names are sentence case** — capital on the first word only, and no role word inside the name, since AT appends "group" or "button" itself. The authored control labels, as shipped: `Cell 3, 5`, `Zoom in`, `Zoom out`, `Reset view`, `Open pattern library`, `Next generation`, `Appearance`, `Pattern preview cell 3, 5`, `Horizontal scroll`, `Vertical scroll`, `Column ruler`, `Row ruler`.

  **Read that as a snapshot, not a closed set.** It is not machine-checked, and it has carried a false universal twice.

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
