---
name: comment-docs-are-invisible-at-call-sites
title: Move export documentation into JSDoc so LSP hover surfaces it at the call site
created: 2026-09-06
---

## Context

Every role carries the `LSP` tool, and `CLAUDE.md` sells it as
"go-to-definition, find-references, and type errors reported in-turn". What it
does not say is that **hover documentation only exists for JSDoc**. TypeScript
attaches quick-info prose from `/** */` and from nothing else, and this repo
puts almost all of its design rationale in `//` blocks — so a role that hovers
a symbol from a calling file gets a bare type signature and none of the
reasoning that `CLAUDE.md:274` describes as "often not re-derivable from the
code alone".

Measured with the `LSP` tool against the working tree:

- `src/equality/is-strict-equal.ts:11` (`isStrictEqual`, JSDoc) — hover returns
  the full prose plus the `@see` link.
- `src/cellTiles.ts:354` (`nextTileRange`, with the repo's densest
  documentation directly above it: **113 lines** of `//`) — hover returns the
  signature and nothing else.
- The same symbol at a real call site in another file,
  `src/hooks/useCellTiles.ts:66` — still signature only.

The third result is the one that matters. A reader who already has
`cellTiles.ts` open sees the `//` block fine; this is a **call-site** gap, not
a reading-the-file gap.

The counterweight is that the win is conditional. `typescript-lsp` is a plugin
plus a **global** `npm install`, and `CLAUDE.md` records that the roles fall
back to `Grep`/`Read` **silently** when the server is missing. In a fallback
session `//` and `/** */` read exactly alike, so this buys nothing there.

The scale, from a survey of `src/` (excluding vendored `src/catalyst/`) and
`scripts/`:

|                                                  | exported decls | preceded by a `//` block |
| ------------------------------------------------ | -------------: | -----------------------: |
| `src/` production (excl. tests, `test-support/`) |            149 |                   **74** |
| `scripts/`                                       |            155 |                   **79** |

Existing JSDoc: **9 blocks in 5 files** across all of `src/`, and **zero** in
`scripts/`. The nine sit in `src/cache.ts` and the four `src/equality/*.ts`
modules — precedent rather than accident, since those are the modules most
imported from elsewhere and the ones whose callers never open them.

## Sketch

Convert the `//` blocks that sit directly above an exported declaration into
`/** */`, keeping the existing prose and adding a summary first line. This is
deliberately **not** described as a punctuation pass — see the first open
question, which is the real cost.

Two mechanical hazards the survey turned up:

- **`// prettier-ignore` gets swallowed.** `src/scrollbars.ts:128` is a bare
  directive sitting as the **last line of a 9-line prose block** immediately
  above `export function panCameraByScrollbarDrag`. Prettier honours the
  directive only as its own `//` or `/* */` comment, so folding that block into
  a single `/** */` silently reformats a hand-laid signature. Two more
  directives at `:28` and `:68`.
- **File-top module headers are not convertible, and "skip line 1" is the
  wrong fix.** 8 files in `src/` and 31 in `scripts/` open with a true module
  header, which JSDoc cannot attach to anything TypeScript will hover. But
  **11 blocks** begin at line 1 _and_ document the first export — e.g.
  `scripts/agent-doc-check/roles.ts:1`, 23 lines above
  `export const RETIRED_ROLES` — so a naive line-1 exclusion drops real
  declaration docs.

One thing that is safe: no rule in `rules/` matches on comments, and a `//`
block above an export is a **sibling** of the `export_statement` rather than
part of it. The ten rules that use a statement-text `regex:` do read comments
_inside_ a statement — several say so in their own headers, e.g.
`rules/no-cucumber-parser-outside-adapter.yml:33` — but nothing this slice
touches is inside one.

## Touches

`src/**` and `scripts/**` broadly. No test, no config, no behaviour change.
Possibly a convention ruling in `.claude/agents/articles/engineering.md` (see
open questions).

Two candidates already on the board bear on this:

- **`invariant-merge-step5-real-score`** — this is a repo-wide diff that cannot
  move a single mutant, yet `src/**` is correctly absent from the merge
  protocol's mutation-invariance allowlist, so landing it pays two
  `test:mutation:full` runs to re-measure a provably unchanged score. A
  concrete instance of that candidate's argument, arriving from a direction it
  did not anticipate.
