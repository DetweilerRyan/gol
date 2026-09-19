---
name: fifty-procedure-length-findings-have-a-remedy-and-no-owner
title: Clear the corpus's remaining ProcedureLength findings in one ruled pass
created: 2026-09-18
kind: enabler-process
---

Captured from `coach` SPEC revision 2 on `split-the-merge-protocol-reasoning-into-its-sidecar`,
2026-09-18.

**Placed in `effective-prose`'s Wave 2, 2026-09-18**, beside the other remediation entries.
Its standing figure is derived rather than measured and moves with every slice that touches a
numbered step — the same caution that wave's first row already carries.

## Situation

The `procedure-length-clears-by-relocation` spike measured 51 `Procedure.ProcedureLength`
findings across nine files on 2026-09-18: `product.md` 13, `coder.md` 8, `cleaner.md` 6,
`merge-protocol.md` 6, `CLAUDE.md` 5, `architect/contract-mode.md` 4, `testing-layers.md`
4, `engineering.md` 3, `mutation-testing.md` 2. That is 44 percent of the corpus's 116
numbered steps.

`architect` ruled the remedy in the same pass: relocate the step's qualification below the
marker line, provided the marker keeps the complete executable instruction. The running
slice applies that remedy to `merge-protocol.md` and records the rule in `prose.md`.

## Complication

After that slice lands, **46** of the 51 findings still stand, across **nine** files. That
figure is derived rather than measured: the spike counted six `ProcedureLength` findings in
`merge-protocol.md`, and the signed spec's expected post-split reading is one — step 5's,
named as accepted — so the slice clears five and `merge-protocol.md` stays on the list with
one. `coach`'s handoff said 50 and eight files; that count assumed the slice cleared one
finding rather than five, and this file carried it unchecked until `/idea-assess` reconciled
it on 2026-09-18. Re-measure after the slice lands rather than trusting either number.

Every one of the 46 has a ruled remedy and no owner. A ruled remedy with no owner is the state where a standing finding count becomes
background noise — the condition `prose.md` already names when it says to read a big number
as unworked rather than as a clean bill.

Clearing them opportunistically, a file at a time as other slices touch them, is the shape
to avoid. The remedy carries a judgment per step — does this marker still carry the whole
instruction — and a judgment applied by whoever happens to be passing is applied
inconsistently. The ruling is corpus-wide, so the pass should be too.

## Question

One pass over the nine remaining files, or a per-file sequence — and who rules each step's
marker-completeness call?

## No-gos

- No change to what any step instructs. The remedy relocates words; it does not reword
  them. Step 5 of the merge protocol is the precedent for a finding that stays because
  clearing it would require rewording an instruction.

## Open questions

- Twenty of the 27 already-relocated bodies the spike found sit in `prose.md`'s numbered
  enumerations of failure modes — numbered statements rather than procedures. `architect`
  called that a separate known imprecision. Does this pass touch them, or does the
  statements-versus-procedure question get its own ruling first?
- Is the expected exit reading 0, or does the audit find more irreducible steps like step
  5? Nobody has applied the completeness test outside `merge-protocol.md`.
- Does the pass run as one `enabler-process` slice, or does its size force a split by file?
