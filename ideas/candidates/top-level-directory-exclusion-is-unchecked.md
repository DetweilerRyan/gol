---
name: top-level-directory-exclusion-is-unchecked
title: Assert every top-level directory is excluded from vitest or deliberately reachable
created: 2026-09-11
---

## Situation

`vite.config.ts`'s `sharedExclude` subtracts directories from vitest's collection **by name**. It has
to, because the `unit` and `property` projects inherit the unrooted default include
`**/*.{test,spec}.?(c|m)[jt]s?(x)` and nothing above roots it at `src/`. Any directory in the
checkout is reachable unless that array names it.

Measured on vitest 4.1.10 by `vale-styles-is-reachable-by-vitests-default-include`:
`configDefaults.exclude` is exactly `["**/node_modules/**","**/.git/**"]`. **`dist` is not covered by
it**, and `vite.config.ts` had carried a standing claim that it was. A probe placed in `dist/` was
collected.

That slice took the array from eleven entries to thirty-one — six tracked directories and fourteen
generated ones. **Every one of the thirty-one was added because a person noticed an omission.** The
array's own history is the argument: `.stryker-tmp*`, `.features-gen` and `.vale` were each added
after the same gap was found one more time, and each was tool-written rather than authored.

## Complication

**The enumeration is a dated snapshot and nothing re-derives it.** The comment now says so in
capitals. A directory added next month is reachable, and the only thing standing between that and a
stray test file being collected is whether someone remembers this array exists.

**Rooting the include is refuted, and this candidate exists in its place.** The prior idea file
floated inverting the default — give the `unit` project a rooted include so nothing outside `src/` is
collected. `architect` ruled that **worse** on 2026-09-11: a test file placed outside the roots would
then be collected by **no project at all** and fail silently, where today it is collected and fails
loudly. The `unit` project's subtract-don't-include shape exists to prevent exactly that, and its own
comment says so. Do not re-open the inversion without new evidence.

**Note what the gap does and does not open.** The array is _pre-securing_. The invariant-bearing
mechanism for the merge predicate is check C1 in `scripts/mutation-invariance/checks.ts`, which
verifies a `vitest-exclude` allowlist entry against every vitest project's own `exclude`. A directory
missing from `sharedExclude` therefore **cannot** open the mutation gate — it can only block a future
allowlist entry from being securable under that tier. So this fails safe, and the cost is a stray
collected test rather than a skipped gate.

## Question

Can a binary check replace the snapshot, so a new top-level directory is a gate failure rather than
something a reader has to notice?

## Sketch

A checker in the `agent-doc-check` / `ast-grep-rule-check` family: every top-level directory in the
checkout is either named in `sharedExclude` or on a short, explicit **deliberately reachable** list.
That list is three entries today — `src/`, `features/` and `perf/` — and each has a reason:

- `src/` is the point.
- `features/` is secured differently, by `stryker.config.json`'s `ignorePatterns` keeping it out of
  the sandbox entirely, and its `*.e2e.spec.ts` files are subtracted by suffix.
- `perf/` holds pure TypeScript modules whose natural unit test is a colocated `*.test.ts` with no
  other home. Excluding it would create the runs-nowhere direction. **User ruling, 2026-09-11.**

Fail-safe and binary, the same shape as the four gating checkers already in `scripts/`. An
unanticipated directory reds the gate rather than being silently collected.

## Touches

- A new `scripts/<program>/` with its own `run.ts`, modules and `.test.ts` — so it owes CRAP <= 6,
  `test:scripts`, `dry4ts:scripts` and `test:mutation:scripts`
- `package.json` for the script entry
- `CLAUDE.md`'s checker list, which enumerates the gating programs
- `vite.config.ts`'s comment, whose "nothing checks this" sentence becomes false

`scripts/**` is on the mutation-invariance **absent** list, so this re-arms the full mutation run by
construction.

## Open questions

- **Does it read the array, or the resolved config?** Parsing `vite.config.ts` as text is brittle;
  importing the config and reading the resolved `test.exclude` per project is truer and reaches the
  three projects separately. The second is what check C1 already does — read it before choosing.
- **Top-level only, or recursive?** Top-level is what the hazard is about, and recursion would flag
  every `src/` subdirectory. Start narrow.
- **Untracked directories.** Fourteen of the thirty-one entries are gitignored build output that may
  not exist in a fresh checkout. A checker walking the filesystem sees a different set from one
  walking `git ls-files`. Decide which question is being asked before writing the walk.
- **Is a whole `scripts/` program the right weight?** `orchestration.md` says to search for an
  existing tool before building one, and to put the rejections in the plan. Do that first; a bespoke
  checker is permanent maintenance.
