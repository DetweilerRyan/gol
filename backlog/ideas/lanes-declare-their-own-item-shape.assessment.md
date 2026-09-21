---
name: lanes-declare-their-own-item-shape
assessed: 2026-09-21
idea-blob: 4bb05c815bad5884609c5c943e9327c1dad67e88
---

# Assessment — lanes-declare-their-own-item-shape

`/idea-assess`, 2026-09-21. Kind: epic (SAFe: enabler epic). Disposition: Epic.

`LAYER1 backlog/ideas/lanes-declare-their-own-item-shape.md: 7 checks, 0 findings`

Layer 1 also reported: lane `ideas`, SCQA shape, 163 lines, 0 depends-on mentions, no prior assessment record.

The slice check passed. The title states work rather than a verdict, and the file does not say of itself that it is
not work.

The kind check ruled checker-bearing: a `product` VERIFY pass has nothing to observe, because the finished state is
what `scripts/board-shape-hook/`'s classifier prints. V and T were scored against the checker-bearing column. The
sub-kind discriminator did **not** resolve to one label, and that is the Epic finding rather than a note. The
executable half lands in `scripts/` and in a new board data file, which is `enabler-technical`; the template rename
and its citation sweep land in the instructions that run the gates, which is `enabler-process`. The file's own last
Open question raises exactly that and leaves it open. `.claude/references/pipelines.md` rules a substantive corpus
change discovered inside a technical enabler a split signal rather than a side edit, so the two halves are two
slices under a rule already in force.

| Letter      | Score | Finding                                                                                                  |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------- |
| Independent | 4     | Names two sibling candidates and disclaims each by a stated boundary; neither blocks the reach.          |
| Negotiable  | 3     | Problem and solution both present; seven of the nine Answer bullets are dated user rulings.              |
| Valuable    | 4     | Names the false reading and cites live dated instances; the main failure class has no instance yet.      |
| Estimable   | 5     | Bounds the reach at the named modules, the citation sweep and a new sidecar, and names nine unknowns.    |
| Small       | 2     | Reach trips two design-pass triggers and crosses the technical/process pipeline line; no ordering named. |
| Testable    | 4     | Names the classifier's printed lines as the check, with a reading today and a reading afterwards.        |

## Independent

Score 4. The file names two sibling candidates, both of which sat unlanded in the `ideas` lane on 2026-09-21:
`epics-promote-to-their-own-lane` and `the-retrospective-deletes-evidence-a-landed-ruling-cites`. It disclaims each
by a stated boundary rather than by assertion. The Answer's closing bullet rules that declaring the lanes that exist
has value before the epics lane arrives, and calls that lane the first consumer of the mechanism rather than its
justification. The No-gos put the epics lane's creation outside the reach and state no opinion on an epic item
file's name. The retrospective candidate is cited as the general question this file declines to re-rule.

The one dependency that has landed is R1 of `backlog/done/the-board-hook-misfits-per-item-artifacts/spec.md`, whose
positional ruling this file proposes to split by axis rather than overturn. Layer 1 counted 0 depends-on mentions,
consistent with that reading.

Not 5: the file argues its independence from the epics lane rather than simply stating that it waits on nothing, and
the argument turns on a judgement about which population grows faster.

## Negotiable

Score 3. Problem and solution are both present and clearly separated across Situation, Complication and Question.
The Answer carries nine bullets, of which seven record an explicit user ruling dated 2026-09-21 — the axis split,
the depth declaration, the finding/warning register, the template declaration and rename, the silent board root
(marked provisional), the sidecar placement, and the value of declaring lanes before the epics lane exists. A
solution held in seven dated rulings reads as decided rather than as offered.

The No-gos state what is out of scope — no gate, the artifact axis untouched, the epics lane not created here — but
scope boundaries are not the same as what would rule the idea out on its own terms, which is what a 5 asks for.

The Open questions are the counterweight and are why this is not a 2: the file names what would reopen the silent
root, what is unsettled about a missing or malformed declaration file, and what it is knowingly leaving undetectable.

## Valuable

Scored against the checker-bearing column. Score 4.

The false reading is named precisely: an item file the positional test does not recognise draws no checks and prints
the same refusal line a per-item artifact draws, so a missed item is indistinguishable from a correctly skipped spec
in the log stream. The converse is named too — an item file that happens to carry the recognised basename draws the
full candidate checks and reports sections it never owed.

