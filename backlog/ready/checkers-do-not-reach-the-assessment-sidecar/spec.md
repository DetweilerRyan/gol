# Spec — withdrawn

`coach` SPEC, 2026-09-20, for the process pass that rode inside the technical enabler
`checkers-do-not-reach-the-assessment-sidecar`. **Withdrawn the same day, never signed.** Nothing
in this file is an authority `writer` may edit under. It is kept as the record of a pass that ran
and closed.

## Why it is withdrawn rather than amended

**An amendment was the wrong instrument, because nothing had been signed.** `pipelines.md` gives
the amendment one trigger — a signed spec is the authority `writer` edits under, so changing it
after sign-off needs its own rule. This spec stopped at the user gate and never passed it, so it
was still mutable and there was no signed text to supersede.

**The subject died, so the pass closed with it.** The spec carried two items. Item 2 was the
behavioural change the pass was authorized for, and measurement refuted the premise under it. Item
1 is a false rationale clause, which is the seat's residue rather than process work.

## What was refuted

Item 2 instructed the judging skill to write `reference-check` allow markers for filenames an idea
only proposes creating. Three measurements taken on 2026-09-20 removed its premise:

- The two assessment records in this repo's history carry **zero** filename tokens each. Both exist
  only as the judge's record in a promotion commit body.
- The ruled record shape has no slot for a file list. The record reasons about **whether** an idea
  names a file set and never names one itself. Naming files is the design pass's job.
- The one filename a conforming record must carry is the `LAYER1` line's target, and a marker the
  judge writes cannot fix it. After promotion that path stops resolving, because the file becomes
  `proposal.md` and the checker matches on basename.

So `architect`'s F1 measured a synthesized record that did not conform to the ruled shape.

**The user then dropped the `reference-check` carve-out entirely**, on a measured yield of zero
findings against a cost of one permanent gate failure per promoted record. The slice is the
board-shape hook alone.

## What survives, and who owns it

**Item 1 survives on its own facts and is handed to the orchestrating seat**, as descriptive
staleness under CLAUDE.md's Conventions. The hook half still lands, so the clause still goes false.

The seat's edit, in `.claude/skills/idea-assess/SKILL.md`:

**Replace, verbatim:**

```text
**A target whose basename ends `.assessment.md` is a record rather than an idea — stop and say so, and score nothing.** Layer 1 does not refuse it, since the classifier reads position rather than basename.
```

**With, verbatim:**

```text
**A target whose basename ends `.assessment.md` is a record rather than an idea — stop and say so, and score nothing.** Read the basename yourself before you assess, and never take candidacy from the Layer 1 output alone.
```

### Four things the seat must preserve when it makes that edit

1. **The bolded instruction is byte-identical.** Only the trailing clause moves. The user ruled the
   skill's own basename guard stays.
2. **The replacement is not a deletion, and that is the whole argument.** The old clause carried a
   consequence: it said why the skill's own guard is not redundant once the hook refuses a record
   too. Delete it outright and a later pass reads the guard as duplicated work and removes it. The
   replacement keeps that consequence in instruction register while asserting nothing about the
   hook's internals, which `claim-discipline.md` prohibits.
3. **Carry the consequence argument into the commit body**, so a `git log -L` over that clause
   finds why the guard survives. That is the only durable home for it once this pass has closed.
4. **The register reading is already measured, so no re-probe is needed.** `vale` on the whole
   candidate file, at a path on the same `.vale.ini` glob, reported 0 findings against the twelve
   rules that section enables, against a pre-edit baseline of 0. The probe was confirmed to
   discriminate: the same copy with a contraction and a 32-word sentence reported three.

**This edit sits at the edge of the seat's residue, and the user's approval is what places it
there.** It corrects a false clause, which is squarely staleness, and it writes an instruction
clause, which is not. The user may instead decline this withdrawal and sign a revised spec, which
routes the same text through `writer` and `editor`. The ruling above is the proposal; the user's
call binds.

## Consequences for the seat's staleness list

- **Void: the record-shape block** in `.claude/references/definition-of-ready.md`. It was made
  stale only by item 2's marker placement, and item 2 is dead.
- **Void: the `reference-check` routing entry** in `CLAUDE.md`. With the carve-out dropped,
  `backlog/**` stays excluded and that entry stays true. Stated as a reading of the ruling rather
  than as a measurement of the final diff.
- **Still live:** the Layer 1 description and the example tally in
  `.claude/references/definition-of-ready.md`, and the rules-article entry for the structural guard
  `architect` authors at REVIEW. Both belong to the hook half, which is still landing.
- **D2 and D3 are void.** Both existed only to serve item 2. D1 was ruled by the user: keep the
  guard.

## The process findings — P1 to P4 stand unchanged, and P5 is added

None of the four depended on the refuted premise, and each is re-affirmed rather than carried
silently. All five go to this slice's own `retro.md`, which the seat writes during the slice. That
is an existing intake, not a new board item.

- **P1 — `pipelines.md` plans `design.md`; `architect.md` grants no write.** Real and demonstrated.
  Out on census: `design.md` is named in three rows of `pipelines.md` and two places in
  `CLAUDE.md`, and the repair is a new write grant into `backlog/`, which reaches `architect.md`,
  the step table and CLAUDE.md's board-ownership paragraph. The workaround costs one sentence per
  invocation and produces the right artifact.
- **P2 — a rule and its mandatory article entry have two owners and no green intermediate state.**
  Out. The remedy is a sequencing clause whose home is CLAUDE.md, outside any file set this pass
  held, and it interacts with the no-role-edits rule the parent slice spent four amendments on.
- **P3 — a role file's standing duty and a legitimate prompt can contradict each other.** Out.
  Precedence binds every role, so it lands in `handoffs.md` or the invocation contracts and touches
  every role file stating an unconditional duty.
- **P4 — the board read carve-out names `spec.md` and `amendment-*.md`, not `design.md`.** Out, and
  already queued: the parent slice's `retro.md` owns the artifact-versus-prompt question and holds
  the evidence. Add the `design.md` case there as a second instance.
- **P5 — a synthesized artifact used as a measurement's input was never checked against its own
  ruled shape.** The DESIGN pass synthesized a record, measured it honestly, and the measurement
  licensed nothing, because the input did not conform to the shape
  `.claude/references/definition-of-ready.md` states. The finding then travelled as fact through
  two hands. `coach` had that shape file open for an unrelated question and did not check the
  premise against it. The durable form: `claim-discipline.md`'s "re-measure the premise you were
  handed" reaches a measurement's **input**, not only its conclusion, and a synthesized input is
  where it binds hardest.
