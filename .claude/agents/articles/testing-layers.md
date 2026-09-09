# Article: Testing Layers and the Gherkin Contract

**Audience:** product, coder, architect. **Read when:** authoring a .feature, a step module, or an e2e spec. Also when adding a \*.browser.test.ts, and in architect CONTRACT mode.

> The measurements behind every ruling here are in `testing-layers.rationale.md`. It holds the test-count history, the barrel curation figures, the fault runs, and the readings later corrected. Read it when you are **changing** a ruling below, never in order to follow one.

### Testing structure (three test layers plus the contract they answer to, deliberately separate)

1. **Unit/property tests** — `src/*.test.ts` and `src/*.property.test.ts`, on fast-check via `@fast-check/vitest`, for each of the framework-free modules. `src/equality/`'s own tests are one directory deeper, but land in the same two projects. The layer also covers `src/hooks/*.test.ts` (`@testing-library/react`'s `renderHook`) and `src/components/*.test.tsx` (`render`/`screen`/`fireEvent`, jest-dom matchers via `src/test-setup.ts`), for the unit-tested components CLAUDE.md's compact module map names.

   These run across three vitest projects, not one — see `vite.config.ts`'s `test.projects`. The framework-free-module tests run under the `unit` and `property` projects in plain Node, with no `document` and no jsdom cost. The hook and component tests run under the `dom` project in jsdom, since only those actually render. A new test file lands in `unit` by default, because that is the project that subtracts rather than includes. It fails loudly if it needed jsdom after all.

   One consequence is worth knowing before writing a property test. `property`'s `include` is the bare `**/*.property.test.ts`, which is _not_ rooted at `src/` root. So a `*.property.test.ts` placed under `src/hooks/` or `src/components/` would be collected by both `property` and `dom`. It would fail in the first, which runs in Node with no React plugin and no jsdom.

   That is a feature, not a gap. Property tests belong in the framework-free layer, and a hook-resident invariant worth quantifying over is a signal to extract the rule into a module. It is not a reason to reach for a config exception. This is where implementation correctness lives: edge cases, invariants, and the numeric precision a Gherkin Examples table cannot express — `-0` handling, clamp boundaries, same-reference no-ops.

2. **Browser-required unit tests** — `src/**/*.browser.test.ts`, co-located with the module they cover. `npm run test:browser` runs them via `vitest.browser.config.ts`. Vitest Browser Mode drives real Chromium, reusing the Playwright binary `npm run test:e2e` already installs. This is the same kind of test as layer 1, and it is owned by the same roles: `coder`, `cleaner` and `architect`, never `product`. It imports one module directly and never boots the app.

   It exists only for contracts jsdom has no faithful equivalent for. The single current instance is `src/hooks/useElementSize.browser.test.ts`. It pins down two things the jsdom stub in `src/test-support/domStubs.ts` does not reproduce. The real `ResizeObserver` fires an initial callback from `observe()` itself. It also delivers an update on a real size change. The stub fires only when a test calls `.resize()`.

   This layer is **additive only**. `vite.config.ts` excludes the `*.browser.test.ts` suffix, and both `crap4ts` and `npm run test:mutation` run through that config, so neither can see these files. Moving an assertion out of a jsdom test into one of these silently drops coverage and mutation score on the module. Always leave the jsdom test in place. See `.claude/agents/articles/engineering.md` for which layer a given test belongs in.

