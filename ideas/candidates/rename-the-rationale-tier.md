---
name: rename-the-rationale-tier
title: Rename the *.meta.md tier -- the term is narrower than its contents, and the replacement is undecided
created: 2026-09-10
---

## Context

The sidecar tier is named for one of the four things it holds. `prose.md` defines the
contents as **a measurement, a probe method, a rejected alternative, or a correction carrying a
figure.** Only the third of those is naturally called rationale. A measured finding is evidence, not
reasoning, and calling the file that holds it `*.meta.md` invites a misfile in one specific
direction: an author with a measurement and no argument attached to it wonders whether it belongs.

That is not hypothetical. This session produced several measurements whose home had to be reasoned
about rather than read off the filename, and one rule header now carries a dated measurement
precisely because nobody could tell whether the sidecar wanted it.

The user proposed `*.meta.md` as the more encompassing term, then re-opened it: `evidence` may be
better, and **a term nobody has proposed yet may be better than either.** The replacement is an open
question, not a decision this file records.

## Complication

**The premise is sound. No replacement term has been chosen, and this candidate does not choose one.**
Two candidates have been raised and both have a known objection, which is the reason the question
stays open rather than the reason to pick the less-objectionable one.

**The strongest argument for `meta` is not breadth, and reading it as breadth undersells it.** The
sidecars are prose _about_ a role file, an article or a module — they stand outside the thing they
describe and comment on it. That is what `meta` means before it means anything else. On this reading
the tier is **meta prose**, and the term names the tier's relation to its parent rather than trying
to enumerate the parent's contents. No content list can go stale under a relational name, which is
precisely the failure mode the current name has.

**The `.md` extension does the disambiguating work**, and this defuses the objection below rather
than sitting beside it. `*.meta.md` cannot be read as frontmatter or build config, because the
extension already says the file is prose. `meta.json` or a bare `meta/` directory would carry the
metadata reading; `meta.md` does not. The compound is an effective stand-in for "meta prose", and it
is shorter than writing that out.

That leaves a weaker residual objection rather than the one first recorded:

- **A vaguer name weakens the routing rule rather than clarifying it.** The instruction-versus-
  explanation split works because each half has a shape. If the sidecar becomes "everything else about
  this file", the discipline that keeps arguments out of it goes with the name.

`evidence` matches the four contents more exactly than either — a measurement, a probe method, a
rejected alternative and a correction carrying a figure are all evidence — and excludes nothing the
tier holds. Its objection is narrower but real: **a rejected alternative is not obviously evidence** in
ordinary usage, and it is the entry an author is most likely to be holding when they reach for the
sidecar.

**The four contents are not settled, so a test built on them is provisional.** `prose.md`
enumerates a measurement, a probe method, a rejected alternative, and a correction carrying a figure.
That list is one slice old, it has already moved once, and Wave 1 exists partly to re-examine the
article that defines it. A fifth content could be added, or two could merge.

**That is an argument about which KIND of term to choose, not merely a caveat on the test.** A term
chosen to enumerate a list must be re-argued whenever the list moves. A term naming the tier's
_relation_ to its parent — which is what the meta-prose reading gives — survives a change to the
contents untouched. So the instability of the list counts in favour of a relational name and against
a contents-matching one, and that is a live argument for `meta` over `evidence` rather than a
tie-breaker.

Others raised and not yet argued: `*.notes.md` (honest and flat, and arguably too flat),
`*.background.md`, `*.record.md`. **Treat this list as incomplete.** The right term may not be on it,
and the shape of the answer is a word that names all four contents without naming anything else.

**The reach is the real cost, and it is larger than it looks.** Measured on the slice branch:

|                                         | count |
| --------------------------------------- | ----: |
| files in the tier                       |    16 |
| occurrences of the token `rationale.md` |   221 |
| files mentioning it                     |    50 |

Three of the sixteen sit beside source rather than beside an article — `src/cache.meta.md`,
`src/hooks/useZoomGlide.meta.md`, `src/scrollbars.meta.md` — so the rename crosses the
`.claude/**` boundary into `src/`.

**One machine-readable coupling, and it fails in the dangerous direction.** `.vale.ini` carries
`[**/*.meta.md]`, the section that exempts the tier from linting. A rename that misses it leaves
sixteen files newly linted, or — if the section is renamed and a file is not — leaves a file exempt
that should not be. Neither shows up as an error. `agent-doc-check` and `reference-check` both stay
green through a half-done rename, because every filename still resolves.

## Sketch

Mechanical, and that is the trap: a rename this wide is easy to do and easy to do incompletely.

1. Settle the term first, against the four contents rather than against taste.
2. `git mv` all sixteen in one commit, nothing else in it, so the rename is recorded as a rename.
   The idea-board precedent applies — a move plus a rewrite is recorded as delete-plus-add and
   `git log --follow` loses the history.
3. Then the citations, then `.vale.ini`'s section glob, then CLAUDE.md's routing prose and the doc
   map's pair index.
4. Verify by the absence of the old token, not by a green gate. `grep -rc 'rationale\.md'` reaching
   zero is the check; `agent-doc-check` passing is not.

## Touches

All sixteen sidecars, `.vale.ini`, CLAUDE.md's routing branches and doc-map index, `prose.md`
which now owns the register rule, `doc-comments.md` rule 7, and the ~50 files citing the term.
`src/**` is touched by three renames, which re-arms the full mutation run by construction.

## Open questions

- **What is the term? Genuinely undecided, and this is the question that gates the rest of the slice.**
  `meta` was proposed for breadth and `evidence` reads as closer to the four contents, but neither has
  been argued to a conclusion and **a better term may not have been proposed yet.** Do not treat the
  two on the table as the shortlist. The test to apply: does the word name all four contents — a
  measurement, a probe method, a rejected alternative, a correction carrying a figure — without
  admitting argument, which must never move?

  **Apply that test knowing it is provisional.** It is built on a four-item list that is one slice old
  and that Wave 1 may revise. If the list changes, a contents-matching term has to be re-argued and a
  relational one does not — so weigh how settled the list is as part of choosing, rather than
  measuring both candidates against it as though it were fixed.

  Settle the term before any file is moved. Every other cost in this candidate is incurred once the
  term is chosen, and incurred again if it changes.

- **Does this wait for Wave 1's content to settle?** Renaming files whose contents are still moving
  doubles the review surface. Sequencing it late in Wave 1, after `prose.md` and
  `doc-comments.md` are reconciled, is probably cheaper.
- **Landing it with the article rename is no longer an option.** That rename landed on 2026-09-12 as
  `prose.md`, so this tier rename stands alone and pays its own citation churn. The pairing argument
  was that one disruption beats two; it is spent, and the blast radii differed by an order of
  magnitude anyway — 119 citations across 38 files there, against 221 across 50 here.
- **Is the `.vale.ini` coupling worth a check?** A half-done rename is silent today. A one-line
  assertion that every tier file matches the exemption glob would catch it, and belongs with whatever
  checker work Wave 1 settles.
