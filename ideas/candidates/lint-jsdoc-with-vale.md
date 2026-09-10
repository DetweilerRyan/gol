---
name: lint-jsdoc-with-vale
title: Lint JSDoc with Vale — the STE pass, and repo-authored rules enforcing doc-comments.md
created: 2026-09-10
---

> **DESIGN pass ratified 2026-09-10 at `ee9fdba`, by `architect` in DESIGN mode.** Every measurement
> below was re-derived; four of the original figures did not reproduce and are corrected in place, with
> the superseded value kept beside the new one. The design ruling is the "Ratified design" section
> onward. Nothing here is code — the file set, the interfaces and the ordering are the deliverable.

## Situation

Vale lints comments in source code natively, using tree-sitter grammars. It needs one config entry this
repo does not have:

```ini
[formats]
ts = md
tsx = md
```

Without it, four of the six enabled rules silently do nothing while `Contractions` still fires. **A run
without the mapping therefore looks alive and is not.**

### The corpus, stated as the command that produced it

```bash
git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'src/*.ts' 'src/*.tsx' 'scripts/**/*.ts' 'scripts/*.ts' \
  | grep -v '\.test\.' | grep -v '^src/catalyst/' | grep -v '^src/test-support/'
```

**104 files** at `ee9fdba` (the earlier note said 102; the command was not recorded, so the two are not
comparable). Every figure in this file is that list unless it says "whole tree", which means
`git ls-files '*.ts' '*.tsx' | grep -v '^src/catalyst/'` — **278 files**.

### Re-derived yield

| rule              | no `[formats]` | all comments | block scope (`.ts`+`.tsx`) | block scope, `.ts` only |
| ----------------- | -------------: | -----------: | -------------------------: | ----------------------: |
| `SentenceLength`  |              0 |          843 |                        218 |                     178 |
| `PassiveVoice`    |              0 |          405 |                        111 |                      96 |
| `Contractions`    |            212 |          209 |                         58 |                      49 |
| `ProcedureLength` |              0 |           15 |                          0 |                       0 |
| `ParagraphLength` |              0 |            8 |                          0 |                       0 |
| `OneInstruction`  |              0 |            0 |                          0 |                       0 |
| **total**         |        **212** |    **1,480** |                    **387** |                 **323** |
| **mechanical**    |        **212** |    **1,060** |                    **276** |                 **227** |

Mechanical = `SentenceLength` + `Contractions` + `ParagraphLength`.

**What reproduced and what did not.**

| claim                                       |   was |                 re-derived | verdict                             |
| ------------------------------------------- | ----: | -------------------------: | ----------------------------------- |
| no-`[formats]` total                        |   181 |  **212**, all Contractions | not reproduced                      |
| all-comments total                          | 1,511 |                  **1,480** | not reproduced                      |
| block-scope total                           |   387 |                    **387** | exact, including the per-rule split |
| block-scope mechanical                      |   276 |                    **276** | exact                               |
| `NoThisFunction` unanchored                 |    22 |      **22** (needs case-i) | exact                               |
| `NoThisFunction` anchored                   |     1 |                      **1** | exact                               |
| `MeasurementInDoc`: all four hits in JSX    | 4 JSX | **3 JSX, 1 genuine JSDoc** | refuted                             |
| block scope means "`/** */` and never `//`" |     — |  **multi-line, not JSDoc** | refuted — see the next section      |

The two totals that moved are the two nobody depends on. Both scoped figures reproduced to the finding.

## Complication

### The scope selectors do not mean what the candidate assumed

Measured against vale 3.20.0 over one probe file carrying all six comment shapes:

| comment shape              |   scope |
| -------------------------- | ------: |
| `// line`                  |  `line` |
| `/* single-line plain */`  |  `line` |
| `/** single-line jsdoc */` |  `line` |
| `{/* single-line jsx */}`  |  `line` |
| multi-line `/* plain */`   | `block` |
| multi-line `/** jsdoc */`  | `block` |
| multi-line `{/* jsx */}`   | `block` |

**The discriminator is multi-line versus single-line. It is not JSDoc versus not.** Three consequences,
each of which the design has to answer rather than inherit:

1. **It over-reaches.** Multi-line JSX render commentary is in scope. In `.tsx`, **40 of 64** block-scope
   findings (62.5%) are JSX render commentary rather than JSDoc. That is the "second scope leak", and it
   is not a `.tsx` quirk — it is what `block` means.
