# Amendment 2: a-reader-finds-a-sidecar-without-an-inventory

Written by `coach`, REVIEW mode, 2026-09-22. Measured on the slice worktree at `a89635d`.

**Two items, B1 and B2, in two files.** Both close one finding: the slice authored a prohibition and
left four sanctioned violations of it, with the sanction recorded only in `amendment-1.md`, which the
retrospective deletes.

**This file states intent and constraints, not replacement bytes**, on amendment 1's second ruling.
Each item gives the anchor, what the sentence must say, what it must not say, and the reading it must
land inside. `writer` chooses the wording. `editor` may repair register in it.

## What this supersedes

- **B1 supersedes A10's must-say clause and the bullet's stated ground.** A10's carve-out for the
  module `@see` pointer stands unchanged, and B1 keeps it.
- **B2 supersedes A9's keep-list for `ast-grep-rules.md`** — both its "two rules documented outside
  the main enumeration" keep and its "Narrowing or widening a rule **is** changing one" keep — and
  A9's "must not delete a blockquote wholesale" clause **for that one file only**. A9's other seven
  files, its STAY rulings, and its prohibition on deleting any `<!-- Closed decision: … -->` comment
  all stand.

Nothing else is superseded. Spec item 4c stands, so the C4-to-check-5 analogy stays out of the
corpus. Amendment 1's A6 stands as landed. The live instruction set is `spec.md`, `amendment-1.md`
and this file, read in that order.

## The finding, stated once

A10's bullet prohibits a self-pointer "offered as a read trigger or as a census of its contents". Read
literally, that reaches four landed places this slice did not remove:

- `doc-comments.md`, in the block-tag closure blockquote — "Read `doc-comments.meta.md` before
  proposing a sixth row."
- `doc-comments.md`, in the presence-only-rule blockquote — "Read `doc-comments.meta.md` before
  re-proposing it."
- `mutation-testing.md`, in the `coverageAnalysis: off` blockquote — "See `mutation-testing.meta.md`
  before reaching for it."
- `ast-grep-rules.md`, in the header blockquote A9 kept — "The sidecar holds the two rules documented
  outside the main enumeration below."

**The first three are legitimate and the rule is wrong about them.** Each sits at the site of one
named closed decision and guards that decision against re-opening. That is the imperative form of the
`<!-- Closed decision: … are in `X.meta.md`. -->` comment A9 ruled STAY thirty-five times. A10 drew
its line at the grammatical mood — a citation stays, an imperative goes — when the load-bearing
difference is whether the pointer is **bound to one named ruling** or addressed to every reader of the
file. `prose.md`'s own exempt class 2 covers all three.

**The fourth is not legitimate, and it goes.** B2 removes it.

**A10's stated ground contradicts two live sentences, one of them in its own file.** The bullet
justifies itself with "an article's reader is following a rule rather than changing it". `prose.md`,
under "Instruction stays. Explanation moves.", says "It is read when a rule is being changed, never in
order to follow one". `CLAUDE.md`'s sidecar section, which this slice wrote, says "Read one when you
are changing the rule it stands behind, never in order to follow one". An article has change-time
readers; the three surviving triggers serve them. The clause is the outlier and it is what B1 replaces.

**A9's ground becomes true once B2 lands.** A9 argued the general trigger is stated once, in
`CLAUDE.md`. `ast-grep-rules.md`'s kept clause is the only surviving second copy of it, so removing
that clause makes the argument hold as landed rather than as predicted.

---

## B1 — `prose.md`: the prohibition discriminates on binding, not on mood

**Anchor.** In "What an instruction file may not carry", the bullet beginning `- **A pointer to its
own `.meta.md` sidecar`.

**It must say** that what is prohibited is a pointer addressed to every reader of the file — a general
read trigger, or a census of what the sidecar holds. **It must also say** that a pointer bound to one
named ruling, at the site where that ruling is stated, is not that pointer, whether it reads as a
citation or as an instruction to read before re-opening the ruling. It must keep the module `@see`
carve-out.

**It must not** say that an article's reader is following a rule rather than changing it, or anything
else that denies an article has change-time readers. It must not list instances, must not carry a
count, and must not grow past four sentences.

**Verbatim:** the token `.meta.md`, which is the bullet's subject and the token a reader greps, and
`@see`, which the carve-out turns on.

**Wording constraints from the enabled rule set, measured at this path.** Every sentence stays at 25
words or fewer — `STE.SentenceLength`'s cap, and the finding A8 spent a pass clearing.
`Procedure.ProcedureLength` does not reach a `-` bullet, since its script matches a numbered marker
only. Avoid a connective followed by an imperative verb, which is `Procedure.OneInstruction`'s
trigger.

**Check.** Read the landed bullet against five cases live in the corpus today, and it must sort each
one without `amendment-1.md` in hand:

| Landed case                                                              | Verdict    |
| ------------------------------------------------------------------------ | ---------- |
| `quality-tooling.md`'s `<!-- Closed decision: … -->` comment             | permitted  |
| The header blockquote shape A9 deleted from eight articles               | prohibited |
| A module hover's `@see {@link ./<module>.meta.md}`                       | permitted  |
| `doc-comments.md`'s "Read … before proposing a sixth row."               | permitted  |
| `doc-comments.md`'s "Every rule here is actionable without the sidecar." | permitted  |

