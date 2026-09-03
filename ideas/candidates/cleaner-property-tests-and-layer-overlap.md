---
name: cleaner-property-tests-and-layer-overlap
title: Let cleaner kill mutants with property tests, and measure whether the two layers overlap
created: 2026-09-02
---

## Context

Raised as _"I'd like to consider allowing `cleaner` to write property tests, not just `architect` —
primarily so `cleaner` can kill mutants with property tests and not just unit tests. Ideally the
unit and property tests don't overlap too much in reducing CRAP scores and killing mutants."_

**Measured before filing, and the permission half is already granted.** `.claude/agents/cleaner.md`
line 13, in its **Owns** list:

> Closing test gaps: raising coverage where it's thin, **adding property tests via
> `@fast-check/vitest`** where a unit test is really checking an invariant over a range of inputs.

So this is not a widening. What it is instead is an **incoherence in `cleaner`'s own workflow**, and
that is the finding worth acting on.

### `cleaner` may write a property test but its loop never runs one

Workflow step 4 (same file):

> Re-run `npm run test:unit` after every change to confirm behavior hasn't shifted (**fast path —
> skips property tests**, which only `architect`/`hardener`/`product` need)

A role permitted to add a property test, whose iteration loop cannot execute it, cannot see it pass —
let alone see it **fail against a deliberately broken implementation**, which is this repo's stated
bar (`architect.md`: _"A property nobody has seen fail is documentation."_). The written permission
and the written loop contradict each other.

Note one path already escapes this: the equivalence-demonstration rule added in
`cleaner-demonstrates-equivalence` requires the **whole unfiltered** suite (`npm test`, 9.05s), which
includes the `property` project. So `cleaner` runs property tests today — but only when
demonstrating a survivor equivalent, never when iterating on one it is trying to kill. That is
precisely backwards for the use the request describes.

### The overlap concern is already measured, and it is worse than suspected

`pin-stryker-seed-to-unblind-the-mutation-gate` measured this directly. After pinning the seed,
seed-bearing kills went **0 → 420** across 14 property files — and the survivor set was
**byte-identical at mutant granularity** on both scopes (`src/` 98.71% / 17 survivors, `scripts/`
98.83% / 23). CLAUDE.md's own conclusion:

> the 420 are entirely **first-kill-wins re-attribution** … so **on this tree the property layer
> contributes zero mutants to either mutation score**.

**Total overlap, not "too much" overlap.** Every mutant the property layer can kill is already killed
by a unit test. That is the strongest possible evidence for the concern behind the request — and it
is also why the request should not be read as "let `cleaner` reach for properties to kill
survivors", since on current evidence a property will not kill a mutant a unit test cannot.

CLAUDE.md immediately bounds that finding, and the bound matters as much as the number: it is
"a statement about redundancy on one tree at one seed, not about the layer's worth", and property
tests "earn their place by finding defects **while a module is being written**" — the `scrollbars.ts`
lesson being that a green, correct property can coexist with a real bug in what a caller passes it.

## Sketch

Three separable pieces; the third may well conclude "change nothing".

**1 — Fix the contradiction.** Either `cleaner`'s loop runs the property project when it has touched
one (the cheap form: `npm test` instead of `npm run test:unit`, +5.15s measured), or the Owns line
is withdrawn and property tests really do belong to `architect` alone. Both are coherent; the
current pair is not. **This is the only piece that is unambiguously worth doing.**

**2 — Ask whether a property can kill what a unit test cannot, on this tree.** The honest experiment
is a survivor-set diff per layer, not a score: run the mutation gate with the `property` project
excluded, then with the `unit` project excluded, and diff the survivor identities against the full
run. Anything killed **only** by the property arm is the non-overlapping contribution, and the
measured expectation from the paragraph above is that the set is **empty**.

**3 — Decide what non-overlap should mean, if anything.** See the trap below before designing any
metric for this.

## The methodology trap, which is the reason to file this rather than just act

**A mutation report structurally cannot answer "do these two layers overlap."** Stryker's
`vitest-runner` sets `bail: 1`, so vitest stops at the first failing test and exactly one `killedBy`
is recorded — measured on the `bd7c388` baseline, all 1,278 killed mutants carry exactly one entry.
A mixed attribution is **unrepresentable**. So counting kills by layer measures _which test ran
first_, not _which tests could kill it_, and any "overlap metric" built on `killedBy` is measuring
scheduling order.

The same applies to CRAP: coverage is a union, so a line covered by both layers is indistinguishable
from a line covered by either. **Reducing overlap is therefore not directly observable from either
gate**, and the only instrument that answers it is the per-layer survivor diff in piece 2 above.

## Touches

`.claude/agents/cleaner.md` (piece 1), possibly `.claude/agents/architect.md` and
`.claude/agents/coder.md` if the ownership line moves — note `coder.md` line 42 says plainly
_"Property tests belong to `architect`"_, which is **already inconsistent with `cleaner.md` line 13**
and would need correcting either way. `.claude/agents/articles/engineering.md`'s "Writing a property
test" section is the shared reference all three point at.

`npm run agent-doc-check` gates `.claude/**` and will need to stay green; it validates frontmatter
and the role-cycle string, not prose consistency, so **it would not have caught the contradiction
above** — worth noting as its own small gap.

## Open questions

- Is the contradiction better resolved by **widening `cleaner`'s loop** or by **narrowing its Owns
  list**? Widening costs 5.15s per iteration; narrowing means a property gap found during cleanup
  waits a whole role for `architect`.
- If piece 2 confirms the empty set, does that argue property tests should be **written
  differently** — targeting invariants no unit test states — rather than that `cleaner` should write
  more of them?
- Should `coder.md` line 42's flat "property tests belong to `architect`" be corrected as part of
  this, given `cleaner` has owned them all along? It is the kind of stale cross-reference
  `agent-doc-check` cannot see.
- Does the same overlap question apply to the **`*.browser.test.ts`** layer, which is additive-only
  and invisible to both `crap4ts` and Stryker by construction?
