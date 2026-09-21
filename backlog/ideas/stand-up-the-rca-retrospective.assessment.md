---
name: stand-up-the-rca-retrospective
assessed: 2026-09-21
idea-blob: 963c53b2991d60d145ca747de8eacca58a84b05d
---

# Assessment — stand-up-the-rca-retrospective

`/idea-assess`, 2026-09-21. Kind: checker-bearing, enabler-process (SAFe: architecture or
infrastructure enabler). Disposition: Epic.

`lane ideas, scqa shape, 189 lines, 0 depends-on mention(s)`

`LAYER1 backlog/ideas/stand-up-the-rca-retrospective.md: 6 checks, 0 findings`

This record replaced an earlier one, written the same day against blob `e72cfee` at 160 lines. That record carried
no human ruling, so nothing was discarded with it. The letters that moved and why sit in each detail section.

| Letter      | Score | Finding                                                                           |
| ----------- | ----- | --------------------------------------------------------------------------------- |
| Independent | 4     | Names one unlanded board item and argues it away on the record; nothing blocks.   |
| Negotiable  | 4     | Shaped rather than specified, with nine open questions; no self-refutation named. |
| Valuable    | 5     | Dated lane measurement plus three cited live instances of the loss.               |
| Estimable   | 5     | Bounds the corpus surfaces and names the unknowns that would move the bound.      |
| Small       | 1     | The stated reach spans more than one slice's work, and the file drafts its split. |
| Testable    | 5     | Four checks with dated readings, their afterwards, and two confident zeros named. |

## Independent

The file names two landed slices, one unlanded board item, and one editable decision record.

The two landed ones are records rather than dependencies. `the-board-hook-misfits-per-item-artifacts` is cited for a
ruling it already made on the per-item artifact's shape, and `slice/assessment-records-die-with-the-conversation` for
the precedent that a role's context dies with its invocation. Both were tagged on the tree read 2026-09-21.

The unlanded one is the board-shape checker's position-reading defect. The file routes it to the item that owns it and
then argues it away in its own terms: the folder form chosen here is already silent under that predicate, so nothing
in this item waits on the fix. That argument holds against the tree read 2026-09-21, where
`backlog/ready/checkers-do-not-reach-the-assessment-sidecar` was an unlanded `enabler-technical` item naming the same
classifier gap.

`adr/0001` is the fourth named surface, and the file states its status keeps it editable. That reading held on the
tree read 2026-09-21, where the record carried `Accepted (not yet frozen)`.

Not 5, because a dependency exists and is dismissed by argument rather than being absent. One open question also
leaves a scope boundary with a sibling that no board file holds today — whether this item asks roles for
contemporaneous capture. That is a scope question rather than a blocking one, which is why the letter goes no lower.

## Negotiable

The Situation and the Complication state the problem before any solution appears, and the Answer opens by declaring
itself shaped rather than specified. Nine open questions leave the record's owner, the retained weighted tree, the
closed-set question on terminal layers, the placement of the weighting scheme and the spine categories, whether a
participant may refute the effect itself, and whether a retrospective is a declared role cycle all undecided. The
No-gos rule out five neighbouring classes with a reason each, so the omissions read as choices rather than as gaps.

Parts of the Answer read as decided rather than offered — `coach` gaining a third mode, the fishbone default, blind
divergence, evidence-carrying votes, quotation rather than path in the record. Each carries its argument in the same
sentence, which holds the letter at 4 rather than dropping it to 3.

Not 5. The file names no condition that would rule the idea out on its own terms. The nearest are the Complication's
claim that an undisciplined pass costs more than no pass, and the declared null result the Answer requires of every
pass. Both rule out a version of the idea, or an individual run of it, rather than the item.

## Valuable

Scored against the checker-bearing column. The file states the failure class and cites live instances of it, dated
and measured.

The measurement, as the file records it for 2026-09-21: sixteen folders in `backlog/done/`, none retrospected, as six
`enabler`, six `enabler-process`, two `enabler-technical` and two `spike`, with no story. That count and that
breakdown both reproduced on the tree read 2026-09-21.

The instances: a nine-amendment chain, a census that failed more than once, and a seat that sent a role outside its
boundary, each recorded and none adjudicated. Two slices wrote `retro.md` findings during the work with nothing
asking for them — a `retro.md` sat under `backlog/done/assessment-records-die-with-the-conversation` and
`backlog/done/relocate-the-skill-hooks-into-the-tested-tier` on the tree read 2026-09-21, and CLAUDE.md's per-item
artifact list named neither.

What survives without the pass is stated rather than asserted. The artifacts are the only durable record of what the
work taught, and the deletion that would retire them is the same act the retrospective was meant to earn. `adr/0001`
already recorded that as a negative consequence of the layout it adopted, and the file cites it.

