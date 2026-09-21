---
name: one-item-shape-serves-every-lane
assessed: 2026-09-21
idea-blob: 94b87177c581e37b316391945feb1944bdc1f996
---

# Assessment — one-item-shape-serves-every-lane

`/idea-assess`, 2026-09-21. Kind: enabler-technical (SAFe: architecture or infrastructure enabler). Disposition: Ready.

`LAYER1 backlog/ideas/one-item-shape-serves-every-lane.md: 7 checks, 0 findings`

Layer 1 also reported: lane `ideas`, SCQA shape, 111 lines, 0 depends-on mentions, no prior assessment record.

The slice check passed. The title states work rather than a verdict, and the file does not say of itself that it is
not work. It is a child of `lanes-declare-their-own-item-shape`, ruled Epic 2026-09-21, and a child is a slice.

The kind check ruled checker-bearing: a `product` VERIFY pass has nothing to observe, because the finished state is
what the board-shape hook prints and what `npm run test:scripts` reads. V and T were scored against the
checker-bearing column. The sub-kind discriminator resolved to `enabler-technical`: the reach is
`scripts/board-shape-hook/`, a new board data file the script validates, and a `<module>.meta.md` sidecar beside the
module. The No-gos exclude corpus prose outright and route it to the sibling. One wrinkle, recorded rather than
waved past — the declaration file sits under the board by location, and CLAUDE.md's kind check lists "the board
docs" under `enabler-process`. A machine-read data file that a script validates is a config in that check's own
vocabulary, not instruction prose, so `enabler-technical` stands. The parent's record expected the same label.

| Letter      | Score | Finding                                                                                                |
| ----------- | ----- | ------------------------------------------------------------------------------------------------------ |
| Independent | 4     | Runs first by user ruling; the sibling is named and runs after. One field's ownership is left unruled. |
| Negotiable  | 3     | Problem and solution both present; every Answer bullet is a dated user ruling, so it reads as decided. |
| Valuable    | 3     | The failure mechanism verified live 2026-09-21; the one already-wrong-today instance does not hold.    |
| Estimable   | 5     | Bounds the reach at named modules, a new data file and a sidecar, and names seven unknowns.            |
| Small       | 3     | Trips exactly one design-pass trigger — new modules — and the file names the new pieces.               |
| Testable    | 4     | Names the hook's printed lines, a reading today and a reading afterwards; the confident zero is open.  |

## Independent

Score 4. The file opens by stating it runs first, by a user ruling dated 2026-09-21, and names the corpus child
`the-idea-template-claims-the-whole-board` as running second. A sibling that runs after is not a dependency. Layer 1
counted 0 depends-on mentions, consistent with that reading. The one landed dependency is R1 of
`backlog/done/the-board-hook-misfits-per-item-artifacts/spec.md`, whose positional ruling this file proposes to
split by axis rather than overturn; that spec sits in the `done` lane, so it has landed.

Not 5. The file's last Open question leaves one field's ownership unruled: the declaration would name a template the
sibling then renames, and the file says only that the seam "is a question of which cycle owns the field rather than
of whether it can be reached". A slice whose own data file carries a field that may belong to another cycle has not
stated that it waits on nothing.

A second coupling has no owner in either child, and this record names it rather than leaving it to be discovered.
The file's fifth Open question asks whether a machine-read declaration changes a stated property of the board,
citing CLAUDE.md's claim that `backlog/` has "no gate, no checker, and no test beyond the advisory `Board` Vale
style". Measured 2026-09-21 on this tree: that claim is already stale for a different reason. The board-shape hook
ships, `.claude/settings.json` registers it on two PostToolUse events, and `scripts/board-shape-hook/` carries three
`.test.ts` files. So this slice does not make the sentence false; it inherits a sentence that is already false. The
correction is corpus prose, which this cycle's No-gos forbid, and the sibling's file does not name it either.

## Negotiable

Score 3. Problem and solution are both present and cleanly separated across Situation, Complication and Question.
The Answer's header states it plainly: "Shaped. Every bullet is a user ruling taken 2026-09-21 during the parent's
shaping." Six bullets, six rulings. One of them — the silent board root — carries the word "provisionally", and the
rest do not. A solution held entirely in dated user rulings reads as decided rather than offered, which is what the
3 anchor describes and what the 4 anchor rules out.

The No-gos state what is out of scope — no gate, the artifact axis untouched, no corpus prose, and the declaration
file not hidden — but a scope boundary is not what would rule the idea out on its own terms, which is what a 5 asks.

The seven Open questions are the counterweight and are why this is not a 2. The file names what is unsettled about a
missing or malformed declaration file, what it knowingly leaves undetectable, and that the silent root is a knowing
inconsistency it may reopen.

The parent scored N=3 on the same reasoning and the human agreed 2026-09-21, so this letter is reading a calibrated
anchor rather than a fresh one.

## Valuable

Scored against the checker-bearing column. Score 3.

The false claim is named precisely, and it verifies. The file states that an item file the positional test does not
recognise draws no checks and prints the same refusal a per-item artifact draws, so a missed item reads exactly like
a correctly skipped spec. Measured 2026-09-21 on this tree: `backlog/TEMPLATE.md` and
`backlog/done/the-board-hook-misfits-per-item-artifacts/spec.md` each printed the identical
`not a candidate, 0 checks` line. The collapse is real and the file describes it correctly.

