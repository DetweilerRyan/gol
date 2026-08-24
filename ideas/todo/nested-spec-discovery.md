---
name: nested-spec-discovery
title: Make spec discovery recursive and single-sourced, so the layout slice isn't shaped by a tool limit
created: 2026-08-24
---

## Context

`intent-driven-layout` wants to move specs into one directory per capability.
Nothing about that is hard except that **the discovery code cannot see a
subdirectory**, which was forcing the restructure to be split across two slices.
A tool limitation shaping the slicing is backwards — fix the tool, and the
layout change becomes one coherent slice.

The limitation is concrete and in two places:

- `scripts/feature-files.ts` — `listFeatureFiles` does `readdirSync(featuresDir)`
  and filters `.endsWith('.feature')`. Non-recursive; with nested specs it finds
  nothing and throws.
- `scripts/acceptance-mutation/discovery.ts` — `discoverTargets` reads the same
  flat listing for `allFileNames`, and `pairTargets` matches a `.feature` to its
  steps file by **bare basename** within it.

Separately, the same path is hardcoded twice — `acceptance-mutation/run.ts:46`
and `gherkin-dry-checker/run.ts:18` both resolve `'../../features'`
independently. That is exactly the failure mode `feature-files.ts`'s own header
comment describes for the file _lists_ it replaced: "both programs used to carry
an independent copy of exactly that list."

**`globSync` from `node:fs` is already used here** — `scripts/ast-grep-rule-check/run.ts`
and `scripts/agent-doc-check/run.ts` both import it. This is an established
in-repo pattern, not a new dependency, and no npm package is needed.

## Sketch

Behavior-preserving throughout: the suite stays green and **no file moves**.

**1. Recursive discovery, no configuration knob.** Glob `**/*.feature`
unconditionally rather than making depth a setting with exactly one correct
value.

Measured against the real tree with a throwaway probe, and worth recording as a
comment — this repo already documents glob semantics as measured facts, because
two same-looking globs genuinely differ in it:

| Probe                                                       | Result                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/*.ts` → 37 vs `src/**/*.ts` → 73                       | `*` does **not** cross `/` in `fs.globSync`, matching vitest/picomatch and unlike ast-grep's `*` |
| `features/*.feature` → 7 vs `features/**/*.feature` → **7** | `**` also matches flat files                                                                     |

The second row is the whole safety argument: switching to `**` while specs are
still flat finds the identical set, so this lands with no observable change and
the layout slice afterwards is a pure move.

- `scripts/feature-files.ts` — `listFeatureFiles` globs. **Keep the
  throw-on-empty guard**; its comment explains the silent-empty hazard it exists
  to defend against, and that hazard is unchanged.
- `scripts/acceptance-mutation/discovery.ts` — `discoverTargets` globs for
  `allFileNames`; `pairTargets` matches by **path**, not bare basename.

**2. One shared path module.** New `scripts/spec-paths.ts` exports the spec
directory; both `run.ts` files import it instead of resolving their own.

State plainly what this does **not** unify: `vite.config.ts`,
`playwright.config.ts` and `tsconfig.app.json` are separate tsconfig projects,
and `package.json` and `rules/*.yml` cannot import TypeScript at all. A single
source of truth across all of them is not achievable — this fixes only the
duplication that is.

## Touches

`scripts/feature-files.ts`, `scripts/acceptance-mutation/discovery.ts`, new
`scripts/spec-paths.ts`, and the two `run.ts` import sites. Existing tests
(`scripts/feature-files.test.ts`, `scripts/acceptance-mutation/discovery.test.ts`)
extend rather than get replaced.

Nothing outside `scripts/`. No `.feature` file moves, no config files, no docs.

**Put the logic in `feature-files.ts` / `discovery.ts` / `spec-paths.ts`, not in
a `run.ts`** — `run.ts` is excluded from both `crap4ts.scripts.config.ts` and
`stryker.scripts.config.json`, so logic placed there silently dodges the gates
that would otherwise cover it.

Gates: `npm run test:scripts`, `npm run crap4ts:scripts` (≤ 6),
`npm run dry4ts:scripts`, `npm run test:mutation:scripts`. Also
`npm run acceptance-mutation` — its `assertBaselineGreen` throws on zero tests,
making it the specific detector for discovery that has stopped finding anything.

## Open questions

- **Does `pairTargets` want paths or directories?** Matching by full path is the
  minimal change. But once specs are nested one-per-capability, pairing _within
  a directory_ may be simpler and harder to get wrong. Deciding now shapes what
  the layout slice inherits.
- **Should `selectFeatureFiles` keep taking a pre-read listing?** Its split from
  `listFeatureFiles` exists so sorting is testable without a filesystem. `globSync`
  returns sorted-ish results but that is not specified, so the pure sort probably
  still earns its place — worth confirming rather than assuming.
- **Does `spec-paths.ts` belong in `scripts/` or at the repo root?** Root would
  match `dev-port.ts`, which four config files import. But `tsconfig.scripts.json`
  has `"include": ["scripts"]`, so a root module imported from `scripts/` sits
  outside its project boundary and would need a tsconfig change to stay honest.