## Estimable

Scored on whether a bound exists, not on effort. The file bounds its reach in named corpus surfaces rather than in
areas: a facilitation reference, a third `coach` mode, a retro participant mode per seated role, two board lanes with
a record shape of their own, the board documentation in CLAUDE.md, the `adr/0001` edit, and a fishbone facilitation
protocol. That is enough to run the design-pass checklist against the corpus, and it trips.

It also names the unknowns that would move the bound, which carries the letter to 5: whether the set of terminal
layers is closed and whether it is one set or two, where the weighting scheme and the spine categories belong, who
writes the impediment record, whether the weighted skeleton is retained anywhere, and whether a retrospective is a
declared role cycle. Each changes which files the work touches.

The bound is large. That is S's finding, not E's.

## Small

The stated reach spans more than one slice's work, which is anchor 1's condition, and the file says so of itself
rather than leaving the reading to this pass. On the tree read 2026-09-21 the surfaces it names include a new
reference file, a new mode file under a `coach` subdirectory that does not exist yet, a participant mode for each
seatable role against a roster of eight agent files, two new board lanes, CLAUDE.md's board section, and `adr/0001`.

The ordering the file names is an ordering of children, in its first open question, not an ordering of
behavior-preserving steps inside one slice. So it does not lift the letter to 2. The file also records its own doubt
that the first child delivers value alone, which is a finding about a child rather than about this letter.

Applying the Epic test: each child would score better on S, and the frame child gains a tighter T reading than the
whole frame carries, since a single new reference plus one mode file has a narrower prose-gate surface. V and E are
already high here and the children inherit them. So the file is over-scope rather than under-examined, and the
disposition is Epic rather than spike or revision.

## Testable

Scored against the checker-bearing column. The earlier record against blob `e72cfee` scored this letter 2, on the
finding that the file named no check whose reading changes. The revision answers that finding directly, which is the
one letter this pass moves.

The file now carries four checks in a table, each with its reading on 2026-09-21 and its reading afterwards:
`npm run agent-doc-check` at 55 doc files, 8 agent files and 32 rules with no failures; `npm run reference-check` at
538 files and 3226 references with no failures; `npm run prose-lint` at 556 tracked files and 164 findings; and the
board's shape checker against the folder form at `not a candidate, 0 checks`. The agent count holding at eight is
argued rather than assumed — a mode file sits in a role's own subdirectory and the roster scan filters for files, so
it never descends. Three of those figures reproduced without running a gate on the tree read 2026-09-21: eight files
under `.claude/agents/*.md`, thirty-two under `rules/*.yml`, and the shape checker's own Layer 1 line above.

What carries the letter to 5 is that the file names what would make a reading a confident zero rather than a pass.
The roster scan's blindness is the same fact as the frontmatter exemption, so a mode file with broken frontmatter
passes by being unreachable and nothing validates what a mode file declares. A missing `vale` binary reports zero
exactly as a clean run does.

The deliverable's own observable is stated too: a ruled root cause in the new lane, or the null result the pass
declared before it ran, with `coach` REVIEW against its signed spec closing the cycle either way. The No-gos still
decline any gate that makes a retrospective happen, and that declension is consistent with this letter rather than
against it — the checks named are the ones that read the work, not ones that force it.

## What happens next

Split into child candidates. The parent stays in `backlog/ideas/` as an index and gets no `ready/` folder, per
CLAUDE.md's board rules. The children the split produces, in the ordering the file's own first open question drafts:

1. **The frame** — the facilitation reference, `coach`'s third mode, the two board lanes and the impediment record's
   shape, the board documentation in CLAUDE.md, and the `adr/0001` edit. Its own V is the open question the file
   raises against it: a frame with no participants seated is one role's opinion. Assess it on that, and on whether it
   should carry one participant mode to answer it.
2. **The participant modes** — a retro mode per seatable role, and the facilitator's roster recommendation. This is
   the child that makes the frame more than one opinion.
3. **The fishbone facilitation protocol** — the rounds, the weighting scheme, the spine categories, and the
   blind-divergence mechanics, unless child 1 finds the smallest honest weighting scheme is a frame-level rule.

Two corrections the file names and leaves unowned need an owner among those children or a sibling candidate:
CLAUDE.md's per-item artifact list omitting the retro artifact, and whether any role is asked for contemporaneous
capture. Each child names its parent and inherits the `enabler-process` kind; the parent index carries `epic` in
CLAUDE.md's own `kind:` vocabulary.

No letter here names a knowledge gap a spike would close. S is the blocking finding, and its remedy is the split.

## The human ruling

None recorded.
