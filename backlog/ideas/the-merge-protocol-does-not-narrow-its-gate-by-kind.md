---
name: the-merge-protocol-does-not-narrow-its-gate-by-kind
title: Reconcile the merge protocol's unconditional gate with the per-kind exits
created: 2026-09-18
kind: enabler-process
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

**The enabler-process case is wider than the spike case, and it is a contradiction rather
than a silence.** `pipelines.md`'s enabler-process section states the opposite of the Spike
section: "`hardener` runs at the merge protocol, not as a pipeline step", with the exit "as
the story, minus step 8's figure". So for this kind the documented rule is that the full
gate runs.

The user ruled against it twice on 2026-09-18 — once at the step-5 integration gate on
`name-the-spec-amendment-and-the-in-cycle-fix-rule`, and once in advance for
`record-two-rules-the-amendment-cycle-surfaced`. Both diffs were confined to `.claude/**`
and `backlog/**`, where the only gates that can move are `reference-check` and
`agent-doc-check`. The seat ran those two directly and recorded the readings in the tag.

So the rule and the practice now disagree, and nothing in either file records why. That is
worse than the spike case, where the protocol was merely silent.

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
- **What is the enabler-process exit, stated as a rule rather than as practice?** The
  candidate the two 2026-09-18 skips suggest: run the gates the diff can move, which for a
  `.claude/**` and `backlog/**` diff are `reference-check` and `agent-doc-check`. That is
  the Spike section's own form, applied to a kind whose section currently says the
  opposite.
- Does the answer generalise to one rule covering every kind — run the gates the diff can
  move, and name who runs them — or does each kind keep its own exit? A single rule would
  retire the per-kind divergence rather than documenting it.
- Who runs the narrowed set when `hardener` does not: the seat directly, as it did twice on
  2026-09-18, or `hardener` invoked with a named subset? The first is what happened; nothing
  says it is right.