- **`module-depth-as-a-token-ratio`** — its raw column measures a module's
  `.d.ts` against its source, and JSDoc is carried into declaration emit.
  Whether plain `//` leading comments survive `tsc --emitDeclarationOnly` is
  **not established here**, and that candidate's own measurements hint they may;
  if they do not, this slice would move its raw column substantially. Worth
  measuring before either idea is promoted, since the answer changes what that
  metric means.

## Open questions

- **This is authorship, not punctuation, and that is the whole cost.** Only
  **8 of 164** blocks are a single line; the median is ~5 lines and the tail
  reaches 113. A hover popup that dumps a hundred lines of numbered findings is
  not obviously better than none, and those tokens land on every hover by every
  role. Doing this properly means writing a one-sentence summary first line for
  ~150 declarations — a judgment call each — with the existing prose demoted
  below it. Whether that is one slice, several, or not worth doing is the
  question this candidate exists to ask.
- **Which role owns this, and is it one owner or two?** The proposal on the
  table is `coder` and `cleaner` author, `architect` ratifies in its REVIEW
  slot. It splits cleanly along what each role already knows: `coder` has the
  context at the moment the export is written, `cleaner` is chartered for
  structure-preserving cleanup and already owns naming — a doc summary is
  naming's longer form — and `architect` REVIEW is the role that judges
  interface surface, which is exactly what a one-line summary of an export is.
  Three objections to weigh against it. (1) It widens `coder`, and that has
  been ruled against before; the narrower reading is that `coder` writes only
  what the approved spec implies, and the _why_ behind an interface is often
  not yet settled when the code first lands. (2) It is a third concern in a
  `cleaner` pass already carrying `crap4ts`, `dry4ts` and the scoped mutation
  scan, and `cleaner` runs after **every** `coder` invocation, so the cost is
  per-invocation rather than per-slice. (3) `architect` ratifying prose quality
  has no mechanical check behind it, unlike every other thing it reviews — and
  an `architect` that authors the summaries it also reviews is the same
  one-pass-two-jobs collision that split `hardener` out in the first place.
  `hardener` and `product` are both out on existing boundaries: `hardener`'s
  stages are all mechanical, and `product` never writes `src/` in either mode.
- **The backfill and the standing rule are different questions.** Converting
  the ~150 existing blocks is a one-off slice whose owner is a scoping call —
  it is behaviour-preserving and structure-preserving, which reads as
  `cleaner`'s charter, but at a size no cleanup pass has ever carried. Who
  writes JSDoc on a **new** export from then on is a process amendment to the
  role files, and it is the half that decides whether this stays true a month
  later. Answering only the first leaves the repo drifting back.
- **Does it fight the stated comment convention?** `CLAUDE.md`: "Comments are
  reserved for non-obvious _why_." JSDoc's tag vocabulary pulls the other way —
  `@param`/`@returns` restating a type signature is precisely the noise that
  line forbids. The proposal is **JSDoc as a container, not as a tag
  vocabulary**: prose stays prose, and no `@param` unless it says something the
  type cannot. If that ruling is taken it belongs in `engineering.md`, which is
  read unconditionally, rather than in `CLAUDE.md`'s conventions list.
- **Exported declarations only, or interface and type members too?** The survey
  counted top-level exports, but the repo's own precedent (`cache.ts`) is
  mostly on **interface methods** — and members are where hover pays off most,
  since a caller reaches `cache.set` without ever opening `cache.ts`. Counting
  the member surface would change the size estimate above.
- **`src/` only, or `scripts/` as well?** `scripts/` has zero JSDoc and 79
  candidate blocks. It is also the tooling every role's gate runs on, and is
  read by roles at least as often as `src/`, so excluding it is hard to defend
  on grounds other than slice size.
- **Anything mechanical, or nothing at all?** No oxlint JSDoc plugin is
  enabled, no `rules/*.yml` matches comments, and nothing in the repo would
  notice a regression. An ast-grep rule requiring JSDoc on exported
  declarations is conceivable and would be `architect`'s to author, but it is a
  new gate over a convention that has not been ratified — a follow-on at best,
  and possibly the wrong instrument, since it can check for a `/** */` and
  never for whether the first line is a useful summary.
- **Does any measurement move?** `halstead4ts` states comment lines don't count
  and `crap4ts` scores complexity against coverage, so neither should — but
  whether `dry4ts` counts comment text toward duplication is unverified, and a
  repo-wide comment rewrite is exactly the diff that would find out. Worth
  checking on a handful of files before committing to the whole sweep.
