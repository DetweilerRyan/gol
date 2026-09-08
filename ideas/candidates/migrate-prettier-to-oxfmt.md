---
name: migrate-prettier-to-oxfmt
title: Replace Prettier with oxfmt, and decide what formats the .feature files
created: 2026-09-08
---

## Context

**Situation.** `npm run format` is Prettier 3.9.6 plus two plugins:
`prettier-plugin-tailwindcss` (class sorting) and `prettier-plugin-gherkin`
(`.feature` Examples-table alignment). oxlint is already this repo's linter, so
half the toolchain is oxc already.

**Complication.** oxfmt (oxc's formatter, [beta since 2026-02-24](https://oxc.rs/blog/2026-02-24-oxfmt-beta))
absorbed one plugin and cannot absorb the other:

| Plugin                        | oxfmt status                                                    |
| ----------------------------- | --------------------------------------------------------------- |
| `prettier-plugin-tailwindcss` | **Native.** Built in, on by default; plugin no longer required  |
| `prettier-plugin-gherkin`     | **No path.** No `.feature` support, and no plugin system at all |

**Not a speed argument.** 305 TS/TSX files format fast enough that nobody
waits. The honest case is toolchain coherence (one oxc vendor for lint and
format) and two fewer plugin dependencies. Don't promote this for the 30×
benchmark.

## Sketch

Migration itself is mechanical — `npx oxfmt --migrate=prettier`, config to
`.oxfmtrc.json`, `format`/`format:check` scripts repointed. All four options in
use (`semi`, `singleQuote`, `printWidth`, `trailingComma`) are supported, and
`// prettier-ignore` is honored, which matters for `scrollbars.ts`'s three
directives. `.prettierignore` becomes `ignorePatterns` in the config.

The slice is really the `.feature` decision. Three answers:

| Option                                                                             | What it costs                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hybrid** — oxfmt everywhere, Prettier retained scoped to `features/**/*.feature` | Two formatters, but `.prettierrc.json`/`.prettierignore` stay alive — which keeps the `spliceSpan` LF anchor and the `reference-check` tokens true for free  |
| **Drop table alignment**                                                           | Contradicts `product.md` step 4 on the record ("the role this one replaced used to claim the opposite. It was wrong."). Expensive to reverse across the docs |
| **Wait**                                                                           | oxfmt is beta; plugin support is on their roadmap. A legitimate candidates-lane answer                                                                       |

Two cost lines regardless of which:

- **Churn.** oxfmt's output is closest to Prettier **3.8**; this repo is on
  3.9.6. Expect a whole-tree reformat diff.
- **Not a mutation-invariant merge.** That diff touches `src/**`, so the
  landing pays full `test:mutation:full` at merge-protocol steps 3 and 5.

## Touches

- `package.json` (`format`, `format:check`, three deps), `.prettierrc.json`,
  `.prettierignore` → `.oxfmtrc.json`
- **`npm run reference-check`.** It resolves filename-shaped tokens in comments
  against the live tree. `scripts/acceptance-mutation/text-span.ts` names
  `.prettierrc.json`; `run.ts` names `.prettierignore`. Deleting those files
  reds the gate on those comments — the slice rewrites them, or hybrid keeps
  the files.
- **`spliceSpan`'s byte-identical claim** (`text-span.ts`) is anchored to
  Prettier's default `endOfLine: lf` holding `features/**` to LF. If nothing
  formats `.feature` files any more, that premise dies — re-anchor the comment
  or take hybrid.
- Doc records naming Prettier as measured fact: `CLAUDE.md` (the two command
  lines, the Conventions bullet), `product.md` step 4,
  `doc-comments.md` (the `prettier-ignore`/JSDoc ordering measurement),
  `quality-tooling.md` (the `.oxlintrc.json` JSONC-comment claim),
  `engineering.md` (rule files as "ordinary prettier-formatted YAML")

Size: config + deps is small; the doc re-record and the reformat churn are the
bulk. No new modules, no layer crossing — a design pass is probably not needed.

## Open questions

1. **Which of the three `.feature` answers?** This is the slice. Hybrid is the
   cheapest and the least principled.
2. **Does oxfmt preserve JSONC comments?** Unverified. `.oxlintrc.json` carries
   a load-bearing comment that `quality-tooling.md` records Prettier as
   preserving. Measure before committing to the migration.
3. **Beta risk.** Is a beta formatter acceptable as a gate (`format:check`)?
   Every role runs it.
4. **Does every measured doc record need re-measuring, or only re-attributing?**
   `doc-comments.md`'s ordering result was measured against Prettier; under
   oxfmt it is a claim about a different tool.
