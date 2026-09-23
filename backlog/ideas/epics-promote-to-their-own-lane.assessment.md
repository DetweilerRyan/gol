---
name: epics-promote-to-their-own-lane
assessed: 2026-09-22
idea-blob: 8ab905f6932c9c5ef9e96309683c7e459eed795f
---

# Assessment — epics-promote-to-their-own-lane

`/idea-assess`, 2026-09-22. Kind: enabler-process (SAFe: architecture or infrastructure enabler). Disposition: Epic.

`LAYER1 backlog/ideas/epics-promote-to-their-own-lane.md: 7 checks, 0 findings`

Layer 1 also reported: lane `ideas`, SCQA shape, 94 lines, 0 depends-on mentions, assessment current. The record it found
current was the 2026-09-21 one this file replaces; that record carried no human ruling, so this replacement discards
none.

This is a re-assessment against a tree that moved, not against a file that moved. The idea's blob is unchanged from
2026-09-21. The lane-declaration tier landed after that assessment, and it is what changes the reading below.

The slice check passed. The file is not a verdict record, and it is not a self-declared index — its closing bullet
observes that the rule in force today would park it as one, which is a statement about the convention it proposes to
abolish rather than a claim that the file carries no work.

The kind check ruled checker-bearing: a `product` VERIFY pass has nothing to observe. The sub-kind is where this
assessment diverges from its predecessor. The substance of the diff lands in the instructions that run the gates, so
the label is enabler-process. A measured part of the diff does not: see Small. V and T were scored against the
checker-bearing column.

| Letter      | Score | Finding                                                                                               |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------- |
| Independent | 4     | Names one sibling and disclaims it by stated boundary; nothing unlanded blocks the reach.             |
| Negotiable  | 3     | Problem and solution both present; the Answer is five dated user rulings, so the shape reads decided. |
| Valuable    | 4     | Names the false board reading and cites a live dated instance; the cost is described, not measured.   |
| Estimable   | 4     | Bounds the reach at eight corpus surfaces, and the bound was short again on 2026-09-22.               |
| Small       | 1     | The reach spans two pipelines' work with no ordering named, and no single cycle can execute it.       |
| Testable    | 2     | Names the check it wants, records that it has no home, and names no reading that changes.             |

## Independent

The file names one related candidate, `epic-pipeline-runs-the-children.md`, which sat in `backlog/ideas/` when this
assessment was taken. It is named as a split sibling rather than a dependency, and the No-gos state the boundary in the
file's own words: this idea gives the epic a lane and a stated child sequence, and says nothing about who reads that
sequence or what a child's landing obliges. `pipelines.md`'s Epic section is declared untouched. The sibling is
therefore demonstrably optional to this reach, which is anchor 4.

It falls short of anchor 5 only because the file never states outright that it waits on nothing. The stated reach
supports that claim; nobody wrote it down.

One relation runs the other way and is worth recording, because it is what re-opened this assessment. The board's
lane-declaration tier — `board-lanes.config.json` at the repo root, its schema under `schemas/`, and
`scripts/board-shape-hook/` — had not landed when the 2026-09-21 record was written. It had landed by d6b4f9c on
2026-09-22. It does not block this idea. It enlarges it, and that enlargement is scored under Small.

## Negotiable

The file is a proposal with a well-stated problem. The Situation names the incident, the Complication states the
failure in board terms, and the Question asks what the new folder holds.

The Answer is marked "Shaped, per the user's 2026-09-21 direction" and its bullets are user rulings — the lane exists,
status is derived rather than stored, the folder holds what the board cannot derive, children are a sequence rather
than a set, and membership is stated twice on purpose. A ruled Answer reads as decided, which is anchor 3 rather than
anchor 4. That is the file being honest about its own authority rather than a defect: the rulings are dated and
attributed, so a reader can see which parts a design pass may still move.

Nothing in the file names what would rule the idea out on its own terms, which is what anchor 5 asks. The No-gos rule
out scope, not the idea.

## Valuable

Scored against the checker-bearing column. The failure class is a false board reading: a parked epic and a running epic
are the same text on disk, so `ls backlog/ideas/` reports identically for both, and the seat reconstructs which epics
are in flight by reading an index file against the other lanes.

