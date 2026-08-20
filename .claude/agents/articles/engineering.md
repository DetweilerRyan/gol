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
- **Guidance that applies to more than one role belongs in a shared article**, and facts about the codebase itself belong in `CLAUDE.md` (which every session loads automatically, so it already reaches every role). Don't copy either into an individual role file: duplicates drift out of sync, and putting a general concern in one role's file implies that role owns it. A role file should carry only what's specific to that role's own responsibilities.

## Acceptance pipeline

- This repo has already built its own local adaptation of unclebob/Acceptance-Pipeline-Specification's concept — `scripts/acceptance-mutation/` and `.feature`/`.steps.test.ts` pairs via `@amiceli/vitest-cucumber` — rather than installing APS's own `gherkin-parser`/`gherkin-mutator` binaries. Use those existing scripts and conventions; don't introduce a separate acceptance-pipeline toolchain.
- Gherkin acceptance mutation in this repo means `npm run acceptance-mutation`, which mutates `.feature` Examples-table values (never source code) and reruns the corresponding `.steps.test.ts` file.

## Working inside scripts/

`scripts/` (the acceptance mutator, the Gherkin DRY checker, the Halstead reporter) is a separate TypeScript project from `src/`/`features/`, with its own vitest config, coverage directory, CRAP config, and Stryker config. It's the tooling every other role's quality gate runs on, so it's held to the same bar as `src/` — but through a parallel set of commands, never the `src/`-scoped ones.

