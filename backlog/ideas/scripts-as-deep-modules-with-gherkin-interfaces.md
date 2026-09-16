---
name: scripts-as-deep-modules-with-gherkin-interfaces
title: Encapsulate each scripts/ program as a deep module, with a Gherkin feature describing its interface
created: 2026-09-12
---

## Situation

**Raised by the user on 2026-09-12.** Each `scripts/` program would be a deep module in Ousterhout's
sense — a small interface over substantial implementation — and its interface would be described by a
Gherkin feature file rather than only by its unit tests.

The programs are not deep today. Measured 2026-09-12, exported symbols per program:

| Program                                  | Exports | Files  |
| ---------------------------------------- | ------- | ------ |
| `acceptance-mutation`                    | 51      | 27     |
| `mutation-invariance`, `reference-check` | 30 each | 15, 14 |
| `agent-doc-check`, `ast-grep-rule-check` | 28 each | 16, 12 |
| `perf-report`                            | 24      | 11     |
| `gherkin-dry-checker`                    | 18      | 8      |
| `prose-lint`                             | 10      | 8      |
| `halstead4ts`                            | 2       | 3      |

Every one of those exports exists so a unit test can reach it. The house shape — a pure `decide()`
over parsed input with I/O isolated to `run.ts` — produces a **wide** interface by construction: each
parsing concern is its own module, each module is exported, and the test suite is written against the
parts rather than the whole.

## Complication

**The wide interface is not an accident, and it buys something real.** It is what makes CRAP <= 6
reachable, what lets `dry4ts` see duplication, and what gives the mutation gate small units to score.
A proposal to narrow it has to say what replaces those.

**The deep-module case is that the width is paid for by every reader.** A program's actual contract
is its CLI: the arguments it accepts, the exit codes it defines, what it prints, and what it refuses.
`prose-lint` is the worked example — its whole contract is _lint these files, fail when you cannot
lint, never on a finding, and exit 1 on an empty set_ — and that contract is currently spread across
four modules and 27 unit tests, with no single artifact stating it.

**The Gherkin half has a harder problem than the encapsulation half**, and it should not be assumed
away:

- **`features/**` is `product`'s entire manifest**, in both its modes. A `scripts/`-describing feature
  would either move that boundary or need a second home, and the first is a role-scope change.
- **The whole layer is browser-bound today.** `bddgen` compiles `.feature` files into Playwright specs,
  `playwright.config.ts`'s `bdd` project runs them against a dev server, and every step module opens
  with "driving the real application in a real browser". A CLI feature has no browser, so it needs
  either a second Playwright project with no `webServer`, or a different runner entirely.
- **`npm run acceptance-mutation` mutates Examples tables and reruns the generated spec.** A
  `scripts/`-describing feature would land inside that runner's target set, which is a real gain —
  the acceptance layer would then police the CLI contract — but it is also a new input to a program
  this epic is otherwise trying to leave alone.

## Question

What is the smallest version that tests the premise: that a `scripts/` program's contract is better
stated as a scenario than as a unit-test suite?

## Sketch

**Pilot one program, and pick the one whose contract is already a sentence.** `prose-lint` is the
candidate: four modules, 10 exports, and a contract that fits in four clauses. `halstead4ts` is the
other shape worth considering — 2 exports already, so it is the closest thing to a deep module in the
tree and would show what the ceiling looks like.

Order, each step answerable before the next:

1. **Write the feature first, as prose, and see whether it says anything the unit tests do not.** If
   the scenarios read as a restatement of `decide.test.ts`, the premise is refuted cheaply and the
   entry closes with that finding.
2. **Then ask what runs it.** A CLI scenario needs a runner that spawns a process and asserts on exit
   code and streams. That is not Playwright, and inventing a second BDD runner is a larger change than
   the pilot warrants — so measure whether an existing one fits before building.
3. **Then ask what narrows.** With the contract stated externally, which of the 10 exports exist only
   for a test? Those are the candidates for becoming module-private, and the count is the measurement
   that says whether deep-module is reachable here at all.

**The encapsulation half can proceed without the Gherkin half.** `mutation-invariance-should-name-which-runner-to-run`
already carries an audit of what `scripts/` reads outside its own tree, and that audit is the
prerequisite for both entries. Read it first.

## Touches

`scripts/<program>/` for the pilot. A new home for CLI features, or a widening of `features/**` —
which is a role-scope change and belongs to the user, not to a slice. `playwright.config.ts` if a
second project is the answer. `.claude/agents/product.md` if the manifest boundary moves.

## Open questions

- **Does a CLI contract want Gherkin at all, or a golden-file test?** A scenario's value is that a
  stakeholder can read it. The stakeholder for `mutation-invariance` is the orchestrating session and
  `hardener`, both of which read TypeScript fluently. That is an argument the pilot has to beat.
- **What happens to CRAP and the mutation gate under a narrow interface?** A module-private function
  is still mutated, but it is reached only through the public surface, so a survivor becomes harder to
  kill precisely. Measure on the pilot rather than assuming either direction.
- **Is `run.ts`'s exclusion from the gates a symptom of this?** `**/run.ts` is excluded from crap4ts,
  dry4ts and Stryker because it is the I/O shell. Under a deep module the shell would be most of the
  program, which makes that exclusion much larger than it is today.

## Related

[[scripts-boundary]] is the epic over this entry and
[[mutation-invariance-should-name-which-runner-to-run]], whose encapsulation audit is the shared
prerequisite. This entry carries a second blocker the other does not: whether a CLI feature may live
under `features/**` at all is a user ruling about `product`'s manifest.