3. **The Gherkin contract — no longer a test layer of its own.** `features/*.feature`, the plain-English specs, is `product`'s manifest and the user-facing contract, end to end. It used to have a second executable form beside the browser one. That was `features/*.steps.test.ts(x)`, step definitions on `@amiceli/vitest-cucumber` run by vitest in Node or jsdom, plus the `features/harness/` modules the jsdom form mounted `<App />` through.

   **`delete-step-test-layer` removed all of it**: seven step files and the harness, 1,326 lines, the `acceptance` vitest project, and the `@amiceli/vitest-cucumber` dependency. **`features/` now contributes zero tests to `npm test`.**

   Every `.feature` file is executed exactly once, by playwright-bdd against the step modules in `features/steps/*.ts`. That is item 4 below. Read this item as _what the contract is_ and item 4 as _how it runs_. The **suffix** is still what separates the artifacts inside the directory. `.feature` is the contract, `.e2e.spec.ts` the hand-written Playwright specs, and `e2e-helpers.ts` their barrel.

   **There are two subdirectories, and neither holds a test file.** `features/steps/` holds the step definitions bddgen compiles the contract against. `features/screenplay/` holds the helper modules the barrel re-exports. Item 4 describes both.

   This layer's purpose is the stakeholder-readable, accepted-behavior contract and the `product`→`coder` handoff — see CLAUDE.md's Subagent pipeline section. It is not incremental defect detection beyond the unit tests. Its assertions overlap substantially with the unit tests covering the same functions, and that overlap is expected rather than duplication to eliminate. The one feature that is not overlap-redundant is `features/pattern-library.feature`. Its Examples table is the only place the exact cell geometry of all 8 patterns is pinned down. The unit and property tests check names, categories, and the bounding-box anchor convention, but never the shapes themselves.

4. **Black-box e2e tests** — `features/*.e2e.spec.ts`, Playwright driving real Chromium against `npm run dev` on a fixed 1280×900 viewport. They sit alongside the Gherkin layer in `product`'s one directory. `features/e2e-helpers.ts` is the barrel over the shared helpers, which live one module per Screenplay role in `features/screenplay/`. Many pixel-math assertions are derived from the exact default camera that fixed viewport produces — `offsetX: -32, offsetY: -22.5, cellSize: 20` — declared once in `features/screenplay/viewport.ts`. Read that module's comments before changing default camera values or the viewport size.

   **A hand-written spec is no longer the browser-level counterpart of a `.feature`.** Reading it that way is the mistake `triage-paired-specs` existed to correct. Since playwright-bdd landed, the browser-level execution of a feature _is_ its generated `bdd` spec, driven by `features/steps/*.ts` in the same real Chromium at the same viewport. A hand-written spec sharing a `.feature`'s name therefore holds only the **residue**: the part of that feature's subject matter no Gherkin scenario can state. An assertion in it that a scenario already makes is duplication rather than defence in depth. That triage deleted 35 tests and one whole spec file on exactly that reading.

   **Three pairing states, all three normal.** First, a `.feature` **with** a hand-written spec beside it, holding residue only — `camera-pan-and-zoom`, `cell-life-and-death`, `grid-reference-lines`, `grid-scrollbars`, `mouse-wheel-controls`. Second, a `.feature` **without** one: `appearance-preference`, `generation-control`, `infinite-grid`, `keyboard-grid-navigation`, `keyboard-grid-reachability`, `pattern-library`, `while-the-pattern-library-is-open` — seven of twelve, and the majority state. This second state is the _default_ rather than a gap. It says the feature's claims are stated in Gherkin and driven by its generated spec, with no residue left over. So an absent `.e2e.spec.ts` is not missing browser coverage.

   Third, a hand-written spec **with no** `.feature`: `hover-click-agreement` and `hud-layout-and-shortcuts`. There are two, since `convert-modal-inertness-to-scenarios` restated the third as `features/while-the-pattern-library-is-open.feature`. Their subject matter is residue end to end. `product`'s plain-English outline specifies them instead. Each records that outline in its own header comment, so the accepted behavior stays written down.

   **What residue is — four categories, and you may add nothing else here.** (1) **Hit-testing and stacking**: which element receives a pointer event where two overlap. (2) The **computed accessibility tree** — what a browser's own accessible-name/description algorithm delivers. That is distinct from the attributes it is computed from, which a step module can read for itself and jsdom only reimplements. (3) **Rendered pixel geometry**: a measured box, a pixel coordinate, an element resolved by point. (4) **Native-event delivery** — an event carrying fields no step sends, such as a wheel with both axes populated.

   **Anything expressible as a `.feature` scenario goes there instead.**

   **Rendered colour is none of the four, and was adjudicated rather than assumed** (`dark-mode-following-system-appearance`, CONTRACT). Category 3 is pixel _geometry_ — a box, a coordinate, an element resolved by point — and a palette is not that. Which appearance is in effect _is_ expressible at domain altitude, so it is Gherkin. What the palette actually looks like is a judgement the user makes by eye. Per that slice's standing ruling, assert it **nowhere**, rather than pinning it in a spec a palette tweak would break.

   This enumeration binds the hand-written `*.e2e.spec.ts` layer only. A screenplay question helper reading a rendered colour for a `.feature` step, as `appearanceInEffect` does, is outside it. A claim that seems to need implementation vocabulary is a prompt to re-read `.gherkin-lintrc`'s altitude rules. It is not a licence to write the claim here.

   **A claim can be contract-eligible and still go quietly empty, and that is not a fifth category.** `engineering.md`'s question 2 asks whether a scenario would be **false** at another viewport. What it does not cover is one that would be **vacuous** — still true, guarding nothing. `rule-on-chrome-propagation-guards` ruled on this in CONTRACT mode. **Send the claim to the contract, and record the layout fact it leans on as prose in the `.feature`. Write no precondition step.**

   **Where a vacuity worry does buy something is a clause saying the act happened.** Pair the claim with a clause that fails when the act never landed — `Then the zoom percentage should be 125 / And no cell should be alive`. Put that clause **first**, so a missed act reports as a missed act. Record in the scenario's prose which of the two is the canary.

   Two claims of this shape can look identical and behave differently under the same fault. Only running the fault tells them apart. The hand-written tests this ruling retires recorded neither. The headers they carried before `correct-hand-written-spec-headers` both asserted the claim was unstateable.

