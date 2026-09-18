---
name: verbatim-moves-need-a-referent-sweep
title: Mandate a referent sweep in any spec that mandates a verbatim move
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R7 as
revised in its follow-up ruling, 2026-09-17. `coach` ranked this first of its seven.

## Situation

`slice/extract-the-merge-protocol` is the worked proof. A byte-for-byte move is the right
way to keep a move reviewable — and it carried a self-referential claim into falsehood
("It once lived in this file", where "this file" no longer meant CLAUDE.md) and a
directional pointer into a dangling one ("See X above"). Neither `reference-check` nor
Vale can see either class. Three passes — `writer`, `editor` CLEAN, `editor` AUDIT — all
correctly verified byte-fidelity, and therefore all looked past the meaning. `coach`
REVIEW caught both by reading for meaning.

## Complication

The same slice then produced a second, structurally distinct instance: its check-readings
table drifted three times, invisibly to every gate, because per-file rows name files by
construction — so the row recording a whole-tree reference count falsifies itself when a
sibling row lands after the measurement.

## Question

Where do the two remedies live, and is either mechanically checkable?

## Answer

Shaped, per `coach`:

- **The referent sweep.** A `coach` spec that mandates a verbatim move must also mandate a
  sweep of the moved block for `this file`, `here`, `above`, `below`, `this session`,
  `this repo`, and quoted section names — ruled one by one before the move is signed.
  Candidate homes: `claim-discipline.md`, or the spec section of
  `.claude/references/role-file-shape.md`. This half probably needs judgement.
- Ask `architect` whether the sweep is fixturable as a `Claim` rule scoped to a moved block.
  If it is, this becomes an enabler-technical; if uncertain, a spike is the right shape.

**The table prohibition left this file on 2026-09-18** and now lands inside
`backlog/ideas/claim-discipline-does-not-name-the-self-describing-count.md`, which
generalises it: a check-readings table carrying both a whole-tree count and a per-file row
is one instance of a record counting its own slice's edits. Writing the general rule and its
special case as two slices would have meant either duplication or a collision in one
article. Nothing about the referent sweep collides with it — a stranded `this file` is not a
count — so this item stands on its own.

## Open questions

- Does the sweep's word list live in the rule text or in a fixture, so a later slice can
  extend it without a prose edit?
