---
name: lint-pass-regressions-are-directional
title: Record in prose-linting.md how a Vale pass silently damages the file it cleans
created: 2026-09-09
---

## Situation

`prose-linting.md` describes how to read a finding and which rules are mechanical. It says nothing
about how the **pass itself** goes wrong.

The role-file rollout ran the same method over five files in one session, each with an independent
`architect` review. Every review found something the pass had broken, and the same shapes recurred.
None of them is caught by a checker, by `agent-doc-check`, or by re-running Vale.

## Complication

**The defects are not random, and one of them is directional.** On `architect.md` the review found
four meaning regressions and **all four softened an obligation the role carries** — a consequence
clause dropped, a measurement dropped from a measure-do-not-reason rule, a "check that…" demoted to
an assertion, and the action a piece of corroborating evidence licenses. Each looked like a
plausible shortening on its own. Four out of four is a pattern.

That direction is the dangerous one: a lint pass that quietly relaxes the rules a gate-running role
follows, in a file nothing tests.

**Three more shapes recurred, each measured rather than supposed:**

- **A read trigger moved out as if it were evidence.** On `hardener.md`, "read it if you are asked
  to grant an exemption for a path you have not seen exempted before" went to the sidecar. A
  sidecar is never a read trigger's home, and nothing else covered it.
- **A silent promotion.** On `product.md` a comma-separated enumeration became "in this order",
  asserting a sequence nobody had argued.
- **A definition widened by splitting off its restrictive clause.** Also `product.md`: splitting a
  long sentence detached the "because no accessible affordance exists" condition, so the definition
  came to cover any assertion made for any reason.

**And two ways of measuring the pass were themselves wrong.** A baseline recalled rather than
measured pre-edit read 92 mechanical where the real figure was 101 — the second occurrence of that
exact defect in this repo, which already carries a commit titled _"correct the Vale baseline, which
was itself measured mid-pass"_.

## Question

What should a reader do differently, given that none of this is machine-checkable?

## Answer

Four additions to `prose-linting.md`, with the incidents behind them in
`prose-linting.rationale.md` per CLAUDE.md branch 5.

**1. Check the direction of what a split dropped, not just its presence.** The cheap mechanical
form, which earned its place: count obligation-bearing words across the pair against the pre-edit
file — `must`, `never`, `always`, `only`, `before`, `rather than` — and account for every decrease.
On `cleaner.md` that found a silently dropped `from step 3(a)` cross-reference that reading had
passed. The word list is not exhaustive and should say so.

**2. Measure the baseline on the pre-edit file, in scope, before the first edit.** Twice is a rule.

**3. Two more ways to report a confident zero, added to the three the article lists.**

- A file **outside every `.vale.ini` section glob** reports 0 findings and exit 0 with no styles
  applied. A scratch copy of a role file at the repo root is the case a reviewer hits first.
- A fresh worktree has no `.vale/` directory, since it is gitignored and `npm ci` does not create
  it. Vale then exits **1** with a path error, which a `grep -c` pipeline converts into "0".

**4. `that's` must never go through a mechanical contraction sweep.** It expands to _that is_ or
_that has_ by context. An automated sweep wrote "that is already been done" into `architect.md`.
On `cleaner.md` four of five instances were _that is_ and the fifth was _that has_ — which is
exactly why a sweep looks safe. Note the sibling finding while there: Vale fires `Contractions` on a
**bare** possessive (`cleaner's`) and not on a backticked one (`` `cleaner` ``'s), so a finding on a
role name is a formatting fix, not a contraction.

## Touches

- `.claude/agents/articles/prose-linting.md` — the four rules
- `.claude/agents/articles/prose-linting.rationale.md` — the incidents, with the files and figures
- No role file, no `CLAUDE.md`, no `src/`. Documentation-only, so no mutant is reachable.

## Open questions

- **Is the obligation-word count worth mechanising?** It is a `git show main:<file>` plus a word
  count, and it found a real defect. A `scripts/` program would owe CRAP ≤ 6, its own vitest suite,
  `dry4ts` and mutation testing — likely more machinery than the check is worth, but the check is
  cheap enough that a documented one-liner may be the right form.
- **Should the direction check apply to any prose edit, or only to a lint pass?** The four
  regressions came from sentence-splitting, but nothing about the failure is specific to Vale.
- **Does `ProcedureLength` need its own entry?** Across five files I exempted it heavily, and two
  reviews found the blanket argument overclaimed — on `product.md` for 11 of 24 findings. The
  article's actionable condition may be right while the way it gets applied is not.
