---
name: epics-promote-to-their-own-lane
assessed: 2026-09-23
idea-blob: eb858bf934cf2e1bada950be4da82cc86bf7d83d
---

# Assessment — epics-promote-to-their-own-lane

`/idea-assess`, 2026-09-23. Kind: enabler-process (SAFe: architecture or infrastructure enabler). Disposition: Epic.

`LAYER1 backlog/ideas/epics-promote-to-their-own-lane.md: 7 checks, 1 findings`

Layer 1 also reported: lane `ideas`, SCQA shape, 127 lines, 0 depends-on mentions, assessment stale. The staleness is
the one finding. The record it found stale is the 2026-09-22 one this file replaces; that record carried no human
ruling, so this replacement discards none.

This is a re-assessment against a file that moved. The idea's blob changed from `8ab905f` to `eb858bf`, and the file
grew from 94 lines to 127. The added material is the Answer's `board-lanes.config.json` bullet and its three
sub-rulings, all dated 2026-09-22, plus two new open questions. Everything scored below was read at `4a78bf2` on
2026-09-23, in the primary checkout — `.claude/worktrees/` holds another checkout and was excluded from every
measurement.

The three children the 2026-09-22 record named were never filed. Measured 2026-09-23: `declare-the-epics-lane`,
`retire-the-no-folder-epic-rule` and `an-epic-states-its-child-sequence` are all absent from `backlog/ideas/`. So this
assessment replaces an Epic disposition whose split never ran, rather than following one.

The slice check passed. The file is not a verdict record, and it is not a self-declared index — its closing bullet
observes that the rule in force today would park it as one, which is a statement about the convention it proposes to
abolish rather than a claim that the file carries no work.

The kind check ruled checker-bearing: a `product` VERIFY pass has nothing to observe. The sub-kind stays
enabler-process, since the substance of the diff lands in the instructions that run the gates. A measured part of it
still does not — see Estimable and Small. V and T were scored against the checker-bearing column.

| Letter      | Score | Finding                                                                                               |
| ----------- | ----- | ----------------------------------------------------------------------------------------------------- |
| Independent | 3     | The new schema pairing asserts a blocking status the tree contradicts; measured 2026-09-23.           |
| Negotiable  | 3     | Problem and solution both present; the Answer is now eight dated rulings, so the shape reads decided. |
| Valuable    | 4     | Names the false board reading and cites a live dated instance; the cost is described, not measured.   |
| Estimable   | 4     | Bounds the reach and names an unknown that moves it; the bound was short again on 2026-09-23.         |
| Small       | 1     | The reach now spans three separable concerns, one of which the file itself calls its own slice.       |
| Testable    | 3     | Names the board hook, its direction of change and a dated reading today; no after-reading stated.     |

## Independent

The file names one related candidate, `epic-pipeline-runs-the-children.md`, which sat in `backlog/ideas/` at
2026-09-23. It is named as a split sibling rather than a dependency, and the No-gos state the boundary in the file's
own words: this idea gives the epic a lane and a stated child sequence, and says nothing about who reads that sequence
or what a child's landing obliges. `pipelines.md`'s Epic section is declared untouched.

This letter drops from the 2026-09-22 record's 4 on new text rather than a new reading. The Answer's added bullet
asserts a blocking status it did not check: "`schemas/board-lanes.schema.json` forbids additional properties and
constrains each lane's shape, so a lane entry the schema refuses is as dead as one the classifier refuses. Widening the
config without the schema would grant a permission that cannot be exercised."

Measured at `4a78bf2` on 2026-09-23, that is true of the root object and false of the part this idea needs. The schema's
root carries `additionalProperties: false`. Its `lanes` object carries `additionalProperties: { "$ref":
"#/definitions/laneShape" }`, so a new lane key is accepted, and `laneShape`'s `folder` branch accepts any `item`
matching `^[^/]+\.md$`. An `epics` entry of `{ "shape": "folder", "item": "proposal.md" }` therefore validates with no
schema edit at all. The 2026-09-22 record measured the same thing at `d6b4f9c` and recorded it; the bullet added after
that record does not cite it.

That is anchor 3 — a named dependency whose blocking status is asserted rather than checked. The schema half of the
pairing may still be worth granting on the general argument the bullet makes. It is not established as a prerequisite
for this lane.

The file also never states outright that it waits on nothing, which is what anchor 5 asks.

## Negotiable

The file is a proposal with a well-stated problem. The Situation names the incident, the Complication states the
failure in board terms, and the Question asks what the new folder holds.

