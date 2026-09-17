---
name: split-enablers-and-staff-the-process-pipeline
title: Split enablers into technical and process sub-kinds, and staff the process pipeline with coach, writer, and editor
created: 2026-09-17
---

Child of `act-on-the-pipelines-feedback`, the feedback epic, interjected by the user after a
shaping conversation on 2026-09-17. Every decision below is a dated user ruling from that
conversation; the open questions are what it deliberately left to the slice.

## Situation

The Enabler pipeline's implementing roles cannot write the surfaces most enablers change.
Measured across the four enablers run under the board on 2026-09-16 and 17: the roles took
only the `scripts/` share of the diffs, and the seat executed every article, reference, role
file, and CLAUDE.md edit itself — the pipeline's own section admits a documentation enabler is
"mostly seat-executed". Seat prose has no independent author/review split; the prose-audit
forks that stood in caught real findings on every file they read, and only ran because the
seat remembered to spawn them. `backlog/ideas/orchestrator-prose-has-no-reviewer.md` filed
the gap before the board redesign existed.

## Complication

One pipeline serves two different kinds of enabler. A technical enabler changes the machinery
the gates measure; a process enabler changes the instructions that run the gates — and the
2026-09-11 no-role-edits rule, written against roles unilaterally correcting governing files,
also forbids the ruled, user-approved edits that every process enabler actually is. The
executor of process change is the one seat with no reviewer.

## Question

Split the enabler kind and staff the process side, so process change gets the same
author/review/gate structure the technical side already has.

## Answer (ruled, user 2026-09-17)

- **Sub-kind split**: `kind: enabler-technical | enabler-process`, inside checker-bearing —
  not a fourth top-level kind. The discriminator: does the diff land in the tree the gates
  measure (`src/`, `scripts/`, configs, `rules/`), or in the instructions that run the gates
  (`.claude/**`, CLAUDE.md, `references/`, `adr/`, the board docs)? The technical pipeline
  keeps `coder` and `cleaner` unchanged.
- **Three new roles, mirroring the technical family**:
  - **`coach`** — the product/architect-spirit head of the process pipeline: an expert in
    translating product and software-development methodologies into agentic workflows,
    responsible for the repo's effectiveness toward the user's stated goals. It specs process
    changes, consults and assesses other roles' observations to identify impediments, and
    owns the process by which roles share process feedback (the retro intake — reserved, not
    built here). "Coach" is the Agile Alliance's own term; the definition site carries the
    disclaimer per the glossary convention.
  - **`writer`** — the coder-analog: executes edits to the process corpus on the coach's
    signed-off spec, never its own initiative, with `prose.md` and `claim-discipline.md` as
    its craft rulebooks, and lints exactly its own edits.
  - **`editor`** — the cleaner-and-hardener-analog, **both jobs in one role**:
    manifest-scoped cleanup after each `writer` pass and the corpus-wide lint/audit
    (CLAUDE.md, references, agents, articles). It **formally absorbs the prose-audit
    discipline** the seat has been running as remembered forks.
- **The pipeline**: coach (spec) → **user sign-off** → writer → editor → coach (final
  review). The gate placement follows the `product` SPECIFY precedent exactly: a governance
  change proposed by coach is gated by the user before implementation; the closing review
  needs no second user gate, the way VERIFY closes on gate results.
- **The no-role-edits rule is amended, not repealed**: from "no role edits these files" to
  "no role edits these files on its own initiative" — `writer` implements a ruled,
  user-signed spec handed as prompt content, the same authority relationship `coder` has to
  `product`'s approved contract.
- **Architect keeps the mechanical guards of prose** (`vale-styles/`, `rules/`). Coach
  recommends an `enabler-technical` when a new mechanical guard is wanted, and recommends a
  **spike** when it is uncertain one is possible — recommendations cross pipelines as backlog
  items, never as direct edits.
- **Check 4 gets a cycle-declarations config.** The role roster stays derived from the agent
  files, but the single-canonical-cycle assumption becomes explicit: a config declares the
  canonical chain per pipeline, and the checker verifies each against its own occurrences.
  An enabler-process slice then updates config, never scripts — config edits are
  `writer`-legal; script edits are not.
- **The config-invariance principle, stated explicitly**: a change to a real-world config
  that a checker script reads is always mutation-invariant — the mutation testing on the
  checker scripts themselves is what makes the implementation behave correctly regardless of
  runtime input; that is the point of gating the scripts. The cycle-declarations config joins
  the **allowlist** with this principle as its argument. Scope note carried honestly: the
  predicate quantifies over the `src/` run per the config's own `scope` field, where the
  principle holds trivially; the existing `absent`-list entries stay absent for their own
  different reason (self-exemption prevention), which this principle does not dissolve.
- **Retro reservation**: the roles will also serve the future retro pipeline; `coach`'s file
  reserves the observation-intake duty, existing role files get one reserved line each later,
  and this slice stays scoped to the enabler-process pipeline.

## No-gos

- No retro pipeline built here — reserved only.
- No change to the technical enabler pipeline beyond the sub-kind label.
- No transfer of `vale-styles/` or `rules/` ownership.

## Open questions

- Model and frontmatter choices for the three new agent files — the slice decides;
  `agent-doc-check`'s frontmatter check covers them the day they land.
- The new-role docs must carry no bare role-cycle chain until the cycle-declarations config
  lands — the decorated-chain exemption is the interim escape; sequencing inside the slice
  decides whether the config lands first.
- Whether this is one slice or an epic of its own — the reach (three role files, the DoR kind
  check, `pipelines.md`, CLAUDE.md's conventions amendment, the check-4 config with its
  checker change, the allowlist entry) is wide, and the assessment should test the split.
- What the seat retains: composing invocations and merging stay; does any seat-authored prose
  remain legitimate once `writer` exists, or does the seat's residual become
  "emergency-only, reported to coach"?
