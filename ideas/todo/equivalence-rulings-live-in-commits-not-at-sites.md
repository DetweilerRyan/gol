---
name: equivalence-rulings-live-in-commits-not-at-sites
title: Backfill site comments for the mutation survivors whose equivalence rulings live only in commits
created: 2026-09-04
---

## Context

Raised by `hardener` at `stable-hook-identities`' gate run, and reported rather than fixed because
every one of them is outside that slice's changed-files manifest.

The full run leaves **23 survivors at 22 unique sites**. **15 carry an explicit measured-equivalent
comment at the site.** Seven do not:

- `src/cache.ts:115`
- `src/gameOfLife.ts:73` (two mutants at one site, `:35` and `:43`)
- `src/liveCellSeed.ts:28` and `:55`
- `src/scrollbars.ts:30` and `:31`

All are in files that slice never touched, and all are **likely already ruled** — they sit within the
set earlier slices audited. Their rulings live in commit messages and role handoffs rather than beside
the code.

**The cost is a recurring tax, not a risk of wrongness.** Nothing is unsound: each of these has been
hand-applied and demonstrated green at some point. But nothing at the site says so, so the next
`hardener` doing its job re-derives each one from scratch — hand-apply, run the whole unfiltered suite,
revert. That is the correct behaviour given what it can see, and it happens every full run.

The asymmetry is the tell: 15 of 22 sites already carry the comment, so this is an incomplete practice
rather than a decision not to comment.

## The complication that makes this more than a copy-paste job

**A ruling recorded before `stable-hook-identities` was made under a rule that has since changed.**
`cleaner.md`'s demonstration rule now carries a precondition it did not have: _a green unfiltered run
only means equivalent if some test actually drives the branch that differs._ That slice found a
**covered-but-undiscriminated** mutant — emptying `useCamera.ts`'s `cameraRef` sync effect left the
suite green at 908, and it was **not** equivalent, because no test panned the camera before calling a
centered zoom.

So backfilling honestly means **re-checking each of the seven against the new precondition**, not
transcribing an old verdict. For each: name the input that would make mutated and original diverge, and
confirm a test supplies it. Two of the seven look safe on inspection and one of those is worth naming
as the model — `gameOfLife.ts:73`'s `x + dx` → `x - dx` is equivalent by **symmetry** (`dx` sweeps
`{-1, 0, 1}`, so negating it enumerates the same eight neighbours), which is checkable without running
anything. A ruling arguable from the code beats one resting on a green run, and where such an argument
exists it should be what the comment records.

## Sketch

Seven sites. For each: re-check under the new precondition, then write the comment in the shape the
other 15 already use (`useZoomGlide.ts:168` and `usePatternPlacement.ts:66` are the freshest examples,
and both state the mechanism rather than just the verdict).

Any that turns out **not** equivalent under the new precondition is the real finding, and owes a test
rather than a comment.

## Touches

`src/cache.ts`, `src/gameOfLife.ts`, `src/liveCellSeed.ts`, `src/scrollbars.ts` — **comments only**, if
every one holds up. A `src/` diff means no mutation-invariant exemption and a full stage 4.

Note this slice would be almost entirely `hardener`-shaped work — hand-applying mutants and running the
unfiltered suite — but performed by `cleaner`, whose demonstration rule it is. Worth deciding which role
owns it before starting.

## Open questions

- **Is a site comment the right home at all?** The alternative is that the mutation report itself should
  carry rulings, but Stryker has no such mechanism and a `// Stryker disable` would suppress the mutant
  rather than document it — losing the signal if the code later changes so the mutant stops being
  equivalent. A comment keeps the mutant live and tells the reader why it survives, which is why the
  other 15 sites use one.
- Should this wait until the seven are actually re-checked, in case some are **not** equivalent and the
  slice becomes "close real gaps" rather than "write comments"? That would change its size and its owner.
- Is there a cheap way to tell, at report time, which survivors already carry a site comment? That would
  turn "which are undocumented" from a manual audit into a one-line check, and is arguably the more
  durable fix.
