---
name: mechanise-the-prose-direction-check
title: Decide whether the token-frequency diff should be a command, and how far the direction check reaches
created: 2026-09-10
---

## Situation

`prose-linting.md` now carries "How a pass damages the file it cleans", six rules derived from six
files linted in one session, each with an independent review that found a defect the pass had
introduced.

Two of those rules rest on a **manual** step. Rule 2 says to take a full tokenize-and-frequency diff
of the file against its pre-edit copy and account for every non-zero delta. Rule 4 says to count
`^ *1\. ` restarts and indented continuations before and after, because `npm run format:check` is
green over a list a whole-line replacement has split in two.

Both are shell one-liners. Neither is written down as a command anywhere, and neither runs unless a
person remembers to run it.

## Complication

**Rule 4 is the only defect in the set a command can detect outright, and the only one a passing gate
actively hides.** That combination is unusual and argues for mechanising it rather than trusting
recall. Rule 2 found a lost `because` that a fixed word list would have had to name in advance.

**But the cost of mechanising is not the script, it is the gate freight.** A `scripts/<program>/`
checker owes CRAP ≤ 6, its own vitest suite, `dry4ts:scripts`, and mutation testing, and becomes
permanent maintenance. `orchestration.md` already tells this seat to search for an existing tool
before building one.

**And the check does not fit the shape of a gate.** It compares a file against **its own pre-edit
copy**, which is a diff against an arbitrary base rather than a property of the tree. A gate that
needs to be told what to compare against is a different kind of object from `reference-check` or
`agent-doc-check`.

## Question

Should either check become a command, and does the direction check reach beyond a lint pass?

## Answer

Two decisions, and the second may make the first cheaper.

**1. The form, not the fact.** The options are a documented one-liner in `prose-linting.md`, a
`scripts/` program paying full freight, or a git alias or hook. A documented one-liner may be the
honest answer for rule 2, since the reader has to interpret every delta anyway. Rule 4 is a pure
count with a yes-or-no answer and is the stronger candidate for a real check.

**2. How far the direction check reaches.** The six rules are framed around a Vale pass, but nothing
about the failures is specific to Vale. Splitting `X and Y` into `X. Y.` asserts a false sufficiency
whoever does it and for whatever reason. If the rules generalise to any prose edit, they belong
somewhere every role reads rather than in the article about the linter — and that is a routing
decision under CLAUDE.md branch 3, not a wording change.

## Touches

- `.claude/agents/articles/prose-linting.md`, and its `.rationale.md` if a measurement lands
- possibly `.claude/agents/articles/engineering.md`, if decision 2 says the rules generalise
- possibly a new `scripts/` program, which is the expensive branch
- Documentation-only unless a checker is built.

## Open questions

- **Is there an off-the-shelf tool?** Prose-diff and readability tools exist; none obviously does
  "account for every token-frequency delta against a base revision". Search before building, per
  `orchestration.md`.
- **Would a rule-4 check have a false-positive rate worth paying?** A deliberate new list moves the
  restart count too. On the `CLAUDE.md` pass, restarts went 3 → 4 and every one was intentional, so
  the check reports a question rather than a defect.
- **Does rule 3 have a mechanical form at all?** The split-conjunct blind spot is the least
  mechanisable of the six, since detecting it means knowing that a sentence states a sufficiency
  condition.
- **Is `ProcedureLength`'s actionable condition right while its application is wrong?** Six linted
  files now hold findings recorded as act-on shape but not acted on, each time because the remedy
  separates a step's reasoning from the step it qualifies. `prose-linting.md` records that
  disagreement as open, so **do not re-file the divergence itself** — one open question, one home.
  What is unrecorded is the narrower question: whether "act only on a genuine step" is the wrong
  test, or the right test applied badly.
