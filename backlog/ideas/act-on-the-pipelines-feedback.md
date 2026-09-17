---
name: act-on-the-pipelines-feedback
title: "Index: the user's pipelines-reference feedback, split into children"
created: 2026-09-17
---

**This file is an index, not work** — the slice check's second exemption in
`.claude/references/definition-of-ready.md`. It collected the user's eight feedback items on
`.claude/references/pipelines.md`, one at a time on 2026-09-17, and was ruled an **Epic** by
that day's `/idea-assess` run (S=1: two slices' work bundled with no execution ordering). The
original item-by-item record lives in this file's git history at the split commit's parent.

## The children

| #   | Child                                                                                                     | Carries                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Landed** — `slice/revise-the-pipelines-reference`, 2026-09-17; folder awaiting retrospective in `done/` | Items 1, 2, 3, 6 — the spike as an optional Story sub-pipeline, mode-bearing cycle strings (the check-4 fork resolved in-slice), the VERIFY→ADJUDICATE loop drawn, the required Enabler design pass — with item 8's `prose-lint` step listed.            |
| 2   | `backlog/ready/extract-the-merge-protocol/proposal.md` (promoted 2026-09-17)                              | Item 4 — the merge protocol out of CLAUDE.md into `.claude/references/`, every source-of-truth citation repointed in the same slice, routing branch 1's rationale restated.                                                                              |
| 3   | `backlog/ideas/role-files-assume-the-story-pipeline.md`                                                   | Item 5 — already split out at collection time: the Story-assumption audit of the five role files, with the kind-neutral wording and coder-modes answer shapes.                                                                                           |
| 4   | `backlog/ideas/epics-get-a-lane-and-a-pipeline.md`                                                        | Item 7 — already split out at collection time: the `backlog/epics/` lane and the Epic pipeline, superseding the no-folder ruling.                                                                                                                        |
| 5   | `backlog/ideas/split-enablers-and-staff-the-process-pipeline.md`                                          | Interjected 2026-09-17 after a shaping conversation: the enabler-technical / enabler-process sub-kind split, the coach/writer/editor role family with user-gated governance, the check-4 cycle-declarations config, and the config-invariance principle. |

## Open questions

- Child 1 leaves one forward dependency on child 4: `pipelines.md`'s Epic section keeps its
  "no pipeline" sentence until `epics-get-a-lane-and-a-pipeline` lands, whichever order they
  run in.
- Item 8 (run `prose-lint` over every edited surface) binds every child, not only child 1 —
  each child's file says so or inherits the standing `.claude/**` trigger.
