---
name: spec-capability-dirs
title: Restructure specs into one directory per capability, on real globbing
created: 2026-08-24
---

## Context

Blocked on `intent-driven-layout` landing — its first step globs against paths
that slice creates. Filed as a candidate rather than a todo for that reason.

`intent-driven` organizes specs as one directory per capability. The layout slice
deliberately keeps them flat, because nesting is not a rename: **the discovery
code cannot see nested files.** `scripts/feature-files.ts` does
`readdirSync(featuresDir)` and filters `.endsWith('.feature')` — non-recursive,
so with capability directories it finds zero files and throws. Same for
`scripts/acceptance-mutation/discovery.ts`, whose `pairTargets` matches a
`.feature` to its steps file by bare basename within one flat listing.

So this is a behavior change to `scripts/`, which pulls in the four
`scripts/`-scoped gates the layout slice avoids entirely.

## Sketch

Two behavior-preserving steps, each leaving the suite green.

**1. Replace the hand-rolled directory reads with real globbing — no files move.**

Use **`globSync` from `node:fs`**, not a new dependency. Node 24 is in use and
`globSync` is stable there; `discovery.ts` already sets the precedent by
preferring `node:util`'s `parseArgs` over a hand-rolled parser rather than
adding a CLI library. `tinyglobby`, `glob` and `picomatch` are all present in
`node_modules` but only transitively, so importing them would be depending on
someone else's dependency.

Measured against the real tree with a throwaway probe, and worth recording as a
comment — this repo documents glob semantics as measured facts because two
same-looking globs already mean different things in it:

| Probe                                                       | Result                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/*.ts` → 37 vs `src/**/*.ts` → 73                       | `*` does **not** cross `/`, matching vitest/picomatch and unlike ast-grep's `*` |
| `features/*.feature` → 7 vs `features/**/*.feature` → **7** | `**` also matches flat files                                                    |

The second row is what makes this step safe: switching to `**` while specs are
still flat finds the identical set, so nothing changes behaviorally and step 2
becomes a pure move.

- `scripts/feature-files.ts` — `listFeatureFiles` globs `**/*.feature`. Keep the
  throw-on-empty guard; its comment explains that silent-empty is the hazard.
- `scripts/acceptance-mutation/discovery.ts` — `pairTargets` matches by **path**
  rather than bare basename.
- Both already have tests (`feature-files.test.ts`, `discovery.test.ts`).

**2. Move the files, and move the globs in lockstep.**

`git mv` each capability's `.feature`, `.steps.test.ts(x)` and `.e2e.spec.ts`
into `openspec/specs/<capability>/`; `acceptance-harness.tsx` and
`e2e-helpers.ts` into `_shared/`.

The hazard is documented in `vite.config.ts` and must be respected: the
acceptance glob does not cross `/`, but _"the same-looking glob string in a
`rules/*.yml` `files:` key DOES cross `/`, because ast-grep's `*` is a different
matcher."_ Worse, if the acceptance glob goes dead, `unit`'s exclude list still
subtracts unconditionally, so the file _"runs in NO project"_ — green, and
testing nothing. **Update the acceptance glob and the `unit` exclude in the same
commit**, and rewrite that comment block for the new shape.

## Touches

`scripts/feature-files.ts`, `scripts/acceptance-mutation/discovery.ts` and their
tests; `openspec/specs/**` (moved); `vite.config.ts` (glob **and** exclude, plus
the comment block); `playwright.config.ts`; `tsconfig.app.json`; the three
`rules/*.yml` `files:` globs.

Because step 1 is real logic, this slice runs the `scripts/` gates the layout
slice does not: `npm run test:scripts`, `npm run crap4ts:scripts` (≤ 6),
`npm run dry4ts:scripts`, `npm run test:mutation:scripts`.

## Open questions

- **Is the gain worth it?** Colocation already works by filename prefix. Making
  it structural matches `intent-driven` and groups a capability's three files,
  but buys no behavior. The honest case is legibility, not capability.
- **Where does `_shared/` belong** — inside `specs/`, or a sibling? Inside means
  `**/*.steps.test.tsx` must not accidentally match helpers; a sibling keeps the
  capability directories uniform.
- **Do the three ast-grep rules stay correct?** Their comments record deliberate
  reasoning about single-path-segment scoping, including one that explicitly
  anticipates `features/<subdir>/*.steps.test.tsx`. Each needs re-reading rather
  than a mechanical glob edit.
- **Does `pairTargets` get simpler or harder?** One capability per directory
  makes pairing almost trivial, which may argue for pairing _within_ a directory
  instead of matching paths globally — a smaller change than it first looks.
