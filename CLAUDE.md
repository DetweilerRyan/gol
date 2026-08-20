# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Conway's Game of Life, built as an infinite, pannable/zoomable grid (React 19 + TypeScript + Vite + Tailwind v4). Cells are toggled by click; generations advance manually via a button or Enter key.

## Commands

```bash
npm run dev              # start dev server (vite, http://localhost:5173)
npm run build             # tsc -b && vite build
npm run lint               # oxlint
npm run format             # prettier --write .
npm run format:check       # prettier --check .

npm test                    # vitest run (unit + property + Gherkin acceptance tests, jsdom env)
npm run test:unit           # vitest run, excluding *.property.test.ts and *.e2e.spec.ts -- fast path for iterative TDD
npm run test:property       # vitest run, only the *.property.test.ts files
npm run test:coverage       # vitest run --coverage
npx vitest run <path>       # run a single test file
npx vitest run -t "<name>"  # run tests matching a name pattern

npm run test:e2e            # playwright test (black-box e2e, real browser, auto-starts dev server)
npx playwright test features/grid-scrollbars.e2e.spec.ts   # run a single e2e spec
npx playwright install chromium   # one-time browser install after npm install

npm run test:mutation       # stryker mutation testing (scoped to gameOfLife.ts, viewport.ts, useCamera.ts, and 4 components in src/components/)
npm run acceptance-mutation # custom Gherkin-example mutation runner (scripts/acceptance-mutation)
npm run gherkin-dry         # checks .feature files for step-text vocabulary duplication (report-only)
npm run crap4ts             # CRAP complexity/coverage score (same files as stryker)
npm run halstead4ts         # Halstead complexity report via FTA, same files as crap4ts (report-only)
npm run dry4ts              # duplication checker over src/
```

There is no separate typecheck script — `npm run build` runs `tsc -b` as its first step. Lint (oxlint) has type-aware rules disabled by default; see README.md if enabling `oxlint-tsgolint`.

## Architecture

### Core logic: `gameOfLife.ts` + `viewport.ts`, plus four unit-tested presentational components

`src/gameOfLife.ts` and `src/viewport.ts` hold all the non-UI logic, and together with `src/hooks/useCamera.ts` and four presentational components in `src/components/` (`GridToolbar.tsx`, `PatternLibraryModal.tsx`, `RulerLabel.tsx`, `Scrollbar.tsx`) are the modules covered by unit tests and mutation testing (see `stryker.config.json` / `crap4ts.config.ts` — both scope explicitly to this file list). `gameOfLife.ts`/`viewport.ts` are additionally covered by property tests. `src/components/Grid.tsx`, `src/App.tsx`, and `src/main.tsx` remain excluded — still UI/bootstrap code exercised by manual + browser testing, not unit tests. Keep new domain logic in `gameOfLife.ts`/`viewport.ts` rather than in components whenever it can be expressed as pure logic, so it stays covered by property tests and mutation testing, not just unit tests.

- **`src/gameOfLife.ts`** — the actual Game of Life model. Live cells are stored as a sparse `Set<CellKey>` (`CellKey` = `"x,y"` string), not a bounded 2D array — the grid is conceptually infinite. Core functions: `toggleCell` (mutates an Immer draft), `getNextGeneration` (computes the next generation by counting neighbors only around currently-live cells, not by scanning a bounded region), `computeContentBounds` (bounding box of live cells, used to size scrollbars).
- **`src/viewport.ts`** — camera/coordinate-space math, independent of the game rules. `Camera` = `{ offsetX, offsetY, cellSize }` in world-space coordinates. Key conversions: `worldToScreen` / `screenToWorld`. Handles pan, zoom-at-point (keeps the world point under the cursor fixed), wheel input (shift+wheel = zoom, plain wheel = pan, with a Firefox/Windows axis-swap workaround — see comment in `applyWheelInput`), major-gridline computation (every 10 cells), and scrollbar thumb sizing/dragging math. Scrollbars represent the union of content bounds and current viewport, not content bounds alone (see comment on `computeAxisScrollbarMetrics`) — this keeps the thumb ratio/offset valid even when panned away from all live cells.

