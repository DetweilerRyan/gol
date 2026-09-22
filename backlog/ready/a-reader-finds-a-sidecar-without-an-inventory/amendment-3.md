# Amendment 3: a-reader-finds-a-sidecar-without-an-inventory

Written by `coach`, REVIEW mode, 2026-09-22. Measured on the slice worktree at `2be5e07`.

**This is the slice's third amendment.** The live instruction set is `spec.md`, `amendment-1.md`,
`amendment-2.md` and this file, read in that order, with later text winning.

**Three items, C1 to C3, in two files.** C1 and C2 close the two findings this slice's own edits
created. C3 repairs a pre-existing garble the user granted into the slice over my recommendation to
decline it.

**This file states intent and constraints, not replacement bytes**, on amendment 1's second ruling.
Each item gives the anchor, what the sentence must say, what it must not say, and the reading it
must land inside. `writer` chooses the wording. `editor` may repair register in it.

## What this supersedes

- **C1 supersedes `amendment-2.md`'s B1 must-say list by adding one clause to it, and supersedes
  nothing else in B1.** B1's four-sentence cap, its 25-word sentence cap, its must-not-say list and
  its verbatim tokens all stand and bind C1 unchanged.
- **C2 supersedes nothing.** No instruction in this slice reached `.claude/skills/`.
- **C3 supersedes nothing.** `amendment-1.md`'s A8 already superseded spec item 8's closing
  `Change nothing else in prose.md`, so no live instruction forbids a further edit to that file.

B2 is landed and closed. Spec item 4c stands. A9's STAY rulings and its prohibition on deleting any
`<!-- Closed decision: … -->` comment stand. Nothing else is superseded.

## C3 was granted over my recommendation, and the record belongs here

I recommended declining C3 in the REVIEW handoff, on the ground that amendment 1 absorbing granted
residue is what produced amendment 2. The user read that account and granted C3 anyway. Their
instruction, verbatim:

> i appreciate coach's desire to stay in scope but let's leave the trail better than when we found
> it. fold in the free fix to prose.md's garbled statment. back out if it ends up being a whole
> thing

**The grant carries its own escape, stated as C3's fallback below.** That escape is the user's
pre-decided ruling rather than a judgement `writer`, `editor` or I make later.

This paragraph is here because the retrospective deletes this folder, and a grant recorded only in a
chat message is the defect this whole slice exists to close.

---

## The two findings this slice created, stated once

**Finding 1 — a mandate and a prohibition sit over one sentence, and this slice wrote both.**

`claim-discipline.md`'s header carries "Its evidence lives in the sidecar `engineering.meta.md`,
alongside the rules these were split from." **That sentence is byte-identical on `main`** — the
slice did not write it. The slice wrote both instruments that now govern it: `CLAUDE.md`'s sidecar
section, which mandates that a file whose evidence sits in another file's sidecar says so in its own
header, and B1's prohibition in `prose.md`.

Whether B1 reaches it turns on one undecided word. Three readings exist, and two acquit:

| Reading of "its own `.meta.md` sidecar"               | Does B1 reach the sentence?                                 | Verdict    |
| ----------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| The sidecar named after this file                     | No. `engineering.meta.md` is not named after this file.     | permitted  |
| The sidecar holding this file's evidence              | Yes, but the appositive limits the prohibited forms to two. | permitted  |
| The same, reading "alongside the rules …" as a census | Yes, and the census clause catches it.                      | prohibited |

**B1 is defensible as landed. It is not usable at that boundary.** Four lines above it the list
frames itself: "Each is a shape to remove on sight, not a judgement call." A bullet that needs a
three-reading argument is not on-sight, and `amendment-2.md` named the prohibition's usability as
this slice's deliverable.

**Closing it by ruling alone is not available.** `amendment-2.md`'s stated finding was a sanction
recorded only in `amendment-1.md`, which the retrospective deletes. A REVIEW ruling that the
sentence is permitted lives in a handoff and in no corpus file. Declining the edit reproduces, one
round later, the defect amendment 2 was written to close.

**Finding 2 — the over-catching defect survived the correction, one tier down.**

`.claude/skills/prose-audit/SKILL.md`'s "forms to check" list restates the pre-amendment bullet
without qualification: a sidecar pointer in an instruction file, a fact about another role's file, a
restatement of a cited section, an execution-order claim. **That line is byte-identical on `main`.**
What this slice changed is the bullet it restates — A10 narrowed it and B1 re-drew it, and the
restatement tracks neither. The skill now instructs its auditor to flag the class B1 was written to
protect.

**This is worse than a stale line.** The skill's own step 2 requires the auditor to read
`prose.md`'s "Instruction stays. Explanation moves." in full, and
`### What an instruction file may not carry` is a subsection of it. So the auditor reads the narrowed
bullet and then reads a contradicting summary of it in their own instructions. The skill runs every
`editor` AUDIT pass, so the defect recurs every cycle.

---

## C1 — `prose.md`: the bullet says which sidecar "its own" means

