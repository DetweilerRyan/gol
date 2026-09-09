# Rationale: Quality Tooling

**Audience:** whoever is changing a rule in `quality-tooling.md`. **Read when:** you are amending,
narrowing or overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file. `quality-tooling.md` is written to be actionable on its own;
this file holds the evidence behind it, so a rule can be argued with rather than only obeyed. Everything
below is history: what was measured, in which slice, by what method, and which readings were later
corrected. Several figures describe trees that no longer exist — **do not quote a number forward from this
file without re-deriving it.**

## Where this article came from

`quality-tooling.md` was extracted verbatim from CLAUDE.md at `b5e333e`, from lines 101-104, 221-223,
261-263, 269-270 and 275-282. No prose was edited in the extracting commit. Only the common leading indent
of a fragment lifted out of a nested list was removed. That note stood at the head of the article until
`split-quality-tooling-article` moved it here, where a provenance record belongs.

## What this split found

Every enumeration in the article was re-derived against its source on 2026-09-09. One was wrong, one could
not be checked at all, and the rest held.

**Wrong: the count of enabled gherkin-lint rules.** The article said "Twenty-one of `gherkin-lint-plus`'s
registered rules are on". `.gherkin-lintrc` declares **23** rule keys, and none of them is `off`. This is
the bare-count failure `engineering.md` names: the numeral stood alone, with no enumeration beside it to
contradict, so it drifted silently as rules were added. The article now names no total.

**Could not be checked: "oxlint 1.78.0 ships 23 native `jsdoc` rules".** `oxlint --rules` is documented as
"List all the rules that are currently registered", but in the installed 1.78.0 it prints nothing at all
and exits 0 — measured from the project directory, from an empty directory, and through both `npx` and the
`node_modules/.bin` binary. So the premise is **unverified** rather than confirmed or refuted.

What _is_ verified is the arithmetic that rests on it. Six rules are enabled in `.oxlintrc.json`, all at
`error`, and the article's three declined groups name 5 + 8 + 4 = 17 distinct rules. So 6 + 17 = 23 is
internally consistent, and the partition claim holds whatever the true ship count is. If a later oxlint
makes `--rules` work, that is the command to re-derive the premise with.

**Held on re-derivation:** `gherkin-lint-plus` registers exactly **31** rules against 35 rule files in
`dist/rules/`, and `crap4ts` is pinned to `1.0.1` with no caret. `src/equality/is-strict-equal.ts` carries
3 code lines, which is under the measured FTA floor of 6. The six enabled `jsdoc/*` rules are exactly the
six the article names.

**One claim is history and now reads as such.** The `no-restricted-patterns` additions were each checked
against "the seven existing `.feature` files" for a clean baseline. There are twelve now. The sentence was
true when written and describes a probe that was run once, so it is recorded here in the past tense rather
than corrected in place.

## The crap4ts patch: what it fixes and why it is shaped that way

Upstream, crap4ts pairs an AST function span to an Istanbul coverage span only when they overlap by at
least 80% of the AST span's lines — `OVERLAP_THRESHOLD = 0.8`. Istanbul records `fnMap[k].loc` as the
function _body_, starting at the opening brace, and never consults `fnMap[k].decl`. A signature Prettier
had to break across lines therefore pushes the two spans apart far enough that no candidate matches. The
function is then reported at 0% coverage with an inflated CRAP score, even though it is fully exercised.

