# Rationale: Testing Layers and the Gherkin Contract

**Audience:** whoever is changing a rule in `testing-layers.md`. **Read when:** you are amending, narrowing
or overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file. `testing-layers.md` is written to be actionable on its own;
this file holds the evidence behind it, so a rule can be argued with rather than only obeyed. Everything
below is history: what was measured, in which slice, by what method, and which readings were later
corrected. Several figures describe trees that no longer exist — **do not quote a number forward from this
file without re-deriving it.**

## Where this article came from

`testing-layers.md` was extracted verbatim from CLAUDE.md at `b5e333e`, from lines 167-172, 184-203, 209,
211 and 213-218. No prose was edited in the extracting commit. Only the common leading indent of a
fragment lifted out of a nested list was removed. That note stood at the head of the article until
`split-testing-layers-article` moved it here, where a provenance record belongs.

## What this split found, and why mandate 5 exists

Six enumerations in the article were re-derived against their sources on 2026-09-09. Every one was wrong.
They divide into two classes, and the distinction matters because only the first is a defect the article
committed rather than one time inflicted on it.

**False when written — a claim that contradicted another claim in the same file.** The two-Playwright-projects
paragraph counted "11 `.feature` files" while the pairing-states paragraph three screens above said "seven
of twelve", and both described the same directory. Twelve is correct. Mandate 3's audit compares a pair
against the article as it stood before, so it preserves a contradiction of this shape faithfully. Only
re-derivation finds it.

**True when written, stale now.** The rest. Measured 2026-09-09 on `f44fa88`:

| claim in the article           |          as written |          re-derived |
| ------------------------------ | ------------------: | ------------------: |
| `e2e` project                  |   33 tests, 8 files |   28 tests, 7 files |
| `bdd` project                  |  94 tests, 11 files |  98 tests, 12 files |
| both projects                  |     127 in 19 files |     126 in 19 files |
| `.feature` files               |                  11 |                  12 |
| `dom` project                  | 23 files, 175 tests | 30 files, 313 tests |
| `features/screenplay/` exports |                  92 |                  97 |
| barrel publishes               |                  80 |                  85 |

The `dom` figure had drifted furthest, by a factor near two on tests. The barrel's withheld count is the
one figure that did not move: **12 then, 12 now**, which is the number the curation argument actually rests
on.

**The pairing-state counts were correct** — five paired, seven unpaired of twelve, two spec-only. They
survived because each stands beside its own complete enumeration, which is the form `engineering.md`'s
count rule permits precisely so a drift reads as a visible self-contradiction.

## The barrel mandate: what re-ratified it

`barrel-mandatory-for-step-modules` widened `rules/no-domain-imports-in-bdd-steps.yml`'s allowlist to
`../screenplay/*`, repointed `features/steps/infinite-grid.ts` at the seven modules it reaches, read the
cost, and reverted the probe. Four measurements decided it.

**The barrel is a curated surface rather than a full republish.** Measured at the time: `features/screenplay/*`
exported 92 names and the barrel published 80, withholding 12 with no importer outside the layer — nine of
them raw `Locator` factories in `features/screenplay/elements.ts`, and only 4 of that module's 13 locator
functions published. Re-derived 2026-09-09: 97 exported, 85 published, **the same 12 withheld**
(`aliveCells`, `appearanceControl`, `focusedCellElement`, `hoverIndicator`, `rovingGridCell`, `rulerGroup`,
`scrollbarThumb`, `zoomBadge`, `APPEARANCE_OPTION_LABEL`, and three constants in `viewport.ts`). Of
`elements.ts`'s 18 exports, 9 are published and 9 withheld. The withheld names are what make "this module
names no selector of its own" structurally true of a step module rather than aspirational, **and a path
allowlist cannot express it**: it sees paths and never names, so `../screenplay/elements` is one specifier
whether the import pulls the published `cellLocator` or the withheld `rulerGroup` out of it.

**The "an import states which Screenplay role it depends on" argument failed its own measurement.** The ten
step modules imported from a median of 5 of the 7 roles each, `features/steps/infinite-grid.ts` from all
seven, so repointing turned 10 import statements into 45 that answer "nearly all of them".

