---
name: stages-5-and-6-see-test-sets-22-apart
title: Reconcile hardener's same-test-set invariant with the measured 22-test stage-5/6 divergence
created: 2026-09-16
---

## Situation

`hardener.md` states "Stages 5 and 6 see the same test set. If they ever diverge, that is a finding
rather than a known asymmetry." `mutation-testing.md` sanctions `it.skipIf('__stryker__' in
globalThis)` as an accepted idiom — which by construction makes the two stages diverge.

## Complication

Measured 2026-09-16 by `hardener` during the `backlog-board-migration` gate, on a tree whose manifest
contained no `src/` file: stage 6's coverage input ran 955 tests, Stryker's dry run reported 933.
A probe with `globalThis.__stryker__` set showed 943 passed / 12 skipped, all names distinct. So 12
of the 22 are the sanctioned skip idiom — the role file's absolute invariant and the article's
sanctioned idiom contradict each other on those. **The residual 10 have no asserted mechanism.**
The measuring pass deliberately declined to guess one.

## Question

What accounts for the residual 10, and how should the role file's invariant be restated so the
sanctioned idiom stops reading as a standing violation?

## Answer

None yet — the 10 want a measurement before any prose moves. Plausible but unverified: browser-suffix
or environment-conditional collection differences between the coverage run and Stryker's dry run.

## Open questions

- Is the residual 10 stable across runs, or does it track something in the tree?
- Does the reconciliation belong in `hardener.md` (restate the invariant as "identical minus the
  sanctioned skips, count them") or in `mutation-testing.md` (name the divergence the idiom causes)?
- No role edits either file — the seat does, on the user's approval, once the measurement exists.