The Answer is marked "Shaped, per the user's 2026-09-21 direction" and every bullet is a dated user ruling — five from
2026-09-21 and three from 2026-09-22. A ruled Answer reads as decided, which is anchor 3 rather than anchor 4. That is
the file being honest about its own authority rather than a defect: the rulings are dated and attributed, so a reader
can see which parts a design pass may still move and which are the user's to reopen.

The 2026-09-22 additions harden the file further in the same direction, without changing the anchor. They rule a
pipeline boundary, a file pairing, and a schema, and they leave the residual questions to the spec rather than
reopening the rulings.

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
index going stale against the lanes, no time figure. The 2026-09-22 `undeclared lane, 0 checks` probe the file now
carries is a measurement of the proposed mechanism, not of the harm, so it does not lift this letter. The strongest
warrant remains the user's 2026-09-17 reversal of their own 2026-09-16 ruling, which is authority rather than
measurement, and these anchors do not read authority as evidence.

## Estimable

The file bounds its own reach explicitly and dates the bound. An open question records that a check on 2026-09-21 found
eight corpus surfaces encoding the no-folder form, against the five the file first named, and seven are enumerated. The
2026-09-22 bullet adds `board-lanes.config.json`, `schemas/board-lanes.schema.json`, and the write surfaces of
`writer`, `coach` and `editor`.

The letter holds at 4 for a different reason than it did on 2026-09-22. The first new open question — whether the rule
wants stating as a property or as a list that grows one pair at a time, given that `mutation-invariance.config.json`
and its schema are a third pair the ruling does not reach — is the first thing in the file that names an unknown
capable of moving the bound. That is the anchor-5 move, and it arrives alongside a bound that got shorter again.

Measured at `4a78bf2` on 2026-09-23, four surfaces sit outside everything the file names:

- `scripts/board-shape-hook/board-shape.test.ts`, `run.test.ts` and `board-shape.property.test.ts` each pin the tracked
  config's three lanes in their own comments and fixtures, and `lane-declarations.test.ts` reads the tracked
  `board-lanes.config.json` directly.
- CLAUDE.md's board section opens "a three-lane kanban of slices". That sentence sits inside a surface the file already
  names, so it is the mildest of the four.
- `adr/0001-adopt-the-backlog-board-layout.md`'s Decision states the three-lane board by name. Its status line reads
  `Accepted (not yet frozen)`, so `adr/README.md`'s immutability rule does not bite yet — but which correction path it
  takes is a ruling this reach owes and the file does not mention.
- `.claude/agents/coach.md` and `.claude/agents/editor.md` carry no mention of `role-cycles.config.json`,
  `board-lanes.config.json`, `schemas/`, or the word `config` at all. The bullet's "`coach` and `editor` carry the same
  pairing" is therefore two role-file edits rather than an extension of an existing clause. `writer.md` names
  `role-cycles.config.json` in its description and forbids `scripts/` at line 47.

So the bound is good enough to run the design-pass checklist, which is anchor 4, and the file still does not name the
unknown that has now moved the bound three assessments running: the reach of the three-lane form itself.

## Small

The blocking letter, and the one the disposition rests on.

The design-pass checklist's `src/`-shaped triggers cannot fire on a process enabler, so the trigger that applies is
reach: the change spans three or more existing surfaces. It does, by the file's own enumeration plus the four added
under Estimable. The file names no ordering of steps over them.

What is new since 2026-09-22 is that the file now carries three separable concerns rather than two, and says so itself.
The `board-lanes.config.json` bullet closes: "This is a boundary change, so it runs the process pipeline on its own
terms rather than riding in as a side edit of the lane work." A candidate that names one of its own parts as a slice
that must run on its own terms is describing a split it has not taken.

The pipeline boundary the reach crosses was measured again at `4a78bf2` on 2026-09-23 and still crosses:

- `backlog/epics/` is undeclared in `board-lanes.config.json`, whose `lanes` object names `ideas`, `ready` and `done`.
  `scripts/board-shape-hook/board-shape.ts` answers an undeclared lane with `undeclared lane, 0 checks --
board-lanes.config.json names no lane for this path`. So a corpus that instructs a promotion into
  `backlog/epics/<name>/` instructs a write the board hook silently declines to score.
- `.claude/agents/writer.md` line 47 states the role never writes `scripts/`, and the 2026-09-22 ruling does not reach
  that clause. Four `scripts/board-shape-hook/` test files pin the three lanes. So even with the config grant in force,
  the process cycle cannot execute the test half.
- `.claude/references/pipelines.md` rules the mirror case explicitly: a substantive corpus change discovered inside a
  technical enabler "is a split signal — it is `enabler-process` work, not a side edit". This idea is that rule pointed
  the other way, and the 2026-09-22 ruling answers it by moving the boundary rather than by taking the split.
