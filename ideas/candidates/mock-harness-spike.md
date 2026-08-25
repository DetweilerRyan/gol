---
name: mock-harness-spike
title: Restructure the acceptance spike around a mock harness the coder chain builds, instead of a throwaway src/ implementation
created: 2026-08-24
---

## Context

The acceptance spike currently has `coder` write a **throwaway implementation in
`src/`** so `product` can run `acceptance-mutation` against something. That
implementation is **not committed** and is discarded by the orchestrator
(`git checkout -- src/`), guarded by two invariant checks re-run by `hardener` and
`product` VERIFY:

```
git status --porcelain -- src/ scripts/      # must be empty
git log --grep='\[spike\]' -- src/ scripts/  # must be empty
```

"The spike disposal doesn't hold" is listed as one of the conditions that would
make the whole programme not worth doing.

**The user's proposal:** `architect → coder → cleaner` build a **mock harness** —
the thing `product` actually needs in order to run `acceptance-mutation` — and
later the same chain rewires that harness to the real implementation. Nothing is
discarded; the harness is committed, permanent work.

## Why a mock is sufficient — the enabling fact

`acceptance-mutation` mutates a `.feature` Examples cell and asks whether the
**steps** notice. It measures **step plumbing, not implementation correctness**.
CLAUDE.md says so in its own words: the weaknesses it has surfaced "were in step
definitions absorbing a mutated value without noticing, not in the framework-free
modules themselves."

So a harness returning canned data measures exactly what that gate is for — and
isolates the plumbing question from implementation bugs, which the current spike
does not. The existing rule already permits faking: _"a hardcoded lookup producing
the right DOM is valid; a correct algorithm wired to a `data-testid` is not."_
This moves the fake from `src/` (throwaway) to the harness (committed).

## Why the seam already exists

`slice/split-acceptance-harness` landed `Board` as the interface between steps and
app, with `features/harness/board.tsx` as the core and one module per feature. **A
mock core and a real core are a swap behind that interface** — steps unchanged.
That is what makes "hook it up later" a rewire rather than a rewrite, and it is
why this is worth proposing now rather than before S2.

## The discipline it needs, and the precedent that proves it

**The mock may fake data. It may never fake an affordance.**

The concrete failure this prevents already happened: two `camera-pan-and-zoom`
scenarios assert **200%** and **50%** zoom. Those are reachable only because a
direct-call step called `zoomCameraAtPoint(camera, px, py, 2)` with a factor no UI
affordance produces — `ZOOM_FACTOR` is 1.25, so the reachable ladder is
125/156/195/244/300 up and 80/64/51/41/40 down. A convenient mock would accept
factor 2 just as happily.

The contract would then specify something the app can never satisfy, phase 2 would
fail, and the natural reading would be _"the implementation is wrong"_ when the
**contract** was wrong. That misdiagnosis is the whole cost of getting this rule
loose, and it is worth stating in the role file rather than assumed.

## Prior art, and the objection it raises

**The closest established analogue argues the other way, and that should be answered
rather than skipped.** Freeman & Pryce's **walking skeleton** (GOOS ch. 4) is "the
thinnest possible slice of real functionality that we can automatically build,
deploy, and test **end-to-end**", with functionality kept "so simple that it's
obvious and uninteresting, leaving focus on infrastructure". The point is that it
_must_ run end-to-end, to give feedback about the system's real external interfaces.

A mock harness fakes precisely that layer. `mountBoard()`'s whole job **is** the
infrastructure — mount real `<App />`, query through ARIA. A mock core does not fake
the domain behind the harness; it replaces the harness.

**The objection does not land here, for a reason specific to this repo: the walking
skeleton already exists.** The Playwright layer runs against a real built app in a
real browser, 59 specs, and is the final gate before a slice lands. `architect`
established the two layers are **nested** — acceptance sees a strict subset of the
routes e2e sees, plus no hit-testing. The acceptance layer was never the end-to-end
proof, so faking it does not cost what GOOS warns about. Write that down; it is the
first question a reviewer who knows the literature will ask.

## The mechanism that closes the "stays mocked forever" hole

**Verified fakes.** The standard answer to fake-drift is to write the tests against
the interface's public contract and run **that same suite against both the fake and
the real implementation** — that is what makes a fake _verified_ rather than merely
convenient. Google's SWE book treats it as the price of using fakes at all: _"a fake
without tests might initially provide realistic behavior, but without tests, this
behavior can diverge over time as the real implementation evolves."_

This maps directly onto the seam `split-acceptance-harness` landed. **`Board` is the
contract.** Write the contract suite once; run it against the mock core and the real
core. **Phase 2 is done when the real core passes the identical suite** — which
answers this file's own open question about what proves the rewire happened, and
answers it with a passing suite rather than a residue check.

It also makes the fake-data-never-affordances discipline **mechanical**: if the
contract suite says "zooming in once reaches 125%", a mock offering factor 2 fails
it. The rule stops depending on whoever writes the mock remembering the rule.

## Name it a fake, not a mock

The literature separates **fakes** (working in-memory implementations) from **mocks**
(behaviour verification), and the prevailing advice is _"fake, don't mock"_. This
proposal is a fake. Calling it a mock in the role files would invite the wrong
implementation — a harness asserting on interactions rather than one that simply
works.

## What it changes

- **The spike loses its discard machinery** — no `git checkout -- src/`, no
  `[spike]` residue checks, no "disposal doesn't hold" failure mode.
- **Harness ownership moves** from `product` to `architect → coder → cleaner`.
  That is a real boundary change: `features/**` is currently `product`'s exclusive
  manifest, and it has held all session.
- **`product` keeps the contract** — `.feature`, steps, the outline,
  `acceptance-mutation`, sign-off. It stops owning the infrastructure underneath.

## Touches

`.claude/agents/product.md` and `.claude/agents/coder.md` (role boundaries),
`.claude/agents/architect.md` (a DESIGN obligation for the mock/real seam),
`CLAUDE.md`'s pipeline section, and the manifest rule that `features/**` is
`product`'s alone. **A role-definition change needs explicit user direction**
(`workflow.md`), and `architect` authors it — `product` cannot author its own
new boundary.

## Open questions

- **Does the harness get gated once the coder chain owns it?** Today
  `features/harness/board.tsx` is **360 lines outside `crap4ts`, `dry4ts`, and
  mutation testing** — larger than every file in `src/test-support/` (biggest:
  `domStubs.ts` at 114), which is the peer category whose exclusion justified
  leaving it ungated. Moving ownership without moving the gates buys the
  round-trip cost and none of the verification: `cleaner`'s tools are `src/`-scoped
  and would have nothing to measure. **This question probably has to be answered
  first.**
- **Does a mock harness weaken `architect`'s CONTRACT mode?** That mode asks
  whether a drafted contract is observable through the UI _at all_. A mock can
  answer "yes" for something the real app cannot do — which is exactly the
  200%/50% failure. Perhaps CONTRACT review must precede the mock rather than
  follow it.
- **Who writes the phase-2 rewire, and what proves it happened?** A harness that
  stays mocked forever is worse than no harness — the steps would be green against
  nothing. There needs to be a check that the real core is wired, analogous to the
  spike-residue checks this replaces.
- Whether the mock lives in the core (`board.tsx`) or per-feature. The per-feature
  modules never mount today, by design; a mock core would invert that.
