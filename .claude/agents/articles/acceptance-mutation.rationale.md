# Rationale: The acceptance-mutation Runner

**Audience:** whoever is changing a rule in `acceptance-mutation.md`. **Read when:** you are amending,
narrowing or overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file. `acceptance-mutation.md` is written to be actionable on its
own; this file holds the evidence behind it, so a rule can be argued with rather than only obeyed.
Everything below is history: what was measured, in which slice, by what method, and which readings were
later corrected. Several figures describe trees that no longer exist — **do not quote a number forward from
this file without re-deriving it.**

## Where this article came from

`acceptance-mutation.md` was extracted verbatim from CLAUDE.md at `b5e333e`, lines 225-259. No prose was
edited in the extracting commit. Only the common leading indent of a fragment lifted out of a nested list
was removed.

## What this split found, and it is the worst set so far

Every enumeration was re-derived on 2026-09-09, by running the tool and by counting the tree. **Three were
wrong.** No previous split found more than one.

| claim in the article                               | re-derived          |
| -------------------------------------------------- | ------------------- |
| "five of the ten features carry no Examples table" | **seven of twelve** |
| "55 cells, 55 mutants, before and after"           | **91 mutants**      |
| "four Examples headers"                            | **eight distinct**  |
| "zero decimal values in any cell"                  | still true          |

**The one that still holds is the one the argument needs.** The re-open trigger below turns on there being
no fractional value in any Examples cell, and that is still true — measured by scanning every table row in
`features/` for a `\d+\.\d+`. So the ruling it supports survives, while three of the four figures around it
had drifted.

**Read that as the case for re-deriving rather than auditing.** All three stale figures were faithfully
preserved by every pass that touched this file, because an audit compares prose against prose. Only running
the tool moved them.

The features carrying no Examples table, as of 2026-09-09, are `appearance-preference`,
`camera-pan-and-zoom`, `generation-control`, `grid-scrollbars`, `infinite-grid`,
`keyboard-grid-reachability` and `while-the-pattern-library-is-open`. The article names none of them, and
`npm run acceptance-mutation` prints the list on every run.

## Why the runner is batched rather than per-mutant

`architect` ratified the batched form over a per-mutant-spawn alternative on cost. Measured **215.3s against
a greater-than-400s floor** for the per-mutant form, with an identical verdict either way.

## What the parser-adapter slice bought, measured

The `gherkin-ast-mutation` slice deleted the line-oriented `gherkin-examples` module — a scanner for
`/^\s*Examples:\s*$/` that re-rendered a whole table row at a hardcoded 6-space indent. The registry
replaced it, reproducing that scanner's mutants byte-for-byte at the time.

**The registry's value was measured at review with a throwaway `scenario-name` kind that ran end to end.**
Adding it cost **one** new `*-sites.ts` file, plus one widened union line and two registry entries in
`mutation-sites.ts`, and **zero** lines changed in `gherkin-document.ts`, `text-span.ts`, `mutant-plan.ts`,
`mutation-rules.ts`, `report-format.ts` or `run.ts`.

**A kind needing a new traversal root widens the adapter too, additively.** A `Background`-steps mutator
wants a `listBackgrounds` beside `listScenarios`, because a `Background` nests under both `Feature` and
`Rule`, and a finder walking `doc.feature.children` itself would re-solve the Rule-nesting the adapter
already owns.

## The classifier defect this runner repaired

The error-on-mismatch half of the classifier continues a repaired defect from this module's original
vitest-based form, rather than being a precaution reinvented for Playwright. The old classifier read a
nonzero exit plus vitest's ordinary failure chrome as a kill. So a steps file broken at _import_ — zero
tests collected, exit 1 — scored as a kill on every mutant, and a wholly broken suite would have reported
100%.

## The vacuous hundred percent, measured on a red feature

Undocumented until `dark-mode-following-system-appearance`'s CONTRACT pass. Measured on that slice's
contract, whose seven scenarios were **all red** under `npm run test:e2e`:
`npm run acceptance-mutation -- --feature appearance-preference` still printed `0 mutants (no Examples
table)` and `mutation score: 100.0%` at **exit 0**.

`run.ts` filters `activePlans` to plans with at least one mutation site before `runBaselinePhase` ever sees
them, so a table-less feature skips both phases.

