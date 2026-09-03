---
name: cleaner-property-tests-and-layer-overlap
title: Keep the test suite necessary and sufficient — measure unit/property overlap and cut what is redundant
created: 2026-09-02
---

## Context

Raised in two parts. First: _"allow `cleaner` to write property tests, not just `architect` — primarily
so `cleaner` can kill mutants with property tests and not just unit tests."_ Then, widening it: _"find
and reduce duplicate coverage and mutation-killing overlap between unit and property tests — the suite
should stay **necessary and sufficient** without wasting CPU cycles on duplication."_

**Measured before filing, and the permission half is already granted.** `.claude/agents/cleaner.md`
line 13, in its **Owns** list:

> Closing test gaps: raising coverage where it's thin, **adding property tests via
> `@fast-check/vitest`** where a unit test is really checking an invariant over a range of inputs.

So that half is not a widening. What it is instead is an **incoherence in `cleaner`'s own workflow**.

### `cleaner` may write a property test but its loop never runs one

Workflow step 4 (same file):

> Re-run `npm run test:unit` after every change to confirm behavior hasn't shifted (**fast path —
> skips property tests**, which only `architect`/`hardener`/`product` need)

A role permitted to add a property test, whose iteration loop cannot execute it, cannot see it pass —
let alone see it **fail against a deliberately broken implementation**, which is this repo's stated bar
(`architect.md`: _"A property nobody has seen fail is documentation."_). Permission and loop contradict
each other.

One path already escapes this: the equivalence-demonstration rule requires the **whole unfiltered**
suite (`npm test`), which includes the `property` project. So `cleaner` runs property tests today — but
only when demonstrating a survivor **equivalent**, never when iterating on one it is trying to **kill**.
Exactly backwards for the use the request describes.

### The overlap is already measured, and it is total rather than partial

`pin-stryker-seed-to-unblind-the-mutation-gate` measured this directly. After pinning, seed-bearing kills
went **0 → 420** across 14 property files — and the survivor set was **byte-identical at mutant
granularity** on both scopes (`src/` 98.71% / 17 survivors, `scripts/` 98.83% / 23). CLAUDE.md:

> the 420 are entirely **first-kill-wins re-attribution** … so **on this tree the property layer
> contributes zero mutants to either mutation score**.

**Not "too much" overlap — complete overlap.** Every mutant the property layer can kill is already killed
by a unit test. That is the strongest possible evidence for the concern, and it is why this candidate is
worth running rather than assuming either answer.

CLAUDE.md immediately bounds that finding, and **the bound is the reason this must not become a deletion
exercise**: it is "a statement about redundancy on one tree at one seed, not about the layer's worth", and
property tests "earn their place by finding defects **while a module is being written**" — the
`scrollbars.ts` lesson being that a green, correct property can coexist with a real bug in what a caller
passes it.

## What "necessary and sufficient" means operationally

Worth pinning down before measuring anything, because the natural definition is computable and the natural
metric is a trap.

- **Sufficient** — the union of all layers kills every non-equivalent mutant. This is what the current gate
  already reports, and it is currently met (98.71% against `break: 85`).
- **Necessary** — no test can be removed without some mutant that previously died now surviving. This is
  precisely computable, and it is **not** what any current report shows.

By that definition, the measured finding above says the entire property layer is **unnecessary on this
tree** — 17 files, 186 tests, **3,394 lines** against 5,397 lines of non-property unit tests, so 39% of the
unit-test line weight. That number is the case for running this. It is not, by itself, the case for
deleting anything.

## The two costs, which are very different sizes

**In `npm test`, the cost is trivial and not worth optimizing.** Measured: `npm test` is ~9.05s, `npm run
test:unit` ~3.9s, so the property project costs about **5 seconds**. Nobody should restructure a test suite
for five seconds.

**Under Stryker, the cost is real and is currently unmeasured — and the seed pin is what created it.** Before
`pin-stryker-seed`, property tests were filtered out of every mutant run by the `testNamePattern` mismatch
and _never executed against a single mutant_. After the pin they execute against every mutant they cover.
So the pin simultaneously (a) made the property layer cost full price in the gate for the first time and
(b) proved it kills nothing the unit layer does not. **That conjunction, not the 5 seconds, is the actual
subject of this candidate**, and the figure that would quantify it — property-layer wall-clock inside a
full `test:mutation` run — has never been taken.

## Sketch

Four pieces. The first is unambiguously worth doing; the rest are measurement before decision.