Live dated instances are cited rather than asserted. Measured 2026-09-21: every item file in the `ready` and `done`
lanes is named `proposal.md`, so one shape serves all three lanes today. Measured 2026-09-21: a probe at
`backlog/ideas/.zz-probe-dot.md` drew the same seven checks and five findings its undotted control drew. A sweep on
2026-09-21 with `grep -rn 'TEMPLATE\.md'` found live citations of a basename that is not unique in the tree. The
board root reporting its own filename where a lane name belongs is a false reading present in the rule in force, and
the proposal removes it.

Not 5: the failure class the mechanism is chiefly built against — a lane whose items owe a different shape — has no
live instance, because no such lane exists yet. The file says so itself. The cost of that class is described rather
than measured.

## Estimable

Score 5. The file bounds the reach at named surfaces rather than at areas. `scripts/board-shape-hook/board-shape.ts`
is named with the three mechanisms it would change, by function. A new board data file holds the declarations. A new
`<module>.meta.md` sidecar holds the rationale. The citation sweep is enumerated: the auto-loaded index, the
pipelines reference, a skill, the hook's own unit test, and a bare mention in the decision-record tier.

It also names the unknowns that could move that bound, which is what separates 5 from 4. Nine Open questions carry
them, including the behaviour when the declaration file is missing or malformed, where a lane's template sits once
the lane tree is itself classified, the three surfaces that would then state the lane set with nothing checking them
against each other, and the fact that a sidecar under `scripts/` would be the first of its tier.

## Small

Score 2, and this is the blocking finding.

The reach trips two of CLAUDE.md's design-pass triggers. It creates new modules: a reader and validator for the
declaration input, which the file rules must be validated rather than trusted, plus the first `scripts/` module
sidecar. It spans three or more existing surfaces: the classifier, the shell that owns channel discipline for a
warning register that is neither counted nor delivered, and the new declaration file. No ordering of
behavior-preserving steps is named anywhere in the file.

The heavier half of the finding is the pipeline boundary. The executable change is technical enabler work. The
template rename, its citation sweep, the per-item-artifact prose stating the positional rule, and the sidecar index
entry are corpus edits, which CLAUDE.md's Conventions route through the process pipeline and which
`.claude/references/pipelines.md` names a split signal rather than a side edit. One slice cannot carry both, and no
role in either cycle may make the other half's edits.

The epic test asks whether splitting produces children that each score better. It does: each child's reach falls
inside one pipeline, and each bounds to a file set a design pass can run the checklist over. The children do not
inherit this score.

## Testable

Scored against the checker-bearing column. Score 4.

The check is the board-shape hook's own printed output, and the file names both readings for two cases. An
unrecognised item file reads today as the refusal line a per-item artifact draws; afterwards it reads as a warning
naming its own cause, in a register that already exists — uncounted in the tally and undelivered to the editing
role. A path directly under the board root reads today as a lane named after its own filename; afterwards it is
classified before the lane lookup and prints nothing.

The file is honest that the warning buys a diagnosable line rather than an interrupt: the file still draws no checks
and the editing role is still not told.

Not 5: the confident-zero hazard is raised rather than ruled. The Open question asking what the classifier does when
its own declaration file is missing or malformed names `scripts/vale-fixture-check/` as the precedent for refusing
to report a clean run it cannot substantiate, and stops there. Until that is ruled, the check has a state in which
it reports nothing for a reason nobody chose.

## What happens next

The parent stays in the `ideas/` lane as an index and splits into two children. Neither child is written yet.

- **A technical child** — the classifier reads lane declarations from a board data file rather than from a constant,
  adds the depth rule and the warning register, rules the missing-or-malformed-declaration behaviour against the
  `scripts/vale-fixture-check/` precedent, and lands the rationale sidecar beside the module. Expected kind:
  `enabler-technical`. It carries the deferred silent-root ruling and the basename-mismatch residue as its own open
  questions.
- **A process child** — renames `backlog/TEMPLATE.md` for the lane it serves, sweeps the citations the file
  enumerates, amends the prose stating the per-item-artifact rule to name the axis split, and adds the fourth entry
  to CLAUDE.md's index of which sidecar pairs exist. Expected kind: `enabler-process`.

The two children name one shared fact — the template's name — so the seat orders them rather than running them
concurrently. Each child is assessed on its own before promotion.

## The human ruling

Ruled 2026-09-21.

Independent — agree
Negotiable — agree
Valuable — agree
Estimable — agree
Small — agree
Testable — agree
