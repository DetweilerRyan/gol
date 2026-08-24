---
name: finish-step-test-migration
title: Convert the last four features so features/ holds one kind of step test
created: 2026-08-23
---

## Context

Slice G — the end of the acceptance-migration chain. After pruning,
`infinite-grid`, `mouse-wheel-controls`, `grid-scrollbars` and
`grid-reference-lines` are table-less or near-table-less, so conversion is cheap
and adds **zero** mutants.

**An earlier draft called this aesthetic. That was wrong on two counts.**

1. **It adds coverage that exists nowhere else in-process.**
   `mouse-wheel-controls` as RTL fires a real wheel event through
   `useWheelInput`'s non-passive listener; as a direct call it is
   `applyWheelInput(camera, {…})`, which tests nothing about the binding. Same
   shape for `infinite-grid` — negative coordinates actually rendering and
   toggling is a different claim from `toggleCell(cells, -3, -5)`, which the unit
   tests already own. That integration is currently checked only by Playwright.
2. **A permanent split preserves the gravity well that created the problem.**
   Today's layer overlaps unit tests so heavily _precisely because_ direct-call
   steps make it easy — you already imported the module, so asserting on it is the
   path of least resistance. Four features left in that mode will re-accrete
   direct-call assertions.

## Sketch

Convert in ascending order of difficulty:

1. `infinite-grid` — 2 table-less scenarios.
2. `mouse-wheel-controls` — real `fireEvent.wheel` through the non-passive listener.
3. `grid-scrollbars` — needs `aria-valuenow` and a real drag.
4. `grid-reference-lines` — keeps a 12-mutant table, so it is the only one that
   moves the acceptance-mutation number.

### Completion condition, so the half-migrated state can't become permanent

**The migration is done when `features/*.steps.test.ts` matches zero files.**

```bash
ls features/*.steps.test.ts 2>/dev/null | wc -l   # 0 == migration complete
```

Until then, `vite.config.ts`'s dual-extension arrangement carries a comment saying
so and naming the remaining files. When it reaches zero, `unit`'s Gherkin
exclusion and that comment come out **in the same commit**, and `features/` holds
one kind of step test again.

## Touches

Four `features/*.steps.test.ts` → `.tsx`, the acceptance harness, and
`vite.config.ts` (removing the `unit`-project exclusion and the dual-extension
note). `.gherkin-lintrc` may need a pass if step text changes altitude.

## What the pilot established

`black-box-acceptance-pilot` converted `cell-life-and-death` and ran Gate P. The
rows that bear on this slice:

- **P6 passed**, which is the row that decides whether the layer is worth
  migrating at all. `App.tsx`'s `onAdvance` stubbed out is missed by all 845
  unit+property+dom tests and caught by the acceptance layer — the first fast
  layer to mount `<App />`, whose composition-root wiring is excluded from both
  Stryker and crap4ts.
- **P5 landed at the threshold**: 693 / 684 / 682s against a 687.5s cap (+25%
  over a 550s baseline). Median under, cap inside the spread. **Each further
  conversion spends from this budget**, so measure `test:mutation` wall time per
  conversion rather than once at the end. If it goes over, the answer is the
  Stryker-exclusion slice, not silently accepting a slower gate.
- **P4a's number is zero, not one — and the correction is the more useful fact.**
  The raw measurement was: full tree 99.08% / 12 survivors, without the acceptance
  project 99.00% / 13, the extra survivor in `liveCellStore.ts`. That looked like
  "the layer is worth one mutant." It isn't. `prune-gherkin-to-domain-language`
  later established that **Stryker's `killedBy` against a vitest-cucumber step
  test is unreliable**: vitest-cucumber compiles each Gherkin step into its own
  `test`, and Stryker's `perTest` run executes only the covering subset, so
  prerequisite `Given`/`And` steps are skipped, the `When` throws on broken
  closure state, and Stryker scores it a kill. Measured on the converted `.tsx`
  form too, not just `.ts`. That `liveCellStore.ts` mutant is separately ratified
  **equivalent**. So the acceptance layer kills **no** mutant the unit layer
  doesn't.
- **Which does not weaken P6, and the difference is worth holding onto.** P6 was
  measured by injecting a defect and running whole projects — `App.tsx`'s
  `onAdvance` stubbed out: 845 unit+property+dom tests pass, the acceptance
  project fails 7 of 48. Real test runs at full scope, not tool attribution. The
  layer's value was never the mutation score; it is coverage of composition-root
  code that is excluded from Stryker's `mutate` list entirely. **Do not justify
  further conversions on mutation-score grounds** — that number is zero and now
  known to be zero.
- **P1 was 118.2s scoped** for 28 mutants, decomposed as environment tax +68%
  (node → jsdom) and black-box tax +213% (13 real `<App />` mounts at 400
  buttons). `pattern-library` will be worse — it mounts more.

Three corrections the pilot paid for, which every conversion here inherits:

1. **`@amiceli/vitest-cucumber` compiles one vitest test per Gherkin _step_, not
   per scenario** — `cell-life-and-death.feature` collects 48 tests, not 13. So
   the global `afterEach(cleanup)` fires _between_ a scenario's `Given` and its
   `When`, and an RTL-`render`ed board cannot survive a scenario. The harness
   owns its own `createRoot` container for this reason. Do not "simplify" it back
   to `render()`.
2. **The mounted window is a tile-range artifact, not a camera derivation.** At
   200×200 it is cells −8..11 (400 buttons), because the first render happens at
   camera (0,0) before `useInitialCentering` fires and `nextTileRange` rebuilds
   onto the union. `mountBoard()` asserts `REQUIRED_WINDOW ⊆ mounted` rather than
   equality. Each converted feature must check its own coordinates — **including
   every seeded mutant of them** — land inside.
3. **A steps file may import only the harness, `@amiceli/vitest-cucumber` and
   `vitest`.** `rules/no-domain-imports-in-black-box-steps.yml` enforces this as
   an **allowlist**, not a `src/` blocklist — a blocklist passes
   `import { render, screen } from '@testing-library/react'`, which reaches the
   DOM directly and bypasses the harness's sentinel.

## Open questions

- **`grid-scrollbars` is the risky one.** `Scrollbar`'s `aria-valuenow` is thumb
  _offset_ ratio only; thumb _length_ ratio — what six of eight scenarios assert
  today — has no ARIA counterpart. Either the pruning slice removes those
  scenarios first, or this slice needs an affordance that does not exist, which is
  an `architect` CONTRACT question rather than a `product` one.
- Sequenced behind `prune-gherkin-to-domain-language`, which is itself gated on
  the pilot's P3/P4. If P3/P4 fail this arrives later and costs more — but the
  completion condition still holds.
