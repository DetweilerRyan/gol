---
name: single-shot-stamping-is-unpinned
title: Decide whether the single-shot arm-and-disarm transition needs its own scenario
created: 2026-09-04
---

## Context

Raised by `product` at `pattern-placement-claims-pinned-by-nothing`'s SPECIFY pass, and deliberately
**not** added there: that slice was named for two claims, and adding an unasked third scenario is the
move the pipeline exists to prevent. It measured the behaviour green at the previous slice and then
recommended filing rather than smuggling.

**The claim**: stamping twice in quick succession at different positions works — the first click stamps
the armed pattern, and the second is a plain single-cell toggle, because stamping disarms.

## Why it is weaker than the two that landed, and may not be worth a scenario

`product` was explicit that this is the weaker of the three, and the reasoning is worth keeping whichever
way it goes:

- **It exercises a different mechanism.** The two landed scenarios pin behaviour against **ref
  staleness** — `stampArmedPattern` reads a `placementRef` synced one effect-flush behind, so stamping
  the _wrong pattern_ is the failure mode `stable-hook-identities` introduced. This claim is about the
  **single-shot arm-and-disarm transition**, which is ordinary state machinery in
  `patternPlacement.ts` and already unit-tested there.
- **A second guard already covers the observable half.** `LifeBoard.tsx:78` passes
  `isPatternArmed={Boolean(armedPattern(placement))}` — **render state, not the ref** — so `Grid` gates
  place-vs-toggle on a value that is current at the next discrete event. The second click's
  plain-toggle behaviour therefore does not depend on the ref at all.

So the honest question is not "is the claim true" (it is, measured) but **"does it discriminate anything
no existing test does"** — and the answer looks like _no_ on the current composition.

## Sketch

**Decide before writing.** The test is the one `pattern-placement-claims-pinned-by-nothing` applied to its
own scenarios and which is now the house standard for a green-born contract: inject a fault that breaks
_this_ claim specifically, and see whether any existing test already reds. If something does, the scenario
is duplication and this candidate closes with that recorded.

The fault to inject is the interesting part: something that makes stamping **fail to disarm**, so a second
click stamps again instead of toggling. If `LifeBoard.tsx:78`'s render-state prop means `Grid` still routes
the second click to a toggle even then, the claim is unobservable from the black box and belongs nowhere —
which would itself be worth writing down, since it is the same "unreachable today, for reasons that could
change" shape the two landed scenarios were filed under.

If it does discriminate, it is one scenario in `pattern-library.feature`, which is at **8 of 10** after that
slice.

## Touches

`features/pattern-library.feature` and `features/steps/pattern-library.ts` — **if** it lands at all. No
`src/` change either way; the behaviour works.

`product`'s original probe of this shape is retained outside the repo at
`…/scratchpad/probe-stamp-timing.e2e.spec.ts.keep` (probe 1).

## Open questions

- **Should this close as "measured, not worth a scenario"?** That is a legitimate and probably likely
  outcome, and closing it with the measurement recorded is more valuable than leaving it open — the next
  person to notice the gap will otherwise re-derive it.
- If the render-state prop is what makes the claim unobservable, is **that** the thing worth pinning
  instead — i.e. a test that `Grid` gates on current state rather than the ref? That is a different claim,
  at a different layer, and arguably the more durable one.
- Does this interact with [[camera-as-a-store-instead-of-a-prop]]? That candidate would change how state
  reaches components, and the render-state-vs-ref distinction above is exactly what it would move.
