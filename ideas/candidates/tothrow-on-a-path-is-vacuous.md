---
name: tothrow-on-a-path-is-vacuous
title: Find assertions that pass on the wrong throw, starting with toThrow given only a path
created: 2026-09-06
---

## Context

`point-rule-check-at-the-rule-article` added an `existsSync` guard to
`scripts/agent-doc-check/run.ts` that throws when the rule documentation file is
missing, and a test asserting `toThrow(ARTICLE_PATH)`. `architect` fault-injected
rather than reading the call site, and **deleting the whole guard left all 85
tests green**: `readFileSync`'s own ENOENT message carries the _absolute_ path, of
which the relative `ARTICLE_PATH` is a substring, so the assertion was satisfied by
the failure it was written to distinguish from.

The test looked like the guard's guard and was not. That matters more than usual
here, because `stryker.scripts.config.json` excludes `**/run.ts` from `mutate` —
so the guard carries no mutants and that one test is its only guard, permanently
and by design.

**The class is general: an assertion that names only a value the _unintended_
error also contains cannot tell the two errors apart.** A path is the sharp case
because every filesystem error quotes one.

## Sketch

No live instance remains — the four path-ish `toThrow` assertions in `scripts/`
were checked and all carry a distinctive message prefix
(`Features directory not found:`, `Rule documentation file not found:`) or a
regex, none of which an ENOENT can satisfy. So this is a **hazard to guard, not a
defect to fix**, and the cheap version is a convention plus a fixture rather than
a checker.

Options, in ascending cost:

1. Write it down in `engineering.md` beside the existing equivalence-demonstration
   rule: an assertion on a throw names something only the _intended_ throw says.
   Zero machinery.
2. An `ast-grep` rule banning `toThrow(<bare identifier>)` where the identifier
   ends in `_PATH`/`Path`/`Dir`. Narrow, and probably too syntactic — the real
   discriminator is whether the string is unique to the intended error, which
   ast-grep cannot see.
3. The general and expensive version: fault-inject every guard whose module is
   excluded from `mutate`. That is a real gap — `**/run.ts` and
   `**/test-support.ts` are excluded from both `scripts/` gates, so _every_ guard
   in an I/O shell has this exposure, and nothing measures it.

Option 3 is the one with teeth and the one that needs scoping before it is worth
starting.

## Touches

`.claude/agents/articles/engineering.md` for option 1. For option 3, an audit of
what lives in the `mutate` exclusions across `stryker.config.json` and
`stryker.scripts.config.json` — the question is how many guards sit there, which
nobody has counted.

## Open questions

- **Is option 3 a slice or a standing habit?** The excluded files are excluded
  because they are I/O shells with no logic worth mutating — which is mostly true
  and was false exactly once, here. A one-off audit ages out; a habit ("when you
  add a guard to an excluded file, fault-inject its test") does not, and costs one
  command. The habit is probably the honest answer, which makes this an
  `engineering.md` edit rather than a program.
- **Does the same vacuity exist in non-throw assertions?** `toContain`,
  `toMatch`, and `stringContaining` have the identical shape — the assertion
  passes because the unintended value happens to contain the expected substring.
  Worth one sweep before deciding this is about `toThrow` at all.
- Does anything already cover this? `cleaner`'s scoped mutation scan would catch
  it in a mutated file; the whole point is that the excluded files are where it
  cannot.
