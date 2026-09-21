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

**The `off the board` stop clause closes the same gap for a fourth line shape.** Measured live
2026-09-20, `node scripts/board-shape-hook/run.ts src/camera.ts` prints a `LAYER1` line reading
`off the board, 0 checks` that none of the three prior stop clauses named — the same shape as the
basename guard's gap, one line shape later.

## What was ruled out

**A stop clause keyed on the hook's own refusal line was rejected.** It would make the skill's
refusal depend on the hook's wording, which is the coupling a basename read avoids. The user ruled
the guard stays, 2026-09-20.
