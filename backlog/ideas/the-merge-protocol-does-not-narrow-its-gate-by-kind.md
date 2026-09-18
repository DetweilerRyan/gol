---
name: the-merge-protocol-does-not-narrow-its-gate-by-kind
title: Reconcile the merge protocol's unconditional gate with the per-kind exits
created: 2026-09-18
---

## Situation

`.claude/references/pipelines.md` narrows the exit per backlog kind. Its Spike section
states that the exit is the gates the diff can move, the `done/` move and the tag, and that
`hardener`'s full sequence runs only when the spike's diff reaches `src/` or `scripts/`.

`.claude/references/merge-protocol.md` mandates `hardener` at step 3 and again at step 5,
with no condition attached to either. Its own header says to open it at step 1, before the
first command.

## Complication

A seat that follows the merge protocol's instruction to open it first finds nothing in it
that points at the per-kind exit. Both files are correct read alone. The collision is
between them, and the protocol is the one the seat is told to open.

Measured 2026-09-18: landing the `procedure-length-clears-by-relocation` spike, the seat
opened `merge-protocol.md` at step 1, followed it, and invoked `hardener` for the step-3
gate on a four-file documentation diff. The user stopped the run. Nothing in the protocol
had signalled that a spike's exit is narrower, and the seat had not opened the Spike
section of `pipelines.md` for an item it had already promoted and run.

The failure direction is cost rather than risk — a gate that cannot move was paid for
anyway. That is the same defect `dont-run-gates-that-cannot-move` names from the other
side.

## Question

Where does the per-kind narrowing live, so that a seat reading either file alone lands in
the same place?

## Open questions

- Does `merge-protocol.md` gain a pointer at steps 3 and 5, or does its header name the
  per-kind exit before step 1? The header is the surface the seat is instructed to read
  first, which argues for the header.
- **Step 8 carries the same defect and nobody has named it.** It reads the
  acceptance-mutation figure from `product`'s VERIFY handoff. A spike and a technical
  enabler run no `product`, so the step has no input for them, and the protocol does not
  say so.
- Does `pipelines.md`'s Spike exit bullet cite the merge steps by ordinal, or does the
  citation run only one way?
- Is any other step in the protocol story-specific in the same silent way?