**Why the zero-mutant state is designed rather than a warning.** Since `prune-gherkin-to-domain-language`, a
table-less scenario costing zero mutants is the lever that slice pulled.

## The flat temp tree, and the nested-feature gap

**Why `/` → `__` rejects rather than encodes.** The mapping alone is not injective: `a/_b.feature` and
`a_/b.feature` both give `a___b.feature`. Rather than prove a cleverer encoding collision-free, the deriver
rejects the input that makes the flattening unsafe.

**Why the check is scoped to active plans.** `baseName` runs only over active plans, so a table-less feature
under an underscored directory is reported as an ordinary zero-mutant target and never throws. Measured both
ways with a planted probe.

**The recursive-discovery gap, measured.** `playwright.config.ts`'s `bdd` project globs the non-crossing
`features/*.feature`, and its generated-output guard reads `readdirSync(FEATURES_DIR)` non-recursively. So a
nested `.feature` would be mutated by this runner and never run by `npm run test:e2e` at all. Measured with
a planted `features/probe-nested/probe-nested.feature`: `acceptance-mutation` discovered it, flattened it,
and scored it 2/2, while `npm run test:e2e -- --list` stayed at **74 tests in 14 files**, the same total as
the run without it. The totals line is what was compared, not the full listing.

`npm run gherkin-lint` does recurse, reported against the nested path with the same probe, so `product`'s
lint gate is not part of the gap. `intent-driven-layout` owns `playwright.config.ts`.

## The swap class: why it was worth adding

**A component-change is caught by "every cell the table names is on screen".** A **swap whose transpose is
already a live cell of the pattern** passes that check vacuously, and is caught only by the reverse
assertion, "and nothing else is".

Measured per pattern, counting swappable pairs whose transpose is already in the set: Pulsar 48 of 48,
Beacon 4 of 4, Block 2, Beehive 2, Toad 2, Glider 2, LWSS 2, and Blinker **0**. So seven of the eight
patterns can produce a mutant that only the reverse inclusion kills, and the landed dump contained one:
Pulsar's `(12, 9)` → `(9, 12)`.

**This is what makes `features/steps/pattern-library.ts`'s bidirectionality load-bearing rather than
belt-and-braces.** It is also the class the flat splitter structurally could not express: it never sees a
tuple's two components, so it could never propose transposing them.

Measured over the table as it stood: 6 component-change, 2 swap. `stripParenAffixes` — the flat splitter's
paren-shaving patch, which shredded `(0, 0), (1, 0)` into unbalanced `(0` and ` 0)` fragments and shaved the
punctuation back off — was deleted by the same slice.

## The decimal regression, and why it was closed without code

**A paren pair with decimal components is a measured regression against the pre-slice code.**
`TUPLE_LIST_SHAPE` requires `-?\d+`, so `(-32, -22.5)` — the app's own default camera offset, half-cell
because 900 divided by 20 is 45, which is odd — is coordinate-shaped, paren-delimited and **rejected**. It
falls through to a `mutateCommaList` that is no longer paren-aware. `stripParenAffixes` used to expose `-32`
to the integer rule and `-22.5` to the decimal rule and produce same-length numeric mutants; the
fall-through shatters the punctuation instead.

Two independent runs mutated that value under N seed keys, counting mutants that reduced a
decimal-tolerant pair regex's match count — `/\((-?[\d.]+),\s*(-?[\d.]+)\)/g` — below its baseline of 1.
Pre-slice `e2d4a63` scored **0/40** and **0/400**. The slice tip scored **30/40**, from `product`'s keys at
the tuple slice's VERIFY, and **28/40** plus **285/400** from this adjudication's. **Read the rate, not
either constant** — the keys differ.

The harm is the `comma-list-mutants-are-all-syntax-breaking` class reopening for this one shape. Such a
mutant still **dies**, but through the parser silently dropping an unparseable item rather than through the
assertion noticing a wrong coordinate.

### The three things that narrowed it

`tuple-grammar-rejects-decimal-components` was closed without code, and these are why.

