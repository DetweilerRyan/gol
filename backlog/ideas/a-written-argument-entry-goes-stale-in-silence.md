---
name: a-written-argument-entry-goes-stale-in-silence
title: Detect a mutation-invariance written-argument entry whose argument has become false
created: 2026-09-10
---

## Context

`mutation-invariance.config.json` secures an allowlist entry one of three ways. Two are checked
against the tree on every run: `vitest-exclude` is verified against every vitest project's own
`exclude`, and `stryker-ignore-patterns` against a last-wins walk of those patterns. The third,
`written-argument`, is verified against nothing but the tracked-file set. The config's own prose is
honest about this: it "verifies only that a fixed filename can never become a test", and anything
further is "an inventory on a date".

`lint-jsdoc-with-vale` turned that from a stated limit into a live instance.

The `.vale.ini` entry, `verifiedOn: 2026-09-08`, argues:

> Not mutated (mutate is src/\*\*); no script or config in vite.config.ts, the vitest.\*.config.ts
> files, or either Stryker config references Vale, and there is no npm run script that invokes it --
> the prose linter is run by hand.

That last clause is now false. The slice added `npm run prose-lint`, which runs
`scripts/prose-lint/run.sh`, which invokes Vale against that exact config. **`npm run
mutation-invariance` exits 0 over it.** Measured on the slice branch, 2026-09-10.

The conclusion is probably still sound — Stryker runs vitest, and no vitest project invokes an npm
script — so this is most likely a false statement attached to a true verdict rather than a wrong
verdict. That is the reason to treat it as urgent rather than the reason to shrug: a reader
re-verifying the entry finds a clause that is plainly false and has no way to tell which other
clause is load-bearing, or whether the entry was ever right.

The failure direction is the one the allowlist exists to prevent. An entry decays into a false
argument, the gate keeps exiting 0, and a skipped stage reads exactly like a passing one.

## Sketch

Thin deliberately — the shape is the open question, not the code.

The cheap end is a freshness signal: `verifiedOn` is already in the schema and already parsed, so a
check could report an entry whose date predates the last commit touching its own `path`. That is
mechanical, needs no natural-language reading, and would have fired here — `.vale.ini` was edited by
this slice, well after 2026-09-08.

It is also the weaker end. It catches decay caused by editing the allowlisted file, and misses decay
caused by editing something else, which is exactly what happened here. `.vale.ini` did change, so the
signal fires, but by luck: the clause was falsified by `package.json` and a new file under
`scripts/`.

A stronger form would bind each argument to the specific facts it asserts, the way check C4 already
binds an entry to prose in `mutation-testing.meta.md`. An argument that names "no npm run
script invokes it" could carry that as a structured, checkable predicate rather than as a sentence.
That is a bigger design and may not be worth it for three entries.

## Touches

- `mutation-invariance.config.json`, and `schemas/` if `verifiedOn` gains a meaning
- `scripts/mutation-invariance/` — a new pure checker plus its fixtures, held to CRAP <= 6
- `.claude/agents/articles/mutation-testing.meta.md`, which carries each entry's argument
- CLAUDE.md's `scripts/mutation-invariance/` entry, which enumerates the checks

Both config and schema are on the `absent` list, so this slice re-arms the full mutation run in its
own diff by construction.

## Open questions

- **Is a stale `written-argument` a gate failure or a report?** Exit 1 means "no verdict computed",
  which the protocol says to read as "run stage 5". That is the safe direction and it is also
  disruptive. A fourth exit code, or a warning that still computes a verdict, may fit better.
- **Does `verifiedOn` mean anything today?** It is carried and validated for shape. Nothing reads it
  as a date against anything. Decide whether it becomes load-bearing or is honestly documented as
  decorative.
- **Is the `.vale.ini` entry still correct on its merits?** Someone has to re-verify rather than
  assume. Note the same slice also gives Vale a runner, so the "run by hand" premise is gone from the
  repo generally, not just from this clause.
- **Does the same decay affect `CLAUDE.md`, `README.md` and `.oxlintrc.json`?** All three are
  `written-argument`, and all three arguments were verified by a grep on a date. This slice did not
  check them.
