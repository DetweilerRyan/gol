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

## Three more instances, from `lint-jsdoc-with-vale` and the slice that recorded it

All three were orchestrator-authored and all three reached a permanent file. **They differ in what
caught them, and that difference is the argument.** Two were caught by a gate, which is the system
working late rather than not working. One was caught by accident.

**A ratified ruling was contradicted and its negation written into three files.** The slice's own
design pass had ruled that Vale scope is decided **per rule, not per slice**, and that ruling lived
only in the slice's candidate file. The orchestrating session did not read it, widened all four rules
uniformly, and wrote the opposite rule into `prose-linting.md`, `architect.md` and `.vale.ini`. The
candidate was scheduled for deletion at landing, so the negation would have survived alone. `architect`
caught it only because the orchestrator later mentioned the file in an unrelated question.

**A checker reproduced the defect it was written to prevent.** `scripts/prose-lint/run.sh` exists to
make a Vale run that **cannot lint** fail loudly instead of reporting a clean zero. Its first version
discarded `xargs`'s exit status, so a run that could not lint printed its error and still closed with
`A zero above is a measured zero`, exit 0 — the second entry on the confident-zero list the script
was written against. `hardener` found it at the gate.

**A predicate written to gate a role's invocation failed open.** The slice recording the two above
added a test for when `product` VERIFY may be skipped: check three inputs, and "all three empty means
a black-box pass has nothing to see." That is a **blocklist** stated as sufficiency, the direction
CLAUDE.md rules against for the mutation predicate and for the same reason. `hardener` found two
tracked counterexamples escaping all three inputs — `index.html` moves the UI with no `src/` diff, and
`features/screenplay/*.ts` moves what VERIFY itself observes. Caught at the gate, in the commit that
documented the first two instances.

**What all three have in common** is the argument for this candidate. Neither is a typo or a style lapse,
so a lint pass would not have caught either. Each is a claim that is wrong, written confidently, by the
one participant whose output nothing reviews before `hardener`.

**Two of the three argue for a reviewer more strongly than `hardener` being the catch suggests.** The
ratified-ruling contradiction `hardener` would not have caught at all: the file was consistent with
itself, and only a reader holding the prior ruling could see it. The fail-open predicate was caught,
but only because a role was invoked on a two-file documentation diff — which the same slice's own
reasoning about not running gates that cannot move would have argued against.

## Open questions

- **Is this a documentation problem or an orchestrator problem?** Every entry above was written by the
  orchestrating session, which is also the only participant with no role file, no checklist, and no
  reviewer. The fix might belong to that seat rather than to the artifact type.
- Does `agent-doc-check` growing a claim-checking check make its `decide()` too large for CRAP ≤ 6, and
  is a sixth `scripts/` program the honest alternative?
- The accessible-name list in CLAUDE.md is now labelled a snapshot rather than a universal. Is that the
  general answer — prose states its own uncheckedness — or an admission that should have been a checker?
