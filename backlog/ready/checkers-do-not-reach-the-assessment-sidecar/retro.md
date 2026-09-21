# Retro intake — checkers-do-not-reach-the-assessment-sidecar

Written by the orchestrating seat during the slice, on the parent slice's practice. It is an
intake for a later retrospective rather than the retrospective itself: nothing here is ruled, and
a reader should expect to re-measure anything dated before acting on it.

The slice ran 2026-09-20 to 2026-09-21. It carried a technical half in `scripts/board-shape-hook/`
and a process pass over the corpus, the second riding inside the first by the user's ruling.

## What the slice set out to do, and what it did

The proposal named two checkers that could not see a new board artifact, the assessment record.
**One of the two was dropped mid-slice on measurement**, and `proposal.md` carries that ruling
under its own heading. The landed slice teaches the board-shape hook to refuse a record by its own
path and to report the record's staleness lane-sensitively. Nothing under `scripts/reference-check/`
moved.

## The premise that was refuted, and how far the error travelled

The design pass synthesized an assessment record, ran it through `reference-check`'s own token
grammar, and reported that three of seven filename tokens did not resolve. The measurement was
honest. **The input was not a record**: the shape ruled in `.claude/references/definition-of-ready.md`
has no slot for a file list, and the two real records in the repository's history carry no filename
token at all.

The user caught it by asking why a record would name a file the idea proposes creating. Three
measurements followed and the carve-out was dropped: measured yield of nothing against a cost of
one permanent gate failure per promoted record, in a file ruled immutable.

**The error travelled through two hands as fact.** The design pass measured it, the seat relayed it
without checking the shape, and `coach` specified an instruction on top of it while holding the
shape file open for an unrelated question. That is P5.

## Findings, numbered as the slice numbered them

P1 to P4 were surfaced by the design pass and the seat; P5 to P10 by `coach` across its SPEC and
REVIEW passes. P11 is the seat's own. None is ruled here.

### P1 — the pipeline plans an artifact its producer may not write

`.claude/references/pipelines.md`'s step table says the DESIGN pass writes `design.md` into the
item's folder. `architect.md` names no board deliverable and grants no board write anywhere. The
seat hit it live and worked around it by taking the design as reply text and writing the artifact
itself.

Out of the slice on census: the repair is a write grant into `backlog/`, which reaches
`architect.md`, the step table, and CLAUDE.md's board-ownership paragraph. `coach.md` carries the
matching grant for `spec.md`, so the fix has a working precedent inside the same corpus. The
workaround costs one sentence per invocation and produces the right artifact.

### P2 — a rule and its mandatory article line have two owners and no green state between them

`agent-doc-check`'s check 5 requires every `rules/*.yml` to be named in the rules article.
`architect` owns the rule; the prose belongs elsewhere; the gate is red between the two edits.

**The slice made this more expensive rather than less.** The user ruled on 2026-09-21 that corpus
prose changes go through the process pipeline, so that one article line now costs a spec, a
signature, a `writer` pass and an `editor` pass. `architect` routed around it by declining to
author the deferred rule at all, on the separate ground that its subject had evaporated, and left a
concrete reopen trigger: the day a second program needs the record-path fact, the module moves to
`scripts/` root and the rule is authored in that same pass, fixture and article line together.

### P3 — a role file's standing duty and a legitimate prompt can contradict each other

`architect.md` tells the design pass to author a rule with its fixture passing, unconditionally. A
prompt saying to write no file makes that impossible. The pass flagged rather than proceeded, which
was the right outcome reached with no rule saying so.

The most general of the findings: precedence binds every role, so it lands in `handoffs.md` or the
invocation contracts and touches every role file that states an unconditional duty.

### P4 — the board read carve-out is a two-file allowlist, and the pipeline needs more

The carve-out names a role's own `spec.md` and `amendment-*.md`. **Two instances appeared in this
slice.** `coder` could not read the design it was executing, so the seat pasted the relevant step
into each prompt. And `coach` could not read the proposal that `pipelines.md` step 1 requires it to
read, so it worked from a restatement.

