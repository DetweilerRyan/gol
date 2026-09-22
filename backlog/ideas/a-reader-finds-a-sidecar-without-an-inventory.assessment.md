---
name: a-reader-finds-a-sidecar-without-an-inventory
assessed: 2026-09-21
idea-blob: e56c520a4f423778884b1d86053f176475a444ef
---

# Assessment — a-reader-finds-a-sidecar-without-an-inventory

`/idea-assess`, 2026-09-21. Kind: enabler-process (SAFe: architecture or infrastructure enabler).
Disposition: Ready.

`LAYER1 backlog/ideas/a-reader-finds-a-sidecar-without-an-inventory.md: 7 checks, 1 findings`

Layer 1 also reported, same run: lane ideas, scqa shape, 208 lines, 2 depends-on mentions. Its one finding
was `assessment stale`. The record this one replaces was taken at blob `757c67e`; `f22f3e5` has since
corrected the re-break attribution in the Complication, which is the whole diff between the two blobs. That
correction is the one the replaced record's Valuable finding handed to the spec author, so the file has
answered it rather than drifted. The replaced record carried no human ruling, so this replacement discards
none.

Slice check: the file is neither a verdict record nor a self-declared index. It reaches the kind check.

Kind check: a `product` VERIFY pass has nothing to observe. The finished state is prose in CLAUDE.md and
three corpus files — the instructions that run the gates, not the tree the gates measure — so the second
discriminator lands on **enabler-process**. Ruling B fixes the same label in the file. V and T scored against
the checker-bearing column.

| Letter      | Score | Finding                                                                                                        |
| ----------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| Independent | 4     | One neighbour named, non-blocking by a borrowed test and a No-go; the file never states it waits on nothing.   |
| Negotiable  | 5     | Outcome-shaped with the wording deferred and its own rule-out stated; ten rulings narrow the space, not shape. |
| Valuable    | 5     | A roster repaired at 11:14 and re-broken at 15:20 the same day, dated, measured, and re-verified on `f22f3e5`. |
| Estimable   | 5     | Reach enumerated as four named files with the tier counted; six open questions name what moves the bound.      |
| Small       | 4     | Trips no design-pass trigger; the four-file reach carries seams the rulings weld shut rather than none at all. |
| Testable    | 3     | Two guard gates carry dated readings; no check establishes the finished state, and ruling B makes that final.  |

## Independent

The file names one neighbouring candidate, twice, and both mentions are Layer 1's two depends-on hits. Under
Complication, `apply-the-census-count-rule-everywhere` supplies a borrowed test — does a normal slice move
this fact? — rather than a precondition. Under No-gos it scopes that candidate's territory out: the
topic-article counts belong to it, and the file records that `1b1f3e9` has since dropped the one count that
contradicted its neighbour. A borrowed argument and a declared non-overlap are not an ordering. That
neighbour sat in `backlog/ideas/` on `main` at `f22f3e5`, checked 2026-09-21, so neither mention names an
unfiled slice.

The four files the reach names — `CLAUDE.md`, `CLAUDE.meta.md`, `mutation-testing.md`, `doc-comments.md` —
all existed on `main` at `f22f3e5`, checked the same day. Nothing in the reach waits on an unlanded slice.

Anchor 4 rather than 5, because the file does not state that it waits on nothing. An earlier revision's third
neighbour, `the-invariance-allowlist-is-a-hand-maintained-list-of-a-computable-fact`, dropped out in the
2026-09-21 widening without the independence being asserted in its place. The rulings close the reach; no
sentence closes the dependency question.

## Negotiable

The Answer opens by declaring itself shaped — "the wording is the process pipeline's to write" — and then
states five properties a reader can check rather than sentences to paste. The constraints that follow are
measurements handed to the spec author. That is anchor 4 on its own, and the explicit rule-out clause lifts
it to 5: the idea stops being worth making if the placement is not rule-statable, and the file names the
condition that would show that — a third placement home landing, after which the rule form converges on the
inventory it replaced and a checked list becomes the better answer.

The tension to record, since this letter is where ten user rulings press hardest. Several of them commit
rather than offer: A closes the roster in both directions, B closes the checker alternative and backs it with
a No-go, E widens the reach from the index to every named mention, H rules deletion over recording the
decline. A reader could take that for a contract.

It is not one, and ruling J is why. It fixes the outcome — one section rather than scattered mentions — and
says in its own text that it **deliberately does not fix the shape**: where the section sits, what it is
called, and how much of each displaced passage it absorbs stay `coach`'s at spec time. Ruling F leaves eleven
`CLAUDE.meta.md` self-citations to be ruled one at a time, each a `claim-discipline.md` judgement per
sentence rather than a blanket. Six open questions carry the live tensions, one of them flagged as the
central structural call in the slice. What the rulings narrow is the solution space; what stays open is the
solution.

## Valuable

Scored against the checker-bearing column. The failure class is a hand-maintained inventory that reads as
complete and is not, and the file carries a live instance rather than asserting the class.

The argument is put in its strongest available form, and that is what earns the 5. It is not that the list is
currently wrong. It is that being currently right is a state the list does not hold, demonstrated on one
day's history. Verified on `main` at `f22f3e5`, 2026-09-21: `1b1f3e9` repaired the roster at 11:14:11 on
2026-09-21, and `2f1aca3`, a different slice, added `scripts/board-shape-hook/board-shape.meta.md` at
15:20:16 the same afternoon. `grep -c board-shape CLAUDE.md` returns 0 on that tree, and the file is tracked.
Four hours and six minutes between repair and re-break, by two different slices.