**Anchor.** In "What an instruction file may not carry", the bullet beginning
`- **A pointer to its own `.meta.md` sidecar, addressed to every reader`.

**It must say** which sidecar the prohibition is about: the one named after the file carrying the
pointer. **It must also say** that naming another file's sidecar, to announce where this file's
evidence sits, is what `CLAUDE.md`'s sidecar section requires rather than what this bullet forbids.

**It must not** read as general permission for a read trigger pointing at another file's sidecar.
The permitted form is the header announcement `CLAUDE.md` mandates, and tying the clause to that
announcement is what keeps the bullet from re-admitting the shape A9 deleted eight times, one file
over. It must not name `claim-discipline.md`, `engineering.meta.md` or any other instance, must not
carry a count, and must not take the bullet past four sentences.

**Verbatim, carried forward from B1 with its load unchanged:** the token `.meta.md`, which is the
bullet's subject and the token a reader greps, and `@see`, which the carve-out turns on.

**Why the repair belongs in `prose.md` rather than in `CLAUDE.md`.** A clause in `CLAUDE.md` saying
that `prose.md` does not prohibit the mandated header pointer would be a restatement of a section it
cites, which is the third shape in this very bullet list. The auto-loaded surface states the
mandate; the rulebook states its own scope.

**Wording constraints, measured at this path.** Every sentence stays at 25 words or fewer —
`STE.SentenceLength`'s cap. The bullet as landed is three sentences with its longest at 24 words, so
one sentence of 25 words or fewer fits inside B1's signed bounds. **`Instruction.ListItemSentences`
does not reach this file**: `.vale.ini`'s `[.claude/agents/articles/**]` section sets all three
`Instruction.*` rules to `NO`. **`Procedure.ProcedureLength` does not reach a `-` bullet**, since its
script matches a numbered marker only. Avoid a connective followed by an imperative verb, which is
`Procedure.OneInstruction`'s trigger.

**Check.** Read the landed bullet against `claim-discipline.md`'s header sentence without this file
in hand. It must sort one way, not two. B1's own five-case table must still sort as it does today —
the added clause narrows the subject and must not move any of the five.
`vale .claude/agents/articles/prose.md` reports **5**, with no finding on the bullet.

## C2 — `.claude/skills/prose-audit/SKILL.md`: the `prose.md` line routes rather than restates

**Anchor.** In "The forms to check", the bullet beginning `- From `prose.md`:`.

**It must say** that the forms are `prose.md`'s, and name the section
`What an instruction file may not carry` so the auditor can find it.

**It must not** enumerate the shapes, carry a count of them, or grow past one line. It must not
touch the two `claim-discipline.md` bullets above it, and must not touch any other line in the file.

**Verbatim:** the section heading `What an instruction file may not carry`, which must match
`prose.md`'s heading exactly or the auditor cannot find it; and `prose.md`, which
`npm run reference-check` resolves.

**Why a pointer rather than a corrected enumeration.** A hand-maintained copy of a bullet this slice
just proved drifts will break at the next narrowing, and nothing checks it. The auditor is already
required to read that section in full at step 2, so the pointer loses no authority.

**The asymmetry with the two bullets above is deliberate and stays.** They restate
`claim-discipline.md`, which this slice did not move, so they are accurate today. Whether all three
should become pointers is a separate question and goes to the board, not to this item.

**Wording constraints, and this path is guarded differently from `prose.md`.** `.vale.ini`'s
`[.claude/skills/**/*.md]` section enables all three `Instruction.*` rules at `warning`, so
`Instruction.ListItemSentences` and `Instruction.ParagraphSentences` both reach this bullet. Write
one sentence.

**Check.** The bullet names a section and no form. `vale .claude/skills/prose-audit/SKILL.md`
reports **0** — its pre-edit reading, measured at `2be5e07`.

## C3 — `prose.md`: repair the garbled clause

**Anchor.** In the same list as C1, the bullet beginning `- **A fact about another role's file**`,
and within it the first clause of its opening sentence.

**Pre-existing, and named as such. Granted by the user over my recommendation to decline.** What
made it visible is `writer` and `editor` working the bullet two lines above it.

**What I measured, so `writer` does not have to.** The clause was **born garbled** at commit
`52741e4` on 2026-09-11, in the pass that created this whole bullet list. No earlier correct form
exists anywhere in history, and the 2026-09-12 rename of `prose-linting.md` to `prose.md` was
move-only. **So the repair is a reconstruction, not a restoration.** `writer` has no authoritative
prior text to recover and should not go looking for one.

**It must say** the same thing its two sibling clauses say, at the same altitude: which role owns a
duty. The three clauses are parallel questions about another role's file, and the first one is the
only one that does not parse.

**It must not** change the other two clauses, the three sentences that follow, or the bullet's bolded
lead. It must not grow the sentence past 25 words, and must not turn the clause into a ruling about
any role's actual duties.

**Nothing in this clause carries load, and that is why it is repairable.** No gate matches it, no
citation resolves against it, and no file quotes it. I checked.

