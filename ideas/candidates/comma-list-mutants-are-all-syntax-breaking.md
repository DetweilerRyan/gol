---
name: comma-list-mutants-are-all-syntax-breaking
title: Every cells-column mutant breaks syntax, so two thirds of the assertion never runs
created: 2026-08-25
---

## Context

Measured by `product` during T4's VERIFY, while substantiating that the new Playwright steps
kill what the jsdom ones did. It reproduced the runner's own mutants through
`listMutableCells`/`mutateValue` rather than inventing them, and all 24 matched the
`acceptance-mutation` console table verbatim — so this is a fact about the gate, not about a
probe.

**`mutateCommaList` cannot produce a parseable coordinate change.** It splits the cell on `,`,
so for a `cells` column the parts are `"(1"` and `" 0)"` — **neither matches `^-?\d+$`**, so
neither reaches the integer rule and both fall through to `mutateString`, whose alphabet is
lowercase letters. Every mutant it emits is therefore syntax-breaking: `(0, )2`, `(k9, 0)`,
`1, 0)`, `(2, )`.

**The consequence is that the gate exercises one third of the assertion it is scoring.**
`features/steps/pattern-library.ts` asserts bidirectional set equality **plus** an explicit
count, because those catch different corruptions:

- a **syntax-breaking** pair is invisible to the step's parser, so the _expected_ list silently
  shrinks while the screen does not → caught by the **count**, and by nothing else;
- a **parseable, count-preserving** change like `(0, 0)` → `(9, 0)` → caught by the **inclusion
  checks**, and not by the count.

Since the runner can only emit the first class, the two inclusion checks are never exercised by
the gate. `product` had to hand-craft the `(0, 0)` → `(9, 0)` probe to demonstrate they work at
all — they do, killing it on the forward-inclusion `toEqual([])`.

This is not an argument for simplifying the assertion. It is the reverse: **the assertion is
stronger than the gate measuring it**, so a future author reading only the mutation score could
conclude the inclusion checks are dead weight and delete them, and the score would not move.

## Sketch

Apply an integer rule **inside** comma-list parts rather than only to whole cells. The minimal
version: after splitting, trim each part and strip a leading `(` / trailing `)` before testing
`^-?\d+$`, so a coordinate component is recognised as the integer it is and mutated as one.
That arms the inclusion checks for every `cells` row.

Two things to be careful about, both of which the existing rules already get right for whole
cells:

- The mutation must stay **deterministic per seedKey** — the runner reruns and compares against
  a baseline, so a mutant that differs between runs would break the classifier's
  collected-test-count invariant rather than merely confusing a reader.
- A parseable-but-wrong coordinate is a **more** dangerous mutant than a syntax-breaking one, so
  expect the surface to get harder rather than larger. That is the point.

Check whether other comma-list columns exist or are likely; today `cells` is the only one, which
is why this went unnoticed.

## Touches

`scripts/acceptance-mutation/mutation-rules.ts` (the `mutateCommaList` / `mutateValue` split),
its unit tests, and `scripts/acceptance-mutation/`'s own gates — `npm run test:scripts`,
`crap4ts:scripts`, `dry4ts:scripts`, `test:mutation:scripts`. Note `scripts/` is held to the
same CRAP threshold (6) as `src/`.

**This changes the mutant surface, so the 55/55/0 figure will move** — that is expected and is
exactly the kind of movement merge-protocol step 8 exists to notice. Record the new total and
why it moved.

## Open questions

- Does arming the inclusion checks surface any _surviving_ mutant? If it does, that is a real
  gap in a step definition and the whole reason to do this.
- Is `acceptance-mutation` the right home, given a later slice repoints it at Playwright? The
  mutation rules are runner-independent, so this should survive that move untouched — worth
  confirming rather than assuming.
