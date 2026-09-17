---
name: revise-the-pipelines-reference
title: Revise pipelines.md per the user's feedback — spike sub-pipeline, mode-bearing cycles, the defect loop, required Enabler design
created: 2026-09-17
---

Child of `act-on-the-pipelines-feedback`, the feedback index. Each change below is the user's
2026-09-17 ruling; the index carries the original items.

## Situation

`.claude/references/pipelines.md` landed 2026-09-16. The user's review found four ways its
Story and Enabler sections misstate the actual process, each cited to its spot in the file.

## Complication

- The acceptance spike sits inline in the Story section, reading as an unconditional part of
  every story's SPECIFY rather than the optional sub-pipeline it is.
- The cycle strings are role rosters: no agent modes, no optionality markers.
- The Story flow diagram draws a straight line from VERIFY to merge — the batched defect
  report to `architect` ADJUDICATE, the disposition paths, and the `hardener` re-invocation
  exist only as a handoff-cell clause.
- The Enabler pipeline has no pre-implementation gate: its DESIGN pass is trigger-conditional,
  where a Story at least has the spike and sign-off.

## Question

Execute the four ruled revisions, with `prose-lint` run over every edited surface as an
explicit step.

## Answer (ruled, user 2026-09-17)

1. **The acceptance spike becomes a separated, explicitly optional sub-pipeline of Story** —
   its own subsection or diagram, entered from SPECIFY, not inline SPECIFY content.
2. **Cycle strings carry agent modes and optionality** — `product (SPECIFY)` rather than bare
   `product`, optional steps marked. The fork to resolve in-slice: `agent-doc-check`'s check 4
   pins the canonical cycle string byte-identical and builds it from the existing roles, so
   the mode-bearing form either changes that check (a `scripts/` code surface with its own
   tests and gates) or lives alongside the canonical string.
3. **The VERIFY → ADJUDICATE defect loop is drawn and stated in the Story pipeline** — the
   batched report, the three disposition paths, the `hardener` re-invocation on a `src/` fix,
   the seat's two-round-trip budget.
4. **The Enabler design pass becomes required** — its only pre-implementation gate. The
   Enabler diagram loses the "design pass?" branch, the step table's row-2 condition splits by
   kind, and CLAUDE.md's "The optional architect design pass" heading and seat-decides framing
   take a per-kind qualification. Story keeps the conditional pass.

Run `npm run prose-lint` over every edited surface, as a listed step rather than a remembered
habit, and the diagram-table consistency stays by hand per the reference's sidecar.

## No-gos

- No change to the citation-only gates rule or the ownership principle — this revises what the
  reference says, not what it is allowed to say.
- The merge-protocol extraction is its sibling `extract-the-merge-protocol`, not this slice.

## Open questions

- Which side of the check-4 fork item 2 takes, and what it costs — the check's code change
  runs the `scripts/` gate suite; the parallel-string form risks the drift check 4 exists to
  stop.
- Whether the spike sub-pipeline gets its own Mermaid block or a marked region of Story's.
