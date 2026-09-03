---
name: feature-file-count-is-stale-in-prose
title: Correct the stale ".feature file" totals, and decide whether anything should check them
created: 2026-09-03
---

## Context

Found by `hardener` during `grid-tabbable-when-cursor-off-screen`'s gate run, and **deliberately not
fixed there** — the right call, and the reason is the more interesting half of this candidate.

Two places state a total that is wrong:

- `CLAUDE.md` — "four of the **seven** features carry no Examples table"
- `scripts/acceptance-mutation/examples-cell-sites.test.ts` — "Exactly three of the **seven**
  `.feature` files"

**The substantive claims in both are still true** — four named features do carry no table, three do
carry one. Only the totals are wrong.

**This predates the slice that found it.** `main` already carried eight when `grid-tabbable` began;
`keyboard-grid-navigation.feature` landed earlier and left the count stale then. `grid-tabbable` made
it nine.

## Why `hardener` could not just fix it

The `scripts/` file is outside the merge protocol's mutation-invariant allowlist. That slice had been
handed a stage-4 skip instruction, and the exemption is **self-revoking** — writing one comment in
`scripts/` would have voided it and forced a full mutation run, over a comment. Correctly reported
rather than actioned.

That is the exemption working as designed, but it is worth noting as a real friction: a trivially
correct doc fix is blocked from riding along with a `features/`-only slice, so it accumulates.

## Sketch

Two lines. **Cheapest correct home is any slice that already touches `scripts/`**, since it then
costs no extra gate run — `zoom-glide-regressed-the-pan-path` does not qualify (`src/` only), but
anything in the `acceptance-mutation` family would.

The CLAUDE.md half could land alone at any time; it is on the allowlist. Splitting them means the
two halves are briefly inconsistent with each other, which is arguably worse than either being
stale, so prefer landing both together.

## The question actually worth deciding

**Should anything check this?** The count went stale twice without a gate noticing, and it will go
stale on the next `.feature` added.

`npm run agent-doc-check` already gates binary facts about `CLAUDE.md` — every `npm run <script>`
reference resolves, every `rules/*.yml` is named, the role-cycle string matches everywhere. A
".feature file count" check is the same _kind_ of fact and would fit that program directly.

Arguments against, which may well win: the count appears in prose whose real claim is about _which_
features, not how many; a checker would need to parse a number out of English rather than match a
path (every existing `agent-doc-check` rule matches a name or a path); and a fragile checker that
misfires on a rephrasing is worse than a stale number in a sentence whose substance is correct.

A cheaper middle option: **stop stating the total**. "Four features carry no Examples table" is true,
useful, and cannot go stale from adding a fifth — the fragility is entirely in the "of the seven".

## Touches

`CLAUDE.md`, `scripts/acceptance-mutation/examples-cell-sites.test.ts`, and — only if the checker
option is taken — `scripts/agent-doc-check/`.

## Open questions

- Are there other stale totals of the same shape? This file states counts for framework-free modules
  (nineteen), hooks (thirteen), components (thirteen) and `ast-grep` rules (twenty-eight), each of
  which has the identical failure mode and at least one of which is checked (`agent-doc-check`
  verifies `rules/*.yml` are all named, though not that the _number_ is right).
- Does the "stop stating the total" option lose anything a reader relies on?
