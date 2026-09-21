---
name: epics-promote-to-their-own-lane
assessed: 2026-09-21
idea-blob: 8ab905f6932c9c5ef9e96309683c7e459eed795f
---

# Assessment — epics-promote-to-their-own-lane

`/idea-assess`, 2026-09-21. Kind: enabler-process (SAFe: architecture or infrastructure enabler). Disposition: Ready.

`LAYER1 backlog/ideas/epics-promote-to-their-own-lane.md: 7 checks, 0 findings`

Layer 1 also reported: lane `ideas`, SCQA shape, 94 lines, 0 depends-on mentions, no prior assessment record.

The slice check passed. The file is not a verdict record, and it is not a self-declared index — its closing note
observes that the rule in force today would classify it as one, which is a statement about the convention it proposes
to change rather than a claim that the file carries no work. The kind check ruled checker-bearing: a `product` VERIFY
pass has nothing to observe, and the diff lands in the instructions that run the gates — CLAUDE.md, two files in
`.claude/references/`, and two `.claude/skills/` directories — so the sub-kind is enabler-process. V and T were scored
against the checker-bearing column.

| Letter      | Score | Finding                                                                                             |
| ----------- | ----- | --------------------------------------------------------------------------------------------------- |
| Independent | 4     | Names one sibling and disclaims it by stated boundary; no unlanded work blocks the reach.           |
| Negotiable  | 3     | Problem and solution both present; the Answer is five user rulings, so the shape is decided.        |
| Valuable    | 4     | Names the false board reading and cites a live dated instance; the cost is described, not measured. |
| Estimable   | 5     | Bounds the reach at eight named corpus surfaces and names six unknowns that could move it.          |
| Small       | 3     | Trips one split trigger — reach spans five-plus corpus files — and the file names them.             |
| Testable    | 2     | Names the check it wants, records that it has no home, and names no reading that changes.           |

## Independent

The file names one related candidate, `epic-pipeline-runs-the-children.md`, which sat in `backlog/ideas/` when this
assessment was taken. It is named as a split sibling rather than a dependency, and the No-gos section states the
boundary in its own words: this idea gives the epic a lane and a stated child sequence, and says nothing about who
reads that sequence or what a child's landing obliges. `pipelines.md`'s Epic section is declared untouched. So the
sibling is demonstrably optional to this reach, which is anchor 4.

It falls short of anchor 5 only because the file never states outright that it waits on nothing. The reach supports
that statement; nobody wrote it down.

One dependency is implicit rather than named, and it runs the other way: the `backlog-board-redesign` epic that
produced the 2026-09-16 no-folder design had already landed its three children when this candidate was written, which
is what left the eight surfaces to revise.

## Negotiable

The file is a proposal with a well-stated problem. The Situation names the incident, the Complication states the
failure in board terms, and the Question asks what the new folder holds.

The Answer is marked "Shaped, per the user's 2026-09-21 direction" and its five bullets are user rulings — the lane
exists, status is derived rather than stored, the folder holds what the board cannot derive, children are a sequence
rather than a set, and membership is stated twice on purpose. A ruled Answer reads as decided, which is anchor 3
rather than anchor 4. That is the file being honest about its own authority, not a defect: the rulings are dated and
attributed, and a reader can see which parts are open to a design pass and which are not.

Nothing in the file names what would rule the idea out on its own terms, which is what anchor 5 asks for. The No-gos
section rules out scope, not the idea.

## Valuable

Scored against the checker-bearing column. The failure class is a false board reading: a parked epic and a running
epic are the same text on disk, so `ls backlog/ideas/` reports identically for both, and the seat reconstructs which
epics are in flight by reading an index file against the other lanes.

The live instance is cited and dated. `backlog-board-redesign` was the first epic to run under the 2026-09-16 design,
and the file records that the seat promoted and landed its three children one at a time and hand-edited the index's
rows after each landing. That is anchor 4 — the class stated, with an instance.

It is not anchor 5, because the cost is described rather than measured. No count of hand edits, no instance of the
index going stale against the lanes, no time figure. The strongest warrant in the file is the user's 2026-09-17
reversal of their own 2026-09-16 ruling, which is authority rather than measurement, and the anchors do not read
authority as evidence.

