# Spec — the process pass for `checkers-do-not-reach-the-assessment-sidecar`

`coach` SPEC, 2026-09-20. Revised in place the same day, from the withdrawal record a previous
SPEC invocation wrote. **Unsigned.** Nothing here is an authority `writer` may edit under until
the user signs the sign-off line at the end.

## What changed since the withdrawn version, and why this is a revision

**The user declined the withdrawal and ruled the route: these prose changes go through a process
pipeline.** The withdrawn version handed its one surviving item to the orchestrating seat as
staleness residue. That reasoning is overruled.

**Revision, not amendment, is the available instrument.** `pipelines.md` gives an amendment one
trigger — a signed spec is the authority `writer` edits under, so changing it after sign-off
needs its own rule. This spec has never been signed, so it is still mutable and there is no
signed text to supersede. There is no `amendment-1.md` for this slice.

**The user added a content direction, in their words:** _why don't we add a meta sidecar to
SKILL.md that explains why the guard is duplicated in prose._ That is item 2 below. It gives the
guard's argument a durable home in the corpus, in place of the commit body the withdrawn version
settled for.

## What is dead, and stays dead

The withdrawn version carried an item instructing the judging skill to write `reference-check`
allow markers for filenames an idea only proposes creating. Three measurements taken 2026-09-20
removed its premise, and **the user then dropped the whole carve-out** on a measured yield of zero
findings against a cost of one permanent gate failure per promoted record. It is not revived here,
and neither are the two decision points that existed only to serve it.

`architect`'s F1, the DESIGN-pass finding that licensed that item, measured a synthesized
assessment record that did not conform to the shape `.claude/references/definition-of-ready.md`
states. That is P5 below.

## Register ruling, made rather than adopted

The user asked me to confirm or overturn a reading: that `prose.md`'s exempt class 2 keeps a
**closed decision** in the instruction file and moves only the argument that reached it, so the
replacement clause stays in `SKILL.md` while the sidecar carries the why.

**Confirmed, and reached by a stronger route than class 2.** Class 2 covers a closed decision.
The replacement clause is not a closed decision — it is a live duty, "Read the basename yourself
before you assess". `prose.md`'s three dispositions settle it one step earlier: _it says what to
do, when, or under what precondition → instruction. It stays._ Both readings land in the same
place, and the disposition test is the one that binds. The argument for the duty is explanation
by the same test, and moves.

**One corollary binds `writer` and is easy to violate by reflex.** `prose.md` names "a pointer to
its own `.meta.md` sidecar" as a shape to remove on sight from an instruction file. **`SKILL.md`
gets no pointer to `SKILL.meta.md`.** Item 3 exists because of that: `CLAUDE.md`'s pair index is
then the only route to the new sidecar.

## The file set

Five files, in the order `writer` must touch them. The ordering is load-bearing and item 3 says
why.

| #   | File                                       | Act                         |
| --- | ------------------------------------------ | --------------------------- |
| 1   | `.claude/skills/idea-assess/SKILL.md`      | replace one trailing clause |
| 2   | `.claude/skills/idea-assess/SKILL.meta.md` | create                      |
| 3   | `CLAUDE.md`                                | add one bullet              |
| 4   | `.claude/agents/articles/prose.md`         | replace one sentence        |
| 5   | `.claude/references/pipelines.md`          | replace two blocks          |

A sixth item is drafted below and is **conditional on D6**. It is not in the set unless you rule it
in.

Nothing else. No `.vale.ini` edit, no checker change, no `rules/` or `vale-styles/` edit — measured
in "What needs no change" below.

---

## Item 1 — `.claude/skills/idea-assess/SKILL.md`, the guard's trailing clause

**Replace, verbatim:**

```text
**A target whose basename ends `.assessment.md` is a record rather than an idea — stop and say so, and score nothing.** Layer 1 does not refuse it, since the classifier reads position rather than basename.
```

**With, verbatim:**

```text
**A target whose basename ends `.assessment.md` is a record rather than an idea — stop and say so, and score nothing.** Read the basename yourself before you assess, and never take candidacy from the Layer 1 output alone.
```

### Four things that bind this edit

