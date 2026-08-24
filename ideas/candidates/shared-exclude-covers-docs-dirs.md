---
name: shared-exclude-covers-docs-dirs
title: Add ideas/** and .claude/** to sharedExclude, so the mutation-invariant allowlist is structurally safe
created: 2026-08-24
---

## Context

`slice/acceptance-contract-rulings` added a "mutation-invariant merges" clause: a
diff touching only paths Stryker cannot see may skip merge-protocol stage 4,
because `stryker.config.json`'s `ignorePatterns: ["/features"]` keeps that layer
out of the sandbox and `mutate` covers only `src/**`.

**`hardener` reviewed that clause as its intended audience and falsified part of
it by measurement.** It added two throwaway test files and re-listed:

```
[unit] .claude/__probe.test.ts > probe
[unit] ideas/__probe.test.ts   > probe reaches src
```

**Both collected.** `architect` then reproduced it independently and confirmed the
cause at source: `vite.config.ts`'s `unit` project overrides `exclude` but **not**
`include`, so it inherits the unrooted `**/*.{test,spec}.?(c|m)[jt]s?(x)`, and
`sharedExclude` covers `scripts/**` and `.claude/worktrees/**` but neither of
these two directories. The `ideas/` probe imported `src/gameOfLife` — it would
have run inside Stryker's sandbox and changed mutant fates **while the path
predicate still answered "invariant."**

So the allowlist stratifies, and the clause originally presented it as uniform:

| entry                    | safety                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| `features/**`            | **structural** — `ignorePatterns`, regardless of what is put there  |
| `CLAUDE.md`, `README.md` | **structural** — a fixed filename cannot match a test glob          |
| `ideas/**`, `.claude/**` | **contingent** — rests only on nobody having yet added a `.test.ts` |

The clause now guards this with a second conjunct: the diff must also add no file
matching a test glob. **That is a guard, not a cure** — architect said so in the
ruling. This slice is the cure.

## Sketch

Add `'ideas/**'` and `'.claude/**'` to `sharedExclude` in `vite.config.ts`.

Both become structurally safe, and **condition (ii) of the invariant predicate
retires entirely** — the clause collapses back to a plain path check, which is
what it should have been.

Note `.claude/worktrees/**` is already excluded, so this generalises an entry
that exists rather than inventing one. The reason that narrower entry exists is
instructive and belongs in the comment: a worktree is a whole other checkout,
with its own `node_modules` and its own tests, and collecting it was a real
measured incident (`npm test` collected 3,299 tests instead of 861).

## Touches

`vite.config.ts` — one array, plus a comment saying _why_ (the unrooted-include
inheritance, and that these two entries are what let the invariant-merge
predicate be a plain path check). A `coder` slice; `vite.config.ts` is
Stryker-visible, so it pays a full mutation run at merge, correctly.

Verify the way the hole was found: add a throwaway `ideas/__probe.test.ts`,
confirm `npx vitest list` no longer collects it, delete it. Then confirm
`npm test` still reports the same file and test counts.

## Open questions

- **Does excluding `.claude/**` wholesale hide anything wanted?** Nothing there is
  a test today, and `scripts/` — which _is_ tested — has its own config. But
  `.claude/` is where agent definitions live, and if a future checker ever wanted
  a colocated test, this would silently exclude it. Probably right anyway; worth
  one sentence in the comment rather than discovering it later.
- Whether the same reasoning reaches any other top-level directory. `perf/` and
  `rules/` are already handled by suffix or by not matching; `reports/`,
  `patches/` and `dist*/` are gitignored or non-TS. Worth one `npx vitest list`
  sweep to confirm the set is closed rather than assuming it.