**My reading, which `writer` may take or set aside.** Every candidate reconstruction names the same
prohibited shape — a statement of which role owns a duty — so the choice between them does not
decide anything. That makes this a grammatical repair rather than a ruling. **`writer` makes the
call in the moment against C3's fallback below, and says which of the two it was.**

**Check.** The clause parses. `vale .claude/agents/articles/prose.md` reports **5**, with no finding
on the bullet.

---

## Findings ruled without a corpus edit

These were reported this cycle and are ruled here so they do not return as open questions.

- **`ast-grep-rules.md`'s "Four more are not restated here" is not a finding, and I overturn the
  relayed report of it.** The sentence is followed by exactly four items, so its own number is right.
  The next sentence disclaims the completeness reading outright — read `CLAUDE.md`'s entry "rather
  than treating this list as the whole obligation". Nothing to repair.
- **`ast-grep-rules.md`'s "Four things that make a rule inert" over five bullets stays.** Verified
  pre-existing on `main`, same heading and same five bullets. It goes to the lead-count candidate
  with `engineering.md`'s matching instance.
- **`engineering.md`'s "these four" over five gating checkers stays.** Verified pre-existing on
  `main`. Same shape, same candidate.
- **Every `prose.md` finding outside C1 and C3 stays.** The undocumented `Claim` style, the two wrong
  rule-editing place counts, the live "five role files" census and the skill-tier roster omission are
  all pre-existing and all go to the `prose.md` candidate. C3 is the one exception the user granted,
  and it is granted as a grammatical repair rather than as a triage pass on that file.
- **`mutation-testing.meta.md`'s dedented continuation stays.** Pre-existing, in a sidecar, same
  candidate.
- **Stopping conditions 3 and 4 of `amendment-2.md` are discharged against this slice's diff, not
  against the corpus.** I wrote both as properties of the corpus. A slice cannot discharge a property
  of a corpus it did not author, and `handoffs.md` already makes a pre-existing finding out of scope
  by default. The wording was mine and it was too wide. This amendment's own conditions below are
  scoped to its diff, which is the correction applied.

## Stopping condition

Check these by reading. None needs a measurement.

1. `prose.md`'s prohibition bullet states which sidecar "its own" means, and
   `claim-discipline.md`'s header sentence sorts one way under it rather than two.
2. `SKILL.md`'s `prose.md` bullet names a section and enumerates no prose form.
3. The "another role's file" bullet's first clause parses, and names the same shape its two sibling
   clauses name — or C3 was dropped under its fallback and `writer` said which reading forced it.
4. **Nothing outside those three bullets in those two files changed.** `git diff --stat` for this
   pass names `prose.md` and `SKILL.md` and no other file.

When all four hold, the cycle closes and the slice goes to the merge protocol.

## Check readings, before and after

| Command                                    | Before (`2be5e07`)   | After                        | A different reading means                             |
| ------------------------------------------ | -------------------- | ---------------------------- | ----------------------------------------------------- |
| `vale .claude/agents/articles/prose.md`    | 5 warnings in 1 file | **5**, none on either bullet | C1 or C3 grew a sentence past a cap                   |
| `vale .claude/skills/prose-audit/SKILL.md` | 0 warnings in 1 file | **0**                        | C2's replacement is more than one sentence            |
| `npm run agent-doc-check`                  | pass                 | pass, same counts            | an edit moved an `npm run` reference                  |
| `npm run reference-check`                  | 3226 references      | pass                         | a citation stopped resolving — read the failure       |
| `npm run prose-lint`                       | 586 tracked files    | 586 tracked files            | a file was added or removed; this amendment adds none |

**Read `reference-check`'s pass, not its total.** C2 names `prose.md` on a line that already names
it, so the total may not move at all. A fall to zero failures is the reading.

**No `src/` gate moves.** The diff reaches no file any of them read.

## What would falsify this amendment

Report these to the seat rather than working around them.

- **C1 cannot state the discriminator without naming an instance.** Then it is a carve-out for one
  file rather than a rule, and it belongs in `CLAUDE.md`'s sidecar section beside the mandate that
  creates the case. Report it; do not name the instance in `prose.md`.
- **C1's added clause moves any of B1's five table cases.** Then the clause narrows more than the
  subject, and the item needs re-ruling rather than a rewording.
- **C2's routing sentence cannot name the section without a count or a form.** Report the item.

## Fallback, pre-decided

Run these instead of a further round.

- **If C1 cannot be written inside B1's four-sentence, 25-word bounds:** leave B1 exactly as landed,
  land C2 and C3, and route C1's discriminator to the `prose.md` candidate. The corpus then carries
  `claim-discipline.md`'s header sentence permitted under two of three readings, which is where this
  pass found it.
- **C3's own escape, which is the user's and pre-decided.** If the clause cannot be repaired without
  deciding what the sentence was meant to say — if the repair needs a ruling on another role's duties
  rather than a grammatical fix — **drop C3**, land C1 and C2, and route it to the `prose.md`
  candidate. Say plainly in the handoff which of the two it was.
- **No fourth round lands on this slice**, whatever the outcome. A returned item goes to the board.