1. **The bolded instruction is byte-identical.** Only the trailing clause moves. The user ruled
   the skill's own basename guard stays, 2026-09-20.
2. **This is a replacement, not a deletion, and that is the whole argument.** The old clause
   carried a consequence: it said why the guard is not redundant. Delete it outright and a later
   pass reads the guard as duplicated work and removes it.
3. **The replacement asserts nothing about the hook's internals.** `claim-discipline.md` prohibits
   an undated present-tense fact about another file. "Layer 1 does not refuse it" was exactly that,
   and the hook falsified it.
4. **`candidacy` is the word that keeps this clause from fighting the line three above it.** That
   line reads "Never assess on hand-computed checks", which binds the readiness **checks**. A
   candidacy test is not a check, and the two words already carry that distinction in this file.
   I considered a longer wording that spelled the distinction out and ruled it worse: it adds a
   sentence to say what the existing vocabulary already says.

**Why the argument behind this clause is not in this file:** it is explanation under `prose.md`'s
disposition test, and item 2 is where it goes.

---

## Item 2 — create `.claude/skills/idea-assess/SKILL.meta.md`

New file, beside `SKILL.md`. **Write it verbatim as follows**, with no frontmatter:

```markdown
# Rationale: the `idea-assess` skill

**Audience:** whoever is changing a rule in `SKILL.md`. **Read when:** amending, narrowing, or
overturning one — never in order to follow one.

## Why the basename guard is duplicated in prose

The skill reads a `LAYER1` line that `scripts/board-shape-hook/run.ts` prints ahead of the prompt.
On 2026-09-20 the hook gained a refusal for an assessment record's own path, in `board-shape.ts`'s
`checkShape`, ahead of the candidate test. The skill's basename guard now looks like a second copy
of that refusal, and it is not.

**The guard covers a gap the skill's other two stop clauses leave open.** Those two key on line
shapes: an absent `LAYER1` count line, and a `not a candidate` line. Measured 2026-09-20, the
record refusal prints a third shape — `an assessment record, 0 checks` — which neither clause
names. Delete the basename guard and a reader holding that line finds a `LAYER1` line present, no
`not a candidate` line, and no instruction covering the case.

**The hook reports; it does not enforce.** Argv mode writes every line to stdout and exits 0, with
the outcome's `deliver` flag unread. Nothing stops an assessment proceeding, so the refusal binds
only because the skill's own prose refuses too.

**The clause was rewritten rather than deleted, and what it lost is the point.** Until 2026-09-20
it read "Layer 1 does not refuse it, since the classifier reads position rather than basename" — a
consequence clause saying why the guard was not redundant. The hook falsified its premise.
Deleting it outright would have left the guard looking like duplicated work to the next pass that
reads the file, which is the shape `prose.md` names under "How a pass damages the file it cleans".
The replacement keeps the duty and asserts nothing about the hook's internals, which
`claim-discipline.md` prohibits.

## What was ruled out

**A stop clause keyed on the hook's own refusal line was rejected.** It would make the skill's
refusal depend on the hook's wording, which is the coupling a basename read avoids. The user ruled
the guard stays, 2026-09-20.
```

### What binds this file

- **No pointer to it from `SKILL.md`.** See the register ruling above.
- **It clears the sidecar floor.** `prose.md` declines a sidecar below roughly 1 KB of genuine
  evidence. This is about 2.2 KB, and the smallest sidecar in the tree today is 2229 bytes.
- **Every filename token in it resolves**, and the one `<file>'s <symbol>` citation —
  `board-shape.ts`'s `checkShape` — names a symbol that appears in that file. Verified 2026-09-20.
- **It carries no `npm run` token, no backticked retired-role name, and no bare role-cycle chain**,
  so `agent-doc-check`'s checks 1, 3 and 4 have nothing to find in it.

---

## Item 3 — `CLAUDE.md`, the pair index gains a skills bullet

The index is the bullet list under **"Which files have a sidecar today, and nothing checks this
list."**

**Insert, verbatim, as a new bullet directly after the `Reference pairs in .claude/references/`
bullet and before the `A role may also hold mode files` bullet:**

