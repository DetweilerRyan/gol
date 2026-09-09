# Rationale: Engineering Rules

**Audience:** whoever is changing a rule in `engineering.md`. **Read when:** you are amending, narrowing or
overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file, and that is the point. `engineering.md` is written to be
actionable on its own; this file holds the evidence behind it, so that a rule can be argued with rather
than only obeyed. Everything below is history: what was measured, in which slice, by what method, and
which readings were later corrected. Several figures describe trees that no longer exist — **do not quote
a number forward from this file without re-deriving it.**

## The separate decision this split required

`ideas/candidates/roll-the-rationale-sidecar-out.md` ruled `engineering.md` out of the rollout queue
"without a separate decision", and named it as the one file that genuinely needed one. Two positions were
recorded there and left unreconciled:

- **Position A.** Splitting an unconditionally-read file moves argument out of the one place everyone
  sees. This is what protected four files, `engineering.md` among them.
- **Position B.** CLAUDE.md's own routing preamble argues the reverse — auto-loading is "a cost, not a
  distribution channel", and CLAUDE.md was itself shrunk on exactly that logic. On that reading the
  unconditionally-read files are the ones to split hardest.

**Ruled 2026-09-09 by the user, for Position B.** Two things carried the ruling. First, mandate 1
reconciles the positions rather than overriding one: a closed-decision marker keeps the settled **fact** in
the unconditionally-read file while the **argument** moves here, so Position A's concern is answered on its
own terms. Second, `engineering.md` was the only one of the four protected files whose protection actually
rested on the contested argument — `workflow.md` (1,486 rationale bytes) and `handoffs.md` (3,161) are
defended independently as too small to be worth a second file, and `orchestration.md` as 94% entangled and
therefore expensive rather than protected.

**What was not conceded.** Position A is not recorded here as wrong. The claim is narrower: the cost it
names is paid by the argument, not by the fact, and mandate 1 is the mechanism that separates them. A
future split that drops the markers would revive the objection in full.

## The claim-discipline rule: what it was measured on

### The natural experiment behind "an undated present-tense claim rots"

The natural experiment is on the record: the audit behind `slice/comment-reference-checks` measured this repo's dead-filename count going **17 to 19 during the JSDoc partition sweep** (measured 2026-09-07) — a sweep with a text-preserving partition commit, per-commit verification, hover budgets and an `architect` ratification. It caught none of them and created two.

### The predicted caller, which rots worse than a present-tense one

`gridGeometry.ts`'s `gridLinePhasePx` described `GridLines.tsx` as "this module's future caller", drawing the phase as a background "once dead cells no longer carry an element of their own to put a border on". That prose landed in `collapse-dead-cell-layer`'s step 1 and **its own step 2, the same day, made it false** — `GridLines.tsx` has imported and called the function ever since (verified by `git log -S`, not by blame), and the twenty-seven slices tagged after it — a whole JSDoc partition sweep among them — read past the sentence before `no-undated-cross-file-claims` caught it.

### Why either spelling of a slice name is fine

The bare slug is this repo's dominant idiom by an order of magnitude. Measured 2026-09-07 across
`.claude/**` and `CLAUDE.md`: ~120 distinct backticked slugs against 6 tag-form references. Mandating the tag form would have put the rule in conflict with its own codebase on the day it landed — the same failure the count-beside-enumeration clause below avoids.

### How far a grep falls short, measured on the sweep that first applied the rule

**How wide that gap is, measured on the sweep that first applied this rule.** `no-undated-cross-file-claims` swept the whole tree from a manifest built by regex, and two later passes each found more that the manifest had missed. `cleaner` found an undated whole-suite count, a stale test-count figure, a `<file>` line citation into a file whose structure had moved, and a stale _prediction_. `architect`'s REVIEW then found three untouched `909/909` counts byte-identical to one `cleaner` had just fixed, two more present-tense "the whole unfiltered suite stays green" rulings, a definite article standing in for a slice name ("the corrective", "the corrective tree"), and a "this slice" in `src/index.css` — which every prior pass had missed for the same reason: every prior pass was scoped to `.ts`/`.tsx`. Three roles, three passes, and each one still left instances of a class one of them had a literal string for. **State that as which rather than as how many** — the first draft of this very paragraph carried a tally, and the tally was wrong within the hour, because the pass writing it was still finding sites. That is the article's own count-beside-enumeration rule demonstrated on itself.