2. **It under-reaches, and nobody had noticed.** The corpus holds **53 single-line `/** … */` JSDoc
   blocks** that `block` scope never sees. Fourteen of them carry a contraction. A `line`-scoped rule
   would reach them and every `//` comment with them, so **no scope selector means "JSDoc"**.
3. **There is no documentation scope.** `text.comment.documentation.ts` and
   `text.comment.block.documentation.ts` both report 0 and exit 0. An invalid scope is silent.

### Triaging a Vale finding in a JSDoc is not the same act as triaging one in Markdown

**1. The remedy is often placement rather than prose.** In an article an over-long sentence gets split. In
a JSDoc it may mean the content does not belong in the interface at all — `doc-comments.md` rule 4 sends
implementation detail to `//`, rule 7 sends overflow to a sidecar. Splitting the sentence in place is the
wrong fix that still clears the finding.

**2. New confident-zero modes.** `prose-linting.md` lists four. This slice adds three, and they are
measured:

| mode                                          | symptom                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| missing `[formats]` mapping                   | run reports findings, so it does not look silent, while four of six rules are inert |
| `<Style>.<Rule> = warning` names no such rule | **silent, exit 0.** A typo in `.vale.ini` disables nothing and enables nothing      |
| a `scope:` selector that does not exist       | **silent, exit 0.** The rule matches nothing and reads as a clean tree              |

**3. `@example` is exempt automatically; `@param` and `@returns` are not.** `ts = md` makes Vale skip
Markdown fences, so prose inside an `@example` block is unlinted. Measured: `PassiveVoice` fires on a
`@returns` noun phrase ("The value that is returned by the caller"), which is conventional rather than
wrong, so `@returns` wants an exempt class of its own.

**4. `ParagraphLength` remediation costs hover height and `SentenceLength` does not.** Splitting a
sentence reflows within the same rendered lines. Splitting a paragraph inserts a blank ` *` line, which
spends one of `doc-comments.md` rule 6's ~15 rendered lines. Reasoned from the two rules, still not
measured.

## Question

How does an agent lint the JSDoc it just wrote, and act on a finding correctly?

---

# Ratified design

## Q1 — where a repo-authored Vale style lives

**Ruling: two `StylesPath` lines. The tracked directory first, `.vale` last.**

```ini
StylesPath = vale-styles
StylesPath = .vale
```

Measured on vale 3.20.0, each fact by its own probe:

| fact                                                   | measured                                           |
| ------------------------------------------------------ | -------------------------------------------------- |
| repeated `StylesPath` keys                             | both resolve; styles from both directories load    |
| comma-joined `StylesPath = A, B`                       | **E201, exit 2** — not a supported form            |
| style-name collision across the two paths              | **first listed wins** (verified in both orders)    |
| `vale sync` target                                     | **the last listed path** (verified in both orders) |
| `vale sync` when that path is absent                   | creates it and succeeds                            |
| `vale sync` when that path holds an authored style     | leaves the authored style in place                 |
| a `StylesPath` that does not exist, at lint time       | E201, exit 2, whole run aborts                     |
| `BasedOnStyles` naming a style that is not on the path | **E100, exit 2 — loud**                            |
| a non-`.yml` file inside a style directory             | ignored                                            |
| a malformed `.yml` inside a style directory            | E201, exit 2, whole run aborts                     |

The ordering does two jobs at once, which is why it is the answer: **tracked-first** gives the repo's own
style lookup priority, and **`.vale` last** keeps `vale sync` writing exactly where `.gitignore` line
`/.vale/` and `.prettierignore` line `.vale` already point. Neither ignore file changes.

**It fails safe.** The repeated-key behaviour is undocumented INI-parser accumulation, so pin the version.
If a future Vale takes last-only, `BasedOnStyles = JsDoc` aborts with E100 at exit 2 rather than reporting
a confident zero. Record that argument in the rationale sidecar, because it is what makes the mechanism
acceptable.

**Rejected, with reasons:**

