---
name: ste-shape-rules-for-instruction-files
title: Apply ASD-STE100 sentence-shape rules to the instruction files, with a governed Vale vocabulary
created: 2026-09-08
---

> Deferred from `simplified-technical-english-for-agent-docs` when its first slice was promoted as
> `rationale-sidecar-pilot`. **This candidate assumes that pilot has landed and succeeded** — the shape
> rules apply to instruction files, and "instruction file" is only a meaningful category once the
> rationale has been split out of one. If the pilot fails its reading test, reopen this from the
> Situation rather than the Sketch.

## Context

The pilot answers whether rationale can be separated from instruction. This candidate answers what to
do with the instructions that remain, and it is where the original research's STE material lives: the
standard, the sentence-length measurements, the register collision, the tool landscape, the dictionary
question, and the vocabulary guards.

**Two measurements carry over.** On `bac96c4` (2026-09-08) the corpus averages **38.0 words per
sentence**, with **65%** of sentences over STE's 25-word descriptive cap and **36%** over 40; the
longest single sentence is 409 words. And compliance already tracks register with nobody having tried —
`product.md` sits at 21.9 words, inside the cap, while `state-flow.md` sits at 53.0, more than double
it. That correlation is the whole reason the pilot comes first: it materialises the register split into
files, so these rules apply to whole files instead of to surfaces within them.

## What ASD-STE100 actually is

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

## What the corpus measures against it

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

## Where STE composes with what the repo already has, and where it collides

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

## Worked before/after, so the register loss is judgeable rather than asserted

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

## Sketch — the shape rules

**Partial adoption, split by the cut the corpus already shows.** Do not touch the articles' rationale.

1. **Write down the shape rules** as a section in `engineering.md`, beside the claim-discipline
   sections every role and this seat already read unconditionally. Scope them explicitly to
   **instruction surfaces**: role-file bullets, `CLAUDE.md`'s command list and routing test, the
   articles' read-triggers and procedure steps. Name the exempt surface just as explicitly — rationale,
   discovery records, and the dated past-tense measurements the claim-discipline sections mandate.
   Note the irony and accept it: this adds bytes to `engineering.md`, which the parent research measured
   as the fastest-growing thing nobody may skip. It is a section, not an article, precisely to keep that cost small.
2. **Start with the four rules the measurement supports and the dictionary is not needed for**: one
   instruction per sentence; 25 words for an instruction; active voice for an instruction; a list
   rather than a prose chain for a sequence or a set of conditions. Leave the ~900-word dictionary, the
   tense restrictions and the `-ing` rule out of scope — those are where the collision is.
3. **Fix the two measured outliers as the worked demonstration**: the 409-word `state-flow.md` bullet
   and the 308-word `architecture.md` one. Both are enumerations that STE's list rule turns into lists,
   which is a shape change with no register loss — the cheapest possible proof of the idea.
4. **Do not build a checker in this slice.** See the tool search below.

## Tool search, per `orchestration.md`'s "Before building a checker, search for one"

Nothing needs to be written, and the search has one structural finding that outranks any individual
tool. **ASD's approved-word dictionary is copyrighted, so no open tool ships it.** Open
implementations either state the omission and substitute plain English — `Syntaf/vale-llm-slop` does
exactly that — or rebuild a wordset independently. That is an external reason for the same scope the
the Sketch above already argues on internal grounds: **the shape half of STE is enforceable here off the
shelf, and the vocabulary half is not.**

The mainstream route, and the one to prefer:

| tool                                                                                                                                                     | what it is                                                                                       | fit                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Vale](https://vale.sh) + [`Syntaf/vale-llm-slop`](https://github.com/Syntaf/vale-llm-slop)                                                              | Mature Go prose linter with a package system; the package adds an `STE` style and a `Slop` style | **Best gate candidate.** One binary, no runtime added, Markdown-aware, configured by `.vale.ini` with styles scoped per file glob — which is exactly the instruction-surface/rationale split the Answer needs. Package read 2026-09-08 at 25 stars, 6 commits: early-stage |
| [`jyooi/agent-simple-english`](https://github.com/jyooi/agent-simple-english/)                                                                           | TypeScript + Effect STE linter, 13 rules, Claude Code plugin + CLI                               | Explicitly aimed at coding-agent instructions and ships as a plugin, so it pays no `scripts/` gate freight. Needs Bun, which is a new runtime. Read 2026-09-08 at 9 stars, 58 commits                                                                                      |
| [`stuffbucket/vale`](https://github.com/stuffbucket/vale/tree/main/)                                                                                     | Unrelated pure-Go STE linter and MCP server that reuses the Vale name                            | **Name collision — this is not vale.sh.** Configurable 20/25-word caps, `.vale-ste.yml`. Read 2026-09-08 at 6 stars, 38 commits. The MCP server is a second integration path                                                                                               |
| [`danyuchn/asd-ste100-skill`](https://github.com/danyuchn/asd-ste100-skill), [`1fc0nfig/ste-writing`](https://github.com/1fc0nfig/ste-writing/tree/main) | STE rules as Claude Code skills, the second with a deterministic Python linter                   | Rewriting aids used while performing the rewrite, not gates                                                                                                                                                                                                                |

## Which tool applies the shape rules, and when

**The `rationale-sidecar-pilot` slice uses no STE tool for its split.** Separating rationale from
instruction is a judgement about register made by reading, and the classifier that ranked the files
agrees with hand labels only about 2 in 3 times — fine for ranking files, not for deciding blocks. No
linter helps there. It does stand Vale up, configured to `STE.SentenceLength` alone.

**This candidate widens that same Vale install rather than introducing one.** Concretely: the
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
rewriting aids used _while_ performing this candidate's rewrite. That is not the same thing as a gate, and
neither replaces the other: the skill shapes prose as it is written, the linter reports on prose after
it lands.

## The dictionary question, asked specifically

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

## The guards for accepting or rejecting a term

**The headline guard, and it is the one this repo already states in another form: never add a term to
silence a finding you disagree with.** `architect.md` says of the equivalent move — "Reject an arbitrary
that was narrowed to clear a finding. Filtering the failing case out of a generator leaves the defect in
the module and removes the only thing that could find it — the same move as weakening an ast-grep rule
to clear a violation." Adding a word to `accept.txt` because Vale flagged it is that move exactly. The
default response to a finding is to reword the prose; the vocabulary changes only when the prose was
right and the tool was wrong.

**`accept.txt` — every guard must hold.**

| #   | guard                                                                                                                                                                                                                                                                                                               | how it is settled       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | **It resolves against the tree.** The term names a real file, npm script, role, config key, tool, or authored accessible name. This is STE's Technical Names licence, and the test is the one `reference-check` already applies to filename-shaped tokens.                                                          | mechanical              |
| 2   | **It already appears in the corpus.** Never speculative — a term added ahead of the prose that needs it has no way to be found stale later, because it was never live.                                                                                                                                              | mechanical (`grep`)     |
| 3   | **It has one casing in the corpus, or the entry is an explicit `(?i)` regex.** Entries are case-sensitive regexes and populate `Vale.Terms`, so a careless entry enforces one spelling everywhere. Grep the variants **before** adding, not after.                                                                  | mechanical              |
| 4   | **It is not an ordinary English word used ordinarily.** `slice` and `gate` are ordinary words this corpus uses constantly; pinning their casing would fire at every sentence start. The proxy: if the word appears in a general STE wordset such as OpenSTE's, it is not a technical name and does not belong here. | judgement, with a proxy |
| 5   | **It is a name, not a synonym.** STE exempts technical names and technical verbs; it does not exempt a fancier word for an approved one. "Utilise" fails this guard, `useSyncExternalStore` passes it.                                                                                                              | judgement               |

**`reject.txt` — every guard must hold, and the bar is deliberately higher.** `Vale.Avoid` flags **all**
occurrences at error severity, so a bad entry here reds the gate rather than merely under-reporting.

| #   | guard                                                                                                                                                                                                                                                                      | how it is settled            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | **The term has actually appeared.** Same rule as `accept.txt` guard 2, and it bites harder: a speculative rejection reds prose nobody has written yet.                                                                                                                     | mechanical (`grep`)          |
| 2   | **A specific replacement is named in the entry's comment.** A rejection with no replacement tells a writer that a word is wrong and not what to write, which is the failure mode STE's own 1,200-word non-approved list avoids by pairing every entry with an alternative. | mechanical (comment present) |
| 3   | **The replacement is not itself in `reject.txt`, and does not collide with an `accept.txt` entry.** Otherwise the two files disagree and the writer cannot satisfy both.                                                                                                   | mechanical                   |
| 4   | **The term is not a technical name.** Rejecting a real domain noun forces circumlocution, which is longer and less precise — the opposite of the point. If it names a thing in the tree it belongs in `accept.txt` or nowhere.                                             | judgement                    |

**Removal guards, which are guards in their own right rather than tidying.**

- **An `accept.txt` entry matching nothing live is stale and is removed.** This is the direction
  `reference-check`'s `stale-allow-marker` already establishes: an opt-out whose token no longer appears
  is a failure, not a pass. The same reasoning applies unchanged, and the check belongs in
  `agent-doc-check`.
- **A `reject.txt` entry whose named replacement has since been renamed or itself rejected is removed or
  updated**, for the same reason: it now points somewhere that does not exist.

**Process.** The entry lands **in the same commit as the prose that first needs it**, with the guard it
satisfies named in the commit body — the repo's existing reason-required-at-the-site discipline, one file
over. `architect` owns both files, for the reasons under "Ownership" below. A writer who is not
`architect` and hits a finding either rewords the prose (the default) or reports the term, exactly as
they would report a `src/` defect rather than fixing it out of scope.

**Ownership: `architect`.** It already owns `rules/`, the repo's other surface where a mechanical
invariant is authored and paired with a fixture, and its charter already covers narrowing or widening
such a rule. The alternative — the orchestrating seat, which authors most of this prose — is rejected on
the record for the reason `orchestrator-prose-has-no-reviewer` gives: that seat has no reviewer, and
handing it one more unreviewed surface repeats a gap this repo has already measured. `product` keeps the
**ubiquitous language** unchanged; that vocabulary is the product's domain and is authoritative over
`features/**`, whereas this one is the toolchain's and governs `.claude/**`. Two vocabularies, two
owners, two surfaces, and they do not overlap.

## Where the Vale procedure gets documented

**Yes — a new article, and CLAUDE.md's own routing test is what says so.** Walking its five branches
against "how to run Vale over a document, and how the vocabulary is governed":

1. **A procedure the orchestrating seat executes, or a gating predicate?** No. Roles run it, and it is
   report-only. Not CLAUDE.md.
2. **A fact about a topic that already has an article?** The nearest is `quality-tooling.md`, and it does
   not fit: its declared subject is the crap4ts patch, the advisory `scripts/` programs, `.gherkin-lintrc`
   and the `jsdoc/*` tier, and its read triggers are all code-facing — an unexpected crap4ts number, a
   `jsdoc/*` finding, touching the lint config. A prose linter over `.claude/**` matches none of them, and
   a reader hitting a Vale finding has no reason to open that file.
3. **Conduct across roles?** Partly — but that routes to `engineering.md`, which is **62,217 bytes, the
   second-largest file in the repo, unconditionally read, and the parent research's own worked example of
   where the growth is now going**. Putting a tool procedure there taxes five roles and this seat on every
   invocation for something most of them never touch. This candidate would be arguing against itself.
4. **Depth about one module's own interface, overflowing a JSDoc hover?** No — that branch routes to a
   `<module>.md` beside the source, and its audience is whoever holds a call site in `src/`. This has no
   call site.
5. **Specific to one role?** The vocabulary ownership is `architect`'s, but "how do I run this over a
   file I am editing" belongs to anyone who edits docs.

So it is a new topic, and the rule is explicit: "A new topic gets a new article, never a new CLAUDE.md
section." **The precedent is already in the tree** — `scripts/acceptance-mutation/` is an advisory program
that outgrew `quality-tooling.md`'s remit and got `acceptance-mutation.md` to itself. Same shape.

**An article is also the cheap option, which is the part worth being explicit about.** Articles are read
on trigger, so a new one costs nothing to any role that never opens it. That is the whole point of the
routing test, and it means "write a new article" and "do not grow the corpus" are not in tension here —
growing `engineering.md` would be.

**Three conditions on it, and the first is the one most likely to be skipped:**

- **It ships with its pointer line in CLAUDE.md and a read trigger in every role file that needs one.**
  CLAUDE.md's rule is blunt about the failure: "an article nobody is told to read is worse than no
  article, because the fact is now invisible rather than merely long."
- **It is authored when this candidate's slice lands, not before.** An article describing a convention nothing yet
  follows documents an intention, and this repo has measured what undated present-tense claims about the
  tree cost it.
- **It ships as `<name>.md` plus `<name>.rationale.md`** — written under the tier
  `rationale-sidecar-pilot` establishes. That is deliberate: the cheapest available test of whether the split is workable is to write
  something new in it, where there is no entangled prose to rewrite and nothing to lose if the answer is
  no.

A working name is `prose-linting.md`. Note **not** `prose-discipline.md`: `orchestration.md` already has a
"Prose discipline" section about claim accuracy, and two surfaces a role could confuse is the thing the
routing test exists to prevent.

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

`.claude/agents/articles/engineering.md` (a new shape-rules section), `state-flow.md` and
`architecture.md` (the two demonstration paragraphs), `CLAUDE.md`'s conventions list (one pointer
sentence, per the routing test). The Vale side widens `.vale.ini` and adds
`.vale/config/vocabularies/<name>/{accept,reject}.txt`. A new article, working name `prose-linting.md`,
shipped as an instruction file plus its own `.rationale.md` sidecar, together with its pointer line in
CLAUDE.md and a read trigger in each role file that needs one. If the vocabulary staleness check is
built, `scripts/agent-doc-check/`. If `jyooi/agent-simple-english` is adopted as a Claude Code plugin
instead, `.claude/settings.json` rather than the Vale paths.

**Sizing.** This is several slices, not one — the shape-rules section, the sidecar rollout to the
remaining files, the vocabulary, and the article are each separable. Split it before promoting any part
of it to `todo/`.

## Open questions

- **Does the pilot's result actually license this?** The parent research's central mechanism —
  that shorter, separated prose improves agent instruction-following — is inferred, not measured.
  `rationale-sidecar-pilot`'s acceptance test 6 is the first real evidence either way. **If it fails,
  this candidate is wrong at the root**, not merely mis-scoped.
- **Does STE make the corpus longer?** It forbids omitting articles and prefers a repeated noun to a
  pronoun. Unmeasured in both directions; measure the byte delta on the first file rewritten before
  claiming a size benefit. If it comes back longer, this trades size for parseability and should say so
  rather than claiming both.
- **Is a byte budget the better instrument than a style rule?** The routing-index split cut the
  unconditional load 56% and left the growth rate untouched. A shape rule is a second intervention on
  the same problem with the same weakness — nothing enforces it. A ceiling on the unconditional set,
  checked by `agent-doc-check`, would fail loudly instead.
- **Does the 25-word cap belong in `.gherkin-lintrc` too?** Step text is instruction-shaped and already
  has a vocabulary control and a `name-length` cap. Possibly free; possibly a fight with domain
  altitude, since naming a thing precisely is what the altitude rule demands and brevity is what this
  one would.
- **Re-derive the caps from the specification before any of them gates anything.** The 20/25-word
  numbers are third-party. The repo's own claim discipline says cite the command, not the number; the
  equivalent here is cite the spec, not the summary.
