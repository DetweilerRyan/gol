---
name: a-reader-finds-a-sidecar-without-an-inventory
title: Give CLAUDE.md one sidecar section, holding a rule rather than a roster
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R6,
2026-09-17, as the residue after the references-tier half landed in that slice's amendment 6.
**Widened twice by the user on 2026-09-21** — first from the role-file bullet to the whole
sidecar index, then from the index to every mention of a specific sidecar and what it contains.
**Ten rulings sit under their own heading below**, and they bound the spec without writing it.

## Situation

CLAUDE.md names specific `.meta.md` sidecars in two ways. A section enumerates, across six
tiers, which files have one and which do not. Separately, individual entries name a sidecar and
state what it carries — an article's pointer line, a claim citing its own evidence, a worked
example of the reference syntax.

CLAUDE.md is auto-loaded into every session and every subagent, so all of it is read by all six
audiences before any of them does any work.

## Complication

**Measured on `main` at `de8fbd6`, 2026-09-21.** Thirty mentions in CLAUDE.md name a concrete
sidecar, across thirteen distinct files. `CLAUDE.meta.md` accounts for eleven of the thirty. A
further ten mentions are generic placeholders — `<name>.meta.md`, `<module>.meta.md` — which
state the convention rather than an instance.

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

**One roster is written three times.** The module-sidecar tier's three names appear twice in
CLAUDE.md, at two different sections, and a third time in `doc-comments.md`, where a count stands
beside the enumeration. Three copies of one census, maintained by hand, in two files.

**The index fails the same way twice, one tier apart.** The 2026-09-17 capture found that a
reader cannot tell an omitted role from a role without a sidecar, because the role-file bullet
lists only the haves. The article tier carried the identical defect from the other side until
`1b1f3e9` closed that instance. Being readable as complete is the section's one job, and it is a
job no hand-maintained list can keep.

**Part of it is a second copy of what the same file already says.** Seven of the nine article
sidecars are named elsewhere in CLAUDE.md, where each article's own entry states what its sidecar
carries.

## Question

What should the corpus say about the sidecar tier so that a reader about to edit any file can
find that file's sidecar — without naming the instances, which ordinary work falsifies?

## Answer

Shaped as an outcome, deliberately. The wording is the process pipeline's to write.

**The outcome, in five properties a reader can check:**

- A reader holding any file in the corpus can determine whether it has a sidecar, and where to
  look, from what CLAUDE.md says plus the tree — without CLAUDE.md naming any instance.
- **CLAUDE.md says what it has to say about sidecars in one place.** A reader looking for the
  convention finds all of it together rather than assembling it from a tier bullet, three routing
  branches and a conventions bullet.
- No sentence in the files this slice touches claims completeness over a set that ordinary work
  changes.
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
  the rule the replacement depends on. The angle-bracket form is safe against the gate:
  `npm run reference-check` passed on `de8fbd6` at 546 files and 3275 references with four
  `<module>.meta.md` tokens already in the file.
- **Nothing reads the section programmatically.** Measured 2026-09-20 on the
  `checkers-do-not-reach-the-assessment-sidecar` slice: nothing binds a sidecar to CLAUDE.md's
  pair index. The section is free to change shape; no gate depends on it.
- **One mention is a gate fact rather than a pointer.** CLAUDE.md's `mutation-invariance` entry
  names `mutation-testing.meta.md` because check C4 reds when a config path has no argument
  there. Ruling E covers it, and the destination already carries the fact — `mutation-testing.md`
  states that deleting an entry reds the run.
- **A dated measurement is not a roster and stays.** `doc-comments.md` records relocating
  `src/cache.meta.md` and measuring the result. `claim-discipline.md` licenses that form
  explicitly: it claims history and cannot rot.
- **`prose.md` owns what fills a sidecar**, and CLAUDE.md's own text already routes that question
  there. The replacement inherits that routing unchanged.

**What would rule this idea out.** That the placement is not rule-statable. The replacement is
only worth making while a short convention plus one named exception covers the tier. If a third
placement home lands, the rule form starts converging on the inventory it replaced, and keeping a
checked list becomes the better answer.

## Ruled by the user, 2026-09-21

Ten rulings, taken one at a time against the measurements above.

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
  dies.** The per-article pointer lines go too. The `mutation-invariance` entry keeps its gate
  entry without naming the sidecar, and the mechanism lives in `mutation-testing.md`, whose read
  trigger already fires at `hardener`'s mutation stage.