| option                                       | why not                                                                                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Packages = <local directory>`               | **works** — measured, syncs into `StylesPath` — but needs `vale sync` after every rule edit. A stale copy lints the previous rule silently. The slice would be authoring a new confident-zero mode. |
| `postinstall` copy, on the crap4ts precedent | same staleness, and Vale is installed by `brew`, not `npm`, so `npm ci` is the wrong hook                                                                                                           |
| vendor the package and drop `vale sync`      | loses the version pin `.vale.ini` currently carries, which is the only thing stopping upstream drift                                                                                                |
| put the style under `.vale/`                 | untracked by `/.vale/`, and prettierignored                                                                                                                                                         |
| put the style under `rules/`                 | `ast-grep-rule-check` recurses `sgconfig.yml`'s `ruleDirs` and would read Vale YAML as malformed ast-grep rules                                                                                     |

**Directory name: `vale-styles/` at repo root.** One tracked `StylesPath` serves both halves — the
`JsDoc` style below, and `STEDoc` when the successor slice lands it.

## Q2 — one slice or two, and in which order

**Ruling: two slices, and Part B lands first.** The candidate's own open question guessed right.

The discriminating constraint, and it is the one to design against: **no landed state may leave a hand-run
reporting a backlog nobody has triaged.**

| piece                                           |                                    findings the day it lands | may land alone |
| ----------------------------------------------- | -----------------------------------------------------------: | -------------- |
| `[formats]` with no `.ts` section               |                 **0** — measured, Vale processes **0 files** | yes            |
| tracked `StylesPath`, style named by no section |                                                            0 | yes            |
| Part B's four rules, `.ts`-scoped, whole tree   | **3** — all three ruled true positives, all fixable in-slice | yes            |
| Part A's `STEDoc` section                       |                                  **387** (or 323 `.ts`-only) | **no**         |

So the split is **not** "config then rules". It is:

- **Slice 1, `lint-jsdoc-with-vale` — plumbing plus the ratchet.** The tracked style directory, the
  `[formats]` mapping, the four repo-authored rules with fixtures, the three fixes, and the doc edits.
  Ends at zero findings.
- **Slice 2, the STE remediation — `STEDoc` and the 227 findings together, never apart.** Its config
  section and its remediation are one commit sequence, because the section alone is the backlog.

**This renames the halves relative to the candidate.** What the candidate calls Part B ships first as
Part 1. Say so in the handoff so nobody sequences from the old numbering.

## Q3 — the fixture mechanism

**The `ast-grep` precedent transfers as a convention and stops at enforcement. Say that plainly rather
than implying a gate exists.**

`ast-grep` has `rule-tests/`, `npm run ast-grep:test` and `npm run ast-grep:rules`. Vale has no
equivalent, and this slice cannot build one — a checker would live in `scripts/`, which drags in CRAP ≤ 6,
its own vitest suite, `dry4ts` and mutation testing. That is `give-vale-an-owner-and-a-trigger`'s job.

**What this slice ships instead — a tracked, self-contained harness. Measured working.**

```
vale-styles/
  JsDoc/
    NoThisFunctionOpener.yml
    ImplementationAltitude.yml
    MeasurementInDoc.yml
    ThisSlice.yml
  fixtures/
    fixtures.vale.ini
    NoThisFunctionOpener.bad.ts    NoThisFunctionOpener.good.ts
    ImplementationAltitude.bad.ts  ImplementationAltitude.good.ts
    MeasurementInDoc.bad.ts        MeasurementInDoc.good.ts
    ThisSlice.bad.ts               ThisSlice.good.ts
```

`vale-styles/fixtures/fixtures.vale.ini`:

```ini
StylesPath = ..
MinAlertLevel = warning

[formats]
ts = md

