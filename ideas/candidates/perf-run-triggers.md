---
name: perf-run-triggers
title: Let a role recognise when a change is perf-relevant instead of running the harness on a schedule
created: 2026-08-23
---

## Context

`npm run test:perf` belongs to no role. It is in neither of `product`'s modes and
not in `hardener`'s seven-stage sequence, so it falls between roles and the
orchestrating session has been running it by hand. `product` surfaced this
during `aria-pressed-cell-state`'s SPECIFY pass, correctly, as a gate with no
owner.

The obvious fix — add it to `hardener` — was **considered and rejected by the
user**, and the reason is the useful part: the goal is for render performance to
be _largely guaranteed by the architecture_, not re-measured on every slice.
Tiling, the world-anchored tile keys, and the eviction hysteresis exist so that
the frame cost of a pan is structurally bounded rather than empirically
monitored. A harness stage that runs on every slice would mostly re-confirm a
property the design already holds, at ~5 minutes a slice, and would quietly
recast an architectural guarantee as a test result.

But "no owner" is also wrong. `aria-pressed-cell-state` is the case in point: it
flipped one attribute per cell across up to 19,680 mounted buttons, which is
exactly the shape of change that _could_ have cost something. It didn't —
`RecalcStyleCount` came back byte-identical because `aria-pressed` participates
in no CSS selector — but that was established by measuring, not by reasoning.

## Sketch

Give a role the ability to **recognise perf relevance and say so**, without
giving it the duty to measure on a schedule. Roughly:

1. A short, testable list of what makes a change perf-relevant — touches a
   component that renders per-cell, changes the mounted-set policy, adds a
   per-cell DOM attribute or style, changes anything in the transform path, or
   moves work into render from an effect.
2. The role that notices raises it as a **recommendation in its handoff**, the
   way `coder` already reports per-file test duration as a design signal, rather
   than running a five-minute harness itself.
3. The orchestrator decides and runs it, keeping today's ownership.

`architect` is the natural home. It already reasons about the mounted set and
the transform path, already reads Halstead as an advisory signal, and in DESIGN
mode is looking at a change before it exists — which is when a perf
recommendation is worth most.

## Touches

`.claude/agents/architect.md` (a short "perf relevance" section), possibly
`CLAUDE.md`'s merge protocol to record that perf runs are orchestrator-owned —
which is currently written down nowhere, and is why the gap was findable at all.

## Open questions

- **Is a checklist better than judgment here?** A list of triggers is auditable
  but goes stale as the render architecture changes; judgment doesn't go stale
  but isn't reproducible. The repo's own precedent leans toward written triggers
  (the design-pass trigger list, `gherkin-ast-mutation`'s two triggers), which
  argues for a list.
- **What counts as evidence that the architecture guarantees a property?** The
  strong version of the user's goal is that a structural invariant replaces a
  measurement — e.g. `cellTiles.ts`'s hysteresis bounding rebuilds per boundary
  crossing. Some of those are already pinned by property tests. Working out
  which perf properties are _provable_ rather than _measurable_ is the real
  content here, and may be a bigger idea than the routing question.
- Does this want a cheap always-on signal — mounted-cell count, node churn per
  move — that a unit or property test can assert, leaving the full harness for
  when that signal moves? That would be closest to "guaranteed by the
  architecture".
