---
name: cycle-exemption-swallows-prose-parens
title: Decide whether check 4's mode-marker exemption should stop matching ordinary prose parentheticals
created: 2026-09-17
---

## Situation

`revise-the-pipelines-reference` made `agent-doc-check`'s check 4 consume a decorated cycle
chain whole and exempt any match containing a parenthetical, so mode-bearing pipeline
sequences stopped redding the gate. The marker pattern accepts any parenthetical content, not
only mode words.

## Complication

`architect` flagged the accepted fail-open at REVIEW, 2026-09-17: a bare canonical chain
immediately followed by ordinary prose in parens — the shape `… → hardener → product (see
handoffs)` — is consumed and exempted from byte-checking, when it is really a cycle mention
with a trailing aside. No doc carried that shape on the day of the ruling; tightening the
marker (all-caps mode words only) was declined in-review as a behavior change to a landed,
corpus-verified checker.

## Question

Should the marker tighten to mode-shaped parentheticals only, accepting the noisier failure
direction, or is the fail-open cheap enough to keep until a real occurrence appears?

## Answer

None yet — the flag's own disposition was "act only if a real doc occurrence ever takes that
shape."

## Open questions

- What counts as mode-shaped: the all-caps mode words alone, or also the lowercase qualifiers
  the pipelines reference uses ("when a trigger fires", "required")? The second set is close
  to unrestricted prose, which is the problem restated.
