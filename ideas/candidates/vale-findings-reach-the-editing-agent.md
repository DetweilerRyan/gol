---
name: vale-findings-reach-the-editing-agent
title: Hook Vale onto instruction-surface edits, and route findings into the fix procedure
created: 2026-09-15
---

## Situation

Child 3 of `claim-discipline-remedies.md`. Vale rules exist per surface and report through
`npm run prose-lint` on demand; a `PostToolUse` hook already runs the board's Layer 1 shell
check on `ideas/**` writes. `post-write-quality-hooks.md` is the standing sibling for the
TypeScript half, with the measured timings and the rewrite-desync warning.

## Complication

An agent editing an instruction file gets no signal at write time — findings surface only when
someone runs the linter, and holding the 158-finding baseline is manual discipline. Whichever
agent performs the edit, subagents included, never loads the fix procedure on its own.

## Question

How do a file's own Vale findings reach the agent that just edited it, at write time, and route
into the fix procedure — regardless of which agent made the edit?

## Answer

Shaped, not specified. A `PostToolUse` hook on Write and Edit over the instruction surfaces
runs Vale on the edited file with the repo config. On findings, the hook's output names them
and directs the acting agent to load the claim-audit skill (child 1) and fix before proceeding.
Advisory by the event's own mechanics — `PostToolUse` cannot block. A missing Vale binary is
reported loudly as not-run, never read as clean; the probe discipline `prose-lint` carries is
the model.

## No-gos

- No blocking and no gating. The hook reports; the standing advisory rulings hold.
- No rewriting by the hook — the rewrite-desync hazard `post-write-quality-hooks.md` records.
- Not the TypeScript half; that stays with its own candidate.

## Open questions

- **The legacy-findings problem, and it is the design's hard part.** Editing a file that
  carries pre-existing findings — CLAUDE.md holds 19 — would fire all of them on every touch,
  and a signal nobody can clear trains skimming. Diff-aware reporting, a baseline file, or
  scoping to zero-baseline surfaces are the candidate shapes; one must be chosen.
- Does a settings-level hook fire for a subagent's Write and Edit? Verify by running, not by
  reasoning — the fresh-session hook test is still pending for the Layer 1 hook too.
- Per-file Vale cost at write time — measure before enabling on every edit.
- Ordering: the findings half works today against the existing styles; the route-to-skill half
  waits on child 1. Does this land once after child 1, or findings-only first?