**First, the regex the count is taken under is part of the claim.** Under the repo's own pair grammar,
`-?\d+`, in `features/steps/pattern-library.ts` and byte-identically in both PAIR oracles, `(-32, -22.5)`
matches **zero pairs at baseline**. So that count is **0/40 on both trees**, and the regression is invisible
to every consumer that exists today. It is the same degeneracy that scores `[0, 0], [1, 1]` at 0/40 on both
trees, since a paren regex sees nothing to shorten. **Reading either row as a pass is the error the split
exists to prevent.**

**Second, the clean-to-broken claim does not extend to the other near-miss filed beside it.**
`(0, 0)-(12, 12)` measures **6/40 pre-slice** against 27/40 at the tip. So the slice worsened a shape
already partly broken, rather than breaking a clean one. `stripParenAffixes` shaved one paren per fragment
side and the interior fragment `0)-(12` matched neither, which is also why its pre-slice cleanliness on the
decimal pair was incidental to a function never designed for decimals.

**Third, no gate reports any of this in either direction.** A syntax-broken mutant still dies, so
`npm run acceptance-mutation`'s score does not move when the class reopens or closes.

### Why the trigger is stated from both sides

Two roles can independently build the world where this bites, and nothing mechanical will say so.

**From `product`'s side**, the trigger is an Examples cell that is paren-delimited and carries a non-integer
numeric component. Measured against the landed `VALUE_RULES` by tracing which entry fires: **`mutateDecimal`
is reached exactly when a cell, or one of its trimmed comma-split fragments, is _wholly_ `-?\d+\.\d+`**. So
`1.5` reaches it directly and `0.25, 0.5` reaches it through `mutateCommaList`'s recursion, while
`(1.5, 2.5)` and `(-32, -22.5)` reach it **not at all** — `isTupleList` rejects the non-integer component,
the comma-list rule claims the value instead, and each fragment carries a paren that fails the decimal
pattern and lands in `mutateString`. A tuple component cannot reach it either, `TUPLE_LIST_SHAPE`'s
components being integer-only.

**So a column that trips this trigger cannot exercise `mutateDecimal`, and a column that exercises it cannot
trip this trigger.** The `cells` column cannot legitimately go fractional, `CellKey` being integer, and `expected center x/y` is the
blinker's centre _cell_ rather than a viewport centre.

`ideas/candidates/decimal-mutant-magnitude-is-precision-independent.md`'s last open
question proposes adding a decimal column, and the two are **disjoint** rather than coupled. This sentence
claimed the opposite until `correct-decimal-coupling-claim`, and the inversion is the more dangerous
direction, because it reads as a warning while licensing the one column shape that measures nothing.

**From `scripts/`' side**, the trigger is any widening of `TUPLE_LIST_SHAPE`'s `-?\d+`, or of the step's
PAIR regex. Widening also makes `mutateDecimal`'s filed `KNOWN DEFECT` reachable **through a tuple
component**, which nothing does today. Measured on a widened copy of the grammar: `(1.5, 2.5)` then
dispatches `tupleList` and recurses to `decimal` on `2.5`. **Read that as the mechanism and not as
exclusivity** — a bare `1.5` cell reaches `mutateDecimal` through the route that already exists, with no
widening at all.

**Neither remedy the closed candidate weighed was free.** Widening the grammar drags `product`'s step regex
with it into a two-role slice. Restoring paren-awareness in the fall-through reinstates the
two-theories-of-a-coordinate-list problem `cells-column-has-two-parsers-and-neither-models-tuples` existed
to remove.

**What made closing right is not that the regression is small.** It is that `.gherkin-lintrc`'s
`no-restricted-patterns` bans `\boffset ?[xy]\b`, so the one genuinely fractional quantity this app has is
precluded from the contract by the altitude linter rather than merely absent from it. That is a claim about
today's contract rather than about the code, which is why the trigger is stated from both sides rather than
left as "no column has this shape".

## The delimiter measurement behind the closed class

Measured twice, independently, by mutating a four-item column of each shape under 40 seed keys and asking
whether the mutant still parses as four well-formed items. The paren control is **40/40 preserved** and
`((x, y))` is **0/40** in both runs. **Those two rows are the finding.**

