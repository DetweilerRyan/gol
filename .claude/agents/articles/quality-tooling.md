# Article: Quality Tooling: crap4ts, gherkin-lint, and the scripts/ programs

**Audience:** cleaner, architect, hardener. **Read when:** on an unexpected crap4ts number, when touching .gherkin-lintrc or `.oxlintrc.json`, on a `jsdoc/*` lint finding, or at hardener stages 6-8.

> The measurements behind every ruling here are in `quality-tooling.rationale.md`. It holds the patch mechanism, the probe methods, the declined-rule roster and the readings later corrected. Read it when you are **changing** a ruling below, never in order to follow one.

## crap4ts is patched locally

**crap4ts is patched (`patches/crap4ts+1.0.1.patch`), and `crap4ts` is pinned to an exact version because of it.** Upstream, a signature Prettier had to break across lines is reported at 0% coverage with an inflated CRAP score, even when it is fully exercised. The patch widens the span matcher to accept a candidate when either span fully contains the other.

Three consequences follow, and each constrains what you may do.

- **Upgrading crap4ts means regenerating the patch by hand**, not just bumping the range. The patch targets a content-hashed build chunk, so any release renames the file and the patch stops applying. `package.json` pins `"crap4ts": "1.0.1"` with no caret for that reason.
- **The patch is only in effect after a normal `npm install` or `npm ci`**, because `patch-package` runs from `postinstall`.
- **`src/patternLibrary.ts`'s `patternCellPositions` keeps its four-line signature deliberately.** It is the live regression fixture for the patch. Do not "tidy" the signature onto one line, and do not chase its 0% as a coverage gap if it reappears.

**`npm run crap4ts -- --verbose` distinguishes the two cases.** An `[unmatched-no-coverage]` warning naming the function means the matcher missed it, so the patch is not applied. A genuine gap shows as a matched row with a low percentage.

**There is a third cause of the identical warning, and it is the one that has actually bitten repeatedly.** `crap4ts` reads `coverage/coverage-final.json` off disk and never regenerates it. So any source edit since the last `npm run test:coverage` is scored against stale line spans.

This is broader than a missing entry for a newly-landed file. _Any_ line-shifting edit moves a function's AST span away from the recorded coverage span, a pure comment change included. The two failure modes look nothing alike. Some functions orphan at 0.0%, which is indistinguishable from the patch-not-applied case. Others match an old, shifted entry and read a spurious 100%.

**The remedy is a precondition rather than a fix. Run `npm run test:coverage` whenever source has changed since the last coverage run**, which in a role's pass is essentially always. For `scripts/`, run `npm run test:coverage:scripts` before `npm run crap4ts:scripts`.

The many `[unmatched-no-ast]` warnings under `--verbose` are unrelated and expected. They are coverage entries in files outside crap4ts's `include` list, plus nested functions crap4ts does not score.

<!-- Closed decision: the overlap-threshold mechanism, the upstream PR it mirrors, and the exact chunk filenames the patch targets are in `quality-tooling.rationale.md`. -->

## The `scripts/` project and its layout

`scripts/` is TypeScript, not JavaScript, and is its own project. It has separate `tsconfig.scripts.json`, `vitest.scripts.config.ts`, `crap4ts.scripts.config.ts` and `stryker.scripts.config.json` from the ones covering `src/` and `features/`.

It is the tooling every other role's quality gate runs on, so it is held to the same CRAP threshold of 6 as `src/`. Use its parallel commands: `npm run test:scripts`, `npm run test:coverage:scripts`, `npm run crap4ts:scripts`, `npm run dry4ts:scripts` and `npm run test:mutation:scripts`. See `.claude/agents/articles/engineering.md`'s "Working inside scripts/" for which command each role substitutes.

**Its layout is two levels and no more.** `scripts/<program>/` holds one program's own modules — its `run.ts` shell plus the pure modules that shell delegates to. A file at `scripts/` root is shared by two or more programs.

