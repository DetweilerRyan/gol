---
name: checkers-do-not-reach-the-assessment-sidecar
title: Teach Layer 1 and reference-check to read an assessment sidecar
created: 2026-09-20
kind: enabler-technical
---

## Situation

The assessment sidecar is a new artifact class sitting beside an idea file, holding a judge's
record and the human ruling on it. Two checkers under `scripts/` decide what the board's tooling
sees. Layer 1 reads an idea file's shape and hands its findings to the assessing judge, and
`reference-check` resolves filename and symbol citations across the tree.

## Complication

Neither reaches the sidecar. Layer 1 reads the idea file alone, so the stored blob hash is read
by nothing and staleness stays invisible — the single deterministic fact the hash was chosen
for. `reference-check` excludes the whole board from both of its surfaces, on two reasons that
are facts about idea files: a board file names dead references as its own worked examples, and a
candidate names a module it only proposes creating. An assessment cites files that exist, so the
exclusion hides the exact class that checker was built to catch.

Both changes land in `scripts/`, which the process pipeline's roles may not write. So the work
cannot ride inside the corpus slice that creates the artifact, and it has no home until it has
its own.

## Question

What do the two board checkers owe an artifact that records claims about live files, rather than
a raw candidate that names files which may never exist?

## Answer

Shaped, not specified. Layer 1 gains one check: read the sidecar's stored blob hash, compare it
against the idea file's current hash, and report the difference as staleness. The board
exclusion in `reference-check` gains a carve-out for the sidecar, so a record's citations resolve
the way every other record's do.

Both checks fail open, and each owes a guard that says so. A carve-out whose glob matches no
sidecar reports zero findings exactly as a clean tree does. A hash comparison passes vacuously
when the sidecar is absent. The non-empty inertness guard that two gating checkers shared as of
2026-09-20 is the precedent to follow rather than to reinvent.

Three documentation surfaces go false with the change, and the slice owes all three. CLAUDE.md's
`reference-check` entry states the board exclusion as two directories. The readiness reference
describes what Layer 1 measures. The `idea-assess` skill states what its own run reports.

Depends on `assessment-records-die-with-the-conversation`, which creates the artifact both checks
read and rules its shape. Nothing here is worth building before that lands.

## No-gos

- No shape enforcement on the sidecar beyond the hash comparison. The parent ruled that on
  2026-09-20, and widening it here would reopen a closed decision.

## Open questions

- Does Layer 1 report a missing sidecar at all, or only a stale one? An idea with no assessment
  is the ordinary case in the ideas lane, so silence may be right. Either way the silence has to
  be distinguishable from the vacuous pass named above.
- Which of the two `reference-check` surfaces does the carve-out reach? A sidecar carries no
  source comments, so the source surface may be moot rather than merely unused.
- Does the carve-out belong to the sidecar alone, or to any board file that is a record rather
  than a proposal? The retrospective artifacts in the done lane raise the same question.
