---
name: decimal-mutant-magnitude-is-precision-independent
title: Decide whether a decimal Examples mutant should scale with the value's precision
created: 2026-08-27
---

## Context

`mutateDecimal` (`scripts/acceptance-mutation/mutation-rules.ts`) computes

```ts
const magnitude = Math.max(1, Number(`1e-${decimals - 1}`))
```

and that expression is **always exactly 1**. The decimal rule's pattern
(`/^-?\d+\.\d+$/`) requires at least one digit after the dot, so `decimals >= 1`,
so `1e-(decimals - 1) <= 1` for every input, and `Math.max` clamps every case to
the constant. Measured: decimals 1/2/3/4/6 give raw magnitudes 1 / 0.1 / 0.01 /
0.001 / 0.00001 and a clamped magnitude of 1 in all five.

So the perturbation a decimal mutant applies is precision-independent, where the
`1e-${decimals - 1}` expression plainly intends it to scale. `0.001` currently
mutates to `0.054` — a 54x change — while `1.5` mutates to `2.3`.

Surfaced by `cleaner`'s demonstration-rule pass in
`comma-list-mutants-are-all-syntax-breaking`: three mutants survive on this line
(gutting the template literal, `-`→`+`, `*`→`/`), and they survive because the
code they mutate is dead, not because the tests are weak.

**Nothing observable moves today** — no `.feature` carries a decimal column, so
`npm run acceptance-mutation` never reaches this function. That is what makes it
a candidate rather than a defect to fix under time pressure, and also what makes
it easy to leave wrong indefinitely.

## Sketch

The two candidate resolutions are **not** "use `Math.min`" and "drop the clamp" —
those are the same edit, since `min(1, x) = x` for all `x <= 1`. The real choice
is a contract question:

1. **Constant magnitude is intended.** Then write `const magnitude = 1`, delete
   the dead expression, and say in a comment why a decimal mutant is deliberately
   a whole-unit perturbation regardless of precision. Kills all three survivors.
2. **Precision-scaled magnitude is intended.** Then `const magnitude =
Number(`1e-${decimals - 1}`)`, with no clamp. Changes the mutant every decimal
   value produces, so **every decimal row in `mutation-rules.test.ts`'s `PINNED`
   table has to be re-pinned** — that table exists precisely to make this kind of
   change loud.

Consult unclebob/Acceptance-Pipeline-Specification's `mutator-spec.md` first;
`VALUE_RULES`' ordering is transcribed from it and it may state the intended
magnitude. It is not vendored into this repo, so this needs fetching.

## Touches

- `scripts/acceptance-mutation/mutation-rules.ts` (`mutateDecimal`)
- `scripts/acceptance-mutation/mutation-rules.test.ts` (the decimal rows of
  `PINNED`, and the decimal loop tests, under resolution 2)
- No `.feature` file, and no `src/`. Single-module slice; no design pass needed.

## Answered: should a decimal column be added to a `.feature`?

This was the third open question. `architect` answered it in
`correct-decimal-coupling-claim`, in two halves that should not be conflated.

**Measured.** Adding the column costs **zero tuple work in either direction**. A
paren-delimited decimal like `(1.5, 2.5)` never reaches `mutateDecimal` at all —
`isTupleList` rejects it (components are not `-?\d+`), it falls to the comma-list
rule, and its `(1.5` / `2.5)` fragments match no numeric pattern either, so both
land in `mutateString`. Conversely a column that _does_ exercise `mutateDecimal`
cannot trip `tuple-grammar-rejects-decimal-components`' re-open trigger, which
requires paren-delimited. The two are **disjoint**, not coupled — CLAUDE.md
asserted the opposite until this slice, and it was backwards rather than merely
loose.

The precise reachability rule, since it is wider than "one bare cell":
`mutateDecimal` fires exactly when a cell **or one of its trimmed comma-split
fragments** is wholly `-?\d+\.\d+`. So `| 1.5 |` reaches it, and so does
`| 0.25, 0.5 |` through `mutateCommaList`'s recursion.

**Judgment, and `architect` flagged it as recommendation rather than
measurement.** Every fractional quantity this app actually has sits on
`.gherkin-lintrc`'s `no-restricted-patterns` ban list — `\boffset ?[xy]\b`,
`\bcell ?size\b`, `\bthumb ?(offset ?)?ratio\b`, `\bworld (coordinate|position|point)`.
So a decimal column would need a fractional _domain_ quantity the contract does
not have and the altitude linter would refuse.

**So: no column. This is a `scripts/`-only slice**, with the choice measured by
re-pinning `mutation-rules.test.ts`'s PINNED decimal rows rather than by
`npm run acceptance-mutation`. Note that is the same argument that closed
[[tuple-grammar-rejects-decimal-components]], reached from the neighbouring card
in the opposite direction — which is some evidence it is the right one.

## Open questions

- What does `mutator-spec.md` actually say about numeric mutation magnitude?
- Under resolution 2, does the `do…while (mutated === value)` retry still
  terminate quickly for high-precision values? A magnitude of `1e-5` against
  `toFixed(6)` gives a much narrower band of deltas that survive the rounding
  round-trip than a magnitude of 1 does — worth a loop test over many seeds.