The live instance is cited and dated. `backlog-board-redesign` was the first epic to run under the 2026-09-16 design,
and the file records that the seat promoted and landed its three children one at a time and hand-edited the index's
rows after each landing. That is anchor 4 — the class stated, with an instance.

It is not anchor 5, because the cost is described rather than measured. No count of hand edits, no instance of the
index going stale against the lanes, no time figure. The strongest warrant in the file is the user's 2026-09-17
reversal of their own 2026-09-16 ruling, which is authority rather than measurement, and these anchors do not read
authority as evidence.

## Estimable

The file bounds its own reach explicitly and dates the bound: an open question records that a check on 2026-09-21 found
eight corpus surfaces encoding the no-folder form, against the five the file first named. Seven are enumerated —
`definition-of-ready.md`'s epic disposition, its slice-check index exemption, its epic-trace ruling, CLAUDE.md's board
section, `pipelines.md`'s Epic section, `.claude/skills/idea-promote/` carrying no epic branch, and
`.claude/skills/idea-assess/SKILL.md`'s instruction that an Epic names its children and nowhere else. A grep for `epic`
over CLAUDE.md, `.claude/`, `scripts/` and `backlog/IDEA-TEMPLATE.md` at d6b4f9c on 2026-09-22 found each of the named
ones live, and `.claude/skills/idea-promote/SKILL.md` carried no match at all.

That is anchor 4 — enough to run the design-pass checklist. It is not anchor 5. Anchor 5 asks the file to name the
unknowns that could move the bound, and the six open questions it names are all design unknowns: what lives in
`epics/<name>/`, whether the frontmatter still needs `kind: epic`, how an epic completes, whether `ls backlog/epics/`
joins the board, what shape the derived status takes, and whether the membership check has a home. None of them is the
unknown that has actually moved the bound twice, which is the reach of the no-folder form itself.

Measured at d6b4f9c on 2026-09-22, the bound was short a third time. Four surfaces the file does not name sit outside
its eight:

- `board-lanes.config.json` declares three lanes — `ideas`, `ready`, `done`. `backlog/epics/` is undeclared.
- `scripts/board-shape-hook/board-shape.test.ts`, `run.test.ts` and `board-shape.property.test.ts` each pin the tracked
  config's three lanes in their own comments and fixtures.
- `scripts/board-shape-hook/lane-declarations.test.ts` reads the tracked `board-lanes.config.json` directly.
- CLAUDE.md's board section opens "a three-lane kanban of slices". That sentence sits inside a surface the file already
  names, so it is the mildest of the four.

`schemas/board-lanes.schema.json` is not in that list. Its `lanes` object takes additional properties and its folder
shape takes an item basename, so a fourth lane needs no schema edit — checked at d6b4f9c.

The 2026-09-21 record scored this letter 5. This assessment scores 4 on new evidence rather than on a different reading
of the same evidence. Per the article's bound E, treat the divergence as data about the anchors, not as noise.

## Small

The blocking letter, and the one the disposition rests on.

The design-pass checklist's `src/`-shaped triggers cannot fire on a process enabler, so the trigger that applies is
reach: the change spans three or more existing surfaces. It does, by the file's own enumeration plus the four added
under Estimable. The file names no ordering of steps over them.

The reach also crosses a pipeline boundary, which is what takes this past a split trigger and into a split. Measured at
d6b4f9c on 2026-09-22:

- `backlog/epics/` is undeclared in `board-lanes.config.json`, and `scripts/board-shape-hook/board-shape.ts` answers an
  undeclared lane with `undeclared lane, 0 checks -- board-lanes.config.json names no lane for this path`, delivered to
  the log stream and to no agent. So a corpus that instructs a promotion into `backlog/epics/<name>/` instructs a write
  the board hook silently declines to score. The config edit is inside this idea's own definition of done, not beside
  it.
- `.claude/agents/writer.md` line 47 states the role never writes `scripts/`, and its description names the board docs
  and `role-cycles.config.json` as its config reach. `board-lanes.config.json` is neither. The enabler-process cycle
  therefore cannot execute the config half or the four `scripts/board-shape-hook/` test edits that follow it.
