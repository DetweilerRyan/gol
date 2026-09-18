---
name: the-retrospective-deletes-evidence-a-landed-ruling-cites
title: Rule where a spike's evidence lives once the retrospective deletes its folder
created: 2026-09-18
---

Captured from `coach` SPEC revision 2 on `split-the-merge-protocol-reasoning-into-its-sidecar`,
2026-09-18.

## Situation

A spike's deliverable is `findings.md` in its board folder. The folder moves to
`backlog/done/` at landing, and the retrospective deletes it. The `slice/` tag is the
permanent completion record.

`procedure-length-clears-by-relocation` is the first spike whose findings a **landed rule**
rests on. The running slice records that rule in `prose.md` and its measurements in
`prose.meta.md`, and both point back at the spike's findings for the evidence.

## Complication

The retrospective deletes the evidence behind a rule that is still in force. What survives
is the tag, which preserves the commit but not a path any prose line can cite.

This is the deletion side of the same asymmetry
`artifact-name-tokens-break-when-done-empties` records from the token side. That capture is
about a filename that stops resolving. This one is about an argument that stops being
readable — a reader who asks why the rule says what it says finds a rule with no evidence
behind it, and `claim-discipline.md`'s whole position is that a ruling carries its
measurement.

The board's own design says the retrospective extracts what finished work can teach before
deleting. Nobody has ruled what "extract" means when the durable half is a measurement
another file cites.

## Question

Where does a spike's evidence live once its folder is deleted — copied into the citing
sidecar, promoted to an ADR, or does the retrospective learn to keep folders that landed
rulings depend on?

## Open questions

- Copying the measurements into `prose.meta.md` at landing makes the sidecar
  self-contained, which is the cheapest answer. Does that generalise, or does it just move
  the problem to whichever file cites next?
- `adr/` exists for decisions whose reasoning would otherwise be lost, which is a close
  description of this case. Is a ruled spike an ADR candidate by default?
- The retrospective's trigger and owner are still unruled. Does this question wait for that
  ruling, or does it constrain it?
- How many landed rules already cite a `done/` folder? Nobody has counted.
