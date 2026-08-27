---
name: scripts-mutation-survivors-untriaged
title: Triage the 50 scripts/ mutation survivors nobody has looked at
created: 2026-08-27
---

## Context

Raised by `hardener` at the end of `gherkin-ast-mutation`, explicitly as an observation outside
that slice's manifest rather than something it should have fixed.

`npm run test:mutation:scripts` reports **97.38% — 1845 killed / 17 timeout / 50 survived**. Two of
those 50 were closed inside that slice; the other **48 are pre-existing and concentrated**:

- **26 in `mutation-rules.ts`**
- **12 in `analyze.ts`**
- **5 in `playwright-runner.ts`**
- the remainder scattered

The reason this is worth a slice rather than a shrug is _why_ nobody has looked: **`test:scripts`
had been red on `main` for several consecutive slices** because no role's gate ran it, and
`test:mutation:scripts` was separately unrunnable — it aborted at Stryker's dry run. Both were
fixed only recently, and `.claude/agents/hardener.md` was amended in `gherkin-ast-mutation` to run
`test:scripts` every pass. So this is plausibly **the first full-scope look anyone has had** at
these survivors, and their age is an artifact of the gate being broken rather than of anyone having
judged them acceptable.

The score is above threshold, so this is not a gate failure. It is unexamined territory that only
just became examinable.

## Sketch

Read `reports/mutation/scripts.html` and sort the 48 into the usual three buckets: genuinely
equivalent (record the argument so nobody re-derives it), worth a test, and worth a _design_
change because the mutant reveals a branch that should not exist.

**Expect the buckets to be uneven by file, and let that steer the slice.** 26 in one module is a
shape signal, not 26 independent gaps — `mutation-rules.ts` is the module the
`comma-list-mutants-are-all-syntax-breaking` candidate also targets, and a survivor cluster there
may well be the same finding seen from the other side.

**Sequencing matters against that candidate.** If `comma-list` lands first it will change
`mutation-rules.ts`'s mutant population outright, so triaging those 26 beforehand risks doing the
work twice. The cheap ordering is: triage `analyze.ts` and `playwright-runner.ts` now, and fold
`mutation-rules.ts`'s cluster into the `comma-list` slice, which is already going to be reading
that file closely.

**A caution from this slice, and it is the reason to measure rather than argue.** `cleaner` argued
three survivors equivalent; `hardener` overturned one by measurement. The mutant removed a loop's
only termination condition for a malformed table row — every fixture line ended in a pipe, so the
length bound was never exercised. Closing it flipped Survived → **Timeout**, which in that case is
a _deterministic_ infinite loop and a real kill, not the flaky wall-clock artifact CLAUDE.md
cautions about. An equivalence argument that sounds good is not evidence; running the mutant is.

## Touches

`scripts/acceptance-mutation/mutation-rules.ts`, `scripts/perf-report/analyze.ts`,
`scripts/acceptance-mutation/playwright-runner.ts` and their tests. `scripts/` is held to CRAP ≤ 6
like `src/`, so any extracted helper is scored.

Report at `reports/mutation/scripts.html` (gitignored — regenerate with
`npm run test:mutation:scripts`, always full cost since that config passes no `--incremental`).

## Open questions

- Is 97.38% with 50 argued survivors the right resting state for `scripts/`, or should the config
  carry a `break` threshold the way the `src/` one does (85)? Setting one is the decision that
  turns this from a one-off triage into a standing gate — and it should be set _after_ the triage,
  from what the tree actually supports, not guessed beforehand.
- Do any of the 17 **timeouts** deserve the same scrutiny? CLAUDE.md warns a `Timeout` kill can be
  a wall-clock artifact rather than real coverage, and this slice produced one that was genuinely a
  deterministic hang. Both kinds are in that 17 and nothing currently distinguishes them.
