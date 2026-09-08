---
name: a-clean-lint-is-not-evidence-a-block-hovers
title: Decide whether closing the mid-line @ gap is worth ESLint in the dependency tree
created: 2026-09-08
---

## Situation

`oxlint-native-jsdoc-tier` enabled six native oxlint `jsdoc` rules at `error`. It also measured the
tier's boundary and wrote it into `quality-tooling.md`: **oxlint recognises a JSDoc tag only at the
start of a line.** TypeScript's hover parser recognises any whitespace-preceded `@` anywhere. So
`* Do not import @playwright/test types` passes `npm run lint` while hovering as a broken block.

`eslint-plugin-jsdoc`'s `escape-inline-tags` closes exactly that gap. It has no native oxlint port.

## Complication

**Spiked 2026-09-08, throwaway branch off `17ab1c2`. The mechanism works; the price is the
problem.**

Behaviour — four probes, all as predicted:

| Probe                                    | Result |
| ---------------------------------------- | ------ |
| `@playwright/test` bare in prose         | fires  |
| same, backticked (the repo's actual fix) | silent |
| `{@link @codemirror/state#StateField}`   | silent |
| `@yearly` / `@monthly` mid-line          | fires  |

The third matters: a recent upstream fix exempts scoped packages **inside** declaration-reference
inline tags (`link`, `linkcode`, `linkplain`, `inheritDoc`) via `/^@[\w.\-]+\/[\w.\-]+/v`. Since
this repo's real hazards are scoped packages, that exemption could have made the rule useless
here. It does not — the repo's cases sit bare in prose, outside those tags.

| Measure                           | Value                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Findings on the real tree         | **0** — clean baseline, no migration                                                       |
| Non-inertness                     | **proven** — planted probes fire in `src/`, `scripts/`, `features/`, `perf/`               |
| `npm run lint` cost               | 0.46s → **0.78s**                                                                          |
| Install footprint                 | **83 packages, including `eslint@10.10.0`**                                                |
| Known historical instances closed | **2** — `f43a13f` (`@playwright/test`), `e664699` (`@cucumber/*`), both already hand-fixed |

The zero was verified rather than trusted. Zero findings and a rule that never ran are
indistinguishable, and `quality-tooling.md` records two silent-inert modes from the slice that
enabled this tier.

## Question

Is a gap with two known, already-fixed instances worth ESLint in the tree plus an alpha,
explicitly non-semver oxlint feature?

## Answer

**Not on today's evidence — file it so the third instance has somewhere to land.**

Against: the repo is a pure-npm, oxlint-only toolchain with no ESLint; oxlint's own schema says
"JS plugins are in alpha and not subject to semver"; and the entire measured yield is two sites
that three roles already found and fixed by hand.

For, if it ever tips: the gap is real and silent, the migration is free (clean baseline today),
the cost is sub-second, and the rule is `enableFixer`-capable with `fixType: "backticks"` — which
is the form this repo already reworded to by hand.

**What would tip it:** a third instance appearing in the wild, or a ruling that "a clean lint is
not evidence a block hovers as written" is a standing risk rather than a documented caveat.

## Touches

`package.json` (+`eslint-plugin-jsdoc`), `.oxlintrc.json` (`jsPlugins` + rule), a small alias
module at repo root, and `quality-tooling.md`'s "The alpha tier is deliberately not here"
paragraph. No `src/`, no `scripts/`, no gate sequence change.

## Open questions

- **The alias trips an existing rule.** `eslint-plugin-jsdoc` has both a default and a named
  `jsdoc` export, so the alias module reds `import/no-named-as-default`. Trivial to work around,
  but any adoption hits it on the first commit.
- **The `*/`-in-glob hazard is a different class and is NOT closed by this.** `5fb86c3` reworded
  `.claude/**/*.md` because `*/` terminates a JSDoc block early. No jsdoc rule addresses it, and
  the spike's check of this was inconclusive — the pipeline mangled the output and the worktree
  was torn down before it was read. **Unverified, and worth re-measuring before anyone cites it.**
- **Would the five other alpha-tier rules ride along?** `informative-docs`, `no-undefined-types`,
  `normalize-see-links`, `match-description`, `no-bad-blocks` all become reachable once the
  dependency is paid for. That changes the trade: the question stops being "is this one gap worth
  ESLint" and becomes "are six rules". None of the other five has been spiked, and
  `no-undefined-types` in particular would validate `{@link}` targets, which nothing here does.
- **Does `hover-carries-detail-no-reader-asked-for` overlap?** It weighs adopting TypeDoc for a
  generated doc surface. TypeDoc's `validation.invalidLink` overlaps `no-undefined-types` above.
  If both land, one of the two is redundant — worth deciding together rather than separately.