**The third option was inverted rather than merely unsupported.** Barrel for the specs and `../screenplay/*`
for the steps: the eight hand-written specs sat at a median of 4 roles, so the step modules are the broader
consumer of the two.

**Widening was separately measured not to weaken what the rule mainly does** — the anchored single-segment
class leaves the `src/` and traversal guards firing — so the ruling rests on the curation alone. The rule
records its invalidating conditions rather than a deletion trigger.

### The objection that the barrel would die with the paired specs

Raised and measured rather than reasoned about. Of the 41 exports the barrel then held, 6 were unused by
any step module, and 4 of those 6 survived a rewrite of the paired specs — `patternsButton`,
`patternLibraryModal` and `blurFocus` served only the unpaired `hud-layout-and-shortcuts` spec, and
`elementAtPoint` served that one as well as three paired ones — so at most 2 (`toggleFarCell`, `rulerGroup`)
would die when the paired specs were rewritten. Waiting would have meant writing those rewritten assertions
twice.

**Read that as the argument it was, not as an inventory: every noun in it has since moved, and the
conclusion survived all of them.** Re-measured in `favor-generated-e2e-in-guidance` by resolving each name
the barrel exports against the names the step modules and the hand-written specs actually **import**,
counting no comment mention as a use. `patternsButton` and `patternLibraryModal` have since gained
step-module callers in `features/steps/pattern-library.ts`, and `blurFocus` one in
`features/steps/keyboard-grid-navigation.ts` (recorded by `re-audit-hand-written-e2e-residue` for
`blurFocus` alone), so none of the three is retired by any spec's deletion. `rulerGroup` is no longer a
barrel export at all, and the reason **vindicates the historical claim rather than correcting it**:
`triage-paired-specs` dropped the re-export as dead (`2554553`, found with
`git log -S 'rulerGroup' -- features/e2e-helpers.ts`) when it cut the paired specs down, which is precisely
the death that sentence predicted for it. It is now one of the withheld `elements.ts` locator factories the
curation measurement above counts, so it cannot die a second time. `elementAtPoint` moved the other way and
is the correction that matters: its uses in `camera-pan-and-zoom.e2e.spec.ts`, `mouse-wheel-controls.e2e.spec.ts`
and the unpaired `hud-layout-and-shortcuts.e2e.spec.ts` had all decayed to comment mentions, leaving live
calls in `grid-scrollbars.e2e.spec.ts` alone — a **paired** spec. So the set that dies with a paired-spec
rewrite was `{elementAtPoint, toggleFarCell}`: the same size as the historical claim by coincidence, with
one member exchanged for another. **A reference count that admits comments overstates a helper's reach and
understates its death** — the same reachability error `architect.md` warns about, arriving through `grep`
rather than through reasoning.

## The two reach-arounds that were paid off

Both that have ever been filed have been retired, in consecutive slices, and in each case the confinement
is what made the landing a small edit rather than an archaeology exercise. That is the argument for keeping
the discipline, not evidence that it is finished.

**`rulerGroup` and `axisLabelValues`** read a Tailwind edge class until `ruler-label-axis-affordance` added
the named `role="group"` they now reach the ruler through. That landing was the only edit `features/`
needed.

**`thumbTrackFraction`** measured the thumb's bounding box against its parent track's until
`scrollbar-visible-proportion-affordance` gave the thumb an `aria-describedby` pointing at a visually-hidden
description of what proportion of the grid is in view; `visibleProportionPercent` reads that instead. **The
second payoff was larger than a swap, and that is the part worth generalizing.** The pixel read needed a
`FILLS_TRACK = 0.99` threshold and a `toBeCloseTo(0.25, 2)` to absorb sub-pixel layout rounding, where an
announced integer serves both dependent `.feature` clauses **exactly** — 100 for "fills its track", 25 for
"covers a quarter of it" — so both tolerances were deleted with the function. A reach-around's cost is
rarely just the one function; it is usually the slack every assertion downstream of it had to carry.