The shared root modules are these. `scripts/feature-files.ts` exports `listFeatureFiles`, the one place that answers "which `.feature` files exist", used by both `acceptance-mutation` and `gherkin-dry-checker`. `gate-report.ts` exports `checkNonEmpty`, the "this program found nothing to check, and that is itself a failure" guard.

**`listFeatureFiles` throws rather than returning an empty array, and both throws are load-bearing.** Do not soften either into a fallback. It globs recursively and returns paths relative to the features directory.

**Shared root modules are ordinary product code** and sit inside the gates exactly like a program's own modules. The one exception is `scripts/test-support.ts`, which is test infrastructure. The same `**/test-support.ts` glob in `crap4ts.scripts.config.ts` and `stryker.scripts.config.json` excludes it, alongside `scripts/perf-report/test-support.ts`.

**Imports run program → shared and never the reverse.** That is what keeps the shared file safe to change. A root module reaching back into a program directory would couple every other program to that program's internals. `rules/no-downward-import-in-scripts.yml` checks it mechanically, firing on any relative import under `scripts/` that descends through a directory segment.

<!-- Closed decision: why `listFeatureFiles` throws twice, the duplication that produced each shared module, and the probe behind the import-direction rule are in `quality-tooling.rationale.md`. -->

### The advisory programs

- `scripts/gherkin-dry-checker/` — advisory-only. It scans all `.feature` files for step-text vocabulary duplication and drift, discovering them through `scripts/feature-files.ts`. It always exits 0 on a successful run and writes to `reports/gherkin-dry/report.json`.
- `scripts/halstead4ts/` — runs `fta-cli` against the same files as `crap4ts.config.ts`'s `include` list. It prints a Halstead table plus an FTA Score alongside crap4ts's per-function CRAP table. FTA reports at file granularity only, so this is a second, coarser report rather than something merged into crap4ts's output. FTA's own score formula is not published, so it is report-only and never a CI gate. `run.ts` resolves crap4ts's globs rather than keeping a copy of the file list. A file at or under FTA's size floor renders as an explicit `not scored (under FTA size floor)` row rather than vanishing from the report.
- `scripts/perf-report/` — turns the raw `RawScenarioSample` JSON files `perf/` writes under `reports/perf/raw/` into `reports/perf/latest.md`, `latest.json` and `history.jsonl`. Report-only, no thresholds.

**Every median, percentile, ratio and unit conversion in the perf harness lives in `scripts/perf-report/`.** `perf/` itself computes none, because `perf/` is outside the gates and a wrong statistic there would be silent and plausible-looking.

**The boundary between the two is a file on disk, not a module import.** `import type` crosses it, since it is erased at compile time. A value import never may, in either direction, and `rules/no-value-import-across-perf-boundary.yml` checks that mechanically. It is also a real compiler boundary: `perf/` is in `tsconfig.app.json` with `moduleResolution: "bundler"` and `lib: DOM`, and `scripts/` is in `tsconfig.scripts.json` with `nodenext` and no DOM.

**Before proposing a new program here, search for an existing tool first.** A bespoke checker pays every gate this section lists, and becomes permanent maintenance. So the bar is whether anything off the shelf already does the job. `orchestration.md` states the habit, and why a search that turns nothing up is still worth its cost.

### The `*.property.test.ts` suffix means something different here

**`scripts/` has exactly one vitest config and therefore exactly one project.** A `*.property.test.ts` file there is collected by `vitest.scripts.config.ts`'s ordinary `scripts/**/*.test.ts` include and runs inside `npm run test:scripts` alongside every unit test. In `src/` that suffix selects a separate `property` vitest project. Here it is a naming convention only.

Two consequences follow. There is **no** scripts-scoped property command, and no role gains an obligation — see `engineering.md`'s "Working inside `scripts/`". And do **not** "fix" the apparent inconsistency by widening the src-side `property` project to reach `scripts/`.

<!-- Closed decision: why widening that project is the wrong fix, and why its `sharedExclude` entry is not one the merge protocol's predicate leans on, are in `quality-tooling.rationale.md`. -->

## `.gherkin-lintrc`

`.gherkin-lintrc` is a ninth checker, over `features/*.feature` rather than over TypeScript. It **gates**: `npm run gherkin-lint` exits nonzero on any finding. `product` is the only role that runs it.

