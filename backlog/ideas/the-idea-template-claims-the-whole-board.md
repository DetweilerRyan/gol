---
name: the-idea-template-claims-the-whole-board
title: Name the idea template for the lane it serves and correct the board statements that no longer hold
created: 2026-09-21
---

Split from `lanes-declare-their-own-item-shape`, ruled Epic 2026-09-21. This is the corpus child, and
it runs second — ruled by the user 2026-09-21. The executable half is
`one-item-shape-serves-every-lane`.

## Situation

`backlog/TEMPLATE.md` holds the shape of one lane's item while carrying a name that claims the whole
board. The basename is shared with `adr/TEMPLATE.md`, and `npm run reference-check` resolves a
citation by basename against the live tree, so a bare mention resolves against either file. A sweep on
2026-09-21 with `grep -rn 'TEMPLATE\.md'` found live citations in the auto-loaded index, the pipelines
reference, a skill that reads the file as a step, and a unit test, plus a bare one in the
decision-record tier.

The pipelines reference states that the board classifier tests position rather than basename, and
gives four properties as the argument.

CLAUDE.md's board section also states that the board has no gate, no checker, and no test beyond one
advisory Vale style. Measured 2026-09-22: the board-shape hook ships, `.claude/settings.json`
registers it on two write events, and its directory carries its own test files. The hook's own shell
states that it always exits zero because the board has no gate.

One further statement went stale when the executable half landed on 2026-09-21.
`.claude/skills/idea-assess/SKILL.md` tells the judging pass to stop when Layer 1 reports without
having measured, and enumerates the cases that existed when it was written. The classifier gained a
declarations-unavailable line, which is another such case and is named nowhere in that list.

## Complication

The name is wrong in two ways at once, and only one is a matter of taste. It claims the board for a
shape one lane uses, and it is ambiguous to the single checker that would catch a broken citation.

The rest arrives with the sibling. When a lane declares its own item shape, the prose stating that the
classifier tests position stops being true as written, and the argument it gives for that form stops
being the whole argument — the split is by axis, so the positional half survives for artifacts and
the lane half does not.

One clause of the board section is false already, independently of the axis split. The no-checker
claim describes a board the hook has not left unchecked since it shipped. The no-gate claim beside it
is true and deliberate rather than merely surviving, so the fix is a clause rather than a sentence —
deleting the whole line would discard a design fact the hook's own shell states about itself.

That one is a pre-existing defect this idea adopts rather than creates, folded in by the user
2026-09-21. What made it visible is the assessment of the sibling, which named it an orphan no child
owned. It is in scope here because it is the same file, the same section and the same cycle.

The lane declaration cannot carry the pairing, which is what makes a prose link a stopgap rather than
a preference. Measured 2026-09-22: `board-lanes.config.json` declares a flat lane as its shape alone,
`lane-declarations.ts` rejects a flat lane whose key count is not one, and
`schemas/board-lanes.schema.json` forbids additional properties. A probe adding a template key made
the classifier report every board path as declarations-unavailable rather than ignoring the key.
Widening the schema is a change to `scripts/`, which this cycle's own no-gos refuse.

None of this can be fixed from the cycle that makes the change. Corpus prose goes through the process
pipeline, and no role in a technical cycle may edit it.

## Question

What does the idea template become, and which corpus statements does the axis split oblige?

## Answer

Shaped. The first two bullets are user rulings taken 2026-09-21 during the parent's shaping.

- **The template is renamed for the lane it serves rather than for the board.** The template a lane's
  items are written from is a property of that lane, and the board's own documentation is where the
  pairing is stated. The lane declaration carries item depth and basename only, and ruled 2026-09-22
  it stays that way — so nothing machine-readable links a lane to its template, and the link is prose
  a reader has to follow.
- **The template cannot live inside the lane it serves.** A template at `<lane>/TEMPLATE.md` in a flat
  lane matches that lane's item shape exactly, so the classifier would check it as a candidate and it
  would fail every identity check.
- **The citation surface spans two pipelines, and the sweep is by hand.** Swept 2026-09-22: three
  live citations sit in prose this cycle may edit — the auto-loaded index, the pipelines reference,
  and a skill that reads the path as an executed step rather than as prose. Two sit under `scripts/`:
  the classifier's sidecar, which landed with the sibling, and its test, which names the path both as
  a string argument and inside the output string it asserts.
- **A one-off pipeline deviation carries the two `scripts/` citations.** Proposed by the user
  2026-09-22. A `coder` pass and then a `cleaner` pass run inside this process cycle, and `coach`
  REVIEW rules the deviation executed as the signed spec states rather than judging the craft, which
  is `cleaner`'s. The boundary holds because the role that owns `scripts/` does the work, rather than
  a corpus role reaching across it. The alternative is a follow-on technical slice for two string
  edits, which costs a required design pass and its own assessment while the tree names a file that
  does not exist.