```text
- **Skill files in `.claude/skills/`** — `idea-assess` has one, and no other skill does. A skill's sidecar sits beside its `SKILL.md` as `SKILL.meta.md`, since no checker's glob forces it elsewhere. That basename is shared across the tier, so `npm run reference-check` resolves a citation of it against any skill's sidecar.
```

**Change nothing else in `CLAUDE.md`.** In particular, do not add a skills tier paragraph to the
Documentation map — that is out of scope and named in the scope floor below.

### Why the ordering in the file-set table is load-bearing

This bullet writes the token `SKILL.meta.md`. `reference-check` resolves filename-shaped tokens
against the live tree, so **this bullet reds the gate until item 2's file exists**. Create the
sidecar first. That is an ordering instruction inside one role's pass, not a process problem — see
P2 below, which is the same shape across two roles and stays out.

### Why this item is not optional if item 2 lands

The index's own declared job is to be "the index of which pairs exist". A pair that lands
unindexed makes that sentence false. And because `prose.md` forbids `SKILL.md` pointing at its own
sidecar, this index entry is the only route a reader has to the new file.

---

## Item 4 — `.claude/agents/articles/prose.md`, the split rule's tier roster

The sentence sits under **"Instruction stays. Explanation moves."**, immediately after the bolded
lead. Prettier owns the line wrapping, so match on the words rather than on the break.

**Replace, verbatim (ignoring line breaks):**

```text
That governs every article, every role file and every module sidecar, not only the file you reached it from.
```

**With, verbatim (ignoring line breaks):**

```text
That governs every instruction file in this corpus, whatever tier it sits in, not only the file you reached it from.
```

### Why

The roster is already false by omission. It names three tiers and not the reference tier, which
carries four sidecars today. Extending it by one more name would restate the same defect one tier
later. The tier-agnostic form removes the roster, fixes the existing omission, and makes the skills
sidecar lawful by text rather than by practice.

`claim-discipline.md` is the reason this is a replacement and not an addition: a roster of external
state rots, and this one already has.

---

## Item 5 — `.claude/references/pipelines.md`, two blocks about the board hook

Both are false on this branch's tip as of 2026-09-20, because the record refusal has already
landed in `board-shape.ts`. Verified against the committed file, not the working tree —
`coder` has uncommitted changes in `scripts/board-shape-hook/` and they are outside this file set.

**5a. Replace, verbatim (ignoring line breaks):**

```text
**The kinds are not a closed set.** `scripts/board-shape-hook/board-shape.ts` classifies by position rather than by basename. So an artifact kind nobody has named yet is covered in an item's folder on the day it lands.
```

**With, verbatim (ignoring line breaks):**

```text
**The kinds are not a closed set.** Apart from the record refusal below, `scripts/board-shape-hook/board-shape.ts` classifies by position rather than by basename. So an artifact kind nobody has named yet is covered in an item's folder on the day it lands.
```

**5b. Replace, verbatim (ignoring line breaks):**

```text
**An assessment record in the ideas lane is the exception, and it is not yet refused.** Measured 2026-09-20: such a record is two segments, so the same classifier reads it as an idea file and reports findings. `checkers-do-not-reach-the-assessment-sidecar` owns the fix.
```

**With, verbatim (ignoring line breaks):**

```text
**An assessment record is refused by its own path, in every lane, ahead of the candidate test.** The hook reports the refusal and scores nothing, so read that line the way you read a non-candidate line.
```

### What 5b drops, and the ruling on each

- **The dated measurement.** Dropped deliberately. It described the pre-fix behaviour, and
  `SKILL.meta.md` now carries the history this file no longer needs.
- **The `checkers-do-not-reach-the-assessment-sidecar` ownership pointer.** Dropped: the fix has
  landed, so the pointer names no outstanding work.
- **"in the ideas lane".** Widened deliberately to "in every lane". The path predicate covers the
  ideas-lane sidecar and the promoted `ready`/`done` form alike. Verified 2026-09-20 against
  `assessment-record.ts`'s `isAssessmentRecordPath`.

---

## Item 6 — conditional on D6 — a fourth stop clause in `SKILL.md`

