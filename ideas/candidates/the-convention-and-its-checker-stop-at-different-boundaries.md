---
name: the-convention-and-its-checker-stop-at-different-boundaries
title: Bind README.md files and future module sidecars to the undated-claims convention and its checker
created: 2026-09-07
---

## Situation

`no-undated-cross-file-claims` landed the convention; `comment-reference-checks` landed
`npm run reference-check`. Both name the surfaces they bind.

## Complication

**They bind different surfaces, and a real file falls through both.** The convention's list covers
`.md` under `.claude/` plus `CLAUDE.md`. `reference-check`'s `scan-scope.ts` has
`DOC_EXACT_FILES = new Set(['CLAUDE.md', 'README.md'])` plus `.claude/**/*.md`.

So a `README.md` **outside the repo root** is bound by neither. `perf/README.md` is the proof, and
the proof is not hypothetical: it carried a reference to an `e2e/` directory that has never
existed, survived the entire three-slice sweep, and was found by `hardener` reading rather than by
any check.

CLAUDE.md's documentation-routing rule 4 makes this worse going forward: it mandates a sidecar
`<module>.md` **beside the source** for depth that overflows a JSDoc hover. Every one of those will
land outside both boundaries. `doc-comments.md` already records that nothing checks a sidecar link
resolves — this is the same gap one level up, for the sidecar's own prose.

## Question

Widen the checker, widen the convention, or both — and by what rule, so the next surface does not
fall through the same way?

## Answer

**Both, and state the surface as a predicate rather than a list.** The current failure is that two
enumerations drifted apart; adding a third entry to each repeats the mistake more slowly.

Candidate predicate: _every tracked `.md` outside `ideas/` and `.claude/worktrees/`_. That reaches
`perf/README.md` and every future sidecar automatically, keeps the deliberate `ideas/` exclusion
(an idea file's normal mode is naming files that do not exist yet), and keeps foreign checkouts
out.

Cost to size before committing: unknown how many findings a widened scope produces on the current
tree — `perf/README.md` alone was not measured beyond the one dead path.

## Touches

`scripts/reference-check/scan-scope.ts` and its test, `.claude/agents/articles/engineering.md`'s
bound-surface sentence. Possibly `CLAUDE.md`'s checker entry if the scope sentence there names the
files.

## Open questions

- **Is `README.md` at root special enough to keep enumerated?** It is the only `.md` a reader
  outside the repo sees, and the predicate above covers it anyway — so the enumeration is
  redundant rather than wrong, and dropping it is a small simplification with no behaviour change.
- **Does the convention want the same predicate as the checker, or is prose allowed to bind more
  than a check can verify?** They are different instruments and the convention already binds more
  than the checker can reach (rosters, "this slice"). Making the _surface_ identical while the
  _rules_ differ may be the honest split.
- **Sidecars do not exist yet.** `ls src/*.md` is still empty, so the forward-looking half is
  speculative in the way `sidecar-doc-links-are-checked-by-nothing` was before it was widened on
  measurement. The `perf/README.md` instance is what makes this worth filing now.