- `.claude/references/pipelines.md` rules the mirror case explicitly: a substantive corpus change discovered inside a
  technical enabler "is a split signal — it is `enabler-process` work, not a side edit". This idea is that rule pointed
  the other way.
- `backlog/done/one-item-shape-serves-every-lane/design.md` records that `board-lanes.config.json` is not
  mutation-invariant, because a unit test reads it. So the config half carries a `scripts/`-scoped gate obligation the
  process cycle never runs.

That is anchor 1: the stated reach spans more than one slice's work, with no ordering named. Route to a split.

Two things this letter does not charge the file with. It has already taken one split — the Epic pipeline was ruled out
on 2026-09-21 and sent to `epic-pipeline-runs-the-children` — and the No-gos state that seam cleanly as plan versus
execution. And the membership checker is already correctly outside the reach: the file states it has no home, and that
a board-rendering script would owe `scripts/` its full quality bar.

## Testable

The lowest letter, and a revision matter rather than a spike one.

Scored against the checker-bearing column. The file names the check it wants — the set of children claiming an epic
against the set that epic names — and states in the same breath that the check has no home, because `backlog/` has no
checker. It names no command whose reading changes when the slice lands: not the reading today, not the reading
afterwards. That is anchor 2.

The readings exist and are unwritten, which is why this letter spikes nothing. At d6b4f9c on 2026-09-22 the board hook
answers a `backlog/epics/**` write with `undeclared lane, 0 checks`, and would answer with a scored `LAYER1` line once
the lane is declared. That is a before reading and an after reading, available today and named nowhere in the file.
`npm run agent-doc-check` and `npm run reference-check` both scan CLAUDE.md and `.claude/**/*.md` and would see a new
lane and any path the corpus half writes. `npm run prose-lint` covers the register. `npm run test:scripts` covers the
four board-hook test files. The file names none of them.

The two derived-status claims are the part with no reading at all. A status the seat prints in chat leaves no artifact
to check, and the file's own open question already says an unshaped report cannot be compared against last week's.
Whichever child inherits the derived status owes that shape before it can name a reading.

## What happens next

Split into child candidates. The parent stays in `backlog/ideas/` as an index, under the rule in force today — which is
the rule it proposes to abolish, exactly as its own closing bullet predicted.

Three children, each of which scores better than the parent on Small, and the first of which lifts Testable off
anchor 2:

1. **`declare-the-epics-lane`** — enabler-technical. Add the `epics` lane to `board-lanes.config.json` as a folder
   shape, and update the `scripts/board-shape-hook/` tests that pin three lanes. Fitness function, both readings
   nameable before it starts: a write under `backlog/epics/<name>/` reads `undeclared lane, 0 checks` today and a
   scored `LAYER1` line afterwards. No schema edit, per Estimable. Runs the technical-enabler cycle, which is the only
   one whose roles may write `scripts/` and the root config.
2. **`retire-the-no-folder-epic-rule`** — enabler-process. The corpus surfaces that state an epic gets no folder:
   `definition-of-ready.md`'s epic disposition, its slice-check index exemption and its epic-trace ruling,
   CLAUDE.md's board section including the three-lane sentence, `pipelines.md`'s Epic section,
   `.claude/skills/idea-assess/SKILL.md`, and the absent epic branch in `.claude/skills/idea-promote/SKILL.md`.
3. **`an-epic-states-its-child-sequence`** — enabler-process. The epic file's goal and ordered child sequence, the
   child frontmatter field that names its epic, and the shape of the derived status answer. The membership checker
   stays parked as an open question with no home.

Sequence matters and the parent index should state it: child 1 before child 2, so the corpus never instructs a write
the hook declines to score. Child 3 may run in either order after child 1.

Whoever writes the index should rule on one further split rather than absorbing it. The open question "how does an epic
complete" reaches a board question CLAUDE.md records as unruled — the `done/` lane's trigger and owner. Answering it
inside this work would settle a pre-existing question under cover of a lane change.

## The human ruling

None recorded.
