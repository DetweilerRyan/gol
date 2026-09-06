---
name: hover-carries-detail-no-reader-asked-for
title: Explore the richer TSDoc vocabulary and a generated doc surface that would make a summary/detail split pay off
created: 2026-09-06
---

## Context

`comment-docs-are-invisible-at-call-sites` ratified a deliberately narrow tag
vocabulary — an information test over `@example`, `@param`, `@returns`,
`@throws` and `@see`, with `architect` arbitrating. Several standard TSDoc tags
were left out, and one was left out for a measured reason worth recording
before it is forgotten.

**`@remarks` does not do what it looks like it does.** TSDoc's core standard
splits a doc comment into a brief summary and a detailed remarks section, and
says index pages show only the summary while detail pages show both. That reads
exactly like a hover-truncation lever, and it is not one: hovering `fc.integer`
at `src/cache.property.test.ts:11` renders the summary, `@param`, `@remarks`
**and** `@public` inline, and `Arbitrary.filter` renders its `@example` as a
full fenced code block. The language server hands over the whole comment. The
summary/detail split is a **documentation-generator** convention, so it only
pays off if something generates documentation — which nothing here does.

That is the shape of this idea: the tags that were rejected were rejected for
lack of a consumer, not for lack of merit.

## Sketch

Two halves, and the second is what makes the first worth anything.

**A generated doc surface.** TypeDoc or API Extractor over the twenty
framework-free modules, producing per-module pages where summary and remarks
genuinely separate. Declaration emit already works unmodified — measured on
`tsconfig.app.json`, exit 0 and 197 `.d.ts` files — so the input exists.

**Then the tags that surface would justify:** `@remarks` for the
summary/detail boundary, `@defaultValue` on the tunable constants
(`TILE_SPAN_CELLS`, `EVICT_LAG_TILES`, `DRAG_THRESHOLD_PX`), `@deprecated`
during a migration, `@typeParam` on the generic surfaces (`cache.ts`,
`src/equality/`), `@public`/`@internal` if a release-tag discipline is wanted.

Worth checking whether the generated pages could double as the sidecar
`<module>.md` tier that slice already introduces, rather than becoming a third
place documentation lives.

## Touches

`.claude/agents/articles/doc-comments.md`'s tag section, a new devDependency
and `package.json` script, and — if a generated site lands — a decision about
where its output goes and whether it is committed. Note a `scripts/` program is
**not** the likely shape here: TypeDoc is off-the-shelf, and wrapping it would
buy a CRAP ≤ 6 obligation and a mutation suite for nothing.

## Open questions

- **Is there a consumer at all?** No role reads generated HTML, and an agent
  reads the source. If the answer is "the docs are for humans", say so plainly
  — that is a legitimate reason, but it is a different one from the token
  argument that motivated the parent slice, and conflating them would make this
  look better-justified than it is.
- **Does a second rendering of the same prose earn its maintenance?** The repo
  already rejected a hand-maintained rule index for exactly this reason.
  Generated output is not hand-maintained, but it is still a second surface
  that can disagree with the first when generation is skipped.
- **`@internal` implies a release-tag discipline nothing here has.** Adopting
  it means deciding what "public" means for an app with no published package,
  which may be a question with no useful answer.
