# Retro findings — assessment-records-die-with-the-conversation

The orchestrating seat, 2026-09-20. Recorded during the slice rather than after it, for the
retrospective on this folder. Nothing here is ruled; each is a question with its evidence beside
it.

## A pass is scoped by prompt prose, and the prompt is the one artifact nothing checks

**The question for the retrospective: should each pass of a pipeline get its own task file,
written from the spec, so the unit of dispatch is an artifact rather than a paragraph?**

Every writing pass in this slice was scoped by a sentence in an invocation — "this pass is step 3,
items C1 through C6 only". The spec and its six amendments were committed, gated, signed and
immutable. The prompt that carried a subset of them to the executing role was none of those
things. It was composed fresh each time, checked by nobody, and reviewed only in the sense that
its output was.

Three defects in this slice came from that surface, and no gate could have caught any of them.

- **A truncated artifact, step 4.** The seat assembled four signed sources into one prompt file
  and cut the last item at its trailing rationale. `writer` reported the truncation because the
  file ended mid-section; had the cut fallen two paragraphs earlier it would have removed a
  Replace block, and neither end could have seen it.
- **A miscounted roster, the amendment 6 pass.** The prompt's header said nine files and its body
  named eleven. `writer` cross-checked against the amendment's own supersession table, executed
  the eleven, and reported the header as a miscount.
- **Scoping by omission, ruled away deliberately.** Amendment 6's item 17 traded it for an
  item-number declaration, on the argument that omission was never the operative constraint —
  instruction fired first in all six passes, so the record says nothing about what omission was
  worth. That trade is sound and it leaves the prompt as the only thing standing between a spec
  and a pass.

## The board already names the artifact, and nothing has ever written one

`tasks.md` is in CLAUDE.md's ready-lane list — "when dispatch is multi-unit" — and in the
pipelines reference's step table for the story and technical pipelines, as a handoff of
`architect` DESIGN. Both files carry an allow-marker saying no ready item has one yet, worded to
go stale when the first does. Read on 2026-09-20: no item carries one.

So the convention anticipated multi-unit dispatch and the practice never reached it. This slice
ran seven writing passes over nine files under one spec and six amendments, which is multi-unit
by any reading, and it wrote no such file.

**Two facts the retrospective should weigh before treating this as a simple adoption.**

- **The process-enabler pipeline names no producer for `tasks.md`.** Its step table runs coach,
  writer and editor, and the artifact is attributed to a design pass that pipeline does not have.
  So adopting it here is not filling in a blank; it is deciding who writes it.
- **Item 17 changed what a prompt has to carry.** A role may now read its own item's spec and
  amendments at paths the prompt names. A task file is a third thing — neither the signed
  authority nor the prompt — and whether it needs its own signature is the question that decides
  whether it removes ceremony or adds it.

## What a task file would and would not fix

It would move the pass boundary out of prose and into a file that can be committed, diffed and
cited. Both defects above were defects of a thing nobody could check; an artifact is checkable.

It would not remove the composing step, only relocate it. A task file written from the spec can
drop an item exactly as a prompt can. The difference is that the drop would then be visible in a
diff and durable in the tree, rather than living in an invocation nobody keeps.

**The alternative the retrospective should consider against it:** the item-number declaration
item 17 landed already makes a truncation visible at the receiving end, and it cost one sentence
rather than an artifact per pass. Whether a task file buys enough beyond that to justify its own
ceremony is the call.

## Findings binned to this retrospective under the slice's stopping condition

The user signed a stopping condition with amendment 7 on 2026-09-20: after it, a non-blocking
finding comes here rather than reopening the slice, and only a live contradiction between two
landed instructions or a red gate reopens it. `editor` CLEAN binned the four below on that rule
and argued against its own placement on the last one.

- **A probe bullet overclaims in its lead.** `prose.md`'s new probe instruction opens "Put the
  copy where no gate reaches it", and its body narrows that to one validator. Three other
  `agent-doc-check` checks and `reference-check` do reach a subdirectory copy. For probe content
  the size of a bullet all four stay green, so no wrong action follows — but the universal sits
  in the article that carries the sibling of the rule against exactly that shape.
- **A nested bullet's referent has no antecedent.** "Take the pre-edit baseline at the same path
  first" is the first nested bullet under a lead that names no path. The sentence after it
  supplies the meaning, so a reader lands correctly.
- **`writer.md` states a scoped rule in blanket form.** Its "Never derive a board path" does not
  carry the read and write split the canonical statement now makes. Harmless while every path
  that role writes arrives named in a spec; it will not carry the split if that changes.
- **`/idea-assess`'s "and nothing else" reads wider than the item intended.** The judging pass
  also rules the kind label, which three files mandate. `editor` binned this as non-blocking
  because the next sentence names the two excluded acts, and recorded the argument against its
  own placement: a charitable reading of a trailing clause is what the carve-out repair rejected
  one amendment earlier.

One observation sat below `editor`'s own bar for a finding and is kept here rather than lost.
`orchestration.md`'s topic sentence says `backlog/` is a duty no role can perform, which is now
literally wider than the corpus — one role writes a spec into the ready lane and another holds
board docs in its write surface. It reads as a claim about board management, and the pointer
beside it routes the reader to the file that states the rule.

## The amendment chain is itself a finding

Eight amendments carried 24 items. The retrospective should read the shape rather than the
count.