The parent slice's `retro.md` owns the artifact-versus-prompt question and holds the evidence. This
is a second and third instance for it rather than a separate question.

### P5 — a measurement's input is a premise to re-measure

A synthesized artifact was used as a measurement's input and never checked against its own ruled
shape. The durable form: `claim-discipline.md`'s instruction to re-measure a premise you were
handed reaches a measurement's **input**, not only its conclusion, and a synthesized input is where
it binds hardest.

**It paid for itself inside the same slice.** `coach` re-measured a staleness claim the seat handed
it about `.claude/references/definition-of-ready.md` and refuted it, keeping that file out of the
file set.

### P6 — the seat's staleness residue needs the route approved as well as the text

CLAUDE.md permits the seat a staleness residue with the user's approval. The seat put the route to
the user as an open question, the user rejected the question and answered a content question
instead, and the seat read that as approval of the route and committed three corpus files. The
commits were reverted and the work re-routed through the process pipeline.

The durable form: the approval has two halves, route and text, and silence on either is consent to
neither. Where the edit writes an instruction clause rather than a file name or a count, the
default route is `coach`.

### P7 — mechanisable today: bind every sidecar to the pair index

CLAUDE.md's pair index names which instruction files have a `.meta.md` sidecar, and nothing checks
it. The shape is `agent-doc-check`'s check 5. Measured 2026-09-21: 23 sidecars, 23 named, 0
missing — so it would land green with no backlog, which clears `prose.md`'s landing constraint.

The known gap belongs in the proposal: naming a stem is not describing the pair, and nothing would
check a sidecar's contents.

### P8 — a conditional spec item can falsify verbatim text elsewhere in the same spec

The defect that reopened this cycle. A decision point added a stop clause to one file, and a
different item's verbatim body — drafted before that point was ruled — asserted a count of that
file's clauses. Ruling the conditional item in made two sentences false before `writer` typed a
character.

The durable form: **a spec carrying a conditional item owes a re-read of every other item against
that item being ruled in.** One decision point in this spec named its knock-ons; the conditional
one named only the sentence it added.

Three roles behaved correctly and none could repair it. `writer` must type spec text verbatim.
`editor` found it and is forbidden from editing spec-supplied text. `coach` owns the spec, and took
the fault.

### P9 — a counted census inside a sidecar has no loud audience

`claim-discipline.md` keeps the count-beside-enumeration form because it fails loudly. In a
`.meta.md` sidecar it does not: Vale is off by construction in that tier, no role has a read
trigger for it, and the numeral's subject lives in another file. So the form does not belong in a
sidecar at all.

### P10 — a sign-off block instructs the signer to edit an immutable file

`spec.md`'s and `amendment-1.md`'s sign-off blocks are written as fill-in lines ending
`Signed: _pending_`, which reads as an instruction to edit the file to sign it. `pipelines.md`
rules a signed spec immutable, and this repository's practice is an empty commit so the signed
bytes stay the signed bytes. Both blocks in this slice still read `not yet ruled` on points that
are ruled, and only `git log` disagrees.

### P11 — the seat dropped a sequencing rule, and nothing could have caught it

`pipelines.md` says `cleaner` runs after every `coder` invocation rather than once after the last,
so each pass gets a small diff. The seat wrote that into its own plan and then ran `cleaner` once,
on the union of five `coder` invocations. The user caught it by asking.

**It happened twice in the one slice, in two pipelines.** The process cycle runs `writer` then
`editor` CLEAN then `editor` AUDIT then `coach` REVIEW, and the seat ran the first `coach` REVIEW
with no AUDIT before it. The reopened cycle let the order be corrected from the amendment pass
onward, so the miss cost a stage run out of order rather than a stage skipped.

This is the parent slice's recorded gap from the other side: the invoking prompt is the one artifact
nothing checks. A sequencing rule stated in a reference that no gate reads survives only if the
seat remembers it, and two misses in one slice is the measurement rather than the anecdote.

**What would catch it is not a checker.** Both rules are facts about a sequence of invocations, and
no gate reads a prompt or a sequence. The parent slice's `retro.md` already holds the candidate
remedy — a per-pass task artifact scoping each invocation — and this finding is the second body of
evidence for it rather than a new question.

