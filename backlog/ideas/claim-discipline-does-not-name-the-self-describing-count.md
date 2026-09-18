---
name: claim-discipline-does-not-name-the-self-describing-count
title: Name the self-describing count as a claim-discipline defect class
created: 2026-09-18
kind: enabler-process
---

Captured from `coach` REVIEW on `slice/split-the-merge-protocol-reasoning-into-its-sidecar`,
rounds 1 to 3, 2026-09-18, with the user's approval the same day. `coach` ruled it outside
that slice's authority: it binds every role, not one pair.

**Scope narrowed to the rule alone, 2026-09-18.** `/idea-assess` ruled this file an Epic:
it carried the rule and a corpus-wide sidecar sweep with no ordering between them, and E and
S scored 3 and 2 on the unbounded half. The user ruled the split, and ruled that both halves
belong under the existing `effective-prose` epic rather than under a new one — its Wave 4 is
already "mechanise the claim discipline". The sweep is now
`backlog/ideas/sweep-the-sidecars-for-change-logs.md`.

**This file also absorbed the check-readings table prohibition** from
`backlog/ideas/verbatim-moves-need-a-referent-sweep.md`, which is the special case this rule
generalises. That item keeps the referent sweep, which is a different defect class.

## Situation

`.claude/agents/articles/claim-discipline.md` rules on counts. A census of external state
drops its numeral and keeps the enumeration. A count standing beside its own adjacent
bullets stays, because it cannot drift with the tree.

## Complication

Neither rule reaches the count that broke
`slice/split-the-merge-protocol-reasoning-into-its-sidecar` three times: **a count of the
slice's own in-flight diff.** It is not a census of the tree, and its adjacent enumeration
does not protect it, because the failure is incompleteness at authoring rather than drift
afterwards.

Fifteen findings across three review rounds, all of one class. None was in the instruction
half's rules, in `writer`'s execution, or in prose that was moved. Every one was in
`coach`-authored prose counting or describing that slice's own edits: a deletion count short
by one, a rewrite count short by one, a rewrite count short by ten, a figure describing the
file it sat in, and a bullet quoting a clause a sibling item had removed in the same commit.

Two mechanisms make it worse than an ordinary stale count. The record is written **while**
the diff it describes is still changing, so a correct count falsifies itself later in the
same cycle. And one item can remove the text another item quotes, inside one commit, with no
gate able to see it.

Every failure was invisible to the gates. `reference-check`, `agent-doc-check` and
`prose-lint` read green throughout, while a record described a tree that had moved under it.

The pair already named the hazard for exactly one row — "the row recording the count can
falsify itself" — and nobody generalised it, so each recurrence was diagnosed from scratch.

## The ordering with the sidecar ruling

The user's 2026-09-18 sidecar ruling — a `.meta.md` carries explanation, never a log of what
a slice changed — removes this defect's commonest habitat rather than policing it, and it is
`sweep-the-sidecars-for-change-logs` that applies it. **This rule still binds where that one
does not reach**, since a count of a slice's own diff can sit in an instruction file, a
board artifact, or a commit body, none of which the sweep touches.

**The two tests are ordered, not competing.** The sidecar ruling gates whether a passage
belongs in a sidecar at all. `coach`'s test applies afterwards, to a count inside a passage
that has already passed that gate:

> Where a count survives inside a passage that explains, it stays only when a command
> re-derives it; a count only a diff can verify goes even there.

The worked case is `prose.meta.md`'s surviving "51 of 51" figure: it explains a ruling, so it
passes the first gate, and `vale` re-derives it, so the count may stand.

## Question

What does `claim-discipline.md` say about a count of your own in-flight diff, and where
should such a count live instead?

## Answer

Shaped, per `coach`:

- **State the rule.** A record does not count its own slice's edits. The diff is
  authoritative and free; a hand-written enumeration of it is neither.
- **Say where it goes instead.** The slice's own history, reachable from the `slice/` tag,
  or the item's `spec.md`, which is not corpus and which the retrospective deletes. A dated,
  method-attributed measurement is acceptable in either; an undated live claim is not.
- **Name the same-commit variant explicitly.** A record may not quote a string that another
  item in the same change removes. That is what turned a correct bullet into a false one.
- Ask `architect` whether any of it is fixturable as a `Claim` rule. `coach` doubts it: the
  defect is an absent bullet, and no matcher sees what is not written.

**Carry `coach`'s counter-intuitive ruling with the rule, or the next reader will reverse
it: the numeral is not the defect.** Twice in that slice an incomplete enumeration was
caught precisely because a numeral stood beside it and disagreed. Stripping the numeral
would have hidden the omission rather than fixing it.

**The table prohibition is this rule's special case, and lands with it rather than beside
it.** A check-readings table may not carry both a whole-tree token count and a per-file row,
because a per-file row names a file and so moves the count the other row records. Write it
as the worked instance under the general rule, not as a second rule: the general form is
that a record does not count its own slice's edits, and this is what that looks like in a
table. **Measure before writing it** — the sidecar ruling deleted both check-readings tables
from `merge-protocol.meta.md`, so the construct may be shrinking. If it survives only in
board artifacts, say so and scope the instance there.

`backlog/ideas/verbatim-moves-need-a-referent-sweep.md` keeps the referent sweep, which is a
different class — a moved sentence whose `this file` or `above` no longer resolves — and is
the third member of the family this slice's evidence produced.

## No-gos

- Do not widen the existing census rule to cover this. The two fail differently: a census
  drifts with the tree, and this one is wrong the moment it is written.
- No new Vale rule in this item. Whether any of it is mechanically checkable is a separate
  question, and `architect` owns the styles.
- No retrofit of the records that produced the evidence. They are records.

## Open questions

- Does the rule bind a `backlog/` artifact at all, given the lane is unlinted and the folder
  is deleted at retrospective? The table prohibition's answer may depend on this, since the
  construct now survives mainly there.
- Does the guidance belong in `claim-discipline.md` alone, or does `prose.md` need a
  matching line where it discusses records?
- `mechanise-the-prose-direction-check` asks whether the token-frequency diff becomes a
  command. That diff is what caught the dropped obligation this rule exists to prevent, so
  the two are the judged and mechanical halves of one question. Which lands first?

**Struck by `/idea-assess`, 2026-09-18:** whether `apply-the-census-count-rule-everywhere`
absorbs this. It does not, and this file's own No-go already says why — a census drifts with
the tree, and this one is wrong the moment it is written. They are Wave 4 siblings, not
duplicates.
