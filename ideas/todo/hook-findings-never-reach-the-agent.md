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

Shaped, not specified. Researched 2026-09-16: the vocabulary tension dissolved on reading the
current event documentation — no blocking field exists for this event at all. The documented
agent-visible channels are additionalContext and systemMessage, both neutrally named, both
landing in the acting agent's context, so the mechanics and the vocabulary now agree with the
nothing-gates ruling without any adoption decision. The context text carries the same findings
the stderr form carries today, byte-comparable where possible. One caution rides along: two
readings of the same documentation page disagreed on the field set, so the slice's first step
is the verify-by-running the open questions already mandate — emit the field, sentinel-check
the agent reports seeing it.

## Open questions

- Does the context field route to a subagent's own context when the subagent's write fired the
  hook, or only to the main agent? Verify by running, with the sentinel method this candidate
  inherited.
- The Layer 1 injection path is unaffected — the assess skill reads its output directly — so
  the change touches only the hook handlers. Does the injection contract stay byte-identical?
- Is a reason delivered on every finding too noisy on the zero-baseline surfaces, or is the
  scoping already tight enough that a fired finding is always worth reading?