[*.ts]
BasedOnStyles = JsDoc
```

`StylesPath` resolves relative to the config file, so `..` is `vale-styles/`. **The harness needs no
`.vale/` at all** — Part B's rules extend nothing from STE, so the fixture run works in a fresh worktree
before `vale sync`. Measured: the bad fixture reports exactly `JsDoc.NoThisFunctionOpener`, the good one
reports zero.

The hand-run, which goes in `prose-linting.md` as a procedure:

```bash
vale --config=vale-styles/fixtures/fixtures.vale.ini --output=JSON vale-styles/fixtures/*.ts
```

Every `<Rule>.bad.ts` must report at least one finding of exactly `JsDoc.<Rule>` and nothing else. Every
`<Rule>.good.ts` must report nothing.

**Why a second config rather than one.** The fixtures are bait, so the main `.vale.ini` has to exempt
them or any tree-wide run reports eight deliberate findings — the exact untriaged backlog Q2 forbids.
But an exempt path cannot test itself. The second config is what lets the fixtures be exempt in the live
run and live in the harness run.

**`give-vale-an-owner-and-a-trigger` inherits a concrete requirement from this**, and it is sharper than
"run Vale": **Vale exits 0 on a warning-only match.** Measured — 1 only on an `error`-severity match, and
this repo re-levels every rule to `warning` in `.vale.ini`, so **the live config can never exit nonzero on
a finding.** A gate must read `--output=JSON`, never `$?`.

## Q4 — the JSX scope leak — RULED PER RULE, NOT PER SLICE

**Superseded by measurement, 2026-09-10.** The design ruled `.ts` only, dropping `text.comment.block.tsx`
from every rule. Re-measured, that is too blunt: it costs three working rules their coverage of every
component in the repo to suppress three findings from one.

Every finding, cross-tabulated by rule and comment kind:

| rule                     | JSDoc |   JSX | plain `/* */` |
| ------------------------ | ----: | ----: | ------------: |
| `NoThisFunction`         |     1 | **0** |             0 |
| `ImplementationAltitude` |     1 | **0** |             0 |
| `MeasurementInDoc`       |     1 | **3** |             0 |
| `ThisSlice`              |     0 | **0** |             0 |

**All the `.tsx` noise is one rule.** And its three hits are inverted false positives: `LifeBoard.tsx`
carries "measured at 1280x900 exactly one pair does" inside a `{/* … */}` block. Rule 4 says a measured
finding belongs in the **implementation** channel, and a JSX comment **is** the implementation channel
for markup. The measurement is correctly placed; flagging it inverts the rule.

**The principle, which outlives these four rules.** Two of them carry a hidden premise — _this block
comment is an interface doc_. `MeasurementInDoc` and `ImplementationAltitude` both do. `NoThisFunction`
and `ThisSlice` do not: a bad opener is bad anywhere, and `engineering.md` bans "this slice" everywhere.

Vale's scope cannot express "is this an interface doc", because `block` means _multi-line_. So a
premise-carrying rule is limited on `.ts` too; it only looks like a `.tsx` problem because this repo
writes `.ts` implementation notes as `//` and `.tsx` ones as `{/* … */}`.

**So each rule declares the extensions where its premise holds**, and the next rule anyone writes has
to answer the same question: _does this rule assume the comment is a hover?_ Suggested starting point,
subject to the ownership clause below:

| rule                     | `.ts` | `.tsx` |
| ------------------------ | :---: | :----: |
| `NoThisFunction`         |   Y   |   Y    |
| `ThisSlice`              |   Y   |   Y    |
| `ImplementationAltitude` |   Y   |   Y    |
| `MeasurementInDoc`       |   Y   |   —    |

## Ownership — `architect` alone, and these rules are guidance

**`architect` owns the Vale rules that apply to module interface prose, and no other role authors or
changes one.** That covers JSDoc in `src/` and `scripts/`, and the module sidecars Vale lints
(`src/**/*.md`). It does not cover the shared STE style over `.claude/**` and `CLAUDE.md`, which is
a different surface with a different audience.

This is the `ast-grep` precedent, applied to a second checker. `architect.md` already says
"**`rules/*.yml` and `rule-tests/` are yours.** You are the only role that authors or changes them;
every other role reads the output and reports tensions to you." The Vale clause takes the same shape,
in the same place.

**Everything this candidate says about the four rules is guidance, not specification.** The token
lists, the anchoring, the per-rule extension table, the messages, the fixture shapes — all of it is
evidence that the approach works and a starting point for whoever implements it. **`architect` makes
the call on what to implement and how.** Specifically it may:

- reject a rule outright, including `MeasurementInDoc`, whose premise is the weakest of the four
- change a token list, or replace an `existence` matcher with another of Vale's twelve rule types
- re-scope a rule, or level it differently
- add rules this candidate never considered, and decline the ones it proposed

The measured facts stand as facts — anchoring took `NoThisFunction` from 4.5% to 100% precision, and
`block` means multi-line. The **rules** are a proposal.

## Q5 — the ordering

Seven steps. Each leaves `npm run lint`, `npm run format:check`, `npm run build`, `npm run agent-doc-check`,
`npm run reference-check` and every hand-run `vale` invocation clean.

