---
name: lifeboard-comment-overstates-inertness
title: Repoint LifeBoard's dialog comment, and correct what it claims holds the guarantee
created: 2026-09-06
---

## Context

`src/components/LifeBoard.tsx:76` carries a comment ending `Covered by
e2e/modal-inertness.e2e.spec.ts.` — a file `convert-modal-inertness-to-scenarios` deleted. The
claims are now `features/while-the-pattern-library-is-open.feature`'s three scenarios.

**The repoint is the small half.** The comment justifies the _absent_ open-state guard on
`GridToolbar`'s `onPatterns` handler by Headless UI's dialog inertness alone. That justification is
narrower than what actually holds, and the conversion slice measured it by splitting the fault
injection:

| probe                                               | result          |
| --------------------------------------------------- | --------------- |
| neutralize the dialog's covering (`pointer-events`) | all three green |
| neutralize its inertness (`aria-hidden` / `inert`)  | all three green |
| neutralize both                                     | all three red   |

So **covering and inertness are redundant guards**, either sufficient on its own. `hardener`
corroborated the same three figures by a different route — letting the acts land through a
close/reopen cycle rather than disabling the mechanisms — so this is two independent measurements,
not one repeated.

That matters for a reader deciding whether the missing guard is safe: the comment currently rests
the answer on one mechanism, and a change to that mechanism alone (a Headless UI upgrade, a swap to
a different dialog) would read as breaking it when it would not.

## Sketch

`architect` in REVIEW or ADJUDICATE mode. Repoint the reference at the feature file, and restate the
justification as the two independent guards the measurement found. Check the neighbouring
overlay-order comment on the overlay slot at the same time — it makes a related structural claim
(every overlay sits above `#grid-content` as a sibling) that this slice did not test either way.

## Touches

`src/components/LifeBoard.tsx` — comments only, no behavior.

## Open questions

- **Is a comment-only `src/` edit worth its own slice?** It is not. `src/**` is deliberately off the
  merge protocol's mutation-invariant allowlist, so this diff triggers a full
  `npm run test:mutation:full` for a change that provably produces no mutant — `LifeBoard.tsx` is
  excluded from `stryker.config.json`'s scope entirely. Reasoning past the allowlist is exactly the
  wrong-logic path CLAUDE.md warns it exists to block, so the economical answer is to **carry this
  along with the next slice that already touches `src/`** rather than to relax the predicate or to
  pay the run. File it here so it is not lost in the meantime.
- Does the redundancy hold under reduced motion, or when the dialog is mid-transition? `hardener`'s
  first probe attempt raced the close transition and read 2 of 3 green before it added a settle —
  which says the timing window is real, even though it turned out to be a probe artifact rather than
  a product defect. Worth one look before the comment asserts redundancy flatly.
