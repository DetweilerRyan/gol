---
name: simplified-technical-english-for-agent-docs
title: Split rationale out of the agent docs into sidecar files, then shape-rule the instructions that remain
created: 2026-09-08
---

> Written as Situation / Complication / Question / Answer rather than the Context / Sketch shape in
> `ideas/TEMPLATE.md`. The Answer section carries what Sketch would have; Touches and Open questions
> are unchanged.

## Situation

Every role and this session read `CLAUDE.md` plus some subset of `.claude/agents/**` before doing any
work. That corpus is the repo's largest unexecuted artifact, and it is where this repo deliberately
puts the reasoning nothing else can check — `engineering.md` says so outright. A false `.feature` step
reds a gate; a false or unparseable sentence never does. Its only reviewer is `hardener`, which is the
gap `orchestrator-prose-has-no-reviewer` files.

**That corpus has grown 28-fold in three weeks.** Measured over every commit touching `CLAUDE.md` or
`.claude/agents/**`, end-of-day state, `git ls-tree -r --long` bytes (227 commits, 2026-08-18 through
`bac96c4` on 2026-09-08):

| date           |   CLAUDE.md | house rules | unconditional | whole corpus | uncond. share |
| -------------- | ----------: | ----------: | ------------: | -----------: | ------------: |
| 2026-08-18     |       8,513 |           0 |         8,513 |       19,982 |           43% |
| 2026-08-22     |      66,281 |      32,989 |        99,270 |      145,438 |           68% |
| 2026-08-27     |     194,616 |      47,492 |       242,108 |      323,908 |           75% |
| 2026-09-01     |     201,687 |      47,492 |       249,179 |      330,979 |           75% |
| **2026-09-05** | **255,770** |      55,409 |   **311,179** |      395,366 |           79% |
| 2026-09-06     |      58,592 |      63,612 |       122,204 |      518,894 |           24% |
| 2026-09-08     |      62,649 |      73,541 |       136,190 |  **556,528** |           24% |

"House rules" is `engineering.md` + `workflow.md` + `handoffs.md`, the three articles every role **and**
this seat read unconditionally. "Unconditional" is those three plus `CLAUDE.md`, which is auto-loaded
into every session and every subagent — so it is the floor every participant pays before doing
anything. The remaining `.claude/agents/articles/` bytes (324,536 on `bac96c4`) are read on trigger.

The 2026-09-05 row is the peak `CLAUDE.md` ever reached: **255,770 bytes**, which is the "it grew to
256KB, roughly 64k tokens" that `engineering.md` records. The next row is the routing-index split that
answered it.

**And most of that corpus is not instructions.** Same tree, classified at the block level — a
paragraph or a list item — by whether the block carries a directive (a normative marker: must, never,
do not, should, is owned by, belongs in, refuses; or an imperative head verb, including one after a
short leading clause) or does not:

| file                              | blocks | rationale-only blocks | rationale bytes | entanglement | slice-slug mentions |
| --------------------------------- | -----: | --------------------: | --------------: | -----------: | ------------------: |
| `articles/doc-comments.md`        |    103 |                    69 |         **57%** |          94% |                  11 |
| `articles/handoffs.md`            |     19 |                    10 |             51% |          67% |                   0 |
| `CLAUDE.md`                       |    116 |                    66 |             48% |          78% |                  24 |
| `articles/orchestration.md`       |     39 |                    21 |             45% |          94% |                   0 |
| `architect.md`                    |     54 |                    24 |             35% |          77% |                  10 |
| `product.md`                      |     55 |                    21 |             33% |          68% |                   6 |
| `articles/quality-tooling.md`     |     35 |                    19 |             32% |     **100%** |                  46 |
| `articles/testing-layers.md`      |     32 |                    16 |             30% |     **100%** |                  50 |
| `articles/engineering.md`         |    119 |                    47 |             29% |          82% |                  30 |
| `articles/workflow.md`            |     16 |                     5 |             29% |          64% |                   0 |
| `articles/mutation-testing.md`    |     41 |                    16 |             28% |          92% |                  22 |
| `hardener.md`                     |     41 |                    14 |             27% |          59% |                   9 |
| `articles/archive.md`             |     12 |                     5 |             26% |          71% |                   8 |
| `cleaner.md`                      |     30 |                    13 |             25% |          71% |                   4 |
| `articles/architecture.md`        |     25 |                    10 |             20% |     **100%** |                  10 |
| `articles/ast-grep-rules.md`      |     16 |                     9 |             16% |     **100%** |              **84** |
| `articles/state-flow.md`          |     18 |                     6 |             15% |          92% |                  11 |
| `articles/acceptance-mutation.md` |     20 |                     5 |             11% |     **100%** |                  14 |
| `coder.md`                        |     30 |                     5 |          **9%** |          60% |                   2 |
| **TOTAL**                         |    821 |               **381** |         **30%** |      **81%** |             **341** |

**381 of 821 blocks — 46% — carry no directive at all**, and they are **158,114 bytes, 30% of the
corpus's prose.** Separately and needing no classifier judgment: **341 backticked slice-slug mentions**,
every one of which names repo history rather than anything a normal-workflow agent must do.

**What this is and is not.** It is not a measurement of "clarity", which is not measurable. It is a
proxy for **how much prose a normal-workflow agent must sift to reach its directives**, and the marker
lists above are published so the number is re-derivable rather than taken on trust.

