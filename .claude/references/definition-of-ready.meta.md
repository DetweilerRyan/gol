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

Bounds A–E in the article are what those four jointly require. A composite total was designed
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