**Why `patternCategoryInLibrary` is not a third one.** It reads the pattern library modal's `h3`-then-buttons
document order, which _is_ the affordance heading navigation gives an AT user; the `h3` selector is query
mechanics — no by-role locator spans two roles, and the interleaving is the signal — not a substitute for
something the user cannot perceive. Adding `aria-labelledby` to those sections for query convenience was
ruled out as a test hook wearing an affordance's name, and would also stop the check exercising what a user
actually relies on.

## The header audit that produced the standing obligation

The audit that opened `favor-generated-e2e-in-guidance` read all 33 hand-written tests then present: 25 were
irreducible for stated, still-true reasons, and **seven headers carried a justification that was
inaccurate**, most of them true when written. Three decay modes, one example each, the first two re-verified
in that slice's DESIGN pass:

- **A misremembered rule.** A header claimed `.gherkin-lintrc` bans the pixel vocabulary its own scenarios
  use freely — `camera-pan-and-zoom.feature` and `grid-scrollbars.feature` both say "pixel" in step text.
  What that config bans is _altitude_ vocabulary, which is a different list.
- **A capability gained elsewhere.** A header claimed no step sends both wheel axes, after
  `features/steps/mouse-wheel-controls.ts` had grown a `page.mouse.wheel(sideways, down)` that sends exactly
  that.
- **An argument outliving its subject.** A header reasoned against jsdom, a layer deleted several slices
  earlier.

**None of the three is discoverable from the test it sits on.** Each was falsified by an edit to a
_different_ file, which is why the obligation is attached to editing rather than to authoring.

## The vacuity ruling, and the fault run that decided its shape

Ruled in CONTRACT mode by `rule-on-chrome-propagation-guards`, over two chrome-propagation guards that each
pressed or dragged a control drawn on the board and then asserted the board was still empty.

**The measured half is what argues for the paired clause.** With Grid's overlay slot inverted into
`#grid-content` — the one structural fault found that these guards can see — the toolbar scenario's own
`no cell should be alive` goes red, one press and one cell alive, while the scrollbar scenario's identical
clause stays **green** and only its camera clause reds: the thumb takes pointer capture and a 50px drag
resolves as a pan rather than a tap. Two claims of the same shape, one a live canary and one not, told apart
only by running the fault.

**Why the layout fact stays prose rather than becoming a precondition step.** A step asserting "the control
covers a cell" can only be an `elementAtPoint` hit-test or a box intersection — residue promoted into a
`Given` — and naming the covered cell's coordinates fails `engineering.md`'s question 2 outright, since the
toolbar covers a different cell at every viewport. The reason that generalizes past those two guards is
structural: this chrome is absolutely positioned _inside_ Grid's overlay slot, over `#grid-content`'s own
rect, so a scenario can only go vacuous by the chrome leaving that slot, which ends the class of defect at
the same stroke. Vacuous-green and live-risk cannot coexist here.
`while-the-pattern-library-is-open.feature` had settled the same question the same way one slice earlier and
says so in its own header comment: the covering mechanism "is not statable here", so it is prose.

## `matchKeywords`, read from playwright-bdd's own source

A step's `Given`/`When`/`Then` keyword is not part of its identity here, and that is a config default rather
than a property of the runner. Read on playwright-bdd 9.2.0's `dist/steps/finder.js`:
`StepFinder.findDefinitions` matches by step text alone and filters by keyword only
`if (this.config.matchKeywords)` — an option this repo does not set and which has no default. So a step
registered with `When(...)` matches from a `Given` position and vice versa. `pattern-library.feature` leans
on that: its cancel scenario borrows `features/steps/keyboard-grid-navigation.ts`'s `When('I press {word}')`
from a `Given`, and passes.

