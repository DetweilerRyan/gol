---
name: orchestrator-prose-has-no-reviewer
title: Give orchestrator-authored documentation a reviewer upstream of hardener
created: 2026-09-06
---

## Context

Raised by `hardener` at the end of `sentence-case-the-next-generation-button`, in its own words: **both
defects that gate found were in orchestrator-authored prose that no role reviewed before it**, and
that was the second consecutive run in which the same accessible-name bullet needed a reviewer.

The cycle assigns a reviewer to every kind of authored artifact except one:

| artifact                                    | author                              | reviewer upstream of `hardener`               |
| ------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| `features/**`                               | `product`                           | `architect` (CONTRACT), then `product` VERIFY |
| `src/**`                                    | `coder`                             | `cleaner`, then `architect` REVIEW            |
| `scripts/**`                                | any implementing role               | `cleaner`, `architect`                        |
| `rules/**`                                  | `architect`                         | `ast-grep:rules`, its own fixture             |
| **CLAUDE.md, `.claude/agents/articles/**`** | **often the orchestrating session** | **nobody**                                    |

`hardener` is the whole review. That is not a light gap, because documentation is where this repo puts
the reasoning nothing else can check: a false `.feature` step reds, a false comment does not.

## The measured record that motivates it

Within one run of five slices, orchestrator-authored prose shipped false claims **four** times, every
one caught downstream rather than by its author:

- `elementAtPoint` called a third helper casualty — refuted by `architect` with `git log -S`, which
  showed `rulerGroup` had already been collected by `triage-paired-specs`.
- A correction paraphrased into something materially wrong while summarising a slice for the user —
  caught by re-reading the source before publishing, and it would have argued for deleting a test
  that should stand.
- `Pattern Library` claimed as the app's one title-case name — refuted by `hardener` with
  `GenerationHud.tsx`, which also refuted the _rationale_, not merely the count.
- `Still Life` called a pattern name (it is a category) and playwright-core called 1.63.0 (it is
  1.62.1) — both refuted by `hardener`, in the rewrite of the bullet it had just blocked.

Note the fourth entry: the rewrite of a blocked claim introduced two new false claims. Whatever the
mechanism is, "be more careful next time" demonstrably is not it.

Note also the third and fourth were caught by a role explicitly _told_ to derive rather than read.
That instruction works — which is itself evidence, since it means the catch rate depends on the
orchestrator remembering to ask, and the orchestrator is the party whose work is being checked.

## Sketch

Options, none obviously right:

- **`architect` reviews docs it did not write**, as a mode or as part of REVIEW. It already owns four
  articles and is the only role that authors `rules/`. Against: it is often the doc's author, so this
  is self-review in exactly the cases it would matter most.
- **A standing instruction rather than a role**: any prose claim about the codebase carries the command
  that measured it, and a reviewer re-runs the command rather than re-reading the sentence. Cheap, and
  it matches what actually caught three of the four. Against: unenforceable, which is the same property
  that let the spec headers rot for months.
- **A checker in `scripts/`** for the mechanically checkable subset — an accessible name asserted in
  CLAUDE.md that no `src/` file ships, a version literal that disagrees with `package.json`. Narrow but
  real, and it fails safe. Against: subjects it to CRAP ≤ 6, its own vitest suite, `dry4ts`, mutation
  testing. Weigh against `agent-doc-check`, which already parses `.claude/**` and could grow a check.
- **Accept it and make the ask explicit**: keep `hardener` as the reviewer but require the invoking
  prompt to name every new factual claim for derivation. This is what happened by accident in the two
  slices that caught the most.

## Touches

`.claude/agents/architect.md` or `hardener.md`, `.claude/agents/articles/workflow.md`, possibly
`scripts/agent-doc-check/`, and CLAUDE.md's own routing test.

## Open questions

- **Is this a documentation problem or an orchestrator problem?** Every entry above was written by the
  orchestrating session, which is also the only participant with no role file, no checklist, and no
  reviewer. The fix might belong to that seat rather than to the artifact type.
- Does `agent-doc-check` growing a claim-checking check make its `decide()` too large for CRAP ≤ 6, and
  is a sixth `scripts/` program the honest alternative?
- The accessible-name list in CLAUDE.md is now labelled a snapshot rather than a universal. Is that the
  general answer — prose states its own uncheckedness — or an admission that should have been a checker?
