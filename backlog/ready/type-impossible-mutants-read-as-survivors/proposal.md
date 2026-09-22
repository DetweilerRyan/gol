---
name: type-impossible-mutants-read-as-survivors
title: Decide whether Stryker should run its TypeScript checker so type-impossible mutants stop reading as survivors
created: 2026-09-22
kind: spike
---

## Situation

Stryker runs against a TypeScript tree. `stryker.config.json` mutates `src/**/*.ts` and `src/**/*.tsx`;
`stryker.scripts.config.json` mutates `scripts/**/*.ts`. Both use the vitest runner, which transpiles rather
than type-checks, so a mutant that `tsc -b` would reject still runs and its fate is decided by the suite alone.

Neither config declares a `checkers` entry, and `@stryker-mutator/typescript-checker` is absent from
`package.json` (verified 2026-09-22, against `@stryker-mutator/core` ^10.0.0).

What the upstream documentation says about that plugin, read 2026-09-22:

- It type-checks each mutant and marks the ones that fail `CompileError`. The check is in-memory, with no
  side effects on disk.
- `CompileError` is an **invalid** state. Stryker's published metric definitions give
  `valid = detected + undetected` and `mutation score = detected / valid * 100`, so an invalid mutant leaves
  both the numerator and the denominator.
- The default strategy is `prioritizePerformanceOverAccuracy: true`, which type-checks mutants in groups
  derived from a file-dependency graph rather than one at a time. Stryker measured that strategy on its own
  core package at 43% faster and 99.1% accurate. Setting the option to `false` is fully accurate and gives the
  grouping speedup back.
- Its historical cost was "up to a 10x performance degradation"; the 6.4 release claims up to 50% better than
  that baseline.
- `tsconfigFile` defaults to `tsconfig.json`. Project references are supported, and `--build` mode is enabled
  automatically when references are found.
- It overrides three compiler options to avoid false positives: `allowUnreachableCode: true`,
  `noUnusedLocals: false`, `noUnusedParameters: false`.
- `@stryker-mutator/*` plugins load automatically unless a `plugins` section is present. Neither config here
  has one.

This tree's shape meets that plugin's defaults: `tsconfig.json` is a solution file (`files: []` plus
references to `tsconfig.app.json`, `tsconfig.node.json` and `tsconfig.scripts.json`), so the default
`tsconfigFile` resolves and `--build` mode would engage for both Stryker configs without a path override.

`cleaner` runs a scoped mutation scan over its handoff manifest, and `hardener` runs the mutation stage for the
whole slice. Both act on the survivor list. `.claude/agents/articles/mutation-testing.md` gives `architect` the
ruling on whether a survivor is equivalent, and requires a named input or state at which the two programs would
differ before granting it. Neither that article nor its sidecar mentions type-impossible mutants or the
`CompileError` state.

## Complication

A mutant the type system forbids has no such distinguishing input, because no caller can reach the mutated
state. It is not a missing test, and it is not the equivalent-mutant case the article describes — the argument
that closes it is a type error, not a semantic identity. Today such a mutant is indistinguishable in the report
from a genuine coverage gap, and the article offers no shape for closing it.

The score is affected in a second, quieter way. A type-impossible mutant runs today, survives, and so counts in
`undetected` and therefore in `valid`. It depresses the mutation score while being unkillable by any test. The
`break` thresholds in force (85 for `src/`, 95 for `scripts/`) were set against a denominator that includes
however many of these exist.

Two facts bound the size of the effect, and both cut against a large win:

- The checker's own overrides relax `noUnusedLocals` and `noUnusedParameters`, which all three leaf tsconfigs
  in this tree set to `true`. A mutant that merely strands a local or a parameter is rejected by the
  build and accepted by the checker, so it keeps surviving.
- The default strategy is explicitly lossy. At the accuracy Stryker measured on its own package, roughly one
  invalid mutant in a hundred still reports a non-error state.

How many mutants in this tree are type-impossible is unmeasured. No run has been classified, and nothing above
establishes that the share is large enough to pay for.

## Question

Is the triage cost of type-impossible mutants here large enough to justify the checker's run-time cost, given
that the check is paid on every mutant on every run while the triage cost is paid only on survivors?

## Answer

Measure before choosing. Classify one full-scope survivor list by whether each mutant compiles under `tsc -b`,
then time the same run with the checker wired in. The outcome selects among: enable it, leave the run alone and
give the article a type-impossible ruling shape alongside the equivalent one, or both.

The answer, its method and its date land in this folder's `findings.md`. This spike has no parent idea, so it
closes against its own question rather than by re-assessing another candidate.

## No-gos

Does not cover the acceptance-mutation runner in `scripts/acceptance-mutation/`, which mutates Gherkin
Examples-table values rather than TypeScript, and so has no type system to consult.

Does not cover the incremental cache's contents, the sandbox exclusions, or the mutation-invariance allowlist,
beyond the open question below.

## Open questions

- What does the checker cost on this tree? The mutation stage is already the slowest gate in the sequence, and
  an unacceptable run time decides this with no triage-cost figure needed. The upstream numbers are ratios
  against other projects, not a measurement here.
- Does `--build` mode over the solution file survive the Stryker sandbox? `tsconfig.app.json` includes
  `features`, and `stryker.config.json`'s `ignorePatterns` keeps that directory out of the sandbox entirely.
  Whether the project still resolves there is unverified.
- Do the checker's three compiler-option overrides leave enough of the effect to matter, given this tree sets
  `noUnusedLocals` and `noUnusedParameters` on all three projects?
- Which thresholds move, and to what? Removing unkillable mutants from `valid` raises the score for an
  unchanged suite, so `break` at 85 and 95 would both be re-read against the new denominator rather than kept.
- Does the incremental cache hold a `CompileError` verdict across runs, or is the type-check repaid every run
  regardless of what changed?
- Both configs or one? `src/` and `scripts/` are separate projects with separate suites, and the survivor
  volume may differ enough that only one earns the cost.
- Is `prioritizePerformanceOverAccuracy: false` the right setting for a gate? The lossy default leaves a
  residue of exactly the mutants this idea exists to remove.
- If the answer is documentation rather than configuration, which file carries the ruling shape — the
  article's survivor section, or the sidecar holding the evidence behind it?
- Is this a spike that closes into a decision, or an enabler-technical slice that lands the checker?