## Estimable

The strongest letter. The file bounds its own reach explicitly and dates the bound: an open question records that a
check on 2026-09-21 found eight corpus surfaces encoding the no-folder form, against the five the file first named.
Seven are enumerated — `definition-of-ready.md`'s epic disposition, its slice-check index exemption, its epic-trace
ruling, CLAUDE.md's board section, `pipelines.md`'s Epic section, `.claude/skills/idea-promote/` having no epic branch
at all, and `.claude/skills/idea-assess/SKILL.md`'s instruction that an Epic names its children and nowhere else.

That is anchor 4 — enough to run the design-pass checklist. It reaches anchor 5 because the file also names the
unknowns that could move the bound: what exactly lives in `epics/<name>/`, whether the epic's frontmatter still needs
`kind: epic`, how an epic completes, whether `ls backlog/epics/` joins the board, what shape the derived status report
takes, and whether the membership check has a home.

Two cautions belong beside the 5. First, the bound has already moved once inside this file, from five surfaces to
eight, so treat eight as a reading rather than a ceiling. Second, a grep for the no-folder phrasings over CLAUDE.md
and `.claude/**/*.md` at commit ca49d9b on 2026-09-21 returned four files, one of which —
`.claude/references/definition-of-ready.meta.md` — the file's list does not name. Its mention sits in the sidecar's
adoption table as a record of what the rubric borrowed, so excluding it from an edit list is defensible; the design
pass should confirm that rather than inherit it.

## Small

The design-pass checklist's `src/`-shaped triggers cannot fire on a process enabler, so the trigger that applies is
the reach one: the change spans three or more existing surfaces. It does — five-plus corpus files by the file's own
enumeration, plus a new board lane and a new child frontmatter field. That is exactly one trigger, and the file names
the surfaces it trips on, which is anchor 3.

It is not anchor 2, because the file has already taken one split: the Epic pipeline was ruled out on 2026-09-21 and
sent to `epic-pipeline-runs-the-children`, and the No-gos state the seam as plan versus execution.

The design or `coach` SPEC pass should rule on one further split rather than absorbing it. The open question "how does
an epic complete" reaches a board question that CLAUDE.md records as unruled — the `done/` lane's trigger and owner.
Answering it inside this slice would settle a pre-existing question under cover of a lane change. The membership
checker is already correctly outside the reach: the file states it has no home, and that a board-rendering script
would owe `scripts/` its full quality bar.

## Testable

The lowest letter, and the one most likely to draw a differing human ruling.

Scored against the checker-bearing column. The file names the check it wants — the set of children claiming an epic
against the set that epic names — and states in the same breath that the check has no home, because `backlog/` has no
checker. It names no command whose reading changes when the slice lands: not the reading today, not the reading
afterwards. That is anchor 2, names a check but not its reading.

The finding is not blocking, for two reasons written here so a differing ruling has something to argue with. The
enabler-process pipeline puts a `coach` SPEC artifact and a user signature ahead of any corpus edit, so the checks
this slice will actually be held to are nameable at SPEC time rather than at assessment time. And the absent
membership checker is the board's own standing design, recorded in CLAUDE.md as nothing enforces any of this — a
candidate cannot be marked down for declining to reverse it.

What the SPEC pass owes in exchange: name the commands that run over the edited surfaces and their readings today.
`npm run agent-doc-check` and `npm run reference-check` both scan CLAUDE.md and `.claude/**/*.md` and would see a new
lane and any path this change writes, and `npm run prose-lint` covers the register. The file names none of them.

The two derived-status claims are the part with no reading at all. A status the seat prints in chat leaves no artifact
to check, and the file's own open question says an unshaped report cannot be compared against last week's.

## What happens next

Promote: `git mv` the idea and this record into `backlog/ready/epics-promote-to-their-own-lane/` as a move-only
commit, then run the required design pass, since an enabler has no `product` SPECIFY to gate it.

## The human ruling

None recorded.