**1 — Fix the contradiction.** Either `cleaner`'s loop runs the property project when it has touched one
(cheap form: `npm test`, +5.15s), or the Owns line is withdrawn. Both are coherent; the current pair is not.

**2 — Build the per-arm survivor diff.** The instrument neither gate provides: run the mutation gate with
the `property` project excluded, then with the `unit` project excluded, and diff survivor **identities**
against the full run. Anything killed **only** by the property arm is its genuine contribution; the measured
expectation is that the set is **empty**. Anything killed only by the unit arm is the same fact in reverse.

**3 — Measure the CPU actually at stake**, since that is the request's stated motive: property-layer
wall-clock inside a full `test:mutation` run, not inside `npm test`. If it is a small fraction, the
efficiency argument dissolves and the question becomes purely about clarity and maintenance of 3,394 lines.

**4 — Only then decide what, if anything, to cut** — under a written rule, not a score.

## The deletion rule this must borrow, and the trap it exists to avoid

**Do not minimize the suite against the mutation score.** Mutants are a proxy for defects, and a suite tuned
to be minimal with respect to _today's_ mutants is overfit to _today's_ code: it is exactly as strong on the
faults Stryker happens to generate and arbitrarily weaker on everything else. The gate cannot detect that
having happened, because the score stays green by construction.

Two things in this repo already say so from different directions. `scrollbars.ts`: a property was green,
correct, and quantified over the right invariant throughout the entire life of a real defect, because the
bug lived in what a **caller** passed it — no mutation score over that module could ever have seen it. And
`triage-paired-specs` is the worked precedent for doing a cut responsibly: a test could not be deleted
because a sibling happened to cover it, only because its **claim was restated** elsewhere — with the
explicit warning that subsumption-based coverage is usually _incidental_, holding only for the sibling's
current inputs, and can evaporate later with nothing going red.

So the rule for any cut here should be the same shape: **a property may be removed when the invariant it
states is stated elsewhere, not when a mutation run shows it killing nothing.** Those are different tests,
and only the first survives the code changing.

## The methodology trap that makes measurement necessary at all

**A mutation report structurally cannot answer "do these two layers overlap."** Stryker's `vitest-runner`
sets `bail: 1`, so vitest stops at the first failing test and exactly one `killedBy` is recorded — measured,
all 1,278 killed mutants on the `bd7c388` baseline carry exactly one entry. A mixed attribution is
**unrepresentable**. Counting kills by layer measures _which test ran first_.

The same applies to CRAP: coverage is a union, so a line covered by both layers is indistinguishable from a
line covered by either. **Overlap is not observable from either gate**, which is why piece 2 has to build a
new instrument rather than read an existing report.

## Touches

`.claude/agents/cleaner.md` (piece 1), possibly `architect.md` and `coder.md` if the ownership line moves —
`coder.md` line 42 says flatly _"Property tests belong to `architect`"_, **already inconsistent with
`cleaner.md` line 13** and needing correction either way. `.claude/agents/articles/engineering.md`'s
"Writing a property test" section is the shared reference all three point at.

`npm run agent-doc-check` gates `.claude/**` but validates frontmatter and the role-cycle string, not prose
consistency — so **it would not have caught the contradiction above**, which is a small gap worth noting.

## Open questions

- Is the contradiction better fixed by **widening `cleaner`'s loop** or **narrowing its Owns list**? Widening
  costs 5.15s per iteration; narrowing means a property gap found during cleanup waits a whole role.
- If piece 2 confirms the empty set, does that argue property tests should be **written differently** —
  targeting invariants no unit test states — rather than that there should be fewer of them? The 39%
  line-weight figure is an argument for either conclusion.
- **Is a redundant test actually a cost worth removing?** A duplicate kill is also a second, independent
  statement of the same claim, and this repo deliberately keeps such duplication elsewhere: the
  `SCROLLBAR_THICKNESS_PX` jsdom tests restate `- 10` rather than importing it, _precisely_ so the assertion
  carries its own mutants. Deleting redundancy and deliberately maintaining it are both live practices here;
  this candidate should say which applies where.
- Does the same question apply to `*.browser.test.ts`, which is additive-only and invisible to both `crap4ts`
  and Stryker by construction — so its redundancy is unmeasurable by any of these instruments?
- Shared harness: `cross-module-kills-as-a-coupling-signal` wants the **same per-arm survivor diff**, cut by
  module instead of by layer. If the instrument is the hard part, one slice should build it and both
  questions should use it.