- `backlog/done/one-item-shape-serves-every-lane/design.md` records that `board-lanes.config.json` is not
  mutation-invariant, because a unit test reads it. So the config half carries a `scripts/`-scoped gate obligation
  whichever pipeline writes it.

That is anchor 1: the stated reach spans more than one slice's work, with no ordering named. Route to a split.

Two things this letter does not charge the file with. It has already taken one split — the Epic pipeline was ruled out
on 2026-09-21 and sent to `epic-pipeline-runs-the-children` — and the No-gos state that seam cleanly as plan versus
execution. And the membership checker is already correctly outside the reach: the file states it has no home, and that
a board-rendering script would owe `scripts/` its full quality bar.

## Testable

Scored against the checker-bearing column, and lifted from the 2026-09-22 record's 2 by text the file gained.

The file now names a check, its direction of change, and a dated current reading: a probe under `backlog/epics/` drew
`undeclared lane, 0 checks` on 2026-09-22, and the bullet reasons from that reading to the conclusion that declaring
the lane and documenting it are one change. That is anchor 3.

It is not anchor 4, which asks for the reading afterwards as well. The file never states what the hook prints once the
lane is declared — a scored `LAYER1` line, which is the reading this very assessment was run against. Nor does it name
the other commands whose readings move: `npm run agent-doc-check` and `npm run reference-check` both scan CLAUDE.md and
`.claude/**/*.md`, `npm run prose-lint` covers the register, and `npm run test:scripts` covers the four board-hook test
files.

Two claims in the file still have no reading at all, and neither spikes — the readings exist and are unwritten.

- The membership check between the children claiming an epic and the children the epic names. The file names the check
  and states in the same breath that it has no home, because `backlog/` has no checker.
- The derived status. A status the seat prints in chat leaves no artifact to check, and the file's own open question
  already says an unshaped report cannot be compared against last week's. Whichever child inherits it owes that shape
  before it can name a reading.

## What happens next

Split into child candidates. The parent stays in `backlog/ideas/` as an index, under the rule in force today — which is
the rule it proposes to abolish, exactly as its own closing bullet predicted.

Four children, each of which scores better than the parent on Small. The fourth is new since the 2026-09-22 split,
which was never filed:

1. **`the-process-pipeline-writes-the-lane-declaration`** — enabler-process. The write-surface grant over
   `board-lanes.config.json` and `schemas/board-lanes.schema.json` for `writer`, `coach` and `editor`, per the user's
   2026-09-22 ruling. It also settles the two open questions the ruling raised: pair-versus-class, and the `editor`
   CLEAN manifest contract when three roles may write one file. Reading today: `coach.md` and `editor.md` name no
   config file at `4a78bf2`. This child is the file's own "boundary change… on its own terms".
2. **`declare-the-epics-lane`** — enabler-technical. Add the `epics` lane to `board-lanes.config.json` as a folder
   shape, and update the four `scripts/board-shape-hook/` test files that pin three lanes. Fitness function with both
   readings nameable before it starts: a write under `backlog/epics/<name>/` reads `undeclared lane, 0 checks` today
   and a scored `LAYER1` line afterwards. No schema edit is needed, per Independent.
3. **`retire-the-no-folder-epic-rule`** — enabler-process. The corpus surfaces that state an epic gets no folder:
   `definition-of-ready.md`'s epic disposition, its slice-check index exemption and its epic-trace ruling, CLAUDE.md's
   board section including the three-lane sentence, `pipelines.md`'s Epic section,
   `.claude/skills/idea-assess/SKILL.md`, and the absent epic branch in `.claude/skills/idea-promote/SKILL.md`. It also
   owes a ruling on `adr/0001`'s three-lane Decision — correct in place while unfrozen, or supersede.
4. **`an-epic-states-its-child-sequence`** — enabler-process. The epic file's goal and ordered child sequence, the
   child frontmatter field that names its epic, and the shape of the derived status answer. The membership checker
   stays parked as an open question with no home.

Sequence matters and the parent index should state it: child 2 before child 3, so the corpus never instructs a write
the hook declines to score. Child 4 runs after child 2. Child 1 is independent of that chain and may run at any point.

Whoever writes the index owes two rulings rather than absorbing them.

- **Child 1 is not a prerequisite for child 2**, and the index should say which it prefers. Child 2's `scripts/` half
  puts it in the technical-enabler cycle whatever child 1 does, and that cycle's roles may already write the root
  config. The 2026-09-22 ruling stands and is the user's to reopen; what it buys is standing over the _next_
  declaration, not this one.
- **The open question "how does an epic complete"** reaches a board question CLAUDE.md records as unruled — the `done/`
  lane's retrospective trigger and owner. Answering it inside this work would settle a pre-existing question under
  cover of a lane change.

## The human ruling

None recorded.
