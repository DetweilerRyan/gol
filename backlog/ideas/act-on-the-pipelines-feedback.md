---
name: act-on-the-pipelines-feedback
title: Act on the user's feedback on the pipelines reference
created: 2026-09-17
---

## Situation

`.claude/references/pipelines.md` landed 2026-09-16 via `slice/pipeline-reference`. The user
reviewed it and gave feedback, collected here item by item on 2026-09-17.

## Complication

The feedback items, in the order given:

1. **Separate the acceptance spike out**, so it is clear it is an **optional sub-pipeline of
   Story** — today it sits inline in the Story section between the flow diagram and the step
   table, reading as an unconditional part of every story's SPECIFY rather than a sub-pipeline
   a story may run.
2. **Cycle strings include agent modes and optionality** — `product (SPECIFY)` rather than bare
   `product`, and optional steps (the DESIGN pass, the spike) marked as such, so a cycle string
   reads as the actual sequence rather than a role roster. Constraint to resolve in-slice:
   `agent-doc-check`'s check 4 pins the canonical cycle string byte-identical everywhere it
   appears and builds the expected form from the existing roles, so a mode-bearing form either
   changes that check or lives alongside the canonical string rather than replacing it.
3. **The VERIFY defect loop is clearly represented in the Story pipeline** — `product` VERIFY's
   batched defect report handing back to `architect` ADJUDICATE, and what follows it
   (disposition to a corrective fix, to `coder`, or back to SPECIFY as a spec finding; the
   `hardener` re-invocation when a fix touches `src/`; the seat's two-round-trip budget).
   Today the loop exists only as a clause in the step table's handoff cell and the escalation
   section; the Story flow diagram shows a straight line from VERIFY to merge with no
   adjudication path drawn.
4. **Separate the merge protocol out of CLAUDE.md into its own reference file** — the natural
   sibling of `pipelines.md` under `.claude/references/`, since its consumers are the same
   seat plus the pipelines' exit sections. Constraints to resolve in-slice: CLAUDE.md's
   routing branch 1 puts seat procedures in CLAUDE.md _because_ it is the only auto-loaded
   surface, so the move trades that guarantee for a read trigger and CLAUDE.md keeps a pointer;
   and "CLAUDE.md's merge protocol is the source of truth" is cited by name from `hardener.md`,
   `orchestration.md`, `pipelines.md`, and the mutation-testing articles — every citation
   repoints in the same slice.
5. **The role files assume the Story pipeline is the only way they execute** — audited
   2026-09-17 on the user's instruction, findings deliberately not acted on and collected in
   their own candidate, `role-files-assume-the-story-pipeline`, which this item only routes to.
6. **The design pass is required in the Enabler pipeline** — ruled by the user 2026-09-17,
   replacing the trigger-conditional `architect` DESIGN the Enabler section carries today. The
   fit: an Enabler has no `product` SPECIFY, so without a design pass nothing ratifies the work
   before implementation — the DESIGN pass is the Enabler's only pre-implementation gate, where
   a Story has the acceptance spike and sign-off. The Story pipeline keeps its
   trigger-conditional pass. In-slice consequences: the Enabler flow diagram loses its
   "design pass?" branch, the step table's row 2 condition splits by kind, and CLAUDE.md's
   "The optional architect design pass" heading and seat-decides framing need a per-kind
   qualification.
7. **Epics get a lane and a pipeline** — promotion into `backlog/epics/<name>/` and an Epic
   pipeline executing connected ready children. Routed to its own candidate,
   `epics-get-a-lane-and-a-pipeline`, at the user's direction; this item only routes there,
   and the pipelines-reference consequence it leaves behind is that the Epic section's
   "no pipeline" sentence goes stale when that candidate lands.
8. **Run `npm run prose-lint` over every surface the acting slice edits** — the user's closing
   instruction for this collection. The standing trigger already says an edit to `.claude/**`
   is what fires the run; this item makes it an explicit step of acting on items 1–7 rather
   than a habit to remember.

## Question

What does the reference need to change to act on each item?

## Open questions

- Which items are wording fixes and which change the reference's structure — split when the
  collection is complete.