**Validated by hand, and it is a rough instrument.** Two stratified samples of 36 blocks each (role
files, house-rules articles, topic articles, `CLAUDE.md`), labels checked by reading: **24/36 and
25/36 strict agreement — about 2 in 3.** The second sample was drawn after the marker lists were
corrected, so it scores the shipped classifier rather than the one it was tuned on. **The errors are
not symmetric**, which is what makes the numbers usable: in both samples the dominant failure was a
_missed_ directive — an imperative buried after a long subordinate clause, or a verb absent from the
list. Missed directives move blocks from mixed into rationale-only. So read **30% as an upper bound on
what could move cleanly**, and **81% entanglement as a lower bound**. Both bounds fail in the safe
direction: they make the split look easier than it is.

## Complication

**The repo already diagnosed size creep and already applied the structural fix. Measured, that fix
moved the tax rather than reducing it.** On 2026-09-06 the routing-index split took `CLAUDE.md` from
255,770 to 58,592 bytes and grew `.claude/agents/articles/` from 3 files to 13. Judged on its own
terms it worked: `CLAUDE.md` fell **76%** and the unconditional load fell **56%**. Judged on the
corpus, three measurements complicate it:

- **The split day added prose rather than only relocating it.** The corpus went 395,366 → 518,894
  bytes in one day, **+123,528**, which is the largest single-day increase in the whole series — the
  next largest is +48,150 on 2026-08-20. Nothing outside the measured paths can account for it:
  `README.md` is 1,278 bytes and untouched since 2026-08-17.
- **The unconditional floor started climbing again immediately.** 122,204 → 136,190 bytes in the two
  days after the split, **+11%**, entirely in the house-rules articles (63,612 → 73,541). Two days is a
  thin base for a rate, so read this as a direction and not a slope.
- **`engineering.md` is becoming the new `CLAUDE.md`.** On `bac96c4` it is **62,217** bytes against
  `CLAUDE.md`'s **62,649** — within 432 bytes — and it is read unconditionally by all five roles and by
  this seat. The routing test sends measured facts and rationale to the articles, and the article most
  often on the receiving end is one of the three nobody may skip.

Structural fixes are finite. The split was the big one available, it has been spent, and the growth
rate did not change. What has never been tried is a constraint on the prose itself.

**And there is no such constraint.** The repo governs what a sentence may _assert_ and how long the
assertion stays true — `engineering.md`'s "A comment may state why; it may not state an undated
present-tense fact about another file" and "A conclusion from a plausible mechanism outlives a
measurement", plus `orchestration.md`'s "Prose discipline". **Nothing governs how a sentence is
shaped.** Measured on `bac96c4`, the corpus averages **38.0 words per sentence**, with **65%** of
sentences over 25 words and **36%** over 40. The longest is 409 words.

**And the rationale is not sitting in separable chunks — it is woven through the instructions.** Of
the 440 blocks that carry a directive at all, **357 also carry non-directive prose: 81% entanglement.**
Five files are at **100%** — `acceptance-mutation.md`, `architecture.md`, `ast-grep-rules.md`,
`quality-tooling.md` and `testing-layers.md` — meaning every single directive-bearing block in them is
mixed. Not one is a clean instruction.

That is the blur stated as a number, and it cuts twice. A normal-workflow agent cannot skip the
rationale by skipping blocks, because four out of five blocks containing something it must do also
contain something it does not need. And any fix that separates the two is a **rewrite of those blocks,
not a move of them** — which is the single most important input to sizing the Answer below.

So three problems compound: the corpus is growing fastest in the files nobody may skip; 30% of its
prose issues no instruction at all; and 81% of the blocks that do issue one bury it in prose that does
something else.

## Question

Two questions, and the second is the one the measurements above actually pose.

1. ASD-STE100 (Simplified Technical English) is a published standard for exactly this failure —
   technical prose read by someone who cannot ask the author a follow-up question. Does it fit a corpus
   whose readers are agents rather than technicians?
2. Given that 30% of the prose issues no instruction and 81% of instruction-bearing blocks are mixed:
   **can the rationale be separated from the instructions entirely, rather than merely shortened?**

## Answer

**Two answers that compose, and the order matters. Separate the registers into different files first;
apply shape rules to what remains second.**

The first answer is the user's, and it is the larger of the two: **move rationale into a sidecar
`<file>.rationale.md` beside each instruction file, read only when the instruction is being
renegotiated or updated, and never under a normal workflow.** The second is this candidate's original
proposal, and it becomes much more tractable afterwards — once register maps to whole files, STE's
procedural/descriptive split maps to whole files too, instead of to surfaces within a file that a
reader has to identify sentence by sentence.

The finding that connects them: **compliance already tracks register, with nobody having tried.** The
most instruction-shaped file is nearest the standard and the most rationale-shaped file is furthest.
The sidecar split materialises that correlation into the filesystem; the shape rules then apply to one
side of it.

### Answer 1 — the rationale sidecar

**This extends an existing architecture rather than inventing a tier.** Two precedents are already in
the tree:

- **`archive.md` is already exactly this file**, and it is the proof the pattern works. It holds
  "layers that no longer exist, kept for their method", and CLAUDE.md says of it: "No role has a
  trigger for this one; it is research material." A rationale-only article that no role reads under a
  normal workflow already exists, is already documented, and has already been accepted.
