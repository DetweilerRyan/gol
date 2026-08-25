---
name: prune-gherkin-implementation-altitude
title: Two .feature clauses still speak implementation, not domain
created: 2026-08-25
---

## Context

`architect` raised both while reviewing T3, and ruled both **out of that slice's scope** — T3's
own invariant was _no `.feature` text change_, and editing the prose would have moved the
pure-module steps files too, mid-mechanism-swap. Filed rather than fixed.

Two clauses would fail a contract review written today:

1. **`grid-reference-lines.feature`** — `Given a coordinate of 5` / `Then it should be a major
gridline`. There is no user in that sentence; it is a spec for `isMajorGridline(5)` written
   in Gherkin's syntax. Something like _"Given the grid is at its default view / Then a
   reference line is labelled every 10 cells"_ puts the player back in it.
2. **`grid-scrollbars.feature`** — _"the scrollbars are drawn for an 800 by 600 pixel
   viewport"_. A pixel viewport size stated in the contract is the same altitude problem
   wearing different clothes.

Both survived `.gherkin-lintrc`'s `no-restricted-patterns`, which is an **enumerated vocabulary
of `src/` identifiers**, not a shape detector — it cannot see that a sentence has no user in it.
That is a limitation of the instrument rather than a gap to close by widening the list (the list
is `architect`-owned, and widening it to clear a finding is the move that rule exists to
prevent).

A third, related finding from the same review, tracked here because the same pass should pick it
up: `grid-scrollbars`' _"while it covers a quarter of its track"_ engineers content inside its
`When`, because the `Given` establishes no live cells. `architect` agreed the `Given` is
underspecified. It is sound today — the step **asserts** the quarter rather than assuming it —
but note that scenario is a plain `Scenario` with **no Examples table**, so the engineered 0.25
sits entirely outside `acceptance-mutation`'s mutant surface. Nothing mechanical watches it,
which raises rather than lowers the case for moving the precondition where it belongs.

## Sketch

A `product` SPECIFY pass over the two features. Rewriting prose means rewriting both executable
forms while both exist — so this is **cheaper after the step-test layer is deleted**, when the
generated bdd specs are the only partner. Sequencing this after that deletion is the main call
to make.

Related: [[ruler-label-axis-affordance]] — clause 1 is only expressible through a paint-class
reach-around today, so an honest rewrite may need that affordance first.

## Touches

`features/grid-reference-lines.feature`, `features/grid-scrollbars.feature`, their
`.steps.test.ts` partners (while they exist), `features/steps/grid-reference-lines.ts`,
`features/steps/grid-scrollbars.ts`.

## Open questions

- Before or after the step-test layer is deleted? (Later is cheaper; earlier keeps the
  contract honest for longer.)
- Does clause 1 need [[ruler-label-axis-affordance]] to land first to be honestly assertable?