<!-- Closed decision: the fault run that separated the canary from the non-canary, and why the layout fact stays prose rather than becoming a precondition step, are in `testing-layers.rationale.md`. -->

**Every hand-written test carries a header naming the claim it uniquely holds**, and that header is what licenses the test to keep existing. `triage-paired-specs` generalized the `feature-prose-honesty` pattern from `.feature` prose to this layer, and this is the durable form of that triage. The reverse obligation comes with it: do not delete a test here without restating its claim in `features/**`.

A deletion resting on **subsumption** is the weak case, and it must say so in the commit that makes it. Subsumption means a surviving sibling that happens to make the same claim, rather than a demonstrated failure. Such coverage is usually _incidental_ — it holds only for the sibling's current inputs — and it can evaporate later with nothing going red. That is the same failure `ruler-label-axis-affordance` measured one affordance earlier.

**What the header must record — three things, and the third is the one that stops it rotting.** (a) The **claim**: what this test uniquely holds, in the vocabulary of the product rather than of the assertion. (b) The **channel that does not carry it**, named specifically. "The zoom badge rounds to whole percents, so it cannot see a difference of a tenth of a pixel" is a channel. "Category 3" and "no scenario can state this" are not.

A category number records which drawer the claim was filed in and licenses nothing. The four categories above are a closed list of where claims have landed. They are not an argument any one test may borrow.

(c) **What would make (b) false** — the invalidating condition. Write it as a condition someone could later observe: _if the badge ever announces a precise value, this test is redundant_.

Note that (b) and (c) are what `engineering.md`'s three placement questions produce as a by-product. So a header is cheap to write at the moment the placement is decided, and expensive to reconstruct afterwards.

**An invalidating condition is not a deletion trigger, and the two are opposite instructions to a later reader.** A deletion trigger belongs to a **workaround that owes a payoff** — an ARIA reach-around confined to one function, naming the slice that will retire it. It invites someone to clear it, and the debt is the point. An invalidating condition belongs to a **decision that is correct today**, and invites someone to re-check it rather than clear it. A test whose condition still holds is not debt, and its header is not a to-do list. The same distinction is drawn below, where `rules/no-domain-imports-in-bdd-steps.yml` carries invalidating conditions rather than a deletion trigger.

**Standing obligation: whenever you edit a file, re-check the header of every test in it.** Headers rot silently and in the licensing direction. A stale one keeps arguing for a test that no longer needs to be here, and nothing goes red. Three decay modes have been measured: a **misremembered rule**, a **capability gained elsewhere**, and an **argument outliving its subject**. None of the three is discoverable from the test it sits on, since each is falsified by an edit to a _different_ file.

That is why this obligation attaches to editing rather than to authoring. A header found inaccurate is `product`'s to correct, the whole directory being its manifest.

