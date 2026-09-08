# Architecture decision records

Durable records of decisions whose _reasoning_ would otherwise be lost. `git log` says
what changed; an ADR says why one option beat the others, and — more usefully — why the
rejected ones were rejected, so a later reader does not re-litigate settled ground or
re-run a measurement that has already been taken.

Format is **MADR**: Status / Context / Decision drivers / Options considered / Decision /
Consequences / Verification. Copy `TEMPLATE.md`.

**Accepted ADRs are immutable.** Correct one by writing a superseding ADR and marking the
old one `Superseded by`, never by editing it. A `Proposed` ADR is still open and may be
edited or withdrawn.

## Numbering

Sequential, four digits, never reused.

**`0001` is deliberately reserved and not yet written.** It belongs to the
`intent-driven-layout` slice on the idea board, whose own plan specifies `adr/`
scaffolding with `0001` recording the decision to adopt that layout — its
Options-considered section is the rejection table already drafted in
`ideas/todo/intent-driven-layout.md`. This directory was created ahead of that slice
because a decision needed recording sooner; the gap is intentional, not a lost file.
