---
name: the-angle-bracket-placeholder-has-an-asymmetry
title: Bracketing a placeholder's directory does not hide it from reference-check, only bracketing its filename does
created: 2026-09-11
---

## Situation

`reference-check-reach` established a convention for writing an illustrative filename in prose so the
checker does not treat it as a real citation: bracket it, parallel to `agent-doc-check`'s existing
`npm run <script-name>` form. The slice used it in several files, and `architect` and `hardener` both
verified the mechanism empirically rather than by reading the regex.

It works because `<` and `>` fall outside `FILE_TOKEN_SOURCE`'s character class. So `./<name>.md`
degenerates to a zero-prefix match of `.md`, whose basename starts with `.`, and
`isDiscardedToken` drops it.

## Complication

**The mechanism is positional, and the half a copier will get wrong is the half nobody wrote down.**
Found by `hardener` at the slice gate:

- `` `./<name>.md` `` — bracketing the **filename** — extracts nothing. Gate-neutral.
- `` `<dir>/name.md` `` — bracketing only the **directory** — extracts `/name.md`, whose basename is
  `name.md`, and **is** checked. Not gate-neutral.

Every use the slice landed is the correct form. But the convention now appears in several files, it
reads as "put brackets around the made-up part", and that reading is false for half the cases. The
next author who brackets a directory gets a finding they will not expect, on prose that looks
identical in shape to prose that passes.

**It fails in the safe direction** — a surprise finding rather than a missed citation — which is why
this is a documentation gap rather than a defect.

## Question

Where does this convention get written down, and does it want a rule rather than a sentence?

## Sketch

The cheapest version is a sentence wherever the convention is stated, saying the brackets must cover
the **basename** and giving both forms. `doc-comments.md` rule 7 and `CLAUDE.md`'s `reference-check`
entry are the candidate homes; decide which, rather than writing it in both.

A stronger version notes that the mechanism is incidental. Nothing in `references.ts` was designed to
make brackets a placeholder syntax — it falls out of the character class and the dot predicate
together. A later narrowing of either could silently make every bracketed placeholder in the corpus
start reporting. If the convention is worth keeping, it is worth a test in `references.test.ts`
pinning both forms, so the behaviour is intentional rather than emergent.

That test is the real proposal here. The sentence without it documents an accident.

## Touches

- `scripts/reference-check/references.test.ts` — the pinning test
- One of `doc-comments.md` or `CLAUDE.md`

## Open questions

- **Is a bracketed placeholder the right convention at all?** The alternative is an allow-marker per
  site, which is explicit and costs a line each. The bracket form is invisible and free. The slice
  chose brackets for illustrative prose and markers for real-but-dead citations, which is a coherent
  split, but it was never stated as a rule.
- **How many bracketed placeholders exist today?** Count before writing the sentence; if it is three,
  a marker each may be simpler than a convention.