**Run this item only if D6 is ruled in.** Found by this SPEC pass, at the tip that includes
`coder`'s two commits of 2026-09-20.

**Insert, verbatim, as a new paragraph directly after the `not a candidate` clause and before
item 1's `.assessment.md` clause:**

```text
**An `off the board` line means the target is not a board file at all — stop and say so, and score nothing.**
```

### The measurement behind it

The hook prints five refusal shapes. The skill's stop clauses name three of them: an absent
`LAYER1` line, a `not a candidate` line, and a `path missing` line. Measured live 2026-09-20,
`node scripts/board-shape-hook/run.ts src/camera.ts` prints
`LAYER1 src/camera.ts: off the board, 0 checks -- only a backlog/ target can be assessed`. A
reader holding that line finds a `LAYER1` line present, none of the three named shapes, and a
basename that is not a record — so nothing tells them to stop.

**This is item 1's gap in a second costume**, which is why it surfaced here rather than in a
review. Probed with item 1 applied: `SKILL.md` reads 0 Vale findings with both edits, against a
baseline of 0.

---

## What `writer` runs, and what a finding in it means

Run these after the edits, in this order. Each reading below is the measured pre-edit baseline on
this worktree's tip, 2026-09-20.

| Command                                         | Expected reading       | A finding means                                      |
| ----------------------------------------------- | ---------------------- | ---------------------------------------------------- |
| `vale .claude/skills/idea-assess/SKILL.md`      | 0, unmoved from 0      | item 1's replacement introduced a register defect    |
| `vale .claude/skills/idea-assess/SKILL.meta.md` | 0 — the tier is exempt | the `[**/*.meta.md]` exemption stopped winning       |
| `vale CLAUDE.md`                                | 19, unmoved from 19    | item 3's bullet added to a pre-existing backlog      |
| `vale .claude/agents/articles/prose.md`         | 5, unmoved from 5      | item 4's sentence added to a pre-existing backlog    |
| `vale .claude/references/pipelines.md`          | 0, unmoved from 0      | item 5 introduced a register defect                  |
| `npm run prose-lint -- --scope <each path>`     | as above               | same, through the role's own command                 |
| `npm run agent-doc-check`                       | pass                   | a script name, frontmatter, role name or cycle broke |
| `npm run reference-check`                       | pass                   | a filename or symbol citation does not resolve       |
| `npm run format`                                | clean, last            | —                                                    |

**Three readings-of-the-reading bind `writer`.**

1. **Take every baseline at the real repo-relative path, from the repo root.** A copy outside the
   repo matches no `.vale.ini` section: `[CLAUDE.md]` is an exact glob, so Vale processes **0
   files** and reports a clean run. That is `prose.md`'s confident-zero class 12, and the seat fell
   into it on 2026-09-20.
2. **`CLAUDE.md`'s 19 and `prose.md`'s 5 are pre-existing backlogs, and neither must be cleared.**
   `prose.md`'s landing constraint forbids shipping an **enable** over an untriaged backlog. It
   does not forbid an edit that leaves the count unmoved. What binds instead is `prose.md`'s "a
   pass introduces findings as well as clearing them": compare to the baseline and name what the
   pass added. Confirmed as the reading, 2026-09-20.
3. **A finding you did not add is not yours to clear.** Report it; do not fold a backlog triage
   into this pass.

### What needs no change, and it was measured rather than assumed

- **`.vale.ini`.** `[**/*.meta.md]` is the last section and wins per key. Probed 2026-09-20:
  identical bytes reported **186** warnings at `.claude/skills/idea-assess/PROBE.md` and **0** at
  `.claude/skills/idea-assess/PROBE.meta.md`.
- **`scripts/prose-write-hook/`.** Its `inScope` predicate ends `&& !rel.endsWith('.meta.md')`, so
  the write-time hook skips the new sidecar by construction.
- **`scripts/agent-doc-check/`.** Its agent-roster scan reads the direct `.md` children of
  `.claude/agents/`, so it never reaches `.claude/skills/`. Nothing forces the sidecar away from
  its instruction half, which is why this placement is chosen rather than forced.
