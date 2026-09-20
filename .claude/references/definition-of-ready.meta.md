# definition-of-ready.meta.md

Evidence and provenance behind `definition-of-ready.md`, named for the Agile Alliance glossary
term since 2026-09-15 — the ruling is recorded at the end of this file. Nothing here is
instruction; read the reference to act.

## Provenance (researched 2026-09-13)

Three sources compose, none adopted whole:

- **The three-layer evaluation architecture** is from a freeCodeCamp article, _How to Build a
  Self-Evaluating AI System_ (Jude Otine, 2026-09): deterministic checks, then an LLM judge
  against an anchored rubric with structured output, then periodic human calibration against
  which the judge is retuned. Two parts did not transfer. Its "temperature 0" determinism
  guarantee has no equivalent here — skill and agent invocations expose `model` and `effort`
  only — so the article states the judge is not reproducible rather than claiming a mechanism
  this harness cannot provide. Its monthly calibration cadence assumed traffic volume; this
  board's cadence is sample-driven instead.
- **INVEST** is Bill Wake's 2003 user-story rubric: Independent, Negotiable, Valuable,
  Estimable, Small, Testable. The letters survive as the mnemonic only. Every predicate was
  re-phrased into this repo's vocabulary, and two (V, T) split by kind.
- **The kind taxonomy** follows SAFe's _enabler_ work items, the industry answer to INVEST's
  acknowledged strain on non-user-facing work. The mapping, for a reader arriving with SAFe:
  contract-bearing ≈ user story; checker-bearing ≈ architecture/infrastructure enabler;
  knowledge-bearing ≈ exploration enabler. SAFe's own vocabulary was not adopted because
  "enabler" would do no work "checker-bearing" does not, and the kind test could reuse a live
  in-repo ruling (whether `product` VERIFY has anything to observe) instead of a definition.
  The enabler value form — state what the work enables, never a fictitious user benefit — is
  V's checker-bearing column. Heck & Zaidman's just-in-time-requirements finding (a backlog
  item is by definition incomplete when first written) is why the bar sits at promotion and
  `candidates/` stays raw.

## Why the board needed a kind discriminator at all

Measured 2026-09-13: 47 of 59 candidates touch `scripts/`, Vale, or `rules/`; 11 mention a
`.feature`; 14 of 61 board files declare a dependency on another slice; 5 of 61 are verdict
records or self-declared indexes. A rubric assuming a user-facing story misjudges most of this
board, which is what made the discriminator mandatory rather than decorative.

## The vocabulary-collision census (2026-09-13)

Words this repo had already defined, which the article therefore avoids or disclaims:

| Term        | Taken meaning here                                                                  | Rubric's move                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| altitude    | Gherkin domain register (mechanised in `.gherkin-lintrc`); JSDoc register           | never used                                                                                                                                     |
| observable  | reachable through the accessible tree                                               | reused in exactly that sense                                                                                                                   |
| testable    | "independently testable": pure logic extractable into a framework-free module       | T keeps the INVEST name; the collision is disclaimed in the letter’s own line (ruled 2026-09-15)                                               |
| independent | independently-testable logic; `product` VERIFY as independent gate                  | I keeps the INVEST name; both taken senses are compounds, so bare "Independent" reads cleanly (ruled 2026-09-15)                               |
| scope       | a file set, or a claim's validity range                                             | never used for breadth                                                                                                                         |
| estimable   | absent — this repo does no effort estimation                                        | E keeps the INVEST name with the not-an-effort-estimate disclaimer; predicate re-founded off the template (ruled 2026-09-15)                   |
| worth doing | `TEMPLATE.md`'s own value phrase                                                    | lives in V’s anchors and the decline disposition, not in name position (ruled 2026-09-15)                                                      |
| spike       | `product`'s acceptance spike; `spikes/` throwaway work                              | readiness spike disclaims the former, matches the latter                                                                                       |
| epic        | `scripts-boundary.md`: "an epic is neither; this sits in `candidates/` as an index" | adopted whole                                                                                                                                  |
| ready       | `hardener`'s "ready for final verification"; `product`'s "scenarios are ready"      | disposition name, and since the 2026-09-15 rename the filename too — the collision moved from avoidance to a disclaimer at the definition site |

