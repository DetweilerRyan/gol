---
name: reduced-motion-mid-session-is-unspecified
title: Specify that changing the reduced-motion setting takes effect without a reload
created: 2026-09-04
---

## Context

Raised by `product` at `zoom-glide-regressed-the-pan-path`'s VERIFY pass, and deliberately left
unguarded there rather than smuggled in — the slice had no SPECIFY pass and no sign-off, so a new
contract clause was not its to write.

**The claim is real and currently rests on one jsdom test.** `useZoomGlide` reads
`prefersReducedMotion` through a ref updated in a post-render effect **specifically so that a user who
changes the OS setting while the page is open gets the new behaviour**. The naive alternative — freezing
the controller on first render — would capture the value in a stale closure, keep the old glide
duration forever, and make `useReducedMotion`'s whole `useSyncExternalStore` subscription decorative.
Every gate would stay green while the feature was quietly broken for exactly the users who need it.

**`product` measured it in a real browser and then deleted the probe**, which is why this is filed
rather than closed. Three phases on one page, `page.emulateMedia` applied inline (a describe-level
`test.use` silently does not apply — that spec's own note is correct), re-arming the readout watcher
before each phase:

- **A** — normal glide first: `100 → 125`, trail carries intermediates.
- **B** — flip to `reduce` **with the page already open**, zoom in: settles 156, trail exactly
  `[125, 156]`, a **snap**.
- **C** — flip back to `no-preference`, zoom in: settles 195, intermediates present again.

**Passed 10/10 runs, and the shape is self-proving**: the same instrument produces intermediates in A,
none in B, and intermediates again in C, in one run. A ref frozen at mount fails B; a ref frozen after
B fails C. Both directions of the failure are discriminated, which is what makes it a real guard rather
than a green tick.

## Sketch

**A `.feature` scenario, not a hand-written spec** — `product`'s own recommendation, and the reasoning
matters. The claim is stateable in the contract's existing vocabulary: `camera-pan-and-zoom.feature`
already says a zoom "should not have passed through any percentages in between". So a hand-written
`*.e2e.spec.ts` would be duplication whose header could not honestly name one of the four residue
categories — which is the bar `triage-paired-specs` set for that layer.

Watch the scenario cap: `.gherkin-lintrc`'s `maxScenarios` is 10 and fires at `> 10`.
`camera-pan-and-zoom.feature` was at 10 as of `smooth-zoom-transitions`, so **check the current count
first** — this may force the same new-feature-file decision `grid-tabbable-when-cursor-off-screen` hit,
and that decision was correct on the merits there rather than a workaround.

The step needs `page.emulateMedia` mid-scenario. `features/screenplay/interactions.ts` already exports
`preferReducedMotion`; whether it needs a no-preference counterpart is the small design question.

## Touches

`features/camera-pan-and-zoom.feature` (or a new feature file), `features/steps/camera-pan-and-zoom.ts`,
possibly `features/screenplay/interactions.ts`. **bddgen is all-or-nothing**, so a new feature lands with
its step module or the whole `bdd` project stops generating.

No `src/` change — the behaviour already works and is measured. This is specification only, the same
shape as `grid-tabbable-when-cursor-off-screen`: **expect the contract to go green immediately**, which
means the usual red-then-green evidence is unavailable and a **fault battery** is owed instead. The
obvious fault to inject is freezing the ref, and the battery should show it redding phase B — and a
second fault freezing after B, since only that one discriminates the other direction.

## Open questions

- Is "the OS setting changes mid-session" a **user journey worth a scenario**, or an implementation
  robustness property better left at the unit layer? The counter-argument is real: it is rare, and the
  standing guard (`useZoomGlide.test.ts`'s "reads prefers-reduced-motion at click time, not just at
  mount") already fails if the ref stops being reassigned. The argument for is that only a real browser
  proves the media **query string** is right — `stubMatchMedia` accepts any query and returns whatever
  it was constructed with, so a typo in `'(prefers-reduced-motion: reduce)'` passes every jsdom test in
  the repo.
- That last point generalises: **which other `matchMedia`-shaped preferences would have the same hole?**
  None exist today, but [[dark-mode-following-system-appearance]] proposes one, and it will inherit this
  exact question — including "does the setting take effect without a reload".
- Does the acceptance-mutation figure move? A scenario with no Examples table adds none; if it takes a
  table, account for the delta cleanly.