### State flow

- `src/App.tsx` owns `liveCells` (via `use-immer`'s `useImmer`, since `toggleCell`/`getNextGeneration` operate on Immer drafts/Sets) and `generation` count. It wires a global `keydown` listener for Enter → next generation, explicitly excluding the Next Generation button itself (which already handles Enter natively) to avoid double-advancing.
- `src/hooks/useCamera.ts` owns the `Camera` object as local `useState` and exposes pan/zoom/wheel/center/scrollbar-drag actions that all delegate to pure functions in `viewport.ts`.
- `src/components/Grid.tsx` is the only consumer of both — it renders one absolutely-positioned `<button>` per visible cell (computed from `computeVisibleRange`, with a small buffer), plus coordinate ruler labels (`RulerLabel.tsx`), zoom-%, a `GridToolbar.tsx` with zoom/reset/patterns buttons, two custom drag-driven `Scrollbar.tsx` instances, and a `PatternLibraryModal.tsx` for placing patterns from the library. It resolves pointer-drag-to-pan vs. click-to-toggle via a drag-distance threshold (`DRAG_THRESHOLD_PX`) and uses PointerEvent capture throughout; several comments in this file explain non-obvious pointer-event propagation/capture interactions between the grid, scrollbars, and toolbar (read them before changing pointer handling). `Grid.tsx` itself has no unit tests (deliberately deferred) — the four components it composes do.

### Testing structure (three layers, deliberately separate)

1. **Unit/property tests** — `src/*.test.ts` and `src/*.property.test.ts` (fast-check via `@fast-check/vitest`) for `gameOfLife.ts`/`viewport.ts`/`useCamera.ts`, plus `src/components/*.test.tsx` (`@testing-library/react`'s `render`/`screen`/`fireEvent`, jest-dom matchers via `src/test-setup.ts`) for the four unit-tested presentational components — all run by vitest in jsdom. This is where implementation correctness lives — edge cases, invariants, and the numeric precision (`-0` handling, clamp boundaries, same-reference no-ops) that a Gherkin Examples table can't express.
2. **Gherkin acceptance tests** — `features/*.feature` (plain-English specs) paired 1:1 with `features/*.steps.test.ts` (step definitions using `@amiceli/vitest-cucumber`, run by vitest — these are _not_ Playwright and don't need a browser). These exercise `gameOfLife.ts`/`viewport.ts` logic directly, not the DOM. Their assertions often overlap substantially with the unit tests covering the same functions (an architect review confirmed this for `grid-reference-lines`, `mouse-wheel-controls`, `infinite-grid`, `grid-scrollbars`, `camera-pan-and-zoom`, and `cell-life-and-death` — same functions, frequently the same literal inputs) — that overlap is expected and not a bug to fix. This layer's purpose is the stakeholder-readable, accepted-behavior contract and the `specifier`→`coder` handoff (see Subagent pipeline below), not incremental defect detection beyond the unit tests; don't chase assertion parity or treat the overlap as duplication to eliminate. The one feature that isn't overlap-redundant is `pattern-library.feature`, whose Examples table is the only place the exact cell geometry of all 8 patterns is pinned down — the unit tests only check names/categories, not the shapes.
3. **Black-box e2e tests** — `features/*.e2e.spec.ts` (Playwright, real Chromium, run against `npm run dev` on a fixed 1280×900 viewport). `features/e2e-helpers.ts` has shared helpers; many pixel-math assertions are derived from the exact default camera (`offsetX: -32, offsetY: -22.5, cellSize: 20`) that results from that fixed viewport — read the comments in that file before changing default camera values or the viewport size.

Vitest excludes `**/*.e2e.spec.ts` (see `vite.config.ts`) so the two runners never collide.

### Custom quality tooling in `scripts/`

- `scripts/acceptance-mutation/` — mutates individual values in `.feature` Examples tables (never source code) and reruns the corresponding `.steps.test.ts` file to check the scenario actually notices (concept from unclebob's Acceptance-Pipeline-Specification). Each mutant runs the _entire_ steps file, not a filtered subset, since Given/When/Then steps share closure state within a scenario. In practice this hardens the Gherkin layer against itself — the weaknesses it has surfaced so far were in step definitions absorbing a mutated value without noticing, not in `gameOfLife.ts`/`viewport.ts` — so treat it as acceptance-suite quality assurance, not as evidence the Gherkin layer is finding core-logic bugs unit tests miss.
- `scripts/gherkin-dry-checker/` — advisory-only; scans all `.feature` files for step-text vocabulary duplication/drift. Always exits 0 on a successful run (report-only), writes to `reports/gherkin-dry/report.json`.
- `scripts/halstead4ts/` — runs `fta-cli` against the same files as `crap4ts.config.ts`'s `include` list and prints a Halstead (volume/difficulty/effort/bugs) + FTA Score table alongside crap4ts's per-function CRAP table. FTA only reports at file granularity (no per-function breakdown), so this is a second, coarser report rather than something merged into crap4ts's output — and since FTA's own score formula isn't published, it's report-only like `gherkin-dry-checker`, never a CI gate. Keep the file list in `run.mjs` in sync with `crap4ts.config.ts` by hand.

All three have their own `.test.mjs` unit tests runnable via `npx vitest run scripts/` (they're also swept into the default `npm test`/`npm run test:unit`, since vitest's default include pattern already matches `scripts/**/*.test.mjs`).

## Subagent pipeline

`.claude/agents/` defines a six-role pipeline adapted from unclebob/swarm-forge's six-pack branch, scoped to this repo's actual commands (Gherkin features, `crap4ts`, `halstead4ts`, `dry4ts`, Stryker, `acceptance-mutation`, Playwright) rather than swarm-forge's tmux/worktree/file-based-handoff orchestration. Each role's full instructions and boundaries live in its own file — read the relevant one before invoking it rather than relying on this summary. Shared house rules ported from swarm-forge's `main`-branch constitution live in `.claude/agents/articles/` (`engineering.md`, `workflow.md`, `handoffs.md`) — every role reads these too.

Cycle order for a feature: **specifier → coder → cleaner → architect → hardener → qa**, looping back to specifier for the next slice.

1. `specifier` — drafts/revises `features/*.feature` scenarios and a plain-English end-to-end QA outline; stops for explicit user approval before committing; never touches `src/`.
2. `coder` — implements one approved slice via TDD; never writes `features/*.e2e.spec.ts` and never runs the quality-gate tools.
3. `cleaner` — structure-preserving cleanup only (CRAP/DRY/scoped mutation scan on touched files); no new functionality. This is the four-pack's old `refactorer`, narrowed: it no longer runs a full mutation suite, only the scoped scan.
4. `architect` — reviews module boundaries/dependency direction and property-test coverage, also reading `halstead4ts`'s Halstead report as an advisory (no-threshold) complexity signal alongside that review. Unlike the old four-pack architect, it does **not** run the full quality gate itself — that moved to `hardener`.
5. `hardener` — new role; owns the full final verification sequence (`test:mutation` → `acceptance-mutation` → `crap4ts` → `dry4ts`, in that order), fixing whatever each stage surfaces before moving to the next.
6. `qa` — new role; builds and runs `features/*.e2e.spec.ts` (Playwright) from the specifier's QA outline as the final independent, black-box check through the real UI, then re-confirms `crap4ts`/`dry4ts` clean before declaring the feature done.

There's no daemon or persistent process wiring these together — the orchestrating session invokes each role in turn via the `Agent` tool and sequences the handoffs itself.

## Conventions

- No semicolons, single quotes, 120-char print width (Prettier; `prettier-plugin-tailwindcss` sorts class strings — don't hand-order Tailwind classes).
- Comments are reserved for non-obvious _why_ (subtle invariants, browser quirks, sign-convention mismatches between related functions). This codebase leans heavily on that style in `viewport.ts` and `Grid.tsx` — read existing comments fully before touching the code they explain, since the reasoning (e.g. pointer-capture propagation, scroll-direction sign conventions, shift+wheel axis workarounds) is often not re-derivable from the code alone.
- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`, `react/react-compiler` oxlint rule set to `error`) — avoid manual `useMemo`/`useCallback` unless the compiler can't handle the case.
