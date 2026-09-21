---
name: one-item-shape-serves-every-lane
title: Let the board classifier read each lane's item shape from a declaration rather than one hardcoded form
created: 2026-09-21
---

Split from `lanes-declare-their-own-item-shape`, ruled Epic 2026-09-21. This is the technical child,
and it runs first — ruled by the user 2026-09-21. The corpus half is
`the-idea-template-claims-the-whole-board`.

## Situation

`scripts/board-shape-hook/board-shape.ts` classifies a written board file with three mechanisms.
`isAssessmentRecordPath` refuses an assessment record by basename. `isCandidatePath` then tests
position: two board-relative segments, or three ending in `proposal.md`. `assessmentSummary` reads the
lane as a literal, so a stale blob is a finding in `ideas` and a frozen record everywhere else.

Measured 2026-09-21: every item file in the `ready` and `done` lanes is named `proposal.md`, and no
lane holds a divergent item shape. One shape serves all three lanes.

R1 of `backlog/done/the-board-hook-misfits-per-item-artifacts/spec.md` ruled the discriminator
positional, and listed "a new lane directory needs no literal" among the properties arguing for that
form. Its measured evidence is `retro.md`, an artifact kind that landed outside every census.

## Complication

The positional test answers which files are candidates. It cannot answer what shape each candidate
owes. Those were one question while every lane owed the idea shape.

A lane whose items owe a different shape fails in both directions. An item file the positional test
does not recognise draws no checks and prints the same refusal a per-item artifact draws, so a missed
item reads exactly like a correctly skipped spec. An item file that happens to carry the recognised
basename draws the full candidate checks and reports missing sections it never owed.

A second reading is already wrong today rather than on the day a lane diverges. The lane is read as
the first board-relative segment, so a path directly under the board root reports its own filename
where a lane name belongs.

R1's evidence does not reach either case. Artifact kinds are an open population arriving unannounced,
which is what positional covering protects. Lanes are a closed population, and each has so far
arrived with a user ruling behind it. The cost of a literal scales with how often a population grows.

## Question

What does a lane declare about its own items, and what does the classifier do with a board path no
lane declares?

## Answer

Shaped. Every bullet is a user ruling taken 2026-09-21 during the parent's shaping.

- **Split R1's scope by axis rather than overturning it.** The lane axis becomes literal. Inside a
  declared lane the artifact test stays positional, so an artifact kind nobody has named yet is still
  covered on the day it lands.
- **A lane declares its item's depth as well as its basename.** A flat lane holds its item at
  `<lane>/<slug>.md` and a folder lane at `<lane>/<item>/<basename>`. Depth is what makes a mismatch
  mechanical: a folder in a flat lane, or a flat file in a folder lane, is detectable with no artifact
  name written anywhere.
- **A finding is reserved for a declared item in a declared lane.** Everything else reports a warning
  that is neither counted in the tally nor delivered to the editing role, so the envelope keeps firing
  on the finding count exactly as it does today.
- **The declarations live in a board data file rather than a constant in the script**, and the script
  validates that input rather than trusting it.
- **A path directly under the board root is its own class, and it stays silent**, provisionally. The
  segment count classifies it before the lane lookup is reached.
- **The rationale lands in a sidecar beside the module at landing**, not only in a board file. A board
  file reaches the done lane and the retrospective deletes it, so a ruling whose argument lives only
  there loses that argument when the board clears.

## No-gos

- **No gate.** Nothing here can fail a run, and the hook continues to exit zero. A warning that
  hardens into a finding is a separate ruling.
- **The artifact axis is untouched.** Which files inside an item folder are artifacts stays
  positional, and no artifact basename earns an entry anywhere.
- **No corpus prose.** The template rename, the citation sweep, the per-item-artifact rule's wording
  and the sidecar index belong to the sibling, and no role in this cycle may make those edits.
- **The declaration file is not hidden, and a dotfile would not hide it.** Measured 2026-09-21: a
  probe at `backlog/ideas/.zz-probe-dot.md` drew the same seven checks and five findings its undotted
  control drew. Rewriting the trigger is closed too — a conditional hook holds exactly one permission
  rule with no operator for negating it, and its patterns follow gitignore syntax, under which a
  wildcard matches a leading dot by design.

## Open questions

- **What does the classifier do when its own declaration file is missing or malformed?** Reading that
  state as every lane declared, or as every lane undeclared, are both wrong.
  `scripts/vale-fixture-check/` carries the precedent for a checker that refuses to report a clean run
  it cannot substantiate.
- **A basename mismatch at the declared depth stays undetectable.** A file at
  `<lane>/<item>/<basename>` that is not the declared item reads as an ordinary per-item artifact,
  which is what an artifact table would catch and what R1 refused. One narrowing without a table: on a
  write to a non-item file in a folder lane, test whether the declared item file exists in that folder
  at all.
- **The silent root is a knowing inconsistency.** Every other undeclared position warns; the root
  alone reports nothing, so a stray file landing there stays invisible. Declaring the permitted root
  files would put the root under the same rule and make the declaration file quiet by declaring
  itself rather than by exemption.
- **Three surfaces would state the lane set** — the auto-loaded index, the pipelines reference, and
  the declaration file. Two statements of one fact earn their duplication only when a disagreement is
  detectable, and nothing checks these against each other.
- **Does a machine-read declaration change a stated property of the board?** CLAUDE.md records that
  the board has no gate, no checker, and no test beyond one advisory style.
- **A sidecar under `scripts/` would be the first of its tier.** Measured 2026-09-21: the three live
  module sidecars all sit under `src/`, and `.vale.ini` carries a section for that tree with no
  counterpart for `scripts/`. The `.meta.md` half is exempt either way by the last-wins section at the
  end of that file, so nothing is blocked; the instruction half of that tier is unlinted there.
- **Running first means the declaration names a template the sibling then renames.** The two children
  name one shared fact, and this one reaches it while the old name is still live. The declaration is a
  board file rather than a script, so the sibling can carry that edit — which makes the seam a
  question of which cycle owns the field rather than of whether it can be reached.