The patch mirrors upstream PR [breezy-bays-labs/crap4ts#37](https://github.com/breezy-bays-labs/crap4ts/pull/37),
open and unmerged since 2026-04-07. `crap4ts@1.x` is in maintenance mode pending a Rust-backed v2 rebuild,
so it may never land. `findCandidates` now also accepts a candidate when either span fully contains the
other, bypassing the ratio gate in that case. Ranking — `contains`, then `ratio`, then `nameMatch` — is
unchanged.

**Why the pin is exact.** The patch targets a content-hashed tsup chunk, `dist/chunk-W6RIPRFD.js` plus its
CJS twin `dist/chunk-OHOZMDXW.cjs`. Any crap4ts release renames the file and the patch stops applying.

**Why `patternCellPositions` keeps its four-line signature.** `src/patternLibrary.ts`'s
`patternCellPositions` is the live regression fixture for the patch. If the patch ever stops applying,
that row drops back to 0.0% in `npm run crap4ts`.

## The `listFeatureFiles` throws, and why both are load-bearing

`scripts/feature-files.ts`'s `listFeatureFiles` throws in two deliberately distinguishable ways rather
than returning an empty array. Neither throw is tidiness.

`globSync` returns `[]` for a missing `cwd` exactly as it does for a real but empty directory. So without
the `existsSync` guard, a wrong path misroutes into the `No .feature files found in <path>` message
instead of naming the actual problem. And without the empty-list throw at all, a features directory that
resolved to nothing would run zero targets, summarize to a defined `100.0%`, and exit 0 reporting a
perfect score about nothing.

It globs `**/*.feature` **recursively** and returns paths relative to the features directory — bare
basenames while the tree is flat, `sub/name.feature` once it is not. That is why every call site's
`path.join(FEATURES_DIR, file)` needed no change when discovery went recursive.

**Why it exists at all.** `acceptance-mutation` and `gherkin-dry-checker` previously carried two
independent hardcoded copies of the feature list, which went stale separately.

## The two shared root modules, and the rule that was mechanised on their trigger

`gate-report.ts` exports `checkNonEmpty` and nothing else — the "this program found nothing to check, and
that is itself a failure" guard. `ast-grep-rule-check`'s `checkAnyRulesFound` and `reference-check`'s
`checkAnyFilesScanned` each carried an independent, byte-identical copy of it until `dry4ts:scripts`
flagged the pair. Each call site still supplies its own check id and message, so the shared file holds the
shape of the guard and none of the vocabulary.

**The import-direction rule was authored on this sentence's own trigger**, at the third shared root module
rather than at a first violation — there has never been one. `rules/no-downward-import-in-scripts.yml`
fires on any relative import under `scripts/` that descends through a directory segment.

The prediction the article used to carry held: a `files:` glob cannot express "`scripts/` root only",
because ast-grep's `*` crosses `/`. So the rule's measured reach is root → program _and_ a program growing
a third level. The throwaway probe was run in each of those two positions. That measurement, and the
program → program shape the rule deliberately leaves to prose, are in
`.claude/agents/articles/ast-grep-rules.md`.

## The `scripts/` property-test suffix

`scripts/acceptance-mutation/tuple-list.property.test.ts` is the first of its kind there. It was added by
`comma-list-mutants-are-all-syntax-breaking` as mutation-rules.property.test.ts, and renamed when
`cells-column-has-two-parsers-and-neither-models-tuples` moved its subject into `tuple-list.ts`. The old
name is the search key for that history, which is why it is stated here rather than paraphrased away.

<!-- reference-check: allow mutation-rules.property.test.ts -- the historical name of `scripts/acceptance-mutation/tuple-list.property.test.ts`, renamed by `cells-column-has-two-parsers-and-neither-models-tuples`; the old name is the git-history search key and stating it wrongly to satisfy this checker would make the sentence false -->

That file is collected by `vitest.scripts.config.ts`'s ordinary `scripts/**/*.test.ts` include and runs
inside `npm run test:scripts` alongside every unit test. Measured. The src-side `property` project cannot
reach it, because `sharedExclude` subtracts `scripts/**`.

**Why widening the src-side project is the wrong fix.** That project runs under `vite.config.ts`, with
jsdom-adjacent settings, the React plugin chain, and `src/`'s coverage directory. Keeping the two suites
out of one process is the whole reason `vitest.scripts.config.ts` exists.

**That `sharedExclude` entry is not one the merge protocol leans on.** The mutation-invariant predicate
rests on `ideas/**` and `.claude/**`, the two `vite.config.ts`'s own "Both entries below" comment scopes
itself to. `scripts/**` is absent from the predicate's allowlist, so a `scripts/`-only diff never earns the
exemption.

## The FTA size floor

`fta-cli` returns no analysis at all for any file at or under its own size floor — an empty array, not a
zeroed-out one. Measured at 6 code lines or fewer, comments not counted.
`src/equality/is-strict-equal.ts` was the first file to hit it, and still carries 3 code lines as of
2026-09-09.

**Why `halstead4ts` resolves crap4ts's globs rather than copying them.** The two used to be
hand-synchronized arrays of the same 21 paths. A list like that goes stale silently: a module missing from
it is simply never reported on, and nothing fails.

## `.gherkin-lintrc`: the four measured facts

All measured against the installed copy of `gherkin-lint-plus`.

**The package ships a `duplicate-state` rule file that is not in its registry** (`dist/rules/registry.js`),
so naming it in the config aborts the run with `Rule "duplicate-state" does not exist`. The registered set
is 31 rules, not the ~35 the `dist/rules/` listing suggests. Re-confirmed 2026-09-09: `getBuiltInRules()`
returns 31 entries against 35 rule files.

**`name-length`'s and `max-scenarios-per-file`'s library defaults do not fit this repo.** At defaults they
report 21 findings against features nobody considers wrong. Only the first of the two caps is derived from
Prettier's 120-char print width: a step line is indented 4 plus its keyword, leaving about 110 for the
text, and a scenario line is indented 2 plus `Scenario Outline: `, leaving about 100. Neither is fitted to
the current text. `max-scenarios-per-file` runs with `countOutlineExamples: false`, because the quantity
this repo actually budgets — acceptance mutants — is measured exactly by `npm run acceptance-mutation`, and
a blunter proxy for it would only ever be tuned.

**`no-restricted-patterns` compiles every pattern with `new RegExp(pattern, 'i')`, unconditionally.** Case
is therefore not available as a signal. A camelCase-identifier detector like `\b[a-z][a-z0-9]*[A-Z]`
matches every ordinary word and reported 184 findings when trialled. The list has to be an enumerated
vocabulary, not a shape.

**It reads feature, rule, background and scenario names and descriptions, and step text.** It never reads
Examples headers or cells. That is not a hole in practice, because `no-unused-variables` forces every
header to appear in some step's `<placeholder>`, so the two rules together reach the whole table.

## How the `no-restricted-patterns` list was built

The list has two categories, and both were assembled by hand rather than derived.

**Most entries name a field, type, or function of a `src/` module**: `offsetX`/`offsetY`, `cellSize`,
`ScrollbarMetrics`' `thumbRatio`/`thumbOffsetRatio`, `ScrollbarMetrics` itself, `ContentBounds`,
`VisibleRange`'s `minX`/`maxX`/`minY`/`maxY`, world-space coordinates, `cellKey`, and `should return`.

Three more joined that category in `wheel-zoom-ignores-magnitude-and-pinch`'s CONTRACT pass. `delta` is
deliberately unanchored at its end, so one pattern reaches `deltaX`, `deltaY`, `deltaMode` and the bare
noun. `wheel event` and `zoom factor` joined it, the latter for `camera.ts`'s `ZOOM_FACTOR`. They were
added for the same reason as the ARIA four described below, one input channel over: that slice is the first
to make the contract talk about **how far** a wheel was rolled, and the natural phrasing for that reaches
straight for the `WheelEvent` field names.

**`ctrl key` and `shift key` were considered alongside them and deliberately rejected.** They name physical
keys a user presses, and because every pattern compiles case-insensitively the list cannot tell `shiftKey`
from "holding the shift key". Restricting them would ban the plainest English available for the gesture.

**Four name markup and ARIA vocabulary instead** — `aria-`, `role=`, `tab index`/`tabindex`, `gridcell` —
which belong to no `src/` module at all and are implementation vocabulary all the same. They were added in
`collapse-dead-cell-layer`'s CONTRACT pass, ahead of the first `.feature` about keyboard and screen-reader
behaviour, because that is the feature whose natural phrasing reaches for them.

**Verbs are deliberately not restricted.** `computed` reads as implementation, but "the next generation is
computed" is a statement about the game, and restricting it would drag the one already-converted feature
into every prune's scope for no altitude gain. Neither is `live cells`, which is a type name (`LiveCells`)
and simultaneously Conway's own ubiquitous language — the clearest example of why this list is enumerated
by hand rather than derived.

**The probe method, which is the part worth reusing.** All four ARIA entries and all three wheel entries
were shown to fire against a planted probe feature before landing. Each was reported **by its own pattern
name** rather than merely turning the run red, and each was first checked against the then-seven existing
`.feature` files for a clean baseline. A pattern that fires on the contract as it stands is a dirty
baseline, and the fix is narrowing the pattern rather than editing `product`'s text.

**The probe feature is deleted in the same command that runs the lint.** A `.feature` with no step
definitions makes `bddgen` exit 1 having generated nothing at all, so a probe left behind takes down every
feature's generated spec rather than its own.

## The oxlint JSDoc tier: what was measured

Ratified by `architect` in `oxlint-native-jsdoc-tier`, 2026-09-07.

### The two silent-inert modes

Both measured, both exiting 0. They are the same failure shape this repo already documents for a Stryker
`ignorePatterns` glob, a vitest `include` and a `-t` pattern that match nothing.

**The `plugins` entry.** With all six rules present at `error` and the `settings` block intact, but
`"jsdoc"` removed from `plugins`: exit 0, zero findings, no warning. The rules are read, accepted, and
never run. `.oxlintrc.json` carries a comment saying so at the site, which is measured safe — oxlint parses
the JSONC, `npx prettier --write` preserves the comment, and nothing else in the repo reads that file.

**Severity.** An oxlint `warn` exits 0. Measured: the same planted `/** */` scores `warning` plus exit 0 at
`warn`, and `error` plus exit 1 at `error`. The baseline was clean when this tier landed, so `error` cost
no migration — a one-time window that is now spent.

**Enabling the plugin also activates a default rule set at `warn`.** Measured: `check-tag-names`,
`no-defaults` and `require-property` fire without being named in `rules`. Since `warn` exits 0, that set
gates nothing.

### What each enabled rule was written against

`require-param-description` has a worked example rather than a hypothetical one: `Cache.insert` actually
carried an `@param` that named a parameter and said nothing about it, which is the defect
`doc-comments.md` rule 5 names.

### The six were each shown firing

Every one was shown firing **through `npm run lint` itself** against a planted fault, in `src/`, and two of
them additionally in `scripts/` and `features/`. A rule that matches nothing reports nothing and is
indistinguishable from clean prose, exactly as an ast-grep rule without a failing fixture has not been
shown to work. The battery: exit 1, all six named.

### `check-tag-names`: from 2 of 5 to 5 of 5

At defaults it enforced only **2 of the 5** tags `doc-comments.md` rule 5 names as not written here.
`@remarks` and `@defaultValue` fail because they are not JSDoc vocabulary at all, while `@deprecated`,
`@internal` and `@todo` are standard JSDoc and passed.

`settings.jsdoc.tagNamePreference` accepts `false` as a ban — schema `TagNamePreference` admits a boolean —
and banning those three takes it to **5 of 5**. `typed: true` bans the TypeScript-redundant family
wholesale, measured on `@abstract` ("redundant outside ambient contexts") and `@typedef` ("redundant when
using a type system"), and is silent on all five sanctioned tags, which was checked directly rather than
inferred.

**Why the closed table cannot be mechanically enforced.** `definedTags` is an **additive** allowlist, so
there is no restrictive form. The bans are a blocklist over a roughly 65-tag vocabulary, closing the three
tags a writer is actually tempted by and leaving the rest of standard JSDoc permitted.

### The `scripts/**` override shields none of it

That override declares its own `plugins` array omitting `jsdoc`, but a top-level plugin plus a top-level
rule fires inside it anyway. So does the top-level `settings` block, measured with a planted `@internal` in
`scripts/feature-files.ts` that `tagNamePreference` correctly reported. A planted `@bogustag` in
`features/screenplay/viewport.ts` fires too.

### The line-leading limit

Measured with a planted `@bogustag`. oxlint's JSDoc parser recognises a tag **only at the start of a JSDoc
line**, with leading whitespace tolerated, and is **blind to a mid-line one**. TypeScript's hover parser
recognises a tag wherever `@` is whitespace-preceded, anywhere in the block.

So `* Uses the @fast-check/vitest package` — prose that TypeScript splits into a `@fast-check` tag, the
exact class that cost `jsdoc-in-scripts` three hand-rewording commits — passes `npm run lint` silently. The
line-leading form, including one inside an `@example` fence, is caught.

### The seventeen declined

The three groups partition the seventeen exactly, 5 + 8 + 4, against the 6 enabled.

**Five red the tree, and each contradicts a written convention.** `require-param` (155 findings) and
`require-returns` (148) are coverage mandates, which rule 5 forbids outright — a tag that restates the
signature is deleted, not required — and `doc-comments.md` says in as many words that documenting every
undocumented export is not this convention. `require-param-type` (5), `require-returns-type` (10) and
`require-throws-type` (20) mandate a JSDoc `{Type}` slot that duplicates the signature.
`require-throws-type` mandates the exact `@throws {CacheError}` form rule 9 measured as **broken** —
`@throws` and `@see` print a braced type verbatim, braces and all. Enabling it would require the repo to
write the one form its own measurement forbids.

**Eight are conditional on a tag the table excludes**, so enabling them would police the well-formedness of
vocabulary that must never appear, legitimising it rather than banning it: `check-access` (`@access`),
`implements-on-classes` (`@implements`), `check-property-names`, `require-property`,
`require-property-description`, `require-yields`, `require-yields-description`, and `empty-tags`. Two of
them, `require-property` and `require-yields`, are coverage mandates that would demand a tag the table
forbids — a documented generator would be told to add `@yields`. `empty-tags` is the odd one: its void-tag
vocabulary (`@abstract` and kin) is entirely outside the table, and its remedy direction is "empty the tag"
where the convention says delete it.

**Four are strictly subsumed or inert.** `require-param-name` fires **only** on a completely bare
`@param`, which `require-param-description` also catches. That is measured, and structurally so: the
parser takes the first token after `@param` as the name, so `@param must be positive` yields the name
`must` and neither rule fires. There is no fault it uniquely reports. `require-property-name`,
`require-property-type` and `require-yields-type` are inert by the same vocabulary argument as the group
above, listed separately because each is conditional on a tag that is itself already conditional on one the
table excludes. **Reopen `require-param-name` if a parser change ever admits a nameless `@param` carrying
text.**

`require-property` is declined yet remains default-on. If it ever appears it is advisory noise on a block
that `check-tag-names` is already erroring about, and the response is to turn it off rather than to write
an `@property`.

### The alpha tier

`escape-inline-tags`, `informative-docs`, `no-undefined-types`, `normalize-see-links`, `match-description`
and `no-bad-blocks` are `eslint-plugin-jsdoc` rules with no native oxlint port. Reaching them means
oxlint's alpha JS-plugin API plus an alias, since the `jsdoc` name collides with the native plugin.

Spiked 2026-09-08 and filed as `ideas/candidates/a-clean-lint-is-not-evidence-a-block-hovers.md`, which
carries the measured numbers: the mechanism works and the baseline is clean, but it pulls `eslint` itself
into a tree that has none.

**The test-title gap is a design-time scoping decision, not an oversight.** `reference-check`'s
`checkCitedSymbolExists` does not scan a quoted test title, so neither that checker nor this tier reaches
the third of the three reference classes that motivated the work.

## The split itself, measured

Split by `split-quality-tooling-article`, 2026-09-09. Figures taken after the final content commit, on the
tree that commit produced. Re-derive rather than quoting these forward.

| Measure                            | Before |  After |
| ---------------------------------- | -----: | -----: |
| Article bytes                      | 30,206 | NN,NNN |
| Sidecar bytes                      |      — | NN,NNN |
| Blocks in the article              |     41 |    NNN |
| Rationale bytes inside the article |  5,742 | NN,NNN |
| Entanglement                       |    87% |   NNN% |
| Backticked slice slugs             |     33 |     NN |
| Vale mechanical findings           |     80 |      N |

**Read the rationale-bytes and entanglement rows with the confound `testing-layers.rationale.md` records.**
A block-level classifier cannot compare a file against itself across a pass that changes paragraph
granularity, and mandate 6 changes it drastically. Smaller blocks are likelier to hold no directive, so the
same prose reclassifies as rationale without a word of it changing. The byte count is the row that
compares.

**The classifier is a reimplementation.** Calibrated against `engineering.md`, whose figures were recorded
two slices earlier, it reads 10,839 rationale bytes and 83% entanglement where that split recorded 12,457
and 91%. It is systematically low on both.

**The idea file's ranking table over-estimated this article too, though less than the last one.** It listed
`quality-tooling.md` at 9,666 rationale bytes, computed as a 32% share measured on `bac96c4` multiplied by
the current byte count. Measured directly on `f44fa88`, before any edit, the article held **5,742**
rationale bytes in 18 of its 41 blocks. That is the second row of that table shown to be inflated, by
roughly the same mechanism and in the same direction.