`vale .claude/agents/articles/prose.md` reports **5 or fewer**, with no finding on the bullet.

## B2 — `ast-grep-rules.md`: delete the header blockquote

**Anchor.** The two-sentence blockquote between the `**Read when:**` list and the `## The rules`
heading.

**Delete the whole blockquote.** Both sentences, and nothing else in the file.

**Why each sentence goes.** The first is a census of the sidecar's contents, which A10 prohibits and
`claim-discipline.md` bans. It is also **wrong and duplicated**: it says two, the enumeration seven
lines below names three, and that enumeration already carries the fact correctly. A9 ruled the fact
"stays, re-homed in the article's own text" — the destination already held it, so the keep produced a
second copy with a bad count. The second sentence is the general read trigger, which is the one
surviving copy of what `CLAUDE.md`'s sidecar section states. Its own content — that narrowing a rule
is changing it — is already in this article's `**Read when:**` list and in the sidecar's own audience
line.

**It must not** touch `## The rules`, its enumeration, the re-derive instruction, or any other
sentence in the file. It must not add a replacement pointer, a count, or a statement of what the
sidecar holds.

**The alternative I rejected, so the signature is informed.** Keeping the trigger clause would need
B1 to carve out a third shape — a per-file scoping of the general trigger — which re-admits very
nearly what A9 deleted eight times. The prohibition's usability is this slice's deliverable, so the
clause loses.

**Check.** `grep -c 'two rules' .claude/agents/articles/ast-grep-rules.md` is **0**. The file states
the outside-the-enumeration set exactly once, and no two numbers in it disagree.
`vale .claude/agents/articles/ast-grep-rules.md` stays at **0**. `npm run agent-doc-check` passes at
32 rules, and `npm run reference-check` passes at **3226** — the blockquote names no file, so the
total does not move.

---

## Findings ruled without a corpus edit

These were reported in this cycle and are ruled here so they do not return as open questions.

- **A6's rationale and check were wrong; its landed prose is right.** A6 claimed its target was the
  only branch-numbered heading in `CLAUDE.meta.md`. `### Branch 1's own correction` predates this
  slice, is still present, and should stay — branch 1 is live, and that record is about branch 1's own
  text. A6's edit stands. An amendment's own reasoning is not corpus, so nothing is edited.
- **`ast-grep-rules.meta.md`'s "all 31 rules on disk" stays.** It sits inside the
  `## The split itself, measured` section, which names its slice and the date 2026-09-08. The tree
  held 31 rules then and holds 32 now. Editing a dated record to match a later tree is the failure A4
  was written against. A reader who compares that figure to the article's "Thirty-two" is reading a
  record as a live claim.
- **The C4-to-check-5 analogy stays out.** Spec item 4c ruled the drop deliberate and said not to
  reinstate it anywhere. A13 restored a **precedent** that illustrates a live rule; this is a
  comparison between two checkers, which is a different thing. Declined on the signed spec.
- **`doc-comments.md`'s "Every rule here is actionable without the sidecar." stays as landed.** It
  names no instance, and it tells the reader they need not open the sidecar. `CLAUDE.md` is
  auto-loaded, so the naming convention is in every reader's context. Naming the file here would
  re-create the shape A9 removed.
- **`ast-grep-rules.md`'s stranded definite article is closed by B2**, which deletes the sentence that
  carried it.

## Stopping condition

Check these by reading. None needs a measurement.

1. `prose.md`'s prohibition bullet names both the prohibited shape and the permitted one, and sorts
   the five cases in B1's table.
2. No sentence in `prose.md` asserts that an article's reader is not changing a rule.
3. `ast-grep-rules.md` carries no header blockquote, states the outside-the-enumeration set once, and
   carries no two numbers that disagree.
4. Every surviving `*.meta.md` read trigger in an instruction file is bound to one named ruling at
   that ruling's own site.

When all four hold, the cycle closes and the slice goes to the merge protocol.

## What would falsify this amendment

- **A landed `*.meta.md` mention that neither clause of B1's bullet reaches.** Then the two shapes are
  not separable by one bullet, and the prohibition belongs somewhere else — `claim-discipline.md`'s
  forms, or a per-tier rule — rather than in a narrower sentence here. Report it; do not widen the
  bullet in the moment.
- **No wording satisfies B1 inside 25 words a sentence and four sentences a bullet.** Report the
  item. `writer` does not amend an amendment.

## Fallback, pre-decided

Run this instead of a third amendment.

- **If B1 cannot be written as one bullet:** delete the three surviving body triggers in
  `doc-comments.md` and `mutation-testing.md`, and leave A10's bullet exactly as landed. The corpus is
  then consistent with the prohibition as signed, at the cost of three change-time triggers whose
  content is derivable from `CLAUDE.md`'s sidecar section. Execute B2 either way.
- **If B1's rationale clause can be replaced but the discriminator cannot:** replace the clause,
  leave the rest of the bullet as landed, and route the discriminator to a new `enabler-process`
  candidate. No third round lands on this slice.