## Why the score ranks and never decides

This repo grades nothing else on a scale. Four recorded precedents bound the design:

1. CLAUDE.md: "A written record is not a score, but it makes a skip distinguishable from a
   pass, which was the actual gap."
2. A candidate's ruling: "under a written rule, not a score."
3. A byte-share ranking table was measured wrong by roughly 3x, "by enough to change the
   ordering" — the precedent that attacks ranking itself, and the reason bounds A and B exist.
4. A classifier agreeing with hand labels about 2 in 3 times was ruled "fine for ranking
   files, not for deciding blocks" — the license the design uses, and the source of the
   calibration threshold.

Bounds A–E in the article are what those four jointly require. The unvalidated-first-life risk
was ranked the strongest standing argument against having a scale at all; the ranking moved
here 2026-09-15 on the prose-audit probe's finding, since it is an account rather than a
constraint — the risk statement and bound E's expiry mechanism stay in the reference. A composite total was designed
and rejected: six independent errors compounding into one unauditable ordering is precedent 3's
exact shape.

## Rejected alternatives

- **One skill with a named mode** (the `product`/`architect` idiom). Rejected 2026-09-13: a
  skill is invoked by name so a mode cannot be omitted, the three entry points want different
  frontmatter (the assess path must not hold Write), and a judging seat that can act on its own
  grade is the shape the exemption rules already forbid twice.
- **A gating checker for the board.** Rejected by the user 2026-09-13: CLAUDE.md's ungated
  ruling stands; everything reports, nothing fails.
- **oxlint for Layer 1.** Its plugins are JS/TS AST plugins; it has no Markdown processor, and
  overrides select rules, not parsers.
- **Widening `npm run reference-check` to `ideas/`.** The exclusion is argued in that
  checker's own scan-scope module: an idea file names dead references as worked examples by
  design.
- **A heading-vocabulary rule.** 22 of 61 board files open with SCQA instead of Context and 12
  use Answer for Sketch; a rule lands ~30 findings the slice cannot clear, which the landing
  constraint forbids.

## The three literal path couplings intent-driven-layout would break

`intent-driven-layout` (a live candidate) proposes moving the lanes under an `openspec/`
layout. The article survives that by naming lanes, not paths. Three planned artifacts cannot:

1. The `PostToolUse` hook's path filter on `ideas/**` in `.claude/settings.json` (child 3).
2. The `[ideas/**/*.md]` section planned for `.vale.ini` (child 3).
3. The lane derivation inside the assess skill's Layer 1 shell check (child 3).

A migration slice must update all three; this list exists so it finds them.

## First run of the rubric (2026-09-14)

<!-- reference-check: allow the-vale-fixture-harness-is-gated-by-nothing.md -- deleted 2026-09-14
     when the run below ruled it landed work; this dated record legitimately names the dead file -->

The epic's stop condition: hand-assess three candidates chosen to exercise the exits, and stop
before child 3 if no disposition changes a decision the user would otherwise have made. The
three chosen: `effective-prose.md` (expected epic), `architect-designs-for-parallelism.md`
(expected spike), `the-vale-fixture-harness-is-gated-by-nothing.md` (expected ready).

The judge's readings, run 2026-09-14 by the orchestrating seat against the landed article:

1. **`effective-prose.md` — epic, via the slice check.** A self-declared index with waves and its own
   hold; caught before any letter was scored. Confirms the expected disposition and the existing
   handling. No decision changed.
2. **`architect-designs-for-parallelism.md` — spike, via V.** The file's own first open question
   concedes the premise may be capped by the serial landing gate, and names the unrun
   measurement: how often a rebase actually conflicted across recent slices. V=2 with that
   finding — the score cannot be raised by editing, so the disposition is a spike targeting V
   and I. Converts a stalled 299-line design into one cheap named measurement.
