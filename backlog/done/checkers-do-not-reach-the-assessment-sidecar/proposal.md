---
name: checkers-do-not-reach-the-assessment-sidecar
title: Teach Layer 1 to read an assessment sidecar
created: 2026-09-20
kind: enabler-technical
---

## Situation

The assessment sidecar is a new artifact class sitting beside an idea file, holding a judge's
record and the human ruling on it. Two checkers under `scripts/` decide what the board's tooling
sees. Layer 1 reads an idea file's shape and hands its findings to the assessing judge, and
`reference-check` resolves filename and symbol citations across the tree.

## Complication

Neither reaches the sidecar. Layer 1 reads the idea file alone, so no checker reads the stored
blob hash and staleness stays invisible to the board's tooling — the single deterministic fact
the hash was chosen for. The two board commands do compare it, and refuse on a mismatch, so the
gap is a checker's rather than the whole procedure's.

This file carried a second complication until 2026-09-20, that `reference-check`'s board exclusion
hides a record's citations. The Ruled section below records the measurement that refuted it and
the user's ruling to drop that half.

The change lands in `scripts/`, which the process pipeline's roles may not write. So the work
cannot ride inside the corpus slice that creates the artifact, and it has no home until it has
its own.

## Question

What do the two board checkers owe an artifact that records claims about live files, rather than
a raw candidate that names files which may never exist?

## Answer

Shaped, not specified. Layer 1 gains two checks. It refuses a record by basename before it
applies the candidate test, so a record in the flat ideas lane stops being measured against the
idea-file shape. And it reads the record's stored blob hash, compares it against the idea file's
current hash, and reports the difference as staleness — lane-sensitively, since a mismatch is
staleness in the ideas lane and expected history once promotion has frozen the record.

The hash check fails open: a comparison passes vacuously when the record is absent. This file
named `scripts/gate-report.ts`'s shared non-empty guard as the precedent. The design pass ruled
that wrong on 2026-09-20 — applied to a matched set that is legitimately empty today, it would
fail the gate immediately and permanently. The ratified guard is instead a required discriminated
union on the deciding function, so absence is a value a caller wrote rather than an argument a
caller forgot.

Documentation surfaces go false with the change, and the slice owes them. The readiness reference
describes what Layer 1 measures and tallies its checks. The `idea-assess` skill explains its own
basename guard by asserting that Layer 1 does not refuse a record. The rules article gains an
entry if a structural guard is authored.

Depends on `assessment-records-die-with-the-conversation`, which creates the artifact both checks
read and rules its shape. Nothing here is worth building before that lands.

**Two findings arrived from the parent's spec on 2026-09-20, after this item was assessed and
promoted.** `coach` found both while specifying the parent, and the seat recorded them here
rather than leaving them in that item's artifacts. Neither was scored.

A third check joins the reach, and it is the one a reader would not predict. The board hook's
candidate test is positional, and a record in the ideas lane carries the same two path segments
a flat idea file does. So the hook measures a record against the idea-file shape and reports
findings for a name, a title, a created date and two headings the record was never meant to
carry. Those findings reach the agent that just wrote the file, which is the judge itself. The
promoted form carries three segments and already draws the hook's refusal instead. Confirmed by
reading the classifier on 2026-09-20.

The hash check is lane-sensitive, and a lane-blind predicate would be worse than none. A
mismatch in the ideas lane is staleness, which is the fact the hash was stored for. A mismatch
in the ready or done lane is expected history, because promotion freezes the record and the next
commit fleshes out the proposal. So a predicate that read the lanes alike would report every
promoted item as stale.

**The parent landed on 2026-09-20, and three things this file says were checked against the
landed tree that day.** The two checkers are untouched — that slice changed no file under
`scripts/` — so the classifier's positional test, the board exclusion and both fail-open readings
all still hold as written.

Two premises moved, and neither is re-scored here, since the letters live in the promotion
commit and that record is closed. The dependency is now tagged and in the done lane rather than
filed and unlanded, which is the fact the Independent finding rested on. And the artifact class
now exists and is written on demand, where the Valuable finding recorded a ceiling on the
grounds that no instance could be cited.

**One surface binds harder than the rest.** The judging skill
now refuses a target whose basename marks it a record, and the clause explaining why names this
item's defect as its reason — that the classifier reads position rather than basename. **That
sentence goes false the moment this work lands**, so the surface does not merely describe the
old behaviour; it depends on it and cites the mechanism. The prose also mitigates only half the
defect: it stops a judge assessing a record, and does nothing about the hook delivering
idea-file findings to whoever writes one.

## Ruled 2026-09-20 — the `reference-check` half is dropped

The user asked why an assessment record would name a file the idea proposes creating, since that
is not what the record is for. Three measurements followed, all taken that day on the slice
worktree, and they refuted this file's own premise.

The two assessment records that exist in this repository's history are carried verbatim in the
promotion commit bodies `d5e9c28` and `888ecc0`; no record file has ever existed on disk.
Extracting every filename-shaped token from both bodies yields none in either.

The record's ruled shape in `.claude/references/definition-of-ready.md` has no slot for a file
list. It carries a summary table, a detail section per letter, what happens next, and the human
ruling. A record reasons about whether an idea names a file set — the record of this very item
scored Small 3 and found that the file names neither the trigger nor a file set — and never names
one itself. Naming files belongs to the design pass.

The one filename a conforming record must carry breaks by construction. The shape mandates the
`LAYER1` line verbatim, and a record without it reads as not-run. That line names its target,
which for an idea assessment is the idea file's path in the ideas lane. Promotion renames that
file to `proposal.md`, and the checker matches on basename, so the token stops resolving. Tested
against both promoted slugs on 2026-09-20: neither resolves.

So the carve-out was measured to yield nothing on real record text, and to cost one permanent gate
failure per promoted record, in a file the parent slice ruled immutable. The user ruled the whole
half dropped. The design pass's finding that a synthesized record produced unresolved tokens rests
on a record that did not conform to the ruled shape, and the seat relayed it without checking the
shape.

The slice is the board-shape hook alone, and the design's steps covering `scripts/reference-check/`
are withdrawn. The shared-tier placement of the new module is withdrawn with them, since the
layout rule reserves that tier for a file two or more programs need.

## No-gos

- No shape enforcement on the sidecar beyond the hash comparison. The parent ruled that on
  2026-09-20, and widening it here would reopen a closed decision.

## Open questions

All three questions this file opened with are closed, on 2026-09-20.

- Whether Layer 1 reports a missing record at all was ruled by the design pass: every state is
  named on the summary line, absence is never a finding, and staleness and unreadability are.
  Silence was refused because it cannot be told from a vacuous pass, and making absence a finding
  would deliver an envelope on every fresh capture.
- Which `reference-check` surface the carve-out reaches is void with the carve-out.
- Whether the carve-out generalises past the record is void with the carve-out.

One question the file did not open with is now live, and it belongs to the parent's retrospective
rather than to this slice. A promoted record carries a `LAYER1` line naming a path that promotion
itself retires. Nothing reads that line today, so nothing breaks; it is a latent inaccuracy in an
immutable artifact, and whether the shape should name a path at all is the parent's call.
