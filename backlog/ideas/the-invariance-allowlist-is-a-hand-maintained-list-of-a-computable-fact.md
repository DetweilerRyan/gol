---
name: the-invariance-allowlist-is-a-hand-maintained-list-of-a-computable-fact
title: Decide whether the mutation-invariant predicate should be computed rather than enumerated
created: 2026-09-08
---

## Context

`CLAUDE.md`'s mutation-invariant merge exemption is a hand-maintained
allowlist of paths. `the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`
grew it by three entries and left this question behind, which is the reason
this file exists rather than the reason that slice was worth running.

The invariant the list approximates is stateable in one sentence: **a path
cannot move the mutation score if Stryker neither mutates it nor collects it
as a test.** Both halves are computable from configuration that already
exists — `stryker.config.json`'s `mutate` list, and the vitest include/exclude
resolution that `vite.config.ts`'s `sharedExclude` feeds. The list is a
cached answer to a question the tooling can already answer.

**There are three copies of the predicate, and only one is authoritative.**
`CLAUDE.md`'s merge protocol holds it; `.claude/agents/articles/mutation-testing.md`
enumerates it for the reader; `.claude/agents/hardener.md`'s stage 5 enumerates
it again for the role that acts on it. Nothing checks any of them against each
other.

Four things the enumerated form has actually cost, all on the record rather
than hypothesised:

1. **It goes stale silently.** `rationale-sidecar-pilot` added two entries to
   the predicate without updating `.claude/agents/articles/mutation-testing.md`'s
   enumeration of it; the drift was found by the next slice to edit the same
   clause, not by a gate. `npm run reference-check` and `npm run agent-doc-check`
   both stay green through it.
2. **Each entry costs a slice.** Two slices in two days paid a full mutation
   run for a provably unmoved score before anyone had budget to amend the
   list, and the amendment then took a slice of its own.
3. **An entry can be sound the day it lands and unsound later.** A directory
   entry rests on a `sharedExclude` line; delete that line and the predicate
   is fail-open with nothing announcing it.
4. **Both non-authoritative copies are stale right now**, which is the
   sharpest form of the argument, since it is a present condition rather than
   a history. `the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant`
   added `rules/**`, `rule-tests/**` and `.oxlintrc.json` to the predicate and
   deliberately did **not** update either copy: the article was being rewritten
   concurrently by `split-mutation-testing-article`, so editing it would have
   been discarded on rebase, and `hardener.md` belongs to a role and needs the
   user's direction to touch. So the article under-counts the entries, and
   `hardener.md` under-counts them further — and `hardener` is the role
   licensed to **refuse** an exemption, so a correct instruction naming
   `rules/**` can be refused by a role checking it against its own stale list.
   Refusing fails safe, but it defeats the exemption on first use.

**Two follow-ups this leaves, both concrete.** Reconcile the article's
enumeration once `split-mutation-testing-article` has landed (its rewritten
section states a hardcoded entry count and lists them). And decide whether
`hardener.md` should enumerate the predicate at all, or defer to CLAUDE.md the
way `.claude/agents/articles/orchestration.md` already does — deferring is the
version that cannot drift, and is the same "ask whether the gate still encodes
its invariant" move that removed the rule index from CLAUDE.md.

## Sketch

The version that cannot rot is a `scripts/` program that answers the question
per landing diff — read `mutate`, resolve the vitest projects' effective
include/exclude, and report whether every changed path is outside both. The
orchestrating session then hands `hardener` a computed answer rather than a
looked-up one.

The version that is probably right is smaller: keep the list, and add a check
that the list and the configuration it depends on have not drifted apart —
for example, that every directory entry on the allowlist is named in
`sharedExclude`. That is the failure mode with teeth (fail-open), and it is a
much cheaper predicate than resolving vitest's collection.

## Touches

`scripts/<new-program>/` plus its own vitest suite, `CLAUDE.md`'s merge
protocol, and `.claude/agents/articles/mutation-testing.md`. A new `scripts/`
program pays full gate freight — CRAP ≤ 6, `dry4ts:scripts`, mutation
testing — which is most of the argument against the larger version.

## Open questions

- **Is the smaller version enough?** A drift check between the allowlist and
  `sharedExclude` catches the fail-open case without resolving vitest
  collection at all. If it is enough, this is a much smaller slice than the
  Context implies.
- **Where would a drift check live?** `agent-doc-check` already reads
  `CLAUDE.md` and gates on binary facts about it, so this may be a sixth
  check there rather than a new program — which would avoid the new-program
  freight entirely.
- **Does a computed predicate defeat the point of the allowlist's direction?**
  The list fails safe because an unanticipated path simply runs the gate. A
  computed answer is only as safe as the resolution logic, and a bug in it
  fails open. That is a real argument for keeping the list and checking it,
  rather than replacing it.
- **Is the frequency there yet?** Three entries have been added across two
  slices. `orchestration.md` says to search for an existing tool before
  building a checker; nothing has been searched for here.
