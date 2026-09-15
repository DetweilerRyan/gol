---
name: invariant-merges-never-run-the-unit-suite
title: Give an invariant merge one cheap source of unit-suite evidence
created: 2026-09-15
---

## Situation

The merge protocol's stage-5 exemption skips `npm run test:mutation` on a mutation-invariant
diff, and Stryker's baseline was the only stage in the eight that runs the `src/` jsdom unit
suite. The other stages cover build, references, property, browser, scripts, complexity,
duplication, and docs.

## Complication

Under the exemption, the unit layer goes unrun unless someone runs it, and every invariant merge
to date has carried that shape. Flagged by `hardener` during the `claim-vale-style` step-5 gate,
2026-09-15, which closed the gap itself: `npm test`, 70 files, 955 tests passing. A doc-only
diff cannot reach those tests, so the blind spot is in evidence rather than in safety — a
skipped run reads exactly like a passing one, which is the failure direction the whole
invariance design exists to avoid.

## Question

What gives an invariant merge one cheap piece of unit-suite evidence without re-arming the cost
the exemption exists to save?

## Answer

Shaped, not specified. The candidate shapes: the exemption instruction also names `npm test` as
a kept stage (seconds, not the mutation run's minutes); or the protocol's per-entry
which-stages-move analysis gains the unit suite as an always-moves entry; or the gap is accepted
and recorded as a stated cost in the merge protocol's exemption clause. The 2026-09-15 gate's
own move — run it rather than argue — is evidence the first shape costs little.

## Open questions

- Does the exemption clause's "every other stage still runs" already intend this, making the fix
  one clarifying sentence rather than a protocol change?
- Is the browser suite's 2-test reading the same class of thin evidence, or is its coverage
  argument different?
