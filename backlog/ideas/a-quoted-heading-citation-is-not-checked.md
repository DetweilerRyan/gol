---
name: a-quoted-heading-citation-is-not-checked
title: Check that a cited heading still lives in the file the citation names
created: 2026-09-12
---

## Context

Found 2026-09-12 reviewing `doc-comments.md`. `vale-styles/JsDoc/DeadIndexical.yml` cited
`engineering.md`, "Name the slice, never this slice" in three places, and `doc-comments.md`'s Vale
table in a fourth. That rule had moved to `claim-discipline.md` when it was split out of
`engineering.md`. All four citations stayed pointing at the file it left.

**`npm run reference-check` passes on all four.** It resolves `engineering.md` as a filename, and the
file exists. Its `cited-symbol-exists` check covers the `<file>'s <symbol>` form only. A quoted
heading is a different shape and nothing reads it.

So a citation can name a real file and a claim that file no longer carries. The failure is silent,
and it is worse than a dangling filename: the reader follows the pointer, does not find the rule, and
has no way to tell whether the rule was deleted or merely moved.

**The general hazard is an article split.** `claim-discipline.md` was split out of `engineering.md`
precisely because it binds every prose surface rather than only `src/`. Every citation of a moved
rule then points at the file it left, and the split is exactly the kind of change that makes a
citation look most trustworthy — the target file still exists and is still about roughly the subject.

`prose.md` is the live risk for the next one: it now owns the instruction-versus-explanation split,
and passages are actively moving between it and other articles.

## Sketch

A sixth check in `scripts/reference-check/`, beside `cited-symbol-exists`.

The citation shape is `` `<file>`, "<heading>" `` — a filename in a code span, a comma, then a quoted
string. Resolve the file, then confirm the quoted string appears in it as a whole line or a heading.

**Two things to settle before writing it.**

- **Is a quoted string after a filename always a heading?** It may be a quoted sentence, a rule name,
  or a scenario title. The check may need to be "appears anywhere in the file", which is weaker but
  has no false positives — the same basename-matching under-report every other check here makes.
- **The `<symbol>` check already exists and is close.** Whether this is a new check or a widening of
  `cited-symbol-exists` to a second citation shape is a real design question, not a formality.
  `dry4ts` will have an opinion.

An opt-out marker on the existing `` `reference-check:` `` pattern, for a heading deliberately quoted
from a file that never carried it.

## Touches

- `scripts/reference-check/` — a new check module plus its tests, and the `decide.ts` wiring
- `CLAUDE.md`'s reference-check entry, which enumerates the checks by name
- Whatever the first run reds. **Measure that before scoping**: the count is unknown, and a large one
  makes this two slices rather than one.

## Open questions

- **The corpus is tiny, which changes the cost case.** Measured 2026-09-12 across `.claude/`,
  `CLAUDE.md`, `vale-styles/`, `scripts/` and `src/`: **six** citations of this shape, and they are
  not written uniformly — `` `file.md`, "heading" ``, `file.md, "heading"` and
  `` `file.md` under "heading" `` all appear. Of the six, three pointed at
  `engineering.md`, "Name the slice, never this slice" and were the stale ones fixed in this pass;
  the remaining three resolve.

  **Five of the six were stale, and every one from the same cause**: the split of
  `claim-discipline.md` out of `engineering.md`. Three in `DeadIndexical.yml`, one in
  `doc-comments.md`'s Vale table, one in `CLAUDE.md`, one more in `doc-comments.md`'s rule 4 — all
  naming `engineering.md` for a heading that left it. All fixed in this pass.

  So the backlog is zero **now**, and the failure rate before this pass was 83 percent. That is the
  cost case: not a list to clear, but a defect that reached five sites unnoticed because every
  checker resolved the filename and none read the claim. Weigh it against the cheaper alternative —
  mandating one citation shape by convention — which catches the same defect at authoring time and
  needs no parser.

- Does it gate, or report only? Every other check in `reference-check` gates, so the default is yes —
  but a large backlog would argue for landing the check and the remediation separately.
- Does it cover `vale-styles/**`? That is where the found instance was, and `reference-check`'s
  source surface already reaches it.
