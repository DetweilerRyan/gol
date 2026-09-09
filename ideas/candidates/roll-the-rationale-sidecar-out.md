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

| article                   | share |  bytes | ~rationale bytes | `architect`'s pick |
| ------------------------- | ----: | -----: | ---------------: | ------------------ |
| `testing-layers.md`       |   30% | 44,353 |           13,306 | —                  |
| ~~`mutation-testing.md`~~ |   28% | 45,362 |           12,701 | **DONE** — first   |
| `quality-tooling.md`      |   32% | 30,206 |            9,666 | —                  |
| `architecture.md`         |   20% | 36,810 |            7,362 | —                  |
| `ast-grep-rules.md`       |   16% | 42,467 |            6,795 | **second**         |
| `state-flow.md`           |   15% | 27,298 |            4,095 | —                  |
| `acceptance-mutation.md`  |   11% | 26,554 |            2,921 | —                  |
| `archive.md`              |   26% | 10,044 |            2,611 | —                  |

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

## Progress

| slice                            | article               | landed  |
| -------------------------------- | --------------------- | ------- |
| `split-mutation-testing-article` | `mutation-testing.md` | pending |
| `split-ast-grep-rules-article`   | `ast-grep-rules.md`   | pending |

**Two splits done, ten articles left of the twelve splittable.** `ast-grep-rules.md` is next by
`architect`'s ordering — 84 backticked slice slugs, the most in the corpus by a factor of three, and a
rule roster that mandate 5 will have to re-derive against `rules/`.

**What the first split taught, beyond its own findings.** Mandates 2 and 4 were both defective and are
rewritten above; mandate 5 did not exist and was added because the pair audit is structurally blind to a
claim that was already false. Mandate 5 then earned itself immediately: on a second pass over the same
article it caught a gate enumeration naming five commands where CLAUDE.md marks seven.

## Question

Which order, and by which criterion — the largest measured saving, or the cheapest and most legible
split?

## Answer

**Take `architect`'s ordering.** The two rankings mostly agree once share is converted to bytes, so
there is no disagreement left to settle — an earlier draft of this Answer proposed settling one, and the
Complication above is what removed the need.

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
2. **Verify the sidecar is exempt — do not edit `.vale.ini`.** The exemption is glob-scoped to
   `.claude/agents/articles/**/*.rationale.md`, so it already covers every future sidecar on creation.
   Confirm it with one command: `vale <new>.rationale.md` must report zero. **An earlier version of this
   mandate said to edit that file, which is wrong** — `split-mutation-testing-article` correctly diverged
   from it, and a second author following it literally would either make a no-op edit or, reading "in
   that section" as licence, author a redundant per-file section. The two-part pairing it described is
   real but belongs to enabling a _rule_, not to adding a sidecar; `prose-linting.md` carries it.
3. **An audit of the pair afterwards**, by hand, against the article as it stood before. Nothing checks
   this — `reference-check` and `agent-doc-check` both stay green while a pair drifts, because every
   filename still resolves. Six passes on the pilot dropped fifteen illustrations out of the pair before
   an audit caught them.
4. **A before/after measurement recorded in the sidecar's own intro, taken after the final commit**, so
   the next split has a comparison. **Re-measure at the end and cite the commit it was taken on** — the
   second split recorded figures taken mid-pass and got four rows wrong, in the flattering direction,
   in the one artifact whose whole job is to be accurate. Name the unit: article bytes before, article and sidecar bytes after, rationale-only
   bytes, entanglement, backticked slice-slug counts, and Vale findings on the article. **State the
   absolute rationale figure, not the share** — the share is a ratio and moves the wrong way, which is
   recorded in `prose-linting.rationale.md`. This is the mandate the first split skipped, because it
   named an obligation without naming the measurement or where it goes.
5. **Re-derive every sentence that enumerates or quantifies over another file's contents**, from that
   file, during the split. Do not carry it across. Mandate 3's audit compares the pair against the
   article as it stood before, so it is structurally blind to a claim that was **already false** — and
   both substantive findings on the first split were exactly that shape: "every entry on the allowlist"
   naming five of seven, and "the exposure is bidirectional" describing one direction. An audit preserves
   those faithfully because they were preserved faithfully.
6. **Re-point every inbound reference to the article you split.** Mandate 3 audits the pair against its
   own past and is structurally blind to who points **at** it — which is how the second split left both
   of CLAUDE.md's pointers describing an article that no longer held what they claimed. **This will
   recur on every remaining split**, because each article has a CLAUDE.md pointer line describing its
   contents and a split invalidates it. One command:
   `grep -n "<article>.md" CLAUDE.md .claude/agents/*.md .claude/agents/articles/*.md`. Expect the
   manifest to grow by CLAUDE.md as a result.

## Touches

Per slice: one `.claude/agents/articles/<name>.md` and a new `<name>.rationale.md` beside it. **Not
`.vale.ini`** — see mandate 2. CLAUDE.md only if the article's pointer line needs rewording.

**Sizing.** One article per slice, and that is a real constraint rather than caution: entanglement runs
64–100% across these files, so each split is a rewrite of the mixed blocks rather than a move. All paths
are inside the mutation-invariant allowlist, including `.vale.ini` and `.vale/**`, which
`rationale-sidecar-pilot` added to it. Check CLAUDE.md's predicate rather than recalling it — a REVIEW of
this candidate read the pre-amendment list and called the claim false.

## Open questions

- **Is the unconditional-read argument sound?** It is what protects four files, and CLAUDE.md's own
  routing preamble argues the reverse. Settle this before anyone proposes splitting `engineering.md`,
  which is where the disagreement has real money on it.
- **Is there a floor below which a split is not worth it?** Ask it in bytes, not shares. `archive.md`
  (2,611), `acceptance-mutation.md` (2,921) and `state-flow.md` (4,095) are the three smallest, and
  `archive.md` is smallest of all despite a 26% share — which is the share-as-value error surviving in
  the one question the rewrite first missed. The pilot's file carried far more, so nothing measured yet
  speaks to the low end.
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
