---
name: which-file-owns-the-incremental-obligation
title: Rule which file owns the instruction to restore the scripts incremental path
created: 2026-09-18
---

Filed by `coach` REVIEW round 2 on `split-the-merge-protocol-reasoning-into-its-sidecar`,
2026-09-18, with the user's approval the same day. `coach` ruled it outside that slice's
authority: collapsing the duplication reaches into another article's own structure.

## Situation

Two files instruct a future slice to do the same concrete thing. A slice that adds
`--incremental` to `npm run test:mutation:scripts` must restore
`reports/stryker-incremental-scripts.json` to the merge protocol's step 5.

`.claude/references/merge-protocol.md` states it at step 5.
`.claude/agents/articles/mutation-testing.md` states it too, and cites the merge protocol in
the same breath.

## Complication

`.claude/agents/articles/prose.md` bars a restatement of a section it cites. The duplication
is **pre-existing in form** — before the register split, `mutation-testing.md` restated the
obligation _and_ pointed at a clause that no longer existed, so the split's repair made it
less wrong rather than more. But two files now carry one obligation, and neither says which
is the source.

The failure mode is the ordinary one for a duplicated instruction: a later slice edits one
copy, and nothing points at the other. This pair's own sidecar warns about exactly that
shape, from the incident that put the mutation-invariance allowlist in three files at once.

## Question

Which file owns the obligation, and what does the other one say instead — a pointer, a
narrower claim, or nothing?

## No-gos

- No change to what the obligation requires. This is a question about where an instruction
  lives, not what it says.

## Open questions

- The merge protocol is the procedure a seat executes, which argues it owns the step.
  `mutation-testing.md` is where a reader learns why the `scripts/` run writes no cache,
  which argues it owns the explanation. Does the split fall on that line?
- `prose.md`'s restatement rule bars the citing file from restating. Does a pointer with no
  restatement carry enough for a reader who arrives at `mutation-testing.md` first?
- Is there a third site? Nobody has swept for other copies of this obligation.