The attribution the replaced record flagged has been corrected in the file itself, at `f22f3e5`: the earlier
text named `ab3e946`, which modified the sidecar rather than adding it. The commit timestamps now stated in
the Complication match `git log` on `f22f3e5` to the minute, so the sharpest sentence in the argument is now
the checkable one.

The surrounding census reproduces too, on the same tree and date. CLAUDE.md is byte-identical to its state at
`de8fbd6`, the tree the file measured on — `git diff de8fbd6 HEAD -- CLAUDE.md` is empty — so its figures are
re-checkable rather than merely dated. Of 24 tracked `.meta.md` files, 18 sit beside their instruction file
and six do not: the five role sidecars and `CLAUDE.meta.md`, all displaced into `.claude/agents/articles/`.
Ten generic placeholders sit in CLAUDE.md, exactly as ruling J states.

The cost half is stated: CLAUDE.md is auto-loaded into every session and every subagent, so a false roster is
read by all six audiences before any of them starts work.

## Estimable

The reach is enumerated rather than gestured at. The file closes with "The reach, after every ruling" and
names four files. Inside that reach the work is counted: thirty concrete mentions across thirteen files,
eleven of them `CLAUDE.meta.md` self-citations for ruling F to judge one at a time, ten generic placeholders
for ruling J to colocate, and a six-versus-18 split of the sidecar tier that a replacement rule has to cover.
A spec author can run the design-pass checklist against that without opening the tree.

Anchor 5 rather than 4, because the unknowns that could move the bound are named and several carry their
cost. Open question 1 is the structural one — whether routing branches 2, 4 and 5 move into the new section
or become pointers into it — and the file says why it is load-bearing: the routing test's value is that it is
one ordered procedure walked in sequence, so a version with holes is worse than a longer one. Open question 2
asks whether the routing tie-break survives relocation, given that part of its force comes from sitting
inside the test. Open question 3 puts ruling J against CLAUDE.md's own branch 3 exception for the Conventions
bullet. Open question 4 asks where the section sits relative to the test.

Note what the reach does **not** include, and why the kind holds. Ruling B declines the mechanical binding,
so no diff lands in `scripts/`. Had it been taken, the discriminator would have moved the label to
enabler-technical.

## Small

No design-pass trigger from CLAUDE.md's checklist fires. The slice creates and moves no module, crosses no
layering, names no oversized target, and spans no `src/` modules at all. The trigger for a restructure with
no behavior change reads on `src/` shape, and the file records — measured 2026-09-20 on the
`checkers-do-not-reach-the-assessment-sidecar` slice — that nothing binds a sidecar to CLAUDE.md's pair
index, so there is no behavior to preserve.

The design pass runs anyway, required for the Enabler pipeline and ruled 2026-09-17, since no `product`
SPECIFY precedes it. That is the pipeline's rule rather than a finding about this file's size.

Anchor 4 rather than 5. Ruling E carries the reach to four files and every named mention, so the seams are
real files: ruling I's two removals in `doc-comments.md` could land alone, and ruling E's gate-fact move into
`mutation-testing.md` could land alone. The file argues each seam closed rather than absent — ruling I says a
roster left in the article that owns the tier relocates the defect instead of removing it — which is the
right argument and still not anchor 5's "a split would have nothing to separate."

## Testable

Scored against the checker-bearing column, and this stays the file's weakest letter.

The finished state is named: five properties a reader can check, plus the placement rulings surviving
somewhere reachable. The direction of change is unambiguous. A current reading exists and is dated, and the
reading afterwards is structurally implied, since a section naming no instances has no roster to be wrong.

The file names two real gates with dated readings that must hold across the slice. `npm run reference-check`
passed on `de8fbd6`, 2026-09-21, at 546 files and 3275 references, with four `<module>.meta.md` tokens
already in CLAUDE.md — the evidence that ruling J's colocated placeholders are safe against it. Ruling E
names the second: check C4 of `npm run mutation-invariance` reds when a config path has no argument in
`mutation-testing.meta.md`. Checked on `f22f3e5`, 2026-09-21: `mutation-testing.md` states in its own text
that deleting an entry now reds that run, so the destination for the moved gate fact already carries it.

Both are invariance guards. Neither goes from red to green, and neither reads the thing the slice exists to
change. The letter asks for the check that establishes the finished state, and ruling B makes its absence
permanent by design rather than by omission — a mechanical binding over this tier is now a closed decision
with a No-go behind it. So the acceptance reading is a human's, against a signed spec.

That holds T at 3, and it is not a blocking finding. The acceptance route for a process enabler already
exists in the corpus — `coach` SPEC with the user's signature, then `coach` REVIEW against the signed spec,
with `editor` AUDIT running the prose gates over the edit. The file does not restate it. Naming it, and
naming the two guard readings as the slice's own regression net, is a writing task at spec time, so the spike
test returns revise rather than spike.

## What happens next

Ready: promote to `backlog/ready/a-reader-finds-a-sidecar-without-an-inventory/`, after a human ruling.

## The human ruling

Ruled 2026-09-21.

Independent — agree.
Negotiable — agree.
Valuable — agree.
Estimable — agree.
Small — agree.
Testable — agree.
