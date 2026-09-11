---
name: nothing-tracks-a-function-at-exactly-threshold
title: crap4ts passes a function sitting exactly on the threshold, and nothing says it is one branch from breaching
created: 2026-09-11
---

## Situation

`crap4ts` fails a function scoring **above** 6. A function at exactly 6.0 passes, and the report says
nothing to distinguish it from one at 1.0.

Measured 2026-09-11 on `prose-lint-runner-is-shell-not-typescript`: `classifyProbe` in
`scripts/prose-lint/vale-probe.ts` sits at **exactly CRAP 6.0**, reported by `hardener` at the slice
gate and again on the whole-tree run — worst 6.0, 0 above threshold, PASS. Its sibling `decide` is at
5 with a documented four-guard ceiling. So the program has one function at the edge and one function
one guard from it, and the gate is green.

## Complication

**The next branch added to that function breaches, and the author will not know until it does.** That
is not a gate failure — the gate is doing exactly what it was configured to do. It is an absence of a
signal that would let someone choose a different file before paying for the refusal.

**A wrong claim about the ceiling has already been written once.** `decide.ts`'s header asserted
"cyclomatic 5, and there is no headroom for a fifth" guard. `architect` measured that false in REVIEW:
`classifyProbe` is at cyclomatic 6 in the same program and passes. The header now states the real
constraint. That error is the shape the missing signal invites — a per-function budget reasoned about
from memory rather than read from a report.

## Question

Should the report name the functions within some margin of the threshold, or is that a number nobody
would act on?

## Sketch

The cheapest version prints, after the PASS line, every function scoring within a margin of the
threshold — say 5.0 and above at a threshold of 6. Report-only. It changes no exit code and gates
nothing, so it cannot break a build; it turns an invisible edge into a line someone reads.

The `crap4ts` patch in `patches/` is where this would live, or a wrapper. Note the weight: a wrapper
under `scripts/` owes CRAP <= 6, its own vitest suite, `dry4ts:scripts` and mutation testing, which is
a lot of machinery for a comparison. Read `quality-tooling.rationale.md` on the existing patch first.

## Open questions

- **Is the margin a real signal or noise?** Count how many functions in `src/` and `scripts/` sit at
  5.0 or above today. If it is most of them the line is worthless; if it is three, it is useful.
  **Measure before building.**
- **Does the same gap exist for the other gates?** Stryker's break threshold and `dry4ts`'s
  similarity threshold both have the same shape: a value just inside the bound reads identically to a
  value far inside it. Say whether this is one instance or a class before choosing a fix.
- **Is the honest fix a comment instead?** A function at the edge could simply carry a `//` line
  saying so, which costs nothing and rots the same way the false `decide.ts` header did. That rot is
  the argument for a computed answer rather than a written one.
