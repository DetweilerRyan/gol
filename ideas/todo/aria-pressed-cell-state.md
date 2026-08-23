---
name: aria-pressed-cell-state
title: Give cell aliveness an accessible representation, and route every layer through one query helper
created: 2026-08-23
---

## Context

Cell aliveness has **no ARIA representation at all**. `src/components/Cell.tsx`
renders a `<button>` with an `aria-label` and a className that toggles
`bg-gray-900`/`bg-white` — no `aria-pressed`, no `aria-checked`, no text. Every
layer in the repo therefore reads a Tailwind class to answer "is this cell
alive": `features/e2e-helpers.ts`'s `isAlive()` greps `bg-gray-900`, and
`Cell.test.tsx` does the same.

That blocks two queued slices. `black-box-acceptance-pilot` cannot assert the
single most important fact in the domain through ARIA, and
`collapse-dead-cell-layer` needs a representation that survives re-roling the
element.

It is also a real accessibility gap on its own terms: a screen reader is told a
cell exists and what its coordinates are, but never whether it is alive.

## Sketch

Add `aria-pressed={isAlive}` to the existing `<button>`. Minimal, valid today,
and RTL-native (`getByRole('button', { pressed: true })`).

Introduce **`src/test-support/cellQuery.ts`** exporting `cellLabel(x, y)` and
`ALIVE_SELECTOR` — plain strings and pure functions, so Playwright and RTL both
consume it. Route `Cell.test.tsx`, `features/e2e-helpers.ts` and (later) the
acceptance harness through it. That is the hedge: if `collapse-dead-cell-layer`
re-roles the element, the migration is two helpers rather than two hundred
assertions.

It composes with `role="grid"` rather than conflicting: in the ARIA grid pattern
interactive widgets live _inside_ `role="gridcell"`, so button-inside-gridcell
keeps `aria-pressed` valid. The only case that forces a change is re-roling this
same element, at which point state moves to `aria-selected` or a nested
`role="switch"` — which is exactly what the shared helper absorbs.

## Touches

`src/components/Cell.tsx` (one attribute), `src/components/Cell.test.tsx`,
`features/e2e-helpers.ts`, new `src/test-support/cellQuery.ts`. Also
`src/components/CellTile.tsx`'s imperative-painting comment, which currently
says a mounted cell's className never changes for reasons internal to that
component — an imperative write would now have to update two attributes.

## Open questions

- **Perf.** This flips one more attribute per cell on every generation, across
  up to 19,680 mounted buttons at min zoom. `npm run test:perf` is the gate, and
  it must be compared against a **freshly regenerated** `main` baseline — the
  stale-report trap cost this project a false "prediction falsified" reading
  once already.
- Whether `aria-pressed` or `aria-checked` is the better fit for a cell that is
  a toggle rather than a command. `aria-pressed` reads correctly for a button;
  worth one sentence of justification in the code rather than a coin flip.
