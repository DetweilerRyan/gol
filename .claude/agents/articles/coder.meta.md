# Rationale: `coder`

Evidence behind the rules in `.claude/agents/coder.md`. No role has a read trigger for this file.
It is read when a rule in that file is being changed, never in order to follow one.

Every rule these records produced is stated in the role file and is actionable there without this
one. Nothing here restates a rule.

## Why the test-duration budget exists, and who failed to watch it

Mutation cost is `mutants × the runtime of the tests covering them`, and Stryker's
`coverageAnalysis: "perTest"` means one slow test file taxes every mutant it covers — not just the
mutants in the file it tests. `cleaner` already watched the first factor (its 100+ mutant-count
heuristic); nobody watched the second, and `src/components/Grid.test.tsx` reached 38 tests taking
19.88s before it was caught. The calibration anchors the role file's ~1s budget was set against:
`src/camera.test.ts` ran 26 tests in ~4ms on the same tree that measured the 19.88s.

The ~50ms/test heuristic for jsdom component tests came from the same incident. The unbounded
collection in that case was one `<button>` per visible cell, which a viewport-sized stub pushed into
the thousands.

## Why the boundaries clause says invocations can be wrong

The orchestrating session had made exactly that mistake, repeatedly — invoking `coder` with
instructions to run another role's gates — and no coder caught it, because an explicit instruction
felt more authoritative than the role file. It is not: the boundary list is the contract, and the
clause telling `coder` to decline was added so the next wrong invocation gets caught instead of
obeyed.

## Why the `rules/*.yml` prohibition names the disarming mechanism

Making an ast-grep finding disappear by loosening the rule that produced it disarms the check for
everyone afterward, and it does so invisibly, since a dead rule and a satisfied rule look identical.
The role file keeps only the one-clause form of that argument; this is the full account it
compressed.

## The workflow's step 2 once contradicted the Boundaries section

Before `delete-step-test-layer`, the repo carried a jsdom step layer that `coder` co-owned, and the
workflow step telling `coder` to read the step modules also implied it could edit them. That slice
removed the layer — every step definition is now a Playwright-BDD module under `features/steps/` —
and the step was rewritten to defer to Boundaries, which had always said the whole of `features/**`
is `product`'s.

## Why the doc-placement rule is called measured rather than stylistic

The claim that a JSDoc block on a `return { … }` literal, or on the implementing declaration of an
annotated return type, is silently severed from every caller was established by measurement, not
style preference. The measurements live in `doc-comments.meta.md`; the role file carries only
the resulting placement rule and its acceptance test.

## A sentence deleted rather than moved

The role file once said, of the doc-comments read trigger: "The read trigger and the duty are the
same article, and they only pay off together." That defended a rule nobody disputes — it urged
compliance without changing what a reader does — so `strip-coder-to-instruction` deleted it rather
than moving it here as evidence.
