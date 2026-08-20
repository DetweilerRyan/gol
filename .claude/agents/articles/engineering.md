# Article: Engineering Rules

Adapted from unclebob/swarm-forge's `main`-branch constitution (`swarmforge/constitution/articles/engineering.prompt`) for this repo's actual TypeScript/npm toolchain. Every role listed in `.claude/agents/` should follow these rules; role-specific files add to this, they don't repeat it.

## Design and testability

- Work in small, reviewable increments — one approved behavior slice at a time, not a batch of unrelated changes.
- Prefer the simplest design that supports the current behavior and leaves clear options for the next step.
- Keep tests close to the behavior being changed.
- This repo's testable/environmentally-unsuitable split is the two-layer core documented in `CLAUDE.md`: `src/gameOfLife.ts` and `src/viewport.ts` hold independently testable domain logic; `src/components/Grid.tsx`, `src/App.tsx`, and `src/hooks/useCamera.ts` are the UI-adapter layer. Push new logic into the core whenever it can be expressed as a pure function, so it stays covered by unit tests, property tests, and mutation testing — don't strand testable rules in the UI layer.

## Acceptance pipeline

- This repo has already built its own local adaptation of unclebob/Acceptance-Pipeline-Specification's concept — `scripts/acceptance-mutation/` and `.feature`/`.steps.test.ts` pairs via `@amiceli/vitest-cucumber` — rather than installing APS's own `gherkin-parser`/`gherkin-mutator` binaries. Use those existing scripts and conventions; don't introduce a separate acceptance-pipeline toolchain.
- Gherkin acceptance mutation in this repo means `npm run acceptance-mutation`, which mutates `.feature` Examples-table values (never source code) and reruns the corresponding `.steps.test.ts` file.

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
