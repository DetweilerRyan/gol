---
name: simplified-technical-english-for-agent-docs
title: Adopt ASD-STE100's sentence-shape rules on the instruction surfaces of CLAUDE.md and .claude/agents
created: 2026-09-08
---

## Context

**Situation.** Every role and this session read `CLAUDE.md` plus some subset of `.claude/agents/**`
before doing any work. That corpus is the repo's largest unexecuted artifact and its only reviewer is
`hardener` — the gap `orchestrator-prose-has-no-reviewer` already files.

**Complication.** That candidate is about whether a prose claim is _true_. This one is about whether a
prose sentence is _parseable_. The repo has a written convention for the first (`engineering.md`'s "A
comment may state why; it may not state an undated present-tense fact about another file", and
`orchestration.md`'s "Prose discipline") and **no convention at all for the second**. Measured on
`bac96c4` (2026-09-08), the corpus averages **38.0 words per sentence**, with **65%** of sentences over
25 words and **36%** over 40.

**Question.** ASD-STE100 (Simplified Technical English) is a published standard for exactly this
failure — technical prose read by someone who cannot ask the author a follow-up question. Does it fit
a corpus whose readers are agents rather than technicians?

**Answer.** Partly, and the corpus itself says which part. Compliance already tracks register: the most
instruction-shaped file is nearest the standard and the most rationale-shaped file is furthest, with
nobody having tried. That is the finding, and it is what makes this a scoped slice rather than a
rewrite of 83k words.

### What ASD-STE100 actually is

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

### The measured corpus

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

### Where STE composes with what the repo already has, and where it collides

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

### Worked before/after, so the register loss is judgeable rather than asserted

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

## Sketch

**Partial adoption, split by the cut the corpus already shows.** Do not touch the articles' rationale.

1. **Write down the shape rules** as a section in `engineering.md`, beside the claim-discipline
   sections every role and this seat already read unconditionally. Scope them explicitly to
   **instruction surfaces**: role-file bullets, `CLAUDE.md`'s command list and routing test, the
   articles' read-triggers and procedure steps. Name the exempt surface just as explicitly — rationale,
   discovery records, and the dated past-tense measurements the claim-discipline sections mandate.
2. **Start with the four rules the measurement supports and the dictionary is not needed for**:
   one instruction per sentence; 25 words for an instruction; active voice for an instruction; a list
   rather than a prose chain for a sequence or a set of conditions. Leave the ~900-word dictionary, the
   tense restrictions and the `-ing` rule out of scope — those are where the collision is.
3. **Fix the two measured outliers as the worked demonstration**: the 409-word `state-flow.md` bullet
   and the 308-word `architecture.md` one. Both are enumerations that STE's list rule turns into lists,
   which is a shape change with no register loss — the cheapest possible proof of the idea.
4. **Do not build a checker in this slice.** See the tool search below.

### Tool search, per `orchestration.md`'s "Before building a checker, search for one"

Nothing needs to be written. Three existing implementations, none adopted here yet:

| tool                                                                           | what it is                                                         | fit                                                                                                                                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`jyooi/agent-simple-english`](https://github.com/jyooi/agent-simple-english/) | TypeScript + Effect STE linter, 13 rules, Claude Code plugin + CLI | Closest fit — explicitly aimed at coding-agent instructions, ships as a plugin so it pays no `scripts/` gate freight. Needs Bun. Small project (9 stars, 58 commits when read 2026-09-08) |
| [`stuffbucket/vale`](https://github.com/stuffbucket/vale/tree/main/)           | pure-Go STE linter + MCP server, configurable 20/25-word caps      | No runtime to add; MCP server is a second integration path                                                                                                                                |
| [`danyuchn/asd-ste100-skill`](https://github.com/danyuchn/asd-ste100-skill)    | STE rules as a Claude Code skill                                   | Rewriting aid rather than a gate; useful while doing step 3                                                                                                                               |

All three state they approximate ASD-STE100 and are not ASD-certified. **The lightest first step is the
skill, not the linter**: it makes the rules available while writing, which is where the repo's own
evidence says prose defects are actually caught, without adding a gate whose findings nobody has
budgeted to fix.

## Touches

`.claude/agents/articles/engineering.md` (new shape-rules section), `.claude/agents/articles/state-flow.md`
and `architecture.md` (the two demonstration paragraphs), `CLAUDE.md`'s conventions list (one pointer
sentence, per the routing test). If a plugin is adopted, `.claude/settings.json`.

**Sizing.** Docs only, no `src/`, no `scripts/`. Every path is inside the mutation-invariant allowlist,
so a landing diff confined to them is eligible to skip stage 5 — eligible only, since that skip exists
solely as an instruction the orchestrating session hands down and `hardener` runs the stage absent one.
Two gates do move on such a diff: `npm run agent-doc-check`, and `npm run reference-check`, which scans
every line of `.claude/**/*.md` and `CLAUDE.md` — so a rewritten paragraph that drops or garbles a
filename reds the gate. No design pass triggers fire.

## Open questions

- **The mechanism is inferred, not measured.** "Shorter sentences make agents follow instructions
  better" is exactly the shape of claim `engineering.md`'s "A conclusion from a plausible mechanism
  outlives a measurement" warns about, and the competing explanation is real: the long sentences may be
  carrying disambiguation that shortening discards, in which case compliance goes _down_. Spike it —
  rewrite one article's instruction surface, run a slice against each version, compare where roles
  needed a round trip. Decide after that, not before.
- **Is the token cost a benefit or a cost?** `CLAUDE.md` is auto-loaded into every session and every
  subagent, so its size is a tax — `agent-output-verbosity` frames the same cost for gate stdout. But
  STE forbids omitting articles and prefers a repeated noun to a pronoun, so it may well make the
  corpus _longer_. Unmeasured in both directions; measure on the step-3 demonstration before claiming
  either.
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