**Step 0 — precondition.** `vale sync`. A fresh worktree has no `.vale/`, and lint aborts at E201 exit 2
before reaching any rule. This is the documented confident-zero mode and it is the first thing to trip.

**Step 1 — the tracked style path, carrying nothing yet.** Add `StylesPath = vale-styles` **above** the
existing `StylesPath = .vale`. Create `vale-styles/JsDoc/` with the first rule and its two fixtures, plus
`vale-styles/fixtures/fixtures.vale.ini`. Add no `[formats]`, no `.ts` section.

Verify: `vale .claude/agents/articles/doc-comments.md` reports the same 41 warnings as before, so the
second path changed no Markdown result. `vale sync` still reports it synced to `.vale`. The harness run
passes. The tracked-tree run below is unchanged, because the new style is named by no section.

**Step 2 — `[formats] ts = md` alone.** Measured inert: with no `.ts` section Vale processes **0 files**.
Verify by running `vale` over twenty corpus files and reading "in 0 files".

**Step 3 — the three exemption sections, written at the file position `[*.ts]` will sit above.** One for
`vale-styles/fixtures/*`, one for `.claude/worktrees/*`, one for `.stryker-tmp*/*`. Each must set
`BasedOnStyles =` empty **and** switch every explicitly-enabled rule off by name. `.vale.ini`'s own
comment records why the empty value alone is not enough, and it failed silently in that direction once.

Both intermediate states are green: with `[*.ts]` absent the exemptions match nothing that is enabled, and
with it present they win because sections stack and the later one takes the key.

**Step 4 — the first rule goes live.** Add `[*.ts]` with `BasedOnStyles = JsDoc` and the rule named
explicitly at `warning`, **above** step 3's exemptions. Verify with the command that produced the
baseline, which is a tracked-file list rather than a filesystem walk:

```bash
git ls-files '*.ts' '*.tsx' | grep -v '^src/catalyst/' | xargs vale --output=JSON
```

Expect the rule's known finding count and nothing from `vale-styles/`.

**Step 5 — rules two through four, one commit each, each repeating steps 1, 3 and 4's verification.**
Then fix the three findings. All three are comment-only.

**Step 6 — the doc edits.** `prose-linting.md`, its rationale sidecar, `doc-comments.md`'s one pointer,
`architect.md`'s ownership clause.

**Step 7 — `npm run lint`, then `npm run format`.** Then `npm run agent-doc-check` and
`npm run reference-check`, both of which this slice's `.claude/**` edits can move.

### The section glob needs no narrowing, but the invocation does

`[*.ts]` matches every `.ts` in the tree — tests, `perf/`, `features/`, root configs. Run over all 278
tracked files, the four rules yield **3 findings total**, all in production code. So there is no
test-comment register problem to solve here, and the open question about `.test.ts` files is closed for
Part B. **It is not closed for Part A**, whose 227 is a production-only figure.

**`vale .` is not that command, and the difference is 3 findings against 10.** Measured: a bare `vale .`
at the repo root processes **916 files** and reports the same three findings **once per checkout it
walks into** — `.claude/worktrees/idea-pause-and-play/`,
`.claude/worktrees/the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant/`, and a
`.stryker-tmp/sandbox-*/`. It does **not** enter `node_modules`. Two consequences, and the design takes
both:

1. **Every verification in the ordering names the tracked-file list**, never a filesystem walk. That is
   what the 3-finding baseline is scoped to.
2. **`.vale.ini` exempts `.claude/worktrees/*` and `.stryker-tmp*/*` anyway**, because somebody will type
   `vale .` and Vale has no ignore mechanism other than a later section. Both `agent-doc-check` and
   `reference-check` already carry the `.claude/worktrees/` exclusion for exactly this reason, so the
   precedent is settled; the Stryker sandbox is the new one.

## The four rules, and the three findings

| rule                     | whole-tree findings | ruling                                                                                                                               |
| ------------------------ | ------------------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NoThisFunctionOpener`   |                   1 | `src/equality/is-strict-equal.ts` — "This function is preferable over…", a plain rule 2 violation                                    |
| `MeasurementInDoc`       |                   1 | `scripts/feature-files.ts` — "(measured on darwin…)" in a hover; rule 4 puts the measurement in `//`                                 |
| `ImplementationAltitude` |                   1 | `scripts/ast-grep-rule-check/decide.ts` — "(recursively, per sgconfig.yml)" describes `run.ts`'s internals inside `decide()`'s hover |
| `ThisSlice`              |                   0 | clean corpus; the fixture is what distinguishes that from an inert rule                                                              |

