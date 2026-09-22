---
name: is-the-sidecar-placement-rule-checkable
title: Probe whether the sidecar placement rule can be asserted mechanically
created: 2026-09-22
---

Recommended by `coach` SPEC on `slice/a-reader-finds-a-sidecar-without-an-inventory` and carried
forward by both its REVIEW passes. It is the question that slice's ruling B **did not** close.

## Situation

That slice replaced a hand-maintained roster of which files have a `.meta.md` sidecar with a
stated rule, and the user ruled against gating the roster. The argument was an asymmetry with the
precedent: `agent-doc-check`'s check 5 binds prose that no glob can generate, whereas a list of
sidecar names is fully derivable from the tree, so a gate over it would protect a hand-written
copy of a computable fact.

The slice's landed text records that decision as closed, and its item A1 narrowed the sentence so
it closes the **roster** question and nothing wider.

## Complication

**A different predicate was never measured, and the roster ruling does not reach it.** The rule
the slice landed is a _placement_ rule: a sidecar is `<name>.meta.md` beside its instruction
file, except for two named classes that sit in `.claude/agents/articles/` — the five role
sidecars, which `scripts/agent-doc-check`'s roster scan forces there, and `CLAUDE.meta.md`, which
sits there by choice so both doc checkers reach it.

**That predicate is derivable rather than hand-copied**, which is exactly what disqualified the
roster. A checker would not store a list; it would walk the tree and assert a property of what it
finds. Whether it is worth a program is unmeasured.

**Measured 2026-09-21 on `main`:** 24 tracked `*.meta.md` files, 18 beside their instruction file
and six displaced into the two named classes. So the rule has a live population to assert over,
and the exception set is closed and small today.

**Nothing currently notices a violation.** A sidecar placed in a third location resolves through
`reference-check` by basename, which matches anywhere in the tree by design, so that checker is
blind to placement. `agent-doc-check` reads agent frontmatter and never descends. A misplaced
sidecar is invisible to every gate.

## Question

Can the placement rule be asserted mechanically — every `*.meta.md` sits beside a same-named
instruction file, or in `.claude/agents/articles/` under one of the two named classes — and is
the assertion worth a `scripts/` program?

## Answer

A spike, not an enabler. The finished state is a recorded answer, and the answer may be no.

**The probe, in three parts.** Write the predicate as a throwaway script against the tracked
tree and see what it reports on today's 24 files. Then test whether it discriminates: move a
sidecar to a third location in a scratch copy and confirm the predicate fails. Then price the
program honestly — a `scripts/` checker pays CRAP ≤ 6, its own vitest suite, `dry4ts:scripts` and
mutation testing, and becomes permanent maintenance.

**`orchestration.md` binds the first step: search for an existing tool before proposing to build
one.** A search that turns nothing up is itself part of the deliverable rather than wasted work.

**A negative answer is a real result.** The corpus already carries one of exactly this shape —
the roster and quoted-title halves of the claim-discipline rule were scoped out as convention by
construction, and that decision was written down so nobody reopens it annually.

## No-gos

- **Does not reopen the roster ruling.** That decision is closed, and the landed text now says so
  at the width the argument supports. This spike asks about a different predicate.
- **Builds no checker.** If the answer is yes and it is worth doing, that is an
  `enabler-technical` of its own, owned by `architect`.

## Open questions

- **Where does the recorded answer live if it is no?** A spike's deliverable is `findings.md` in
  its own folder, but the folder is deleted at retrospective. A durable no belongs somewhere a
  future proposer reads first, and the candidates are `CLAUDE.meta.md` or an `adr/` record.
- **Is the exception set actually closed?** The rule names two displaced classes today. If a
  third lands before the probe runs, the predicate needs a third clause, and a rule needing a
  clause per exception is converging on the inventory it replaced — which is the parent slice's
  own stated rule-out condition.
- **This is not a readiness spike for an unready idea**, so it moves no parent's letters. Whether
  `definition-of-ready.md`'s spike framing covers a knowledge question arising from a landed
  ruling is itself unclear, and the answer may be that it needs no parent at all.
