# Article: Engineering Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/engineering.prompt`) for this repo's actual TypeScript/npm toolchain. Every role listed in `.claude/agents/` should follow these rules; role-specific files add to this, they don't repeat it.

## Design and testability

- Work in small, reviewable increments — one approved behavior slice at a time, not a batch of unrelated changes.
- Prefer the simplest design that supports the current behavior and leaves clear options for the next step.
- Keep tests close to the behavior being changed.
- This repo's layering is three-deep, and `CLAUDE.md`'s Architecture section names the concrete files at each layer (read it there rather than from a list restated here):
  1. **Framework-free modules** in `src/` hold the independently testable domain logic — no React, no DOM.
  2. **Hooks** in `src/hooks/` each own exactly one piece of state or one browser API and delegate the actual rules down to a framework-free module.
  3. **Components** in `src/components/` compose those hooks and modules and hold only what's genuinely DOM-coupled; above them sits a thin UI-adapter/bootstrap layer that stays outside unit testing.

  Push new logic down into a framework-free module whenever it can be expressed as a pure function — a hook should stay a thin adapter around one browser API — so it stays covered by unit tests, property tests, and mutation testing, not stranded where it can't be.

## Where guidance and file names live

These docs describe the codebase as it currently stands, not a contract that freezes it. Three standing rules follow from that:

- **File and module names in these docs are a snapshot, not a permanent architecture.** A sentence naming `Grid.tsx` (or any other file) as the place some concern currently lives is describing today's structure — it is never a reason to avoid a split that's otherwise the right call. The layering above (framework-free module → hook → component) _is_ the durable contract; which files realize it is not.
- **`cleaner` and `architect` may update the docs as part of a split they perform.** Both charters already include behavior-preserving splits/relocations. When one of them does that, updating `CLAUDE.md`'s Architecture section to describe the new structure, and fixing any file-list mentions elsewhere in `CLAUDE.md` or `.claude/agents/**` that the split just made stale, is a normal, expected part of the work — no separate per-task authorization needed. This is a factual-correctness exception to `workflow.md`'s "don't change another role's file" rule and nothing more: correct a stale file name or list, never a role's scope, boundaries, or workflow. If a split suggests some role's _responsibilities_ should change, say so and ask, as that rule requires. Prefer fixing the root cause — if a doc restates a tool's `include`/`mutate` list or re-enumerates the Architecture section's files, replace the copy with a pointer to the config file or to `CLAUDE.md` so it can't go stale again.

  **Under concurrent slices, make that `CLAUDE.md` correction its own commit.** You still own it and still perform it — but land it as a separate, final commit on your slice branch that touches `CLAUDE.md` and nothing else, and say in your handoff which sentences you changed. `CLAUDE.md`'s Architecture section is long prose that two slices routinely touch at once; isolating the edit means any conflict is confined to a commit whose entire content is the change being merged, rather than smeared through a structural diff. If it does conflict, re-derive the paragraph from both branches' facts — never take one side wholesale, because both are describing real modules that now both exist.

- **Guidance that applies to more than one role belongs in a shared article**, and facts about the codebase itself belong in `CLAUDE.md` (which every session loads automatically, so it already reaches every role). Don't copy either into an individual role file: duplicates drift out of sync, and putting a general concern in one role's file implies that role owns it. A role file should carry only what's specific to that role's own responsibilities.

## Which test layer a test belongs in

`CLAUDE.md`'s Testing structure section describes four layers; two of them run in a real browser, and they are not interchangeable. Place a test by what it verifies, not by what it needs to run:

