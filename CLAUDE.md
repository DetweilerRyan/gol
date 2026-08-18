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
npm run test:coverage       # vitest run --coverage
npx vitest run <path>       # run a single test file
npx vitest run -t "<name>"  # run tests matching a name pattern

npm run test:e2e            # playwright test (black-box e2e, real browser, auto-starts dev server)
npx playwright test features/grid-scrollbars.e2e.spec.ts   # run a single e2e spec
npx playwright install chromium   # one-time browser install after npm install

npm run test:mutation       # stryker mutation testing (scoped to gameOfLife.ts, viewport.ts, useCamera.ts)
npm run acceptance-mutation # custom Gherkin-example mutation runner (scripts/acceptance-mutation)
npm run gherkin-dry         # checks .feature files for step-text vocabulary duplication (report-only)
npm run crap4ts             # CRAP complexity/coverage score (same 3 files as stryker)
npm run dry4ts              # duplication checker over src/
```

There is no separate typecheck script — `npm run build` runs `tsc -b` as its first step. Lint (oxlint) has type-aware rules disabled by default; see README.md if enabling `oxlint-tsgolint`.

## Architecture

### Two-layer core: `gameOfLife.ts` + `viewport.ts`

These two files hold all the non-UI logic and are the only modules covered by unit tests, property tests, and mutation testing (see `stryker.config.json` / `crap4ts.config.ts` — both scope explicitly to `gameOfLife.ts`, `viewport.ts`, `useCamera.ts`). Keep new domain logic here rather than in components, so it stays covered by that testing infrastructure.

- **`src/gameOfLife.ts`** — the actual Game of Life model. Live cells are stored as a sparse `Set<CellKey>` (`CellKey` = `"x,y"` string), not a bounded 2D array — the grid is conceptually infinite. Core functions: `toggleCell` (mutates an Immer draft), `getNextGeneration` (computes the next generation by counting neighbors only around currently-live cells, not by scanning a bounded region), `computeContentBounds` (bounding box of live cells, used to size scrollbars).
- **`src/viewport.ts`** — camera/coordinate-space math, independent of the game rules. `Camera` = `{ offsetX, offsetY, cellSize }` in world-space coordinates. Key conversions: `worldToScreen` / `screenToWorld`. Handles pan, zoom-at-point (keeps the world point under the cursor fixed), wheel input (shift+wheel = zoom, plain wheel = pan, with a Firefox/Windows axis-swap workaround — see comment in `applyWheelInput`), major-gridline computation (every 10 cells), and scrollbar thumb sizing/dragging math. Scrollbars represent the union of content bounds and current viewport, not content bounds alone (see comment on `computeAxisScrollbarMetrics`) — this keeps the thumb ratio/offset valid even when panned away from all live cells.

### State flow

- `src/App.tsx` owns `liveCells` (via `use-immer`'s `useImmer`, since `toggleCell`/`getNextGeneration` operate on Immer drafts/Sets) and `generation` count. It wires a global `keydown` listener for Enter → next generation, explicitly excluding the Next Generation button itself (which already handles Enter natively) to avoid double-advancing.
- `src/hooks/useCamera.ts` owns the `Camera` object as local `useState` and exposes pan/zoom/wheel/center/scrollbar-drag actions that all delegate to pure functions in `viewport.ts`.
- `src/components/Grid.tsx` is the only consumer of both — it renders one absolutely-positioned `<button>` per visible cell (computed from `computeVisibleRange`, with a small buffer), plus coordinate ruler labels, zoom-%, zoom/reset toolbar buttons, and two custom drag-driven scrollbars. It resolves pointer-drag-to-pan vs. click-to-toggle via a drag-distance threshold (`DRAG_THRESHOLD_PX`) and uses PointerEvent capture throughout; several comments in this file explain non-obvious pointer-event propagation/capture interactions between the grid, scrollbars, and toolbar (read them before changing pointer handling).

### Testing structure (three layers, deliberately separate)

1. **Unit/property tests** — `src/*.test.ts` and `src/*.property.test.ts` (fast-check via `@fast-check/vitest`), run by vitest in jsdom.
2. **Gherkin acceptance tests** — `features/*.feature` (plain-English specs) paired 1:1 with `features/*.steps.test.ts` (step definitions using `@amiceli/vitest-cucumber`, run by vitest — these are *not* Playwright and don't need a browser). These exercise `gameOfLife.ts`/`viewport.ts` logic directly, not the DOM.
3. **Black-box e2e tests** — `features/*.e2e.spec.ts` (Playwright, real Chromium, run against `npm run dev` on a fixed 1280×900 viewport). `features/e2e-helpers.ts` has shared helpers; many pixel-math assertions are derived from the exact default camera (`offsetX: -32, offsetY: -22.5, cellSize: 20`) that results from that fixed viewport — read the comments in that file before changing default camera values or the viewport size.

Vitest excludes `**/*.e2e.spec.ts` (see `vite.config.ts`) so the two runners never collide.

### Custom quality tooling in `scripts/`

- `scripts/acceptance-mutation/` — mutates individual values in `.feature` Examples tables (never source code) and reruns the corresponding `.steps.test.ts` file to check the scenario actually notices (concept from unclebob's Acceptance-Pipeline-Specification). Each mutant runs the *entire* steps file, not a filtered subset, since Given/When/Then steps share closure state within a scenario.
- `scripts/gherkin-dry-checker/` — advisory-only; scans all `.feature` files for step-text vocabulary duplication/drift. Always exits 0 on a successful run (report-only), writes to `reports/gherkin-dry/report.json`.

Both have their own `.test.mjs` unit tests runnable via `npx vitest run scripts/`.

## Conventions

- No semicolons, single quotes, 120-char print width (Prettier; `prettier-plugin-tailwindcss` sorts class strings — don't hand-order Tailwind classes).
- Comments are reserved for non-obvious *why* (subtle invariants, browser quirks, sign-convention mismatches between related functions). This codebase leans heavily on that style in `viewport.ts` and `Grid.tsx` — read existing comments fully before touching the code they explain, since the reasoning (e.g. pointer-capture propagation, scroll-direction sign conventions, shift+wheel axis workarounds) is often not re-derivable from the code alone.
- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.ts`, `react/react-compiler` oxlint rule set to `error`) — avoid manual `useMemo`/`useCallback` unless the compiler can't handle the case.