The three amendments that found defects in this slice's own subject — the record, the ruling
act, the promotion — are the first, the second and the fifth. The last three found almost
nothing about assessment records and almost everything about the repairs. `coach` ruled that
convergence on the original subject and divergence on the repair subject, and closed the second
with a census by recorded method plus a cut from five homes for one rule to four.

**The question left for the retrospective: what made a one-rule change cost five amendments?**
The rule was small and its homes were many. Every home was correct in isolation and the set was
never censused as a set until the sixth amendment, by which point each repair was landing into a
corpus the previous repair had moved. A rule's cost is the number of files that restate it, and
nothing in this repo measures that before the rule lands.

## The census enumeration failed again, and nothing was wrong

The ninth amendment censused by claim rather than by token, read 3,047 paragraphs across 55
files, and enumerated twelve paragraphs stating who may touch the board. It named its falsifier:
a paragraph stating a board rule and absent from that table.

`editor` reproduced the instrument first, matching all three of its numbers, then attacked it on
the axis its author could not. The argument was that a claim about the board must name its
subject — true, and not what the filter tested, since the filter tested five spellings of the
subject. Widened to every synonym the corpus actually uses, the census found 27 more paragraphs
and **four more homes**: a read grant in `writer.md`'s Owns, two statements in the pipelines step
table, one on amendment authorship, and a write grant living in YAML frontmatter rather than in
prose at all.

**None of the four is a defect.** All four agree with the canonical rule. So the enumeration
failed and the corpus did not, which is the fourth consecutive round finding no new defect.

Three things the retrospective should take from that.

- **The decisive miss had a foreclosed objection.** `coach`'s table listed one role file's Owns
  grant and not its mirror image in the other role file. One inclusion rule, applied to one file
  and not to the other.
- **The residual its author named was the one place empty.** A second probe for cross-paragraph
  anaphora returned 33 hits, all read, none stating a board rule. The misses were all on the axis
  believed safe.
- **A permission in frontmatter is a home no paragraph census reaches.** It is not prose, and no
  method in this chain would have found it.

The count of homes is deliberately not written into the corpus. It would rot the way every other
census in this slice rotted, and the durable artifact is the recorded method rather than the
number it produced this time.

## A probe can land in the wrong rule section

`editor`'s first baseline read 25 where the file reads 23. Its probe copy sat in a subdirectory
of `.claude/agents/`, which `.vale.ini` reaches with the `Instruction` style that the articles
section switches off — two extra findings, both from rules the real path does not carry.

`prose.md` already says to probe at a path on the same `.vale.ini` glob, and this is a live case
of that instruction being right and terse. A subdirectory can be **in scope for the checker and
in a different rule section at once**, and the reading it produces is wrong in the direction that
looks like a regression. Whether the instruction should name that case is a question for whoever
next opens the probe bullet.

## Two small records

The ninth amendment describes its second item as three words; the token delta is two. The
amendment is signed and immutable, so the correction lives here.

`handoffs.md` says "the seat" once where the rest of the file says "the orchestrating session".
Pre-existing and identical before the edit, named only because deleting the false universal
removed its nearest contrast word.

## A seventh `kind:` home, false before this slice began

`coach` REVIEW found `idea-capture/SKILL.md` telling a reader that the judging pass writes the
`kind:` field at assessment. It does not — its own write rules put the idea file, its frontmatter
and its lane outside its reach, and three other files attribute the write to the promotion after
the move.

**It is not this slice's damage.** `git log -L` places the sentence in the board-migration slice,
where it was already false: the attribution then named the seat, not the judging pass. `coach`
censused the class and found seven homes making a `kind:` attribution, exactly one wrong.

It went to this file rather than a tenth amendment on the slice's own discriminator — the
instruction is correct and only its reason misattributes, the promoting command performs the
write regardless, and no gate moves. The cost of the alternative was widening a signed file set
to a sixteenth file for one clause.

## The question `coach` takes to the retrospective

**Before admitting an item into a running slice, census how many files restate the rule it
changes. An item whose answer is one rides. An item whose answer is unknown is a slice of its
own.**

Its verdict on this cycle, asked directly and answered directly: it should have closed earlier,
not at an amendment number but at the item that retired a standing universal. Four of nine
amendments and twelve of twenty-seven items exist because of that one item, and the slice's
subject had closed before it.

**Two signals were readable at the time.** The amendment's own sign-off called that item the
heaviest edit in the set — a rule changed rather than added, at four of its seven anchors — and
drew no conclusion from it. And "seven anchors in five files" was a count standing without a
verified enumeration, which is the defect the house rules name, committed inside an amendment
repairing that same defect elsewhere. **A rule-spread count that has not been censused by method
is the tell that the item is bigger than the slice.**

**The control case matters, and it cuts against blaming direction.** One earlier item was also
ruled out of scope and directed in by the user; it cost one bullet, one file, no residue. The
difference was measurable before signature: that item changed a rule nothing else stated, and
this one changed a rule other files restate. Nobody was asked to check which.

**And one fact cuts the other way.** The universal the item retired was born false, in the same
commit that gave a role a board deliverable and told it not to read the board. It had been false
through at least one intervening slice. So the repair chain did not only undo its own damage — it
closed a pre-existing falsehood the item exposed, and the corpus now states that rule in four
homes with a recorded, re-runnable census method. Closing earlier would have been better; the
work was not waste.

**What nobody claims.** That a fourth census method would have found every home. Three
convergence claims failed in a row and all three failed the same way — a census narrower than
the claim space. The honest reading is that the corpus held better than any instrument in this
slice measured it.
