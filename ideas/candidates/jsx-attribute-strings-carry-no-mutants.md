---
name: jsx-attribute-strings-carry-no-mutants
title: Every accessible name in this repo is outside the mutation gate
created: 2026-08-25
---

## Context

Measured by `hardener` at the end of `ruler-label-axis-affordance`, and it is a fact about the
gate rather than about that slice.

**Stryker does not mutate JSX attribute string literals.** That slice added two
`aria-label="Column ruler"` / `aria-label="Row ruler"` attributes to `src/components/GridRuler.tsx`
and the mutation total moved by **zero** — 1306 instrumented before and after, 1287 of 1304
detected, 98.70% byte-identical. The five mutants `GridRuler.tsx` carries are the same five it
carried before the slice (two `ArrowFunction`s, a `BlockStatement`, and the two `` `x-${x}` ``/
`` `y-${y}` `` key template literals). Lines 48 and 54 carry none.

Corroborated repo-wide rather than inferred from one file: `src/components/GridToolbar.tsx` has
**nine** `aria-label`/`className` string attributes and exactly **one** mutant, a `BlockStatement`.

**Why this is worth a slice rather than a footnote.** This repo has been investing heavily in
accessible affordances as the black-box contract — `aria-pressed` for cell aliveness,
`aria-label` for cell coordinates, the pattern-preview labels, `Column ruler`/`Row ruler`,
`Horizontal scroll`/`Vertical scroll` — and `src/test-support/cellQuery.ts` and `rulerQuery.ts`
exist precisely to make those names a shared contract. **None of that surface is measured by the
mutation gate.** A mutant that renamed `Cell 3, 5` to `Cell 5, 3`, swapped the two ruler group
names, or emptied an `aria-label` would be caught only by whatever hand-written test happens to
assert it — the score cannot tell you whether such a test exists.

That is the repo's own recurring failure shape one layer up: a high score that is silently
scoped to less than the reader assumes. It is **not** a false score — 98.70% is correct about
the mutants that exist — but a reader concluding "the affordances are well covered because the
score is high" would be wrong, and nothing in the report says so.

The concrete near-miss: `cleaner`'s scoped scan reported **5 mutants, 5 killed, 100%** on
`GridRuler.tsx` and that read as confirmation the new wrappers were covered. It was true and it
measured nothing about them. `coder`'s hand-verification — swapping the two labels and watching
the membership test fail while the name-only test passed — was the only real check, and it was
an instinct rather than a gate.

## Sketch

Establish the boundary first, because the fix depends on which it is. Stryker's mutator set is
per-node-type; the question is whether JSX attribute values are **excluded by design**, or
whether the `StringLiteral` mutator simply does not descend into `JSXAttribute` in the current
version. Read `@stryker-mutator/instrumenter`'s mutator list before proposing anything.

Three routes, roughly in order of cost:

1. **Accept and record.** Document in CLAUDE.md that accessible names are outside stage 4, so no
   future reader mistakes the score for coverage of them, and make the compensating discipline
   explicit: an affordance slice must hand-verify a swap/rename, the way `coder` did here.
   Cheapest, and it is the honest minimum whatever else happens.
2. **Move the names out of JSX.** They already half are: `rulerQuery.ts` holds the canonical pair
   and `GridRuler.tsx` a deliberate duplicate. A module-level `const COLUMN_RULER_LABEL = '…'`
   in the component file **would** be an ordinary `StringLiteral` and would mutate. Check that
   claim before relying on it — it is the crux, and it is cheap to test with a throwaway
   `--mutate` run. Note this cuts against the deliberate-duplicate pattern the repo uses for
   `Cell.tsx` ↔ `cellQuery.ts`, so it is a real design trade, not a tidy-up.
3. **A custom mutator or a checker.** Most expensive; only worth it if 1 and 2 both fail.

## Touches

Investigation only at first. Then `CLAUDE.md` (the mutation-testing notes in Commands, which
already document several scope traps of exactly this kind), possibly
`src/components/{GridRuler,Cell,GridToolbar,Scrollbar,PatternPreview}.tsx` under route 2, and
`.claude/agents/hardener.md` if the compensating discipline becomes a role duty.

## Open questions

- Excluded by design, or a gap in the current instrumenter? Decides everything downstream.
- Does route 2 actually produce mutants? One throwaway `--mutate` run answers it.
- Does this extend beyond `aria-*`? `className` attributes are equally unmutated, which is
  mostly fine — the repo treats paint classes as a visual contract — but `role` attributes are
  **not** decoration, and `role="group"` losing its value would be the same class of silent
  regression.
- Which existing affordances have a hand-written test that would catch a rename, and which
  don't? That audit is the actual risk register, and nothing currently produces it.
