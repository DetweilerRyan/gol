---
name: staff-the-enabler-process-pipeline
title: Split the enabler kind and staff the process pipeline with coach, writer, and editor
created: 2026-09-17
---

Child of `split-enablers-and-staff-the-process-pipeline`, the process-pipeline index, itself a
child of the `act-on-the-pipelines-feedback` epic. The process-staffing proper; every decision
is the user's dated 2026-09-17 ruling. **Lands after `declare-the-role-cycles-in-config`** by
the index's suggested sequencing — otherwise the new role docs must carry no bare cycle chain
and lean on the decorated-chain interim.

## Situation

The Enabler pipeline's implementing roles cannot write the surfaces most enablers change.
Measured across the four enablers run 2026-09-16/17: roles took only the `scripts/` share;
the seat executed every article, reference, role-file, and CLAUDE.md edit, with prose-audit
forks as its only reviewer — run only when the seat remembered.
`backlog/ideas/orchestrator-prose-has-no-reviewer.md` filed the gap first; this absorbs it.

## Complication

The 2026-09-11 no-role-edits rule, written against roles unilaterally correcting governing
files, also forbids the ruled, user-approved edits every process enabler actually is — so the
executor of process change is the one seat with no reviewer, and the pipeline's own section
admits a documentation enabler is "mostly seat-executed".

## Question

Split the enabler kind and staff the process side, so process change gets the same
author/review/gate structure the technical side has.

## Answer (ruled, user 2026-09-17)

- **Sub-kind split**: `kind: enabler-technical | enabler-process`, inside checker-bearing.
  Discriminator: does the diff land in the tree the gates measure (`src/`, `scripts/`,
  configs, `rules/`), or in the instructions that run the gates (`.claude/**`, CLAUDE.md,
  `references/`, `adr/`, the board docs)? The technical pipeline keeps `coder` and `cleaner`
  unchanged. `definition-of-ready.md`'s kind check grows the second discriminator.
- **`coach`** — the product/architect-spirit head: an expert in translating product and
  software-development methodologies into agentic workflows, responsible for the repo's
  effectiveness toward the user's stated goals; specs process changes, assesses other roles'
  observations to identify impediments, and owns the process by which roles share process
  feedback (the retro intake — **reserved, not built here**). The Agile Alliance term; the
  definition site carries the disclaimer.
- **`writer`** — the coder-analog: executes edits to the process corpus on the coach's
  signed-off spec, never its own initiative; `prose.md` and `claim-discipline.md` are its
  craft rulebooks; lints exactly its own edits.
- **`editor`** — the cleaner-and-hardener-analog, both jobs in one role: manifest-scoped
  cleanup after each `writer` pass, plus the corpus-wide lint/audit. It formally absorbs the
  prose-audit discipline.
- **The pipeline**: coach (spec) → **user sign-off** → writer → editor → coach (final
  review), on the `product` SPECIFY precedent — governance changes gate to the user at the
  spec, and the closing review needs no second gate.
- **The no-role-edits rule is amended, not repealed**: "no role edits these files **on its
  own initiative**" — `writer` implements a ruled, user-signed spec handed as prompt content,
  the authority relationship `coder` has to `product`'s contract.
- **Architect keeps `vale-styles/` and `rules/`.** Coach recommends an `enabler-technical`
  for a new mechanical prose guard, and a **spike** when it is uncertain one is possible —
  recommendations cross pipelines as backlog items, never as direct edits.

## No-gos

- No retro pipeline — coach's file reserves the intake duty in one line; the existing role
  files' reserved lines come later.
- No change to the technical pipeline beyond the sub-kind label.
- No transfer of `vale-styles/` or `rules/` ownership.
- No checker or config change — that is the sibling child.

## Open questions

- Model and frontmatter for the three agent files — the slice decides; `agent-doc-check`
  covers them the day they land.
- What the seat retains once `writer` exists: emergency-only prose, reported to coach, or a
  narrower carve-out?
- Where the three role files' surfaces sit in `pipelines.md`'s revised Enabler sections, and
  whether `role-files-assume-the-story-pipeline` (the sibling audit under the feedback epic)
  should land together with this or after it — the kind-neutral wording it proposes now has a
  third pipeline to hold under.