**Read the enabled set from the config rather than from a count here.** Every key in `.gherkin-lintrc` is on; none is `off`. A total written in prose has already drifted once.

Four facts about the library are easy to get wrong, all measured against the installed copy.

- **The package ships a `duplicate-state` rule file that is not in its registry.** Naming it in the config aborts the run with `Rule "duplicate-state" does not exist`. The registered set is smaller than the `dist/rules/` listing suggests, and the registry is what decides.
- **`name-length`'s and `max-scenarios-per-file`'s library defaults do not fit this repo.** Only the first of those two caps is derived from Prettier's print width. `max-scenarios-per-file` runs with `countOutlineExamples: false`, because `npm run acceptance-mutation` measures the quantity this repo actually budgets.
- **`no-restricted-patterns` compiles every pattern with `new RegExp(pattern, 'i')`, unconditionally.** Case is therefore not available as a signal, so the list has to be an enumerated vocabulary rather than a shape.
- **It reads names, descriptions and step text, and never Examples headers or cells.** That is not a hole in practice: `no-unused-variables` forces every header to appear in some step's `<placeholder>`, so the two rules together reach the whole table.

<!-- Closed decision: the finding counts behind the default-cap and case-insensitivity rulings, and how each cap was derived, are in `quality-tooling.rationale.md`. -->

### `no-restricted-patterns`' list belongs to `architect`

**It belongs to `architect` in the same sense `rules/*.yml` does**, even though it lives in a config file `product` otherwise owns. It mechanises the domain-altitude judgment: implementation vocabulary must not leak into the contract.

Its failure mode is someone widening the list to clear a finding. That is the same move as narrowing a fast-check arbitrary, or weakening an ast-grep rule. **A role that hits a pattern it believes is wrong routes it back to `architect` rather than editing the list.**

**Adding to this list is the safe direction**, because it narrows what a contract may say. Widening it to clear a finding is the move above.

**Show a new pattern firing against a planted probe feature before landing it.** Require it to report **by its own pattern name** rather than merely turning the run red. Check it first against the existing `.feature` files for a clean baseline. A pattern that fires on the contract as it stands is a dirty baseline, and the fix is narrowing the pattern, never editing `product`'s text. This is the same obligation an ast-grep rule's fixture carries: a pattern that matches nothing is indistinguishable from a clean `features/`.

**Delete the probe feature in the same command that runs the lint.** A `.feature` with no step definitions makes `bddgen` exit 1 having generated nothing at all. So a probe left behind takes down every feature's generated spec, rather than its own.

<!-- Closed decision: the two categories the list holds, which slice added which entries, why `ctrl key` and `shift key` were rejected, and why verbs and `live cells` stay unrestricted, are in `quality-tooling.rationale.md`. -->

## The oxlint JSDoc tier — `.oxlintrc.json`'s `jsdoc/*` rules

**Ratified by `architect` in `oxlint-native-jsdoc-tier` and owned by it thereafter**, in the same sense `no-restricted-patterns`' list is. The rule set mechanises `doc-comments.md`'s authoring conventions, so widening or relaxing it to clear a finding is the same move as narrowing a fast-check arbitrary. **A role that hits one of these and believes it is wrong routes it to `architect` rather than editing the config.**

**The rules in the table below are on, all at `error`.** The rest of oxlint's native `jsdoc` set is declined on the record in the sidecar.

**Two ways this tier can be silently inert, both measured, both exiting 0.** They are the same failure shape this repo documents for a Stryker `ignorePatterns` glob, a vitest `include` and a `-t` pattern that match nothing. The command reports success, and the thing you asked about never ran.

- **The `plugins` entry.** Remove `"jsdoc"` from `plugins` and every rule in the tier is read, accepted, and never run. `.oxlintrc.json` carries a comment saying so at the site.
- **Severity.** An oxlint `warn` **exits 0**. Every role reads `npm run lint` by its exit code, so a jsdoc rule at `warn` is a finding nobody will ever act on. That is why these are `error`, rather than the `rules/*.yml` convention: `npm run ast-grep` is report-only and read by its output, while `npm run lint` is a gate read by `$?`.

