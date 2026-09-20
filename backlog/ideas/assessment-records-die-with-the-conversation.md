---
name: assessment-records-die-with-the-conversation
title: Persist each assessment as an idea-side sidecar that survives promotion for the retro
created: 2026-09-19
kind: enabler-process
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

**The record's shape — directed by the user 2026-09-20.** A summary table opens the record,
one row per letter with the letter spelled out, and a detail section per letter follows in the
same spelling. Frontmatter carries only what a machine reads: the idea's name, the assessment
date, and the blob hash.

The table carries three columns — letter, score, and a one-line finding. A score column alone
would break the bound that a number never travels without its finding text, at the altitude a
reader actually skims. The detail section carries the finding in full, and the table's clause
summarises it.

**The human ruling joins the sidecar at promotion — ruled by the user 2026-09-20.** The judge's
record and the human's per-letter agree-or-differ then sit in one file, which is the pair a
retro compares. That write is the sidecar's last mutation before immutability takes hold.

The judge's record stays first and the human's ruling second. The calibration design turns on
the human label being ruled against the judge's rather than merged into it, and the order is
what keeps the two readable as two. Authorship splits the same way: the judge fork writes its
own record, and the seat writes the human's half at promotion.

Rows hold the INVEST order rather than a score order. Sorting by score is a ranking device, and
the bounds forbid totals and cross-kind ranking. Kind and disposition sit in prose above the
table, not in frontmatter, since the seat copies the kind ruling into the idea's own
frontmatter.

**Promotion verifies sync before granting — ruled by the user 2026-09-19.** An assessment out
of sync with its idea fails the promotion. This is a correctness precondition of the promotion
procedure, the same class as the existing refusals on a missing judge record or absent human
ruling — not a gate on the board, which is why the lane cap stays advisory while this does
not: a cap is a limit, a stale record is an integrity fact.

**The checker work splits out — ruled by the user 2026-09-20, on the assessment's kind.** This
is a process enabler, and its cycle runs roles that may not write `scripts/`. So Layer 1's hash
check and the `reference-check` carve-out leave this slice and become
`checkers-do-not-reach-the-assessment-sidecar`, a technical enabler that depends on this one.

What stays is the corpus: the skill, the promotion procedure, the record's shape, and the board
documentation. Two documentation surfaces go false the moment a sidecar lands, and the slice
owes both — CLAUDE.md's one-flat-file-per-idea clause, and the statement of what a per-item
artifact owes in the pipelines reference.

## No-gos

- No gate on immutability. The board stays ungated; post-promotion immutability is a stated
  rule, enforced the way the board's other rules are.

## Open questions

- Both halves of the record now live in the sidecar, and the promotion commit keeps a summary.
  Does the human's half also reduce to a summary there, or leave the commit body entirely?
- Which prose rules reach a sidecar, given that Layer 1 now reads one line of it and checks no
  shape? A ruling-in-waiting, read out of both rulebooks and `.vale.ini` on 2026-09-20 and
  recorded here so the slice rules with the analysis in hand:

  - **No register rules.** STE, `Instruction` and `Procedure` are calibrated for a file a
    reader follows in order to act, and the board section held all three off on that reading at
    that date. Immutability is the stronger argument: a finding on a frozen assessment cannot
    be cleared without breaking the immutability rule. A register rule ever wanted therefore
    fires at write time through the existing hook, never as a standing lint.
  - **The three `Claim` rules, measured before enabling.** `SentenceInitialMost` is the one
    likely to fire on judge prose, since an unmeasured majority is a judge's characteristic
    defect. The other two looked near-unreachable on this surface. The landing constraint
    forbids enabling over an untriaged backlog, so the slice measures first.
  - **`claim-discipline.md` is the real rulebook here**, because an assessment is a record
    rather than an instruction file. Six forms bind it: date the figure and name the tree,
    write the whole record as history, keep a claim at the scope of the command that produced
    it, date any claim about another board file, name which rather than how many, and name the
    slug rather than the bare indexical. The blob hash mechanises the name-the-tree half of the
    first form, so the hash ruling and this one are the same rule twice.
  - **The live gap is `reference-check` rather than Vale.** That checker excluded the whole
    board from both surfaces at that date, for two recorded reasons: a board file names dead
    references as its own worked examples, and a candidate names a module it only proposes
    creating. Both are facts about ideas. An assessment cites files that exist, so the
    exclusion would hide the exact class the checker exists to catch. Carving the assessment
    sidecar back out is the candidate change, and the scope decision is a pure module with a
    test already asserting the exclusion, so the opposite assertion costs one test.
