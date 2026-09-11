---
name: rename-the-rationale-tier
title: Rename the *.rationale.md tier -- the term is narrower than its contents, and the replacement is undecided
created: 2026-09-10
---

## Context

The sidecar tier is named for one of the four things it holds. `prose-linting.md` defines the
contents as **a measurement, a probe method, a rejected alternative, or a correction carrying a
figure.** Only the third of those is naturally called rationale. A measured finding is evidence, not
reasoning, and calling the file that holds it `*.rationale.md` invites a misfile in one specific
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

`meta` is broader, which is the point, but breadth is what the tier already suffers from at its edges:

- **`meta` reads as `metadata` to most readers**, which is frontmatter, build config and file
  attributes. The tier holds prose.
- **A vaguer name weakens the routing rule rather than clarifying it.** The instruction-versus-
  explanation split works because each half has a shape. If the sidecar becomes "everything else about
  this file", the discipline that keeps arguments out of it goes with the name.

`evidence` matches the four contents more exactly than either — a measurement, a probe method, a
rejected alternative and a correction carrying a figure are all evidence — and excludes nothing the
tier holds. Its objection is narrower but real: **a rejected alternative is not obviously evidence** in
ordinary usage, and it is the entry an author is most likely to be holding when they reach for the
sidecar.

Others raised and not yet argued: `*.notes.md` (honest and flat, and arguably too flat),
`*.background.md`, `*.record.md`. **Treat this list as incomplete.** The right term may not be on it,
and the shape of the answer is a word that names all four contents without naming anything else.

**The reach is the real cost, and it is larger than it looks.** Measured on the slice branch:

|                                         | count |
| --------------------------------------- | ----: |
| files in the tier                       |    16 |
| occurrences of the token `rationale.md` |   221 |
| files mentioning it                     |    50 |

Three of the sixteen sit beside source rather than beside an article — `src/cache.rationale.md`,
`src/hooks/useZoomGlide.rationale.md`, `src/scrollbars.rationale.md` — so the rename crosses the
`.claude/**` boundary into `src/`.

**One machine-readable coupling, and it fails in the dangerous direction.** `.vale.ini` carries
`[**/*.rationale.md]`, the section that exempts the tier from linting. A rename that misses it leaves
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

All sixteen sidecars, `.vale.ini`, CLAUDE.md's routing branches and doc-map index, `prose-linting.md`
which now owns the register rule, `doc-comments.md` rule 7, and the ~50 files citing the term.
`src/**` is touched by three renames, which re-arms the full mutation run by construction.

## Open questions

- **What is the term? Genuinely undecided, and this is the question that gates the rest of the slice.**
  `meta` was proposed for breadth and `evidence` reads as closer to the four contents, but neither has
  been argued to a conclusion and **a better term may not have been proposed yet.** Do not treat the
  two on the table as the shortlist. The test to apply: does the word name all four contents — a
  measurement, a probe method, a rejected alternative, a correction carrying a figure — without
  admitting argument, which must never move? Settle this before any file is moved; every other cost in
  this candidate is incurred once the term is chosen, and incurred again if it changes.
- **Does this wait for Wave 1's content to settle?** Renaming files whose contents are still moving
  doubles the review surface. Sequencing it late in Wave 1, after `prose-linting.md` and
  `doc-comments.md` are reconciled, is probably cheaper.
- **Should it land with [[rename-prose-linting-to-match-its-job]]?** Both are doc renames and both
  churn citations. One disruption may beat two. They are filed separately because their arguments
  differ and their blast radii differ by an order of magnitude, not because they must be sequenced
  apart.
- **Is the `.vale.ini` coupling worth a check?** A half-done rename is silent today. A one-line
  assertion that every tier file matches the exemption glob would catch it, and belongs with whatever
  checker work Wave 1 settles.