**Enabling the plugin also activates a default rule set at `warn`**, and since `warn` exits 0 that set gates nothing. So the explicit severities are what make this tier real, not decoration.

<!-- Closed decision: the inertness measurements, the severity battery, and the default rules that fire unnamed are in `quality-tooling.rationale.md`. -->

### The enabled rules, and what each catches

| rule                          | catches                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-tag-names`             | a misspelled or non-JSDoc tag, plus the closed table's banned vocabulary                                                                                 |
| `no-blank-blocks`             | `/** */` — the degenerate block a presence-only "every export is documented" rule would accept, which is why that rule was rejected when it was proposed |
| `no-defaults`                 | `@param [a=1]` — a default value restates the signature and fails rule 5's information test                                                              |
| `require-param-description`   | `@param a` naming a parameter and saying nothing — rule 5's named defect                                                                                 |
| `require-returns-description` | a bare `@returns`                                                                                                                                        |
| `require-throws-description`  | a bare `@throws`                                                                                                                                         |

**`check-tag-names` runs with `typed: true` plus a set of `tagNamePreference` bans, and both halves were measured rather than assumed.** Together they reach every tag `doc-comments.md` rule 5 names as not written here, and `typed: true` bans the TypeScript-redundant family wholesale.

**Read the result at its actual scope: the closed table is _not_ mechanically enforced, and it cannot be.** What is mechanised is misspellings, non-JSDoc tags, the TypeScript-redundant family, and the tags rule 5 names. The table itself remains an `architect` ruling enforced by review. **Admitting a tag means editing both `doc-comments.md`'s table and this config.** `@deprecated` is the likeliest candidate, and banning it here is deliberately what makes a future admission a ruling rather than a drift.

**The `scripts/**` override does not shield any of this, and neither does `features/`.** That override declares its own `plugins` array omitting `jsdoc`, but a top-level plugin plus a top-level rule fires inside it anyway. So does the top-level `settings` block. This tier binds `product`'s TypeScript exactly as it binds `src/`.

<!-- Closed decision: the 2-of-5 to 5-of-5 measurement, why `definedTags` cannot express a restrictive form, and the planted tags that proved the override shields nothing are in `quality-tooling.rationale.md`. -->

### The limit that matters most: oxlint sees only line-leading tags

**`doc-comments.md` rule 9's whitespace-`@` hazard is only half closed**, and the closed half is the half that was never the surprising one. oxlint's JSDoc parser recognises a tag **only at the start of a JSDoc line**, with leading whitespace tolerated, and is **blind to a mid-line one**. TypeScript's hover parser recognises a tag wherever `@` is whitespace-preceded, anywhere in the block.

So prose like `* Uses the @fast-check/vitest package` passes `npm run lint` silently, while TypeScript splits it into a `@fast-check` tag. The line-leading form, including one inside an `@example` fence, is caught.

**A clean `npm run lint` is therefore not evidence that a JSDoc block hovers as written.** **Backtick every `@`-prefixed token.** That remains the only guard on the mid-line half, and it stays a human discipline.

**The alpha tier is deliberately not here.** Several `eslint-plugin-jsdoc` rules have no native oxlint port, and reaching them means oxlint's alpha JS-plugin API plus an alias. That is a separate evaluation with a real dependency cost, filed as `ideas/candidates/a-clean-lint-is-not-evidence-a-block-hovers.md`. None of it is needed to hold what this tier holds.

**What no lint rule here reaches at all:** the dead file, symbol and test-title references in `//` comments that motivated this work. Every rule above operates **inside a JSDoc block**, and those references are overwhelmingly in `//` comments.

That is why this tier is complementary to `scripts/reference-check/` rather than a substitute for it. That checker covers the file and symbol halves of the motivating problem. The test-title half was scoped out at design time and remains a gap this tier does not close either.

<!-- Closed decision: the declined rules, the groups they fall into, their finding counts, and the one to reopen if a parser change lands are in `quality-tooling.rationale.md`. -->