- **`.claude/references/definition-of-ready.md`.** The withdrawn version listed its Layer 1
  description as still-live staleness. **Re-measured 2026-09-20 and refuted.** Its text says
  "Frontmatter facts, section presence, lane counts, dependency mentions … Nothing in this layer
  judges", and a deterministic path refusal falsifies none of it. The record-shape block is
  untouched too. The file is out of the set.

---

## The decision points — each one stated so it can be ruled cold

### D1 — the sidecar's name and its placement

**The question.** Does the new file go at `.claude/skills/idea-assess/SKILL.meta.md`, beside its
instruction half, or at a uniquely-named path such as `.claude/skills/idea-assess/idea-assess.meta.md`?

**Why it is a question.** The skills system fixes the instruction half's name at `SKILL.md`. So
the pair convention `<name>.md` / `<name>.meta.md` produces `SKILL.meta.md`, and **every** skill
sidecar in the tree would eventually share that one basename. `npm run reference-check` matches by
basename throughout, so a prose citation of `SKILL.meta.md` would resolve against any of them, and
a `<file>'s <symbol>` citation would pass if **any** of them contains the symbol.

**My ruling: `SKILL.meta.md`, beside `SKILL.md`.** Three measured grounds.

- **The collision class already exists in the tree and is green.** Five files are named `SKILL.md`
  today, and `prose-audit/SKILL.md` cites the bare token `SKILL.md` in its own frontmatter.
  `npm run reference-check` passes — 540 files scanned, 3229 references, no failures, 2026-09-20.
  The sidecar adds an instance of a class the checker already carries, not a new class.
- **It fails in the safe direction.** Basename matching under-reports by design; the failure is a
  false negative on a same-named file in another directory, never a false alarm. `CLAUDE.md`
  already states this as deliberate.
- **Nothing forces the file elsewhere.** Measured above: the roster scan does not reach
  `.claude/skills/`, the write hook skips `.meta.md`, and the Vale exemption wins.

**If you overturn it**, item 2's path and item 3's bullet both change, and the bullet's third
sentence about the shared basename comes out.

### D2 — does `prose.md`'s split rule get generalized? (item 4)

**The question.** `prose.md`'s split rule currently says it "governs every article, every role file
and every module sidecar". Do we replace that three-tier roster with a tier-agnostic sentence, or
leave it and let the skills sidecar extend the rule by practice?

**Context for ruling it cold.** The reference tier, `.claude/references/`, carries four sidecars
today and is **not** named in that roster. So the sentence is already false by omission, and it has
been extended by practice once already.

**My ruling: generalize it.** It removes a roster of external state, which `claim-discipline.md`
names as the worst-rotting claim form; it fixes the existing omission; and it makes the skills
sidecar lawful by text. Measured cost: `prose.md` reads 5 Vale warnings before and 5 after.

**If you decline**, the skills tier extends the rule the same way the reference tier did — by
practice — and item 4 comes out of the set. Nothing else changes.

### D3 — does `CLAUDE.md`'s pair index gain a skills bullet? (item 3)

**The question.** Add the bullet, or leave the index as it is?

**Context for ruling it cold.** The index says of itself: "This is the index of which pairs exist."
Measured 2026-09-20: all 22 `*.meta.md` files in the tree are named there today, so the index is
currently true and complete. Separately, `prose.md` forbids an instruction file from pointing at
its own sidecar, so `SKILL.md` cannot advertise the new file.

**My ruling: add it, and it is not optional if item 2 lands.** Without it the index goes false on
the day the sidecar lands, and the sidecar has no route to a reader at all.

**If you decline**, I recommend declining item 2 with it. A sidecar nobody can find is the
article-nobody-reads failure `CLAUDE.md` already names.

### D4 — does `.claude/references/pipelines.md` come into the file set? (item 5)

**The question.** This file carries two statements about the board hook that are false on this
branch's tip. Does this process pass fix them, or does the orchestrating seat carry them as
staleness residue after the slice lands?

**Context for ruling it cold.** `pipelines.md` currently says an assessment record "is not yet
refused" and names this slice as owning the fix. The refusal landed in commit `95ca402`. Under
`pipelines.md`'s own Enabler-technical rules, a role reports staleness and the seat records it —
which is the route the seat has used until now.

