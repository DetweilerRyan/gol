---
name: scrollbar-drag-guard-is-pinned-by-nothing
title: Decide whether Scrollbar's drag guard deserves an assertion rather than an uncaught throw
created: 2026-09-05
---

## Context

Found by `hardener` at `barrel-mandatory-for-step-modules`' gate run, and worth filing because the
hand-applied verdict **differs from the precedent it was assumed to match**.

`src/components/Scrollbar.tsx:47`'s `if (!drag) return` in `handlePointerMove` mutates to
`if (false) return` and reports as Stryker's **`RuntimeError`** — the documented reporter-crash class
(Stryker's own `errorToString` failing with `TypeError: Cannot convert object to primitive value`).
That class is recorded in CLAUDE.md as _"not evidence about the code"_, resolved by hand-applying and
running the unfiltered suite.

**Hand-applied, it behaves differently from the documented case.** CLAUDE.md's precedent
(`useGridPointerGestures.ts`'s `handlers: false`) _"fails 33 tests"_. This one fails **zero
assertions**: `npx vitest run` reports **70 files / 950 tests passed** and exits **1**, on a single
unhandled `TypeError: Cannot read properties of null (reading 'lastClientPos')` thrown from
`Scrollbar.tsx:49` inside a React event dispatch.

So the mutant **is** non-equivalent and `npm test`'s exit code **does** catch it — but nothing
_asserts_ the guard. It is caught by the app throwing, not by a test noticing.

## Why that is worth a decision rather than a shrug

**The guard is real.** `handlePointerMove` reads `drag.lastClientPos`, so without the early return a
pointermove outside a drag dereferences `null`. That is the behaviour the line exists for.

**But an uncaught throw is a weak instrument.** It depends on a test happening to dispatch a
pointermove with no drag in progress, and on the runner surfacing an unhandled rejection as a
nonzero exit rather than swallowing it. Neither is asserted anywhere, and both are properties of the
harness rather than of the guard. A future change to either — a test reordering, a runner upgrade
that reports unhandled errors differently — would silently remove the only thing catching it.

**And it recurs.** This mutant has surfaced in every full run this session (four sightings across
`stable-hook-identities`, `equivalence-rulings-live-in-commits-not-at-sites`,
`dark-mode-following-system-appearance` and `barrel-mandatory-for-step-modules`), and each time a
role has spent a hand-application resolving it. That is the same recurring tax
`equivalence-rulings-live-in-commits-not-at-sites` was filed about — except this one is a
`RuntimeError` rather than a survivor, so the site-comment convention that slice established does
not cover it.

## Sketch

Two candidate outcomes, and the second is not obviously worse:

1. **Pin it.** A jsdom test in `Scrollbar.test.tsx` dispatching a `pointermove` with no drag in
   progress and asserting nothing happens — no camera call, no throw. That converts an uncaught
   exception into a named assertion, and gives the `RuntimeError` row a site comment recording that
   the guard is genuinely tested.
2. **Record and leave it.** The mutant dies either way, the score is unaffected, and adding a test
   for a line already caught by the suite's exit code may be ceremony. If so, the honest output is a
   site comment saying _"caught by an uncaught throw, deliberately not asserted, here is why"_ — so
   the next `hardener` stops re-deriving it.

**Either way the recurring hand-application should stop.** The thing to avoid is a fifth role
spending the same ten minutes reaching the same conclusion.

## Touches

`src/components/Scrollbar.tsx` (a comment either way) and `src/components/Scrollbar.test.tsx` (only
under option 1). `src/` diff means no mutation-invariant exemption and a full stage 4.

**Check first whether an assertion is even reachable.** `Scrollbar.test.tsx` already drives a drag
sequence; whether a jsdom `pointermove` with no prior `pointerdown` reaches `handlePointerMove` at
all depends on how the component wires its listeners, and `useGridPointerGestures`' pointer-capture
retargeting is documented elsewhere in this repo as making exactly this kind of route
counterintuitive. If the handler cannot be reached without a drag, option 1 is unavailable and the
decision is made for you.

## Open questions

- Does CLAUDE.md's `RuntimeError` paragraph need amending? It currently describes the class by one
  site with a _"fails 33 tests"_ verdict; this site fails **zero** assertions. The class is the
  reason string, not the consequence — and that distinction is now measured twice.
- Is there a general form? Any guard whose violation throws rather than misbehaves has the same
  property: the suite catches it, but nothing pins it. Worth asking whether other `if (!x) return`
  guards in components are in the same position before treating this as one site.
