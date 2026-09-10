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

**Two more shapes, both from `cleaner.md`, and the first is the worst of the set because a gate is
green over it.** Replacing a whole line inside an ordered list dedented its continuations from three
spaces to column 0. The list silently split in two: the step ended early, its remaining content
became loose top-level prose, and the next numbered item opened a fresh list. **`npm run
format:check` stayed green** — Prettier normalises the break as intentional — so nothing in the repo
could ever have caught it.

The second: a cross-reference restored by the obligation-word check pointed at an anchor that the
same pass had removed. **A word-count check verifies tokens, not referents.** Restoring a citation
is not finished until its target is confirmed to still exist.

**And two ways of measuring the pass were themselves wrong.** A baseline recalled rather than
measured pre-edit read 92 mechanical where the real figure was 101 — the second occurrence of that
exact defect in this repo, which already carries a commit titled _"correct the Vale baseline, which
was itself measured mid-pass"_.

## Question

What should a reader do differently, given that none of this is machine-checkable?

## Answer

Four additions to `prose-linting.md`, with the incidents behind them in
`prose-linting.rationale.md` per CLAUDE.md branch 5.

**0. The obligation-word count has a measured blind spot, and it must be stated with the rule.**
Splitting `X and Y` into `X. Y.` can turn a _conjunct_ into a standalone claim, so sentence one now
asserts a sufficiency that was never true. On `coder.md`, "your job is done once the wiring exists
**and** the layer is green" became "your job is done once the wiring exists." — and the count
**missed it, because `must` went up, not down.** Splitting a condition adds obligation words while
weakening the condition. So the count is a screen, not a proof: read every split of a sentence that
states when something is finished, permitted or sufficient.

**1. Check the direction of what a split dropped, not just its presence.** The cheap mechanical
form, which earned its place: count obligation-bearing words across the pair against the pre-edit
file — `must`, `never`, `always`, `only`, `before`, `rather than` — and account for every decrease.
On `cleaner.md` that found a silently dropped `from step 3(a)` cross-reference that reading had
passed. The word list is not exhaustive and should say so.

**Better still, drop the word list.** A full tokenize-and-frequency diff of the whole file against
its pre-edit copy is strictly broader and costs the same. It is what found the lost `because` on
`orchestration.md`, where a fixed list would have had to guess that word in advance. Every non-zero
delta then gets accounted for, as a sentence split, a deliberate edit, or a defect. A word list is
the fallback when the file is too large to diff whole.

**Extend a list, if you use one, with causal connectives** — `because`, `since`, `so`. On `coder.md` `because` went 3 → 0
and only that extension surfaced it. Measured across the four landed role files, sixteen connectives
were dropped; on inspection all sixteen survived as adjacency, which preserves the relation. The
check earns its place by making that a finding you clear rather than a question nobody asked.

**2. Measure the baseline on the pre-edit file, in scope, before the first edit.** Twice is a rule.

**3. Two more ways to report a confident zero, added to the three the article lists.**

- A file **outside every `.vale.ini` section glob** reports 0 findings and exit 0 with no styles
  applied. A scratch copy of a role file at the repo root is the case a reviewer hits first.
- A fresh worktree has no `.vale/` directory, since it is gitignored and `npm ci` does not create
  it. Vale then exits **1** with a path error, which a `grep -c` pipeline converts into "0".

**4. Check list structure after any line-replacement edit, because `format:check` will not.** Count
ordered-list restarts (`^ *1\. `) and indented continuations before and after. A count that moves
means a list split. This is the only defect in the set that a command can detect outright, and the
only one a green gate actively hides.

**5. A restored reference is not restored until its anchor is confirmed.** The token check and the
referent check are different checks.

**6. `that's` must never go through a mechanical contraction sweep.** It expands to _that is_ or
_that has_ by context. An automated sweep wrote "that is already been done" into `architect.md`.
On `cleaner.md` four of five instances were _that is_ and the fifth was _that has_ — which is
exactly why a sweep looks safe. **And a bare possessive needs its own exempt class, which the article does not currently have.**
`Contractions` is an `existence` rule whose possessive token ends `(?!\s)`. So a possessive followed
by **punctuation** fires and one followed by a **space** does not — measured against
`.vale/STE/Contractions.yml`. "the cleaner's, architect's, and hardener's gates" produced two
findings from three possessives. This also refutes a plausible-looking mechanism recorded during the
rollout: the landed role files did not reach zero because their possessives are backticked, but
because they are followed by spaces.

**7. A lint pass introduces prompt findings as well as clearing them, so compare residuals to a
pre-edit baseline.** Splitting one sentence multiplies be-verb sites, and adding two words to a
bullet can push it past `ProcedureLength`'s 20-word proxy. On `orchestration.md` the pass fixed one
`PassiveVoice` and created one, and created a `ProcedureLength` finding outright — both recorded as
residuals rather than as self-inflicted, which is the reporting defect. Name what the pass added.

**8. `PassiveVoice` has a third exempt class the article does not list: a verbatim quotation.**
Splitting a sentence can isolate a quoted section title, which the matcher then sees as prose.

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
- **The article and the practice have diverged, and one of them should move.** `prose-linting.md`
  says act on a genuine step. The landed role files now carry 6, 34 and 20 findings recorded-as-
  act-on-shape but not acted on, each time because the remedy separates a step's reasoning from the
  step it qualifies. Three files agreeing is a convention forming by accident. Either amend the
  remedy or act on the files; a standing unilateral divergence inside role files is the worst option.
- **Does `ProcedureLength` need its own entry?** Across five files I exempted it heavily, and two
  reviews found the blanket argument overclaimed — on `product.md` for 11 of 24 findings. The
  article's actionable condition may be right while the way it gets applied is not.
