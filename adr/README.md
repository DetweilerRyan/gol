# Architecture decision records

Durable records of decisions whose _reasoning_ would otherwise be lost. `git log` says
what changed; an ADR says why one option beat the others, and — more usefully — why the
rejected ones were rejected, so a later reader does not re-litigate settled ground or
re-run a measurement that has already been taken.

Format is **MADR**: Status / Context / Decision drivers / Options considered / Decision /
Consequences / Verification. Copy `TEMPLATE.md`.

## The four statuses

| status                      | binds? | editable? |
| --------------------------- | ------ | --------- |
| `Proposed`                  | no     | yes       |
| `Accepted (not yet frozen)` | yes    | yes       |
| `Accepted`                  | yes    | no        |
| `Superseded by [NNNN](…)`   | no     | no        |

**A frozen `Accepted` ADR is immutable.** Correct one by writing a superseding ADR and
marking the old one `Superseded by`, never by editing it. A `Proposed` ADR is still open
and may be edited or withdrawn.

**`Accepted (not yet frozen)` exists because a decision is usually made before its
consequences are known.** The decision binds from that moment, so the record stops being
a proposal. The text still has to absorb what adoption teaches, so freezing it that early
would force a superseding ADR for what is really a first draft settling down.

**Freezing is the owner's call, and nothing triggers it automatically.** Say so, and the
status becomes plain `Accepted`.

**An unfrozen ADR gives none of the stability the immutability rule exists to provide.**
A reader cannot cite it and rely on the wording holding. So treat the unfrozen state as
temporary. If an ADR sits unfrozen long after adoption, that is a sign the decision is
still moving and the ADR is tracking it, which is what a `Proposed` one is for.

## Numbering

Sequential, four digits, never reused.

**`0002` was written before `0001`, and the inversion is deliberate.** This directory was
created by the LSP-proxy work because a decision needed recording before the board slice was
ready, and `0001` stayed reserved for the layout decision itself.
`0001-adopt-the-backlog-board-layout.md` was written by `wire-in-the-adr-tier` on 2026-09-16,
closing the reservation.

**`architect` reads this directory.** Its file routes it here at the start of every design,
review, and adjudicate pass; a record whose status binds is conducted against, never edited
around.