- **F — the eleven `CLAUDE.meta.md` self-citations are ruled per mention, by `coach`, at spec
  time.** Each is CLAUDE.md citing its own sidecar as evidence for a claim that stays. Whether a
  claim survives losing its citation is a `claim-discipline.md` judgement per sentence, not a
  blanket.
- **G — a syntax example is genericised, a worked precedent loses its name.** The mandated
  reference form becomes `@see {@link ./<module>.meta.md}`, and the leading-dot resolution fact
  is stated about the form rather than about a live file. The routing tie-break keeps its rule
  and drops `src/scrollbars.meta.md` as its named instance.
- **H — `CLAUDE.meta.md`'s stale sentence and its checker proposal are deleted, not rewritten.**
  The smaller edit was ruled over recording the decline. **Consequence, recorded so the spec knows
  it:** ruling B's argument then survives only in this file's No-gos and in the commit history,
  and this file is deleted at retrospective. Open question 1 below carries the residue.
- **I — the slice reaches `doc-comments.md`.** Its copy of the module roster and its twin of the
  syntax example go, on ruling A and ruling G respectively. Its two dated measurements stay. A
  roster left in the article that owns the tier relocates the defect rather than removing it.

- **J — CLAUDE.md carries one section about sidecars, and the generic placeholders colocate into
  it.** The convention is currently assembled from scattered parts: measured on `de8fbd6`, the ten
  generic mentions sit at nine places under the documentation map and one under Conventions. The
  ruling fixes the outcome — one section rather than scattered mentions — and **deliberately does
  not fix the shape.** Where the section sits, what it is called, and how much of each displaced
  passage it absorbs are `coach`'s to rule at spec time, against the tensions in the open questions
  below. The placeholders stay in CLAUDE.md throughout; this moves them together rather than out.

**The reach, after every ruling:** `CLAUDE.md`, `CLAUDE.meta.md`, `mutation-testing.md`,
`doc-comments.md`.

## No-gos

- **No mechanical binding**, per ruling B. A later slice re-proposing a checker over this tier is
  re-opening a closed decision, and the asymmetry above is why it closed.
- **No surviving roster** in the files this slice touches, per ruling A, in either direction.
- **No deletion of the generic placeholders.** They state the convention the replacement rests
  on, and they name no instance.
- **No corpus-wide sweep.** Eight further articles carry four to thirteen named mentions each,
  over eighty in total, and most are an article pointing at its own sidecar — the legitimate pair
  pointer rather than a roster. Ruled out of this slice as a different and much larger piece of
  work.
- **No deletion of a dated measurement**, wherever one names a sidecar.
- **Does not decide what fills a sidecar.** That is `prose.md`'s question under "Instruction
  stays. Explanation moves."
- **Does not reach the topic-article counts.** `apply-the-census-count-rule-everywhere` owns
  those, and `1b1f3e9` has since dropped the one that contradicted its neighbour.

## Open questions

- **Do routing branches 2, 4 and 5 move into the new section, or become pointers into it?** Those
  three branches of the "Where new documentation goes" test are themselves sidecar rules, so
  ruling J reaches them. The test's value is that it is one ordered decision procedure a reader
  walks in sequence; a version with holes in it is worse than a longer one. Whether the branches
  keep their substance and the section points at them, or the reverse, is the central structural
  call in this slice.
- **Does the routing tie-break survive being moved?** Its own text says the question is settled
  "here rather than in `prose.md`", so part of its force comes from sitting inside the routing
  test. Relocating it needs that clause re-derived rather than carried.
- **Does the Conventions bullet move?** The instruction-register bullet routes explanation to a
  sidecar, and CLAUDE.md's branch 3 exception put it in this file precisely because it binds at
  authoring time and only the auto-loaded surface is guaranteed to be read first. Colocating it is
  consistent with ruling J; leaving it is consistent with the exception that placed it.
- **Where does the section sit, relative to the routing test?** A reader walking the routing test
  needs the sidecar rule at branch 4. A section after the test is a forward reference at the
  moment of use; a section before it front-loads a convention most readers do not need yet.
- **Where does ruling B's argument live once ruling H deletes the proposal?** The decline survives
  in this file and in git, and this file is deleted at retrospective. A durable home would be
  `CLAUDE.meta.md` itself, which ruling H declines, or the retrospective's own extraction. If
  neither takes it, the next reader who notices the list is unchecked re-proposes the checker with
  nothing to stop them.
- **Does the corpus-wide residue get its own candidate?** Ruled out of this slice by the No-go
  above, which leaves over eighty named mentions unexamined. Whether any of those are rosters
  rather than pair pointers has not been measured.
