---
name: scrollbar-visible-proportion-affordance
title: A scrollbar announces where it is but never how much you can see
created: 2026-08-25
---

## Context

`Scrollbar.tsx` announces `aria-valuemin={0}`, `aria-valuemax={100}` and
`aria-valuenow={round(thumbOffsetRatio * 100)}` — **position only**. It never announces
`thumbRatio`: what fraction of the content is currently visible. That is arguably the most
useful thing a scrollbar tells a sighted user ("you are seeing a tenth of this"), and a
screen-reader user cannot get it at all.

Surfaced by `architect` at the T3 REVIEW pass, from a contract finding `product` raised while
writing the bdd step modules. Its ruling: a genuine missing affordance, not a spec or code
defect — **ARIA has no attribute for proportion**, so this needs an invented affordance rather
than a corrected one, which makes it product-visible work rather than a fix.

The cost today is a reach-around. `features/e2e-helpers.ts`'s `thumbTrackFraction` reads the
proportion as **geometry** — thumb bounding box against its parent track's — because there is
no accessible channel to read it from. That is confined to one site and carries this idea's
name as its deletion trigger, the same discipline `xAxisLabels`/`yAxisLabels` carry for
[[ruler-label-axis-affordance]].

Two `.feature` clauses depend on it: _"the horizontal thumb should fill its track"_ and
_"the vertical thumb should be shorter than its track"_.

## Sketch

`aria-valuetext` on the thumb is the obvious candidate — it is the standard escape hatch for
"the number does not tell the whole story" — but it replaces how `valuenow` is announced rather
than adding to it, so the wording has to carry both position and proportion without becoming a
sentence. Worth checking what real screen readers actually say before committing.

## Touches

`src/components/Scrollbar.tsx`, `src/scrollbars.ts` (already computes `thumbRatio`),
`features/e2e-helpers.ts` (delete `thumbTrackFraction`'s geometry reach-around),
`features/steps/grid-scrollbars.ts`, `features/grid-scrollbars.e2e.spec.ts`.

## Open questions

- Does `aria-valuetext` suppress the `valuenow` announcement in the screen readers that matter?
- Is proportion better carried on the thumb or on the track?
- Does this want a visible affordance too, or is the thumb's own length already that?
