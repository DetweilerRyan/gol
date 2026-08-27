---
name: acceptance-mutation-seed-keys-are-positional
title: Make acceptance-mutation seed keys content-addressed rather than positional
created: 2026-08-27
---

## Context

Two independent findings from `gherkin-ast-mutation`, both about the same string. The seed key is
`${featureFileName}:${rowIndex}:${columnName}`, and `mutateValue` seeds on
`${seedKey}::${originalValue}` — so the key decides which mutant a given cell gets.

**It is positional, so pruning renumbers everything downstream.** Raised by `architect` at REVIEW.
The slice deliberately kept the old key byte-for-byte, because byte-parity across the AST rewrite
was the thing being proven and a key change would have destroyed the evidence. That was the right
call for that slice and leaves this open: delete one row from an Examples table and every mutant
below it in the same table changes shape, for no reason connected to the edit. Anyone comparing
two `acceptance-mutation` runs across a `product` prune is comparing renumbered mutants.

**It is also not unique, and nothing checks it.** Found by `product` at VERIFY. Two `Examples:`
tables in one feature sharing a column name produce identical seed keys.
`examples-cell-sites.ts`'s own comment already names the assumption ("uniqueness rest on the two
tables never sharing a column name -- true today, not re-verified here"); the finding is that
"not re-verified" is permanent, since no assertion exists anywhere.

**Measure the consequence before sizing this — it is milder than it sounds.** `product` did:
mutant filenames are ordinal-based (`probe.mutant-0`, `probe.mutant-1`), so a collision cannot
misattribute a kill or a survivor, and the seed includes the original value, so two colliding keys
only mutate identically when their values are also identical. The residual cost is **correlated
mutation choices, not a wrong number**. The live tree is safe — `cell-life-and-death`'s two tables
use disjoint column names.

So neither half is a defect today. Together they are an argument that the key is carrying more
weight than its shape supports.

## Sketch

Content-address the key: scenario name plus a hash of the row's own cell values, plus the column
name. That makes it stable under pruning (a row keeps its key wherever it moves) and unique by
construction (two rows with identical content in the same scenario are the same row for mutation
purposes).

**The cheap half is separable and worth pricing on its own.** A one-line uniqueness assertion at
plan time closes the collision half with no key change and no figure movement. If the stability
half is judged not worth it, that assertion is still worth landing.

**This moves every mutant, so the 55/55/0 figure will move** — merge-protocol step 8 wants that
explained. The explanation here is unusually easy to make rigorous, because the *count* should not
move at all: same sites, same cells, different mutated values. A moved count would be a bug.

## Touches

`scripts/acceptance-mutation/examples-cell-sites.ts` (the key construction), possibly
`mutation-sites.ts` if uniqueness is asserted at plan time rather than per-finder, their tests,
and the `scripts/` gates (`test:scripts`, `crap4ts:scripts`, `dry4ts:scripts`,
`test:mutation:scripts` — the last has no `--incremental`, so it is always full cost).

Note the site registry landed by `gherkin-ast-mutation` means a **future** kind gets to choose its
own key shape independently — the finder owns the key. So this is a change to one finder, not to a
shared convention, which is a smaller slice than it would have been before that landed.

## Open questions

- Should uniqueness be asserted **per finder** or **globally at plan time**? Global is the stronger
  invariant and the obvious home once a second `SiteKind` exists; per-finder is less code today.
  This is the only real design decision here.
- Is stability actually wanted? A stable key means a pruned table's surviving mutants are directly
  comparable across runs — but nothing currently *does* that comparison. If no consumer wants it,
  land the uniqueness assertion alone and close this.
- Does a row-content hash belong in the printed report at all? `report-format.ts` trims the feature
  prefix for display; a hash would need its own display treatment or the table becomes unreadable.

## Adjacent pickup, if this slice runs

`text-span.ts`'s `spliceSpan` comment claims it leaves "every other byte of `text` -- including
every other line, and the untouched portion of the mutated line itself -- byte-identical". Measured
by `product` against CRLF input, **every** line changes: the function splits on `/\r?\n/` and
rejoins on `'\n'`, normalizing the whole file.

The *behaviour* is pre-existing and deliberately preserved — `main`'s old
`gherkin-examples.ts:applyMutation` did the identical split/join — so this is a comment-accuracy
nit, not a regression, and it is harmless today because Prettier holds `features/` to LF. It earns a
line only because the one-line-diff property is `gherkin-ast-mutation`'s stated design point and
that comment is the sole place the property is written down. Either scope the claim to LF input or
say the normalization is intended.
