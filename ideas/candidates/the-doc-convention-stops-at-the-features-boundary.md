---
name: the-doc-convention-stops-at-the-features-boundary
title: Make product responsible for interface documentation under features/
created: 2026-09-06
---

## Context

`jsdoc-standing-rule` made the interface-documentation convention a standing
duty for `coder`, `cleaner` and `architect`. It stops at `features/`, and that
boundary is an artefact of role ownership rather than of the convention.

**The mechanics already reach there.** `architect` measured it during that
slice: the seven `features/screenplay/*.ts` modules export **97 symbols** the
step modules import — genuine cross-file call sites, the exact shape hover
exists for. Both figures re-counted 2026-09-10 and unchanged. `coder.md`'s own
workflow has it _reading_ `features/steps/*.ts` to learn what the contract
asserts, which is precisely the read a sufficient hover replaces. And
`rules/no-dead-doc-on-annotated-return-literal.yml` is unscoped by path, so it
**already fires in `features/`** — the guard is there while the duty is not.

**The duty is `product`'s. Ruled by the user on 2026-09-10.** That is a user
ruling, not a judgement execution may overturn: `features/**` is `product`'s
manifest in both modes, so the role that authors the contract also documents
it.

**The second half of the ruling is why the duty is more than tidiness.** JSDoc
on the step modules is **part of the contract `product` hands the implementing
roles**, not documentation added beside it. `coder` reads those modules to
learn what the contract asserts; a hover that answers the question is the
contract stating its own expectations at the point of use. `architect` then
ratifies that documentation in CONTRACT mode, alongside the Gherkin it already
reviews — so the contract is reviewed as one artefact rather than as a
`.feature` with an unreviewed executable half.

### What this reverses

This candidate previously sequenced itself **behind** a pending ownership
slice — the stated intent that `features/screenplay/*` and `features/steps/*`
move to `architect` and `coder`, freeing `product` from writing code at all.
The argument was that the duty follows the owner, so assigning it to `product`
now writes a `product.md` clause the ownership slice then has to unwind.

That argument is not wrong. It is outranked, and the reasons are recorded here
so a later reader does not re-derive the old sequencing and think it still
holds:

- The ownership slice **has no idea file**. It is a stated intent, and
  `ideas/todo/intent-driven-layout.md` does not contain it. A gap that waits on
  an unfiled slice waits indefinitely.
- The unwind cost is **one clause in one role file**, against an unbounded
  wait. If ownership does move later, the duty moves with it.
- The guard already fires in `features/` today, so the directory is currently
  policed for one failure mode and unguided about the rest.

## Sketch

Three role-facing edits, one backfill, and one stale pointer to fix. None of
them depends on the ownership question.

1. **`doc-comments.md` — widen the scope and name `product`.** Three touch
   points in that file:
   - the **Audience** line, which names `coder`, `cleaner`, `architect` — add
     `product`.
   - the **Read when** list, whose comment-block trigger is scoped to `src/` or
     `scripts/` — add `features/`.
   - the Scope section's paragraph about `features/**` TypeScript, which
     currently records the missing duty as a gap. It flips: `product` authors
     under Rules 1–9 in `features/**`, `architect` ratifies in CONTRACT mode.
     Write it in the same shape as the `hardener` paragraph beside it, which
     already states a bound-role-and-how case rather than a gap.

2. **`product.md` — the read trigger and the duty.** Two separate additions:
   - a **read trigger** for `.claude/agents/articles/doc-comments.md`, phrased
     as `coder.md`'s is: before writing or moving a comment block, and before
     opening a file just to learn what one of its exports does.
   - the **duty**, at two anchors. The `Owns` bullet for `steps/*.ts` gains the
     statement that the module's documentation is part of the contract the
     implementing roles consume. SPECIFY workflow step 5 ("Write the step
     modules") gains the authoring instruction, so the duty lands where the
     work happens rather than only in a list of what the role owns.

3. **`architect.md` Contract mode — a fifth question.** The four questions
   today are observability, missing affordance, altitude, and what the runner
   compiles a scenario into. Add: **does the contract document itself?** Review
   the JSDoc on the drafted step and screenplay modules, and any
   `<module>.md` / `<module>.rationale.md` sidecar the draft carries, against
   `doc-comments.md`'s rules — the interface/implementation split, the hover
   budget, the information test, and the sidecar tier's own placement rule.
   Keep the mode's existing boundary intact: `architect` writes no code and no
   spec here, so a documentation finding goes back to `product` exactly as an
   altitude finding does.

4. **Backfill `features/screenplay/*.ts`.** The 97 exported symbols are the
   surface. Counted 2026-09-10, three modules carry 69 of them —
   `features/screenplay/interactions.ts`, `features/screenplay/questions.ts`
   and `features/screenplay/elements.ts` — so start there. Rule 5's
   information test governs: where a summary would restate the function name,
   write nothing.

   **A correction this candidate carried until now:** it described the
   highest-traffic modules as the `_shared` ones. There is no `_shared`
   directory under `features/`. That name comes from
   `ideas/todo/intent-driven-layout.md`'s **proposed** tree, and it was read
   back as a description of the live one.

5. **Fix CLAUDE.md's pointer line for `doc-comments.md`**, which scopes the
   trigger to `src/` and `scripts/`. It goes stale the moment the article's
   scope widens, and CLAUDE.md is auto-loaded into every session — so a stale
   scope there outranks a stale scope anywhere else.

## Touches

`.claude/agents/articles/doc-comments.md`, `.claude/agents/product.md`,
`.claude/agents/architect.md`, CLAUDE.md's Documentation map pointer, and
`features/screenplay/*.ts` for the backfill.
`ideas/todo/intent-driven-layout.md` needs its own correction regardless of
this slice — see the open question below.

Note the backfill would be the first time this convention is applied to code
`product` authored, which is a useful test of whether the convention is
genuinely about interfaces or was quietly shaped around `src/`'s idioms.

## Open questions

- **What form does the duty take in `features/steps/*.ts`, where there are no
  exports at all?** Counted 2026-09-10: **zero** `export` declarations across
  all twelve step modules — they register steps by side effect. So
  `doc-comments.md`'s Rule 8, which scopes the convention to exported
  declarations and interface/type members, gives that directory **no surface**.
  The duty there has to mean something else: a module-level block stating what
  contract the module carries, a block per step callback, or both. This is an
  **extension** of the convention rather than an application of it, and it is
  the single largest open decision in the slice — the user's direction names
  `steps/` specifically, so it cannot be answered by scoping the directory out.
  Note the asymmetry: `features/screenplay/*.ts` needs no such extension, since
  its 97 exports are ordinary surface.
- **Does the convention survive contact with screenplay code?** Screenplay
  modules are deliberately thin and name-driven; if a summary would restate the
  function name, Rule 5's information test says write nothing, and the backfill
  could turn out to be mostly a no-op. That is a fine outcome, but it changes
  the slice's size from "97 symbols" to something much smaller, and nobody has
  sampled it. Sample before sizing.
- **Should `features/*.e2e.spec.ts` be in scope at all?** Specs are leaves —
  nothing imports them — so hover never fires on their exports and the
  convention has no purchase. Probably out, but the article should say so
  rather than leave it ambiguous, since the widened scope otherwise reads as
  covering the whole directory.
- **`ideas/todo/intent-driven-layout.md` is stale where it matters here.** It
  still describes `.feature` files as colocated with `.steps.test.ts(x)`, a
  layer `delete-step-test-layer` removed, and its target tree contains no
  `screenplay/` or `steps/` directory. It is no longer a blocker for this
  candidate, but it wants reconciling with the tree before it is promoted.
