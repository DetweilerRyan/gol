---
name: tuple-grammar-rejects-decimal-components
title: Decide whether the tuple grammar should accept decimal components, or restore paren-awareness to the fall-through
created: 2026-08-27
---

## Context

Found by `product` at `cells-column-has-two-parsers-and-neither-models-tuples`'s VERIFY, by probing the
residual `architect` had insisted on stating rather than by reading the code. Filed as `product`
recommended and explicitly as non-blocking.

That slice replaced `stripParenAffixes` — which shaved a leading `(` / trailing `)` off each fragment
of a flat comma split — with a real tuple grammar sitting ahead of the comma-list rule. CLAUDE.md
records the residual honestly: **a near-miss paren list falls through to comma-list and may still
syntax-break.** The probe shows that wording is _too weak in one direction_.

`TUPLE_LIST_SHAPE` requires `-?\d+` components. So `(-32, -22.5)` — **the app's own default camera
offset**, half-cell because 900px / 20px is odd — is coordinate-shaped, paren-delimited, and
**rejected**. It then falls to a `mutateCommaList` that is no longer paren-aware. Measured over 40
seed keys, counting mutants that shorten a pair-regex's view of the value:

| tree                    | shortened                                                    |
| ----------------------- | ------------------------------------------------------------ |
| slice tip               | **30 / 40** — `(-g2, -22.5)`, `(-32, -2l.5)`, `(-32, -22.5e` |
| `main` before the slice | **0 / 40** — `(-23, -22.5)`, `(-32, -22.8)`, `(-37, -22.5)`  |

So this is not merely "the fall-through may syntax-break." **It breaks a shape the previous
implementation handled cleanly**: `stripParenAffixes` exposed `-32` to the integer rule and `-22.5`
to the decimal rule and produced same-length numeric mutants. That is a real narrowing, and the
residual as written understates it.

**Why it is not urgent.** No live Examples column has this shape — the `cells` column routes to the
tuple rule, and nothing else in `features/` carries a paren-delimited decimal list. The step's count
assertion is the standing guard if one ever appears. It is filed because the next author to add a
coordinate-ish column with a fractional component would get silently worse mutants than the same
column would have got a slice ago.

**One caveat on the probe's other cases, which `product` was careful about**: the bracket list
`[0, 0], [1, 1]` scored 0/40, and that is **degenerate rather than a pass** — a paren regex sees zero
pairs at baseline, so nothing can shorten. `(0, 0)-(12, 12)` (a bounding-box range) scored 27/40 and
is a second plausible near-miss.

## Sketch

Two remedies, and they are not equivalent — pick deliberately.

**A · Widen `TUPLE_LIST_SHAPE` to `-?\d+(?:\.\d+)?`.** Brings decimal tuples into the grammar, so
they get component-change and swap like integer ones. Cheapest, and it makes the grammar match what a
reader would assume "numeric tuple" means. Note it interacts with `mutateValue`'s recursion: a decimal
component would route to `mutateDecimal`, which carries the filed `KNOWN DEFECT` about `magnitude`
being always exactly 1 — see [[decimal-mutant-magnitude-is-precision-independent]]. Landing A makes
that defect reachable from a live path for the first time, which is an argument for sequencing them
together rather than a reason to avoid A.

**B · Restore paren-awareness in the fall-through.** Keeps the tuple grammar strict and stops the
regression for _every_ rejected paren shape, not just decimals. But it reinstates the two-theories-of-
a-coordinate-list problem the slice existed to remove, and `architect` deleted `stripParenAffixes`
partly because its only remaining evidence was its own fixture.

A is probably right and B is probably a mistake, but that is a judgement the slice should make with
the measurement in front of it rather than inheriting from this file.

## Touches

`scripts/acceptance-mutation/tuple-list.ts` (`TUPLE_LIST_SHAPE`, and `parseTupleList` if components
stop being integers), its unit and property tests, and CLAUDE.md's residual paragraph — which needs
correcting whichever remedy lands, since it currently understates the case.

**Expect the mutant surface to be unchanged**: no live Examples cell has a decimal tuple, so the 55
mutants should stay byte-identical. If they move, something else changed and that is the finding.

## Open questions

- Does the property test's `PAIR` oracle — a byte-identical mirror of `features/steps/pattern-library.ts:58`,
  which is integer-only (`/\((-?\d+),\s*(-?\d+)\)/g`) — have to widen too? If it does, the two
  directories' grammars diverge unless the step regex widens as well, and that file is `product`'s.
  This may be the thing that makes A a two-role slice.
- Is a fractional cell coordinate meaningful in this app at all? Cells are integers; the camera offset
  is not a cell. If no plausible _Examples column_ ever carries one, the honest answer may be to
  correct the CLAUDE.md residual and close this without code.
