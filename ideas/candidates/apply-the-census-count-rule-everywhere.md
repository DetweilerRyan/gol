---
name: apply-the-census-count-rule-everywhere
title: Sweep the census-count rule across the corpus, and decide whether any of it is mechanisable
created: 2026-09-09
---

## Situation

`narrow-the-count-enumeration-exemption` added the rule to `engineering.md` and swept nothing. The rule:
where a numeral is a **census of external state** — files on disk, config entries, a library's registry,
another article's structure — drop it and keep the enumeration. Two kinds of count stay: one that **is**
the rule or premise, and one over the sentence's own adjacent bullets.

Two files are already swept, by the slices that produced the rule. `testing-layers.md` took eight edits and
`quality-tooling.md` ten. Every other article, `CLAUDE.md`, and the five role files carry their censuses
untouched.

## Complication

**The rule is live and the corpus does not follow it.** That is the same failure the repo already names for
an article nobody is told to read: the fact is invisible rather than merely absent. A role reading
`engineering.md` now sees a rule its own instruction files break.

**`CLAUDE.md` is the hard case, and it is hard in a specific way.** Its module map — "Twenty framework-free
modules — `appearance.ts`, `gameOfLife.ts`, …" — is the worked example the original clause was written to
protect, and `engineering.md` still cites it as such. Three counts sit in that file's Architecture section
alone (framework-free modules, hooks, unit-tested components), plus "Seven programs" and "Ten are topic
articles" in the routing index. The last of those is a census of `.claude/agents/articles/`, which the
sidecar rollout is actively changing — it has already survived three splits without being re-counted,
because a sidecar is not an article and nobody had to decide whether it counts.

**So the sweep forces a decision the rule dodged**: is the module map a census, or is it the premise? It
reads as a census. It is also the single most-cited enumeration in the repo, and `engineering.md` cites it
by name as the reason the enumeration clause exists at all. Removing its numerals means editing that
citation too.

**Deferred 2026-09-09 by the user.** `defer-the-module-map-ruling` closed the contradiction in
`engineering.md` and left the question open. The sweep decides it.

**The map is not one object, and the sweep must sort its numerals rather than rule on it whole.** Measured
2026-09-09, before any sweep:

| numeral in the map                   | checkable at a glance? |
| ------------------------------------ | ---------------------- |
| twenty framework-free modules        | yes                    |
| sixteen at `src/` root               | yes                    |
| four in `src/equality/`              | yes                    |
| sixteen hooks                        | yes                    |
| thirteen unit-tested components      | yes                    |
| **six of the twenty import nothing** | **no**                 |

All six were correct when measured. **The sixth is the one that matters**, because it is the case the
count-beside-enumeration clause does not actually cover. A reader can count six names. A reader cannot see
whether those six still import nothing without opening six files. The numeral and its list can therefore
agree while both are false, which is silent failure inside the form the clause treats as loud.
`engineering.md` now carries that limit as a caveat.

**The map also holds a census with no list at all**: `patternLibrary.ts` is described as "the 8-pattern
catalog". That is the same census `split-testing-layers-article` removed from an article, where "all 8
patterns" became "every catalogued pattern". CLAUDE.md still carries it.

**The map's own last paragraph is the target form.** It names `src/App.tsx`, `src/main.tsx` and
`src/components/LifeBoard.tsx` as excluded, with no numeral. Nothing to keep in sync, and nothing lost.

**One fact cuts the other way and belongs in the ruling.** The module map is the only census in the corpus
with named owners and a standing obligation to maintain it: `cleaner.md`, `architect.md` and
`engineering.md` all instruct a role to update the map as part of a split. No other census has that. The
obligation is prose and nothing checks it, but it is a real difference from every other case the sweep will
meet.

**Role files are a separate authority problem.** `workflow.md` forbids editing another role's file without
explicit user direction, and the five role files carry counts of their own. That is a different owner and
possibly a different slice.

