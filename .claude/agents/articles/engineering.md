# Article: Engineering Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/engineering.prompt`) for this repo's actual TypeScript/npm toolchain. Every role listed in `.claude/agents/` should follow these rules; role-specific files add to this, they do not repeat it.

## Design and testability

- Work in small, reviewable increments — one approved behavior slice at a time, not a batch of unrelated changes.
- Prefer the simplest design that supports the current behavior and leaves clear options for the next step.
- Keep tests close to the behavior being changed.
- **This repo's layering is three-deep** — framework-free modules, then hooks, then components. `CLAUDE.md`'s compact module map names the concrete files at each layer, and `architecture.md` and `state-flow.md` in this directory carry the account. Read them there rather than from a list restated here.

  Push new logic down into a framework-free module whenever it can be expressed as a pure function. A hook should stay a thin adapter around one browser API. Logic pushed down stays covered by unit tests, property tests and mutation testing, rather than stranded where none of them reach it.

**Where a comment goes is a design decision too.** A `//` comment is invisible to `LSP` hover, and declaration emit strips it. So put anything a _caller_ needs above the declaration, in JSDoc. Everything about how the thing works inside stays `//`. `.claude/agents/articles/doc-comments.md` carries that partition, the hover budget it implies, the paired sidecar overflow tier beside the source, and the reading habit that makes it pay. **Read it before writing or moving a comment block.**

## Where guidance and file names live

These docs describe the codebase as it currently stands, not a contract that freezes it. Three standing rules follow from that:

- **File and module names in these docs are a snapshot, not a permanent architecture.** A sentence naming `Grid.tsx`, or any other file, as the place a concern currently lives describes today's structure. It is never a reason to avoid a split that is otherwise the right call. The layering above _is_ the durable contract. Which files realize it is not.
- **A split makes the docs stale, and the role that performs it reports rather than edits.** Name both surfaces at handoff: `CLAUDE.md`'s compact module map, which carries names and layer only, and `architecture.md` or `state-flow.md` in this directory, which carries the contracts that span modules. Per-module detail belongs in the module's own JSDoc hover. See CLAUDE.md's Conventions — no role edits a role file, an article, or `CLAUDE.md`.

  **Prefer fixing the root cause.** If a doc restates a tool's `include`/`mutate` list, or re-enumerates the Architecture section's files, replace the copy with a pointer to the config file or to `CLAUDE.md`. A pointer cannot go stale.

  **Under concurrent slices, make that `CLAUDE.md` correction its own commit.** You still own it and still perform it. Land it as a separate, final commit on your slice branch that touches `CLAUDE.md` and nothing else. Say in your handoff which sentences you changed.

  Two slices routinely touch the module map and its two articles at once. Isolating the edit confines any conflict to a commit whose entire content is the change being merged, rather than smearing it through a structural diff. If it does conflict, re-derive the paragraph from both branches' facts. Never take one side wholesale: both describe real modules that now both exist.

- **Guidance that applies to more than one role belongs in a shared article.** Facts about the codebase belong in the **topic article** that covers them under `.claude/agents/articles/`, not in `CLAUDE.md`. "Every session loads it automatically" is a cost, not a distribution channel. CLAUDE.md is auto-loaded into every session **and every subagent**. Its size therefore taxes all five roles and the orchestrating session before any of them does any work. It grew to 256KB, roughly 64k tokens, precisely by treating auto-loading as free.

  It is now a routing index: the command list, a compact module map, the conventions, the orchestrating session's own procedures, and one pointer per article.

  See CLAUDE.md's "Where new documentation goes" for the six-way routing test that places a new paragraph. Note its last clause. A new topic gets a new article. And **an article nobody is told to read is worse than no article**: the fact is then invisible rather than merely long.

  Do not copy either kind into an individual role file. Duplicates drift out of sync, and putting a general concern in one role's file implies that role owns it. A role file carries only what is specific to that role.

## Which test layer a test belongs in

`testing-layers.md` in this directory describes three test layers, plus the Gherkin contract they answer to. The black-box layer runs as two Playwright projects, and those are **not** two ways of writing the same test. **Place a test by what it verifies, not by what it needs to run.** Three of the four placements below run in a real browser, and none is interchangeable with another:

