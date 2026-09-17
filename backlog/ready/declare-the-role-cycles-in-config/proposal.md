---
name: declare-the-role-cycles-in-config
title: Move check 4's single-canonical-cycle assumption into a cycle-declarations config the checker imports
created: 2026-09-17
---

Child of `split-enablers-and-staff-the-process-pipeline`, the process-pipeline index, itself a
child of the `act-on-the-pipelines-feedback` epic. An `enabler-technical` by that index's own
discriminator — the deliverable is checker code plus its config. Ruled by the user 2026-09-17;
sequencing ahead of its process sibling is the index's own suggestion, so the new role docs
never need the decorated-chain interim.

## Situation

`agent-doc-check`'s check 4 derives its role vocabulary from whatever `.claude/agents/*.md`
files exist and requires every bare cycle-shaped string to be byte-identical to one canonical
form. The single-canonical-cycle assumption is implicit: nothing declares which cycles are
legitimate. The 2026-09-17 `revise-the-pipelines-reference` slice already had to exempt
mode-bearing chains because decorated sequences collided with it.

## Complication

The process pipeline's staffing (the sibling child) adds `coach`, `writer`, and `editor`
agent files. The day they land, the derived vocabulary widens itself, and a bare
`coach → writer → editor → coach` chain becomes cycle-shaped and reds against the Story
canonical. Editing the checker script is not `writer`-legal, so without this child every
future vocabulary change is a `scripts/` slice.

## Question

Declare the canonical cycles in a config the checker imports, verified per cycle, so an
enabler-process slice updates config rather than code.

## Answer (ruled, user 2026-09-17)

- A config file declares the canonical chain per pipeline; `agent-doc-check` imports it and
  verifies each declared cycle's occurrences byte-identical against its own form. The role
  roster stays derived from the agent files.
- The config joins the mutation-invariance **allowlist**, with the user's config-invariance
  principle as its argument: a change to a real-world config a checker script reads is always
  mutation-invariant — the mutation testing on the checker scripts themselves is what makes
  the implementation behave correctly regardless of runtime input. Scope note carried
  honestly: the predicate quantifies over the `src/` run per the config's own `scope` field,
  where the principle holds trivially; the `absent`-list entries stay absent for their own
  self-exemption reason, which the principle does not dissolve.
- The checker change runs the full `scripts/` freight: its own tests, CRAP, DRY, the scripts
  mutation gate.

## No-gos

- No change to the decorated-chain exemption — mode-bearing sequences stay exempt; this child
  governs bare chains.
- No hand-maintained role roster — derivation from the agent files stays.

## Open questions

- Config shape and home: JSON beside `mutation-invariance.config.json` at the root, or under
  `.claude/`? The allowlist argument differs by path, and `writer`-legality wants it outside
  `scripts/`.
- Does the inertness guard generalize — what does check 4 report when the config declares a
  cycle whose roles no longer all exist, or declares nothing?
- Whether the current canonical string stays constructed most-common-form or becomes the
  config's declared form outright — the second makes the config load-bearing and the drift
  check sharper.
