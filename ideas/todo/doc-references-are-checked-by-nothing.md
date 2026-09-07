---
name: doc-references-are-checked-by-nothing
title: Check that references in comments and docs resolve, and stop writing the ones that cannot
created: 2026-09-06
---

## Situation

Comments and `.md` files here assert present-tense facts about other files: which file, which
symbol, which test, how many. Volume, measured 2026-09-07:

| Surface                                           | Refs                      |
| ------------------------------------------------- | ------------------------- |
| `CLAUDE.md` + 14 articles + 5 role files          | 705 `.ts`/`.tsx` mentions |
| `src/` comment lines naming another file          | 439, across 89 files      |
| `<file>'s <symbol>` citations (identifier-shaped) | 103                       |

`agent-doc-check` reads every doc file — but only for `npm run` scripts and `rules/<id>.yml`
paths. Filenames, symbols, test titles: outside all five checks. `src/**` and `scripts/**`:
outside its glob entirely (see `run.ts`'s `gatherCheckInput`).

## Complication

**Nothing checks them, and they are already wrong.** 19 dead filename tokens in comments:

| Dead token                    | Sites | Example                                                                                                                         |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `cellLattice.ts`              | 6     | `src/cellTiles.ts`                                                                                                              |
| `CellTile.tsx`                | 5     | `rule-tests/no-tile-policy-in-components-test.yml`                                                                              |
| `useCellLattice.ts`           | 4     | `src/hooks/useCellTiles.ts`                                                                                                     |
| `vitest-runner.ts`            | 4     | `scripts/acceptance-mutation/playwright-runner.ts`                                                                              |
| `modal-inertness.e2e.spec.ts` | 4     | `features/cell-life-and-death.e2e.spec.ts`                                                                                      |
| `vitest.config.ts`            | 1     | `src/test-setup.ts` — the file is `vite.config.ts`, and `LifeBoard.test.tsx` names it correctly, so the repo contradicts itself |

Plus 16 unresolved across the docs surface, 1 dead symbol citation at 2 sites (`discovery.ts`'s
`pairTargets`, present tense, for a function that was deleted), and 1 phantom test title at 3
sites (`"renders a small cell grid immediately on mount"` — not in `Grid.test.tsx`, not anywhere).

**Care does not catch this class.** The JSDoc sweep is the natural experiment:

| File                        | Commits during sweep | Dead refs still there |
| --------------------------- | -------------------- | --------------------- |
| `src/cellTiles.ts`          | 4                    | 2                     |
| `src/hooks/useCellTiles.ts` | 2                    | 4                     |

Repo-wide the count went **17 → 19 during the sweep**. `convert-modal-inertness-to-scenarios`
deleted a spec and left 4 comments pointing at it. Text-preserving partition, per-commit
verification, `architect` ratification, hover budgets — zero caught, one created.

**And no convention forbids the unfixable half.** Grep of `doc-comments.md`, `engineering.md`,
`ast-grep-rules.md` and all five role files: silent on citing test names, line numbers, caller
rosters, "this slice", stale counts. `doc-comments.md` rule 4 puts "measured findings and their
numbers" and "cross-references into another module's internals" in the `//` bucket — a **channel**
ruling, not a staleness one.

## Question

Two, needing different instruments:

1. References that resolve to something — what checks them?
2. Claims that resolve to nothing (rosters, "this slice", counts) — what stops them being written?

## Answer

### 1. Four checks. Extraction measured, not assumed.

Naive filename extraction gives 26 unresolved, 11 of them glob fragments (`test.ts`,
`e2e.spec.ts`). Normalised — maximal `[A-Za-z0-9_.*/-]*\.(ts|tsx)` token, drop any containing `*`
or leading `.`, drop tokens inside a URL, compare basename against `git ls-files` — gives the 19.

| #   | Check                               | Catches                     | Note                                                                                    |
| --- | ----------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| 1   | `file-reference-resolves`           | 19 dead tokens + 16 in docs | `(ts\|tsx)` only — `md\|json\|yml` false-fires on gitignored `latest.md`, `report.json` |
| 2   | `quoted-test-title-resolves`        | the 3-site phantom          | `X.test.ts's "title"` must appear in an `it`/`test`/`describe` string there             |
| 3   | `no-file-line-references`           | `foo.ts:NN`                 | zero in `src/`, so free there; 2 of 3 live ones already wrong                           |
| 4   | `cited-symbol-exists-in-cited-file` | `pairTargets`               | word-boundary presence, not resolution — a false negative is the safe direction         |

**This candidate is check 1's own worst case, found by dogfooding it.** Running the extractor over
this file reports 11 unresolved tokens — and every one is deliberate: the six in the table above
are the subject matter, and `test.ts`, `e2e.spec.ts`, `X.test.ts`, `foo.ts` and `file.ts` are
glob fragments or placeholders. **A document about dead references necessarily names dead
references.** So the exemption is not an edge case to bolt on later; it is load-bearing from the
first run, and `ideas/**` should probably be out of scope entirely.

**Checks 1 and 4 both need a same-line historical/negative-existence qualifier exemption.** Not
optional: DOCER, the closest published equivalent, measures **36% false positives** without one.
Reuse `agent-doc-check`'s existing `HISTORICAL_QUALIFIER` — same problem, already encoded once.

**Check 4's identifier-shape restriction is the whole check:**

| Extraction                            | Cites | Resolve | Don't | FP rate                                        |
| ------------------------------------- | ----- | ------- | ----- | ---------------------------------------------- |
| any word after `'s`                   | 187   | 152     | 28    | **93%** — hits English possessives (`X's job`) |
| camelCase/PascalCase/`ALL_CAPS`/snake | 103   | 99      | 2     | 2%                                             |
| + qualifier exemption                 | 103   | 100     | 1     | **0%**                                         |

The exemption correctly spares `GridLines.tsx`'s "`Cell.tsx`'s `isMajorGridline` **used to**
draw". One exemption serving two checks is the argument for one checker, not several.

Add `ast-grep-rule-check`'s reason-mandatory opt-out (`// comment-refs-check: allow <reason>`) plus
its stale-allow companion.

**Sixth check of `agent-doc-check`, or sibling program?** This candidate originally said sixth.
Checks 1–4 scan `src/**`/`scripts/**` **source** — a charter widening for a program whose name and
every existing check are about `.claude/**` docs. Decide explicitly; a sibling mirroring its shape
is the repo's own pattern.

### 2. One convention. New policy, not a restatement.

For `doc-comments.md` (`architect`'s ruling — rule 4 settled the channel, this settles staleness):

> **A comment may state why. It may not state an undated present-tense fact about another file.**
> A dated past measurement claims history and cannot rot.
>
> - Never enumerate call sites. `findReferences` answers it correctly, forever. State the contract
>   callers must honour instead.
> - Cite `<file>'s <symbol>`, never `file.ts:NN`. Machine-verified by check 4, and already the
>   idiom at 103 sites.
> - Cite a test by what it guards, not by its quoted title.
> - Name the slice (`slice/<name>`), never "this slice".
> - Cite the command, not the number. Where the figure _is_ the finding, date it.
> - **The same rule binds `.md`, harder** — every role reads those, so a stale claim there is
>   acted on rather than merely read. Name _which_, not _how many_: "four features carry no
>   Examples table" cannot rot; "four of the seven" has, twice.

Precedent: **DRY covers comments** — _The Pragmatic Programmer_ lists them explicitly as a DRY
violation, and a caller roster duplicates what the import graph holds authoritatively. Honest
negative finding: **no mainstream style guide** (Google, Microsoft, the C/R/Python guides) writes
down "no line numbers" or "no caller lists". This codifies a widely-held principle; it does not
cite a rule.

### 3. Lint rules that already exist — do these before writing any checker

**oxlint 1.78.0 ships 23 native `jsdoc` rules and the plugin is not enabled** (`.oxlintrc.json`
plugins: react, typescript, oxc, import, unicorn, jsx-a11y). A free tier, no new dependency.
Measured on the real tree: `npx oxlint --jsdoc-plugin -D jsdoc/check-tag-names src scripts` →
**exit 0, clean**. Tag usage is already inside `doc-comments.md`'s closed table — `@throws` 20,
`@returns` 10, `@param` 5, `@see` 2, no `@example` — with 23 `{@link}` uses all naming real
symbols.

| Rule                  | Native? | Buys                                                                                                                                           |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-tag-names`     | **yes** | Catches a misspelled or nonexistent tag. **Does not enforce the closed 5** — `definedTags` is an _additive_ allowlist, so `@deprecated` passes |
| `no-undefined-types`  | no      | Flags `{@link NotKnown}`. Not URL targets; cannot resolve unqualified method names in some scopes                                              |
| `escape-inline-tags`  | no      | The measured whitespace-preceded-`@` hazard. `jsdoc-in-scripts` needed **three hand-rewording commits** for exactly this                       |
| `informative-docs`    | no      | "Comment merely restates the identifier" = `doc-comments.md` rule 5, currently judgment-only                                                   |
| `normalize-see-links` | no      | Auto-fixes toward `@see {@link …}`, the form `doc-comments.md` mandates on a measured rendering                                                |
| `match-description`   | no      | Regex over JSDoc prose — the drift-phrasing check, for the JSDoc half only                                                                     |
| `no-bad-blocks`       | no      | `/*` that looks like JSDoc but is not, so silently misses hover                                                                                |

**The non-native ones need eslint-plugin-jsdoc through oxlint's JS-plugin API, which is alpha**
(ESLint v9-compatible; the `jsdoc` name collides with oxlint's native plugin, so it needs an
alias). That is the cost to weigh — **not** ESLint itself, which is not required.

Sequence: enable the native tier first, then evaluate the alpha tier separately. Neither replaces
checks 1–4: every rule above operates **inside a JSDoc block**, and the 19 dead references are
overwhelmingly in `//` comments.

### 4. Three slices, in this order

**No `product` pass.** Precedent measured on the three most recent tooling slices
(`jsdoc-standing-rule`, `honest-scripts-cache-deletion`, `document-the-orchestrating-seat`): each
touches **zero** `features/` files and each is attributed to `orchestrator`/`architect`/`hardener`
only. There is no user-facing behaviour here and no `.feature` to write, so the cycle enters at
`architect` or `coder` and `product` is not in it.

| #   | Slice                          | Entry              | Why separable                                                                                                                                                                                                      |
| --- | ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | `oxlint-native-jsdoc-tier`     | `coder`            | One config line. `.oxlintrc.json` gains `jsdoc` to `plugins` plus `check-tag-names`. **Measured clean on the real tree today**, so it lands green and independently of everything below                            |
| B   | `comment-reference-checks`     | `architect` DESIGN | The four checks, plus fixing the 19 + 4 sites they flag. Needs a design pass on CLAUDE.md's own triggers: it creates new modules and its home is undecided                                                         |
| C   | `no-undated-cross-file-claims` | `architect`        | The convention into `doc-comments.md`, then the prose prune. **After B**, not before — the convention mandates the `<file>'s <symbol>` form, and shipping a mandate nothing checks is what produced this candidate |

**Slice A also has to decide `warning` vs `error`.** Every `rules/*.yml` is `warning` and
`npm run ast-grep` is report-only, but oxlint rules here gate — `npm run lint` is a real exit code.
Clean baseline means `error` is available at no migration cost; that is a choice, not a default.

**Slice B's open decision, for its DESIGN pass to rule on: sixth check of `agent-doc-check`, or a
sibling program?** The recommendation is **sibling**, on two grounds — `agent-doc-check`'s name and
all five of its checks are about `.claude/**` docs, whereas checks 1–4 scan `src/**`/`scripts/**`
**source**; and `ast-grep-rule-check`/`agent-doc-check` are already a pair that deliberately mirror
each other's shape, so a third is the established pattern rather than a new one. The counter, which
is real: check 1 must _also_ scan the docs surface (705 mentions, 16 unresolved), so the check
genuinely spans both charters, and a new program pays full `scripts/` gate freight — own vitest
suite, CRAP ≤ 6, `dry4ts:scripts`, `test:mutation:scripts`. **That freight is most of slice B's
cost, not the four checks.**

### Prior art — searched, per `orchestration.md`'s "before building a checker, search for one"

Nothing off-the-shelf validates code-comment→code references in TypeScript.

| Tool                                               | Verdict                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Drift](https://github.com/fiberplane/drift)       | **Evaluated at source and dropped, 2026-09-07.** MIT/Zig. Requires explicit `drift link` per binding and **does not scan**; only markdown can host an anchor. Blind to all 19 dead tokens by construction, and cannot see a `.ts` comment. Its signal is "anchored code changed since review" — a re-review prompt, not a broken-reference check. Not tracked further |
| [ReCite](https://arxiv.org/abs/2608.03734)         | Same detection as check 4; 869 found on Linux v6.18-rc1, 50 of 75 patches accepted. No released tool                                                                                                                                                                                                                                                                  |
| [DOCER](https://github.com/wesleytanws/DOCER_tool) | README-scoped, 3 commits, **36% FP** — the reason the exemption is mandatory                                                                                                                                                                                                                                                                                          |
| Semgrep                                            | `generic` mode matches comments and its `...` spans 10 lines — a real capability ast-grep lacks. But no filesystem-existence predicate, a Python dep in a pure-npm toolchain, and its one advantage is free in a checker already reading whole files                                                                                                                  |
| CodeScene                                          | Hotspots and code health. Not this                                                                                                                                                                                                                                                                                                                                    |
| eslint-plugin-jsdoc                                | All 78 rules read; six are relevant — see section 3                                                                                                                                                                                                                                                                                                                   |
| TypeDoc `validation.invalidLink`                   | The only thing that validates `@link` wholesale. Not installed; `hover-carries-detail-no-reader-asked-for` already weighs adopting it                                                                                                                                                                                                                                 |

## Touches

**A** `.oxlintrc.json`, plus CLAUDE.md/`quality-tooling.md` prose.

**B** `scripts/` — a new program or a sixth check, its tests, and CLAUDE.md's checker prose, which
counts the checks by number and says "Five binary facts". The 19 + 4 flagged sites are fixed here,
spanning `src/`, `scripts/`, `features/` and `rules/`.

**C** `doc-comments.md`, plus whatever backfill the open question below settles on.

## Open questions

- **The sidecar half stays out of scope until a sidecar exists.** Zero instances today
  (`ls src/*.md` → nothing), so slice B checks filenames, symbols and test titles and leaves the
  `@see {@link ./name.md}` form alone. Reopen when the first sidecar lands; the extractor will
  already be there.
- **Does the reverse orphan check have an opt-out problem?** Unchanged from the original filing — a
  sidecar written ahead of its code is a real workflow, the same shape as `allow-unresolved-files`.
- **How far does slice C's prune go?** The _rule_ covers rosters and slice refs — slice C's
  convention says so in as many words. What is undecided is the **backfill**: 83 roster sites and
  39 `"this slice"` refs, each a judgment call, on top of C's own convention edit. Options: prune
  in C; prune in a fourth slice; or write the rule and let the sites drain as files are touched.
  The third is cheapest and slowest, and is the one that risks the rule reading as advisory.
- **Counts are not this todo's.** `measured-figures-should-name-their-tree` owns them, and this
  audit answers its own open question ("is the population actually large?") at ~55 in `src/` —
  including two `all NNN tests green` figures that contradict each other, so at least one is
  already wrong. Slice C's "cite the command, not the number" bullet overlaps it; reconcile the two
  before C is written rather than shipping the same rule in two homes.
- **Cleanup will move `crap4ts`.** Per `crap4ts-scores-a-tree-that-no-longer-exists`, a
  comment-only slice already produced a false FAIL (16 functions over threshold) because Istanbul
  keys by source location. Run `npm run test:coverage` first, and apply `doc-comments.md`'s sweep
  discipline: record `crap4ts`/`dry4ts`/mutation before and after, and treat a moved number as a
  finding rather than a new baseline.
