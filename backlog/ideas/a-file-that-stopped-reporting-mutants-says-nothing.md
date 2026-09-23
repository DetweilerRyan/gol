---
name: a-file-that-stopped-reporting-mutants-says-nothing
title: Make a file that contributes no mutants to the score fail loudly rather than silently
created: 2026-09-23
---

## Situation

Stryker's score is `detected / valid`, where `valid` counts mutants whose status is `Killed`, `Survived`,
`Timeout` or `NoCoverage`. A mutant in any other state leaves both halves. A file whose every mutant is in one
of those other states therefore contributes nothing, and the report shows `n/a` against it.

Two ways a file reaches that state, and only one is new:

- **Every mutant `Ignored`.** A file-wide `// Stryker disable` does this.
  `.claude/agents/articles/mutation-testing.md` already documents it as leaving the denominator without the
  score dropping. Nothing detects it.
- **Every mutant `CompileError`.** This arrives with the TypeScript checker, which
  `the-mutation-gate-scores-programs-that-cannot-exist` adopts. That slice measured five such `src/` files on
  2026-09-22 — `useLiveCells.ts`, `useContentBounds.ts`, and the three `src/equality/is-*-equal.ts` — carrying
  nine mutants between them, all genuinely impossible. `scripts/` had none.

The score and the survivor list are the two surfaces the gates and roles consume, and neither can tell an
unassessed file from a fully killed one. The HTML report renders `n/a`, and nothing obliges a role to look.

## Complication

A file can stop contributing to the mutation score and nobody finds out. That is the fail-open shape this
repo's checkers refuse elsewhere — `ast-grep-rule-check` asks whether any rule was found at all,
`reference-check` and `vale-fixture-check` share a `checkNonEmpty` guard, and `vale-fixture-check` probes for a
missing binary because zero findings and no run produce the same text.

Nothing currently wrong depends on this. The five measured files are unmutable rather than untested: each
carries unit tests, two carry property tests, and `is-strict-equal.ts` is twelve lines whose body is
`return Object.is(a, b)`, whose one mutant empties a body declaring `boolean`. Each rejoins the score on its
own the moment it grows a branch.

So the need is about a future silent loss, not a present one — and that is exactly why it was ruled out of the
adoption slice on 2026-09-23 rather than folded in.

## Question

Is a mechanical guard worth its own machinery here, given no incident has occurred and the `// Stryker disable`
half of the hazard has been live and unexercised for as long as the article has documented it?

## Answer

Shaped, not specified, and mostly already worked out. `architect`'s design pass on
`the-mutation-gate-scores-programs-that-cannot-exist` specified this in full before the scope ruling, and
preserved it as an out-of-scope appendix in that slice's `design.md`. **Read the appendix rather than
re-deriving it.** It carries the predicate, the exact-set-equality argument that answers the allowlist-staleness
objection, the config shape, the program shape against the gating-checker family, and the wiring with its
leading `rm -f`.

The one thing the appendix does not settle is the question above, because the scope ruling reached it first.
Two shapes worth weighing against each other: the two-sided equality it specifies, which makes a stale
declaration as loud as an undeclared dark file but reddens the gate when a file legitimately stops being dark;
and a one-sided check that fails only on an undeclared dark file, which removes that friction and lets a stale
entry go quiet.

## No-gos

Does not adopt the TypeScript checker. That is `the-mutation-gate-scores-programs-that-cannot-exist`, and this
candidate assumes it has landed — the `CompileError` half of the hazard does not exist otherwise.

Does not edit `.claude/**`. The appendix's out-of-reach list belongs to the sibling process enabler.

## Open questions

- Two-sided equality or one-sided detection? The friction the two-sided form creates on a good change is what
  cost this thread its place in the adoption slice.
- Does the `// Stryker disable` half justify the guard on its own, independent of the checker? If it does, this
  candidate does not depend on adoption at all, and its Situation is wrong to imply it does.
- Does a gating `scripts/` program — CRAP 6, its own suite, `dry4ts`, mutation testing on itself — earn its
  place against five files and nine mutants, or is a report-only program the right first step?
- The design's wiring chains the guard onto the three mutation npm scripts so `hardener` picks it up with no
  role-file change. Does that placement still hold if the guard is report-only?
- Adoption leaves `reports/mutation/*.json` written by every run and read by nothing, so a stale file reads
  like a fresh one. The design's leading `rm -f` was this guard's countermeasure. Does that make the staleness
  this candidate's to fix, or the adoption slice's debt?
