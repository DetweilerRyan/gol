---
name: a-reader-finds-a-sidecar-without-an-inventory
title: Let a reader locate any file's sidecar without CLAUDE.md enumerating them
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R6,
2026-09-17, as the residue after the references-tier half landed in that slice's amendment 6.
**Widened by the user 2026-09-21** from the role-file bullet to the whole index: the original
question offered two horns, and the second one — restate the bullet so it no longer implies
enumeration — is the one ruled. The file is renamed to match. **All four open questions were
ruled by the user the same day**; the rulings sit under their own heading below.

## Situation

CLAUDE.md carries a section that enumerates, across six tiers, which files have a `.meta.md`
sidecar and which do not. The section says of itself that nothing checks the list.

CLAUDE.md is auto-loaded into every session and every subagent, so the section is read by all
six audiences before any of them does any work.

## Complication

**Four measurements, taken on `main` at `5b2818c`, 2026-09-21.**

**The inventory is false today.** 24 sidecars are tracked; the section accounts for 23.
`scripts/board-shape-hook/board-shape.meta.md` landed in `one-item-shape-serves-every-lane`,
and the string `board-shape` appears nowhere in CLAUDE.md. A hand audit on the
`checkers-do-not-reach-the-assessment-sidecar` slice recorded the index complete a day earlier,
so the drift arrived between an audit and its next reader.

**A sidecar is a thing ordinary work adds.** `apply-the-census-count-rule-everywhere` supplies
the priority test the corpus already uses: does a normal slice move this fact? Adding a
`<module>.meta.md` beside a `scripts/` program is routine under CLAUDE.md's own routing branches.
So this is a count whose editor is not in the file when it goes stale — the class that rots,
rather than the class whose author is already holding the document.

**The index fails the same way twice, one tier apart.** The 2026-09-17 capture found that a
reader cannot tell an omitted role from a role without a sidecar, because the role-file bullet
lists only the haves. The article tier now carries the identical defect from the other side:
`claim-discipline` appears in neither the have list nor the have-not list, so the section is
silent about it. Being readable as complete is the section's one job.

**Part of it is a second copy of what the same file already says.** Seven of the nine article
sidecars are named elsewhere in CLAUDE.md, where each article's own entry states what its
sidecar carries.

## Question

What should CLAUDE.md say about the sidecar tier so that a reader about to edit any file can
find that file's sidecar — without the file carrying an inventory that ordinary work falsifies?

## Answer

Shaped as an outcome, deliberately. The wording is the process pipeline's to write.

**The outcome, in three properties a reader can check:**

- A reader holding any file in the corpus can determine whether it has a sidecar, and where to
  look, from what CLAUDE.md says plus the tree — without CLAUDE.md naming the instances.
- Nothing that remains in CLAUDE.md claims completeness over a set that ordinary work changes.
- The placement rulings survive somewhere a reader can reach. They are measured mechanism facts,
  and a directory listing cannot recover them.

**Constraints the outcome has to satisfy**, measured on the same tree and date, so the spec has
the facts without being handed the sentences:

- **18 of the 24 sit beside their instruction file. Six do not** — the five role sidecars and
  `CLAUDE.meta.md`, all in `.claude/agents/articles/`. So "look beside the file" is wrong for the
  role files and for CLAUDE.md itself, which are among the most-read files in the repo. Any
  replacement that omits the displaced tier fails open: a reader looks beside `architect.md`,
  finds nothing, and concludes none exists.
- **The displacement has a mechanism, and it is not uniform.** `scripts/agent-doc-check` reads
  the direct `.md` children of `.claude/agents/` as the agent roster, which forces the role
  sidecars elsewhere. `CLAUDE.meta.md` sits in the same directory by choice rather than by force,
  so that both doc checkers reach it. A replacement that states one rule for both loses the
  distinction between a constraint and a decision.
