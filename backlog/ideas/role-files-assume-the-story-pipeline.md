---
name: role-files-assume-the-story-pipeline
title: Rewrite the role files' Story-only assumptions to hold under every pipeline kind
created: 2026-09-17
---

## Situation

`pipelines.md` landed 2026-09-16 with per-kind pipelines: an Enabler runs no `product` in
either mode, and a Spike runs no pipeline at all. The five role files predate the kinds and
were written assuming the Story cycle is the only way a role executes. Audited 2026-09-17 on
the user's instruction; findings collected here, deliberately not acted on.

## Complication

The findings, per file, each quoting the live phrasing:

**`coder.md`** — the heaviest set. Its whole framing assumes an approved `product` contract
exists:

- Intro: "You implement exactly the behavior slice `product` has already had approved —
  nothing more, nothing less." In an Enabler there is no `product` and no approval; the
  authority is the ready item's `proposal.md` (and `design.md` when one exists), handed as
  prompt content.
- Owns: "Delivery of one approved behavior slice, via TDD, based on the latest accepted
  `features/*.feature` scenarios." An Enabler has no `.feature`.
- Workflow steps 1–2: read the approved `.feature` and its step modules — unexecutable in an
  Enabler.
- Boundaries: "If the contract is wrong or unimplementable, report it to `product`" — no
  `product` invocation exists to receive it; the Enabler escalation target is the seat.
- Boundaries: "Do not implement behavior the approved spec does not call for" — right rule,
  Story-only phrasing; the Enabler analogue is the proposal's ruled scope.
- Frontmatter description: "Invoke it once an approved, committed .feature file exists" — the
  seat's selection summary refuses the Enabler case on its face.

**`product.md`** — intro: "You open and close every slice, in two modes." False under the
kinds: it opens and closes Story slices only. The rest of the file is legitimately
Story-scoped, since the role only runs there.

**`cleaner.md`** — two smaller instances:

- "If you find a missing feature, note it for `product` instead of building it" — in an
  Enabler the note has no `product` to reach; it belongs in the handoff for the seat.
- "that is `product`'s concern in VERIFY mode, not yours" — harmless when no VERIFY exists,
  but stated as if one always does.

**`hardener.md`** — one instance: "that is `product`'s concern in VERIFY mode, run
independently **after you**" — asserts a step that does not run in an Enabler; the
sequencing half of the sentence is the Story pipeline's, not the role's.

**`architect.md`** — two soft instances:

- "Keeping the architecture aligned with the specs and implementation" — an Enabler's
  acceptance criteria are fitness functions, not specs; the sentence still reads
  Gherkin-shaped.
- ADJUDICATE's corrective exception is bounded by "the already-accepted contract" — correct
  for the mode (ADJUDICATE only fires from VERIFY, which is Story-only), so arguably fine;
  listed for completeness.

The general shape: each role states its **authority source** (approved `.feature`, `product`'s
contract) and its **escalation target** (`product`) in Story terms, where the per-kind truth is
"the authority and the escalation target arrive in the invoking prompt, per `pipelines.md`".

## Question

How should the role files phrase authority and escalation so they hold under every kind —
per-kind wording in each file, or kind-neutral wording ("the contract the invoking prompt
names") with `pipelines.md` supplying the kind?

## Answer

Shaped only, with two competing forms the slice must choose between:

- **Kind-neutral wording** — "the contract the invoking prompt names" — fits the landed
  ownership principle (role files hold within-invocation facts, `pipelines.md` holds
  between-invocation facts) and keeps roles kind-blind, which the board redesign ruled.
- **Separate modes for `coder`** — raised by the user 2026-09-17, as a question rather than a
  ruling. The precedent exists: `product` and `architect` are already mode-bearing, with the
  prompt naming the mode. A contract-driven mode (authority: the approved `.feature`) beside a
  proposal-driven mode (authority: the ready item's proposal and design) would make the
  authority difference explicit instead of neutral — at the cost of a mode contract the seat
  must supply, and `architect.md`'s silent-default hazard shows what an unnamed mode does.

Not specified per file; choosing between the forms is the slice's work.

## No-gos

- No role gains kind awareness or reads the board; the prompt still carries everything.
- `product.md` stays Story-scoped beyond its intro sentence — the role genuinely only runs
  there.

## Open questions

- Do the frontmatter descriptions change too? They are harness-facing selection summaries the
  seat reads at agent choice — `coder`'s currently refuses the Enabler case outright, which
  argues yes, against the pipeline-reference slice's leave-unthinned judgment.
- Does `handoffs.md` carry the same assumption class? Not audited — this pass covered the five
  role files only, per the instruction.
