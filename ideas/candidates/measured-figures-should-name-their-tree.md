---
name: measured-figures-should-name-their-tree
title: Decide whether a measured figure in a comment must record the tree it was taken on
created: 2026-09-05
---

## Context

`re-audit-hand-written-e2e-residue` found **five** stale measured figures, and **three of them were
made stale by that same slice's own earlier commits**. One was caught by `product` in its own draft
before it landed; one was caught by `architect` a commit after it was written; one had been wrong
since a previous slice and nobody had re-run it.

This is not a new observation — CLAUDE.md already warns repeatedly against quoting a figure forward,
and records several instances (_"two correct numbers already went stale inside this one slice"_). What
is new is the **frequency in a single slice**, and that `hardener` applied an ad-hoc fix worth
generalising: when it confirmed a figure, it **added the tree the measurement was taken on** to the
comment, noting that figure had been "the one figure in that file whose only measurement predated the
tree it is claimed about".

## The candidate

**Should a measured figure in a comment be required to name its tree?** Something like
_"reds 3 tests (measured at `slice/re-audit-hand-written-e2e-residue`)"_ rather than _"reds 3 tests"_.

**For**: a figure with provenance is checkable — a reader can see whether the tree has moved and
decide whether to re-run. A bare figure is indistinguishable from a current one, which is exactly why
these rot silently. The repo already does this well in some places (`architect`'s rulings routinely
attribute), and badly in others.

**Against**: it is ceremony on every comment, most of which never go stale; it adds a slice name that
itself becomes archaeology once the tag is old; and CLAUDE.md's existing convention — _the next full
run produces the current figure, the doc does not record it_ — already answers this for the figures
that matter most. A rule requiring provenance everywhere might just move the staleness into the
provenance.

## Sketch

Deliberately thin, and the honest first step is **not** to write a rule.

Count first: how many measured figures live in `src/` and `features/` comments, and how many are
currently stale? `re-audit-hand-written-e2e-residue` found five in one slice's blast radius, which
suggests the population is large — but that slice was unusually comment-heavy and may not be typical.
If most figures are fine, this closes as "the existing convention is adequate, and the discipline is
to re-measure when you touch the thing".

**No `ast-grep` rule is possible** — a figure in prose is not a syntactic pattern, and distinguishing
"3 tests" as a measurement from "3 tests" as prose needs meaning, not structure. If anything mechanises
this it is a checker in `scripts/`, which is a real cost for a soft convention.

## Touches

`.claude/agents/articles/engineering.md` if it becomes a convention — that is where the shared house
rules on measurement live, and where _"The scope of a claim is the scope of the command that produced
it"_ already sits. This would be its sibling: **the tree of a claim is part of the claim.**

Possibly `scripts/` if anyone wants it checked, which the sketch argues against.

## Open questions

- **Is the population actually large?** Measure before designing. This candidate exists on one slice's
  evidence.
- Does the existing rule already cover it in spirit? _"The scope of a claim is the scope of the command
  that produced it"_ is about breadth; this is about **time**. They may be the same rule stated twice,
  or genuinely different.
- Is there a cheaper intervention than a convention — e.g. the standing instruction being "when you
  edit a file, re-measure any figure in the comment you touched", which is narrower and attaches to an
  action rather than to every comment ever written?
