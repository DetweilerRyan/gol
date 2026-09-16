---
name: pipeline-reference
title: Author the per-kind pipeline reference and single-source it from the docs that carry pieces of it
created: 2026-09-16
---

Child of `backlog-board-redesign`, the epic index. The deliverable and its boundaries were
ruled by the user at the 2026-09-16 reevaluation recorded in that file's git history. **Lands
after `backlog-board-migration`** — the reference names lanes and artifacts that slice creates.

## Situation

No surface states a slice's pipeline end to end. Answering "what happens, in order, for an
enabler?" means synthesizing CLAUDE.md's cycle string and design-pass triggers,
`orchestration.md`'s invocation contracts and sequencing rules, `handoffs.md`'s handoff shape,
and the role files' own closings. Per-kind variation exists only as scattered exceptions.

## Complication

The board redesign gives every backlog item a kind, and kind now selects a cycle — the spread
gets worse, not better, unless one surface owns the map.

## Question

Author the single source of truth for the orchestration pipeline and handoffs per backlog item
kind.

## Answer (ruled, user 2026-09-16)

**`.claude/references/pipelines.md`** plus a `pipelines.meta.md` sidecar. One section per kind
— story, enabler, spike, epic — each a complete class of service (the Kanban term for explicit
per-work-item-type policies):

- **Entry** — what promotion creates for the kind.
- **A Mermaid flow plus a step table** (both, user-ruled; consistency between the two is by
  hand). Table columns: role + mode; what the invoking prompt must carry; artifacts read and
  written; gates; the closing handoff, citing `handoffs.md` for the shape.
- **Exit** — the `done/` move, the tag, a merge-protocol pointer, the retrospective.
- One cross-kind section: the escalation lanes as pipeline interrupts.

**The gates cell is a citation, never a list.** A role file is the single source for its own
gates; restating a gate list is the drift this epic keeps finding. Only commands the seat runs
and no role file states appear literally: `mutation-invariance`, `test:perf` +
`perf-report`, the merge-protocol commands. Both sides of an invocation contract existing is
not duplication — the role's side stays in the role file, the seat's side lives here.

**Single-sourcing is by moving, not copying**:

- `orchestration.md`'s "invocation contracts" and "sequencing this seat owns" sections migrate
  in; that article keeps seat conduct plus a pointer.
- CLAUDE.md's "Subagent pipeline" section slims to the routing summary it claims to be,
  keeping the cycle string.
- `product.md`'s six-step acceptance-spike sequence — cross-role choreography — moves into the
  story pipeline; `product.md` keeps its conduct rules (refinement may only strengthen,
  approval once at the end, commit-provisional).
- `architect.md`'s verbatim quote of hardener's eight-stage sequence trims to a pointer at
  `hardener.md`; the do-not-run-the-gate instruction around it stays.
- `coder.md`, `cleaner.md`, `hardener.md`: scanned 2026-09-16, clean — no migrations.
  Frontmatter descriptions that restate pipeline facts are harness-facing selection summaries;
  this slice judges whether to thin them.

**Why `references/`**: the tier's stated purpose is files skills, roles, and the seat may all
name as a read trigger — and the consumers are exactly the seat, `/idea-assess`,
`/idea-promote`, and `definition-of-ready.md` beside it. The standing gates reach it for free:
`agent-doc-check`'s npm-script, retired-role, and cycle-string checks cover `.claude/**`, and
`reference-check` scans every `.md`.

## No-gos

- No restating of any role's gate list, stage list, or craft rules.
- No role-file edits beyond the two ruled migrations — roles stay kind-blind and mode-told.
- No machine-readable pipeline config; prose and diagram only, guarded by the existing gates.

## Open questions

- Whether the role frontmatter descriptions thin once the reference exists, and by how much —
  they are functional (the seat reads them at agent selection).
- Whether the epic's kind vocabulary (`story`/`enabler`/`spike`/`epic`) needs a one-line
  disclaimer at the definition site for the SAFe/DoR term mapping, per the glossary convention.