**Anchoring is confirmed and is the rule-authoring lesson.** `NoThisFunctionOpener` unanchored gives 22
findings at 4.5% precision; anchored to a sentence opener **and** a verb list it gives 1 at 100%. Both
halves earn their keep — measured, anchor-without-verb-list gives 3, of which 2 are ordinary mid-block
referring expressions.

**`recursively` is the token most likely to produce a future false positive**, since it can appear
legitimately in an interface statement. It is the first token to drop if a later corpus shows one. It is
not dropped now, because the one hit it produced is a true positive and narrowing a matcher to clear a
finding is the move this repo already rejects elsewhere.

## Ratified file set

**The rule files below are a proposal, not a specification.** Per the ownership clause, `architect`
decides which rules exist, what they match and how they are scoped. What is ratified here is the
_shape_: where a repo-authored style lives, that every rule ships with a bad and a good fixture, and
which files an implementation touches. A different set of four rules — or three, or six — lands in
the same file set.

**Slice 1.** New:

| path                                           | what                         |
| ---------------------------------------------- | ---------------------------- |
| `vale-styles/JsDoc/NoThisFunctionOpener.yml`   | rule                         |
| `vale-styles/JsDoc/ImplementationAltitude.yml` | rule                         |
| `vale-styles/JsDoc/MeasurementInDoc.yml`       | rule                         |
| `vale-styles/JsDoc/ThisSlice.yml`              | rule                         |
| `vale-styles/fixtures/fixtures.vale.ini`       | the harness config           |
| `vale-styles/fixtures/<Rule>.bad.ts` × 4       | must fire, exactly that rule |
| `vale-styles/fixtures/<Rule>.good.ts` × 4      | must stay silent             |

Edited:

