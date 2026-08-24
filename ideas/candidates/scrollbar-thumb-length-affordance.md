---
name: scrollbar-thumb-length-affordance
title: Give Scrollbar an observable thumb-length signal, so grid-scrollbars can convert to black-box form
created: 2026-08-24
---

## Context

`src/components/Scrollbar.tsx` exposes thumb **offset** ratio through
`aria-valuenow` and nothing at all for thumb **length** ratio — which is what six
of eight `grid-scrollbars` scenarios assert today. Raised twice now: first when
the acceptance-migration plan was drafted, and again by `architect`'s DESIGN pass
on `prune-gherkin-to-domain-language`, which ruled it real but out of that slice's
scope.

It doesn't bite today. It bites the moment someone converts `grid-scrollbars` to
the black-box `.steps.test.tsx` form, because the harness reaches the app only
through accessible affordances — a rule enforced by
`rules/no-domain-imports-in-black-box-steps.yml`. With no thumb-length signal,
those six scenarios have nothing to observe.

Same class as `aria-pressed-cell-state`: a fact the product genuinely expresses,
with no accessible representation, forcing every layer that needs it onto an
implementation detail.

## Sketch

Three routes, and the choice is the substance of the slice.

1. **A real ARIA affordance.** The scrollbar role's value semantics cover
   position, not extent, so there may be no conformant attribute for "the thumb
   covers 40% of the track". If that's so, say it explicitly rather than
   inventing one — an invalid attribute is worse than none, which is the ruling
   `aria-pressed-cell-state` already made about `aria-checked` on a button.
2. **A browser-mode test** (`src/components/Scrollbar.browser.test.ts`), reading
   real geometry from real layout. **Additive only** — `vite.config.ts` excludes
   the `*.browser.test.ts` suffix and both crap4ts and Stryker run through that
   config, so this layer cannot kill a mutant or supply coverage. It answers "is
   the thumb actually the right length in a real browser", which jsdom cannot,
   and it does **not** answer "can an acceptance step observe thumb length".
   Those are different questions and only the second unblocks the conversion.
3. **Accept that `grid-scrollbars` stays direct-call.** `finish-step-test-migration`'s
   completion condition (`ls features/*.steps.test.ts | wc -l` returns 0) would
   then need an explicit, argued exception rather than quietly never being met.

Route 2 is worth doing on its own merits regardless of which route unblocks the
conversion — thumb geometry under real layout is exactly the "no faithful jsdom
equivalent" case that layer exists for, and `Scrollbar` has none today.

## Touches

`src/components/Scrollbar.tsx`, `src/components/Scrollbar.test.ts`, possibly a
new `Scrollbar.browser.test.ts`, and `features/grid-scrollbars.feature` plus its
steps if the conversion lands in the same slice. Prefer not — the affordance and
the conversion are separable, and the affordance is the blocking half.

## Open questions

- **Is there a conformant ARIA answer at all?** Settle this first; the other two
  routes are only interesting if the answer is no. Worth `architect`'s CONTRACT
  mode, which exists for exactly this question.
- If there is no ARIA answer, does a `data-*` attribute count? `architect` has
  already ruled against that shape once this session — on the major-gridline
  border class — calling it "a test hook wearing an affordance's name". The same
  objection applies here unless thumb length is genuinely user-perceivable
  information, which unlike gridline majorness it arguably is: it tells you how
  much of the content you're seeing.
- Whether the six scenarios are at the right altitude in the first place. If
  `prune-gherkin-to-domain-language` has already reworded them by the time this
  runs, re-read them before assuming the requirement still stands.
