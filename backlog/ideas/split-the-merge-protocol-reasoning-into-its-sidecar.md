---
name: split-the-merge-protocol-reasoning-into-its-sidecar
title: Split merge-protocol.md's clause-level reasoning into its evidence sidecar
created: 2026-09-17
kind: enabler-process
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R2,
2026-09-17, with two of `editor`'s late observations folded in.

## Situation

`slice/extract-the-merge-protocol` moved the protocol byte-for-byte, deferring the
instruction-versus-explanation split so the move stayed reviewable. The instruction half is
137 lines. Six of its seven Vale findings are `Procedure.ProcedureLength`, and step 5's
exemption clause runs most of the file's length.

## Complication

The clause-level reasoning — the invariant exemption's argument, the rejected middle
option, the refuted stage-6 example — is explanation living in the instruction half.
`prose.md`'s "Instruction stays. Explanation moves." rule routes it to
`merge-protocol.meta.md`, which already exists and carries the extraction record.

Two smaller residues in the same pair, from `editor`'s confirmation pass on 2026-09-17:

- The sidecar's re-measure paragraph reads "and in this slice it did so twice" — the record
  sense of the indexical `claim-discipline.md` bans, in text `coach` itself authored.
  Naming the slice adds no filename-shaped token, so the fix cannot move the recorded
  reference count.
- The check-readings table's `vale` on `CLAUDE.md` row ends without a period. It sits
  inside the protected table, where digits are the only edit class proven token-free, so
  it was left rather than fixed.

## Question

Which sentences of `merge-protocol.md` are instruction, and which move to the sidecar —
without renumbering the steps other files cite by ordinal?

## No-gos

- No change to what any step instructs. This is a register split, not a revision.
- No renumbering — the same rule the extraction slice carried.

## Open questions

- The sidecar's re-measure rule binds edits to the check-readings table. A split that
  rewrites the sidecar must re-measure the recorded reference count per that rule's own
  terms.
