---
name: scoped-acceptance-mutation-nan
title: Decide what a zero-mutant scoped acceptance-mutation run should report instead of NaN%
created: 2026-08-24
---

## Context

`scripts/acceptance-mutation/run.ts:137` computes the aggregate as
`killed / results.length`. With zero mutants that is `0/0`, so
`npm run acceptance-mutation -- --feature <table-less-feature>` prints
`mutation score: NaN%` and exits 0.

Found by `product` during `prune-gherkin-to-domain-language` and filed by
`architect` at REVIEW — neither had license to fix it (`scripts/` is outside
`product`'s manifest, and REVIEW carries no `scripts/` license; the
corrective-fix exception is ADJUDICATE-only, and a NaN aggregate is not a defect
against an accepted contract).

**The prune is what makes this worth filing.** Before it, one feature of seven
was table-less and the case was nearly unreachable. After it, **four of seven
are** — `mouse-wheel-controls`, `infinite-grid`, `camera-pan-and-zoom` and
`grid-scrollbars` all deliberately carry zero mutants, because a table-less
scenario costing zero mutants is the whole lever that slice pulled. So the NaN
path went from a curiosity to the ordinary result of a routine command.

Nothing is misreported: the green-baseline check still runs and still aborts
loudly by name if the steps file isn't green, so a broken suite cannot slip
through. Only the aggregate line is meaningless. Full runs never reach it — the
55-mutant total is nonzero.

## Sketch

The code change is one line. **The decision is what isn't**, and it is the
reason this is a candidate rather than a drive-by fix: what _should_ a
zero-mutant scoped run say?

- **Say so explicitly** — e.g. `no mutants: <feature> has no Examples table` —
  which is honest and tells the reader the run did what it should. Risk: reads
  as a warning for what is now a designed state.
- **Suppress the aggregate line entirely** and print only the per-mutant table
  (empty). Quietest, but a command that prints almost nothing invites the reader
  to wonder whether it ran.
- **Exit nonzero.** Wrong, and worth writing down as rejected: a table-less
  feature is the _target state_ of `prune-gherkin-to-domain-language`, not a
  failure.

Whichever is chosen, the same reasoning applies to the `--feature` path only;
the full-run aggregate is unaffected and should not be special-cased.

## Touches

`scripts/acceptance-mutation/run.ts` (~line 137) and its test. A `coder` slice —
`scripts/` is gated, so it lands against `crap4ts:scripts`, `dry4ts:scripts` and
`test:mutation:scripts`. Note `run.ts` is excluded from both `scripts/` gates as
a shell, so the fix itself is cheap to land.

## Open questions

- Which of the three above, and is the phrasing worth a moment given `product`
  reads this output routinely during a spike?
- Should `--feature` on a table-less feature be _distinguishable_ from
  `--feature` on a feature whose table exists but scored zero kills? Those are
  very different situations and both currently produce an unhelpful line.
- Is there a second consumer of the aggregate — a script, a doc, a role
  checklist — that parses the `mutation score:` line and would break on a
  changed format? Check before changing the string.