- **The prose stating the positional rule is amended to name the axis split** rather than deleted. The
  positional argument survives for artifacts, and the evidence behind it is still the evidence.
- **The assessment skill's Layer-1 stop rule enumerates the never-measured cases and misses one.**
  The classifier gained a declarations-unavailable line, which is a second state in which Layer 1
  reports without having measured anything. A judge instructed to stop on the one it names has no
  reason to stop on the other.
- **The board section's no-checker clause is corrected, and the no-gate clause beside it is kept.**
  The board is unchecked no longer and ungated still, so the sentence needs splitting rather than
  rewriting. What replaces the false clause should say what the hook does and what it refuses to do,
  since a reader who learns only that a checker exists will expect it to fail something.

## No-gos

- **No classifier change.** The declaration format, the depth rule and the warning register belong to
  the sibling. The one-off `coder` pass this idea proposes is bounded to the two citations the rename
  strands, changes no behaviour, and is the only `scripts/` reach this cycle takes.
- **The sidecar counts are already fixed and are not re-proposed here.** This idea once carried two
  stale counts of the live module sidecars, in the auto-loaded index and in `doc-comments.md`'s
  rule 7. The slice `a-reader-finds-a-sidecar-without-an-inventory` landed on 2026-09-22 and
  resolved both by deleting the enumerations rather than by correcting the numerals, so no count
  remains to rot.
- **The epics lane is not created here.** `epics-promote-to-their-own-lane` owns that, and this idea
  states no opinion on what an epic's item file is called.
- **The decision-record tier's own template is not renamed.** Its name is ambiguous in the same way,
  and whether that matters is its own question rather than a rider on this one.

## Open questions

- **Where does the renamed template sit?** The board root keeps it in the class the sibling rules
  silent. A directory gathering templates reads as an undeclared lane unless the declaration says
  otherwise. A path named only inside the declaration is a third form.
- **Does the pairing ever become machine-readable, and what would justify the slice that does it?**
  The user ruled on 2026-09-21 that a lane declares its item's template, and the sibling then landed a
  schema that cannot carry one. Reinstating it is a technical slice of its own — a widened schema and
  validator — and nothing today measures what a prose-only link costs a reader.
- **For the retrospective: a user ruling was reversed during implementation and reported as a
  benefit.** The 2026-09-21 ruling that a lane declares its template was dropped by the sibling's
  design pass, which recorded the omission as a hazard dissolving. The orchestrating seat relayed it
  in those terms rather than as a reversal needing a fresh ruling, and the assessment of this file
  surfaced it a day later. What would have caught it at the design handoff is the durable question,
  and it belongs to the retro rather than to this idea's own scope.
- **The prose this cycle amends describes a classifier that already ships.** A corpus statement that
  is false between the two landings is the cost of this ordering, and how long that window stays open
  is the seat's to bound.
- **Nothing polices the rename, and the collision this idea cites as a reason is why.** A stale
  `TEMPLATE.md` citation still resolves, because `reference-check` matches by basename and the
  decision-record tier's own template is declined by No-go 3 — so the gate passes while sending the
  reader to the wrong form. Measured 2026-09-22. The citations have to be swept by hand and checked
  by reading, and a missed one fails silently rather than loudly.
- **The deviation needs specifying before it is executed, and `coach` owns that.** A spec item naming
  the two files, the bounded change, and the review it answers to is what the user signs. Executing a
  deviation nobody wrote down is the shape this corpus refuses everywhere else.
- **What precedent does the deviation set?** The parent epic was split because its reach crossed the
  technical and process pipelines, and this crosses the same line on purpose for two citations. The
  distinction worth recording is that the owning role does the work rather than a corpus role
  widening its own boundary — and whether that distinction generalises is the retro's question.
- **Does the rename land before or with the `scripts/` fix?** Within one slice the tree is consistent
  at the end either way, but a reader of an intermediate commit sees a dead citation. The ordering is
  the seat's to sequence and the spec's to state.
- **How is the amended positional prose kept honest?** The claim it replaces was argued from a
  measured instance. The replacement claims a split between two populations, and nothing measures the
  rate at which either grows.
- **Does the no-test clause fail too, or only the no-checker one?** The tests cover the hook rather
  than the board, so the clause is defensible read one way and misleading read the other. Ruling it
  needs a decision about what the sentence tells a reader, not a further measurement.
- **Does one false clause imply the board section wants a sweep?** The clause was found by assessing
  a sibling rather than by looking, and nothing has read that section against the tree since the hook
  landed. A second stale claim in the same paragraph would be found the same accidental way.
- **Does the ambiguity of the shared basename deserve its own candidate?** The sweep found a bare
  citation in the decision-record tier that resolves against either file, and this idea deliberately
  leaves it.
