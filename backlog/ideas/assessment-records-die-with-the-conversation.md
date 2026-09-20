---
name: assessment-records-die-with-the-conversation
title: Persist each assessment as an idea-side sidecar that survives promotion for the retro
created: 2026-09-19
---

## Situation

An `/idea-assess` record lives in the conversation that ran it, and its only durable trace is
the judge-verbatim half of a promotion commit's two-record body. The board has moved to
per-item artifacts — a `done/` item is a folder carrying its proposal, spec, and design — and a
retro reads what the item left behind.

## Complication

A retrospective wants to compare what actually happened against the initial assessment, and the
assessment is the one artifact the item does not carry. An idea assessed but never promoted
leaves no record at all; a promoted one leaves the record in git archaeology rather than beside
the work. The skill is also user-invocable only, so no assessment happens unless the user types
the command.

## Question

Where does an assessment live so the retro can read it beside the item, and what may change it
after it lands there?

## Answer

Shaped, not specified, per the user's direction 2026-09-19: the skill becomes model-invocable
and writes its record to an assessment sidecar beside the idea. The sidecar survives promotion
into the ready lane. A re-assessment may replace an existing sidecar while the idea is still in
the ideas lane; after promotion the assessment is immutable — the record the retro compares
against is the one the promotion was granted on.

The sidecar also stores a hash of the assessed idea file's contents, so an assessment that has
gone out of sync with its idea is detectable rather than read as current — and a
post-assessment edit therefore forces a visible re-assess-or-acknowledge before promotion
freezes the record.

**The hash is the git blob hash — ruled by the user 2026-09-20.** It is the id git already
assigns the file, so sync is checkable against the committed tree rather than by rehashing,
and the assessed text stays retrievable by that same id. The census instrument pinned to a
blob hash for those reasons.

Measured 2026-09-20: the id survives rebase and squash unchanged, since content alone
determines it. Only retrieval is at risk, and only where a squash swallows the commit that
captured the assessed state and the unreachable object is later pruned. The sync verdict holds
in that case regardless.

**Promotion verifies sync before granting — ruled by the user 2026-09-19.** An assessment out
of sync with its idea fails the promotion. This is a correctness precondition of the promotion
procedure, the same class as the existing refusals on a missing judge record or absent human
ruling — not a gate on the board, which is why the lane cap stays advisory while this does
not: a cap is a limit, a stale record is an integrity fact.

## No-gos

- No gate on immutability. The board stays ungated; post-promotion immutability is a stated
  rule, enforced the way the board's other rules are.

## Open questions

- The judge holds no Write by design — the separation-of-powers ruling that a judging seat may
  not act on its own grade. Writing its own record is not acting on the grade, but the grant
  needs its ruling restated: Write scoped to the sidecar, or the seat writes the record from
  the returned text?
- Model invocation was disabled deliberately as a cost control on the fork. What triggers an
  automatic assessment, and what stops one firing on every board touch?
- The promotion commit's two-record body carries the judge's record today. Does the sidecar
  become the single home with the commit referencing it, or do two homes carry one record?
- What do the board's own checks say about an assessment sidecar — does the Layer 1 shape
  check ignore it, and which prose rules reach it? The hash gives that check a new
  deterministic fact if wanted: sidecar hash versus current blob, reported as staleness.
- Does the human ruling join the sidecar as its second half at promotion, mirroring the
  two-record body, or stay in the commit alone?
