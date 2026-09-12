# Rationale: `product`

Evidence behind the rules in `.claude/agents/product.md`. No role has a read trigger for this file.
It is read when a rule in that file is being changed, never in order to follow one.

Every rule these records produced is stated in the role file and is actionable there without this
one. Nothing here restates a rule.

## Why the write boundary is prose rather than a tool allowlist

`product.md` says never to write under `src/` or `scripts/` in either mode, and says nothing about
why the `Write` and `Edit` tools are in the frontmatter allowlist anyway.

The boundary used to be carried by that allowlist. That arrangement was dishonest in both directions
after the merge that created this role from the former `qa` and `specifier` roles: it writes real
TypeScript — the `features/steps/*.ts` step modules, `features/screenplay/*.ts`, the Playwright specs
— so it needs the write tools, and holding them implied a reach it does not have.

It is also not a rule carved for this role. `handoffs.md` already binds every role: "Never edit a
file your slice's approved scope does not cover, even to fix something that is obviously broken."
What the merge changed is that the old `qa` was the one role exempt from it.

`LSP` is in the allowlist for the same reason and reads the same way: go-to-definition over `src/` is
how this role finds what is observable, and it is a reading tool here.

## What `delete-step-test-layer` removed, and why the runner claim is now simple

`product.md` states that Playwright is the only runner under `features/`. That is a one-line fact
today because a layer was deleted rather than because it was always true.

Before `delete-step-test-layer`, `features/` held jsdom step tests as well, a fourth `acceptance`
vitest project collected them, and their coverage landed on `src/`. Several claims elsewhere in the
corpus rested on that project and became false when it went: `crap4ts` could move on a
`features/`-only diff, and stages 5 and 6 of `hardener`'s sequence saw different test sets.

`acceptance-mutation` moved with it. It mutates the spec and asks whether the steps notice, so it
belongs to whoever owns both sides of that question, which is this role. `hardener` ran it before the
merge.

## Where the merge-protocol figure comes from

`product.md` tells VERIFY to record the acceptance-mutation figure, and the merge protocol's step 8
carries it forward. That figure came from `hardener`'s handoff until `acceptance-mutation` moved to
this role.

The consequence is recorded in `orchestration.md` rather than here: a slice with no behaviour change
runs no VERIFY, so step 8 has no handoff to read and the merge record says the step is moot.

## The formatting claim that was wrong before it was right

`product.md` says Prettier covers `.feature` files, so Examples-table alignment is not hand work.
The role this one replaced claimed the opposite. `prettier-plugin-gherkin` is installed and
configured, which settles it; the earlier claim predates that plugin landing.
