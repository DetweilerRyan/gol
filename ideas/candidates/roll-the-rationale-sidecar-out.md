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
to split **hardest**. The two positions were not reconciled when this was written, and `engineering.md`
— then 18,043 bytes of rationale, the largest mass in the corpus — was what hung on it. **Settled
2026-09-09 by the user, for the second position**, and `split-engineering-article` acted on it. The
ruling and what it did not concede are in `engineering.rationale.md`. The reconciling argument is
mandate 1: a closed-decision marker keeps the settled fact in the unconditionally-read file while the
argument moves out, so the first position's concern is answered rather than overridden.

Two of the four have a second, independent defence that does not depend on the argument above:
`workflow.md` (1,486 rationale bytes) and `handoffs.md` (3,161) are simply too small to be worth a second
file. `orchestration.md`'s real defence is that it is 94% entangled, so its split is expensive rather than
that it has many readers — it has exactly one.

## Progress

| slice                            | article               | landed |
| -------------------------------- | --------------------- | ------ |
| `split-mutation-testing-article` | `mutation-testing.md` | landed |
| `split-ast-grep-rules-article`   | `ast-grep-rules.md`   | landed |
| `split-engineering-article`      | `engineering.md`      | landed |
| `split-testing-layers-article`   | `testing-layers.md`   | landed |
| `split-quality-tooling-article`  | `quality-tooling.md`  | landed |

**Five splits done, seven articles left of the twelve splittable.** The next target is unchosen.
`architecture.md` is now the largest remaining, and it carries **no heading structure** — one H3 over a
flat module list — so routing prose into it means inventing headings it does not have.

**The ranking table in the Complication is inflated, and by enough to change the ordering.** Its
`~rationale bytes` column multiplies a share measured on `bac96c4` by a current byte count. Both rows
measured directly since disagree by a factor near two or three: `testing-layers.md` held 4,877 rationale
bytes against the 13,306 listed, and `quality-tooling.md` 5,742 against 9,666. Every row is built the same
way. **Re-measure a candidate before planning against it, and do not rank from that table as it stands.**

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

**Do not split any of the remaining three** — `workflow.md`, `handoffs.md`, `orchestration.md` — without
a separate decision. `engineering.md` was the fourth and has had its decision: ruled 2026-09-09 for
splitting, and split. Note that the other three each have an **independent** defence that never rested on
the contested argument, so that ruling does not carry across to them. `workflow.md` (1,486 rationale
bytes) and `handoffs.md` (3,161) are too small to be worth a second file, and `orchestration.md` is 94%
entangled, so its split is expensive rather than protected.

**`CLAUDE.md` is out of scope here** and needs its own slice if it is ever split. It is not an article,
it is auto-loaded rather than triggered, and its 48% rationale share is the largest single number in the
corpus — which makes it the biggest prize and the highest risk in the same breath.

### What each split must carry

The pilot established these, and they are not optional. Seven, and mandates 4 through 7 were each added or rewritten after a split found the previous wording insufficient:

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
   **This mandate covers the sidecar only — mandate 6 covers linting the article.**
3. **An audit of the pair afterwards**, by hand, against the article as it stood before. Nothing checks
   this — `reference-check` and `agent-doc-check` both stay green while a pair drifts, because every
   filename still resolves. Six passes on the pilot dropped fifteen illustrations out of the pair before
   an audit caught them.

   **Run it after the lint pass, not after the split, because the two passes fight.** The splitting pass
   places content deliberately; the shortening pass then deletes some of what it placed, and neither
   notices. Measured on `split-engineering-article`: a mandate-6 rewrite compressed one bullet and took
   `triage-paired-specs` and its 35-test figure out of the pair entirely, rather than moving them. A
   practical audit is mechanical — extract every backticked slice slug and every distinctive figure from
   the pre-split article, and assert each still appears somewhere across the pair.

