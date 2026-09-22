---
name: the-board-section-carries-three-claims-the-tree-refutes
title: Correct the three statements CLAUDE.md's Idea board section makes that the tree refutes
created: 2026-09-22
---

Raised by `coach` REVIEW on `the-idea-template-claims-the-whole-board`, 2026-09-22, as
recommendation N1. Two of the three were measured by `editor` AUDIT at that slice's closing gate.

## Situation

`CLAUDE.md` is auto-loaded into every session and every subagent. Its Idea board section carries
three statements that the tree does not support, each checked on 2026-09-22 against `main`.

**A template does not fail every identity check.** The section says a file in a flat lane is a
candidate "and a template fails every identity check". `identityFindings` in
`scripts/board-shape-hook/board-shape.ts` runs four checks. Copying the template into
`backlog/ideas/` and running the classifier reports **two** findings: `name` and `created` fail,
while `title` passes because the template carries one and no `status:` key is present. The verdict
the sentence supports — that a template does not belong in the lane — holds on those two.

**A roster-closing sentence sits two paragraphs below a roster that was deliberately opened.** The
section ends "That is the extent of the tooling." Before the same slice split that paragraph, the
demonstrative pointed at a four-sentence enumeration; it now points at one sentence about Prettier's
ignore list. The claim is true today, and it is the same completeness form the slice's own R13 ruled
out of the sentence two lines above it.

**The `ready/` artifact list names six kinds and reads closed.** It names `proposal.md`,
`assessment.md`, `design.md`, `spec.md`, `tasks.md` and `findings.md`. The folder that slice left in
`backlog/done/` holds three more: two numbered amendments and a retro. The same section names
`amendment-*.md` seven lines below the list, so the list contradicts its own section, and
`.claude/references/pipelines.md` states the kinds are an open set.

## Complication

None of the three is an oversight. A signed ruling put them out of reach and is still holding them
there.

That slice's R6 read the Idea board section end to end against the tree, named the one clause it
found false, and ruled "no other edit to that section is in this spec". The user signed it. R6 was
right for the work in front of it: a slice renaming a template should not sweep an auto-loaded
section on the strength of one defect found sideways.

Two consequences followed. No role acquired standing — `writer` edits what a signed spec names,
`editor` may not edit text a signed artifact supplied verbatim, and two of the three sit in exactly
such text. And when `editor` AUDIT measured the first of them false at the closing gate, the same
slice's amendment 2 had already declared itself the last round, so no amendment could carry it.

**The section is auto-loaded, which is what makes the holding cost accrue.** Six audiences read it
before doing anything, and a false statement there is acted on rather than merely read.

## Question

What reopens a section that a signed ruling closed, when the ruling was right and the section has
since been measured wrong?

## Answer

Shaped, not specified.

- **Correct the three statements**, each to what the tree supports rather than to a narrower
  universal. The measurements exist and are dated; the work is wording.
- **Keep what each sentence was doing.** The template sentence's verdict holds on the two checks
  that do fail. The tooling sentence's paragraph needs a referent its demonstrative can reach.
- **The artifact list is a census of an open set**, which `claim-discipline.md` already rules on.
  Whether it becomes a pointer or gains the missing kinds is the question, not whether it stays as
  it is.

## No-gos

- **No new rule about when a signed ruling may be reopened.** That question is real and it is
  larger than three sentences; this idea corrects the sentences.
- **No sweep of the rest of CLAUDE.md.** R6's reasoning against an opportunistic sweep still binds,
  and the three named here were each measured rather than suspected.

## Open questions

- **Does the artifact list want the three missing kinds, or a pointer?** Adding them restores a
  census of a set the pipelines reference calls open, so the list would go stale again at the next
  artifact kind. A pointer cannot rot, and the corpus has a precedent for preferring one.
- **What should the tooling paragraph's demonstrative point at?** Its referent was a four-sentence
  enumeration that a paragraph split left behind. Restoring the referent, rewriting the sentence and
  dropping it are all available, and which one keeps the paragraph's force is not obvious.
- **Is there a general instrument for a defect a signed ruling holds in place?** This one needed a
  new slice because the fallback barred an amendment and no role had standing. That is the correct
  outcome and also an expensive one for three sentences.
- **How were these found, and would the same method find more?** Two came from one `editor` AUDIT
  reading the section against the tree, which no pass does on a schedule. The third came from
  comparing a list against a folder. Neither is a checker.