3. **`the-vale-fixture-harness-is-gated-by-nothing.md` — NOT ready, against expectation.** T's
   checker-bearing anchor 4 asks for the command's reading today. Read: the program exists and
   gates — `scripts/vale-fixture-check/` landed 2026-09-12 in `1f9229c`, the same day the
   candidate was filed, and passed in both of that week's merge gates. The candidate is stale
   work-already-landed, on the board because the slice never came through the promote flow, so
   the delete-your-own-file rule never fired. Disposition: close as done and delete. An earlier
   survey had ranked this file the board's most ready candidate, so the anchor question is what
   stopped a dead promotion.

**Stop-condition verdict: the rubric changed a decision** (reading 3), so the epic's children 3
and 4 stay live. Secondary finding: the board can hold landed-but-undeleted candidates, a
hygiene class the assessment's T anchor detects for free.

**The human ruling, 2026-09-14: agree on all three records.** Per letter, for the calibration
count: record 1, disposition agreed (no letters scored); record 2, V and I agreed; record 3, T
agreed. First calibration pair complete — 3 of 3 dispositions agreed, no letter divergent, no
anchor rewrite indicated at this sample size.

One observation from the ruling: the records named the kinds in house vocabulary and never said
"enabler", although all three are enablers in SAFe's terms. The mapping sits in this sidecar by
design, but the reader had to look it up. Whether every record's kind row should carry the
one-line SAFe orientation is an open article question for the user.

## The rename to the glossary term (2026-09-15)

Ruled by the user: use Agile Alliance glossary vocabulary when possible
(agilealliance.org/agile101/agile-glossary/). The pair was filed as a house coinage to keep the
loaded word "ready" out of a filename; the user reaffirmed the glossary direction after hearing
that argument, so the protection inverted — the glossary name stands, and the reference's header
now disclaims the repo's other senses of "ready" at the definition site. The glossary's own DoR
entry (agilealliance.org/glossary/definition-of-ready) matches this file's shape on two points:
INVEST as the foundation matrix, and readiness as the team's standing to push back on
ill-defined work — which is what the four dispositions mechanise. Definition of Done is the exit
checklist in that vocabulary; this repo's is `hardener`'s stages plus the merge protocol, and it
is not this file's subject.

## The letter-name review (2026-09-15)