**The trigger is asymmetric, which is why the option is not a tidy-up.** Turning `matchKeywords` on makes
`StepDefinition.matchesKeywordType` require `Given`↔CONTEXT / `When`↔ACTION / `Then`↔OUTCOME, so that one
`Given`-position use becomes a missing-step definition while the `When`-position uses of the same step in
the same file are untouched. Because bddgen is all-or-nothing, the whole `bdd` project then stops generating
rather than only that scenario. The option would also be the only thing that could make two same-text
definitions unambiguous, which is why a `Given` twin of an existing `When` is not an available fix today: it
is an ambiguous-step error.

## The step-lending map, and why the article no longer carries one

The article carried a per-module map of which features borrow which steps. It rotted twice — corrected once
for undercounting `pattern-library`'s borrows, then wrong again for naming two borrowers of
`features/steps/cell-life-and-death.ts` where it recorded eight.

**The map as it stood**, re-derived 2026-09-06 by matching every step line in `features/*.feature` against
every step pattern in `features/steps/*.ts`, then confirming each unmatched line is defined in the feature's
own module:

- `cell-life-and-death.ts` — eight features: `camera-pan-and-zoom` (2 steps), `generation-control` (3),
  `grid-scrollbars` (1), `infinite-grid` (4), `keyboard-grid-navigation` (5), `keyboard-grid-reachability`
  (2), `pattern-library` (5), `while-the-pattern-library-is-open` (1).
- `camera-pan-and-zoom.ts` — `grid-scrollbars` (2), `mouse-wheel-controls` (3),
  `while-the-pattern-library-is-open` (3).
- `keyboard-grid-navigation.ts` — `generation-control` (2), `keyboard-grid-reachability` (5),
  `pattern-library` (2), `while-the-pattern-library-is-open` (1).
- `pattern-library.ts` — exactly one step, `the pattern library is open`, to
  `while-the-pattern-library-is-open`.

The remaining modules lent nothing, and `while-the-pattern-library-is-open.ts` borrowed from three lenders
while lending to none. That is the shape to expect from a feature written late against vocabulary that
already existed.

**A second instrument disagrees with that map, and the disagreement is unresolved.** A scratch matcher
written for this split on 2026-09-09 read seven lenders rather than eight — `cell-life-and-death.ts` lending
to seven features, not eight — with different per-feature counts throughout. Neither measurement is
authoritative. The scratch matcher converts cucumber expressions to regular expressions by hand, so its
`{word}` → `(\S+)` over-matches and its choice among multiple hits is arbitrary; bddgen exits 0 on this
tree, which proves the real registry has no ambiguous step text and therefore that any multi-hit is the
matcher's artifact. The 2026-09-06 method has no such proof either way.

**So the article keeps the rule and the method and carries no map.** A map that two instruments disagree
about, and that has been corrected twice, is a standing invitation to a third correction. What a reader
needs is the convention — a step is defined once, in the module the step is _about_ — and the fact that
bddgen is the only thing that checks the registry at all.

## Why no ast-grep rule can supply the cross-module check

ast-grep matches within a single file and has no cross-file aggregation. Since the shared orientation steps
are `RegExp` patterns rather than cucumber expressions, whether two step texts collide is decidable only by
cucumber-expressions' own matcher against actual `.feature` text. A homegrown text-uniqueness checker would
be answering a different question than the runner does.

## The two facts inherited from the deleted step-test layer

These are facts two and three of the three-fact enumeration headed "The black-box step form" in
`archive.md`; that article keeps the intro and fact one, and argues why each of the three was kept.

### Harness-style code carries no unit tests

An ad-hoc `--mutate` run over the **then-monolithic** acceptance-harness module, outside every configured
gate, scored 60.63% with 33 survivors. The `[NoCoverage]` rows are throw paths a passing suite never enters,
and the two teardown survivors are individually near-equivalent. That module was later split into a
harness/board module plus one module per feature, and both were then deleted outright by
`delete-step-test-layer`. The run has **not** been repeated, so the figure stays attributed to the file it
was actually measured on rather than carried forward onto either successor.