- **`CLAUDE.meta.md` already carries that mechanism**, under its own placement heading. The
  explanation half of ruling D below is largely in place rather than to be written.
- **Nothing reads the section programmatically.** Measured on the running
  `checkers-do-not-reach-the-assessment-sidecar` slice, 2026-09-20: nothing binds a sidecar to
  CLAUDE.md's pair index. So the section is free to change shape; no gate depends on it.
- **`prose.md` owns what fills a sidecar**, and CLAUDE.md's own text already routes that question
  there. The replacement inherits that routing unchanged.

**A second surface goes stale, and the slice owes it.** `CLAUDE.meta.md` states that the sidecar
index is hand-maintained and unchecked, then proposes a cheap checker extension. Deleting the
index falsifies the first half, and ruling B below rules out the second. Both halves move.

**What would rule this idea out.** That the placement is not rule-statable. The replacement is
only worth making while a short convention plus one named exception covers the tier. If a third
placement home lands, the rule form starts converging on the inventory it replaced, and keeping a
checked list becomes the better answer.

## Ruled by the user, 2026-09-21

Four rulings, taken one at a time against the measurements above. Each bounds the spec without
writing it.

- **A — no roster survives.** Both halves go, positive and negative. Checked before ruling:
  nothing goes dark. Seven of the nine article sidecars are named elsewhere in CLAUDE.md, and the
  two that are not — `mutation-testing.meta.md` and `prose.meta.md` — both sit beside their
  instruction file, so the replacement rule locates them.
- **B — a rule, not a checker.** The alternative was an `agent-doc-check` binding that made the
  list true rather than absent. Ruled out on the asymmetry with its precedent: check 5 binds
  prose that no glob can generate, whereas a list of sidecar names is fully derivable, so gating a
  hand-copy would protect a redundancy. **This ruling fixes the kind at `enabler-process`** — the
  diff stays in the instructions rather than moving to `scripts/`.
- **C — a role file owes a sidecar when it has explanation to displace, not before.** The
  question closes with a trigger rather than a roster, which is why it closes rather than carries.
  Measured at ruling time: the three process-role files are 3.0 to 4.2 KB against 8.5 to 19.0 KB
  for the five that have sidecars, and they were authored in the stripped register from the start.
  Nothing is waiting to be moved out of them today.
- **D — the rule goes in CLAUDE.md and the mechanism goes in `CLAUDE.meta.md`.** Branch 5 applied
  to CLAUDE.md itself. Moving the whole rule to `prose.md` was ruled out on circularity: that
  file's read trigger assumes the reader already knows sidecars exist, so the fact that they exist
  cannot live only behind it.

## No-gos

- **No mechanical binding**, per ruling B. A later slice re-proposing a checker over this tier is
  re-opening a closed decision, and the asymmetry above is the reason it was closed.
- **No surviving roster in CLAUDE.md**, per ruling A, in either direction.
- **Does not decide what fills a sidecar.** That is `prose.md`'s question under "Instruction
  stays. Explanation moves.", and this idea does not touch it.
- **Does not reach the topic-article counts.** CLAUDE.md states "Ten are topic articles" in one
  place and "nine" in another, and those count articles rather than sidecars.
  `apply-the-census-count-rule-everywhere` owns that sentence pair, and the seat already holds the
  correction as staleness residue.

## Open questions

- **Do the per-article pointer lines survive?** Each article's entry in the documentation map says
  what its own sidecar carries. Those name sidecars but are pointers attached to their own
  subject rather than a claim of completeness, so ruling A arguably does not reach them. A spec
  that says "delete the inventory" without settling this leaves `writer` to decide how far the
  deletion runs, which is the grant-without-bytes shape the corpus has already been bitten by.
- **Does `CLAUDE.meta.md`'s checker proposal get corrected or deleted?** Ruling B makes it a
  ruled-out route rather than merely a stale one. Recording why it was declined is the more
  useful repair, and it is also the larger edit.