**Nothing checks any of this.** `reference-check` and `agent-doc-check` both stay green on a wrong count,
because every filename still resolves and no checker reads a numeral. The rule is convention the whole way
down, which is the argument for the open question below.

## Question

Does the sweep reach `CLAUDE.md`'s module map and the role files, or stop at the topic articles — and can
any part of this be mechanised, or is it convention by construction?

## Answer

**Sweep the topic articles first, and rule on `CLAUDE.md` separately.** The articles are unambiguous: each
carries censuses of `src/`, `scripts/`, `features/` or a config, none is cited elsewhere as an exemplar,
and the two already swept show the edit is small — eighteen edits across two files, no information lost.

**Take `CLAUDE.md` as its own decision, with the module-map question stated as the deliverable rather than
assumed either way.** It is auto-loaded into every session and every subagent, `engineering.md` cites its
map by name, and a wrong call there is paid by all six audiences.

**Do not touch the role files without a separate direction**, per `workflow.md`.

### Sizing

Per article, this is a small edit — the two done so far took one commit each, folded into a larger slice.
The whole article sweep is plausibly one slice. All paths are inside the mutation-invariant allowlist.
**Check CLAUDE.md's predicate rather than recalling it.**

The sweep must not run ahead of the sidecar rollout. `roll-the-rationale-sidecar-out` rewrites these
articles wholesale, and a census edit landing first would be rewritten by the split that follows it. Sweep
an article the same slice that splits it, or after.

## Two residual censuses the first sweep missed, found by REVIEW

Both are in files the rule was applied to, so they are evidence that a by-hand sweep misses cases even when
the sweeper is looking for them.

- **An ordinal is a census form the rule does not name.** `quality-tooling.md` calls `.gherkin-lintrc` "a
  **ninth** checker", and CLAUDE.md calls the ast-grep rules "an **eighth** checker". Those two ordinals are
  coupled across files, which is the same cross-file drift class as the "three advisory programs" against
  CLAUDE.md's four — the contradiction the ruling was built on. **The sweep should add ordinals to the
  census class explicitly**, since a reader looking for numerals will not see "ninth" as one.
- **`testing-layers.md` says the barrel "withholds a dozen names"** in the same paragraph that says "No
  count of the barrel's exports is kept here". The figure was exactly 12 when checked. The paragraph drops
  one census and keeps another.

## Open questions

- **Is any of it mechanisable?** A checker for "a numeral immediately followed by a plural noun naming a
  repo artifact" is conceivable. Three things to settle before building one, in order. First, **search for
  an existing tool** — `orchestration.md` says to, and a search that turns nothing up is itself the
  justification. Second, the **false-positive surface**, which looks bad: the rule's own two exempt classes
  are semantic, so a purely syntactic matcher cannot tell "two levels and no more" (a constraint) from "two
  shared root modules" (a census), and both are a numeral plus a plural noun. Third, the **cost**: a
  bespoke `scripts/` program pays CRAP ≤ 6, its own vitest suite, `dry4ts:scripts` and mutation testing, and
  becomes permanent maintenance. The honest prior is that this is convention by construction, like the
  roster and quoted-title halves of the claim-discipline rule that `slice/comment-reference-checks` scoped
  out for the same reason. **A negative answer is a real deliverable here** — write it down in
  `engineering.rationale.md` so the question is closed rather than reopened annually.
- **Is the module map a census or a premise?** Stated above as the deliverable of the `CLAUDE.md` decision,
  not settled here.
- **Does "Ten are topic articles" survive the sidecar rollout?** It counts `.claude/agents/articles/`
  entries and has already outlived three splits without being re-counted, because nobody ruled on whether a
  sidecar is an article. Either answer is fine; the drift is that no answer was given.
- **Should the two swept sidecars' ruling sections become pointers?** Each currently restates the
  three-class line, which now lives in `engineering.md`. Two copies of a rule will drift. The slice-local
  edit lists should stay where they are.