That is not the same as unverified. Three things checked a harness, and a conversion should have been able
to point at all three: the steps suite going green end to end, which exercises every mount, query and
teardown path a scenario uses; `npm run acceptance-mutation`'s per-mutant collected-test-count discipline;
and the harness core's own `assertWindowMounted()`, which failed loudly if the mounted world rectangle ever
stopped containing the `WorldWindow` the feature's own harness module declared its scenarios and their
mutants needed. It took no argument and read a module constant until `split-acceptance-harness`
parameterized it — the required window is per-feature state, so it could not stay in the core.

### A green jsdom run was never evidence about hit-testing

`useGridPointerGestures` takes pointer capture on `#grid-content`, which retargets the subsequent native
`click` to the container — so `Cell`'s own `onClick` never fires for pointer-driven interaction, and
`Grid`'s `onTap` resolves the cell from pointerup pixels through `screenToWorld` instead. `Cell.onClick` is
therefore the **keyboard-activation** route (Enter/Space), and jsdom's `fireEvent.click` dispatches a bare
`click` with no pointer sequence — so the deleted layer drove that keyboard route and never exercised
hit-testing at all.

**The two layers used to be nested rather than complementary, and the survivor is the outer one.** The e2e
layer drives _both_ routes: Playwright's `.click()` for the pointer route, and `page.keyboard.press('Enter')`
on a focused cell button for the keyboard one — now `features/generation-control.feature` and
`features/keyboard-grid-navigation.feature`'s Enter scenarios. The acceptance layer saw a strict subset of
the routes the browser layer sees, plus no hit-testing, so it reached nothing Playwright structurally
cannot. That is the measured basis for deleting it without replacing its coverage. Measured by injecting
`Cell`'s `onActivate(x, y)` → `(y, x)`: the acceptance project failed, 5 of its 48 step-tests, the full
Playwright run was **58 passed / 1 failed** — the failure being that keyboard test, on `aria-pressed` — and
all **14 tests** in the paired `cell-life-and-death.e2e.spec.ts` passed, every activation there being a
`.click()`.

**The commit that first recorded this concluded the opposite.** `4f6e14d`, "record why the e2e layer cannot
see `Cell.onClick`", claimed "disjoint activation routes" and "passes all 14 e2e specs" from a Playwright
column pre-registered as that one paired spec file, and generalized it to the whole layer. `product`'s
VERIFY pass refuted it by running the layer. A commit subject and body cannot be rewritten, so this
paragraph is the correction — and it is the worked example behind `engineering.md`'s rule that a claim is
only as wide as the command that produced it.

## The screenplay decomposition

`screenplay-e2e-decomposition` moved `features/e2e-helpers.ts`'s 468 lines into `features/screenplay/`, one
module per Screenplay-pattern role, and the file survives the split as a re-exporting barrel.

**No count of the barrel's exports is recorded in the article, on purpose.** The barrel grows with the
layer, and that sentence carried "40 runtime plus `ScrollbarOrientation`" until
`barrel-mandatory-for-step-modules` measured 77 runtime plus 3 types — by which point the idea file
proposing that slice had itself gone stale twice, at 58 and then 64. Count it when you need it; do not write
it down.

**The retention answers an objection the article used to record**: the import allowlist is not widened by a
character, and `e2e-helpers.ts` stays the single mandated entry point rather than becoming a directory a
step module would have to navigate.

## Measured hazards behind the vitest project rules

**A vitest project whose `include` glob matches nothing reports 0 files and exits 0**, with no warning. If
`dom`'s globs (`src/components/**` and `src/hooks/**`) ever stop matching — one of those directories renamed
— `npm test` stays green while quietly running that project's files not at all. Measured 2026-09-09: `dom`
collects **30 files, 313 tests**. The sentence this replaces recorded 23 files and 175 tests, which was the
figure when the hazard was first written down.

**`.features-gen/` must be subtracted from `vite.config.ts`'s `sharedExclude`** because the `unit` project
inherits an unrooted include. Without that subtraction vitest collected the generated specs — measured at
the time as 63 files instead of 61.

**A stray `.test.ts` dropped into `perf/`, `rules/`, `rule-tests/`, `patches/` or `public/` is still
collected into `unit` and run in Node.** Those five are deliberately left unexcluded: a name added to
`sharedExclude` for a directory that might one day hold a legitimate colocated test would exclude it
silently.

