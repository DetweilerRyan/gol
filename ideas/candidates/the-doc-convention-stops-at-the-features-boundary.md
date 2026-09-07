---
name: the-doc-convention-stops-at-the-features-boundary
title: Extend the interface-documentation convention to features/, once its ownership is settled
created: 2026-09-06
---

## Context

`jsdoc-standing-rule` made the interface-documentation convention a standing
duty for `coder`, `cleaner` and `architect`. It stops at `features/`, and that
boundary is an artefact of role ownership rather than of the convention.

**The mechanics already reach there.** `architect` measured it during that
slice: the seven `features/screenplay/*.ts` modules export **97 symbols** the
step modules import — genuine cross-file call sites, the exact shape hover
exists for. `coder.md`'s own workflow has it _reading_ `features/steps/*.ts` to
learn what the contract asserts, which is precisely the read a sufficient hover
replaces. And `rules/no-dead-doc-on-annotated-return-literal.yml` is unscoped
by path, so it **already fires in `features/`** — the guard is there while the
duty is not.

What was not done is codifying the duty, for one honest reason: the direction
that authorised the role-file amendments named `coder`, `cleaner` and
`architect`, and `features/**` is `product`'s manifest.

**The user has since directed that the convention should apply at `features/`
too.** The open part is not _whether_ but _whose duty_, and that turns on a
pending ownership question: the stated intent is that a future acceptance slice
moves `features/screenplay/*` and `features/steps/*` ownership to `architect`
and `coder`, freeing `product` from writing code at all. Under that outcome the
duty follows the owner and needs no separate rule — which is the argument for
waiting rather than for skipping.

**One thing to state plainly so this candidate does not rest on a misreading.**
`ideas/todo/intent-driven-layout.md` is the slice that ownership shift is
associated with, and **as currently written it does not say so.** Its only
ownership ruling concerns `tasks.md` being `architect`'s dispatch plan. It is
also stale where it matters here: it still describes `.feature` files as
colocated with `.steps.test.ts(x)` — a layer `delete-step-test-layer` removed —
and its target tree contains no `screenplay/` or `steps/` directory at all. So
the direction recorded here is the user's, not that file's, and **that todo
wants reconciling with the tree before it is promoted**, independently of this
idea.

## Sketch

Sequenced behind the ownership slice, not in front of it:

1. Settle who owns `features/screenplay/*` and `features/steps/*`. If it
   becomes `architect` and `coder`, their existing amendments already bind and
   this idea reduces to deleting a scope caveat.
2. Backfill `features/screenplay/*` under the existing convention — the 97
   exported symbols are the surface, and the `_shared` screenplay modules are
   the highest-traffic of them.
3. Widen `doc-comments.md`'s scope statement, which currently names `src/` and
   `scripts/`.

Doing step 3 first, against today's ownership, would write a `product.md` duty
that the ownership slice then has to unwind — which is the specific cost of not
waiting.

## Touches

`.claude/agents/articles/doc-comments.md`'s scope section; `features/screenplay/*.ts`
and `features/steps/*.ts` for the backfill; whichever role file ends up owning
them. `ideas/todo/intent-driven-layout.md` needs its own correction regardless.

Note the backfill would be the first time this convention is applied to code
`product` authored, which is a useful test of whether the convention is
genuinely about interfaces or was quietly shaped around `src/`'s idioms.

## Open questions

- **Does the ownership slice actually exist yet?** It is a stated intent, not a
  filed idea, and `intent-driven-layout` does not contain it. This candidate is
  blocked on something with no home — which is itself worth fixing, since a
  dependency that exists only in conversation is the thing the idea board is
  for.
- **Does the convention survive contact with screenplay code?** Screenplay
  modules are deliberately thin and name-driven; if a summary would restate the
  function name, rule 5's information test says write nothing, and the backfill
  could turn out to be mostly a no-op. That is a fine outcome but changes the
  slice's size from "97 symbols" to something much smaller, and nobody has
  sampled it.
- **Should `features/*.e2e.spec.ts` be in scope at all?** Specs are leaves —
  nothing imports them — so hover never fires on their exports and the
  convention has no purchase. Probably out, but it should be said rather than
  left ambiguous.
- **The unscoped rule is already live there.** It fires today, before any duty
  exists. That is defensible (a dead doc is a defect wherever it stands) but it
  does mean `features/` is currently guarded against one failure and unguided
  about the rest.