<!-- Closed decision: the 33-test header audit that produced this obligation, and one worked example of each decay mode, are in `testing-layers.rationale.md`. -->

**Two Playwright projects, one directory, both alive.** `playwright.config.ts` defines `e2e` and `bdd`. `e2e` carries `testDir` `features/` and `testMatch` `**/*.e2e.spec.ts`, the hand-written specs above. `bdd` uses `defineBddProject` from playwright-bdd 9.2.0, which compiles `features/*.feature` against the step definitions in `features/steps/*.ts` and writes generated specs into `.features-gen/bdd/features/`. **Every `features/*.feature` generates**: the `pattern-library-steps` slice wrote the step module the last one was missing.

`testDir` and `testMatch` sit on the `e2e` project rather than at the config root. That placement is deliberate, so the second project cannot inherit a glob built for the first and silently match nothing.

**Count the two projects with `npm run test:e2e -- --list` rather than reading a figure here.** Only adding a scenario or an Examples row moves the `bdd` count, since playwright-bdd generates one spec per scenario or row. A reword adds no test. That is the fact to reason from, rather than "no `.feature` was touched".

**bddgen is all-or-nothing.** That is the standing constraint on adding a feature, rather than a fact about any one of them. A single `.feature` with a missing step definition and it exits 1, having generated nothing at all. So a new `.feature` lands together with its `features/steps/` module, or the entire `bdd` project stops generating — not just that feature's spec.

**`.features-gen/` is this repo's first generated artifact. Never edit it, never cite it as source, never commit it.** It is gitignored, Prettier-ignored, oxlint-ignored, and subtracted from `vite.config.ts`'s `sharedExclude`. Without that last one, vitest's unrooted `unit` include collects the generated specs. The `.feature` file and its step module are the source. A generated spec has the same status as `dist/`, so a finding in one is a finding in one of its two inputs.

**Nothing regenerates it automatically, which is why `npm run test:e2e` is the only supported way to run Playwright here.** With `.features-gen/` absent, the `bdd` project's `testDir` matches nothing and Playwright reports the `e2e` project alone, exit 0 and no warning. That is the same failure shape as a Stryker `ignorePatterns` glob matching nothing, a `-t` pattern matching nothing, and a vitest project `include` matching nothing. `mutation-testing.md` documents all three. A **stale** `.features-gen/` is quieter still: playwright-bdd has no staleness detection of its own, so an edited `.feature` runs against the previous generation's spec.

`playwright.config.ts` therefore refuses to load when the generated output is missing, empty, or older than any `features/*.feature` or `features/steps/*.ts`, and it says which. That check is skipped only during the generation phase itself, which bddgen marks by setting `PLAYWRIGHT_BDD_GEN=1`. Read that as a bare env var, because playwright-bdd 9.2.0 does not export the helper that sets it from the package index. Without that branch the guard would refuse to load the config bddgen needs in order to clear the guard. bddgen rewrites every output file unconditionally, so the staleness check self-heals and a spurious fire costs one `npm run test:e2e`.

**The step registry is global across `features/steps/`, and bddgen is the only thing that checks it.** playwright-bdd loads every step module for every feature. So a step text defined in two modules is an ambiguous-step error rather than an override. A step text moved out from under a feature that borrowed it is a missing-definition error. Both exit 1 naming the files involved.

**This is the second guarantee riding on the guard above.** Skipping bddgen skips the cross-module check as well as the tests, and there is no other.

No ast-grep rule can supply it. A homegrown text-uniqueness checker would answer a different question than the runner does.

The convention that keeps this legible: **define a step shared by several features once, in the module the step is _about_**. A borrower gets it by writing the same text and defining nothing. `rules/no-domain-imports-in-bdd-steps.yml` forbids a step module importing another, since the sharing is a registry fact and an import would dress it up as a module dependency.

**Re-derive which modules lend to which features when you need to know; no map is kept here.** The method: match every step line in `features/*.feature` against every step pattern in `features/steps/*.ts`. Then confirm each unmatched line is defined in the feature's own module. A map recorded in prose has rotted twice, and two instruments have since disagreed about it.

<!-- Closed decision: the map as it stood, its two corrections, and the unresolved disagreement between two instruments, are in `testing-layers.rationale.md`. -->