4. **A before/after measurement recorded in the sidecar's own intro, taken after the final commit**, so
   the next split has a comparison. **Re-measure at the end and cite the commit it was taken on** — the
   second split recorded figures taken mid-pass and got four rows wrong, in the flattering direction,
   in the one artifact whose whole job is to be accurate. Name the unit: article bytes before, article and sidecar bytes after, rationale-only
   bytes, entanglement, backticked slice-slug counts, and Vale findings on the article. **State the
   absolute rationale figure, not the share** — the share is a ratio and moves the wrong way, which is
   recorded in `prose-linting.rationale.md`. This is the mandate the first split skipped, because it
   named an obligation without naming the measurement or where it goes.

   **A "before" figure taken at any point after the work began is not a before figure.** The third split
   recorded a Vale baseline of 128 that was measured once the extraction commits had already shortened
   the article; the true pre-split count was 186. Derive every before row by linting or measuring the
   pre-split file itself — `git show main:<path>` into a scratch copy **placed inside the scoped
   directory**, since `.vale.ini` scopes by path and a copy at the repo root silently reports zero.

   **The sidecar byte figure is self-referential and needs a fixed point.** Writing the count into the
   sidecar changes the count. The third split first recorded 16,148 against an actual 19,812, wrong by
   3,664 and in the flattering direction. Settle the surrounding prose, measure, then substitute a
   numeral **of the same width** so the substitution is byte-neutral. The article figure has no such
   problem.

   **The rationale-bytes and entanglement rows are confounded by mandate 6, and the byte count is the row
   that compares.** A block-level classifier calls a block rationale when no sentence in it carries a
   directive. Mandate 6 splits sentences and paragraphs, so it changes block granularity drastically —
   34 blocks to 78 on one article, 41 to 73 on another — and smaller blocks are likelier to hold no
   directive. The same prose then reclassifies without a word of it changing, and the figure moves the
   wrong way. **A block-level classifier cannot compare a file against itself across a pass that changes
   paragraph granularity.** Every prose split so far ran mandate 6, so their rationale-bytes rows all
   carry this confound in the same direction, understating the reduction.

   **Format, then measure, then substitute.** Prettier realigns a table column, so a substitution written
   against the pre-format alignment silently misses and leaves the placeholder in place. Measured on the
   fourth and fifth splits, in that order: the fifth hit it, the fourth avoided it by running the steps
   this way round.

   **Expect entanglement to rise on a prose article, and do not promise otherwise.** It measures the
   share of directive-carrying blocks that also carry non-directive prose, so removing whole evidence
   blocks raises it by construction. Measured on `engineering.md`: 82% to 91%, with rationale bytes down
   only 28% against a 33% fall in total bytes. **The tier redistributes an enumeration far better than it
   redistributes argument** — `ast-grep-rules.md` fell 87% because 70% of it was one grammatical list
   that moved verbatim, and prose does not offer that. **One counter-example exists and it is instructive
   rather than contradictory**: `quality-tooling.md`'s entanglement _fell_ 12 points, because it held
   several separable evidence blocks — a declined-rule roster, a patch mechanism, probe methods — that
   could leave whole rather than being unwoven. That is the enumeration case wearing prose clothing, not
   a reason to expect a fall on argument.

5. **Re-derive every sentence that enumerates or quantifies over another file's contents**, from that
   file, during the split. Do not carry it across. Mandate 3's audit compares the pair against the
   article as it stood before, so it is structurally blind to a claim that was **already false** — and
   both substantive findings on the first split were exactly that shape: "every entry on the allowlist"
   naming five of seven, and "the exposure is bidirectional" describing one direction. An audit preserves
   those faithfully because they were preserved faithfully.
6. **Run Vale over the new instruction file, and act on it per `prose-linting.md`.** The split rewrites
   the article, so the article is the file you are editing — and `prose-linting.md` says to lint that
   rather than the directory. Three rules are mechanical and every finding gets acted on:
   `STE.SentenceLength`, `STE.ParagraphLength` and `STE.Contractions`, the last unless the text is
   quoted or named. Three are prompts a person reads rather than obeys: `STE.ProcedureLength`,
   `STE.OneInstruction` and `STE.PassiveVoice`. That article carries the exempt classes for each, and a
   residual fitting no class is not automatically exempt.

   **Write to the length rules while drafting, rather than converging on them afterwards.** Measured across
   two consecutive splits: the first rewrote afterwards and needed four passes, taking `SentenceLength`
   107 → 55 → 19 → 4 → 0. The second was drafted short and needed two, because 67 findings fell to 6 in the
   extraction commit alone, before any lint pass ran.

   **Re-run after acting, and expect a second pass.** The two length rules trade against each other:
   splitting a sentence adds one to its paragraph. Both splits so far reached zero only on the second
   pass. Record the finding count in mandate 4's table.

   **This is separate from mandate 2, which covers the sidecar.** The sidecar is exempt and must report
   zero; the article is linted and must reach zero on the three mechanical rules. One file is checked
   for silence, the other for compliance.

7. **Re-point every inbound reference to the article you split.** Mandate 3 audits the pair against its
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

- ~~**Is the unconditional-read argument sound?**~~ **Settled 2026-09-09, for the routing preamble.**
  Auto-loading is a cost rather than a distribution channel, and mandate 1's closed-decision markers
  reconcile the two positions rather than overriding one. `split-engineering-article` acted on the
  ruling; `engineering.rationale.md` records it, including what was **not** conceded — a future split
  that drops the markers revives the objection in full. **The ruling covers `engineering.md` only.** The
  other three protected files have independent defences, so nothing here licenses splitting them.
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
