---
name: claim-vale-style
title: Author the Claim style — deterministic rules for the fingerprinted claim forms
created: 2026-09-15
---

## Situation

Child 2 of `prose-discipline-remedies.md`. Some claim-discipline violations leave phrase-level
fingerprints a deterministic rule can match: an audience roster tends to open "The audience
is", a wording-identity attribution says "own words", an unmeasured census often fronts a
sentence with "Most". Measured 2026-09-15: all three appeared in the audited reference.

## Complication

A judged pass (child 1) covers these forms, but a judge is not reproducible and costs a fork
per file; a tracked Vale rule reports on every `prose-lint` run for free. Nothing deterministic
reads the prose corpus for claim shapes today.

## Question

Which fingerprints survive a measured precision run on the real corpus, and at what rule cost?

## Answer

`architect` authors a tracked `vale-styles/Claim/` style, scoped to the instruction surfaces,
one rule per surviving fingerprint, each with a discriminating fixture pair. The corpus
precision run is the slice's first step, inside the slice, per the rule-authoring discipline —
measurement is part of authoring, not a prior spike.

**The effective-prose interaction, checked 2026-09-15:** that epic's Wave 4 claimed this
territory behind its Wave 1 gate; the user ruled the gate moot the same day, and its Wave 4 now
routes claim mechanisation here. No dependency remains.

**The census-count interaction, checked 2026-09-15:** `apply-the-census-count-rule-everywhere.md`
states of itself that it "does not add a Vale rule" — it is a remediation sweep, so it cannot
absorb the "Most" fingerprint. The interaction is ordering only: a sweep landing first reduces
this style's initial findings, and this style landing answers that candidate's
"whether any of it is mechanisable" question for the census form.

## No-gos

- No judged behavior. The unmechanisable majority stays child 1's.
- No rule lands over an untriaged backlog — the landing constraint binds each fingerprint
  separately, and a fingerprint that fails the precision run dies rather than ships loose.

## Open questions

- Sentence-initial "Most" is the shakiest fingerprint; the corpus run decides it.
- Does the style also claim the `.ts`/`.tsx` comment surface, or instruction Markdown only?
