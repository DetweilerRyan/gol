---
name: hook-findings-never-reach-the-agent
title: Route the write-time hooks' findings where the acting agent can see them
created: 2026-09-16
---

## Situation

Two write-time hooks run on every matching edit — the board's Layer 1 check and the prose
loop — always exiting 0 with their findings on stderr, per the nothing-gates ruling and the
PostToolUse event's own cannot-block mechanics. Measured 2026-09-16 across three fresh-session
runs with a sentinel handler: the machinery fires end to end — settings load, matcher and path
filter, the bare-node handler under the harness environment, main-agent and subagent writes
alike — and the captured output shows the checks working, including a planted missing-section
defect correctly named.

## Complication

The same three runs measured the delivery: the acting agent reported nothing observed every
time, while the sentinel proved the hook had run beside it. Exit-0 stderr goes nowhere an agent
looks, so the loop's entire advisory value — findings named at write time, the fix procedure
pointed to — reaches nobody. The hook-may-be-ceremony question its own candidate carried from
birth is now answered: as wired, yes.

## Question

How does a hook's finding reach the agent whose write triggered it, without the delivery
mechanism becoming the board's first gate?

## Answer

Shaped, not specified. The event's documented channel for agent-visible text is JSON output
carrying a decision-and-reason pair. The mechanics fit the standing rulings — the write is not
undone, nothing fails — but the field wears the name "block", a vocabulary tension with the
nothing-gates ruling that wants the user's explicit ruling recorded before adoption, and the
reason text should carry the same findings the stderr form carries today, byte-comparable
where possible.

## Open questions

- Does the decision-field form fire the same way for subagent writes, or does the reason text
  route only to the main context? Verify by running, with the sentinel method this candidate
  inherited.
- The Layer 1 injection path is unaffected — the assess skill reads its output directly — so
  the change touches only the hook handlers. Does the injection contract stay byte-identical?
- Is a reason delivered on every finding too noisy on the zero-baseline surfaces, or is the
  scoping already tight enough that a fired finding is always worth reading?
