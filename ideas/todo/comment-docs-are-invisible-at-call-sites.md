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

**Ratified 2026-09-06.** The approach is a **partition**, not a fold, and it
runs as three slices.

The governing rule is _A Philosophy of Software Design_'s separation of comment
kinds: interface comments say what a caller must know to use the thing;
implementation comments say how it works inside. The interface half goes up
into JSDoc, where hover and the `.d.ts` can see it; the implementation half
stays `//`, relocated below the signature. That split is load-bearing rather
than stylistic, because of a third measured fact: **hover renders the whole
comment, tags included** — `fc.integer` shows `@param`, `@remarks` and
`@public` inline, `Arbitrary.filter` renders `@example` as a full fenced code
block — so there is no truncation lever, and whatever goes into JSDoc is paid
for at every hover at every call site. Ousterhout's "if a user must read the
code of a method in order to use it, then there is no abstraction" is the token
argument, stated years before agents.

The convention itself lands as a new article,
`.claude/agents/articles/doc-comments.md`, carrying both halves of one loop:
how to write an interface comment, and how to read one via `LSP` instead of
opening a body. Tag vocabulary is governed by an **information test** — does
this line say something the signature cannot? — rather than an allowlist, with
`architect` as arbiter (DESIGN sets the target, REVIEW rules per export on
whether hover is necessary and sufficient). Overflow past a ~15-line hover
budget goes to a sidecar `<module>.md` referenced by `@see`, giving a
three-tier escalation: hover for the contract, sidecar for the depth,
implementation only when changing it.

Three slices, serial: **`jsdoc-in-src`** (the article, its pointers and read
triggers, plus the 39-file `src/` backfill), **`jsdoc-in-scripts`** (30 files;
carries every syntax hazard), **`jsdoc-standing-rule`** (the role-file
responsibilities, and `architect`'s call on whether an ast-grep guard is
warranted). Entry is `architect` DESIGN, not `product` — nothing here is
user-visible, so there is no contract to write.

Hazards the survey turned up, all of them real:

- **`// prettier-ignore` gets swallowed.** `src/scrollbars.ts:128` is a bare
  directive sitting as the **last line** of a prose block immediately above
  `export function panCameraByScrollbarDrag`; `:68` is a lone directive above
  `computeScrollbarMetrics`. Prettier honours the directive only as its own
  `//` or `/* */` comment, so folding either silently reformats a hand-laid
  signature. Whether TypeScript still attaches JSDoc across an intervening
  directive is the design pass's first checkpoint.
- **`*/` inside prose terminates the block.** Six lines, all in `scripts/`, all
  from globs like `**/run.ts`: `scripts/test-support.ts:13`,
  `acceptance-mutation/mutant-plan.ts:7`, `discovery.ts:62`,
  `report-format.ts:2`, `run.ts:92`, `agent-doc-check/npm-run-refs.ts:11`.
- **Line-leading `@` parses as a tag.** Three lines, all
  `@cucumber/gherkin` in `acceptance-mutation/gherkin-document.ts` (`:12`,
  `:49`, `:54`).
- **File-top module headers are not convertible, and "skip line 1" is the wrong
  fix.** 29 files open with a true module header, which JSDoc cannot attach to
  anything. But 2 blocks begin at line 1 _and_ document the first export
  (`agent-doc-check/roles.ts:1`, `acceptance-mutation/report-format.ts:1`), so
  a naive line-1 exclusion drops real docs.

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
  `.d.ts` against its source. **Measured at promotion, correcting what this
  file said when it was filed:** `//` leading comments do **not** survive
  `tsc --emitDeclarationOnly` — `cellTiles.d.ts` comes out with zero comment
  lines, the 113-, 64- and 42-line blocks all gone — while
  `is-strict-equal.d.ts` keeps its JSDoc verbatim, `@see` included. So this
  slice moves that candidate's raw column substantially and in one direction:
  prose that is invisible today becomes part of the measured interface
  surface. Whichever lands second must re-baseline.

## Resolved at promotion

Each of the questions this candidate was filed with, and how it was answered.

- **Authorship, not punctuation — and the answer is a partition.** Only 8 of
  164 blocks are a single line; the median is ~5 and the tail reaches 113. The
  resolution is not "write a summary and keep the rest", it is Ousterhout's
  split: the interface half goes into JSDoc, the implementation half stays
  `//`. A block's length stops being the problem once most of it is correctly
  classified as implementation.
- **Who owns it: `coder` and `cleaner` author, `architect` ratifies.** `coder`
  writes JSDoc on any new export, `cleaner` treats a doc summary as part of the
  naming work it already owns, `architect` REVIEW rules on it as an
  interface-surface judgment. The objections stand but were accepted:
  `architect` reviewing prose it partly shaped is the same one-pass-two-jobs
  tension that split `hardener` out, and it has no mechanical check behind it.
- **Backfill and standing rule are separate, and are separate slices.**
  `jsdoc-in-src` and `jsdoc-in-scripts` do the backfill; `jsdoc-standing-rule`
  codifies the duty afterward, so the convention is proven against 84 real
  blocks before it becomes a rule.
- **It does not fight the comment convention; it sharpens it.** The ruling is
  an **information test** rather than a tag allowlist: does this line say
  something the signature cannot? `@param constraints — Constraints to apply`
  is the type name in English and fails; `@param thumbRatio — must be the value
from when the drag started` passes. `@example`, `@param`, `@returns`,
  `@throws` and `@see` each have a trigger that earns them, the default posture
  is minimal, and `architect` arbitrates.
- **Both `src/` and `scripts/`**, as two slices. Every syntax hazard is on the
  `scripts/` side, which is most of why they are separate.
- **A mechanical guard is `architect`'s call, deliberately left open.** A
  presence-only ast-grep rule cannot tell whether a summary says anything, so
  declining it is a defensible outcome rather than a gap.
- **One measurement moves, and it is not one of the gates.** `halstead4ts`
  ignores comment lines and `crap4ts` scores complexity against coverage;
  `dry4ts` fingerprints oxc AST node kinds, among which there is no comment
  kind (inferred from the binary's symbol table, not measured — so a move is a
  real finding about the tool). What does move is `module-depth-as-a-token-ratio`'s
  raw column, per the correction under Touches.

## Still open

- **Exported declarations only, or interface and type members too?** The survey
  counted top-level exports, but the repo's existing JSDoc precedent
  (`cache.ts`) is mostly on **interface methods** — and members are where hover
  pays off most, since a caller reaches `cache.set` without ever opening
  `cache.ts`. Left to `architect` DESIGN to scope, since it changes the size
  estimate the batch ordering was built from.
- **Whether the sidecar `<module>.md` tier survives contact with the first real
  case.** `cellTiles.ts` is the likeliest first one. Two things are unverified:
  whether a relative `@see ./cellTiles.md` renders legibly in hover (versus
  `{@link}`, which expects a declaration reference or URL), and where such a
  file sits in CLAUDE.md's documentation-routing test, which currently routes
  to CLAUDE.md, an article, or a role file and has no entry for a file beside
  the source. Both are design-pass checkpoints.
- **Nothing checks that a sidecar reference resolves.** `agent-doc-check` scans
  `.claude/**/*.md` plus CLAUDE.md, not `src/**`, so a `@see ./name.md` can rot
  silently. Filed separately as `sidecar-doc-links-are-checked-by-nothing`.
