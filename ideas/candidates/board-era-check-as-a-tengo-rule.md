---
name: board-era-check-as-a-tengo-rule
title: Author the Board style's era-aware section check as its first script rule
created: 2026-09-16
---

## Situation

Layer 1's era-aware section check reads a board file's opener and requires the matching core
section — a Situation opener requires a Question, a legacy opener requires Touches. The check
lives in the assess skill's converted script alone; the Board Vale style carries one rule, the
structural status-field ban, on the belt-and-braces precedent that a check worth having reports
through `prose-lint` as well as through the skill's own machinery.

## Complication

The era check has no Vale half, and the gap is shaped differently from the last one: the check
is a conditional, which Vale expresses only through an extends-script Tengo rule — a first for
this repo's tracked styles. Ruled a follow-up rather than part of the conversion slice by the
2026-09-16 DESIGN pass: a first-of-kind rule deserves its own fixture-backed authoring pass
under the landing constraint, and the conversion's acceptance measured byte-identical hook
output, not Vale reach. The Tengo hazard is already on the record from the fixture-gate work:
a script rule's characteristic failure is the silent zero, which is what makes the fixture
pair non-negotiable.

## Question

Does the era check earn a Tengo rule in the Board style, and what does the first script rule
in a tracked style owe beyond what the fixture gate already checks?

## Answer

Shaped, not specified: `architect` authors the rule with a discriminating fixture pair per
era, the corpus measured before landing per the rule-authoring discipline, and the rule's
header naming the Tengo silent-zero hazard alongside the standard confident zeros. The skill's
script keeps its own copy of the check regardless — the belt is not a replacement for the
braces.

## Open questions

- Both eras need a bad fixture, and the fixture gate checks per-extension pairs — does one
  rule with two bad fixtures satisfy it, or does the era split force two rules?
- The measured corpus: how many board files would the rule fire on today? Zero is the expected
  reading; re-derive at authoring rather than trusting this line.
- Does the first Tengo rule in a tracked style warrant a line in the fixture gate's own
  header, whose reasoning names regex rules only?