- **The routing test's rule 4 already puts a sidecar beside its subject** — `<module>.md` next to
  `<module>.ts`, referenced from JSDoc via `@see`. The proposal is that same move applied one directory
  over, to `.claude/` instead of `src/`.

**How "never read" is enforced, honestly: the same way it already is for nine articles.** Nothing
auto-loads a sidecar, and no role file names a trigger for one. That is precisely the mechanism holding
the topic articles at arm's length today, and CLAUDE.md already states its failure mode in the same
breath — "an article nobody is told to read is worse than no article" — which is a feature here rather
than a bug, because being unread under normal workflow **is the requirement**. Nothing mechanically
prevents an agent reading a sidecar, and nothing needs to: the cost being removed is the unconditional
load, not the possibility of a curious reader.

**What it would buy, measured.** The corpus's rationale-only blocks are 158,114 bytes, 30% of prose. On
the unconditional set specifically — `CLAUDE.md` plus the three house-rules articles, 136,190 bytes on
`bac96c4` — the classified rationale shares are `CLAUDE.md` 48%, `handoffs.md` 51%, `engineering.md`
29%, `workflow.md` 29%. **Read those as upper bounds** (see the validation note in the Situation), but
even halved they are the largest reduction available to the unconditional load since the routing-index
split, and unlike that split they do not relocate the cost to another file everyone reads.

**What it would cost, measured, and this is the part that decides whether it is a slice or a project.**
Entanglement is **81%**, and five files sit at 100%. The split is therefore **a rewrite of the mixed
blocks, not a move of them** — for each one, the directive has to be restated so it stands alone once
its surrounding argument is gone. Only the 381 rationale-only blocks move as-is, and of those, the
ones recording a closed decision leave a marker line behind — so the saving is the measured rationale
share minus one line per closed question, not the full share. That deduction is small enough not to
change the ranking below and large enough that a slice reporting the raw share as its result would be
overstating what it delivered.

**Sequencing that follows from that number**, cheapest and most valuable first:

1. **`doc-comments.md`** — 57% rationale bytes, the highest in the corpus, and a topic article rather
   than an unconditional one, so a mistake there is cheap. The pilot.
2. **`CLAUDE.md`** (48%) and **`handoffs.md`** (51%) — highest rationale share _inside_ the
   unconditional set, so the biggest real saving.
3. **`engineering.md`** (29%, but 62,217 bytes, the second-largest file in the repo and one nobody may
   skip) — the largest absolute win and the highest risk, so it goes after the pattern is proven.
4. **Leave `coder.md` alone** — 9% rationale, already almost pure instruction. Nothing to gain.

**A closed decision leaves a one-line marker behind. This is part of the split, not an optional
extra.** Some of this repo's rationale exists specifically to stop a decision being re-litigated — "X
was tried and rejected, here is why". An agent that never reads it can propose exactly the rejected
thing, and would do so in good faith, which is the one way this split can actively make the corpus
worse rather than merely lighter. So a block moved to a sidecar because it records a **closed
question** leaves a marker in the instruction file naming that question and pointing at the sidecar:

> The blocklist direction was considered and rejected — see `<file>.rationale.md`.

**The marker carries the fact of the closed question and never the argument for it.** That keeps it a
pointer rather than rationale, so it belongs on the instruction side by the same test everything else
here is sorted by, and it is bounded: one line per closed decision, not one per moved block. Most
rationale records no closed question and leaves nothing behind.

**Naming: `<file>.rationale.md`.** "Rational" is the adjective; the noun is "rationale".

### Answer 2 — shape rules on what remains

Everything below was this candidate's original and only answer. It survives the sidecar proposal
unchanged in substance, but its scope moves: instead of "instruction surfaces within a file", which a
reader must identify sentence by sentence, the rules apply to **the instruction files themselves** once
Answer 1 has separated them. The sidecars then keep the register STE has no vocabulary for — which is
the collision documented under "Where STE composes ... and where it collides" below, resolved by
putting the two registers in different files rather than by asking one register to do both jobs.

#### What ASD-STE100 actually is

