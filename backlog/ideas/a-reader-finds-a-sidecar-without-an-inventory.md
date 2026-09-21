---
name: a-reader-finds-a-sidecar-without-an-inventory
title: Let a reader locate any file's sidecar without CLAUDE.md naming them
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R6,
2026-09-17, as the residue after the references-tier half landed in that slice's amendment 6.
**Widened twice by the user on 2026-09-21** — first from the role-file bullet to the whole
sidecar index, then from the index to every mention in CLAUDE.md of a specific sidecar and what
it contains. **Six rulings sit under their own heading below**, and they bound the spec without
writing it.

## Situation

CLAUDE.md names specific `.meta.md` sidecars in two ways. A section enumerates, across six
tiers, which files have one and which do not. Separately, individual entries name a sidecar and
state what it carries — an article's pointer line, a claim citing its own evidence, a worked
example of the reference syntax.

CLAUDE.md is auto-loaded into every session and every subagent, so all of it is read by all six
audiences before any of them does any work.

## Complication

**Measured on `main` at `de8fbd6`, 2026-09-21.** Thirty mentions name a concrete sidecar, across
thirteen distinct files. `CLAUDE.meta.md` accounts for eleven of the thirty. A further ten
mentions are generic placeholders — `<name>.meta.md`, `<module>.meta.md` — which state the
convention rather than an instance.

**The inventory is false, and hand-repair does not hold it.** The roster was repaired on
2026-09-21 by `1b1f3e9`, which added the article it had been missing and dropped a bare count.
Later the same day `ab3e946` landed `scripts/board-shape-hook/board-shape.meta.md`, which the
section does not account for: the string `board-shape` appears nowhere in CLAUDE.md. **Repaired
and re-broken within hours, by a different slice.** That is the argument — not that the list is
currently wrong, but that being currently right is a state it does not hold.

**A sidecar is a thing ordinary work adds.** `apply-the-census-count-rule-everywhere` supplies
the test the corpus already uses: does a normal slice move this fact? Adding a `<module>.meta.md`
beside a `scripts/` program is routine under CLAUDE.md's own routing branches. So this is a count
whose editor is not in the file when it goes stale — the class that rots, rather than the class
whose author is already holding the document.

**The index fails the same way twice, one tier apart.** The 2026-09-17 capture found that a
reader cannot tell an omitted role from a role without a sidecar, because the role-file bullet
lists only the haves. The article tier carried the identical defect from the other side until
`1b1f3e9` closed that instance. Being readable as complete is the section's one job, and it is a
job no hand-maintained list can keep.

**Part of it is a second copy of what the same file already says.** Seven of the nine article
sidecars are named elsewhere in CLAUDE.md, where each article's own entry states what its sidecar
carries.

## Question

What should CLAUDE.md say about the sidecar tier so that a reader about to edit any file can find
that file's sidecar — without naming the instances, which ordinary work falsifies?

## Answer

Shaped as an outcome, deliberately. The wording is the process pipeline's to write.

**The outcome, in four properties a reader can check:**

- A reader holding any file in the corpus can determine whether it has a sidecar, and where to
  look, from what CLAUDE.md says plus the tree — without CLAUDE.md naming any instance.
- No sentence in CLAUDE.md claims completeness over a set that ordinary work changes.
- The placement rulings survive somewhere a reader can reach. They are measured mechanism facts,
  and a directory listing cannot recover them.
- No fact about how a gate behaves is lost, whether or not the sentence carrying it named a
  sidecar.

**Constraints the outcome has to satisfy**, measured on the same tree and date:

- **18 of the 24 tracked sidecars sit beside their instruction file. Six do not** — the five role
  sidecars and `CLAUDE.meta.md`, all in `.claude/agents/articles/`. So "look beside the file" is
  wrong for the role files and for CLAUDE.md itself, which are among the most-read files in the
  repo. A replacement that omits the displaced tier fails open: a reader looks beside
  `architect.md`, finds nothing, and concludes none exists.
- **The displacement has a mechanism, and it is not uniform.** `scripts/agent-doc-check` reads
  the direct `.md` children of `.claude/agents/` as the agent roster, which forces the role
  sidecars elsewhere. `CLAUDE.meta.md` sits in the same directory by choice rather than by force,
  so that both doc checkers reach it. A replacement stating one rule for both loses the
  distinction between a constraint and a decision.
- **`CLAUDE.meta.md` already carries that mechanism**, under its own placement heading. The
  explanation half of ruling D is largely in place rather than to be written.
