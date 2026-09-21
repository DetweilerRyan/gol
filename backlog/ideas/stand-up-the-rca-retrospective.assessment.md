---
name: stand-up-the-rca-retrospective
assessed: 2026-09-21
idea-blob: e72cfee782c150f78bfa6636480d6f9ccd2196ad
---

# Assessment — stand-up-the-rca-retrospective

`/idea-assess`, 2026-09-21. Kind: checker-bearing, enabler-process (SAFe: architecture or
infrastructure enabler). Disposition: Epic.

`lane ideas, scqa shape, 160 lines, 0 depends-on mention(s)`

`LAYER1 backlog/ideas/stand-up-the-rca-retrospective.md: 6 checks, 0 findings`

| Letter      | Score | Finding                                                                            |
| ----------- | ----- | ---------------------------------------------------------------------------------- |
| Independent | 4     | Names one unlanded board item and argues it away on the record; nothing blocks.    |
| Negotiable  | 4     | Shaped rather than specified, with seven open questions; no self-refutation named. |
| Valuable    | 5     | Dated lane measurement plus three cited live instances of the loss.                |
| Estimable   | 5     | Bounds the corpus surfaces and names the unknowns that would move the bound.       |
| Small       | 1     | The bounded reach spans more than one slice, and the file pre-drafts its split.    |
| Testable    | 2     | Names the one checker that touches the board, and no check whose reading changes.  |

## Independent

The file names two landed slices and one unlanded board item. The two landed ones are records
rather than dependencies: `slice/the-board-hook-misfits-per-item-artifacts` and
`slice/assessment-records-die-with-the-conversation` were both tagged in the tree read
2026-09-21, and the file cites them for a ruling and a precedent respectively. The unlanded one
is the board-shape-checker defect, which the file routes to the item that owns it and then
argues away in its own terms: the folder form it chooses is already silent under the
position-reading predicate, so nothing in this item waits on that fix. That argument holds
against the tree read 2026-09-21 — `backlog/ready/checkers-do-not-reach-the-assessment-sidecar`
is an unlanded enabler-technical item, and it names the same classifier defect.

`adr/0001` is the fourth named surface, and the file states its status keeps it editable. That
reading held on the tree read 2026-09-21, where the record carried `Accepted (not yet frozen)`.

Not 5, because one dependency exists and is dismissed by argument rather than absent. One open
question also leaves a scope boundary with a sibling that no board file holds today: whether
this item asks roles for contemporaneous capture. That is a scope question rather than a
blocking one, which is why it does not lower the letter further.

## Negotiable

The Situation and the Complication state the problem before any solution appears, and the
Answer opens by declaring itself shaped rather than specified. Seven open questions leave the
record's owner, the retained weighted tree, the closed-set question on terminal layers, and the
placement of the weighting scheme all undecided. The No-gos rule out four neighbouring
techniques and two classes of automation, each with its reason, so the omissions read as
choices rather than as gaps.

Parts of the Answer read as decided rather than offered — `coach` gaining a third mode, the
fishbone default, blind divergence, evidence-carrying votes. Each carries its argument in the
same sentence, which is what keeps the letter at 4 rather than dropping it to 3.

Not 5. The file names no condition that would rule the idea out on its own terms. The nearest
is the Complication's claim that an undisciplined pass costs more than no pass, which rules out
a version of the idea rather than the idea. The declared null result is the same discipline
applied to a single pass rather than to the item.

## Valuable

Scored against the checker-bearing column. The file states the failure class and cites live
instances of it, dated and measured.

The measurement: sixteen folders in `backlog/done/`, none retrospected, broken down as six
`enabler`, six `enabler-process`, two `enabler-technical` and two `spike`, with no story. That
count and that breakdown both reproduced on the tree read 2026-09-21.

The instances: a nine-amendment chain, a census that failed more than once, and a seat that
sent a role outside its boundary, each recorded and none adjudicated. Two slices wrote
`retro.md` findings during the work with nothing asking for them — `retro.md` exists under
`backlog/done/assessment-records-die-with-the-conversation` and
`backlog/done/relocate-the-skill-hooks-into-the-tested-tier` on the tree read 2026-09-21, and
CLAUDE.md's per-item artifact list named neither.