Issue 9, January 2025, per [asd-ste100.org](https://www.asd-ste100.org/about_STE.html), which states
**53 writing rules in 9 sections**, a dictionary of **approximately 900 approved words** each with one
meaning and one part of speech, and about **1,200 non-approved words listed with alternatives**. From
Issue 9 it is an international standard. It was built for aerospace maintenance manuals and targets
readers who struggle with English or who read through machine translation.

**Provenance caveat, because it matters for how hard the numbers below can be leaned on.** The
specification is a registered download; the free official pages carry the rule _count_ but not the
rules. The per-rule numeric limits quoted here come from secondary summaries — TechScribe's overview
states the **25-word descriptive** cap; the 20-word procedural cap, the 6-sentences-per-paragraph
paragraph cap and the 3-noun cluster cap come from third-party rule digests, not from ASD. Anything
this slice enforces should be re-derived from the specification itself before it becomes a gate.

The rules relevant here: active voice for instructions; restricted tenses (no present perfect); `-ing`
only as a technical noun, never as a verb form; no omitted articles, subjects or verbs; lists instead
of prose for sequences and conditions; one topic per paragraph.

#### What the corpus measures against it

Reproduce by splitting each file on sentence boundaries with fenced blocks and inline code spans
collapsed, table rows and headings dropped, and units under 3 words discarded. On `bac96c4`:

| file                              | sents | mean words | >25w | >40w | longest |
| --------------------------------- | ----: | ---------: | ---: | ---: | ------: |
| `articles/state-flow.md`          |    72 |   **53.0** |  88% |  53% | **409** |
| `articles/architecture.md`        |    99 |       51.6 |  76% |  54% |     308 |
| `articles/ast-grep-rules.md`      |   116 |       51.5 |  79% |  56% |     240 |
| `articles/workflow.md`            |    17 |       43.6 |  76% |  59% |     115 |
| `articles/acceptance-mutation.md` |    92 |       42.0 |  84% |  48% |      87 |
| `articles/testing-layers.md`      |   154 |       41.5 |  79% |  43% |     131 |
| `articles/archive.md`             |    36 |       41.3 |  67% |  44% |     104 |
| `cleaner.md`                      |    58 |       39.5 |  59% |  33% |     143 |
| `articles/mutation-testing.md`    |   171 |       39.1 |  77% |  38% |     136 |
| `articles/quality-tooling.md`     |   106 |       38.1 |  73% |  39% |     127 |
| `coder.md`                        |    47 |       37.7 |  62% |  30% |      91 |
| `hardener.md`                     |    91 |       36.7 |  63% |  36% |     106 |
| `articles/engineering.md`         |   248 |       36.6 |  59% |  34% |     189 |
| `architect.md`                    |   124 |       36.0 |  60% |  33% |     146 |
| `articles/handoffs.md`            |    24 |       36.0 |  58% |  17% |     129 |
| `CLAUDE.md`                       |   227 |       35.3 |  59% |  29% |     278 |
| `articles/doc-comments.md`        |   210 |       30.3 |  54% |  24% |     107 |
| `articles/orchestration.md`       |    67 |       27.4 |  46% |  24% |      71 |
| `product.md`                      |   109 |   **21.9** |  30% |   9% |      59 |
| **TOTAL**                         |  2068 |   **38.0** |  65% |  36% |     409 |

**Read the two ends of that table, not the average.** `product.md` at 21.9 words already sits inside
STE's descriptive cap; `state-flow.md` at 53.0 is more than double it. Nobody wrote either to a
standard. What separates them is register — `product.md` is mostly imperative bullets ("Never write
anything under `src/` or `scripts/`, in either mode"), and `state-flow.md` is mostly semicolon-chained
rationale. **The 409-word maximum is one real sentence**, not a splitter artifact: it is the second
sentence of the hooks bullet in `state-flow.md`, and it runs from that bullet's zoom-glide clause
through `useAppearance.ts` on semicolons alone.

Note the two tables disagree about `engineering.md`, and the disagreement is the point. It is the
_second largest_ file in the corpus and only the _thirteenth longest-sentenced_ — it is growing by
volume, not by density. Shape rules would not have prevented its growth, which is why this candidate
claims to address parseability and does not claim to address size. Size is
`orchestrator-prose-has-no-reviewer`'s and the routing test's problem.

Construct counts over the same corpus with code spans collapsed (81,673 words), each of which STE
restricts or forbids:

| construct                              | count |
| -------------------------------------- | ----: |
| `-ing` tokens                          | 2,356 |
| em-dash                                | 1,352 |
| open paren                             |   842 |
| passive proxy (`be` + `-ed`)           |   548 |
| semicolon                              |   476 |
| contraction                            |   181 |
| present perfect (`has`/`have` + `-ed`) |    45 |

The `-ing`, em-dash and semicolon counts are the interesting ones: those three are how this corpus
subordinates, and subordination is what STE removes. That is the cost side stated plainly, before the
benefit side is argued.

#### Where STE composes with what the repo already has, and where it collides

- **Composes with `engineering.md`'s claim discipline.** That section governs what a sentence may
  _assert_ and how long the assertion stays true. STE governs how a sentence is _shaped_. Orthogonal
  axes — a dated past measurement written in 20 words satisfies both.
- **Composes with the routing test.** `CLAUDE.md`'s "Where new documentation goes" already sorts prose
  by audience. STE's own procedural/descriptive split is nearly the same cut, which is why the partial
  adoption below falls out of the existing structure rather than being imposed on it.
- **In-repo prior art, and it runs the opposite direction.** `.gherkin-lintrc`'s
  `no-restricted-patterns` is a controlled vocabulary over `features/**` — but it is a **blocklist** of
  implementation words, where STE's dictionary is an **allowlist** of approved ones. `CLAUDE.md`'s
  mutation-invariant exemption already argues that direction at length: a blocklist fails open, an
  allowlist fails safe. If the vocabulary half of STE is ever adopted here, that argument is the reason
  to prefer it to a second blocklist.
- **Collides with the rationale register, which is the repo's deliberate choice.** `engineering.md`
  states that prose is where this repo puts the reasoning nothing else can check. Its arguments run on
  concession and analogy — "the carve-out, which is not the same construct at all", "context supplies
  the referent the way it supplies _you_". STE strips exactly those. Worse for the dictionary half: the
  Technical Names and Technical Verbs rules exempt _domain nouns_, so `mutant` and `worktree` are fine
  — but they do not exempt argument connectives, and connectives are what this corpus is made of.

#### Worked before/after, so the register loss is judgeable rather than asserted

**Where STE clearly helps.** `CLAUDE.md`'s merge protocol, on the exemption asymmetry — one 60-word
sentence carrying four clauses and two em-dash asides:

> So the predicate is evaluated by the orchestrating session and handed to `hardener` in the invoking
> prompt, naming the diff it was computed over — absent that instruction `hardener` runs stage 5, full
> stop — but `hardener` **may** check the handed-down claim against `git diff --name-only` and **must**
> run stage 5 anyway if it can falsify it.

STE-shaped:

> The orchestrating session evaluates the predicate. It puts the predicate in the invoking prompt and
> names the diff the predicate covers. If the prompt does not contain that instruction, `hardener` runs
> stage 5. `hardener` can check the claim with `git diff --name-only`. If `hardener` shows the claim to
> be false, `hardener` runs stage 5.

Five sentences, longest 17 words, no clause ordering to resolve. Nothing was lost.

**Where STE clearly hurts.** `engineering.md`, on the two kinds of claim:

> A dated past measurement claims history and cannot rot. An undated present-tense claim about another
> file's current state is a promise with no mechanism behind it — nothing re-checks it, and the file it
> describes moves without it. The two are indistinguishable at the moment of writing, which is why this
> is a rule rather than a matter of care.

The last clause is the whole argument: not "follow this rule" but "care cannot substitute for it". STE
would split it into two sentences and drop the causal link, or keep the link and break the tense rule.
This paragraph is doing work that the standard has no register for.

#### What the slice would do

**Partial adoption, split by the cut the corpus already shows.** Do not touch the articles' rationale.

1. **Write down the shape rules** as a section in `engineering.md`, beside the claim-discipline
   sections every role and this seat already read unconditionally. Scope them explicitly to
   **instruction surfaces**: role-file bullets, `CLAUDE.md`'s command list and routing test, the
   articles' read-triggers and procedure steps. Name the exempt surface just as explicitly — rationale,
   discovery records, and the dated past-tense measurements the claim-discipline sections mandate.
   Note the irony and accept it: this adds bytes to the file the Complication just named as the fastest
   growing thing nobody may skip. It is a section, not an article, precisely to keep that cost small.
2. **Start with the four rules the measurement supports and the dictionary is not needed for**: one
   instruction per sentence; 25 words for an instruction; active voice for an instruction; a list
   rather than a prose chain for a sequence or a set of conditions. Leave the ~900-word dictionary, the
   tense restrictions and the `-ing` rule out of scope — those are where the collision is.
3. **Fix the two measured outliers as the worked demonstration**: the 409-word `state-flow.md` bullet
   and the 308-word `architecture.md` one. Both are enumerations that STE's list rule turns into lists,
   which is a shape change with no register loss — the cheapest possible proof of the idea.
4. **Do not build a checker in this slice.** See the tool search below.

#### Tool search, per `orchestration.md`'s "Before building a checker, search for one"

Nothing needs to be written, and the search has one structural finding that outranks any individual
tool. **ASD's approved-word dictionary is copyrighted, so no open tool ships it.** Open
implementations either state the omission and substitute plain English — `Syntaf/vale-llm-slop` does
exactly that — or rebuild a wordset independently. That is an external reason for the same scope the
Answer above already argues on internal grounds: **the shape half of STE is enforceable here off the
shelf, and the vocabulary half is not.**

The mainstream route, and the one to prefer:

| tool                                                                                                                                                     | what it is                                                                                       | fit                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Vale](https://vale.sh) + [`Syntaf/vale-llm-slop`](https://github.com/Syntaf/vale-llm-slop)                                                              | Mature Go prose linter with a package system; the package adds an `STE` style and a `Slop` style | **Best gate candidate.** One binary, no runtime added, Markdown-aware, configured by `.vale.ini` with styles scoped per file glob — which is exactly the instruction-surface/rationale split the Answer needs. Package read 2026-09-08 at 25 stars, 6 commits: early-stage |
| [`jyooi/agent-simple-english`](https://github.com/jyooi/agent-simple-english/)                                                                           | TypeScript + Effect STE linter, 13 rules, Claude Code plugin + CLI                               | Explicitly aimed at coding-agent instructions and ships as a plugin, so it pays no `scripts/` gate freight. Needs Bun, which is a new runtime. Read 2026-09-08 at 9 stars, 58 commits                                                                                      |
| [`stuffbucket/vale`](https://github.com/stuffbucket/vale/tree/main/)                                                                                     | Unrelated pure-Go STE linter and MCP server that reuses the Vale name                            | **Name collision — this is not vale.sh.** Configurable 20/25-word caps, `.vale-ste.yml`. Read 2026-09-08 at 6 stars, 38 commits. The MCP server is a second integration path                                                                                               |
| [`danyuchn/asd-ste100-skill`](https://github.com/danyuchn/asd-ste100-skill), [`1fc0nfig/ste-writing`](https://github.com/1fc0nfig/ste-writing/tree/main) | STE rules as Claude Code skills, the second with a deterministic Python linter                   | Rewriting aids used while performing the rewrite, not gates                                                                                                                                                                                                                |

##### Which tool applies the shape rules, and when

**Answer 1's pilot uses no STE tool at all.** Separating rationale from instruction is a judgement about
register made by reading, and the classifier that ranked the files is explicitly not good enough to
decide which blocks move (see the Situation's validation note). No linter helps there.

**Answer 2's pilot uses Vale, one rule, report-only, scoped to instruction files.** Concretely: the
`STE` style from `Syntaf/vale-llm-slop`, with every rule disabled except sentence length. Four reasons,
in descending weight:

1. **Report-only is an existing concept here, so this adds no new one.** `ast-grep`, `gherkin-dry` and
   `halstead4ts` are all report-only, and `engineering.md` already carries the shared convention for
   reading such a checker — read the output, not the exit code. A gate is a later decision.
2. **Vale parses Markdown into an AST and lints prose nodes only**, skipping code blocks, inline code
   and URLs. That is not a nicety on this corpus: the sentence measurement in this candidate had to
   collapse code spans by hand first, and a line-based tool would score the command list as prose.
3. **One rule is what keeps the first run actionable.** 65% of sentences already exceed 25 words, so
   enabling the full style produces roughly 1,300 findings on day one — the "checker whose findings
   nobody has budgeted to fix" this candidate warns about, delivered against itself.
4. **`.vale.ini` can express the instruction/sidecar split directly**, which no other candidate tool
   was shown to do.

**The configuration sketch, and the two facts about it worth knowing before writing one.** Sections
**stack in the order written**, and a file applies every section whose glob matches it, with the later
section winning per key — except `BasedOnStyles`, which **replaces rather than adjusts**. That pair is
what makes the sidecar exemption a two-line config change rather than a maintained file list:

```ini
StylesPath = .vale
MinAlertLevel = suggestion

[.claude/agents/**/*.md]
BasedOnStyles = Vale, STE

[**/*.rationale.md]
BasedOnStyles = Vale
```

The second section strips the `STE` style back off the sidecars, so rationale keeps the register STE has
no vocabulary for. **Read the rule names out of the package rather than from this sketch** — they are
not verified here, and only the sentence-length rule should be left on for the pilot.

**One glob hazard, and this repo has already met it from the other side.** Vale's `*` **crosses `/`**:
its own documentation gives `docs/*.md` matching `docs/sub/nested.md`. That is ast-grep's behaviour, not
`globSync`'s — the exact asymmetry CLAUDE.md documents under `ast-grep-rule-check`, where `globSync`'s
`*` stops at a separator and ast-grep's does not. A glob written on the `globSync` intuition
over-matches here rather than under-matching, so it fails **open**: it silently lints files nobody
scoped it to, which on this corpus means the sidecars.

**The skills stay, in a different job.** `danyuchn/asd-ste100-skill` and `1fc0nfig/ste-writing` are
rewriting aids used _while_ performing Answer 2's rewrite. That is not the same thing as a gate, and
neither replaces the other: the skill shapes prose as it is written, the linter reports on prose after
it lands.

##### The dictionary question, asked specifically

Searched 2026-09-08 for an open STE dictionary covering this stack or web development generally.
**There is none, and the standard's own design says there would not be.** STE's Technical Names and
Technical Verbs rules exist precisely so a project supplements the core dictionary with its own domain
list — ASD never published a per-industry vocabulary, so this is authoring work by construction rather
than a gap somebody has failed to fill.

What does exist, in descending order of usefulness here:

- **[OpenSTE](https://www.openste.org/)** ([`openste/openste`](https://github.com/openste/openste)) —
  an MIT-licensed open wordset for STE-style validation, and the closest thing to a free dictionary.
  It is deliberately **general-purpose**: its own roadmap lists per-industry examples as future work.
  Read 2026-09-08 at 5 stars, 11 commits, so treat it as a starting corpus rather than a standard.
- **Vale's `Vocab` mechanism** — a directory holding `accept.txt` and `reject.txt`, layered over
  whatever styles are active. This is the mechanism a project-specific technical-names list would use,
  and it is the reason Vale is the right host: the list lives in the repo and is reviewed like any
  other file.
- **The Vale package registry has 20 packages and not one is STE or stack-specific** (enumerated from
  `vale-cli/packages`'s `library.json`, 2026-09-08). Its software-documentation entries — Google,
  Microsoft, RedHat, Elastic, Salesforce — ship preferred spellings and capitalisations, which is a
  style guide rather than a controlled allowlist, and a style guide fails **open** on a word nobody
  listed. Note also that `vale-llm-slop` is **not** in this registry; it installs by direct URL.

###### The process for adding a term

**The mechanism, verified against Vale's own documentation.** A vocabulary is a directory at
`<StylesPath>/config/vocabularies/<name>/` holding two files. Entries are one per line, **case-sensitive
regular expressions**, with `# ` starting a comment. `accept.txt` does two things at once: it adds the
term to the exception list of every style in `BasedOnStyles`, **and** it populates a `Vale.Terms`
substitution rule that forces every occurrence to match the entry's exact casing. `reject.txt`
populates `Vale.Avoid`, an existence rule that flags **all** occurrences as errors.

**That casing behaviour is a free win this repo has explicitly asked for.** CLAUDE.md's accessible-name
convention lists the shipped control labels and says of them, in its own words, that the rule "is not
machine-checked, and it has carried a false universal twice" — `Appearance` was omitted outright and
`Next Generation` shipped in title case. Those names in `accept.txt` make a casing drift a Vale finding.
It is not a complete check of the convention, since Vale sees the docs rather than `src/`, but it is the
first mechanical grip anything has had on it.

**Four rules for adding a term, each chosen so the entry is checkable rather than a matter of taste:**

1. **`accept.txt` takes technical names that exist in the tree** — a filename, an npm script, a role, a
   config key, a tool, or an authored accessible name. STE's Technical Names rule is the licence, and
   "does it resolve against the repo" is the test. This deliberately mirrors `reference-check`, which
   already resolves filename-shaped tokens against `git ls-files`.
2. **`reject.txt` takes a term only once it has actually appeared, and only with a replacement.**
   Never speculatively: `Vale.Avoid` fires at error severity on every occurrence, so a guessed entry
   reds the gate against prose nobody has written. This is the blocklist direction, and it is bounded
   here precisely because the allowlist carries the general case.
3. **The entry lands in the same commit as the prose that first needs it**, with the justification in
   the commit body. The repo's existing habit for `reference-check` and `ast-grep-rule-check` opt-outs
   is a reason required at the site; this is the same discipline one file over.
4. **A stale entry is a failure, not a pass** — an `accept.txt` term matching nothing live in the corpus
   is removed. This is not a new idea to invent: `reference-check` already implements exactly it as
   `stale-allow-marker`, where a marker whose token appears nowhere else live fails in its own right.
   The check belongs in `agent-doc-check`, which already parses `.claude/**`, rather than in a new
   `scripts/` program paying full gate freight.

**Two hazards that follow from entries being case-sensitive regexes.** A bare common word must never be
added — `slice` in `accept.txt` would force lowercase at sentence start, across a corpus that uses the
word constantly. Where casing genuinely varies, write the entry as a regex (`(?i)…`) deliberately rather
than adding two entries and discovering later that only one of them was enforcing anything.

**Ownership: `architect`.** It already owns `rules/`, the repo's other surface where a mechanical
invariant is authored and paired with a fixture, and it is the role whose charter already includes
narrowing or widening such a rule. The alternative — the orchestrating seat, which authors most of this
prose — is rejected on the record for the reason `orchestrator-prose-has-no-reviewer` gives: that seat
has no reviewer, and handing it one more unreviewed surface repeats a gap this repo has already
measured. `product` keeps the **ubiquitous language** unchanged; that vocabulary is the product's domain
and is authoritative over `features/**`, whereas this one is the toolchain's and governs `.claude/**`.
Two vocabularies, two owners, two surfaces, and they do not overlap.

**The seed for a project list already exists in this repo and is not hypothetical.** `product` owns
"the ubiquitous language", `.gherkin-lintrc`'s `no-restricted-patterns` is a hand-maintained
vocabulary control over `features/**`, and `CLAUDE.md`'s compact module map names the domain nouns.
A technical-names list would start from those three rather than from nothing — which makes the
vocabulary half **reachable by authoring, but not by installing**, and therefore a slice of its own
rather than part of this one.

Commercial checkers exist and are the incumbents in aerospace — HyperSTE (Etteplan), Congree, Acrolinx,
and the Boeing Simplified English Checker. They are the only tier that licenses the real dictionary.
Out of scope for a docs slice on a hobby repo, recorded so the rejection is on the record rather than
an oversight.

Every open tool above states it approximates ASD-STE100 and is not ASD-certified.

## Touches

**Answer 1 (the sidecar split)** touches every file it splits, plus a new `<file>.rationale.md` beside
each. Pilot scope is `.claude/agents/articles/doc-comments.md`; the unconditional set (`CLAUDE.md`,
`handoffs.md`, `engineering.md`) follows only once the pattern is proven. CLAUDE.md's "Where new
documentation goes" routing test gains a fifth branch, since a sidecar is a new destination and a
routing test that does not name it will keep sending rationale back into the instruction files.

**Answer 2 (the shape rules)** touches `.claude/agents/articles/engineering.md` (new shape-rules
section), `state-flow.md` and `architecture.md` (the two demonstration paragraphs), and `CLAUDE.md`'s
conventions list (one pointer sentence). Its pilot adds `.vale.ini` and a `.vale/` styles directory
holding the vendored `STE` style and `config/vocabularies/<name>/{accept,reject}.txt` — plus a
`.prettierignore` and `.gitignore` decision for whatever Vale downloads into that directory, since a
vendored style is third-party text this repo does not author, the same status `src/catalyst/` already
has. Vale itself is a Go binary, not an npm dependency, so it does not reproduce from `npm ci` — the
same footgun CLAUDE.md already documents for the `typescript-language-server` install. If the
vocabulary staleness check is built, `scripts/agent-doc-check/`. If the alternative route is taken and
`jyooi/agent-simple-english` is adopted as a Claude Code plugin instead of Vale as a binary, that is
`.claude/settings.json` rather than any of the above — a different integration surface, which is part
of why the choice is worth making deliberately rather than drifting into.

**Gate implications, and one of them is a real constraint on Answer 1.** `npm run agent-doc-check`'s
check 5 requires every `rules/*.yml` to be named in `ast-grep-rules.md` specifically — the path is
hardcoded as `RULE_DOC_PATH` behind an `existsSync` guard. **That article is 100% entangled and carries
84 slice-slug mentions, so it is a prime split candidate — but the rule enumeration must stay in the
instruction file**, or the gate reds. Check 2 validates `.claude/agents/*.md` frontmatter by filename,
so a sidecar must not land in that directory under a name that reads as a role file.
`npm run reference-check` scans every line of `.claude/**/*.md`, so sidecars are covered by it for free
— and a split that drops or garbles a filename mid-move reds that gate, which is the desired behaviour.

**Sizing.** Docs only, no `src/`, no `scripts/`. Every path is inside the mutation-invariant allowlist,
so a landing diff confined to them is eligible to skip stage 5 — eligible only, since that skip exists
solely as an instruction the orchestrating session hands down and `hardener` runs the stage absent one.
Two gates do move on such a diff: `npm run agent-doc-check`, and `npm run reference-check`. No design
pass triggers fire — but note the 81% entanglement means Answer 1 is a **rewrite** of the mixed blocks,
so it is a multi-slice programme rather than one slice, and the pilot should land alone.

## Open questions

- **Does an agent that never reads the rationale re-litigate settled decisions?** This is the sidecar's
  main risk and it is unmeasured. Several passages in this repo exist precisely to record that
  something was tried and rejected. Answer 1 adopts the closed-decision marker to cover it, but the
  marker is a mitigation with no evidence behind it yet: whether a bare pointer stops an agent
  re-proposing a rejected design, or whether an agent needs the argument itself to be persuaded, is
  exactly what the pilot should measure rather than assume. If the marker turns out to be insufficient,
  the fallback is not abandoning the split — it is widening the marker to a one-line summary of _why_,
  which is a different and larger claim on the instruction file's bytes.
- **How does an agent know it is "renegotiating" and should read the sidecar?** The trigger for the
  topic articles is a stated condition in a role file. A sidecar needs the same, and the condition
  "you are changing this instruction rather than following it" is harder to state crisply than
  "before authoring a `.feature`". If that trigger is vague, the sidecars are either never read when
  they should be or read always, and the second outcome restores the cost the split removed.
- **Is the classifier good enough to scope with?** It agrees with hand labels about 2 in 3 times, and
  errs toward over-reporting rationale. That is fine for the direction of the argument and **not** fine
  for deciding which specific blocks move — the split itself must be done by reading, with the
  classifier used only to rank files. Re-running it after the pilot, on the pilot's own diff, is the
  cheap way to find out whether it tracked reality.
- **The mechanism is inferred, not measured.** "Shorter sentences make agents follow instructions
  better" is exactly the shape of claim `engineering.md`'s "A conclusion from a plausible mechanism
  outlives a measurement" warns about, and the competing explanation is real: the long sentences may be
  carrying disambiguation that shortening discards, in which case compliance goes _down_. Spike it —
  rewrite one article's instruction surface, run a slice against each version, compare where roles
  needed a round trip. Decide after that, not before.
- **Is the token cost a benefit or a cost?** The Situation measures the tax precisely — 136,190 bytes
  paid unconditionally by every participant on `bac96c4`, and `agent-output-verbosity` frames the same
  cost for gate stdout. But STE forbids omitting articles and prefers a repeated noun to a pronoun, so
  it may well make the corpus _longer_. Unmeasured in both directions; measure byte delta on Answer 2's
  pilot before claiming either. **If it comes back longer, this candidate trades size for
  parseability and should say so rather than claiming both.**
- **Does the split hold, or does rationale grow back into the instruction files?** The routing-index
  split is the cautionary precedent measured in the Complication: it worked, and the corpus resumed
  growing immediately. A sidecar tier has the same weakness — nothing enforces which side a new
  paragraph lands on, exactly as nothing enforces the routing test's "at most one pointer sentence".
  Worth asking whether `agent-doc-check` should grow a mechanical check here (a directive-density floor
  on instruction files, say), since it already parses `.claude/**` and this candidate otherwise adds a
  third unenforced convention to a repo that has measured two of them decaying.
- **Does this address the growth rate at all, or only the symptom?** The Complication shows a
  structural fix that cut the unconditional load 56% and left the rate untouched. A shape rule is a
  second intervention on the same problem from a different angle, and it has the same weakness: nothing
  enforces it, so it decays exactly as the routing test's "at most one pointer sentence" has. Worth
  asking whether the honest answer is a budget — a byte ceiling on the unconditional set, checked by
  `agent-doc-check` — rather than a style rule.
- **Who reviews the rewrite?** A shape rewrite of a rationale paragraph is the highest-risk edit this
  repo has — it changes prose whose only reviewer is `hardener`, and the sweep behind
  `slice/comment-reference-checks` measured a careful text-preserving sweep _creating_ two dead
  filenames. This is `orchestrator-prose-has-no-reviewer`'s problem arriving with a bigger diff, and
  the two candidates should probably be sequenced rather than run independently.
- **Does the 25-word cap belong in `.gherkin-lintrc` too?** Step text is instruction-shaped and already
  has a vocabulary control and a `name-length` cap. Possibly free; possibly a fight with domain
  altitude, since naming a thing precisely is what the altitude rule demands and brevity is what this
  one would.
- **Re-derive the caps from the specification before any of them gates anything.** The 20/25-word
  numbers here are third-party. The repo's own claim discipline says cite the command, not the number;
  the equivalent here is cite the spec, not the summary.