- **The ten generic placeholders are the convention itself and stay.** Removing them would delete
  the rule the replacement depends on.
- **Nothing reads the section programmatically.** Measured 2026-09-20 on the
  `checkers-do-not-reach-the-assessment-sidecar` slice: nothing binds a sidecar to CLAUDE.md's
  pair index. The section is free to change shape; no gate depends on it.
- **One mention is a gate fact rather than a pointer.** CLAUDE.md's `mutation-invariance` entry
  names `mutation-testing.meta.md` because check C4 reds when a config path has no argument
  there. Ruling E covers it, and the destination already carries the fact — `mutation-testing.md`
  states that deleting an entry reds the run.
- **`prose.md` owns what fills a sidecar**, and CLAUDE.md's own text already routes that question
  there. The replacement inherits that routing unchanged.

**A second surface goes stale, and the slice owes it.** `CLAUDE.meta.md` states that the sidecar
index is hand-maintained and unchecked, then proposes a cheap checker extension. Deleting the
index falsifies the first half, and ruling B rules out the second.

**What would rule this idea out.** That the placement is not rule-statable. The replacement is
only worth making while a short convention plus one named exception covers the tier. If a third
placement home lands, the rule form starts converging on the inventory it replaced, and keeping a
checked list becomes the better answer.

## Ruled by the user, 2026-09-21

Six rulings, taken one at a time against the measurements above.

- **A — no roster survives.** Both halves go, positive and negative. Checked before ruling that
  nothing goes dark: the two article sidecars named nowhere else, `mutation-testing.meta.md` and
  `prose.meta.md`, both sit beside their instruction file, so the replacement rule locates them.
- **B — a rule, not a checker.** The alternative was an `agent-doc-check` binding that made the
  list true rather than absent. Ruled out on the asymmetry with its precedent: check 5 binds
  prose no glob can generate, whereas a list of sidecar names is fully derivable, so gating a
  hand-copy would protect a redundancy. **This fixes the kind at `enabler-process`.**
- **C — a role file owes a sidecar when it has explanation to displace, not before.** The
  question closes with a trigger rather than a roster. Measured at ruling time: the three
  process-role files are 3.0 to 4.2 KB against 8.5 to 19.0 KB for the five that have sidecars,
  and they were authored in the stripped register from the start.
- **D — the rule goes in CLAUDE.md and the mechanism goes in `CLAUDE.meta.md`.** Branch 5 applied
  to CLAUDE.md itself. Moving the whole rule to `prose.md` was ruled out on circularity: that
  file's read trigger assumes the reader already knows sidecars exist.
- **E — the reach is every named mention, not only the index, and the gate fact moves rather than
  dies.** The per-article pointer lines go too, which closes the open question the previous
  revision left. The `mutation-invariance` entry keeps its gate entry without naming the sidecar,
  and the mechanism lives in `mutation-testing.md`, whose read trigger already fires at
  `hardener`'s mutation stage. **This puts a second file in the slice's reach.**
- **F — the eleven `CLAUDE.meta.md` self-citations are ruled per mention, by `coach`, at spec
  time.** Each is CLAUDE.md citing its own sidecar as evidence for a claim that stays. Whether a
  claim survives losing its citation is a `claim-discipline.md` judgement per sentence, not a
  blanket, and `coach` is the pass positioned to make it under the user's signature.

## No-gos

- **No mechanical binding**, per ruling B. A later slice re-proposing a checker over this tier is
  re-opening a closed decision, and the asymmetry above is why it closed.
- **No surviving roster in CLAUDE.md**, per ruling A, in either direction.
- **No deletion of the generic placeholders.** They state the convention the replacement rests
  on, and they name no instance, so the instruction does not reach them.
- **Does not decide what fills a sidecar.** That is `prose.md`'s question under "Instruction
  stays. Explanation moves."
- **Does not reach the topic-article counts.** `apply-the-census-count-rule-everywhere` owns
  those, and `1b1f3e9` has since dropped the one that contradicted its neighbour.

## Open questions

- **Do the named filenames used as syntax examples go?** Branch 4 mandates the reference form
  `@see {@link ./useZoomGlide.meta.md}`, which names a real sidecar in order to show the syntax.
  Ruling E reaches every named mention, but an example that illustrates a convention is not a
  pointer to what a sidecar contains. Either keep it, or find a form that shows the syntax without
  naming a live file.
- **How deep does the `CLAUDE.meta.md` repair go?** Ruling B makes its checker proposal a
  ruled-out route rather than merely a stale one. Recording why it was declined is the more useful
  repair, and also the larger edit.