**A step's `Given`/`When`/`Then` keyword is not part of its identity here.** That is a config default rather than a property of the runner. playwright-bdd matches by step text alone, and filters by keyword only when `matchKeywords` is set, which this repo does not set. So a step registered with `When(...)` matches from a `Given` position and vice versa, and `features/pattern-library.feature` leans on that.

**Do not reach for the option when a keyword reads oddly. Reword the step, and that is `product`'s call.** Turning `matchKeywords` on breaks one keyword-position use while leaving other uses of the same step untouched. Because bddgen is all-or-nothing, the whole `bdd` project then stops generating.

<!-- Closed decision: the reading of playwright-bdd's own source behind that ruling, and why a `Given` twin of an existing `When` is not an available fix, are in `testing-layers.rationale.md`. -->

**`features/e2e-helpers.ts` is the single module a step module may import.** That is mandated rather than conventional: `rules/no-domain-imports-in-bdd-steps.yml`'s allowlist is exactly `playwright-bdd`, `@playwright/test` and `../e2e-helpers`. Anything a step needs that it cannot reach through that module is **added to the `features/screenplay/` module that owns it, then re-exported from the barrel**. Never import around it. `e2e-helpers.ts` is now a pure re-export file, so writing a function body in it would be the wrong fix in the other direction.

**The mandate was re-asked after the decomposition and re-ratified.** What it survives on is that the barrel is a curated surface rather than a full republish. It withholds a dozen names that have no importer outside the layer, most of them raw `Locator` factories in `features/screenplay/elements.ts`. Those are what make "this module names no selector of its own" structurally true of a step module, rather than aspirational. **A path allowlist cannot express it**, because it sees paths and never names.

The rule records its invalidating conditions rather than a deletion trigger. **No count of the barrel's exports is kept here.** It grows with the layer, and the figure has gone stale four times. Count it when you need it.

<!-- Closed decision: the four measurements behind the re-ratification, and the objection that the barrel would die with the paired specs, are in `testing-layers.rationale.md`. -->

The screenplay layer is shared with the hand-written `*.e2e.spec.ts` specs — same layer, same rules. It is also where this layer's ARIA reach-arounds are confined whenever one exists. **The confinement is the discipline, and it is general rather than a note attached to whichever one is outstanding.** A reach-around lives in exactly one function, never as an idiom several call sites reach for. It carries a **deletion trigger** beside it, naming the slice that will retire it. **Zero are live.**

**A reach-around stands in for a perception the accessible tree does not offer at all** — a paint class, a pixel proportion. It owes an affordance idea named beside it. A structural query for something a user genuinely can perceive owes nothing.

`patternCategoryInLibrary` is the worked distinction. It reads document order that _is_ the affordance heading navigation gives an AT user. So it has no idea filed, and should not grow one. Adding attributes for query convenience is a test hook wearing an affordance's name.

<!-- Closed decision: the two reach-arounds that were paid off, what the second one's retirement removed downstream, and why `patternCategoryInLibrary` is not a third, are in `testing-layers.rationale.md`. -->

**`features/e2e-helpers.ts` has been split, and survives the split as a re-exporting barrel.** The `screenplay-e2e-decomposition` slice moved its contents into `features/screenplay/`, one module per Screenplay-pattern role. `viewport.ts` holds the fixed camera and viewport facts and imports nothing. `notepad.ts` holds scenario-scoped scratch state, keyed by the `page` fixture since this suite has no Actors. `elements.ts` holds the PageElements — how a thing is reached.

`questions.ts` reads and never asserts. `interactions.ts` holds one user act each. `tasks.ts` holds goals composed of interactions, and `expectations.ts` holds the assertions.

The layering under the barrel is a DAG. Viewport and notepad import no sibling, and elements imports none either. Questions and interactions import elements; tasks imports elements, interactions and viewport; expectations imports elements and tasks. `rules/no-barrel-import-in-screenplay.yml` keeps it acyclic by making the barrel a sink. A module reaching back through `../e2e-helpers` closes a cycle ESM tolerates silently, until a `const` lands in its temporal dead zone.