**The cost landed anyway, in the direction that argues for the rule.** `cleaner`'s single mutation
run found eleven survivors, every one a genuine unanchored-regex gap rather than an equivalent, and
the first run came in below the configured break threshold. Whether a per-pass cadence would have
surfaced them earlier is unmeasured.

### P12 — a spec that grants an edit without supplying its bytes hands authorship to `writer`

Every item of the spec supplied verbatim text except the conditional decision point, which granted
"one sentence is added". `writer` composed two, and the count error that reopened the cycle was that
composition rather than spec text. Nothing in the artifact marks which paragraph the spec did not
write, which is how the first amendment's attribution went over-broad.

The durable form: **a spec supplies bytes for every edit it names, a conditional item included. A
grant with no bytes is a `writer` decision the spec is pretending to have made.** The cheap version
is one line — a decision point that cannot supply bytes says so, and says who authors them.

### P13 — a spec cites a rule at two widths, and nothing reads a spec against the rules it invokes

Two instances. One item stated `claim-discipline.md`'s rule correctly in a binding note's second
sentence and over-broadly in its bolded lead; another item's verbatim body kept only the bolded
half, which is the sentence the second amendment replaces. Separately, one item removed a tier
roster from `prose.md` on the ground that a roster of external state rots, while another item added
a negative universal over a tier in the same pass.

The durable form: **where a spec invokes a house rule, the rule's own text is the authority and the
spec's paraphrase is not — quote it or cite it, never compress it.** No role reads a spec against
`claim-discipline.md` today, and `coach` is the only party positioned to.

### P14 — `coach` REVIEW cannot find a defect that needs disagreement with its own reading

`coach` REVIEW reviews text `coach` SPEC authored. The first amendment's subject was a numeral
against its own enumeration — mechanical, and REVIEW found it. The second amendment's subject is a
judgement about what a cited article says, where the reviewer shared the author's mistaken reading.
One REVIEW pass cleared it; `editor` AUDIT found it on its first run.

The durable form: **`editor` AUDIT is not optional for a process enabler, because it is the
pipeline's only independent reading of a cited rule.** This strengthens P11's remedy rather than
competing with it — the sequencing rule the seat dropped is the one that protects against this
class, and dropping it is what let the defect survive a review.

### P15 — a disposition routed to the retro is executed by a different party than the one that ruled it

The first amendment dispositioned four findings here. Measured 2026-09-21 on `e510567`: one arrived
as a board recommendation, and **the other three did not arrive at all.** The seat wrote a thorough
intake and the three that came through an amendment's disposition table, rather than through a
handoff's finding list, are the three that fell out.

The durable form: **an amendment's disposition table is an instruction to the seat, and the closing
REVIEW is the only pass that can check it arrived.** That review did, which is how the gap surfaced,
and the three findings below are it being closed.

### P16 — the seat runs tree-wide git operations while agents write to the same worktree

To take a pre-edit Vale baseline of `CLAUDE.md` at its real path, the seat ran `git stash` and
`git stash pop` while a `writer` pass held uncommitted work in the same worktree. The work survived.
It survived on timing: a stash is tree-wide, so a write landing between the two commands would have
been swallowed or conflicted, and the seat had no way to know where in its pass the agent was.

The hazard is structural rather than careless in the particular. One worktree is one working tree,
the concurrency model is one slice per worktree, and the seat's own procedures need tree-wide git
operations that the per-slice isolation does not separate. The baseline discipline
`.claude/agents/articles/prose.md` mandates is what invited it: a baseline must be taken at the real
path, and the cheapest way to get `main`'s bytes to a real path is to move the working tree.

The durable form: **take a baseline by writing the old bytes to the path and restoring them, never
by moving the working tree.** `git show <ref>:<path>` reaches the old bytes without touching
anything else, and `editor` used exactly that method for the same measurement in the same slice.
Nothing warns about the alternative, and no gate could.

## The three dispositions that fell out, now recorded

