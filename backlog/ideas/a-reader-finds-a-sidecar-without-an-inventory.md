---
name: a-reader-finds-a-sidecar-without-an-inventory
title: Let a reader locate any file's sidecar without CLAUDE.md enumerating them
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R6,
2026-09-17, as the residue after the references-tier half landed in that slice's amendment 6.
**Widened by the user 2026-09-21** from the role-file bullet to the whole index: the original
question offered two horns, and the second one — restate the bullet so it no longer implies
enumeration — is the one ruled. The file is renamed to match.

## Situation

CLAUDE.md carries a section that enumerates, across six tiers, which files have a `.meta.md`
sidecar and which do not. The section says of itself that nothing checks the list.

CLAUDE.md is auto-loaded into every session and every subagent, so the section is read by all
six audiences before any of them does any work.

## Complication

**Three measurements, taken on `main` at `5b2818c`, 2026-09-21.**

**The inventory is false today.** 24 sidecars are tracked; the section accounts for 23.
`scripts/board-shape-hook/board-shape.meta.md` landed in `one-item-shape-serves-every-lane`,
and the string `board-shape` appears nowhere in CLAUDE.md. A hand audit on the
`checkers-do-not-reach-the-assessment-sidecar` slice recorded the index complete a day earlier,
so the drift arrived between an audit and its next reader.

**A sidecar is a thing ordinary work adds.** `apply-the-census-count-rule-everywhere` supplies
the priority test the corpus already uses: does a normal slice move this fact? Adding a
`<module>.meta.md` beside a `scripts/` program is routine under CLAUDE.md's own routing branches.
So this is a count whose editor is not in the file when it goes stale — the class that rot rather
than the class whose author is already holding the document.

**The index fails the same way twice, one tier apart.** The 2026-09-17 capture found that a
reader cannot tell an omitted role from a role without a sidecar, because the role-file bullet
lists only the haves. The article tier now carries the identical defect from the other side:
`claim-discipline` appears in neither the have list nor the have-not list, so the section is
silent about it. Being readable as complete is the section's one job.

**Part of it is a second copy of what the same file already says.** Seven of the nine article
sidecars are named in their own pointer line earlier in CLAUDE.md, where each article's entry
already states what its sidecar carries.

## Question

What should CLAUDE.md say about the sidecar tier so that a reader about to edit any file can
find that file's sidecar — without the file carrying an inventory that ordinary work falsifies?

## Answer

Shaped as an outcome, deliberately. The wording is the process pipeline's to write.

**The outcome, in three properties a reader can check:**

- A reader holding any file in the corpus can determine whether it has a sidecar, and where to
  look, from what CLAUDE.md says plus the tree — without CLAUDE.md naming the instances.
- Nothing that remains in the section claims completeness over a set that ordinary work changes.
- The placement rulings survive. They are measured mechanism facts, and a directory listing
  cannot recover them.

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
- **Nothing reads the section programmatically.** Measured on the running
  `checkers-do-not-reach-the-assessment-sidecar` slice, 2026-09-20: nothing binds a sidecar to
  CLAUDE.md's pair index. So the section is free to change shape; no gate depends on it.
- **`prose.md` owns what fills a sidecar**, and CLAUDE.md's own text already routes that question
  there. The replacement inherits that routing unchanged.

**What would rule this idea out.** That the placement is not rule-statable. The replacement is
only worth making while a short convention plus one named exception covers the tier. If a third
placement home lands, the rule form starts converging on the inventory it replaced, and keeping a
checked list becomes the better answer.

## No-gos

- **Does not decide what fills a sidecar.** That is `prose.md`'s question under "Instruction
  stays. Explanation moves.", and this idea does not touch it.
- **Does not reach the topic-article counts.** CLAUDE.md states "Ten are topic articles" in one
  place and "nine" in another, and those count articles rather than sidecars.
  `apply-the-census-count-rule-everywhere` owns that sentence pair, and the seat already holds the
  correction as staleness residue.
- **Does not decide whether the three process roles owe sidecars.** Carried forward below.

## Open questions

- **Drop the inventory entirely, or drop only the negative roster?** The two halves fail in
  opposite directions. A stale have-not entry sends a reader past a sidecar that exists. A stale
  have entry sends them looking for one that does not, which they discover immediately. If a
  half-measure is wanted, dropping the negative half is the principled one.
- **Is a mechanical binding the better answer instead?** An `agent-doc-check` check that every
  tracked `*.meta.md` is accounted for would make the list true rather than removing it. It costs
  a `scripts/` slice of its own and keeps the section's standing cost on every subagent.
  `the-invariance-allowlist-is-a-hand-maintained-list-of-a-computable-fact` poses the same
  question one tier over, and either answer should probably be the same answer.
- **Do `coach`, `writer` and `editor` owe sidecars at all**, as their rulings accumulate?
  Unresolved from the 2026-09-17 capture and carried forward by the user's ruling. Removing the
  inventory makes the question less urgent, since nothing then claims to be complete over the
  roles, but it does not answer it.
- **Does the section's replacement belong in CLAUDE.md at all**, or in `prose.md` beside the
  split it already owns? CLAUDE.md's routing branch 5 places the pair convention here; whether
  that survives the section losing its inventory is worth asking rather than assuming.