**My ruling: fold it in.** Declining does not avoid a user gate, it moves one: P6 below establishes
that the seat's residue now needs the user's approval of the **route** as well as the text. So
declining costs a second gate later rather than saving one now, and leaves an actively false claim
in a file the seat reads before composing every role invocation.

**If you decline**, item 5 comes out and the two blocks go on the seat's staleness list, to be
routed separately.

### D5 — confirm the scope floor

**What stays out**, and I am asking you to confirm rather than to choose:

- A skills tier paragraph in `CLAUDE.md`'s Documentation map. The tier has no routing entry today.
  Adding one is a real gap and a separate candidate; the pair-index bullet is the minimum that
  keeps the index true.
- `.claude/references/definition-of-ready.md`. Handed over as stale, **re-measured and refuted**.
- The `reference-check` allow-marker carve-out and its two decision points. Dead on the user's
  2026-09-20 ruling.
- Any change to `.vale.ini`, `scripts/`, `rules/` or `vale-styles/`. Measured: none needed, and
  the last two are `architect`'s in any case.

### D6 — does item 6 run, or become its own candidate?

**The question.** This SPEC pass found a fourth gap of exactly item 1's kind: the hook prints an
`off the board` refusal that no stop clause in `SKILL.md` names. Item 6 closes it in one
paragraph. Does it run in this pass, or become a board candidate?

**Context for ruling it cold.** Unlike items 1 and 5, this is **not** a staleness correction — the
old clause was never true. It is a new instruction, which is what makes it a scope question rather
than an obvious inclusion. It is reachable: a mistyped or wrong argument to `/idea-assess` reaches
it, measured live 2026-09-20.

**My ruling: rule it in.** Three grounds. It is the same subject as item 1, so a reader of the
finished `SKILL.md` sees one coherent rule rather than two passes. The file is open and the
sidecar being written is the place its argument belongs. And deferring it means the corpus
knowingly carries a gap this pass measured, which is the disposition `handoffs.md` names under
"Resolve a finding in the cycle that made it".

**The honest argument against, which is why this is a question and not an assumption.** It widens
a pass the user routed for a specific subject, and P6 is a fresh finding about exactly that kind
of widening. If you would rather hold the line, decline it and I will hand it out as a candidate
instead.

**If you rule it in**, one sentence is added to item 2's sidecar naming the second instance. If you
decline, item 6 does not run and the finding leaves through the handoff.

---

## The process findings — P1 to P5 carried forward explicitly, P6 and P7 added

Every finding below goes to this slice's own `retro.md`, which the seat writes during the slice.
That is an existing intake, not a new board item. None of the five inherited findings depended on
the refuted premise, and each is re-affirmed or revised below rather than carried by silence.

- **P1 — `pipelines.md` plans `design.md`; `architect.md` grants no write. Re-affirmed
  unchanged.** Real and demonstrated. Out on census: `design.md` is named in three rows of
  `pipelines.md` and two places in `CLAUDE.md`, and the repair is a new write grant into
  `backlog/`, which reaches `architect.md`, the step table and `CLAUDE.md`'s board-ownership
  paragraph. The workaround costs one sentence per invocation and produces the right artifact.

- **P2 — a rule and its mandatory article entry have two owners and no green intermediate state.
  Re-affirmed, and sharpened by a new instance.** Items 2 and 3 are the same shape in miniature:
  `CLAUDE.md`'s bullet reds `reference-check` until the sidecar exists. It is harmless here only
  because both edits sit inside one role's pass, so an ordering instruction fixes it. The finding
  is about the case where they do not. Still out: the remedy is a sequencing clause whose home is
  `CLAUDE.md`, outside any file set this pass holds, and it interacts with the no-role-edits rule
  the parent slice spent four amendments on.

- **P3 — a role file's standing duty and a legitimate prompt can contradict each other.
  Re-affirmed unchanged.** Out. Precedence binds every role, so it lands in `handoffs.md` or the
  invocation contracts and touches every role file stating an unconditional duty.

