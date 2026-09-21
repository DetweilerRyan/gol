---
name: the-idea-template-claims-the-whole-board
title: Name the idea template for the lane it serves and settle the corpus statements the axis split moves
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

## Complication

The name is wrong in two ways at once, and only one is a matter of taste. It claims the board for a
shape one lane uses, and it is ambiguous to the single checker that would catch a broken citation.

The rest arrives with the sibling. When a lane declares its own item shape, the prose stating that the
classifier tests position stops being true as written, and the argument it gives for that form stops
being the whole argument — the split is by axis, so the positional half survives for artifacts and
the lane half does not. A rationale sidecar landing beside the classifier makes the sidecar index
short by one.

None of that can be fixed from the cycle that makes the change. Corpus prose goes through the process
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
- **The sidecar index gains its entry** when the sibling's rationale sidecar lands.

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
- **Does the ambiguity of the shared basename deserve its own candidate?** The sweep found a bare
  citation in the decision-record tier that resolves against either file, and this idea deliberately
  leaves it.
