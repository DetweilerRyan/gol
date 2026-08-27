---
name: cells-column-has-two-parsers-and-neither-models-tuples
title: Model the cells column as tuples instead of shaving parens off a flat comma split
created: 2026-08-27
---

## Context

Raised by the user while reading `comma-list-mutants-are-all-syntax-breaking`: _"why are we using
regex to parse coordinates in gherkin files when we have an ast parser?"_

**The AST genuinely cannot help, and that half of the question has a clean answer.**
`@cucumber/messages`' `TableCell` is exactly `{ location: Location; value: string }` — Gherkin's
grammar has no notion of what is _inside_ a cell, by design, because it does not know the domain.
`gherkin-document.ts` already does its whole job: it finds the cell, its span, and its text. There
is no parse tree left to consult for `(0, 0)`. This is why `architect` ruled at `gherkin-ast-mutation`'s
DESIGN pass that the comma-list work was independent of the AST work, and that ruling stands.

**One level down, the question lands on something real.** `mutateCommaList` splits the cell on `,`
— and for `(0, 0), (1, 0)` the comma it splits on is _the one inside each pair_. It shreds a
4-tuple list into 8 unbalanced fragments (`(0`, ` 0)`), and `stripParenAffixes` shaves the
punctuation back off. That works, and is measured to work, but it is **a patch over a structural
mismatch rather than a model of the value**.

The brittleness is already measured rather than suspected. `product`'s VERIFY probe, 40 seed keys
per shape, asking whether a mutant still parses as the same number of well-formed items:

| column shape                  | preserved |
| ----------------------------- | --------- |
| `(0, 0), (1, 0), …` (control) | 40/40     |
| `[0, 0], [1, 0], …`           | 0/40      |
| `{0, 0}, {1, 0}, …`           | 1/40      |
| `<0, 0>, <1, 0>, …`           | 3/40      |
| `0 0, 1 0, …`                 | 3/40      |
| `((0, 0)), ((1, 0))`          | 0/40      |

A rule that _modelled_ tuples would either match a shape or not. This one degrades silently back
to the syntax-breaking class the slice existed to escape, and `architect` had to add a CLAUDE.md
warning saying so.

**There are also two parsers for one column format, in two directories, with different models and
nothing checking they agree:**

|                                                 | model                           | yields      |
| ----------------------------------------------- | ------------------------------- | ----------- |
| `scripts/acceptance-mutation/mutation-rules.ts` | flat comma list + affix shaving | 8 fragments |
| `features/steps/pattern-library.ts:58`          | `/\((-?\d+),\s*(-?\d+)\)/g`     | 4 tuples    |

The second is closer to correct but is a **lenient scanner, not a parser** — `matchAll` skips
non-matching text, so it would silently accept `garbage (0,0) garbage`. That leniency is
load-bearing in one direction (it is exactly what makes the old syntax-breaking mutant class show
up as a short list, which the count assertion then catches) and a latent hole in the other.

## Sketch

Add a **list-of-tuples** entry to `VALUE_RULES`, ahead of the comma-list rule, matching a value
that is wholly a delimited list of fixed-arity numeric tuples. Mutate a component of one tuple.
`stripParenAffixes` then either becomes dead (delete it) or stays for genuinely flat lists that
happen to carry parens — decide which, do not leave both live and overlapping.

**The payoff is new mutation classes the flat split structurally cannot express**, and this is the
argument for doing it at all rather than "it would be tidier":

- **swap x and y within a pair** — the single likeliest real defect in a coordinate contract, and
  the one `GridRuler.test.tsx`'s membership test exists to catch on the `src/` side;
- **drop a pair** entirely (a shorter list that is still _valid_, unlike today's syntax break);
- **duplicate a pair**.

Slice 1's entire value was moving between mutant _classes_ while the score stayed at 100% either
side, so classes are the currency here. Expect this to move the acceptance-mutation figure and
possibly to surface a survivor — a survivor would be a real gap in `features/steps/pattern-library.ts`
and the whole reason to do it.

Note the two parsers probably **cannot** share a module: `rules/no-domain-imports-in-bdd-steps.yml`
fences step modules to `playwright-bdd`, `@playwright/test` and `../e2e-helpers`, and `scripts/` is
a separate tsconfig project. So the realistic outcome is two parsers that _agree by test_ rather
than one shared definition — say so explicitly rather than discovering it halfway.

## Touches

`scripts/acceptance-mutation/mutation-rules.ts` and its unit + property tests; possibly
`features/steps/pattern-library.ts` (`product`'s, not `coder`'s — a cross-role slice, which is
itself worth weighing); CLAUDE.md's `mutateCommaList` paragraph, which currently documents the
paren-shaving behaviour and its measured bracket-shape limits.

## Open questions

- **Is `parseCellList`'s leniency load-bearing enough to keep?** It is what turns a syntax-broken
  pair into a _short list_. If the mutation side stops emitting syntax-broken pairs, does the step
  still need to tolerate them — or does tightening it to a strict parse make the contract stronger?
- **Does a tuple rule belong in `mutation-rules.ts` at all**, or is it the first case of a
  domain-value grammar that wants its own module? One rule does not justify a module; three might.
- **Which of the three new classes are worth emitting?** Swap-x-y is clearly the valuable one.
  Drop-a-pair may be redundant with what the count already catches.