- **P4 — the board read carve-out names `spec.md` and `amendment-*.md`, not the rest of the
  folder. Re-affirmed, and revised with a second instance from this invocation.** `pipelines.md`
  step 1 requires the SPEC prompt to carry "the proposal's content", because no role reads a
  proposal file. This invocation's prompt did not carry it, and the read carve-out gave me no
  lawful route to `proposal.md`. I worked from the withdrawn spec's restatement instead, which is
  a second-hand premise of exactly the kind P5 warns about. The original instance was `design.md`.
  The generalisation: **the carve-out is a two-file allowlist and the pipeline needs three
  artifacts through it.** Already queued — the parent slice's `retro.md` owns the
  artifact-versus-prompt question and holds the evidence. Add both instances there.

- **P5 — a synthesized artifact used as a measurement's input was never checked against its own
  ruled shape. Re-affirmed, and it paid out in this pass.** The DESIGN pass synthesized a record,
  measured it honestly, and the measurement licensed nothing, because the input did not conform to
  the shape `.claude/references/definition-of-ready.md` states. The finding then travelled as fact
  through two hands. Applied here, the habit changed the file set: every premise the seat handed
  over was re-measured, and one — that `definition-of-ready.md`'s Layer 1 description is stale —
  was **refuted**, removing a file from the set. The durable form is unchanged:
  `claim-discipline.md`'s "re-measure the premise you were handed" reaches a measurement's
  **input**, not only its conclusion, and a synthesized input is where it binds hardest.

- **P6 — the seat's staleness residue needs the user's approval of the route as well as the text,
  and an unanswered question approves neither. New.** The seat put the route to the user as an
  open question, the user rejected the question in order to clarify the content, and the seat read
  that as approval of the route and made the corpus edits itself. Those commits were reverted.
  `CLAUDE.md`'s Conventions already require "the user's explicit approval" for a staleness edit;
  what this adds is that **the approval has two halves**, and silence on either is not consent.
  The route half is now the larger one, because the process pipeline exists to carry exactly these
  edits. Where a staleness edit writes an instruction clause rather than a file name or a count,
  the default route is `coach`, not the seat.

- **P7 — an instruction file may not point at its own sidecar, so `CLAUDE.md`'s pair index is the
  only route to any sidecar, and nothing checks it. New, and mechanisable today.** The index says
  so itself: "nothing checks this list". Measured 2026-09-20: all 22 `*.meta.md` files in the tree
  are named there, so a checker would land green with no backlog to triage — which is exactly the
  landing constraint `prose.md` imposes on a new guard. See the recommendation below.

## Cross-pipeline recommendations — for the seat to capture, not for `writer`

Both flow out through this handoff as board recommendations. Neither is an edit.

1. **`enabler-technical` — check that every `*.meta.md` is named in `CLAUDE.md`'s pair index.**
   The shape is `agent-doc-check`'s check 5, which already asserts that every `rules/*.yml` is
   named in the rule documentation article. Fitness function: the check exists and reports zero on
   the tip. Pre-reading measured 2026-09-20: 22 sidecars, 22 named, 0 missing. The known gap to
   state in the proposal is that naming a stem is not the same as describing the pair, and no
   checker can close that half.
2. **Candidate — `CLAUDE.md`'s Documentation map has no routing entry for `.claude/skills/`.**
   The tier holds five skill files and is named only in passing, inside the `.claude/references/`
   paragraph. D5 rules it out of this pass. It is the kind of gap that is invisible until someone
   needs the tier described.

---

## Sign-off

**This spec is unsigned. `writer` has no authority under it until the line below is countersigned.**

Rule D1 to D6, then sign. A ruling that changes an item changes this file by revision, since
nothing here has been signed yet — there is no amendment to write.

- D1 — sidecar name and placement: **not yet ruled**
- D2 — generalize `prose.md`'s split rule: **not yet ruled**
- D3 — `CLAUDE.md` pair index bullet: **not yet ruled**
- D4 — `pipelines.md` into the file set: **not yet ruled**
- D5 — confirm the scope floor: **not yet ruled**
- D6 — item 6, the `off the board` stop clause: **not yet ruled**

Signed: _pending_