| path                                                 | what                                                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.vale.ini`                                          | second `StylesPath`, `[formats]`, `[*.ts]`, and three exemption sections (fixtures, worktrees, Stryker sandbox)                  |
| `.claude/agents/articles/prose-linting.md`           | audience line, read trigger, three new confident-zero modes, the scope-selector table, the triage section, the fixture procedure |
| _(same file)_                                        | the ownership boundary: which Vale rules `architect` owns and which it does not                                                  |
| `.claude/agents/articles/prose-linting.rationale.md` | every measurement in this file, and the corrected figures beside the old                                                         |
| `.claude/agents/articles/doc-comments.md`            | one pointer, where a comment is written                                                                                          |
| `.claude/agents/architect.md`                        | ownership of `vale-styles/JsDoc/**` and its fixtures, beside the `rules/*.yml` clause                                            |
| `CLAUDE.md`                                          | one line naming `architect` as owner, matching the ast-grep entry                                                                |
| `src/equality/is-strict-equal.ts`                    | comment-only                                                                                                                     |
| `scripts/feature-files.ts`                           | comment-only                                                                                                                     |
| `scripts/ast-grep-rule-check/decide.ts`              | comment-only                                                                                                                     |
| `ideas/candidates/lint-jsdoc-with-vale.md`           | `git rm` as part of the slice                                                                                                    |

Conditional, measure before editing:

| path             | when                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.oxlintrc.json` | only if a bait fixture reds the `jsdoc/*` tier. `ignorePatterns` already exists, so it is a one-line entry. **Prefer writing fixtures that pass lint.** |

**Not edited, and each for a measured reason:** `.gitignore` and `.prettierignore` (the sync target does
not move); `tsconfig*.json` (`vale-styles/` is outside all three `include` lists); `vite.config.ts`
(the `unit` project's unrooted default include is `**/*.{test,spec}.…`, which `<Rule>.bad.ts` does not
match — **so never name a fixture `*.test.ts` or `*.spec.ts`**); `stryker.config.json` and
`crap4ts.config.ts` (both scope `src/**`).

## Interfaces

1. **`.vale.ini` ↔ `vale-styles/`.** `vale-styles` first, `.vale` last. `vale sync` writes only to
   `.vale`; `vale-styles/` is authored and tracked; a style-name collision resolves to `vale-styles/`.
2. **Rule ↔ scope.** Every rule in `vale-styles/JsDoc/` carries exactly `scope: [text.comment.block.ts]`.
   No `.tsx`. A rule that needs another scope is a design change, not a rule edit.
3. **Rule ↔ fixture.** `vale-styles/JsDoc/<Rule>.yml` pairs with `vale-styles/fixtures/<Rule>.bad.ts` and
   `<Rule>.good.ts`, matched by basename. Contract: bad reports ≥ 1 of exactly `JsDoc.<Rule>` and nothing
   else; good reports 0. A rule without both files is unshipped.
4. **Harness ↔ live config.** The harness is the only thing that reads `vale-styles/fixtures/`. The live
   `.vale.ini` exempts that path by name.
5. **Fixture ↔ every other gate.** A fixture is valid TypeScript, passes `npm run lint` and
   `npm run format:check`, is named so it matches no vitest include, and lives outside every tsconfig.
6. **Token quoting.** Author every `tokens:` entry in **single** quotes, as upstream does. A YAML
   double-quoted scalar processes `\b` as a backspace escape, so `"\bword\b"` is not the regex it looks
   like. Prettier leaves a double-quoted scalar containing a backslash alone, so **nothing catches this**.

## Where I had to guess

| guess                                                             | how a coder settles it                                                                                                                                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ImplementationAltitude`'s exact token list beyond the four named | measure precision whole-tree before adding a token                                                                                                                   |
| Whether a bait fixture reds oxlint's `jsdoc/*` tier               | write one, run `npm run lint`                                                                                                                                        |
| The exact `.vale.ini` section-glob form for the three exemptions  | Vale's `*` crosses `/`, so `vale-styles/fixtures/*` should reach them; verify with a tracked-tree run and a bare `vale .`, both reporting zero from each exempt path |
| Whether `@returns` needs its own exempt class in Part A           | slice 2's problem; the `PassiveVoice`-on-`@returns` hit is measured, the remedy is not                                                                               |

## Two findings against existing docs, neither this slice's to fix alone

1. **`prose-linting.md` says the exit code "is 1 when a rule matched".** Measured: **0** on a
   warning-only match, 1 only on an `error`-severity match. Since `.vale.ini` re-levels every rule to
   `warning`, the live config cannot exit nonzero on a finding. Correct it in step 6.
2. **`prose-linting.md` says "Use double quotes rather than single. Prettier normalises a YAML scalar to
   that form".** Measured: with `singleQuote: true` Prettier normalises to **single** quotes, in both
   standalone YAML and Markdown front matter. `architect.md`'s `description:` keeps double quotes only
   because it contains an apostrophe. The advice is right for the case it was written about and wrong as
   stated. Correct it in step 6.

## What is descoped

- **The STE remediation.** Slice 2, config and remediation together.
- **Linting `.tsx` JSDoc.** Blocked by the scope-selector semantics; the unblocking move is a `src/`
  change to JSX render commentary, which is its own candidate.
- **Any gate, any `npm run` script, any CI.** `give-vale-an-owner-and-a-trigger`, which now inherits the
  measured requirement that a Vale gate must read `--output=JSON` rather than `$?`.
- **`.test.ts` register.** Closed for Part B (3 whole-tree findings, none in a test). Open for Part A.

## What survives from the original open questions

- **Gitignored style directory** — answered, Q1.
- **`ProcedureLength` reachable in a JSDoc?** — **answered: yes.** Both list-scoped rules reach a genuine
  Markdown list inside a JSDoc (a 23-word item fires `ProcedureLength`, an "and then" chain fires
  `OneInstruction`). A `@param` tag line is **not** a Markdown list and reaches neither. Their zeros on
  the corpus are real: this repo's JSDoc carries no such lists.
- **`.test.ts` files** — see descoped.
- **Own gate, or `ast-grep`'s report-only convention?** — report-only here, and the reason is now
  measured rather than stylistic: the live config cannot exit nonzero.
- **Part B before Part A?** — **yes**, and Q2 gives the constraint that forces it.
- **Does the intersection caveat hold?** — still open, and slice 2 owns it. The do-not-merge ruling stands
  and this pass found nothing against it: the two articles govern different dimensions, and the design
  needed a cross-link rather than a merge.
