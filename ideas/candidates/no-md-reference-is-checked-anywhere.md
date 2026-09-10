---
name: no-md-reference-is-checked-anywhere
title: reference-check extracts no Markdown filename, so every .md citation in the repo is unverified
created: 2026-09-09
---

## Situation

`reference-check` is the gate that stops a comment or a doc line naming a file that no longer exists. It
scans source comments across `src/`, `scripts/`, `features/`, `perf/`, `rules/`, `rule-tests/` and the repo
root, plus every line of `CLAUDE.md`, `README.md` and `.claude/**/*.md`.

**It extracts no Markdown filename.** `references.ts`'s `EXTENSION_ALTERNATION` is `tsx|ts|yaml|yml`.

## Complication

**Verified by two fault injections at `migrate-module-depth`'s REVIEW**, by `architect`:

- A made-up `.ts` token appended to `src/hooks/useZoomGlide.rationale.md` left the gate green at an unchanged 401
  files and 1946 references. The same line inside `state-flow.md` fails it, so `src/**/*.md` is outside the
  scan set.
- Breaking the `@see {@link ./useZoomGlide.rationale.md}` link inside `useZoomGlide.ts` to a non-existent filename
  also left it green, and the reference count did not move. So the token was never extracted at all.

**Two consequences, and the second is the larger one.**

The narrow one: `doc-comments.md`'s `<module>.md` tier has no guard. A rename of a module silently orphans
its sidecar link. That tier was documented since the JSDoc slice, first used by `migrate-module-depth`, and
`doc-comments.md` already carried a note about the gap — **which named the wrong checker**, saying
`agent-doc-check` scans only `.claude/**`. The real reason is the extractor, and moving the sidecar under
`.claude/**` would not help.

The wide one: **every `.md` citation anywhere in the repo is unverified.** `.claude/**/*.md` is in the scan
set, so a doc file naming another doc file is scanned — but the filename is never extracted, because it ends
in `.md`. Every `see prose-linting.md`, every `<article>.rationale.md` pointer, and every sidecar cross-link
this rollout has written is unchecked.

That is a large surface. The rationale-sidecar rollout alone has added a pointer from each article to its
sidecar and several between sidecars.

## Question

Extend the extractor to `.md`, and the scan set to `src/**/*.md` — or rule the gap acceptable and record
why?

## Answer

**Extend it.** The rollout has just multiplied the number of `.md`-to-`.md` pointers in this corpus, and the
whole argument for the sidecar tier is that a reader can follow a pointer to the evidence. A pointer nothing
checks is the failure `reference-check` exists to catch, in the one file class it cannot see.

Two parts, and the second is what makes it a slice rather than a one-line change:

1. **Add `md` to `EXTENSION_ALTERNATION`, and `src/**/*.md` to the scan set.** Small.
2. **Triage what it then finds.** This will surface findings repo-wide on the first run, and some will be
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
  `doc-comments.md` rule 7, so a checker could require it rather than merely resolve it.
- **Should `doc-comments.md`'s gap note be deleted or re-pointed when this lands?** It currently names the
  wrong checker, corrected at `migrate-module-depth`'s REVIEW. If this slice closes the gap, the note
  becomes history rather than a caveat.
