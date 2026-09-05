---
name: barrel-mandatory-for-step-modules
title: Decide whether the e2e barrel should stay the mandated single import for step modules
created: 2026-09-02
---

## Context

Split out of `e2e-support-layer-shape-post-bdd` when its other half
(`re-audit-hand-written-e2e-residue`) was promoted. Kept separate because the two have different
owners: that one is `product`'s, and this one touches `rules/`, which belongs to **`architect`
alone**.

`features/e2e-helpers.ts` is a **pure re-export file** — no function bodies, and **64 names**
(58 when this was first measured on 2026-09-02; the dark-mode slice added the appearance helpers).
`rules/no-domain-imports-in-bdd-steps.yml` allowlists exactly `playwright-bdd`, `@playwright/test`
and `../e2e-helpers`, which makes the barrel the **mandated** single entry point rather than a
convenience.

**That allowlist was written when the helpers were one 468-line module.**
`screenplay-e2e-decomposition` has since split them into seven role modules with an acyclic layering
(`viewport` / `notepad` / `elements` / `questions` / `interactions` / `tasks` / `expectations`), and
the split never re-asked the question: with that structure in place, is funnelling every step module
through one 64-name surface still better than allowlisting `../screenplay/*` directly?

**The argument for changing it**: a step module importing `../screenplay/questions` states which
Screenplay role it depends on. Importing the barrel states nothing. There are now **10 step
modules**, all importing the barrel.

**The argument against**: the barrel's retention is exactly what keeps the allowlist from widening,
and a one-entry allowlist is easier to reason about than a glob. CLAUDE.md records the barrel as
what makes `e2e-helpers.ts` "the single mandated entry point rather than the conventional one" — the
mandate is the feature, not a side effect.

## Sketch

Cheap and decisive: widen the allowlist by one entry, repoint **one** step module to import its
screenplay roles directly, and read what it costs. Does the import list get more informative, or
just longer?

`architect` should also weigh the **third option** the original candidate raised: keep the barrel
for the hand-written specs (which legitimately want breadth — they reach across many roles per file)
while allowlisting `../screenplay/*` for step modules (which want specificity). That is two rules
rather than one, but the two consumers genuinely differ.

## Touches

`rules/no-domain-imports-in-bdd-steps.yml` and its fixture — **`architect` only**, and every rule
change here owes the standing bargain: a fixture proving the matcher, and a **live probe** against
the real tree proving the `files:` glob resolves. `features/steps/*.ts` if any is repointed.
CLAUDE.md's testing-structure section describes the mandate in detail and would go stale.

Note `npm run ast-grep:rules` gates that `files:` globs resolve, and that `node:fs`'s `globSync` does
**not** cross `/` where ast-grep's `*` does — so a `../screenplay/*` allowlist entry needs the
measurement CLAUDE.md describes rather than an assumption about which reader you get.

## Open questions

- **Is this worth changing at all?** "No change, and here is why, recorded next to the rule" is a
  legitimate and possibly the right outcome. The barrel works; the question is whether the mandate
  still earns itself after the decomposition.
- Does the allowlist deserve a **deletion trigger** the way this repo's ARIA reach-arounds do? If the
  barrel is retained deliberately, that reasoning should live beside the rule rather than only in
  CLAUDE.md — which is the same complaint `equivalence-rulings-live-in-commits-not-at-sites` was
  filed about, one layer over.
- Would widening the allowlist weaken what the rule actually catches? Its real job is stopping a step
  module importing `src/` or another step module; the barrel entry is incidental to that. Check
  before assuming a wider allowlist is a weaker rule.
