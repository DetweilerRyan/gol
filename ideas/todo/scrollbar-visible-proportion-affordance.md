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

## Wording decision

Settled by `product` in SPECIFY, downstream of `architect`'s CONTRACT ruling that the affordance
is `aria-describedby` → a visually-hidden span on the thumb (the node carrying
`role="scrollbar"`), additive to `aria-valuenow`. Only the **text** was open; this section closes
it. No `.feature` changes, and `aria-label` stays `Horizontal scroll` / `Vertical scroll`.

### The text

```
<N> percent of the grid is in view
```

`28 percent of the grid is in view` · `100 percent of the grid is in view` (34 chars, the longest
form). Identical on both axes at the same proportion — orientation already disambiguates.

`<N>` is `Math.round(metrics.thumbRatio * 100)`, the same rounding convention `aria-valuenow`
already applies to `thumbOffsetRatio`. **No clamp**: a span wide enough to round to zero (~12,800
cells at the default 20px cell) announces `0 percent of the grid is in view`. That is decided, not
overlooked — clamping to 1 would make the announcement disagree with the arithmetic everywhere
else in `scrollbars.ts` for one degenerate case a player has to work to reach.

### Why "percent" and not `%`

The one forced divergence from `architect`'s illustrative `28% of the grid is in view`, and the
collision check is what forces it. Playwright's `getByText(string)` is **substring and
case-insensitive by default** — `exact?: boolean`, "Default to false"
(`node_modules/playwright-core/types/types.d.ts:2985`). Three specs match the zoom badge with a
bare percent **string**:

- `perf/zoom.perf.spec.ts:157` — `page.getByText('100%')`
- `perf/pan.perf.spec.ts:60` — `page.getByText('40%')`
- `perf/tile-boundary.perf.spec.ts:141` — `page.getByText(expectedZoomReadout(spec.cellSizePx))`, which returns a bare `` `${n}%` `` (`perf/tile-boundary.ts:128`)

Any description containing a literal `NN%` token resolves those locators to three elements (the
badge plus both sr-only descriptions) and throws a strict-mode violation — in `perf/`, which is
outside `product`'s write boundary and outside every quality gate. Spelling the word costs
nothing: the span is visually hidden, its only consumer is speech, and a screen reader verbalises
`%` as "percent" regardless. Same class of failure `architect` measured for a bare-`100%`
description against `zoomPercent`, one locator further out.

### What it must not collide with, and doesn't

Every string the app renders: `Conway's Game of Life` · `Next Generation` · `Generation: N` ·
`+` · `−` · `Reset` · `Patterns` · `NN%` (zoom badge) · ruler labels `-?\d+` · `Pattern Library` ·
`Still Life`/`Oscillators`/`Spaceships` · the 8 pattern names. The words `percent`, `in view`,
`of the grid` and `showing` appear in none of them, in `src/` or in `features/`.

- `page.getByText(/^\d+%$/)` (`questions.ts`'s `zoomPercent`, `modal-inertness.e2e.spec.ts:48`) — anchored, and the phrase carries no `%` at all. Two independent reasons it can't match.
- `page.getByText(/^Generation: \d+$/)` — anchored.
- `rulerGroup(page, axis).getByText(/^-?\d+$/)` — anchored **and** scoped inside the ruler group; the span is inside the scrollbar track.
- The three `perf/` substring sites above — no `%` glyph, so no match.
- RTL `screen.getByText` in `src/components/*.test.tsx` — whole-string by default, and `Scrollbar.test.tsx` renders `Scrollbar` alone.

### The parser regex

`/(\d+) percent of the grid is in view/`, deliberately **un**anchored and **right**-anchored by
the literal that follows the digits. That is what makes it survive the string being spoken after
name + role + value: in `Horizontal scroll, scroll bar, 28, 28 percent of the grid is in view`
the only `(\d+)` followed by ` percent of the grid` is the right one. A left-anchored form would
have been ambiguous against the preceding `valuenow`.

### Encoding — `src/test-support/scrollbarQuery.ts`

New module on the `rulerQuery.ts` precedent: imports nothing, plain functions, and
`Scrollbar.tsx` keeps a **deliberate duplicate** of the literal because
`rules/no-test-support-in-product-tsx.yml` forbids the import. `rulerQuery.ts`'s lesson is that
an export with no caller gets deleted at review, so both exports are named with theirs:

| export  | shape                                              | caller                                                                             |
| ------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| builder | `visibleProportionText(percent: number): string`   | `src/components/Scrollbar.test.tsx`, asserting the rendered description            |
| parser  | `parseVisibleProportionText(text: string): number` | `features/screenplay/questions.ts`, in the function replacing `thumbTrackFraction` |

`questions.ts` already imports `src/test-support/cellQuery.ts` under the same licence — reading
_what a control announces_ rather than _how to reach it_.

### Two consequences for whoever verifies this

- **The announcement is truer than the pixels.** `computeThumbGeometry` clamps the rendered thumb
  to `MIN_THUMB_PX` (24), so at extreme spans the drawn length overstates the proportion; the
  description reports `thumbRatio` unclamped. The two legitimately disagree there. Not a defect.
- **It serves both dependent `.feature` clauses exactly, with no tolerance.** "fills its track" is
  `100`; "covers a quarter of its track" is `25`. Today those are geometry reads needing
  `FILLS_TRACK = 0.99` and `toBeCloseTo(0.25, 2)` to absorb sub-pixel layout rounding
  (`features/steps/grid-scrollbars.ts:48-58,107`). An integer percent read off the accessibility
  tree needs neither.

### Rejected

- **`28% of the grid is in view`** — `architect`'s illustrative example, glyph intact. Rejected on
  the measured `perf/` substring collision above; otherwise identical and acceptable.
- **`Showing 28 percent of the grid`** — a cleaner participial fragment, and it puts an anchor
  word _before_ the number. Rejected because no constraint discriminates it: the right-anchored
  parser already makes the number unambiguous, and constraint 5's "fragment" is satisfied by the
  constraint author's own example, which contains the same copula. Divergence with no gain.
- **`Grid in view: 28 percent`** — echoes `Generation: N`'s label form, which reads as a second
  HUD readout rather than as a description, and invites a `/^Grid in view: \d+ percent$/`
  full-match locator of exactly the kind constraint 3 exists to prevent.
- **A bare `28%` or `28 percent`** — constraint 3 outright; the glyph form is the case `architect`
  measured taking `zoomPercent` from 1 match to 3.
- **Restating position** ("28 percent in view, 40 percent down") — constraint 4. `aria-valuenow`
  already carries position and keeps carrying it.
- **Naming columns, rows or coordinates** ("28 percent of the columns are in view") — constraint 2.
  That is the `Column ruler`/`Row ruler` register, and it would also make the two axes read
  differently at 100%, which is wrong: at rest both scrollbars are saying the same true thing.

### Vocabulary check

Nothing here needs to reach step text — the existing clauses ("fill its track", "be shorter than
its track") stand unchanged. If any of it ever does, it clears `.gherkin-lintrc`'s
`no-restricted-patterns`: no `thumb ?(offset ?)?ratio`, no `metrics`, no `content bounds`.
"the grid" and "in view" are player vocabulary, not module vocabulary.
