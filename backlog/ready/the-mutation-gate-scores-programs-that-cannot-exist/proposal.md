---
name: the-mutation-gate-scores-programs-that-cannot-exist
title: Make the mutation gate type-aware, and surface a file whose every mutant is excluded
created: 2026-09-22
kind: enabler-technical
---

## Situation

`slice/type-impossible-mutants-read-as-survivors` measured Stryker's TypeScript checker against both configs on
2026-09-22 and recommended adopting it on both. `backlog/done/type-impossible-mutants-read-as-survivors/`
carries the runs, the audit and the upstream research.

Nothing in the tree changed. Neither `stryker.config.json` nor `stryker.scripts.config.json` declares a
`checkers` entry, and `@stryker-mutator/typescript-checker` is absent from `package.json`.

What that spike measured, dated 2026-09-22 and not restated here:

- 11 of the 61 survivors across both configs are type-impossible — 6 of 23 on `src/`, 5 of 38 on `scripts/`.
- The checker marks them `CompileError` and excludes them, along with 636 of 1706 `src/` mutants and 1189 of
  3587 on `scripts/`.
- 261 verdicts were checked by an independent type-check harness with no false one, under a negative control
  that passed 60 of 60.
- Five `src/` files end up with every mutant excluded and report `n/a`. All 9 of their mutants are genuinely
  impossible, so those files are unassessable rather than concealed.

## Complication

`.claude/agents/articles/mutation-testing.md` requires naming an input at which the two programs differ before
a survivor may be closed. For those 11 no such input exists, so the investigation a role opens on one cannot
conclude — and a role cannot tell which survivors those are without spending the time. About one survivor
investigation in five is unwinnable, and the cost recurs on every run until the gate stops generating them.

A second, weaker need sits beside it. A file whose every mutant is excluded reports nothing, and the score and
the survivor list cannot tell that apart from a file whose every mutant was killed. Today that costs nothing,
since all 9 such mutants deserve their exclusion. It is the same fail-open shape `ast-grep-rule-check`'s
"was any rule found at all" and `reference-check`'s `checkNonEmpty` refuse elsewhere.

## Question

Does the second need belong in this slice at all? The parent epic's assessment ruled it the weakest of three
threads and flagged that it might rule Spike or Not worth doing on its own. Folding it in risks it riding along
unjudged; splitting it risks never writing it. This file states it as a separable sub-thread so the assessment
can rule it rather than inherit it.

**Ruled 2026-09-22: it travels with this slice.** The assessment ruled the other way, on three findings — the
guard's own Valuable is anchor 2 against this slice's 5, its Estimable bounds to a slice or nothing, and its
finished state is an unwritten open question. The user ruled that all of the enablers run within one slice, so
the guard rides as scoped. `assessment.md` carries both halves, and the open questions below are what the
design pass has to settle before it can be built.

## Answer

Shaped, not specified. Make the mutation runs aware of the type system, so the score is computed over the
programs TypeScript permits and the unwinnable survivors stop being generated.

The guard for a file that reports no mutants is the separable half. Written today it would fire on five files
that correctly report `n/a`, so it guards against drift rather than against anything currently wrong.

## No-gos

Does not revisit whether to adopt. That was measured, reviewed by `architect`, and ruled by the user on
2026-09-22.

Does not cover a way for a role to close a type-impossible survivor that the checker leaves behind. That is
`.claude/agents/articles/mutation-testing.md`'s text, which only `writer` may edit under a signed `coach` spec,
so it is the sibling process enabler's work. Both land on one branch and merge together; the split is about
which pipeline runs, not about when either ships.

Does not propose raising the `break` thresholds.

## Open questions

- Do the `break` thresholds still encode what they were set to encode? The score moves under adoption — 98.65
  to 98.41 on `src/`, 98.94 to 98.62 on `scripts/`, against 85 and 95 — and inheriting them by silence is the
  failure to avoid either way.
- Should the guard live in `scripts/` as a gating program, subject to CRAP 6 and its own suite, or is the
  report legible enough to a human that the machinery costs more than it returns?
- What does the guard assert, given every dark file today is correctly dark? An allowlist of known-unassessable
  files has the same staleness problem every allowlist in this repo has.
- Does `hardener`'s own file need to say what stage 5 now measures, and does the mutation-invariance
  allowlist's `src/`-scoped reading move?
- Does `npm run test:mutation:scripts` want `--incremental` once a type-check phase is added, and if so does
  the merge protocol's `rm -f` block need the second cache file it already anticipates?