**With `.features-gen/` absent, Playwright reports the `e2e` project alone** — `Total: 59 tests in 8 files`,
exit 0, no warning. Measured before the staleness guard in `playwright.config.ts` existed, back when the
`e2e` project held 59 tests in 8 files. The guard now refuses to load before that scenario can be reached
again, so the figure stays the historical measurement it is rather than being re-run.

## The Playwright test-count archaeology

Every figure below is history. The article carries none of them, and
`npm run test:e2e -- --list` re-derives the current pair in one command.

| measured on                    | `e2e`             | `bdd`              | together        |
| ------------------------------ | ----------------- | ------------------ | --------------- |
| before `triage-paired-specs`   | 62 tests, 8 files | 46                 | —               |
| `slice/stable-hook-identities` | 33 tests, 8 files | 94 tests, 11 files | 127 in 19 files |
| `f44fa88`, 2026-09-09          | 28 tests, 7 files | 98 tests, 12 files | 126 in 19 files |

Three earlier figures the article carried at various points: 28 / 46 / 74 across 7 files each; 41 / 78 / 119,
measured on `preview-follows-pointer-may-be-statable`; and 27 / 73 for `e2e` before `scrollbar-thumb-overflows-its-track` added its thumb-containment test to an
existing spec file, which is why the file count did not move with it.

**The 62 figure is the one that needed three independent confirmations**, because a stale number had been
re-labelled as history rather than corrected. The sentence carried 59 until the `triage-paired-specs`
architect review; 59 was correct until `scrollbar-visible-proportion-affordance` added three e2e tests and
did not recount. Three measurements say 62: `--list` run against `triage-paired-specs`'s merge base
(`8d36233`), the `61 passed / 1 failed` of the F11 fault run recorded in
`features/grid-reference-lines.e2e.spec.ts`, and 27 plus the 35 deletions `features/screenplay/elements.ts`
counts. Subtracting from 59 instead yields 32 and contradicts all three.

**`bdd`'s count was untouched at 46 across `triage-paired-specs`, but not because that slice left
`features/` alone.** Its VERIFY pass reworded `infinite-grid`'s first scenario and rewrote that feature's
step module, taking back the pan-away-and-back claim the triage had deleted a hand-written test for. A
reword adds no test — playwright-bdd generates one spec per scenario or Examples row, so only adding one of
those moves the figure. That is the fact to reason from rather than "no `.feature` was touched".

## The census counts this slice dropped

**Ruled 2026-09-09 by the user, during `split-testing-layers-article`:** reduce the driftable surface area by decoupling the
article's prose from counts of files. **The rule itself now lives in `engineering.md`**, under the
count clause it narrows, and its evidence in `engineering.rationale.md`. Read it there rather than here.
This section keeps only what is local to this slice: which sentences changed, and what replaced them.

What went, and what replaced it: the pairing-state tallies, replaced by their own lists;
"all 8 patterns", replaced by "every catalogued pattern"; "the single current instance" of the
browser-required layer, replaced by naming that file as the worked example; "there are two subdirectories",
replaced by the rule that none of them holds a test file; the ordinal reference to `archive.md`'s
three-fact enumeration, replaced by a structure-free pointer; and "zero are live" for ARIA reach-arounds,
replaced by the standing expectation that a new one is debt from the day it lands. The last of them was "the one feature that is not overlap-redundant", which is a tally of `features/` — the uniqueness that carries the point is about the geometry, and the sentence after it already states that.

**The dated figures in this file are deliberately untouched.** A sidecar is the dated-record register, and
a count written as history cannot rot — stripping these would destroy the record rather than protect it.

## The split itself, measured

Split by `split-testing-layers-article`, 2026-09-09. Figures re-taken after the count-decoupling commit,
which is the slice's final content commit, on the tree that commit produced. Re-derive rather than quoting
these forward.

