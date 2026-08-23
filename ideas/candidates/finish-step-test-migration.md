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

## Open questions

- **`grid-scrollbars` is the risky one.** `Scrollbar`'s `aria-valuenow` is thumb
  _offset_ ratio only; thumb _length_ ratio — what six of eight scenarios assert
  today — has no ARIA counterpart. Either the pruning slice removes those
  scenarios first, or this slice needs an affordance that does not exist, which is
  an `architect` CONTRACT question rather than a `product` one.
- Sequenced behind `prune-gherkin-to-domain-language`, which is itself gated on
  the pilot's P3/P4. If P3/P4 fail this arrives later and costs more — but the
  completion condition still holds.