The file's converse claim — that an item file carrying the recognised basename draws the full candidate checks and
reports sections it never owed — has no live instance, because no lane holds a divergent item shape. The file says
so itself and dates the measurement.

What keeps this off 4 is the one instance offered as already wrong today. The Complication states that "a path
directly under the board root reports its own filename where a lane name belongs". Measured 2026-09-21:
`backlog/TEMPLATE.md` is the only file directly under the board root, and it does not do this. Its board-relative
segment count is one, `isCandidatePath` refuses it before `laneFor` is reached, and the run printed the refusal line
with no lane clause at all. The Answer's own fifth bullet describes that mechanism correctly — "the segment count
classifies it before the lane lookup is reached" — and so proposes as a change something the code already does.

The adjacent defect is live, and the file does not name it. A probe at `backlog/zzprobe/x.md` on 2026-09-21 carried
two segments, was classified as a candidate, and printed `lane zzprobe` — an undeclared directory reporting itself
as a lane and drawing the full candidate checks. The probe was removed. The Answer's first bullet, which makes the
lane axis literal, covers that case; the fifth bullet does not. So the mechanism the file proposes has a live
instance behind it, and the sentence claiming one points at the wrong path.

That is a writing correction rather than a knowledge gap, and it does not reach the disposition: the value rests on
a verified mechanism either way.

## Estimable

Score 5. The file bounds the reach at named surfaces rather than at areas. `scripts/board-shape-hook/board-shape.ts`
is named with the three mechanisms it would change, by function: `isAssessmentRecordPath`, `isCandidatePath` and
`assessmentSummary`. A new board data file holds the lane declarations, and the Answer rules that the script
validates that input rather than trusting it, which names a reader and a validator. A `<module>.meta.md` sidecar
holds the rationale. The docs reach is not merely stated but excluded, and routed to the named sibling.

It also names the unknowns that could move that bound, which is what separates 5 from 4. Seven Open questions carry
them: the missing-or-malformed declaration behaviour, the undetectable basename mismatch at the declared depth, the
deferred silent root, the three surfaces that would state the lane set with nothing checking them against each
other, whether the declaration changes a stated property of the board, the first `scripts/` module sidecar and its
unlinted instruction half, and the template-name seam with the sibling.

## Small

Score 3. The reach trips exactly one of CLAUDE.md's design-pass triggers, and the file names the pieces that trip
it: it creates new modules, namely the reader and validator for the declaration input the Answer's fourth bullet
requires, plus the declaration file itself.

It does not trip the others. The layering trigger is about the framework-free module to hook to component axis and
does not reach `scripts/`. No target file is flagged oversized. The change does not span three or more existing
modules: `board-shape.ts` owns every decision, including the tally and the `deliver` flag the warning register would
have to leave alone, and `run.ts` only acts on that flag. The reach is one existing module plus new ones.

Note that a design pass runs regardless. CLAUDE.md rules it required in the Enabler pipeline, since an enabler has
no `product` SPECIFY and the design pass is its only pre-implementation gate. S is not what triggers it here.

The epic test asks whether splitting would produce children that each score better. It would not. The parent already
split along the pipeline axis, and this child's whole reach sits inside one pipeline and one directory. A further
split into declaration-reading, warning-register and sidecar would leave each part still tripping the new-module
trigger or too thin to stand as a slice, and each would inherit the same V and E findings. No ordering of
behavior-preserving steps is named, which the 2 anchor pairs with two or more triggers; with one trigger the design
pass is where that ordering is produced.

## Testable

Scored against the checker-bearing column. Score 4.

The check is the board-shape hook's own printed output, read through `npm run test:scripts` and through the hook's
live lines. The file names a reading today and a reading afterwards for two cases. An unrecognised item file reads
today as the refusal line a per-item artifact draws — verified 2026-09-21, both paths printed the same line — and
afterwards as a warning naming its own cause, in a register that already exists: uncounted in the tally and
undelivered to the editing role, so the envelope keeps firing on the finding count exactly as it does today. A path
under the board root reads afterwards as silence.

The file is honest about what the warning buys. It states that the file still draws no checks and the editing role
is still not told, so the gain is a diagnosable line rather than an interrupt.

Not 5. The confident-zero hazard is named but not ruled. The first Open question asks what the classifier does when
its own declaration file is missing or malformed, states that reading it as every lane declared and as every lane
undeclared are both wrong, names `scripts/vale-fixture-check/` as the precedent for a checker that refuses to report
a clean run it cannot substantiate, and stops. Until that is ruled, the check has a state in which it reports
nothing for a reason nobody chose. The same letter on the parent scored 4 for the same unruled hazard, and the human
agreed 2026-09-21.

One reading-today is also inaccurate, as the Valuable finding records, though the primary one verifies.

## What happens next

Promote: the item moves to `backlog/ready/one-item-shape-serves-every-lane/` under `/idea-promote`.

Two findings travel with it rather than blocking it. The Valuable finding is a correction the proposal should carry
before the move-only commit: the already-wrong-today instance names the wrong path, and the live one is an
undeclared directory at two segments, not a file at the board root. The Independent finding names an orphan — the
auto-loaded claim that the board has no checker is already stale on this tree, and neither child owns the fix.

## The human ruling

Ruled 2026-09-21.

Independent — agree
Negotiable — agree
Valuable — agree
Estimable — agree
Small — agree
Testable — agree
