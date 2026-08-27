---
name: gherkin-ast-mutation
title: Refactor acceptance-mutation's Examples parser onto a real Gherkin AST
created: 2026-08-23
---

## Context

Slice H, and **trigger-driven rather than sequenced** — deliberately so.
Scheduling it means doing it before there is evidence it is needed; leaving it
unwritten means rediscovering this analysis.

`scripts/acceptance-mutation/gherkin-examples.ts` is a **line-oriented text
rewriter**: `findExamplesTables` scans for `/^\s*Examples:\s*$/`, `readTableAt`
consumes the following `|` lines, and `applyMutation` rewrites exactly one line
through `renderTableRow` — which hardcodes a 6-space indent and `| a | b |`
spacing. [GherKing / gherkin-ast](https://github.com/gherking/gherking) would
replace that with a real AST plus precompilers.

**The line scanner is more robust than it looks.** It keys off `Examples:` alone,
so `Rule:` and `Background:` pass through untouched (verified). Its real
fragilities are narrow: the hardcoded indent (which happens to match
`.gherkin-lintrc`'s `example: 6` by construction), no handling of escaped `\|` in
a cell, and it counts **empty** cells as mutants — `grid-reference-lines`'
`| 1 | 9 | 1 | 9 | | |` row yields 6 mutants, two of them empty-string.

**The one argument that cuts the other way, and it's real:** the seed key is
`${feature}:${rowIndex}:${columnName}`, so a pruning pass's row deletions
renumber every downstream mutant and reshuffle the whole set. An AST version could
key by scenario name plus a hash of the row's content, making seeds stable across
unrelated edits. Genuinely better — but a nice-to-have, since baselines here are
compared in aggregate rather than per-mutant.

## Sketch

Do it when **either** trigger fires:

1. The line-oriented scanner produces a **wrong mutant** — a mis-parsed cell, a
   mangled re-render, or a mutation landing outside the intended table. One
   occurrence is enough; that is the failure this refactor exists to prevent.
2. The features start using a Gherkin construct beyond `Scenario` /
   `ScenarioOutline` / `Examples` in a way the scanner touches — DocStrings,
   step-level data tables, or escaped pipes. `Background:` and `Rule:` alone don't
   count.

### Three things to verify first, before committing to the dependency

- **Comment fidelity on round-trip.** These `.feature` files carry substantial
  explanatory comments (`infinite-grid.feature`'s scaling note,
  `cell-life-and-death.feature`'s `expected center x/y` rationale). Many AST tools
  drop comments. If gherkin-ast does, a re-rendered mutant diverges from the
  original in ways that make debugging a survivor harder — **check this first, it
  may be disqualifying on its own.**
- **Seed stability.** Whatever keying scheme replaces `rowIndex`, prove the mutant
  _set_ is identical on an unchanged feature, or the baseline moves for reasons
  unrelated to quality.
- **Whole-file re-render vs. one-line rewrite.** Today `applyMutation` leaves the
  rest of the file byte-identical. An AST round-trip rewrites everything, which
  will interact with `prettier-plugin-gherkin`'s formatting — decide deliberately
  which tool owns the file's shape.

## Touches

`scripts/acceptance-mutation/gherkin-examples.ts` and its tests, plus a new
dependency. `scripts/` is gated, so this lands as a `coder` slice against
`crap4ts:scripts`, `dry4ts:scripts` and `test:mutation:scripts`. **`product` can't
do it** — `scripts/` is outside its manifest.

## Open questions

- Whether to do it _before_ a pruning pass to get stable seed keys, or after, so
  the parser is refactored against a settled file shape. The plan's position is
  after; the seed-churn argument is the case for before.
- Whether the empty-cell mutants are a bug worth fixing independently of the AST
  work. Mutating an empty cell to another empty-ish value tests very little.
