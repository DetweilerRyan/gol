---
name: extract-the-merge-protocol
title: Move the merge protocol out of CLAUDE.md into its own reference file
created: 2026-09-17
---

Child of `act-on-the-pipelines-feedback`, the feedback index — its item 4, ruled by the user
2026-09-17.

## Situation

CLAUDE.md carries the nine-step merge protocol in full, including the mutation-invariant
exemption clause — the largest single block in the auto-loaded file. Four-plus files cite
"CLAUDE.md's merge protocol" by name as the source of truth: `hardener.md`,
`orchestration.md`, `pipelines.md`, and the mutation-testing articles. Its consumers are the
orchestrating seat and the pipelines' exit sections — the same audience as
`.claude/references/pipelines.md`.

## Complication

CLAUDE.md's size taxes every session and every subagent, and the protocol is seat procedure
that only one audience executes. But routing branch 1 put it in CLAUDE.md deliberately: the
auto-loaded surface is the only one guaranteed to be read before anything happens, and a
merge step missed because a read trigger was skipped fails expensively.

## Question

Extract the protocol to `.claude/references/` — the natural sibling of `pipelines.md` — while
keeping the guarantee trade honest.

## Answer

Shaped, per the ruling:

- A new reference pair under `.claude/references/` holds the protocol; CLAUDE.md keeps a
  pointer and whatever minimal predicate a merge cannot safely start without.
- Every "CLAUDE.md's merge protocol is the source of truth" citation repoints **in the same
  slice** — `hardener.md`, `orchestration.md`, `pipelines.md`, the mutation-testing articles,
  and any the slice's own sweep finds beyond those.
- Routing branch 1's rationale gets restated rather than silently contradicted: the branch
  says seat procedures go to CLAUDE.md _because_ it is auto-loaded, so the branch text itself
  must carry the new exception or the next routing decision re-derives the old answer.

## No-gos

- No change to the protocol's content — this is a move, and a move-plus-rewrite is the
  delete-plus-add the board's own history rules warn about.

## Open questions

- What stays in CLAUDE.md as the cannot-miss minimum — the serial-landing rule, the
  step-3/step-5 gate mandates, or a bare pointer?
- The instruction/evidence split: does the protocol's clause-level reasoning (the invariant
  exemption's argument) go to the new file's `.meta.md` sidecar on the way through, or move
  verbatim first and split later?
- `agent-doc-check` and `reference-check` both scan CLAUDE.md and `.claude/**` — verify
  nothing keys on the protocol living in CLAUDE.md specifically (the merge-step ordinals are
  cited by number in several files).
