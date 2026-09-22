---
name: a-stopping-condition-is-scoped-to-the-diff
title: Rule that an amendment's stopping condition is a property of the diff, not the corpus
created: 2026-09-22
---

Raised by `coach` REVIEW against itself on
`slice/a-reader-finds-a-sidecar-without-an-inventory`, 2026-09-22 — "my own defect, carried out
rather than buried."

## Situation

`.claude/references/pipelines.md` requires a second amendment on one slice to state a stopping
condition, a falsifier and a fallback. The stopping condition is defined there as "a set of
properties a reader can check without re-measuring". The seat does not run a further round
without all three.

`handoffs.md` separately rules that a pre-existing finding the slice did not create is out of
scope by default.

## Complication

**Those two rules can contradict each other, and nothing says which wins.** A stopping condition
written as a property of the **corpus** silently overrides the out-of-scope default, because it
makes closure depend on facts the slice did not author and cannot be expected to repair.

**Measured on that slice, 2026-09-22.** Amendment 2 carried four conditions. Two were written
corpus-scoped:

- Condition 3 required one article to carry "no two numbers that disagree". A heading in that
  file reads "Four things that make a rule inert" over five bullets — byte-identical on `main`,
  untouched by the slice.
- Condition 4 required every surviving sidecar read trigger in an instruction file to be bound to
  one named ruling. A header line in a different article, also pre-existing, reads as unbound
  under one of two available interpretations.

**So a condition written to prove the slice's own work complete was instead blocked twice by
defects the slice did not cause.** `coach` ruled both discharged against the diff, stated that its
own wording had been too wide, and wrote amendment 3's conditions diff-scoped — one of them
concretely, as a `git diff --stat` naming two files and no others.

**The failure is quiet in the dangerous direction.** A corpus-scoped condition reads as rigour. It
takes a careful reader comparing it against `handoffs.md` to notice it has widened the slice's
obligation past what anyone granted, and the person best placed to notice is the one who wrote it.

## Question

Where should the rule live that an amendment's stopping condition is a property of its own diff —
and does the same constraint reach the falsifier and the fallback?

## Answer

Shaped, not specified.

The constraint is one clause: a stopping condition, and whatever else an amendment states as a
closure test, is checked against the amendment's own diff rather than against the corpus. A
finding that is pre-existing discharges the condition rather than blocking it, and routes to the
board per `handoffs.md`.

Amendment 3's condition 4 is the worked form already in the tree — a condition naming a command
whose output a reader checks, rather than a property of a file that anyone may have broken.

## No-gos

- **Does not change what an amendment must carry.** The three-part requirement stands; this
  constrains how one of the three is written.
- **Does not reach a spec's own acceptance criteria.** A spec may legitimately state a corpus
  property as its goal. The narrowing is about closure tests on an amendment.
- **Does not re-open either slice ruling that produced it.** Both conditions were discharged
  against the diff on the record.

## Open questions

- **Which file carries it?** `coach.md` is where the authoring duty sits, which argues for keeping
  the constraint beside it. `pipelines.md` is where the three-part requirement is stated, which
  argues for putting the narrowing with the thing it narrows. Splitting it across both is the
  restatement `prose.md` prohibits.
- **Does it reach the falsifier and the fallback too?** A falsifier naming a corpus property has
  the same defect — it can fire on something the slice did not cause. Unmeasured, and no instance
  has occurred.
- **Is a worked example owed?** The rule is short enough to state flatly, but the defect is
  subtle enough that a reader may not see why. Amendment 2's conditions 3 and 4 are the instance,
  and they sit in a board folder the retrospective deletes.