- **Browser-required unit test** (`src/**/*.browser.test.ts`, `npm run test:browser`) — only when the test verifies **one module's own contract against a native browser API jsdom can't faithfully simulate**, importing that module directly with no running app. This is a unit test that happens to need a browser, and it belongs to `coder`/`cleaner`/`architect` like any other unit test.
- **Black-box e2e spec** (`features/*.e2e.spec.ts`, `npm run test:e2e`) — when the test boots the app and asserts user-visible behavior through the UI. This layer belongs to `product` alone, and only `product` writes it, in VERIFY mode. It **reports** `src/` defects it finds rather than fixing them; see `handoffs.md`'s "Defect adjudication". Needing a real browser is not what makes a test an e2e spec; being about a user-facing feature rather than an implementation's contract is.
- **Ordinary unit test** (`src/**/*.test.ts(x)`) — everything jsdom can express faithfully, which is nearly everything. This is the default; reach for the browser-required layer only after establishing that jsdom genuinely can't reproduce the behavior.

**The browser-required layer is additive only.** `vite.config.ts` excludes the `*.browser.test.ts` suffix, and `crap4ts` and `npm run test:mutation` both run through that config, so neither tool can see these files at all. Never substitute a browser-required test for a jsdom one — deleting a jsdom assertion in favor of a browser-mode equivalent silently drops that module's coverage and mutation score while the suite still looks green, and closing a CRAP or mutation gap with a test in this layer doesn't close it, it hides it. Add to this layer; never move into it.

## Writing a property test

Property tests (`@fast-check/vitest`, `*.property.test.ts`) cover every framework-free module, and **`architect` writes them** — `coder` writes focused unit tests and never property tests, which is why its fast path (`npm run test:unit`) skips that layer entirely. `hardener` and `product` confirm the results but don't author them. Two rules apply whenever `architect` adds or changes one.

- **Pin the degenerate values deterministically; don't leave them to the generator.** A property over a broad arbitrary finds a defect only when the draw happens to produce it. Assert the boundary cases directly, alongside the property: `NaN`, `±0`, Invalid Date, empty `Set`/`Map`/array/object, single-element collections, and size or length comparisons in **both** directions — subset as well as superset, since a one-directional check lets `if (a.size !== b.size)` → `if (false)` survive mutation.
- **Show a new property is non-vacuous before you trust it.** Temporarily break the code it exists to protect and confirm that property fails; then restore. A property that still passes against a deliberately broken implementation is documentation, not a test. If the break turns out to be undetectable, that _is_ the finding — reweight the arbitrary toward the near-misses rather than accepting the pass.

Both rules were paid for. In `import-utilities`, `datesEqual` compared two Invalid Dates as **unequal**, so an Invalid Date was the one container the shared equality walker reported as unequal to its own `structuredClone`. `coder`, `cleaner` and `architect` all ran the property suite green; it surfaced at `hardener` on roughly a 0.2% `fc.date()` draw. Reflexivity passed through a same-reference short-circuit and symmetry saw `false` in both directions, so exactly one property could catch it, and only sometimes.

**Narrowing an arbitrary to make a finding go away is not a fix.** Filtering Invalid Dates out of the generator would have left the defect in the module and removed the only thing that could find it — the same move as weakening an ast-grep rule to clear a violation. Fix the module.

## Skipping a test under the mutation runner

`it.skipIf('__stryker__' in globalThis)(...)` is an accepted idiom, under narrow conditions. Stryker instruments every expression with an impure mutant-tracking call, and a few assertions are about behavior that instrumentation structurally destroys rather than merely perturbs — the landed case is `useLiveCell.test.ts`'s "does not resubscribe on identical `(store, key)`", where wrapping `useSyncExternalStore`'s callback arguments defeats React Compiler's closure memoization and the assertion cannot hold. Left unskipped it fails during Stryker's dry run, before a single mutant executes, so `npm run test:mutation` never starts.

All four conditions must hold:

1. **The instrumentation destroys the asserted behavior**, not just makes it slow or flaky. If it's flakiness, fix the flake.
2. **Per test, never per file or per describe.** The skip is an exemption for one assertion; widening it exempts assertions nobody examined.
3. **The module's mutation coverage survives without it.** A skipped test kills no mutants, so the surrounding tests have to. Say at handoff that mutation score is unchanged, and let `hardener`'s run confirm it.
4. **A comment says why**, naming the mechanism — the next reader must not have to rediscover it.

