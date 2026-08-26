---
name: scrollbar-visible-proportion-affordance
title: A scrollbar announces where it is but never how much you can see
created: 2026-08-24
---

## Context

`src/components/Scrollbar.tsx` announces `aria-valuemin={0}`, `aria-valuemax={100}` and
`aria-valuenow={round(thumbOffsetRatio * 100)}` — **position only**. It never expresses
`thumbRatio`: what fraction of the content is currently visible. That is arguably the most
useful thing a scrollbar tells a sighted user ("you are seeing a tenth of this"), and a
screen-reader user cannot get it at all.

Same class as `aria-pressed-cell-state`: a fact the product genuinely expresses visually, with
no accessible representation, forcing every layer that needs it onto an implementation detail.

**Raised four times now, by three roles, for two different consumers** — which is the real
argument that it is worth doing:

1. when the acceptance-migration plan was first drafted;
2. by `architect`'s DESIGN pass on `prune-gherkin-to-domain-language`, ruled real but out of
   scope;
3. by `product` while writing T3's bdd step modules, and ruled by `architect` at that slice's
   REVIEW: a genuine missing affordance, **not** a spec or code defect, because **ARIA has no
   attribute for proportion** — so this needs an _invented_ affordance rather than a corrected
   one, which makes it product-visible work;
4. by `product`'s VERIFY on that same slice, which noticed this file and
   `scrollbar-thumb-length-affordance.md` were the same missing affordance filed twice under
   two names, and would have planned two slices for one change.

This file is the merge of both. It keeps the newer name because the older file's stated
rationale — unblocking a `grid-scrollbars` conversion to the black-box `.steps.test.tsx` form —
**is now moot**: the `adopt-playwright-bdd` programme deletes that layer rather than converting
to it. The live consumer is the Playwright one.

## What it costs today

A geometry reach-around. `features/e2e-helpers.ts`'s `thumbTrackFraction` reads the proportion
by comparing the thumb's bounding box to its parent track's, because there is no accessible
channel to read it from. It is confined to one function and carries this idea's name as its
deletion trigger — the same discipline `xAxisLabels`/`yAxisLabels` carry for
[[ruler-label-axis-affordance]]. Two `.feature` clauses depend on it: _"the horizontal thumb
should fill its track"_ and _"the vertical thumb should be shorter than its track"_.

## Sketch

Three routes, and the choice is the substance of the slice.

1. **A real ARIA affordance.** The `scrollbar` role's value semantics cover position, not
   extent. `aria-valuetext` is the standard escape hatch for "the number does not tell the whole
   story", but it _replaces_ how `valuenow` is announced rather than adding to it, so the
   wording has to carry both position and proportion without becoming a sentence. Check what
   real screen readers actually say before committing. If there is no conformant answer, say so
   explicitly rather than inventing one — an invalid attribute is worse than none, which is the
   ruling `aria-pressed-cell-state` already made about `aria-checked` on a button.
2. **A browser-mode test** (`src/components/Scrollbar.browser.test.ts`), reading real geometry
   from real layout. Worth doing on its own merits — thumb geometry under real layout is exactly
   the "no faithful jsdom equivalent" case that layer exists for, and `Scrollbar` has none
   today. But note it is **additive only**: `vite.config.ts` excludes the `*.browser.test.ts`
   suffix and both crap4ts and Stryker run through that config, so it cannot kill a mutant or
   supply coverage. It answers "is the thumb the right length in a real browser", **not** "can a
   black-box step observe the proportion". Only the second retires the reach-around.
3. **Accept the reach-around**, and keep `thumbTrackFraction` as the sanctioned single site.

## Touches

`src/components/Scrollbar.tsx`, `src/components/Scrollbar.test.ts`, possibly a new
`Scrollbar.browser.test.ts`; `src/scrollbars.ts` already computes `thumbRatio`. On the
verification side: `features/e2e-helpers.ts` (delete `thumbTrackFraction`'s reach-around and its
deletion-trigger comment), `features/steps/grid-scrollbars.ts`,
`features/grid-scrollbars.e2e.spec.ts`, and CLAUDE.md's note naming the two reach-arounds.

## Open questions

- **Is there a conformant ARIA answer at all?** Settle this first; routes 2 and 3 are only
  interesting if the answer is no. Worth `architect`'s CONTRACT mode, which exists for exactly
  this question.
- Does `aria-valuetext` suppress the `valuenow` announcement in the screen readers that matter?
- Is proportion better carried on the thumb or on the track? Does it want a visible affordance
  too, or is the thumb's own length already that?
- If there is no ARIA answer, does a `data-*` attribute count? `architect` has ruled against
  that shape once already — on the major-gridline border class — calling it "a test hook wearing
  an affordance's name". The objection applies here **unless** proportion is genuinely
  user-perceivable information, which unlike gridline majorness it clearly is.
- Are the dependent scenarios at the right altitude in the first place? See
  [[prune-gherkin-implementation-altitude]], which covers the sibling clauses in the same file.