Each was ruled non-blocking on the ground that it is true on the tip. A claim that is true today and
rots later is this slice's own stopping-condition boundary, so each is recorded rather than repaired.

- **A register defect reinstated one file over.** `.claude/references/pipelines.md` now reads "An
  assessment record is refused by its own path, in every lane, ahead of the candidate test", and the
  sentence after it reads "The hook reports the refusal and scores nothing". Both are undated
  present-tense assertions about another program's internals — the same form this slice deleted from
  the judging skill. Both re-measured true on 2026-09-21, at the source and behaviourally. The dated
  counterpart exists in `SKILL.meta.md`, and nothing connects the two.
- **An undated paragraph among dated siblings.** `SKILL.meta.md`'s "The hook reports; it does not
  enforce. Argv mode writes every line to stdout and exits 0, with the outcome's `deliver` flag
  unread" states a present-tense fact about `run.ts` while its three sibling paragraphs date theirs.
  The tier is exempt from every Vale register rule, so nothing mechanical reaches it, and
  `claim-discipline.md` binds it regardless. Its opening paragraph carries a second instance.
- **A heading whose section outgrew it.** `SKILL.meta.md`'s "Why the basename guard is duplicated in
  prose" now covers a paragraph whose subject is a different stop clause. One clause holds it under
  the heading. A heading rewrite is structural and no signed text licensed one.

**One observation of the same family**, recorded because its subject has already rotted once
elsewhere in the same file: CLAUDE.md's new pair-index bullet says `idea-assess` has a sidecar "and
no other skill does". That is a negative universal over a tier with nothing checking it, and the
article roster two bullets above it is the same shape, already false.

## Two records, not findings

**A promoted record's `LAYER1` line names a path that promotion retires.** The ruled record shape
mandates that line verbatim, and its target is the idea file's path in the ideas lane. Promotion
renames that file. Nothing reads the line today, so nothing breaks; it is a latent inaccuracy in an
artifact ruled immutable, and whether the shape should name a path at all belongs to the parent's
retrospective.

**This item's folder has no `assessment.md`, and that is correct.** Both promoted items predate the
judging skill writing a record file at all, so their assessments exist only in the promotion commit
bodies. Backfilling one would fabricate a record the promotion was not granted on — the user ruled
that on 2026-09-20.

## Board recommendations carried out of the slice

The user declined new board capture during the parent slice, so these are recorded here rather than
filed. A retrospective rules whether any becomes an item.

1. **A technical enabler** binding every `*.meta.md` to CLAUDE.md's pair index. P7 carries the
   pre-measurement and the known gap.
2. **A candidate** for a `.claude/skills/` routing entry in CLAUDE.md's Documentation map. The tier
   holds five files and the map mentions it only in passing.
3. **A disposition for one false claim.** `prose.md` says of the skills tier that it "carries no
   backlog", and a scoped run reports one finding in `idea-approve/SKILL.md`. Either the finding
   clears or the sentence stops claiming zero. Pre-existing, and both fixes edit passages this
   slice never opened.

## What worked, and is worth keeping

**Fault injection rather than test existence.** `architect` verified the lane-sensitivity by making
the deciding function lane-blind and confirming exactly two tests reddened — the pure-table row and
its filesystem twin. That proves the fault is both reachable and observable, which asserting the
tests exist does not.

**Re-making an inherited equivalence ruling.** A surviving mutant carried a demonstration dated
before this slice. Because the deciding function's signature changed, `cleaner` re-ran the
demonstration and declined to claim the ruling, and `architect` re-made it by hand-application.

**Probing a zero for discrimination.** Every Vale reading in the process pass was probed by
injecting the defect the rule looks for. Two would otherwise have been confident zeros: a
whole-tree section that does not reach `backlog/**` for register rules, and a baseline taken at a
path outside the repository, where an exact-match section glob reaches nothing and a clean run is
reported over zero files.

**An executing role reporting rather than repairing.** `editor` found four defects in text it was
authorised to be editing and changed none, because all four were spec-supplied. `writer` flagged
its own directory-for-file substitution as unauthorized rather than as a fix.