| Measure                            | Before |  After |
| ---------------------------------- | -----: | -----: |
| Article bytes                      | 44,353 | 29,129 |
| Sidecar bytes                      |      — | 32,111 |
| Blocks in the article              |     34 |     78 |
| Rationale bytes inside the article |  4,877 | 14,145 |
| Entanglement                       |    91% |    92% |
| Backticked slice slugs             |     27 |     19 |
| Vale mechanical findings           |    122 |      0 |

**The rationale-bytes row rose, and it is measuring the wrong thing. Do not read it as a result.** The
classifier counts a block as rationale when no sentence in it carries a directive. This article's blocks
averaged roughly 1,300 bytes before the split, and a block that large almost always contains a directive
somewhere. Mandate 6 then split 107 long sentences and 8 long paragraphs, taking the block count from 34
to 78. Smaller blocks are far more likely to hold no directive at all, so the same prose reclassifies as
rationale without a word of it changing.

**That is a defect in the instrument, not a finding about the tier**, and it is the clearest result this
split produced about the measurement itself. **A block-level classifier cannot compare a file against
itself across a pass that changes paragraph granularity.** Both earlier prose splits ran mandate 6 as
well, so their rationale-bytes rows carry the same confound in the same direction — understating the
reduction — and `engineering.md`'s recorded fall from 17,383 to 12,457 is therefore a floor rather than a
measurement.

**What is comparable here is the byte count.** The article fell 34%, from 44,353 to 29,149, against
`engineering.md`'s 33% and `ast-grep-rules.md`'s 87%. That places this split with the prose articles
rather than with the enumeration-heavy one, which is what the tier's standing conclusion predicts.

**Entanglement barely moved, 91% to 92%, and it started at the corpus maximum.** `engineering.md` reached
91% only after being split. So this article was already at the ceiling that measure can reach, which is
the same block-size effect seen from the other side: with 1,300-byte blocks, nearly every
directive-bearing block also carries prose. The measure has no room to report an improvement here, and a
future split of a prose article should not promise one.

**The classifier is a reimplementation, and its figures are not comparable to the three earlier tables.**
The original was scratch tooling described in `rationale-sidecar-pilot` and was never committed. This
split rebuilt it from that description: a block is a paragraph or a list item; a block is directive if any
sentence carries a normative marker or an imperative head verb; rationale bytes are the bytes of blocks
carrying no directive; entanglement is the share of directive-carrying blocks that also carry
non-directive prose. **Calibrated against `engineering.md`, whose figures were recorded one slice
earlier**, the reimplementation reads 10,839 rationale bytes and 83% entanglement where that split
recorded 12,457 and 91%. It is systematically low on both. Before and after rows here come from the same
instrument, so they are internally consistent — but the row above is confounded anyway, for a reason that
has nothing to do with the reimplementation.

**The idea file's ranking table over-estimated this article by a factor near three.** It listed
`testing-layers.md` at 13,306 rationale bytes, computed as a 30% share measured on `bac96c4` multiplied by
the current byte count. Measured directly on `f44fa88`, before any edit, the article held **4,877**
rationale bytes in 11 of its 34 blocks. Every row of that table is built the same way, from shares
measured against a tree three splits old. Re-derive before planning against it.

**The Vale baseline was taken on the untouched file, before the first edit, as mandate 4 now requires.**
122 mechanical findings: 107 `SentenceLength`, 8 `ParagraphLength`, 7 `Contractions`. Reaching zero took
four passes rather than the two `prose-linting.md` predicts, and the two length rules traded against each
other in both directions on the way.

**One measurement hazard is worth recording, because it nearly produced a false zero here.** The first
Vale run against this article reported no findings at all. The run was real and the file was in scope; a
second identical invocation minutes later reported all 198. The cause was not diagnosed. What caught it
was checking the zero against a file known to be non-empty, which is the habit
`prose-linting.md`'s "three ways a run reports a confident zero" section argues for. **Never record a Vale
zero without confirming the same invocation reports findings on a file that has them.** A worktree makes
this likelier rather than less: `.vale/` is gitignored, so a new worktree cannot lint until that directory
is restored, and the failure names a missing path rather than a missing style.