The other-delimiter shapes come out at 0 to 3 of 40, depending on which 40 keys are drawn. `product`'s pass
read `[x, y]` as 0/40 and the architect review's as 1/40, at the same sample size with different keys. That
residual is incidental rather than arming: it is the free-text mutator happening to land outside the
delimiters.

**Read the two decisive rows, not the residuals.** A column that preserves its shape 39 times in 40 is not
safe. It is a column whose next mutant is the old class again.

## Which assertion reports which class, measured in three runs

Each run hand-applied one mutant of the `Block` row to `features/pattern-library.feature` and ran
`npm run test:e2e -- --project bdd --grep "Each pattern in the library has a category"` — 8 tests, 1 failed
and 7 passed every time.

1. **The old-class mutant** (`…, a1, 1)`) is reported at the `toHaveCount`. `parseCellList` collects pairs
   with `matchAll`, so an unparseable fragment is silently dropped, `expected` is short by exactly one, and
   the count is reached first.
2. **The new-class mutant** (`…, (4, 1)`) is reported at the **first direction of the set equality**, naming
   the expected-but-absent `(4, 1)`. The count passes on the way through, because the list length never
   changed.
3. **"Reported first" is not "the only thing that catches it".** So the count was neutralised for that row
   and run 1 repeated: the old-class mutant is then caught by the **second** direction.

Those three assertions are cited by role rather than by line, because a line number in this paragraph is
invalidated by an edit to a comment. That is the cheapest possible way for a measured claim to go stale, and
it happened during the run. The three assertions were that file's lines 107, 115 and 116 when this was
measured, and 123, 131 and 132 after `product` rewrote the step's comment block later in the same slice.

## Why the headline figure cannot move

**Both classes are lethal**, so the run scores 100% on either side of the slice, and anyone comparing a
before-and-after figure will conclude nothing happened.

Measured: the old class is 8 of 8 short by exactly one item, which the count catches. The new class is 8 of
8 same-length carrying exactly one coordinate the table never named, which the first inclusion direction
catches. What the slice bought is **which assertion earns the score** — the named-but-absent direction went
from exercised by zero `cells` mutants to all eight.

**Expecting the split to move the score was a framing error made twice while the slice was in flight.** It
is recorded so the next reader does not make it a third time.

## The split itself, measured

Split by `split-acceptance-mutation-article`, 2026-09-09. Figures taken after the final content commit, on
the tree that commit produced. Re-derive rather than quoting these forward.

| Measure                            | Before |  After |
| ---------------------------------- | -----: | -----: |
| Article bytes                      | 26,554 | 15,880 |
| Sidecar bytes                      |      — | 18,611 |
| Blocks in the article              |     21 |     84 |
| Rationale bytes inside the article |  1,343 |  9,898 |
| Entanglement                       |   100% |    62% |
| Backticked slice slugs             |     11 |      3 |
| Vale mechanical findings           |     76 |      0 |

**This article entered at 100% entanglement and the lowest measured rationale share in the corpus, 5%.**
Both readings are artifacts of block size rather than of content. The article is twenty paragraphs averaging
over 1,300 bytes, and a block that large almost always contains a directive somewhere, so the classifier
calls nearly all of it directive. Reading 1,343 rationale bytes as "there is little to move" would have been
wrong by an order of magnitude: the sidecar this split produced is far larger than that figure.

**Entanglement fell 38 points, 100% to 62%, the largest fall the tier has recorded.** `quality-tooling.md`
fell 12, and the two other prose articles rose. The reason is the same one that explains the fall there:
this article held several separable evidence blocks — the delimiter runs, the decimal measurements, the
per-assertion runs — that could leave whole rather than being unwoven from the rules around them.

**That is now two articles where a 100% entering figure fell hard.** Read a 100% entering entanglement as
uninformative rather than as bad news: at these block sizes it says only that every block is large enough
to contain a directive somewhere.

**That is the third independent confirmation that the classifier's pre-split rationale figure understates
what a split can move.** `testing-layers.md` measured 4,877 and produced a 30,000-byte sidecar. Treat the
pre-split figure as a ranking signal across files and never as a floor test on one.

**The classifier is a reimplementation.** Calibrated against `engineering.md`, whose figures were recorded
four slices earlier, it reads 10,839 rationale bytes and 83% entanglement where that split recorded 12,457
and 91%. It is systematically low on both.
