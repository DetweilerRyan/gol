---
name: module-depth-as-a-token-ratio
title: Measure interface surface against implementation size, and report where the two disagree
created: 2026-09-05
---

## Context

Module depth — a small interface hiding a large implementation — is argued
throughout `CLAUDE.md` in prose and measured nowhere. `is-strict-equal.ts` is
described as "a three-line `Object.is` wrapper with no invariant to quantify
over"; `cache.ts`'s surface is enumerated as "`createCache`, its two interfaces
and `CacheError`"; the whole framework-free-module rule exists to keep logic
behind small surfaces. Every one of those is a reader's judgment.

The existing tools measure adjacent things and not this one. `crap4ts` scores
complexity against coverage, `halstead4ts` scores file-level complexity, and
`dry4ts` scores duplication. None of them can see the ratio between what a
caller must read and what a maintainer must read.

Two things were measured this session that make the tool cheap:

- **`tsc` already produces the interface artifact.** Declaration-only emit runs
  against `tsconfig.app.json` unmodified, exit 0 and 186 `.d.ts` files, because
  `allowImportingTsExtensions` is compatible with `emitDeclarationOnly`. The
  compiler's own answer to "what is the contract" is free, which removes the
  hand-rolled AST walk that would otherwise be the bulk of the program (and
  would itself owe CRAP ≤ 6 and mutation tests).
- **Comments dominate the result, and that is the finding.** Ratio of
  implementation to `.d.ts`, over the nineteen framework-free modules, computed
  twice — once raw and once with comments stripped from both sides
  (chars/4 estimate):

  |  raw | code-only | module                           |
  | ---: | --------: | -------------------------------- |
  | 21.9 |       3.6 | `cellTiles.ts`                   |
  | 16.5 |       5.1 | `liveCellStore.ts`               |
  | 11.1 |       1.9 | `cellAnchor.ts`                  |
  |  9.3 |  **18.4** | `equality/container-equality.ts` |
  |  4.7 |       2.1 | `camera.ts`                      |
  |  2.8 |   **7.8** | `cache.ts`                       |
  |  1.0 |       1.3 | `equality/is-strict-equal.ts`    |

  The two columns rank the modules almost completely differently. `cellTiles`
  goes first to mid-pack; `container-equality` goes ninth to first; `cache.ts`
  goes sixteenth to second. Neither column is wrong — they measure different
  things. **raw ≫ code-only** is depth carried by prose: the abstraction needs a
  paragraph of non-re-derivable reasoning to be usable, which is exactly what
  `CLAUDE.md` says about `cellTiles`, `cellAnchor` and `zoomGlide`.
  **code-only ≫ raw** is structural depth that is under-documented at the
  interface. The bottom of the table is the sanity check: `is-strict-equal.ts`
  scores 1.0, which is the prose description turned into a number.

## Sketch

`scripts/depth4ts/run.ts` plus pure modules, in the `halstead4ts` mould:
resolve `crap4ts.config.ts`'s own globs rather than restating a file list (the
lesson that list already taught), report-only, always exit 0 for the same reason
`halstead4ts` is — the formula is a proposal, not a settled measure.

Emit declarations to a temp directory, pair each source file with its `.d.ts`,
and print both columns side by side with the delta, sorted by disagreement
rather than by either column. The disagreement is what a reader should look at.

## Touches

New `scripts/depth4ts/`, a `package.json` script, and `CLAUDE.md`'s "Custom
quality tooling in `scripts/`" section — which enumerates the programs, says
"All six run via `tsx`", and then numbers `ast-grep` as "a seventh checker" and
`.gherkin-lintrc` as "an eighth". Adding one shifts that numbering in three
places, so the doc edit is larger than it looks.

`.claude/agents/architect.md` if `architect` is to read this the way it already
reads Halstead — an advisory signal folded into a boundaries review.

Related: `halstead-is-blind-to-scripts` covers the same advisory-tool territory
and may want deciding alongside this.

## Open questions

- **Which column is the metric, or is the disagreement the metric?** Raw is more
  faithful to what the idea is actually about — documentation is part of the
  cost of using an interface, and `.d.ts` carries the doc comments — but it is
  hypersensitive to where this codebase chose to put its prose. Code-only
  measures structure and ignores that the prose is load-bearing here. Reporting
  both and ranking by the gap is the proposal; it may be too clever, and the
  simpler answer of picking one and defending it is not obviously worse.
- **Goodhart, and whether report-only is enough of a mitigation.** Doc comments
  are emitted into the `.d.ts`, so **deleting interface documentation raises
  measured depth**. That argues for never gating this. But `halstead4ts` is also
  report-only and roles still act on its numbers, so "report-only" is not the
  same as "harmless" — the hazard needs naming in the program header, and that
  may still not be enough.
- **Tokens or characters?** Tokens are the theatrically correct unit, but there
  is no `ant` CLI and no `ANTHROPIC_API_KEY` on this machine, and calling
  `count_tokens` would make a `scripts/` program network-dependent and
  non-deterministic — a first here, and against the character of every other
  checker. `chars/4` is almost certainly fine for a _ratio_, since the bias
  largely cancels, but that is an assumption and not a measurement.
- **v1 counts the module's own source; the interesting version counts the
  transitive closure of its value imports.** That is what turns the numerator
  from "file size" into "everything you must read to understand this", and it is
  what would make the metric punish a leaked abstraction rather than reward a
  long file. `verbatimModuleSyntax` makes `import type` edges syntactically
  distinguishable, so the closure is computable. Whether v1 is worth shipping
  without it is the scoping question.
- **Scope is narrower than it looks.** A `.tsx` component's `.d.ts` is one props
  type against a large body, so every component scores "deep" and the number
  means nothing. Excluding them leaves nineteen modules where `crap4ts` covers
  roughly forty-five files — a smaller instrument than a new `scripts/` program
  usually justifies.
- **Higher is not monotonically better.** Past some point a large numerator
  means "split this file", which is `cleaner`'s 100+ mutant heuristic wearing a
  different hat. Whether the two can be combined mechanically, or whether
  telling deep from god-module stays a reader's job, is unresolved — and if it
  stays a reader's job, this is a report with two numbers and a caveat rather
  than a signal.
