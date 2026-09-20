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

**Four mechanics ruled by the user 2026-09-20.** The judge fork writes the sidecar itself, so
the grant is Write scoped to that file. The skill stays one invocation per idea, and a request
to assess a set — every child of an epic, say — is the seat invoking the skill once per child
rather than a batch mode inside the skill.

The sidecar is the single home of the detailed assessment. A promotion commit carries a
summary, the numeric scores, or both, rather than the record in full.

The sidecar's own frontmatter carries the blob hash, and the Layer 1 check reads that hash
against the idea file to report staleness. Beyond that one fact Layer 1 enforces no shape on
the sidecar, for now.

**Promotion verifies sync before granting — ruled by the user 2026-09-19.** An assessment out
of sync with its idea fails the promotion. This is a correctness precondition of the promotion
procedure, the same class as the existing refusals on a missing judge record or absent human
ruling — not a gate on the board, which is why the lane cap stays advisory while this does
not: a cap is a limit, a stale record is an integrity fact.

## No-gos

- No gate on immutability. The board stays ungated; post-promotion immutability is a stated
  rule, enforced the way the board's other rules are.

## Open questions

- Does the human ruling join the sidecar as its second half at promotion, mirroring the
  two-record body, or stay in the commit alone? The single-home ruling above settled where the
  judge's record lives and left the human's untouched.
- Which prose rules reach a sidecar, given that Layer 1 now reads one line of it and checks no
  shape?