`rules/no-expect-in-screenplay-questions.yml` holds `questions.ts` to its non-assertion contract. It is scoped to that one file because Playwright's retrying assertion is the sanctioned _wait_ primitive, and `interactions.ts` legitimately uses it as one. `e2e-helpers.ts` keeps publishing the names the step modules and specs were already using. Each is explicitly named rather than an `export *`, so the surface is readable as a list.

_The two rules below are facts two and three of the three-fact enumeration headed "The black-box step form" in `archive.md`. That article keeps the intro and fact one, and argues why each of the three was kept. These two are here because their subjects still exist: `features/steps/`, `features/screenplay/`, and the e2e layer's activation routes._

_Second, harness-style code is test infrastructure and is **not** expected to carry its own unit tests._ **This is the fact that outlived its subject.** The harness is gone, but `features/steps/` and `features/screenplay/` are the same category and inherit the ruling verbatim. They are the `features/`-side peers of `src/test-support/`, which `crap4ts.config.ts` and `stryker.config.json` already exclude for exactly this reason. Requiring coverage of it would gate a category this repo has deliberately decided not to gate. That is not the same as unverified.

_Third, a `fireEvent.click` on a cell in the deleted step layer was **not** the route a mouse user takes._ _The difference was not a jsdom artifact._ **There is now exactly one black-box layer, and this is why losing the other cost no reach.** The two used to be nested rather than complementary, and the survivor is the outer one.

The e2e layer drives both the pointer route and the keyboard one. The deleted layer drove only the keyboard route, and never exercised hit-testing at all. What survives of this is the narrow half only. It is now a warning about a layer nobody can run. **A green jsdom run was never evidence about hit-testing**, which is exactly what it could not see.

<!-- Closed decision: the mutation run behind the harness ruling, the fault injection that measured the two activation routes, and the commit whose opposite conclusion this corrects, are in `testing-layers.rationale.md`. -->

There is no single default jsdom run any more. `vite.config.ts`'s `test.projects` splits the main vitest config into `unit`/`property` in Node and `dom` in jsdom — see CLAUDE.md's compact module map, and `architecture.md`. All three projects still exclude `**/*.e2e.spec.ts`, `**/*.browser.test.ts` and `**/*.perf.spec.ts` via the shared `exclude` list. So the three runners never collide: this config, `vitest.browser.config.ts`, and Playwright.

That same shared list also subtracts whole **directories** — `scripts/`, `ideas/`, `.claude/`, `.stryker-tmp*/` and `.features-gen/`. It has to, because the `unit` project inherits an **unrooted** include, so every directory in the checkout is reachable unless `sharedExclude` names it. See `vite.config.ts`'s comment on why it subtracts rather than declaring its own include.

**That is a live hazard rather than housekeeping.** A stray `.test.ts` dropped into `perf/`, `rules/`, `rule-tests/`, `patches/` or `public/` is still collected into `unit` and run in Node. Those five are deliberately left unexcluded. A name added here for a directory that might one day hold a legitimate colocated test would exclude it silently. The merge protocol's mutation-invariant clause explains which paths the exclusion is genuinely owed to.

`npm test` and `npx vitest run` with no `--project` flag run all three projects. `npm run test:unit` and `npm run test:property` narrow to a subset via `--project`. That flag is the only way to filter which projects run once `test.projects` is set, because a plain `--exclude` on the CLI has no effect there. `--project` matches by the project's `name`. So `npx vitest run --project dom <path>` is how to run one project's slice of the suite, as is the bare `name` or a `!name` negation, which is what `test:unit` uses.

**Be aware a vitest project whose `include` glob matches nothing simply reports 0 files and exits 0.** There is no warning. If `dom`'s globs — `src/components/**` and `src/hooks/**` — ever stop matching anything because one of those directories gets renamed, `npm test` stays green while quietly running none of that project's files. See the comment in `vite.config.ts` for the other files that same rename would need to update.

<!-- Closed decision: the measured collection counts behind these three hazards are in `testing-layers.rationale.md`. -->

`perf/` is a fifth top-level directory of Playwright specs, and deliberately **not** a fifth test layer. It measures render cost and asserts nothing about performance — see `perf/README.md`. It is outside every quality gate on purpose, which is why the split described in `quality-tooling.md` matters: the numbers themselves are computed in `scripts/perf-report/`, which is gated.
