---
name: no-md-reference-is-checked-anywhere
title: reference-check discards every relative .md link, so the mandated sidecar @see form is unverified
created: 2026-09-09
---

## Situation

`reference-check` is the gate that stops a comment or a doc line naming a file that no longer exists. It
scans source comments across `src/`, `scripts/`, `features/`, `perf/`, `rules/`, `rule-tests/` and the repo
root, plus every line of `CLAUDE.md`, `README.md` and `.claude/**/*.md`.

**It extracted no Markdown filename when this was written.** `check-md-references` has since added `md`
to `references.ts`'s `EXTENSION_ALTERNATION`, which closes the wider half of what follows: a repo-relative
`.md` token in doc prose or in a source comment now resolves against the live tree. What that landed
change did **not** close is the narrower and more pointed half, re-measured 2026-09-09 by `architect` on
`migrate-architecture-depth`.

## Complication

**Two gaps survive the extractor change, both re-measured by fault injection on the landed tree:**

- **Every leading-dot token is discarded before any check reaches it.** `references.ts`'s
  `isDiscardedToken` drops any token starting with `.` as dotted-relative noise, which is also the exact
  shape of `@see {@link ./cache.rationale.md}` — the reference form `doc-comments.md` rule 7 mandates,
  because hover mangles every alternative. Breaking that link to a name resolving to nothing left the gate
  green with the reference count unmoved, so the token was never extracted. Probing
  `extractFileTokens` directly agrees: `./cache.rationale.md` and `../scrollbars.rationale.md` both yield
  `[]`, while `src/cache.rationale.md` yields the token.
- **`src/**/*.md` is outside the scan set.** A made-up `.ts` token appended to
  `src/scrollbars.rationale.md` left the gate green at an unchanged 401 files. The same line inside
  `state-flow.md` fails it.

**The consequence.** The sidecar tier's own mandated pointer is the one citation form in this repo that
nothing checks. A workaround is already in use — `migrate-architecture-depth` writes every `//`-comment
pointer repo-relative (`src/cache.rationale.md`, not `./cache.rationale.md`), which the extractor does
reach, measured as a rise from 2363 to 2373 references. That leaves the `{@link}` form itself unguarded,
and it is the form a reader is most likely to follow.

## Question

Resolve a relative `.md` link, and extend the scan set to `src/**/*.md` — or rule the remaining gap
acceptable and record why?

## Answer

**Extend it.** The rollout has just multiplied the number of `.md`-to-`.md` pointers in this corpus, and the
whole argument for the sidecar tier is that a reader can follow a pointer to the evidence. A pointer nothing
checks is the failure `reference-check` exists to catch, in the one file class it cannot see.

Three parts. The first is done; the third is what makes the rest a slice rather than a one-line change:

1. ~~**Add `md` to `EXTENSION_ALTERNATION`.**~~ Landed by `check-md-references`.
2. **Resolve a leading-dot token against the citing file's own directory**, rather than discarding it, and
   add `src/**/*.md` to the scan set. The discard rule exists to drop a bare `.ts` matched with a
   zero-length prefix, so narrow it rather than deleting it: a token of `./name.ext` or `../name.ext` has
   a real basename and the current rule throws it away with the noise.
3. **Triage what it then finds.** This will surface findings repo-wide on the first run, and some will be
   legitimate prose rather than citations — a sentence naming `README.md` in the abstract, for instance.
   Expect to need the allow-marker opt-out, and expect the triage to be the bulk of the work.

## Touches

`scripts/reference-check/` and its tests, so the `scripts/`-scoped pipeline applies: `npm run test:scripts`,
`npm run crap4ts:scripts`, `npm run dry4ts:scripts`, `npm run test:mutation:scripts`. Then whatever the
first green run requires across `src/`, `.claude/**` and the repo root.

Not mutation-invariant, and not comment-only: this edits a `scripts/` program.

## Open questions

- **Does the basename-matching convention hold up for `.md`?** `reference-check` matches by basename
  everywhere, which under-reports by design. With `.md` files, basename collisions are likelier —
  `README.md` exists at more than one level in many trees, and this repo has `perf/README.md` beside the
  root one.
- **Is `@see {@link ./name.md}` the form to check, or the bare token?** The braced link form is mandated by
  `doc-comments.md` rule 7, so a checker could require it rather than merely resolve it. Note the two
  forms now disagree in the tree: `{@link}` carries `./`, and every `//`-comment pointer carries the
  repo-relative path, precisely so that one of the two is checked today.
- **Should `doc-comments.md`'s gap note be deleted when this lands?** Rule 7 now enumerates the four
  things the checker does and does not reach, and the enumeration is what a reader acts on. If this slice
  closes two of them, the surviving two are the note.
