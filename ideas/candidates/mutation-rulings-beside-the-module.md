---
name: mutation-rulings-beside-the-module
title: Move per-module mutation survivor rulings out of the article and into <module>.mutation.md
created: 2026-09-09
---

## Situation

`mutation-testing.rationale.md` carries per-module survivor rulings — `Grid.tsx`, `useCamera.ts`,
`usePatternPlacement.ts`, `useGridPointerGestures.ts`, `Scrollbar.tsx`. Each says why a surviving
mutant in that file was ruled equivalent.

Those are per-module facts sitting in a shared article, which is the same shape
`migrate-architecture-depth` and `migrate-module-depth` have been unwinding everywhere else.

## Complication

**This tier has a read trigger the other two do not: a tool generates it.** Stryker reports a file
and a line. The natural next lookup is that path's rulings. Today `hardener` has to already know
`mutation-testing.rationale.md` exists and grep it, so discoverability is doing no work.

**A mutation ruling can go stale mechanically, which is unique among the sidecar tiers.** If the code
moves, a prior equivalence ruling may no longer describe a live survivor. Separated per module, that
becomes checkable — "does every ruling still correspond to a surviving mutant" is a question a
program could answer. Buried in article prose it is not.

**The cost is real: those rulings are the article's worked examples.** `mutation-testing.md` teaches
_how_ to rule a survivor equivalent, and teaches it by showing these cases. Moving all five guts the
lesson, and a reader learning the method wants several examples side by side rather than scattered
across five files.

## Question

Does a third per-module file earn its place, given the tier already has two?

## Answer

Likely yes, on the tool-generated trigger alone — but the split has to keep the teaching intact.

**The article keeps the method plus one illustration**; teaching constrains an action, so CLAUDE.md
branch 5 keeps it there. **Each module carries its own current rulings.** The article's remaining
example should be chosen as the most instructive, not the first one in the file.

Ordering note: this depends on the sidecar pair being settled, which
`migrate-architecture-depth` did. It does **not** depend on
`implementation-comments-that-outgrow-their-line`, and could go before or after it.

## Touches

- `.claude/agents/articles/mutation-testing.md` and its `.rationale.md` sidecar
- `.claude/agents/articles/doc-comments.md` rule 7, and CLAUDE.md branch 4 — a third tier changes the
  convention both of them state
- `.claude/agents/hardener.md` — the mutation stage gains a "read the module's rulings first" step
- New `<module>.mutation.md` beside five modules
- `.vale.ini` — decide the scope, consistent with whatever is ruled for `<module>.rationale.md`

## Open questions

- **Is three tiers too many?** Two were justified on "using versus changing". A third needs its own
  answer, not an appeal to symmetry.
- **Could the staleness check actually be built?** If yes, that is the strongest argument and the
  slice should carry it. If no, the case rests on discoverability alone, which is weaker.
- **Does `<module>.mutation.md` follow `.rationale.md`'s Vale treatment?** Ruled 2026-09-09: module
  rationale is unlinted. A third tier should not be decided independently.
- **What owns a ruling for a file with no sidecar yet?** Creating one per survivor may spread files
  faster than the rulings justify.
