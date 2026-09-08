---
name: roll-the-rationale-sidecar-out
title: Split the remaining articles into instruction files and rationale sidecars, in a measured order
created: 2026-09-08
---

## Situation

`rationale-sidecar-pilot` proved the tier on one file and Ryan signed it off. `doc-comments.md` is split,
`prose-linting.md` and its own sidecar were then written under the tier from scratch, and CLAUDE.md's
routing test carries a branch for it. Two of the sixteen files in `.claude/agents/articles/` are done.

The tier is no longer a proposal. What is missing is an order for the other twelve articles, and a
decision about the four that should probably never be split at all.

## Complication

**The obvious ordering and `architect`'s ordering disagree, and neither is obviously right.**

Ranking by measured rationale share says take the biggest wins first. `architect` ranked by shape
instead — "measurement-dense with a thin instruction core" — after its cold read of the pilot. Those
give different answers:

| article                  | rationale bytes | entanglement | slice-slug mentions | rank by share | `architect`'s pick |
| ------------------------ | --------------: | -----------: | ------------------: | ------------: | ------------------ |
| `handoffs.md`            |             51% |          67% |                   0 |             1 | **leave alone**    |
| `orchestration.md`       |             45% |          94% |                   0 |             2 | **leave alone**    |
| `quality-tooling.md`     |             32% |         100% |                  46 |             3 | —                  |
| `testing-layers.md`      |             30% |         100% |                  50 |             4 | —                  |
| `engineering.md`         |             29% |          82% |                  30 |             5 | **leave alone**    |
| `workflow.md`            |             29% |          64% |                   0 |             6 | **leave alone**    |
| `mutation-testing.md`    |             28% |          92% |                  22 |             7 | **next**           |
| `archive.md`             |             26% |          71% |                   8 |             8 | —                  |
| `architecture.md`        |             20% |         100% |                  10 |             9 | —                  |
| `ast-grep-rules.md`      |             16% |         100% |              **84** |            10 | **next**           |
| `state-flow.md`          |             15% |          92% |                  11 |            11 | —                  |
| `acceptance-mutation.md` |             11% |         100% |                  14 |            12 | —                  |

Measured on `bac96c4` by the block classifier described in `rationale-sidecar-pilot`; read the shares as
upper bounds, since the classifier agrees with hand labels about two times in three and errs toward
over-reporting rationale.

**`architect`'s picks rank 7th and 10th by share.** Its reasoning was that a thin instruction core makes
the split cheap and the result legible, not that the saving is largest. The slug counts support it:
`ast-grep-rules.md` carries **84** backticked slice slugs, the most in the corpus and three times the
next article, so it is dense in exactly the history a sidecar is for even though its rationale _share_
is low.

**Four files are ruled out, and applying the reason properly is what makes it four rather than two.**
`architect` named `engineering.md` and `workflow.md`: both are read **unconditionally**, so splitting
them moves argument out of the one place everyone already sees. The tier relieves _triggered_ reading,
and there is no trigger to relieve on a file nobody may skip.

That reason reaches two more files `architect` did not name. **`handoffs.md` is the third house-rules
article** — CLAUDE.md: "Three articles are house rules every role reads unconditionally" — and
**`orchestration.md` is read at session start** by the seat that runs the roles. Both are unconditional
by the same test.

**This matters more than it sounds, because `handoffs.md` ranks first by share.** A reader taking the
obvious ordering would split the highest-value file in the corpus and get the tier's worst case: less
argument in front of the only readers who never chose to open it. The structural rule beats the
measurement here, and the measurement is what points the wrong way.

## Question

Which order, and by which criterion — the largest measured saving, or the cheapest and most legible
split?

## Answer

**Take `architect`'s ordering, and treat the disagreement as the thing to resolve empirically rather
than by argument.**

Split `mutation-testing.md` first and `ast-grep-rules.md` second. Then measure both against
`doc-comments.md`'s result and decide whether share or shape is the better predictor before continuing.
Two data points against one is enough to tell whether the ranking matters at all.

**Do not split `engineering.md` or `workflow.md`** without a separate decision. The argument against is
in the Complication and it is structural, not a preference.

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
are inside the mutation-invariant allowlist.

## Open questions

- **Does the ordering criterion matter at all?** The Answer above assumes it might. Two splits will say.
  If share and shape predict the same effort, rank by share and stop thinking about it.
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
