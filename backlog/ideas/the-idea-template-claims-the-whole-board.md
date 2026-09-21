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
gives four properties as the argument. CLAUDE.md's index of which sidecar pairs exist names the live
module sidecars, all of which sit under `src/`.

CLAUDE.md's board section also states that the board has no gate, no checker, and no test beyond one
advisory Vale style. Measured 2026-09-21: the board-shape hook ships, `.claude/settings.json`
registers it on two write events, and its directory carries three test files. The hook's own shell
states that it always exits zero because the board has no gate.

Two further statements went stale when the executable half landed on 2026-09-21. `doc-comments.md`'s
rule 7 counts the live module sidecars and CLAUDE.md's index counts the same three, and a fourth now
exists outside `src/`. `.claude/skills/idea-assess/SKILL.md` tells the judging pass to stop when
Layer 1 reports without measuring, and names the one case that existed when it was written; the
classifier now has a second.

## Complication

The name is wrong in two ways at once, and only one is a matter of taste. It claims the board for a
shape one lane uses, and it is ambiguous to the single checker that would catch a broken citation.

The rest arrives with the sibling. When a lane declares its own item shape, the prose stating that the
classifier tests position stops being true as written, and the argument it gives for that form stops
being the whole argument — the split is by axis, so the positional half survives for artifacts and
the lane half does not. A rationale sidecar landing beside the classifier makes the sidecar index
short by one.

One clause of the board section is false already, independently of the axis split. The no-checker
claim describes a board the hook has not left unchecked since it shipped. The no-gate claim beside it
is true and deliberate rather than merely surviving, so the fix is a clause rather than a sentence —
deleting the whole line would discard a design fact the hook's own shell states about itself.

That one is a pre-existing defect this idea adopts rather than creates, folded in by the user
2026-09-21. What made it visible is the assessment of the sibling, which named it an orphan no child
owned. It is in scope here because it is the same file, the same section and the same cycle.

None of this can be fixed from the cycle that makes the change. Corpus prose goes through the process
pipeline, and no role in a technical cycle may edit it.

## Question

What does the idea template become, and which corpus statements does the axis split oblige?

## Answer

Shaped. The first two bullets are user rulings taken 2026-09-21 during the parent's shaping.

- **The template is renamed for the lane it serves rather than for the board**, and the lane's own
  declaration names it. The template a lane's items are written from is a property of that lane.
- **The template cannot live inside the lane it serves.** A template at `<lane>/TEMPLATE.md` in a flat
  lane matches that lane's item shape exactly, so the classifier would check it as a candidate and it
  would fail every identity check.
- **The citations move with it**, including the one a skill executes as a step rather than reads as
  prose.
- **The prose stating the positional rule is amended to name the axis split** rather than deleted. The
  positional argument survives for artifacts, and the evidence behind it is still the evidence.
- **Two counts of the same three sidecars each gain a fourth.** CLAUDE.md's index of which pairs
  exist and `doc-comments.md`'s rule 7 both name three live module sidecars. The sibling landed a
  fourth, and the first outside `src/`. One cause, two surfaces, and nothing checks either.
- **The assessment skill's Layer-1 stop rule names one never-measured case, and there are now two.**
  The classifier gained a declarations-unavailable line, which is a second state in which Layer 1
  reports without having measured anything. A judge instructed to stop on the one it names has no
  reason to stop on the other.
- **The board section's no-checker clause is corrected, and the no-gate clause beside it is kept.**
  The board is unchecked no longer and ungated still, so the sentence needs splitting rather than
  rewriting. What replaces the false clause should say what the hook does and what it refuses to do,
  since a reader who learns only that a checker exists will expect it to fail something.

## No-gos

- **No classifier change.** The declaration format, the depth rule and the warning register belong to
  the sibling, and no role in this cycle may write `scripts/`.
- **The epics lane is not created here.** `epics-promote-to-their-own-lane` owns that, and this idea
  states no opinion on what an epic's item file is called.
- **The decision-record tier's own template is not renamed.** Its name is ambiguous in the same way,
  and whether that matters is its own question rather than a rider on this one.

## Open questions

- **Where does the renamed template sit?** The board root keeps it in the class the sibling rules
  silent. A directory gathering templates reads as an undeclared lane unless the declaration says
  otherwise. A path named only inside the declaration is a third form.
- **Running second means this cycle inherits a declaration naming the old template.** The sibling
  lands a lane declaration while the current name is still live, so the rename has to move the field
  as well as the file. The declaration is a board file rather than a script, so this cycle can reach
  it — what is unsettled is whether owning that field belongs here or back with the sibling.
- **The prose this cycle amends describes a classifier that already ships.** A corpus statement that
  is false between the two landings is the cost of this ordering, and how long that window stays open
  is the seat's to bound.
- **Does the rename need a transition at all?** Nothing outside this repo reads the file, and the
  checker that resolves citations by basename would red on a stale one rather than pass it — which
  makes the rename self-policing for prose, though not for the skill step that reads the path.
- **How is the amended positional prose kept honest?** The claim it replaces was argued from a
  measured instance. The replacement claims a split between two populations, and nothing measures the
  rate at which either grows.
- **Does the no-test clause fail too, or only the no-checker one?** The three test files cover the
  hook rather than the board, so the clause is defensible read one way and misleading read the other.
  Ruling it needs a decision about what the sentence is telling a reader, not a further measurement.
- **Does one false clause imply the board section wants a sweep?** The clause was found by assessing
  a sibling rather than by looking, and nothing has read that section against the tree since the hook
  landed. A second stale claim in the same paragraph would be found the same accidental way.
- **Does the ambiguity of the shared basename deserve its own candidate?** The sweep found a bare
  citation in the decision-record tier that resolves against either file, and this idea deliberately
  leaves it.