The abuse shape is the mirror image: skipping a test _because_ it kills a mutant that is awkward to keep alive, or because it fails under Stryker for a reason nobody has explained. That converts a real gap into a green score, invisibly. `architect` rules on new uses of the idiom; anyone else who needs one reports it rather than adding it.

**`// Stryker disable` is not the better alternative here — that was measured, in `render-perf-improvements`, and rejected.** Stryker's instrumenter does support comment directives, so the obvious question is whether disabling mutants on just the affected declarations lets the test run. It does not, and the reason generalises: the React Compiler bailout is triggered by the _file's_ instrumentation, not by the individual mutant switches. Measured against the two landed cases:

| what was tried                                           | mutants measured in that file                        | does the test pass under Stryker |
| -------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| `it.skipIf` (what's landed)                              | `Grid.tsx` 23/23 killed, `useLiveCell.ts` 3/3 killed | no — it doesn't run              |
| `// Stryker disable all` around the specific declaration | unchanged                                            | **no** — dry run still fails     |
| `// Stryker disable all` at the top of the file          | **0 of 23**, **0 of 3**                              | yes                              |

Only the file-wide form works, and it costs every mutant in the file. Worse, it costs them _silently_: Stryker still creates the mutants, reports them as ignored, and scores the file `n/a` — so the file leaves the denominator without the score dropping. A skipped test kills no mutants but removes none either; a file-wide disable removes them all while looking clean. Prefer the skip.

Neither tool is malfunctioning, so no upstream fix is coming: Stryker's instrumentation is a read of a mutable global during render, which is on React's own documented list of bailout conditions. The interaction has no public report — the nearest analogue is [stryker-js#2704](https://github.com/stryker-mutator/stryker-js/issues/2704), where instrumentation displaces the `@flow` pragma and silently disables that Babel plugin — and it is worth reporting now that React Compiler is stable and default-on in Next.js, since the population hitting it is about to grow.

## Structural rules (ast-grep)

`rules/*.yml`, wired up by `sgconfig.yml`, encode architectural invariants that were previously prose — the framework-free layering, and repo conventions like "no manual `useMemo`/`useCallback` under an enabled React Compiler". `CLAUDE.md`'s Custom quality tooling section lists what they currently cover; read it there rather than from a list restated here, which would go stale the moment a rule is added.

- **`npm run ast-grep` is report-only for findings: a rule matching your code does not move the exit code**, because every rule is `severity: warning`. **Read its output** — never infer cleanliness from the exit code. A rule that matches nothing reports nothing, which is byte-identical to a clean codebase. Every role that changes code should run it; it takes under a second and prints nothing when clean.
- The exit code is not meaningless, though — it just answers a different question. Measured against ast-grep 0.45.1: **8** means a rule file failed to parse (duplicate YAML keys, malformed syntax) and **1** means an `error`-severity rule matched. So a nonzero exit is always worth investigating, while a zero exit tells you nothing about findings. Watch for the silent middle: ast-grep accepts unknown top-level keys without complaint, so a typo'd `sevrity:` leaves the rule with no severity at all and silently demotes it to `help` — and a `files:` glob that matches nothing produces no output whatsoever.
- **Never make a violation go away by weakening the rule.** Editing `rules/*.yml`, adding an `ignores:` entry, or moving a file out of a `files:` glob is not a fix — it silently disarms the check for everyone afterward, and the disarming is invisible because a dead rule and a satisfied rule look the same. Rules belong to `architect`: fix the code, or report the tension and let `architect` decide.
- **Rule files are ordinary prettier-formatted YAML** — `npm run format` covers them like anything else. `rule-tests/__snapshots__/` is in `.prettierignore` on purpose, since ast-grep regenerates those on every `npm run ast-grep:test` and formatting them would churn.
- This repo has three report-only checkers, and each has one owner even though anyone may read them: **`ast-grep`** — every role reads it, `architect` owns the rules and their fixtures; **`halstead4ts`** — `architect`; **`gherkin-dry`** — `product`. "Report-only" constrains how you read the result, not whether you run it: none of the three may block a handoff on its own numbers, and none may be skipped on the grounds that it can't fail.

## Acceptance pipeline

- This repo has already built its own local adaptation of unclebob/Acceptance-Pipeline-Specification's concept — `scripts/acceptance-mutation/` and `.feature`/`.steps.test.ts(x)` pairs via `@amiceli/vitest-cucumber` — rather than installing APS's own `gherkin-parser`/`gherkin-mutator` binaries. Use those existing scripts and conventions; don't introduce a separate acceptance-pipeline toolchain.
- Gherkin acceptance mutation in this repo means `npm run acceptance-mutation`, which mutates `.feature` Examples-table values (never source code) and reruns the corresponding `.steps.test.ts(x)` file — both extensions are discovered, since the extension is what separates the direct-call step form from the black-box one.

## Working inside scripts/

`scripts/` (the acceptance mutator, the Gherkin DRY checker, the Halstead reporter, the perf reporter, the ast-grep rule checker, the agent-doc checker — see `CLAUDE.md` for what each does) is a separate TypeScript project from `src/`/`features/`, with its own vitest config, coverage directory, CRAP config, and Stryker config. It's the tooling every other role's quality gate runs on, so it's held to the same bar as `src/` — but through a parallel set of commands, never the `src/`-scoped ones.

Four of the six are report-only; **`npm run ast-grep:rules` and `npm run agent-doc-check` are the exceptions and genuinely gate**, exiting non-zero when a rule file is misconfigured, or when the docs in `.claude/**`/`CLAUDE.md` state something mechanically false. Don't generalize "the `scripts/` tools are advisory" to either of them.

**A new program in `scripts/` is picked up automatically** — `crap4ts.scripts.config.ts`'s `include` and `stryker.scripts.config.json`'s `mutate` are both `scripts/**/*.ts` minus `*.test.ts`, `run.ts`, and `test-support.ts` (the I/O shells and the shared fixture helpers stay excluded, the same way `src/test-support/**` is on the `src/` side). They used to be hand-maintained lists, and a program omitted from them was invisible to `crap4ts:scripts` and `test:mutation:scripts` while both still reported success — the same silent-blindness failure that `ast-grep:rules` exists to catch in the rule files, and it had already happened once in `scripts/` itself. What you must still do by hand is add an **exclusion** when a new file genuinely shouldn't be measured; the failure now shows up as a loud threshold breach rather than as silence. `.dry4tsrc.json` carries the third exclusion of the same kind, `**/run.ts` — every program's entry shell is the same six-line read-decide-print-exit `main()`, which `dry4ts` reports as a duplicate once a second program exists. It is deliberately broader than the intent ("a `scripts/` program's I/O shell") because `dry4ts` matches `ignorePatterns` against paths relative to the directory it was pointed at, not to the repo root — measured: `scripts/**/run.ts` matches nothing under `dry4ts scripts` — and one config serves both `npm run dry4ts` and `npm run dry4ts:scripts`. Nothing under `src/` is named `run.ts` today; if something ever is, it is silently exempt.

- Work performed inside `scripts/` runs the scripts-scoped pipeline: `npm run test:scripts`, `npm run test:coverage:scripts`, `npm run crap4ts:scripts`, `npm run dry4ts:scripts`, `npm run test:mutation:scripts`. The `src/`-scoped commands (`npm test`, `npm run test:unit`, `npm run crap4ts`, `npm run dry4ts`, `npm run test:mutation`) can't see `scripts/` at all — `vite.config.ts` excludes it, and the three tool configs are scoped to `src/`. The reverse holds too: don't reach for the `:scripts` commands when your change was in `src/`/`features/`; they'd report on code you didn't touch.
- `coder` substitutes `npm run test:scripts` for `npm run test:unit`. (There's no fast/slow split to make here — `scripts/` has no property-test layer, so `test:scripts` already _is_ the fast path.)
- `cleaner` substitutes `npm run crap4ts:scripts` for `npm run crap4ts`, `npm run dry4ts:scripts` for `npm run dry4ts`, and `npm run test:scripts` for `npm run test:unit`. Its scoped mutation scan becomes `npx stryker run stryker.scripts.config.json --mutate <changed-file-glob>` rather than a bare `npx stryker run --mutate ...`, which would pick up the `src/` config.
- `architect` substitutes `npm run test:scripts` for its full `npm test` run. There is no scripts-scoped Halstead command; read `scripts/` Halstead numbers, if you want them, by pointing `fta-cli` at the files directly — `npm run halstead4ts` resolves its file set from `crap4ts.config.ts`, which is scoped to `src/`.
- `hardener` substitutes `npm run test:mutation:scripts` for `npm run test:mutation` (same 90/80/85 thresholds), `npm run crap4ts:scripts` for `npm run crap4ts` (same threshold 6), and `npm run dry4ts:scripts` for `npm run dry4ts`. Note that `crap4ts:scripts` scores against `coverage-scripts/coverage-final.json`, so run `npm run test:coverage:scripts` first the way you would `npm run test:coverage` before `npm run crap4ts`.
- `product` substitutes `npm run crap4ts:scripts` and `npm run dry4ts:scripts` in its final all-clean check. There are no Playwright e2e specs for `scripts/` — these are CLI tools with no UI; the equivalent black-box check is running the tool itself (`npm run acceptance-mutation`, `npm run gherkin-dry`, `npm run halstead4ts`) and confirming its real output.
- No scripts-scoped counterpart of `npm run acceptance-mutation` or `npm run halstead4ts` exists, deliberately: those _are_ the tools that live in `scripts/`, so "running them on scripts/" doesn't map onto anything. Verify changes to them by running them for real against `features/`/`src/` and checking the output is unchanged — `acceptance-mutation` in particular has a baseline that any behavior change will move — take it from the most recent `product` VERIFY handoff on `main` (it moved there with the `hardener`/`product` split) rather than from a number written down here, since with several slices in flight a literal in this file is wrong the moment the second one lands.
- There's no scripts-scoped property-test layer either, so `architect`/`hardener`/`product` gain no counterpart to their `npm run test:property` obligation for `scripts/` work. Nothing there currently expresses an invariant over a broad input range that a table-driven unit test doesn't already cover; add the layer only if that changes. The same goes for the browser-required layer above: `scripts/` is Node CLI tooling with no browser APIs to verify, so `npm run test:browser` has no scripts-scoped counterpart and `hardener` simply skips that stage for `scripts/`-only work.
- `npm run build` already covers `scripts/` — `tsconfig.json` references `tsconfig.scripts.json`, so `tsc -b` type-checks it alongside `src/` and `vite.config.ts`. The existing "run `npm run build` before handoff, every time" rule below is all the build discipline `scripts/` needs; there's no separate scripts-scoped build command.

## Scoping a gate to your slice

Inside a worktree, the whole-repo gates (`crap4ts`, `dry4ts`, `test:mutation`, `ast-grep`, `dry4ts:scripts`, …) still report on the whole repo. What changes under concurrent slices is which of their findings are _yours_.

- Your slice's diff is `git diff --name-only main...HEAD` — the changed-files manifest from `handoffs.md`. A finding on a file in that list is yours to fix.
- A finding on a file outside it is pre-existing on `main`, or was inherited from a rebase. Report it; don't fix it. See `workflow.md`'s failure conditions.
- Anywhere a role's instructions say "the files the previous role touched" — `cleaner`'s scoped mutation scan, `coder`'s per-file test-duration budget — the file list comes from that manifest, never from `git status` or `git diff HEAD~1`.

## Verification before handoff

Ported from swarm-forge's six-pack branch's own `local-engineering.prompt`, which adds two rules on top of the generic constitution above:

- Every role except `product` in SPECIFY mode must run the relevant tests before handoff and fix any failures. (SPECIFY runs before any implementation exists, so there is nothing yet to verify; `product` in VERIFY mode runs everything.) In this repo that's `npm run test:unit` (fast path — unit tests + Gherkin acceptance tests, excludes property tests) unless a role's own file specifies the full `npm test` instead.
- `architect`, `hardener`, and `product` must also confirm property-test results before handoff (`npm run test:property`, or the property-test portion of a full `npm test` run) — they're the only roles that own that layer. `coder` and `cleaner` never need to run property tests, nor does `product` in SPECIFY mode; that's a deliberate speed tradeoff so the fast TDD/cleanup loop isn't paying for property-test runtime on every iteration.
- Every role except `product` in SPECIFY mode must run `npm run build` before handoff, every time — not just "when you happen to touch something that looks type-sensitive." Vitest does not type-check, so tests can stay fully green while `tsc -b` is red. This isn't hypothetical: `cleaner` once landed a `vi.fn()` spy typed with the wrong signature for the DOM method it stubbed — every test passed, `cleaner` handed off believing it was clean, and the break sat undetected for a full role until `architect` happened to run `npm run build` and caught it. Each role's own file names the exact step where `npm run build` belongs in its workflow; treat it as load-bearing, not optional.
- Run the relevant local verification command before handoff whenever this repo has one for what you touched (`npm run crap4ts`, `npm run dry4ts`, `npm run test:mutation`, `npm run acceptance-mutation`, `npm run ast-grep`, `npx playwright test` — see `CLAUDE.md`'s Commands section for the full list and what each covers). `npm run ast-grep` is the cheap one and applies to any code change; see "Structural rules (ast-grep)" above for why its exit code is not the signal.
- Whole-suite commands are safe to run concurrently **across worktrees**: each slice's worktree has its own ports (`dev-port.ts` derives a dev-server, Vitest-browser-API, and `vite preview` port per checkout), its own `node_modules`, and its own `coverage/`, `reports/`, `test-results/`, `.stryker-tmp*`, `dist/`, and `dist-perf/`.
- Inside a **single** worktree the old rule stands unchanged: avoid running whole-suite test commands concurrently with each other when their outputs could interfere. Don't run `npm run test:mutation` and `npx playwright test` at the same time against the same dev server, and don't run `npm run test:coverage` while `npm run crap4ts` is reading `coverage/coverage-final.json` — `crap4ts` auto-discovers that path with no `--coverage` flag (unlike `crap4ts:scripts`, which names its file explicitly), so a concurrent coverage run leaves it scoring a half-written report.

## Guardrails

- Do not hand-edit mutation-testing or Gherkin-acceptance-mutation manifests/reports; let the tools (Stryker, `scripts/acceptance-mutation`) generate and update them as part of their normal runs.
- Do not commit unrelated local changes or generated artifacts unless the task requires them.
- Before relying on an unfamiliar command or flag, check `--help` or the relevant script's source rather than guessing.

## Dropped from the source article (not applicable here)

- The Go/Clojure/Java language-tool installation table and per-language framework preferences (Babashka, Speclj, Maven) — this is a single-language TypeScript project; its tools (`dry4ts`, `crap4ts`, Stryker, `scripts/acceptance-mutation`) are already pinned in `package.json`/`scripts/`, nothing needs installing from GitHub at agent startup.
- `six-pack` branch's own `local-workflow.prompt` was also reviewed for this migration — it's entirely about that branch's tmux/QA-handoff-merge mechanics (`done_with_current.sh`, `merge_and_process QA <commit>`, ignoring wake-ups mid-task), not applicable here, and its one substantive rule (run tests before handoff) duplicates the `local-engineering` rule already captured above.
