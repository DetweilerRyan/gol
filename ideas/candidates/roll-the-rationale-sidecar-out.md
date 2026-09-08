---
name: roll-the-rationale-sidecar-out
title: Split the remaining articles into instruction files and rationale sidecars, in a measured order
created: 2026-09-08
---

## Situation

`rationale-sidecar-pilot` proved the tier on one file and Ryan signed it off. `doc-comments.md` is split,
`prose-linting.md` and its own sidecar were then written under the tier from scratch, and CLAUDE.md's
routing test carries a branch for it. `.claude/agents/articles/` holds fourteen articles and two sidecars;
two of the fourteen are done.

The tier is no longer a proposal. What is missing is an order for the other twelve articles, and a
decision about the four that should probably never be split at all.

## Complication

**Rank by absolute rationale, not by share.** Share is a ratio, and reading it as value is the mistake
this section originally made. Multiplying each article's measured rationale share by its current size —
excluding the four ruled out below:

| article                  | share |  bytes | ~rationale bytes | `architect`'s pick |
| ------------------------ | ----: | -----: | ---------------: | ------------------ |
| `testing-layers.md`      |   30% | 44,353 |           13,306 | —                  |
| `mutation-testing.md`    |   28% | 45,362 |           12,701 | **first**          |
| `quality-tooling.md`     |   32% | 30,206 |            9,666 | —                  |
| `architecture.md`        |   20% | 36,810 |            7,362 | —                  |
| `ast-grep-rules.md`      |   16% | 42,467 |            6,795 | **second**         |
| `state-flow.md`          |   15% | 27,298 |            4,095 | —                  |
| `acceptance-mutation.md` |   11% | 26,554 |            2,921 | —                  |
| `archive.md`             |   26% | 10,044 |            2,611 | —                  |

Shares measured on `bac96c4` by the block classifier described in `rationale-sidecar-pilot`; read them as
upper bounds, since the classifier agrees with hand labels about two times in three and errs toward
over-reporting rationale. Byte counts are current.

**`architect`'s picks rank second and fifth by absolute saving.** An earlier draft of this candidate said
seventh and tenth, ranked by share, and framed the two criteria as disagreeing enough to need settling
empirically. `architect` refuted that in REVIEW: most of the apparent disagreement was the ratio. Its
stated criterion — measurement-dense with a thin instruction core — and the byte ranking mostly agree,
and where they differ, its picks are cheaper splits rather than smaller ones. `ast-grep-rules.md` also
carries **84** backticked slice slugs, the most in the corpus by a factor of three, so it is dense in
exactly the history a sidecar is for.

**Four files are ruled out, and applying the reason properly is what makes it four rather than two.**
`architect` named `engineering.md` and `workflow.md`. That reason reaches two more it did not name:
`handoffs.md` is the third house-rules article — CLAUDE.md: "Three articles are house rules every role
reads unconditionally" — and `orchestration.md` is read at session start by the seat that runs the roles.

**But the reason is weaker than it first looks, and the weakness is worth carrying.** The stated case is
that splitting an unconditionally-read file moves argument out of the one place everyone sees. CLAUDE.md's
own routing preamble argues the opposite: auto-loading is "a cost, not a distribution channel", and
CLAUDE.md itself was shrunk on exactly that logic. On that reading, the unconditional files are the ones
to split **hardest**. The two positions are not reconciled here, and `engineering.md` — 18,043 bytes of
rationale, the largest mass in the corpus — is what hangs on it.

Two of the four have a second, independent defence that does not depend on the argument above:
`workflow.md` (1,486 rationale bytes) and `handoffs.md` (3,161) are simply too small to be worth a second
file. `orchestration.md`'s real defence is that it is 94% entangled, so its split is expensive rather than
that it has many readers — it has exactly one.

## Question

Which order, and by which criterion — the largest measured saving, or the cheapest and most legible
split?

## Answer

**Take `architect`'s ordering, and treat the disagreement as the thing to resolve empirically rather
than by argument.**

Split `mutation-testing.md` first and `ast-grep-rules.md` second — second and fifth by absolute saving,
and the two `architect` judged cheapest to split well. `testing-layers.md` is the largest available
target and is a reasonable substitute for either if effort is the constraint rather than legibility.

**Do not split any of the four** without a separate decision, and treat `engineering.md` as the one that
genuinely needs one: it holds the largest rationale mass in the corpus, and the argument protecting it is
the one the Complication shows is contested.

**`CLAUDE.md` is out of scope here** and needs its own slice if it is ever split. It is not an article,
it is auto-loaded rather than triggered, and its 48% rationale share is the largest single number in the
corpus — which makes it the biggest prize and the highest risk in the same breath.

### What each split must carry

The pilot established these, and they are not optional:

1. **A closed-decision marker** stays in the instruction file wherever rationale that records a settled
   question moves out. One line per closed decision, naming the question and pointing at the sidecar,
   carrying the fact and never the argument.
2. **The sidecar is exempt in `.vale.ini`**, and exemption means both an empty `BasedOnStyles` **and**
   every enabled rule switched off by name in that section. See `prose-linting.md`; the pairing failed
   silently once already.
3. **An audit of the pair afterwards**, by hand, against the article as it stood before. Nothing checks
   this — `reference-check` and `agent-doc-check` both stay green while a pair drifts, because every
   filename still resolves. Six passes on the pilot dropped fifteen illustrations out of the pair before
   an audit caught them.
4. **A before/after measurement** recorded in the sidecar, so the next split has a comparison.

## Touches

Per slice: one `.claude/agents/articles/<name>.md`, a new `<name>.rationale.md` beside it, and
`.vale.ini`'s sidecar section. CLAUDE.md only if the article's pointer line needs rewording.

**Sizing.** One article per slice, and that is a real constraint rather than caution: entanglement runs
64–100% across these files, so each split is a rewrite of the mixed blocks rather than a move. All paths
are inside the mutation-invariant allowlist, including `.vale.ini` and `.vale/**`, which
`rationale-sidecar-pilot` added to it. Check CLAUDE.md's predicate rather than recalling it — a REVIEW of
this candidate read the pre-amendment list and called the claim false.

## Open questions

- **Is the unconditional-read argument sound?** It is what protects four files, and CLAUDE.md's own
  routing preamble argues the reverse. Settle this before anyone proposes splitting `engineering.md`,
  which is where the disagreement has real money on it.
- **Is there a floor below which a split is not worth it?** `acceptance-mutation.md` at 11% and
  `state-flow.md` at 15% may not have enough rationale to be worth a second file. The pilot's file was
  57%, so nothing measured yet speaks to the low end.
- **What happens to `archive.md`?** It is already a rationale-only file with no read trigger — the tier
  before the tier existed. It may need renaming to `<something>.rationale.md` for consistency, or it may
  be a deliberate exception worth keeping as is.
- **Do the role files get the same treatment?** `architect.md` at 35% and `product.md` at 33% carry real
  rationale, but they are not articles, Vale does not lint them (their front matter aborts the parser),
  and `workflow.md` forbids editing a role file without explicit user direction. A different slice with a
  different owner.
- **Should the audit in step 3 be mechanised?** A checker comparing an article against its sidecar for
  dropped content is conceivable — diff the pre-edit article against the union of the pair. It would pay
  full `scripts/` gate freight, and `orchestration.md` says search before building.