- Work performed inside `scripts/` runs the scripts-scoped pipeline: `npm run test:scripts`, `npm run test:coverage:scripts`, `npm run crap4ts:scripts`, `npm run dry4ts:scripts`, `npm run test:mutation:scripts`. The `src/`-scoped commands (`npm test`, `npm run test:unit`, `npm run crap4ts`, `npm run dry4ts`, `npm run test:mutation`) can't see `scripts/` at all — `vite.config.ts` excludes it, and the three tool configs are scoped to `src/`. The reverse holds too: don't reach for the `:scripts` commands when your change was in `src/`/`features/`; they'd report on code you didn't touch.
- `coder` substitutes `npm run test:scripts` for `npm run test:unit`. (There's no fast/slow split to make here — `scripts/` has no property-test layer, so `test:scripts` already _is_ the fast path.)
- `cleaner` substitutes `npm run crap4ts:scripts` for `npm run crap4ts`, `npm run dry4ts:scripts` for `npm run dry4ts`, and `npm run test:scripts` for `npm run test:unit`. Its scoped mutation scan becomes `npx stryker run stryker.scripts.config.json --mutate <changed-file-glob>` rather than a bare `npx stryker run --mutate ...`, which would pick up the `src/` config.
- `architect` substitutes `npm run test:scripts` for its full `npm test` run. There is no scripts-scoped Halstead command; read `scripts/` Halstead numbers, if you want them, by pointing `fta-cli` at the files directly — `npm run halstead4ts`'s own `FILES` list stays scoped to `src/`.
- `hardener` substitutes `npm run test:mutation:scripts` for `npm run test:mutation` (same 90/80/85 thresholds), `npm run crap4ts:scripts` for `npm run crap4ts` (same threshold 6), and `npm run dry4ts:scripts` for `npm run dry4ts`. Note that `crap4ts:scripts` scores against `coverage-scripts/coverage-final.json`, so run `npm run test:coverage:scripts` first the way you would `npm run test:coverage` before `npm run crap4ts`.
- `qa` substitutes `npm run crap4ts:scripts` and `npm run dry4ts:scripts` in its final all-clean check. There are no Playwright e2e specs for `scripts/` — these are CLI tools with no UI; the equivalent black-box check is running the tool itself (`npm run acceptance-mutation`, `npm run gherkin-dry`, `npm run halstead4ts`) and confirming its real output.
- No scripts-scoped counterpart of `npm run acceptance-mutation` or `npm run halstead4ts` exists, deliberately: those _are_ the tools that live in `scripts/`, so "running them on scripts/" doesn't map onto anything. Verify changes to them by running them for real against `features/`/`src/` and checking the output is unchanged — `acceptance-mutation` in particular has a published baseline (142 mutants | 128 killed | 14 survived | 0 errored | 90.1%) that any behavior change will move.
- There's no scripts-scoped property-test layer either, so `architect`/`hardener`/`qa` gain no counterpart to their `npm run test:property` obligation for `scripts/` work. Nothing there currently expresses an invariant over a broad input range that a table-driven unit test doesn't already cover; add the layer only if that changes.
- `npm run build` already covers `scripts/` — `tsconfig.json` references `tsconfig.scripts.json`, so `tsc -b` type-checks it alongside `src/` and `vite.config.ts`. The existing "run `npm run build` before handoff, every time" rule below is all the build discipline `scripts/` needs; there's no separate scripts-scoped build command.

## Verification before handoff

Ported from swarm-forge's six-pack branch's own `local-engineering.prompt`, which adds two rules on top of the generic constitution above:

- Every role except `specifier` must run the relevant tests before handoff and fix any failures. In this repo that's `npm run test:unit` (fast path — unit tests + Gherkin acceptance tests, excludes property tests) unless a role's own file specifies the full `npm test` instead.
- `architect`, `hardener`, and `qa` must also confirm property-test results before handoff (`npm run test:property`, or the property-test portion of a full `npm test` run) — they're the only roles that own that layer. `coder`, `cleaner`, and `specifier` never need to run property tests; that's a deliberate speed tradeoff so the fast TDD/cleanup loop isn't paying for property-test runtime on every iteration.
- Every role except `specifier` must run `npm run build` before handoff, every time — not just "when you happen to touch something that looks type-sensitive." Vitest does not type-check, so tests can stay fully green while `tsc -b` is red. This isn't hypothetical: `cleaner` once landed a `vi.fn()` spy typed with the wrong signature for the DOM method it stubbed — every test passed, `cleaner` handed off believing it was clean, and the break sat undetected for a full role until `architect` happened to run `npm run build` and caught it. Each role's own file names the exact step where `npm run build` belongs in its workflow; treat it as load-bearing, not optional.
- Run the relevant local verification command before handoff whenever this repo has one for what you touched (`npm run crap4ts`, `npm run dry4ts`, `npm run test:mutation`, `npm run acceptance-mutation`, `npx playwright test` — see `CLAUDE.md`'s Commands section for the full list and what each covers).
- Avoid running whole-suite test commands concurrently with each other in the same working tree when their outputs could interfere (e.g. don't run `npm run test:mutation` and `npx playwright test` at the same time against the same dev server).

## Guardrails

- Do not hand-edit mutation-testing or Gherkin-acceptance-mutation manifests/reports; let the tools (Stryker, `scripts/acceptance-mutation`) generate and update them as part of their normal runs.
- Do not commit unrelated local changes or generated artifacts unless the task requires them.
- Before relying on an unfamiliar command or flag, check `--help` or the relevant script's source rather than guessing.

## Dropped from the source article (not applicable here)

- The Go/Clojure/Java language-tool installation table and per-language framework preferences (Babashka, Speclj, Maven) — this is a single-language TypeScript project; its tools (`dry4ts`, `crap4ts`, Stryker, `scripts/acceptance-mutation`) are already pinned in `package.json`/`scripts/`, nothing needs installing from GitHub at agent startup.
- `six-pack` branch's own `local-workflow.prompt` was also reviewed for this migration — it's entirely about that branch's tmux/QA-handoff-merge mechanics (`done_with_current.sh`, `merge_and_process QA <commit>`, ignoring wake-ups mid-task), not applicable here, and its one substantive rule (run tests before handoff) duplicates the `local-engineering` rule already captured above.
