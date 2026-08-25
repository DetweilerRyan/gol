---
name: vacuous-pass-when-a-locator-resolves-to-nothing
title: A negative browser assertion cannot tell absence from unreachability
created: 2026-08-25
---

## Context

Found by `product` while probing the ruler affordance, and deliberately **not** fixed at that
slice's final gate — fixing it would have moved the e2e count after `hardener` had signed off,
for a hazard no current or plausible change triggers. Filed instead.

`features/grid-reference-lines.e2e.spec.ts`'s `isMajor: false` rows assert
`toHaveCount(0)` against a ruler-scoped locator. When `product` renamed one ruler group as a
probe, those rows **passed vacuously**: an unresolvable group yields an empty locator, and
`toHaveCount(0)` is satisfied by it. So "this coordinate carries no major gridline" is
indistinguishable from "the ruler could not be found at all".

Measured precisely, under a `Column ruler` → `Column axis` rename: the three `isMajor: true`
rows failed correctly, the three `isMajor: false` rows passed for the wrong reason.

**This is the repo's recurring failure shape in a new place.** It is the same structure as an
`ignorePatterns` glob that matches nothing, a `-t` filter that matches nothing and exits 0, an
empty vitest project glob, and `vitest list 2>/dev/null` reporting a confident zero — a check
that silently measures nothing reads exactly like a check that passed. The repo documents each
of those; this is the browser-locator instance and it is not written down anywhere.

Note the affordance-specific sharpening: negative assertions on an **ancestry-scoped** locator
are more exposed than most, because the scope itself can vanish. A `toHaveCount(0)` against a
page-wide locator fails safe when the page is broken (nothing renders, other assertions fail);
one scoped inside a named container passes quietly when only the container's name changed.

## Sketch

The general fix is to **assert the scope resolves before asserting anything is absent within
it** — one `expect(rulerGroup(page, axis)).toHaveCount(1)` ahead of the negative check, or a
helper that bakes it in so the discipline is not per-call-site memory.

Worth deciding as a convention rather than a one-line fix, since the shape recurs: any
`toHaveCount(0)` / `not.toBeVisible()` / `toHaveText([])` inside a scoped locator has it.
`features/e2e-helpers.ts` is the natural home — a `scopedAbsence(scope, target)` or similar that
asserts the scope first. That also makes it greppable, which a bare `toHaveCount(0)` is not.

Cheap and worth doing first: **audit how many sites have the shape**. If it is only these three
rows, inline the guard and write the convention into CLAUDE.md's testing notes. If it is
widespread, the helper earns its place.

## Touches

`features/grid-reference-lines.e2e.spec.ts` (the three known rows), `features/e2e-helpers.ts` if
a helper lands, `features/steps/*.ts` if the audit finds the shape there, and CLAUDE.md's
testing-structure notes for the convention.

## Open questions

- How many sites actually have the shape? The audit decides helper-vs-inline.
- Does the generated `bdd` layer have it too? Its steps read through `axisLabelValues`, which
  returns `[]` rather than asserting — so a step asserting "the ruler shows no 5" would have the
  identical hazard one layer removed.
- Is there a Playwright-native expression of "this scope must resolve" that reads better than a
  second `expect`? `toHaveCount(1)` on the scope is blunt but honest.
