---
name: yaml-block-scalar-prose-is-unscanned
title: reference-check reads YAML comments but not YAML block-scalar prose, and rule notes live in the latter
created: 2026-09-11
---

## Situation

`reference-check` scans comment lines — a trimmed start of `//`, `*`, `/*` or `#` — in every
`.ts`/`.tsx`/`.yml`/`.yaml` file under the scanned prefixes.

A `rules/*.yml` file carries its explanation in two places. Header lines starting with `#` are
scanned. A `note:` block scalar is **not**: its continuation lines begin with a quote or a word, never
a `#`, so `scannable-lines.ts` never offers them.

## Complication

**Measured 2026-09-11 by `architect` and confirmed by `hardener`, on the live tree:**
`rules/no-downward-import-in-scripts.yml`'s `note:` block cites `'../name.ts'`. The token **is**
extractable — probed directly against the landed extractor — and `name.ts` resolves to no file in the
repo. The checker never sees it, because the line it sits on is never offered.

So a rule's `note:` is exactly the kind of dense explanatory prose this checker exists to police, and
it is the half of the file that is invisible.

**It fails in the under-report direction**, which is the safe one and the direction this checker
already chooses everywhere else by matching on basename. That is why it was left alone rather than
fixed inside `reference-check-reach` — it is pre-existing and not that slice's debt.

## Question

Should `scannable-lines.ts` offer YAML block-scalar content, and if so how does it know where a block
ends?

## Sketch

The naive fix — offer every line of a `.yml` file — is wrong. It would scan `files:` and `ignores:`
globs, `pattern:` matchers and `id:` values, which are code rather than prose, and a glob is a
filename-shaped token that deliberately does not resolve. That produces findings on every rule in the
directory.

So the fix needs to know that a line is inside a prose block scalar. That means tracking `note:` (and
any sibling prose key) plus indentation until the block ends. It is a small parser, and `scripts/`
already owes CRAP <= 6 and its own tests for one.

**Weigh that against reach.** This buys one file class — `rules/*.yml` notes — and the measured
finding count today is one. Read `orchestration.md` on searching for an existing tool first: a real
YAML parser would answer the block question for free, and `scripts/` has no YAML dependency today,
which is itself a fact worth checking rather than assuming.

**A measured refutation is a fine outcome.** If the answer is that one stale token in one note does
not justify a parser, record that with the number and close it.

## Touches

- `scripts/reference-check/scannable-lines.ts` and its tests — a gating checker, CRAP <= 6
- `rules/no-downward-import-in-scripts.yml`'s `note:`, which would then need a marker or a reword
- `CLAUDE.md`'s `reference-check` entry, which describes the comment-line rule

## Open questions

- **Which keys carry prose?** `note:` is the one in use. A scan of `rules/*.yml` would say whether
  there are others, and whether ast-grep defines any of them as meaningful.
- **Does the same gap exist in `.vale.ini` or the `vale-styles/*.yml` rules?** Those carry `message:`
  and `link:` values that may cite files. Nobody has looked.
- **Is the honest fix a reword?** Changing `'../name.ts'` to a bracketed placeholder costs one line
  and closes the only known instance. That is not a fix to the checker, and saying so plainly is
  better than pretending the gap is closed.
