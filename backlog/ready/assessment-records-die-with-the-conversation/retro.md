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
