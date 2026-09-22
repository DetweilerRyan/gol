# Rationale: the `idea-assess` skill

**Audience:** whoever is changing a rule in `SKILL.md`. **Read when:** amending, narrowing, or
overturning one — never in order to follow one.

## Why the basename guard is duplicated in prose

The skill reads a `LAYER1` line that `scripts/board-shape-hook/run.ts` prints ahead of the prompt.
On 2026-09-20 the hook gained a refusal for an assessment record's own path, in `board-shape.ts`'s
`checkShape`, ahead of the candidate test. The skill's basename guard now looks like a second copy
of that refusal, and it is not.

**As of 2026-09-20, the guard covered a gap every stop clause keyed on the `LAYER1` output left
open.** Those clauses keyed on a line shape in that output, or on its absence. The record
refusal printed a shape none of them named — `an assessment record, 0 checks`. Deleting the
basename guard then would have left a reader holding that line with a `LAYER1` line present, no
stop clause that named it, and no instruction covering the case.

**The hook reports; it does not enforce.** Argv mode writes every line to stdout and exits 0, with
the outcome's `deliver` flag unread. Nothing stops an assessment proceeding, so the refusal binds
only because the skill's own prose refuses too.

**The clause was rewritten rather than deleted, and what it lost is the point.** Until 2026-09-20
it read "Layer 1 does not refuse it, since the classifier reads position rather than basename" — a
consequence clause saying why the guard was not redundant. The hook falsified its premise.
Deleting it outright would have left the guard looking like duplicated work to the next pass that
reads the file, which is the shape `prose.md` names under "How a pass damages the file it cleans".
The replacement keeps the duty and states no undated present-tense fact about the hook, which is
the form `claim-discipline.md` rules out. A dated claim about the same refusal is not ruled out,
and the `checkShape` sentence in this section is one.

**As of 2026-09-20, an `off the board` stop clause closed the same gap for one more line
shape.** Measured live that day, `node scripts/board-shape-hook/run.ts src/camera.ts` printed a
`LAYER1` line reading `off the board, 0 checks`, which no stop clause named until
`checkers-do-not-reach-the-assessment-sidecar` added one — the same gap as the basename
guard's, one line shape later. The 2026-09-22 positive gate below replaced that clause; see
that section for what stands in its place.

## What was ruled out

**A stop clause keyed on the hook's own refusal line was rejected.** It would make the skill's
refusal depend on the hook's wording, which is the coupling a basename read avoids. The user ruled
the guard stays, 2026-09-20.

## The 2026-09-22 positive gate

The stop clauses naming `not a candidate`, `off the board` and a missing path were replaced by one
clause: assess only on a `LAYER1` line reporting a non-zero check count. Measured 2026-09-22 on
`slice/the-idea-template-claims-the-whole-board`'s branch, three refusal forms printed a `LAYER1`
line that no stop clause named — `lane declarations unavailable`, `undeclared lane` and `shape
mismatch`. An enumerated list leaves the skill one behind every outcome the classifier grows, and
the artifact axis is deliberately open.

**The positive form fails safe where the enumerated form failed open.** A refusal worded in a way
the skill does not recognise now stops the pass, because the pass proceeds only on a recognised
measurement. The 2026-09-20 ruling above stands untouched: the basename guard is not keyed on the
hook's wording, and it stays.

**What the replacement gave up is the per-case report wording.** Each replaced clause said what to
say. The clause that replaced them tells the judge to report the line, which carries its own reason
after `--`. The forms `board-shape.ts` printed on 2026-09-22 were `extraction returned empty`,
`path missing or unreadable`, `off the board`, `lane declarations unavailable`, `not a candidate`,
`undeclared lane`, `shape mismatch` and `an assessment record` — every one of them at zero checks,
against one scored form that is not.
