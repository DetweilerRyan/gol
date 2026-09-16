---
name: wire-in-the-adr-tier
title: Write adr/0001, fix the stale README reservation, and give architect the adr/ read trigger
created: 2026-09-16
---

Child of `backlog-board-redesign`, the epic index. Scope ruled by the user at the 2026-09-16
reevaluation recorded in that file's git history. Independent of the other two children — it
records a decision already made and wires readers to the tier that holds it.

## Situation

`adr/` exists with `README.md`, `TEMPLATE.md`, and `0002-lsp-proxy-for-out-of-band-writes.md`,
which proved the MADR format on a real decision. `0001` is deliberately reserved. Verified
2026-09-16: no `.claude/agents/**` file names `adr/`, so a binding record currently has no
reader.

## Complication

The reservation paragraph in `adr/README.md` is stale twice over — it names the superseded
0001 subject (adopting the intent-driven layout, which the reevaluation declined) and cites
`ideas/todo/intent-driven-layout.md`, a path that survives `reference-check` only by basename
matching. And an ADR tier nobody is routed to read fails CLAUDE.md's own test: an article
nobody is told to read is worse than no article.

## Question

Write `0001`, repair the reservation, and route `architect` to the tier.

## Answer (ruled, user 2026-09-16)

- **`adr/0001`, one ADR**: a title on the order of "Adopt the backlog board layout". The ruled
  board design is the Decision; the Options considered are the reevaluation's losers — the
  intent-driven `openspec/` layout, capability spec directories, the `changes/archive/` form
  (superseded by `done/` plus retrospectives), and status-in-frontmatter. Written as a record
  of the decision, not a claim the migration landed — the ADR must stay true even while
  `backlog-board-migration` is still in flight.
- **`adr/README.md`**: rewrite the reservation paragraph in the same commit.
- **`architect.md` read trigger**: check `adr/` for in-force records at the start of every
  design, review, and adjudicate pass; a record with status `Accepted` or
  `Accepted (not yet frozen)` binds; never edit a frozen record — `adr/README.md` carries the
  correction path. Plus one pointer line in CLAUDE.md's documentation map.
- **Declined, on the record**: the per-change `adr.md` consultation manifest — with one
  in-force ADR every manifest is ceremony; revisit when "which ADRs touch this slice" stops
  being answerable at a glance. The read trigger is what replaces it.

## No-gos

- No ADR-vs-sidecar routing discriminator — deferred by the user until ADRs have been derived
  from the existing files; the epic index carries the question.
- No new checker for `adr/`; the standing `reference-check` coverage (and its known
  immutability tension, filed as `a-frozen-adr-cannot-carry-an-allow-marker`) stands as-is.

## Open questions

- The exact 0001 slug and title — the ruling fixes the scope, not the wording.
- Whether the CLAUDE.md pointer line lands in the documentation map or beside the `references/`
  tier entry; routing branch 1 vs 2 decides.
