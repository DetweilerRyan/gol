---
name: pattern-placement-claims-pinned-by-nothing
title: Specify that switching an armed pattern and cancelling placement behave, in a real browser
created: 2026-09-04
---

## Context

Found by `product` at `stable-hook-identities`' VERIFY pass. It drove both claims in real Chromium,
confirmed both hold, and then **deleted the probes** — the slice had no SPECIFY pass and no sign-off, so
committing new coverage was not its to do. Filed so the measurement is not lost.

Two claims that nothing in the repo currently pins:

1. **Switching to a different armed pattern and stamping immediately stamps the new one.** Measured: arm
   Block → close and reopen the library → arm Glider → stamp. Glider's 5 cells alive, count 5, and the
   Block-only cells `(0, 0)` and `(1, 1)` dead.
2. **Escape cancels an armed pattern.** The preview clears and the next click is a plain single-cell
   toggle. The only committed `Escape` coverage is `features/modal-inertness.e2e.spec.ts:45`, which is
   **the modal, not placement** — a different thing that happens to share a key.

## Why these two, and why now

`stable-hook-identities` changed `stampArmedPattern` to read a `placementRef` synced in an effect rather
than closing over `placement`. A ref synced in an effect is **one effect-flush behind** the value it
mirrors, so the failure mode the change introduces is stamping the _wrong pattern_ — precisely claim 1.

`product` established the risk is currently unreachable, and did it by fault injection rather than
assertion: a uniform 500ms ref lag reds its probes, but a genuine one-render lag does not, because
**no drivable path reaches `stampArmedPattern` on the arming render** — the modal's unmount, a render
plus an effect flush, always interposes before the grid is clickable. It also found
`LifeBoard.tsx:78` passes `isPatternArmed={Boolean(armedPattern(placement))}` — **render state, not the
ref** — so `Grid` already gates place-vs-toggle on a current value and the ref read is a second,
redundant check.

**Read that as "unreachable today", not "impossible".** Both facts are properties of the current
component composition — the modal interposing, and that one prop being render state. Either could change
without anything going red, and the claim would then rest on nothing. That is the argument for pinning
it now.

## Sketch

Both are expressible at domain altitude, so they belong in **`pattern-library.feature`** as scenarios,
not in the hand-written layer — a hand-written spec's header could not honestly name one of the four
residue categories for either, which is the bar `triage-paired-specs` set.

Check the scenario cap first: `.gherkin-lintrc`'s `maxScenarios` is 10 and fires at `> 10`.

`product`'s probes are retained outside the repo at
`…/scratchpad/probe-stamp-timing.e2e.spec.ts.keep` and are the starting point for the steps, though the
Gherkin should state the user's claim rather than transcribe the probe.

## Touches

`features/pattern-library.feature`, `features/steps/pattern-library.ts`, possibly
`features/screenplay/`. **bddgen is all-or-nothing** — a new feature file lands with its step module or
the whole `bdd` project stops generating.

**No `src/` change** — the behaviour already works and is measured. Same shape as
`grid-tabbable-when-cursor-off-screen`: the contract goes **green immediately**, so the usual
red-then-green evidence is unavailable and a **fault battery** is owed instead. `product`'s existing
injection is the model, and note it needs the _right_ fault: a one-render lag is green, so a battery
built on that alone would prove nothing. The 500ms-lag arm is the one that discriminates.

**Expect `acceptance-mutation` to move** if either scenario takes an Examples table; account for the
delta cleanly against the current 91 / 91 / 0.

## Open questions

- Is claim 2 (Escape cancels placement) better placed in `pattern-library.feature` or alongside the
  existing modal-Escape coverage? They are different behaviours sharing a key, and putting them together
  may imply a relationship that does not exist.
- Does claim 1 want an Examples table over several pattern pairs, or is one switch enough? A table adds
  mutants and the reverse-inclusion discipline `pattern-library.ts` already carries.
- Is there a third claim here — that stamping twice in quick succession at different positions works?
  `product` measured it green but it is a weaker claim, being about the single-shot transition rather
  than the ref.
