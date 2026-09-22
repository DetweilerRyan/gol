---
name: mutation-runs-score-programs-typescript-forbids
title: Make the mutation gate type-aware, and give a role a way to close what the checker still leaves behind
created: 2026-09-22
---

## Situation

`slice/type-impossible-mutants-read-as-survivors` measured Stryker's TypeScript checker against both configs on
2026-09-22 and recommended adopting it on both. `backlog/done/type-impossible-mutants-read-as-survivors/`
carries the runs, the audit and the upstream research. Nothing in the tree changed: neither
`stryker.config.json` nor `stryker.scripts.config.json` declares a `checkers` entry, and
`@stryker-mutator/typescript-checker` is absent from `package.json`.

What that spike measured, and nothing here restates the method:

- 11 of the 61 survivors across both configs are type-impossible — 6 of 23 on `src/`, 5 of 38 on `scripts/`.
  `.claude/agents/articles/mutation-testing.md` requires naming an input at which the two programs differ
  before a survivor may be closed, and for these no such input exists.
- The checker marks them `CompileError` and excludes them: 636 of 1706 mutants on `src/`, 1189 of 3587 on
  `scripts/`.
- 261 verdicts were checked by an independent type-check harness across every pass, with no false one, under a
  negative control that passed 60 of 60.
- Five `src/` files end up with every mutant excluded and report `n/a`. All 9 of their mutants are genuinely
  impossible, so the files are unassessable rather than hidden.
- One mutant in 201 produced its only type error inside a test file rather than in a production module.

## Complication

The spike recorded a recommendation and landed no change, so the waste it measured is still being paid. A role
meeting one of those 11 survivors cannot tell it apart from a genuine coverage gap, and the investigation it
opens has no valid ending.

Adoption alone does not close the class. The spike measured a survivor the repo's own build rejects with TS6133
and the checker's relaxed settings accept, so a type-impossible survivor can outlive the checker, and
`mutation-testing.md` has no shape for closing one either way.

A third thread runs alongside both. A file whose every mutant is excluded reports nothing, and the score and
survivor list — the surfaces the gates and roles consume — cannot distinguish that from a file whose every
mutant was killed. Today that costs nothing, and it is the same fail-open shape `ast-grep-rule-check`'s
"was any rule found at all" and `reference-check`'s `checkNonEmpty` already refuse elsewhere.

## Question

Is this one slice, or several? Three needs are named above — wire the checker in, give a role a way to close a
type-impossible survivor, and make a file that reports nothing visible. They share a cause and not much else:
one is configuration, one is process corpus, one is a checker. The readiness assessment is asked to rule the
split rather than inherit this file's grouping.

## Answer

Shaped, not specified, and the ordering is the only part worth holding.

**The ruling shape does not wait on adoption.** It costs one article edit and no run time, it covers the 11
survivors standing today, and it still covers the TS6133 class after the checker lands. It is the only one of
the three that delivers on its own.

**The dark-file guard is not a precondition.** All 9 of today's dark mutants deserve their `n/a`, so a guard
written now would fire on five files that are correctly silent. It guards against drift.

**The incremental cache needs one line, not an investigation.** An exclusion is produced by the checker at run
time rather than stored on the mutant, so any mutant an incremental run re-evaluates is type-checked again and
the exclusions cannot drift back. The only exposure is the transition: a cache built before adoption holds
`Survived` and `Killed` verdicts that predate the checker, and reusing it would show those mutants unchanged.
The merge protocol already deletes `reports/stryker-incremental.json` at step 5 on any merge that is not
mutation-invariant, and an adoption diff is not. `scripts/` has no exposure at all, since
`npm run test:mutation:scripts` passes no `--incremental`.

## No-gos

Does not revisit whether to adopt. That was measured, reviewed by `architect`, and ruled by the user on
2026-09-22; re-litigating it is not in scope for whatever this becomes.

Does not cover the acceptance-mutation runner, which mutates Gherkin Examples-table values and has no type
system to consult.

Does not propose raising the `break` thresholds. The score moves under adoption — 98.65 to 98.41 on `src/`,
98.94 to 98.62 on `scripts/` — and both stay well clear. Whoever wires the checker should rule deliberately
whether the thresholds still encode what they were set to encode, rather than inherit them by silence.

## Open questions

- Where does the ruling shape live — `mutation-testing.md`'s survivor section, or the sidecar holding its
  evidence? The spike left this open on purpose.
- Does the ruling shape require the argument be made against the repo's own compiler config rather than the
  checker's relaxed one? `architect` recommended it on the TS6133 case, and nothing has ruled it.
- Should a dark-file guard live in `scripts/` as a gating program, subject to CRAP 6 and its own suite, or is
  the report already legible enough to a human that the guard is not worth that machinery?
- Adoption changes what `hardener`'s stage 5 measures. Does its own file need to say so, and does the
  mutation-invariance allowlist's `src/`-scoped reading move?
- Does a `CompileError` whose only error is inside a test file need its own entry in whatever ruling shape
  gets written, or is one instance in 201 too rare to name?