- **Browser-required unit test** (`src/**/*.browser.test.ts`, `npm run test:browser`) — only when the test verifies **one module's own contract against a native browser API jsdom cannot faithfully simulate**. It imports that module directly, with no running app. This is a unit test that happens to need a browser, so it belongs to `coder`, `cleaner` and `architect` like any other unit test.
- **Generated e2e** (a scenario in `features/*.feature`, executed against its `features/steps/*.ts` module as `npm run test:e2e`'s `bdd` project) — **the default for anything a user can observe.** A user-facing claim goes here unless it demonstrably cannot be stated at domain altitude. It is not the weaker instrument of the two. It runs the same real Chromium, the same fixed 1280×900 viewport and the same `features/e2e-helpers.ts` barrel. A step module is ordinary TypeScript, with the whole Playwright API available. Over a hand-written spec it buys three things: a claim legible to a stakeholder, an altitude check from `npm run gherkin-lint`, and a mutation score from `npm run acceptance-mutation`. `product` writes it in SPECIFY mode.
- **Hand-written e2e spec** (`features/*.e2e.spec.ts`, `npm run test:e2e`'s `e2e` project) — **only for a claim the contract demonstrably cannot state.** `testing-layers.md`'s item 4 enumerates those as four categories of _residue_, and closes the list. Read it there. The runner, the viewport and the helpers match the bullet above, so this layer buys only the ability to say something Gherkin cannot. **An assertion here that a scenario already makes is duplication, not defence in depth.** `testing-layers.md` records the triage that deleted 35 tests and one whole spec file on that reading. `product` writes it in VERIFY mode.
- **Ordinary unit test** (`src/**/*.test.ts(x)`) — everything jsdom can express faithfully, which is nearly everything. This is the default for a module's own contract. The two e2e bullets above default only over what a user can observe. Reach for the browser-required layer only after establishing that jsdom genuinely cannot reproduce the behavior.

**Both e2e placements belong to `product` alone**, and only `product` writes either — the contract in SPECIFY, the residue in VERIFY. Needing a real browser is not what makes a test an e2e test; being about a user-facing feature rather than an implementation's contract is. `product` **reports** the `src/` defects either one finds rather than fixing them; see `handoffs.md`'s "Defect adjudication".

**Three questions decide that fork.** The four residue categories describe where claims have already landed; these decide where a new one goes. Ask them in order, and note each has a routing — a question that does not route is decoration.

1. **What is the assertion a proxy for?** A measured box, a pixel coordinate or a class name almost always stands in for something nameable. Two boxes differing was a proxy for _the preview is somewhere else now_, and "somewhere" proved nameable through coordinates the preview already announced. Name the thing, and the scenario states the name — **generated**. If the measurement genuinely _is_ the claim, there is nothing to name — **hand-written**.
2. **Would the scenario be false at a different viewport while the product is still correct?** The sharpest single question, and the one that settles most disputes here. **Yes** → the assertion pins this harness's frame rather than a promise to a user. It is residue at best, and belongs where the fixed viewport is declared — **hand-written**, if it survives question 1 at all. **No** → it is a domain claim that merely happened to be measured in pixels — **generated**.

   Beware the near-miss. An asymmetry that holds only at 1280×900 can be doing real work, which is what makes one ruler test an axis-swap guard. That makes it residue rather than a domain claim. It is not an exception to the question.

3. **Does an announced channel already carry it?** Ask whether one _exists_, not whether one could be added. If an accessible name, role, state or description already says it, the scenario reads that — **generated**. If nothing announces it, that is a **finding, not a licence**. A perception a real user needs and the accessible tree does not offer is an observability gap. It is `architect`'s to adjudicate in CONTRACT mode, and it can become a slice of its own — `aria-pressed-cell-state`, `ruler-label-axis-affordance` and `scrollbar-visible-proportion-affordance` each began exactly there.

   **Never invent an affordance whose only consumer is the test.** That is a test hook wearing an affordance's name. Until such a slice lands the claim is **hand-written** residue, or it is asserted nowhere. Both are legitimate, and which applies is a product call.

A hand-written test that survives all three carries a header saying so, and what that header must record is item 4's business — see `testing-layers.md`.

**The browser-required layer is additive only.** `crap4ts` and `npm run test:mutation` cannot see `*.browser.test.ts` files at all. `vite.config.ts`'s own comment explains the mechanism, beside the exclusion that causes it.

Never substitute a browser-required test for a jsdom one. Deleting a jsdom assertion for a browser-mode equivalent silently drops that module's coverage and mutation score, while the suite still looks green. Closing a CRAP or mutation gap with a test in this layer does not close it. It hides it. **Add to this layer; never move into it.**

## Writing a property test

Property tests (`@fast-check/vitest`, `*.property.test.ts`) cover every framework-free module. **`architect` and `cleaner` write them** — `cleaner` to raise coverage and to kill a surviving mutant a unit test cannot reach, `architect` in its review pass. `coder` writes focused unit tests and never property tests, which is why its fast path (`npm run test:unit`) skips that layer entirely. `hardener` and `product` confirm the results but do not author them. Two rules apply whenever a property test is added or changed.

### Which layer states which claim

**A property states a law that a whole family of implementations satisfies. A unit test names one member of that family.** Neither does the other's job, and the choice follows from which kind of claim you have.

**The division between the two layers is clean, and it generalizes.** The properties caught every change to the _shape_ of the relationship and none to its _calibration_. The unit tests caught exactly the reverse. The fault-injection run behind that claim is in `engineering.rationale.md`.

So:

- **Reach for a property** when the claim is a relationship that survives changing the inputs, and the input space is too large to enumerate. Round trip, inverse, idempotence, composition, ordering, an invariant preserved across an operation, agreement with an independent oracle.
- **Reach for a unit test** when the claim names a value: a constant, a rung, a boundary, which branch ran, which field was read. A property attempting one of these can only do it by restating the implementation. It then agrees with the code by construction, and can never fail.
- **Expect to need both.** A module whose law is pinned but whose constants are not is satisfied by infinitely many wrong implementations. The reverse passes every named case and drifts everywhere between them.

**Two ways this goes wrong, and both were measured rather than hypothesized.** A property that restates the implementation's own formula is an equivalence check rather than a test. And **a property is only as strong as the region its arbitrary actually samples**. An arbitrary whose draws crowd into one corner of its declared bounds leaves the rest untested, while reporting green. **Ask what your arbitrary draws, not what its bounds are.**

- **Pin the degenerate values deterministically; do not leave them to the generator.** A property over a broad arbitrary finds a defect only when the draw happens to produce it. Assert the boundary cases directly, alongside the property: `NaN`, `±0`, Invalid Date, empty `Set`/`Map`/array/object, single-element collections, and size or length comparisons in **both** directions. Subset as well as superset: a one-directional check lets `if (a.size !== b.size)` → `if (false)` survive mutation.
- **Show a new property is non-vacuous before you trust it.** Temporarily break the code it exists to protect and confirm that property fails; then restore. A property that still passes against a deliberately broken implementation is documentation, not a test. If the break turns out to be undetectable, that _is_ the finding — reweight the arbitrary toward the near-misses rather than accepting the pass.

**Narrowing an arbitrary to make a finding go away is not a fix.** Filtering the failing draw out of the generator leaves the defect in the module, and removes the only thing that could find it. It is the same move as weakening an ast-grep rule to clear a violation. Fix the module.

**Accept a property whose failure mode is a float boundary on a repeated run, never on a run.** This is an acceptance standard rather than a third authoring rule. One green run is no evidence about a defect the arbitrary hits a fraction of a percent of the time. `slice/smooth-zoom-transitions` settled on 120 to 150 repeated runs of the file, plus a bulk replay of that file's own arbitraries. It found a real overshoot in `zoomGlide.ts` that each single run had roughly a 0.35% chance of catching.

<!-- Closed decision: the eight-fault run that established the property/unit split, the arbitrary whose draws crowded toward zero, and the Invalid Date defect that paid for both rules, are in `engineering.rationale.md`. -->

**Two sections about the mutation runner used to sit here and now live in `mutation-testing.md`.** They
cover how to rule a survivor equivalent, and when `it.skipIf('__stryker__' in globalThis)` is an accepted
idiom. They moved to the article whose read trigger already named the first of them. `architect` owns the
equivalence ruling and carries a trigger for that article. Anyone else reports a suspected equivalent
rather than closing the question.

## Structural rules (ast-grep)

`rules/*.yml`, wired up by `sgconfig.yml`, encode architectural invariants that were previously prose. They cover the framework-free layering, and repo conventions like "no manual `useMemo`/`useCallback` under an enabled React Compiler". `ast-grep-rules.md` in this directory lists every rule with its scope and says what each one checks. It is also the file `agent-doc-check`'s check 5 reads, so it is the one place the list lives. **Read it there.** A list restated here would go stale the moment a rule is added.

- **`npm run ast-grep` is report-only for findings: a rule matching your code does not move the exit code**, because every rule is `severity: warning`. **Read its output** — never infer cleanliness from the exit code. A rule that matches nothing reports nothing, which is byte-identical to a clean codebase. Every role that changes code should run it; it takes under a second and prints nothing when clean.
- The exit code is not meaningless, though — it answers a different question, and a nonzero one always warrants investigation. `ast-grep-rules.md` carries the measured meanings and the silent middle to watch for; read them there rather than from a second copy here.
- **Never make a violation go away by weakening the rule.** Editing `rules/*.yml`, adding an `ignores:` entry, or moving a file out of a `files:` glob is not a fix. It silently disarms the check for everyone afterward, and the disarming is invisible: a dead rule and a satisfied rule look the same. Rules belong to `architect`. Fix the code, or report the tension and let `architect` decide.
- **Rule files are ordinary prettier-formatted YAML** — `npm run format` covers them like anything else. `rule-tests/__snapshots__/` is in `.prettierignore` on purpose, since ast-grep regenerates those on every `npm run ast-grep:test` and formatting them would churn.
- This repo has three report-only checkers, and each has one owner even though anyone may read them. **`ast-grep`**: every role reads it, and `architect` owns the rules and their fixtures. **`halstead4ts`**: `architect`. **`gherkin-dry`**: `product`. "Report-only" constrains how you read the result, not whether you run it. None of the three may block a handoff on its own numbers. None may be skipped on the grounds that it cannot fail.

## Acceptance pipeline

- This repo has already built its own local adaptation of unclebob/Acceptance-Pipeline-Specification's concept — `scripts/acceptance-mutation/` — rather than installing APS's own `gherkin-parser`/`gherkin-mutator` binaries. Use this existing script and its conventions; do not introduce a separate acceptance-pipeline toolchain.
- Gherkin acceptance mutation in this repo means `npm run acceptance-mutation`. It mutates `.feature` Examples-table values, never source code, then reruns the target's generated Playwright spec to check whether the scenario notices. `acceptance-mutation.md` in this directory carries the batching and the `bddgen` step. Targets are every `.feature` file present in `features/`. The runner no longer pairs one against a `*.steps.test.ts(x)` file.

## Working inside scripts/

`scripts/` is a separate TypeScript project from `src/` and `features/`. It has its own vitest config, coverage directory, CRAP config and Stryker config. `quality-tooling.md` in this directory describes the advisory programs, and CLAUDE.md carries the full entry for each gating one. It counted seven when eight had landed, so count the directories under `scripts/` rather than trusting a figure in prose. It is the tooling every other role's quality gate runs on, so it is held to the same bar as `src/`. Use the parallel set of commands, never the `src/`-scoped ones.

Most are report-only. **These are the exceptions and genuinely gate:** `npm run ast-grep:rules`, `npm run agent-doc-check`, `npm run reference-check` and `npm run mutation-invariance`. Each exits non-zero on what it checks:

- a misconfigured rule file
- docs that state something mechanically false
- a comment or doc line naming a file, symbol or line number that does not resolve
- a mutation-invariance allowlist entry that no longer holds against the tree

**Read `npm run mutation-invariance`'s exit code carefully, because it carries three meanings rather than two.** 0 is invariant, 2 is not invariant, and **1 means the config failed validation, so no verdict exists** — never read 1 as a pass. It is also the one no role runs. The orchestrating session runs it at merge step 3, and CLAUDE.md's merge protocol is the source of truth for when.

Do not generalize "the `scripts/` tools are advisory" to any of these four.

**A new program in `scripts/` is picked up automatically.** `crap4ts.scripts.config.ts`'s `include` and `stryker.scripts.config.json`'s `mutate` are glob-minus-exclusion rather than hand-maintained lists, and each config states its own reasoning. **What you must still do by hand is add an exclusion** when a new file genuinely should not be measured. The failure then shows up as a loud threshold breach rather than as silence.

<!-- Closed decision: why those lists stopped being enumerated, and why `.dry4tsrc.json`'s `**/run.ts` exclusion is deliberately broader than its intent, are in `engineering.rationale.md`. -->

- Work performed inside `scripts/` runs the scripts-scoped pipeline: `npm run test:scripts`, `npm run test:coverage:scripts`, `npm run crap4ts:scripts`, `npm run dry4ts:scripts`, `npm run test:mutation:scripts`. The `src/`-scoped commands (`npm test`, `npm run test:unit`, `npm run crap4ts`, `npm run dry4ts`, `npm run test:mutation`) cannot see `scripts/` at all — `vite.config.ts` excludes it, and the three tool configs are scoped to `src/`. The reverse holds too: do not reach for the `:scripts` commands when your change was in `src/`/`features/`; they would report on code you did not touch.
- `coder` substitutes `npm run test:scripts` for `npm run test:unit`. There is no fast/slow split to make here. `scripts/` has no separate property vitest _project_, so whatever property tests it holds already run inside `test:scripts` — both the fast path and the whole path.
- `cleaner` substitutes `npm run crap4ts:scripts` for `npm run crap4ts`, `npm run dry4ts:scripts` for `npm run dry4ts`, and `npm run test:scripts` for `npm run test:unit`. Its scoped mutation scan becomes `npx stryker run stryker.scripts.config.json --mutate <changed-file-glob>` rather than a bare `npx stryker run --mutate ...`, which would pick up the `src/` config.
- `architect` substitutes `npm run test:scripts` for its full `npm test` run. There is no scripts-scoped Halstead command. Read `scripts/` Halstead numbers, if you want them, by pointing `fta-cli` at the files directly. `npm run halstead4ts` resolves its file set from `crap4ts.config.ts`, which is scoped to `src/`.
- `hardener` substitutes `npm run test:mutation:scripts` for `npm run test:mutation`, `npm run crap4ts:scripts` for `npm run crap4ts`, and `npm run dry4ts:scripts` for `npm run dry4ts`. **Mutation thresholds are not the same on the two sides.** Read each from its own config, `stryker.config.json` and `stryker.scripts.config.json`, rather than from a figure restated here. `crap4ts:scripts` scores against `coverage-scripts/coverage-final.json`, so run `npm run test:coverage:scripts` first, the way you would `npm run test:coverage` before `npm run crap4ts`.
- `product` substitutes `npm run crap4ts:scripts` and `npm run dry4ts:scripts` in its final all-clean check. There are no Playwright e2e specs for `scripts/`, because these are CLI tools with no UI. The equivalent black-box check is running the tool itself and confirming its real output.
- No scripts-scoped counterpart of `npm run acceptance-mutation` or `npm run halstead4ts` exists, deliberately. Those _are_ the tools that live in `scripts/`, so "running them on scripts/" does not map onto anything. Verify changes to them by running them for real against `features/` and `src/`, and checking the output is unchanged. `acceptance-mutation` in particular has a baseline that any behavior change will move. **Take that figure from the most recent `product` VERIFY handoff on `main`, never from a number written down here.** With several slices in flight, a literal in this file is wrong the moment the second one lands.

- There is no scripts-scoped property _command_, so `architect`, `hardener` and `product` gain no counterpart to their `npm run test:property` obligation for `scripts/` work. Running `npm run test:scripts` discharges it, because that one config collects a property test there like any other. **The `*.property.test.ts` suffix is a naming convention in `scripts/`, not a project selector as it is in `src/`.** A file placed there gets no separate run and no separate obligation. The bar for adding one is the one in "Writing a property test" above.

- The browser-required layer still has no counterpart. `scripts/` is Node CLI tooling with no browser APIs to verify, so `npm run test:browser` has no scripts-scoped form and `hardener` skips that stage for `scripts/`-only work.
- `npm run build` already covers `scripts/` — `tsconfig.json` references `tsconfig.scripts.json`, so `tsc -b` type-checks it alongside `src/` and `vite.config.ts`. The existing "run `npm run build` before handoff, every time" rule below is all the build discipline `scripts/` needs; there is no separate scripts-scoped build command.

## Scoping a gate to your slice

Inside a worktree, the whole-repo gates (`crap4ts`, `dry4ts`, `test:mutation`, `ast-grep`, `dry4ts:scripts`, …) still report on the whole repo. What changes under concurrent slices is which of their findings are _yours_.

- Your slice's diff is `git diff --name-only main...HEAD` — the changed-files manifest from `handoffs.md`. A finding on a file in that list is yours to fix.
- A finding on a file outside it is pre-existing on `main`, or was inherited from a rebase. Report it; do not fix it. See `workflow.md`'s failure conditions.
- Anywhere a role's instructions say "the files the previous role touched", the file list comes from that manifest. Never from `git status`, and never from `git diff HEAD~1`. `cleaner`'s scoped mutation scan and `coder`'s per-file test-duration budget are the two cases.

## Verification before handoff

Ported from swarm-forge's six-pack branch's own `local-engineering.prompt`, which adds two rules on top of the generic constitution above:

- Every role except `product` in SPECIFY mode must run the relevant tests before handoff and fix any failures. (SPECIFY runs before any implementation exists, so there is nothing yet to verify; `product` in VERIFY mode runs everything.) In this repo that is `npm run test:unit` (fast path — unit tests + Gherkin acceptance tests, excludes property tests) unless a role's own file specifies the full `npm test` instead.
- `architect`, `hardener` and `product` must also confirm property-test results before handoff, with `npm run test:property` or the property-test portion of a full `npm test` run. They are the only roles that own that layer. `coder` and `cleaner` never need to run property tests, and nor does `product` in SPECIFY mode. That is a deliberate speed tradeoff, so the fast TDD and cleanup loop does not pay for property-test runtime on every iteration.
- Every role except `product` in SPECIFY mode must run `npm run build` before handoff, **every time**. Not just "when you happen to touch something that looks type-sensitive." Vitest does not type-check, so tests can stay fully green while `tsc -b` is red. This is not hypothetical: the case where a build break sat undetected for a full role is in `engineering.rationale.md`. Each role's own file names the exact step where `npm run build` belongs. Treat it as load-bearing, not optional.
- Run the relevant local verification command before handoff, whenever this repo has one for what you touched. `CLAUDE.md`'s Commands section carries the full list and what each covers. `npm run ast-grep` is the cheap one and applies to any code change. See "Structural rules (ast-grep)" above for why its exit code is not the signal.
- Whole-suite commands are safe to run concurrently **across worktrees**. Each slice's worktree has its own ports, its own `node_modules`, and its own `coverage/`, `reports/`, `test-results/`, `.stryker-tmp*`, `dist/` and `dist-perf/`. `dev-port.ts` derives a dev-server, Vitest-browser-API and `vite preview` port per checkout.
- Inside a **single** worktree the old rule stands unchanged. Avoid running whole-suite test commands concurrently when their outputs could interfere. Do not run `npm run test:mutation` and `npx playwright test` at the same time against the same dev server. Do not run `npm run test:coverage` while `npm run crap4ts` is reading `coverage/coverage-final.json`. `crap4ts` auto-discovers that path with no `--coverage` flag, unlike `crap4ts:scripts`, so a concurrent coverage run leaves it scoring a half-written report.

## Guardrails

- Do not hand-edit mutation-testing or Gherkin-acceptance-mutation manifests/reports; let the tools (Stryker, `scripts/acceptance-mutation`) generate and update them as part of their normal runs.
- Do not commit unrelated local changes or generated artifacts unless the task requires them.
- Before relying on an unfamiliar command or flag, check `--help` or the relevant script's source rather than guessing.