Ruled by the user, one letter at a time: every letter keeps its INVEST name. The adapted names
the rubric shipped with ("lands alone", "need, not solution", "worth doing", "size is
judgeable", "split signal", "observability") demote into the predicates and anchors, where the
operational tests survive unchanged. The pattern is the same one the file's own rename set:
standard vocabulary primary, collisions disclaimed at the definition site rather than avoided.

Three substantive changes rode with the renames:

- **N re-anchored to INVEST proper.** The letter now asks whether the file is a proposal rather
  than a contract; need-versus-solution is the observable evidence, not the definition. Directed
  by the user with the instruction to be accurate to INVEST, not to `TEMPLATE.md`.
- **E re-founded off the template.** The old predicate read a named template section, and that
  coupling had two defects: it dangles if the template reshapes, and the section it leaned on
  rewards the pre-negotiated file set N penalises (captured as
  `the-touches-section-fights-negotiable.md`). E now asks whether size can be bounded from what
  the file says, wherever it says it. Bill Wake's own retrospective was researched first: he
  calls Estimable the most-abused letter and would re-pick "E = External" — declined here as a
  duplicate of V, since his External derives from his Valuable discussion and this rubric's
  per-kind V columns already point value outside the work (xp123.com, "Estimable Stories in the
  INVEST Model").
- **S's top anchor stopped rewarding a closed file set.** "Every path exists today" paid
  candidates to write contracts; the anchor now rewards a reach bounded tightly enough that a
  split would have nothing to separate.

## The fitness-function precedent for checker-bearing T (2026-09-15)

Researched at the user's direction after the letter review, asking what Testable looks like for
an enabler in existing practice. Two precedents found:

- **SAFe's enabler acceptance criteria** are lists of tool-checkable outcomes — builds passing,
  coverage figures, a rollback tested — with the guidance that technical stories need more
  precise criteria than user stories, not less. Confirms the column's direction; supplies no
  ladder.
- **Architectural fitness functions** (Ford, Parsons and Kua, _Building Evolutionary
  Architectures_; Thoughtworks' fitness-function-driven development) — an objective, automated
  assessment of an architectural characteristic, written the way TDD writes tests for features.
  This repo's gating checkers, mutation floor, and ast-grep rules are all triggered, atomic
  fitness functions in that taxonomy, and the checker-bearing T anchors were already a
  fitness-function ladder without the name: name the check, its reading, the reading before and
  after, prove it can fail.

Two consequences were adopted the same day. The kind check's checker-bearing line carries the
orientation label, matching the SAFe-labels pattern. And the anchor cells widened from
"command" to "check": the taxonomy's triggered-versus-continual axis covers a finished state
held by a standing measurement rather than a per-run command — this repo's render-perf stance
(held by the architecture, measured when the orchestrating seat judges a slice perf-relevant)
is the live instance.

One confirmation worth recording: the top anchor's "names what would make the reading a
confident zero" is independently required by the fitness-function literature — a check that
cannot fail measures nothing — and is the same principle the repo's bad-fixture discipline
enforces. House practice and published precedent converged on it separately.

## The template reshape and its provenance (2026-09-15)

<!-- reference-check: allow the-touches-section-fights-negotiable.md -- the slice deleted its own
     idea file on landing, per the board's rule; this dated record legitimately names it -->

`ideas/TEMPLATE.md` moved from Context / Sketch / Touches / Open questions to SCQA — Situation,
Complication, Question, an optional shaped Answer, an optional No-gos, then Open questions. The
slice was `the-touches-section-fights-negotiable`, whose idea file carried the research and was
deleted on landing per the board's rule; this section preserves the evidence.

**The conflict that forced it.** The old Touches prompt asked a raw candidate for a file set —
a solution committed before any implementer looked, which the Negotiable predicate reads as a
contract. The template rewarded on one section what the rubric penalised on another. Surfaced
2026-09-15 while re-founding the Estimable predicate off the template.

**Why SCQA.** Three facts: 22 of 61 board files had already drifted to SCQA openers (measured
2026-09-13); the Question section is negotiability by shape — an explicit open question is a
proposal; and the rubric's E and S had been re-founded off the template by name the same day,
so the reshape cost the assessment machinery nothing.

**The precedent research, condensed.** SCQA proper is Minto's Pyramid Principle structure with
consulting pedigree and no found backlog-template precedent — the claim is transfer, not
adoption. Shape Up's pitch (Problem, Appetite, Solution, Rabbit Holes, No-Gos) is the closest
engineering cousin: its Appetite exists instead of an estimate, matching this rubric's
Estimable ruling and Wake's retrospective independently. Two imports were taken: the
shaped-not-specified register for the optional Answer, and No-gos as a named section the board
already grew organically. One divergence is deliberate: Shape Up insists problem and solution
travel together, and an optional Answer is more negotiable than it allows. Two tool
comparisons were run and declined: a pitch-walker plugin (gates against the board's no-gate
ruling; pitch directories against the name-is-identity chain) and Shape Up's author's own
shaping skills (non-evaluative, no conflicts, named as the technique source for shaping-type
spikes rather than adopted).

**What moved with the template.** The assess skill's Layer 1 shell check became era-aware: a
file opening with Situation is checked for Question and Open questions; a legacy file for
Touches and Open questions — the sweep of the 60 legacy board files was ruled a no-go, so both
shapes stay live. The capture skill's rules follow the new shape. Two residual section
references in `definition-of-ready.md` were re-founded, and CLAUDE.md's file-shape line
follows the template it describes.

## The assessment record (ruled by the user 2026-09-19 and 2026-09-20)

The record was a conversation turn whose only durable trace was a promotion commit's body. An
idea assessed and never promoted left nothing at all. The user ruled the judging skill
model-invocable, and ruled that it writes its own record beside the idea.

The rulings, by date:

- **2026-09-19.** The record persists beside the idea and survives promotion. A re-assessment
  replaces it while the idea sits in the ideas lane; after promotion it is immutable. Promotion
  verifies sync before granting, as a correctness precondition rather than as a board gate.
- **2026-09-20, the hash.** The stored id is the git blob hash. It is the id git already assigns
  the file, so the assessed text stays retrievable by that id and sync is a comparison against
  the committed tree rather than a second scheme. Measured the same day: the id survives rebase
  and squash unchanged, since content alone determines it. Only retrieval is at risk, and only
  where a squash swallows the commit that captured the assessed state and the unreachable object
  is later pruned. The sync verdict holds in that case regardless.
- **2026-09-20, four mechanics.** The judge fork writes the record itself. The skill stays one
  invocation per idea. The record is the single home of the detailed assessment. The frontmatter
  carries the hash, and Layer 1 enforces no further shape.
- **2026-09-20, the record's shape.** A summary table opens the record, one row per letter with
  the letter spelled out, and a detail section per letter follows in the same spelling. Three
  columns, because a score column alone would break the bound that a number never travels
  without its finding text at the altitude a reader skims. Rows hold INVEST order, since sorting
  by score is a ranking device the bounds forbid.
- **2026-09-20, the human's half.** It lives in the record, judge's half first. The calibration
  design turns on the human label being ruled against the judge's rather than merged into it, and
  the order is what keeps the two readable as two.

**The name, ruled by `coach` at SPEC and confirmed by the user 2026-09-20.**
`backlog/ideas/<name>.assessment.md` in the ideas lane, `assessment.md` in the item's folder. The
second form is a bare filename token `npm run reference-check` resolves by basename, so four files
carry an allow-marker of the shape the board's other unlanded artifact name already carries — the
multi-unit task list, named in CLAUDE.md and in the pipelines reference with exactly that marker.
The first form costs nothing: the
extractor discards a token whose basename starts with a dot, which is what the placeholder form
reduces to.

**Frontmatter, and which field is weakest.** `idea-blob` is the fact that forced the exception —
no position supplies it. `assessed` is a claim about when the judging ran, which `git log` can
corroborate but not state. `name` is the weakest of the three: it restates the basename in the
ideas lane and the folder after promotion. It stays because it is the slug that survives both
moves and binds the record to its idea independently of position. A later ruling may drop it
without touching the other two.

**`assessed:` deliberately does not reuse `created:`.** The board's `created:` field means the
day a candidate was filed. Reusing the spelling would let a reader take one date for the other.

## The ruling decouples from promotion (ruled by the user 2026-09-20)

The first draft of this design had `/idea-promote` write the human's half into the record as a
second commit. The user ruled that the ruling is its own act, made at any time after the judging
pass and before promotion. Promotion then moves a record that is already complete, and writes
nothing inside it.

**Open question 1, as the proposal posed it, is settled by that ruling plus one `coach` ruling.**
The human's half leaves the promotion commit's body entirely. It lives in the record, and the
commit that records it is its own. The objection considered and answered: a commit body is
immutable and a file is not, so moving the human's half into the file looks like a loss. It is
not. The ruling commit's diff is held by git exactly as a body is, and the promotion's judge
summary gives a second fixed point a tampered record can be checked against.

**Sub-decision 1 — a third skill, `/idea-approve`, rather than the seat editing by hand.** Four
reasons: a hand-edit is the class of act this artifact exists to remove; the skill compares the
blob id mechanically rather than by eye; it refuses deterministically on a missing record, a stale
record or a ruling missing a letter; and `disable-model-invocation: true` keeps the grant human,
as `/idea-promote` already does.

**Sub-decision 2 — the ruling inherits the record's staleness, with no second stamp.** The ruling
sits inside the record, the record carries `idea-blob`, and a re-assessment replaces the record
whole. So a stale ruling is a stale record, and promotion's existing comparison covers both
halves.

The threat this accepts: a judge's half edited by hand after the ruling, with no re-assessment. A
second stamp over the judge's half would catch it; the inheriting reading cannot. Accepted for
three reasons. The board has one editor, so the hand-edit is a discipline breach rather than
drift. The never-edit rule already governs the judge's half. And a second stamp has no git-native
id to use, since git ids whole files rather than sub-ranges — it would be the bespoke scheme the
blob-hash ruling exists to avoid. What would reopen it: a second editor of the board, or one
observed instance.

**Immutability, stated for the decoupled lifecycle.** The record is mutable in the ideas lane, by
re-assessment and by a second ruling, and immutable from the promotion's move commit. One
sentence was needed beyond what replacement already said, and it sits in `/idea-approve`: a fresh
assessment discards the ruling, because the ruling was given on findings that no longer stand.

## Rules on the record surface (ruled by the user 2026-09-20, reversing a `coach` ruling)

`coach` ruled at SPEC that no rule should be enabled on the record, on three arguments: the board
is a raw-register surface, a finding on a frozen record cannot be cleared without breaking
immutability, and the surface cannot be measured because no record exists. The user reversed it
and directed that rules be enabled.

**The recommendation.** The three `Claim` rules — `AudienceRoster`, `WordingIdentity` and
`SentenceInitialMost` — at `warning`, on a `.vale.ini` section scoped to
`[backlog/ideas/*.assessment.md]`, with explicit per-rule keys and no `BasedOnStyles`. The section
must sit after `[backlog/**/*.md]`, since sections stack and the later one wins per key, and it
must not name a style in `BasedOnStyles`, which would re-enable the whole style and destroy the
earlier per-rule keys.

**The immutability argument survives the reversal and is answered by the glob, not dropped.** A
record in the ideas lane is mutable, so a finding there is clearable. A promoted record matches
only `[backlog/**/*.md]` and keeps `Board.NoStatusField` alone, so a frozen record never carries a
clearable finding. The lane-scoped section is the whole answer, and it is available only because
Vale's sections are path globs.

**The evidence, given that the surface cannot be read.** Each rule's own header carries a dated
2026-09-15 precision run over the instruction corpus: three hits in total, zero on every enabled
surface, zero clean false positives. These are phrase fingerprints rather than register
heuristics, so their false-positive surface is bounded on an unmeasured corpus. They also
mechanise three forms of `claim-discipline.md`, which is the record's binding rulebook, so
enabling them adds no second standard.

**The register families wait for a corpus.** `STE`, `Instruction` and `Procedure` are not
recommended yet: their false-positive surface is unbounded here,
`Instruction.ParagraphSentences` looks likely to fire on a per-letter detail section, and the
landing constraint forbids enabling over a backlog nobody has counted. Re-ask at roughly ten
records.

**Why the enable did not land in the slice that created the artifact.** Two independently
sufficient reasons, both measured 2026-09-20.

1. `.vale.ini` is `architect`'s by practice and outside `writer`'s surface. `git log -- .vale.ini`
   shows every role-attributed commit reading `By architect.` except one,
   `By the orchestrating seat.` on the process-pipeline staffing commit. `writer.md` enumerates
   its write surface, and `.vale.ini` appears in neither that grant nor its prohibition list. The
   `enabler-process` cycle has no `architect` step to route the edit to.
2. The enable alone would not reach the judge at the one moment a record is fixable.
   `scripts/prose-write-hook/audit.ts`'s `inScope` accepts only paths under `.claude/skills/` or
   `.claude/references/`, so the write-time prose loop refuses a `backlog/` path whatever
   `.claude/settings.json` sends it. Extending it is a `scripts/` change with its own unit test.

**What is reachable without either change.** `npm run prose-lint` lints every tracked `*.md` minus
`src/catalyst/`, so the board is already in its file set. Measured 2026-09-20:
`npm run prose-lint -- --scope backlog` linted 115 tracked files and reported zero findings. An
enabled rule would show up in that standing run, just not at write time.

**What the corpus may therefore not say.** No instruction file states that nothing lints the
record. That would be an undated present-tense claim about another file, falsified on the day the
follow-up enabler lands.

## What the board checkers do with the record (read 2026-09-20)

Read off `scripts/board-shape-hook/board-shape.ts` at tip `44bbf55`, rather than run: the
classifier's candidate test is positional, and treats any two-segment board path as a flat idea
file. `backlog/ideas/<name>.assessment.md` has two segments, so a record written into the ideas
lane is measured as an idea file and reports findings against a shape it does not have — a name
that does not match the basename, a missing title, a missing created date, and the two missing
section headings. `.claude/settings.json` wires the hook to every `backlog/**` write, and the
outcome delivers, so the envelope reaches the judge that wrote the file.

The skill's write rules therefore tell the judge to assess only against the Layer 1 output
injected above its own text. The classifier fix belongs to
`checkers-do-not-reach-the-assessment-sidecar`, which owns `scripts/` and already carries the
question of which board files are records rather than proposals.

In the item's folder the same classifier reads three segments and a basename other than
`proposal.md`, so it prints its non-candidate refusal and delivers nothing. That half needs no
change.

**One constraint this artifact hands the dependent enabler: the hash check is lane-sensitive.** A
mismatch in the ideas lane is staleness. A mismatch in `ready/` or `done/` is expected history,
because the promotion procedure freezes the record and then fleshes out the proposal in the next
commit. A predicate that reads the two lanes alike would report every promoted item as stale.

## The path-qualified `Write` grant (probed 2026-09-20)

The judging skill's grant is written as `Write(backlog/ideas/*.assessment.md)`. Probed against the
installed Claude Code binary, build 2.1.236: it carries the literals `"Edit(docs/**)"` and
`"Edit(//etc/*)"`, the repo-relative and absolute forms of a file-tool path specifier, so the
permission-rule grammar accepts a path-qualified rule for a file tool in that build. The
`--allowed-tools` flag's help text gives `Bash(git *) Edit` as its example, the frontmatter
validator stores entries as raw strings, and this repo already depends on `Bash(git *)` in the
same field.

Unproven, and stated as such: that a skill's `allowed-tools` entries are evaluated by the same
matcher as `settings.json`'s `permissions.allow`. The probe read strings from a stripped binary
rather than a code path.

No spike was filed, because every failure mode is acceptable and one is loud. A binding specifier
scopes the grant, which is the goal. A non-matching entry refuses the write, and the skill reports
that it could not write the record at first use. An ignored specifier leaves an unscoped `Write`,
which is where a prose-only constraint already stood. The fallback, if the write is refused, is
`Write(backlog/ideas/**)`.

## `kind:` is written after the move (ruled by `coach` at amendment 2, 2026-09-20)

The board's earlier rule had the orchestrating seat write `kind:` into the idea file when it
recorded the ruling. That moment stopped existing when `/idea-approve` took the ruling over,
since that command commits the record alone.

The deciding argument is not the moment. It is the blob. `idea-blob` is the idea file's git blob
id at assessment, and any edit to that file changes it, `kind:` included. So a `kind:` line
written between the assessment and the promotion makes the record stale by construction, and both
`/idea-approve` and `/idea-promote` refuse a stale record. The only safe moment is after the move
commit.

`/idea-promote`'s step 4 already did that write, framed as a fallback for a proposal that arrived
without a `kind:` line. The amendment promotes the fallback to the rule, because no earlier write
is possible.
