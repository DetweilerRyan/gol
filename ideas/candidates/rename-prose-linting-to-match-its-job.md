---
name: rename-prose-linting-to-match-its-job
title: Rename prose-linting.md, now that it owns the instruction-versus-explanation split
created: 2026-09-10
---

## Context

`lint-jsdoc-with-vale` reduced `prose-linting.md` to instructions and gave it the
register rule: given that a sentence belongs to some article, does it go in the
instruction file or in that file's `.rationale.md` sidecar. CLAUDE.md's routing
branches gave that rule up in the same slice, on the user's ruling that they
route by topic and explicitly not by register.

So the article's job is now wider than its name. It is the article about how
agent-facing prose is written, with Vale as its mechanical half. Its H1 and its
read-when block say so; its filename does not. A reader looking for the register
rule has no reason to open a file called `prose-linting.md`.

## Sketch

Rename `prose-linting.md` and `prose-linting.rationale.md` as a pair, and fix
every citation. Do it as a move-only commit first, so `git log --follow` survives.

## Touches

The filename is cited outside the pair in: `.vale.ini`, `CLAUDE.md`, `README.md`
under `vale-styles/JsDoc/`, `.claude/agents/architect.md`,
`.claude/agents/articles/doc-comments.md`,
`.claude/agents/articles/orchestration.md`, the four rule headers in
`vale-styles/JsDoc/`, `vale-styles/fixtures/fixtures.vale.ini`,
`scripts/prose-lint/run.sh`, and several files under `ideas/candidates/`.

`npm run reference-check` resolves a filename token by basename, so it catches a
citation the rename orphans. `npm run agent-doc-check` does not read article
filenames, so it says nothing either way.

## Open questions

- What name. `prose.md` is accurate and vague; `writing-prose.md` reads as a
  style guide rather than a rule file; `prose-register.md` names the new half and
  buries the Vale half.
- Whether the pair should split instead: one article for the register rule that
  every role reads, one for the Vale mechanics that only a triaging reader needs.
  That is a larger change and it is the reason this is a candidate rather than a
  todo.

## Related

[[rename-the-rationale-tier]] renames the `*.rationale.md` tier itself. Both are doc renames
that churn citations, so landing them together may beat landing them apart. They are filed separately
because the arguments differ -- this file's job widened, the tier's term was always narrower than its
contents -- and because the reach differs by an order of magnitude: ~18 basename citations here
against 221 occurrences across 50 files there.