What survives without the pass is stated rather than asserted: the artifacts are the only
durable record of what the work taught, and the deletion that would retire them is the same act
the retrospective was meant to earn. `adr/0001` already recorded that as a negative consequence
of the layout it adopted.

## Estimable

Scored on whether a bound exists, not on effort. The file bounds its reach in named corpus
surfaces rather than in areas: a facilitation reference, a third `coach` mode, a retro mode per
seated role, two board lanes, the board documentation in CLAUDE.md, the `adr/0001` edit, and a
fishbone facilitation protocol. That is enough to run the design-pass checklist against the
corpus, and it trips.

It also names the unknowns that would move the bound, which is what carries the letter to 5:
whether the set of terminal layers is closed and whether it is one set or two, where the
weighting scheme and the spine categories belong, who writes the impediment record, and whether
the weighted skeleton is retained. Each of those changes which files the work touches.

The bound is large. That is S's finding, not E's.

## Small

The bounded reach spans more than one slice's work. On the tree read 2026-09-21 the corpus
surfaces the file names include a new reference file, a new mode file under
`.claude/agents/coach/`, a participant mode for each seatable role, two new board lanes with
their own record shape, CLAUDE.md's board section, and `adr/0001`. No ordering of
behavior-preserving steps inside one slice is named.

What the file names instead is an ordering of children, in its first open question, and it asks
this assessment whether that is the right reading. It is. The file also records its own doubt
that the first child delivers value alone, which is a finding about a child rather than about
this letter.

Applying the Epic test: each child would score better on S, and on T for the frame child, since
a single new reference plus one mode file has a nameable prose-gate reading where the whole
frame does not. The children do not inherit V or E, which are already high here. So the file is
over-scope rather than under-examined.

## Testable

Scored against the checker-bearing column. The file names one checker that touches the board —
the shape checker that reads position rather than lane — and names it only to rule the chosen
folder form silent under it. It names no check whose reading changes when this lands, in either
direction.

That is partly by design. The No-gos decline any gate that makes a retrospective happen, and
state that no run reds because a folder waited and the merge protocol gains no retrospective
step. The file also notes that no checker resolves a citation on this board, which is why the
impediment record inlines its evidence by quotation.

Declining a gate is not the same as naming the reading that shows the pass works. Candidates
exist and the file names none of them: `npm run prose-lint` over a new reference and a new mode
file, `npm run reference-check` over the citations the board documentation gains, and `coach`
REVIEW against its own signed spec. Nor does it state the first pass's own observable — a ruled
root cause in the new lane, or the declared null result that the pass may return instead.

Not 1, because a checker is named and its reading argued. Not 3, because no current reading is
given for any check and the direction of change is stated as no-change for the gates rather
than for the deliverable.

## What happens next

Split into child candidates. The parent stays in `backlog/ideas/` as an index and gets no
`ready/` folder, per CLAUDE.md's board rules. The children the split produces, in the ordering
the file's own first open question drafts:

1. **The frame** — the facilitation reference, `coach`'s third mode, the two board lanes and the
   impediment record's shape, the board documentation in CLAUDE.md, and the `adr/0001` edit. Its
   own V is the open question the file raises against it: a frame with no participants seated is
   one role's opinion. Assess it on that.
2. **The participant modes** — a retro mode per seatable role, and the facilitator's roster
   recommendation. This is the child that makes the frame more than one opinion.
3. **The fishbone facilitation protocol** — the rounds, the weighting scheme, the spine
   categories, and the blind-divergence mechanics, unless child 1 finds the smallest honest
   weighting scheme is a frame-level rule.

Two corrections the file names and leaves unowned need an owner among those children or a
sibling candidate: CLAUDE.md's per-item artifact list omitting the retro artifact, and whether
any role is asked for contemporaneous capture. Each child names its parent and inherits the
enabler-process kind; the parent index carries `epic` in CLAUDE.md's own `kind:` vocabulary.

Each child should raise T on its own terms, since T's finding is a writing gap rather than a
knowledge gap and no spike would close it.

## The human ruling

None recorded.
