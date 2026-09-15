---
name: the-touches-section-fights-negotiable
title: Reshape the Touches prompt so a candidate bounds its size without committing a solution
created: 2026-09-15
---

## Context

`TEMPLATE.md`'s Touches prompt asks a candidate for the modules, config, and docs likely in
scope — a file set, written before `product`, the design pass, or any implementer has looked.
Under the Definition of Ready's Negotiable predicate (ruled 2026-09-15: a candidate is a
proposal, not a contract), a pre-enumerated file set is a pre-negotiated solution. The template
rewards on one section what the rubric penalises on another.

The tension is real on both sides. Touches is what makes size boundable — the design-pass
checklist reads against it, and an empty one leaves the split question unanswerable. Surfaced
2026-09-15 while re-founding the Estimable predicate, which was decoupled from the section by
name for exactly this reason: the rubric now asks whether size can be bounded from what the
file says, wherever it says it.

## Sketch

Thin by intent. Candidate directions, none chosen: reword the Touches prompt toward reach
rather than file sets ("what the change would have to touch to be this small" versus "the
files it will edit"); make the section optional below `todo/`; or replace it with a
size-clues prompt the design pass reads without treating as a commitment. Whatever shape wins,
the Definition of Ready's anchors must be re-read against it — an anchor that rewards a closed
file set rewards the anti-Negotiable shape.

## Touches

- `ideas/TEMPLATE.md`
- `.claude/references/definition-of-ready.md` — the anchors that read size off the file
- The board's existing files only if the prompt rewording invalidates their sections, which it
  should not

## Open questions

- Is the conflict real or register-deep? A Touches list written as a guess ("likely in scope")
  may already be negotiable in spirit, and the fix may be one clarifying clause rather than a
  reshape.
- Does the sizing job move to the design pass entirely, leaving candidates with no size section
  at all? That trades the conflict for unscorable size letters on every assessment.
- The section is named in many board files today; a reshape binds only future candidates unless
  a sweep is worth it — is it?
