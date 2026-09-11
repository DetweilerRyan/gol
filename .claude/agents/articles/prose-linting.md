# Article: Prose Linting — running Vale over the agent docs, and what to do with a finding

**Audience:** any role or session that edits `.claude/agents/**`, `CLAUDE.md`, a module sidecar, or a
JSDoc block in `src/` or `scripts/`

**Read when:**

- before acting on a Vale finding, so you know which ones to act on
- before enabling, disabling or re-levelling a rule in `.vale.ini`
- when a Vale run reports zero and you want to know whether that is real
- after writing or changing a JSDoc block, before handing off — see "Triaging a finding in a comment"

> The measurements behind every ruling here are in `prose-linting.rationale.md`: the per-rule precision
> counts, the dates, and the rules tried and rejected. Read it when you are **changing** a ruling below,
> never in order to follow one.

## Setup

```bash
brew install vale && vale sync
```

**Vale is a Go binary, not an npm dependency, so `npm ci` does not install it.** A machine without it
lints nothing, which reads exactly like a clean run. `vale sync` fetches the style package, which
`.vale.ini` pins by version.

`.vale/` is gitignored as a downloaded artifact, and separately prettierignored. Prettier does not
consult `.gitignore`, so without the second entry `npm run format` rewrites third-party YAML in place.

**A new worktree therefore cannot lint until you restore that directory.** `git worktree add` copies
tracked files only, so `.vale/` is absent and the first `vale` invocation fails on the missing styles
path. Copy `.vale/` from a checkout that has it, or run `vale sync` again. **Do this before you start a split,
not when the mandate to lint arrives.** The failure names a missing path rather than a missing style, so
it does not read as "Vale is not set up here".

**`npm run prose-lint` is the command.** It runs Vale over the tracked file list rather than walking
the filesystem, and prints how many files it linted. That trailing count is the point. A zero from a
clean tree and a zero from a run that linted nothing are the same bytes. Four of the eleven ways below
produce exactly that. The script fails when it **cannot** lint — no binary, no `.vale/`, an
unloadable config, an empty file list — and never on a finding.

**A mid-run abort (number 2 below) is a fifth such case, and the script shipped without it.** Vale
exits nonzero for two unrelated reasons. `--no-exit` separates them: it suppresses the exit-1 an
`error`-severity finding causes, and leaves the exit-2 a runtime error causes. So under that flag, any
nonzero means the run did not happen. Until the script read that status, an aborted run printed `E100`
to stderr and still closed with "A zero above is a measured zero".
`prose-linting.rationale.md` carries the measurement and the `xargs` caveat.

Run it after editing `.claude/**`, `CLAUDE.md`, a module sidecar, or a JSDoc block. No role owns the
running, because four seats do the editing.

## Vale is report-only here

Nothing gates on Vale's exit code, and `engineering.md`'s convention for a report-only checker applies:
read the output, not `$?`.

**The exit code is not a findings count.** Measured on vale 3.20.0: **0** when a `warning`-severity
rule matched. **1** when an `error`-severity one did. **2** when a file failed to parse.

Every rule `.vale.ini` enables is `warning`. So the live config never exits nonzero on a finding, and
anything that gates has to read `--output=JSON` rather than `$?`.

**A config error exits 2, and a missing `.vale/` is the common one.** Vale writes the path error to
stderr and leaves stdout empty. A `grep -c` pipeline over stdout therefore counts zero, which is the
worst of the three exit-code readings. Do not take the number from Vale's own closing line either: it says the run
stopped "with code 1" while the process exits 2. Measured on vale 3.20.0; the reproduction is in
`prose-linting.rationale.md`.

## Eleven ways a run reports a confident zero

Check each before you believe one.

1. **The rule's level is below `MinAlertLevel`.** `MinAlertLevel` is `warning`. A rule shipped at
   `suggestion` reports nothing at all until you re-level it in `.vale.ini`. `STE.ProcedureLength` is
   the live example: it ships at `suggestion` and is re-levelled here to `warning`.
2. **A file failed to parse and aborted the run.** Vale parses YAML front matter with a real YAML
   parser, and one unparseable file aborts the whole invocation rather than skipping that file.
3. **Vale is not installed, or `.vale/` is absent.** See Setup.
4. **The file matches no section glob in `.vale.ini`.** Vale applies no style, reports 0, and exits 0.
   A scratch copy of a file placed outside the globs is how a reviewer re-deriving a baseline hits
   this. Put the copy at an in-scope path instead.
5. **Vale reads a mistyped path as stdin.** Measured, non-interactively: the run reports
   `0 errors, 0 warnings and 0 suggestions in stdin` and exits 0. The tell is **in stdin** where a
   file count belongs. Every verification here names a path list.
6. **An `occurrence` rule counts nothing.** Two ways, both measured. It never fires at `max: 0`, so
   "at most zero" is not expressible. And under `scope: text.comment.block.<ext>` a whitespace token
   counts zero while `[\w]+` counts every word, so a rendered-**line** budget is not expressible
   either.
7. **`vale test` skips a rule file that carries no `tests:` key.** Measured over a directory holding
   two rules, one untested: `1 file — 1 passed, 0 failed`, exit 0. That is the missing-fixture hazard
   `npm run ast-grep:rules` catches, in a checker that has none.
8. **A malformed section glob matches nothing, silently.** Measured on Vale 3.20.0 over the fixture
   directory: a header of `[*.{ts]` reports 0 findings and exits 0, with no diagnostic. This is
   number 4 reached through a typo in `.vale.ini` rather than through a file's path. Brace expansion
   itself is real — `*.{ts,zzz}` selected the `.ts` fixtures alone and `*.{qqq,zzz}` selected none,
   so an unmatched glob applies no style rather than falling back to everything.

9. **`.vale.ini` carries no `[formats]` mapping for the extension.** The run still reports
   findings, so it does not look silent, while every rule that needs a Markdown text unit is inert.
   Measured on Vale 3.20.0, over one config and one `.ts` file
   carrying both rule shapes. With `ts = md` present, the comment-scoped `existence` rule and the
   `scope: sentence` rule both fired. With the three lines deleted and nothing else changed, only the
   comment-scoped one fired. So the mapping is not what puts a comment in scope. It gives the
   extracted text a structure that `sentence`, `paragraph` and list scopes can find. **This is the worst-shaped entry in the list**,
   because a partly inert run and a working one are indistinguishable from their output.
10. **A re-levelling line in `.vale.ini` misspells its rule.** `STE.ProcedureLenght = warning`
    enables nothing and disables nothing, reports no diagnostic, and exits 0. The rule stays at its
    shipped `suggestion` level, below `MinAlertLevel`, so this is number 1 reached through a typo.
    Measured against the correct spelling on the same file, which fired.
11. **A rule's own `scope:` selector does not exist.** An invalid selector is not an error.
    Measured: the same rule that fired under `text.comment.block.ts` reported nothing under
    `text.comment.documentation.ts`, with no diagnostic and exit 0. There is no documentation scope,
    and Vale does not say so. This is number 8's twin, reached through the rule file rather than
    through the section header.

<!-- reference-check: allow text.comment.documentation.ts -- a Vale scope selector that does not exist, named here as the measured example; not a path -->

**One more way is not a zero at all, and no rule catches it.** Moving evidence out of a rule strands the
words that pointed at it. "The split is clean" survived the table it described. "The bullet below"
survived the bullets. Each is grammatical, each passes every mechanical rule, and each now points at
nothing. Three appeared in one split.

**After removing a block, re-read the sentences that survived around it** and
check every "the", "that", "those" and "it" still has its referent. This is the one part of a lint pass a
tool cannot do for you.

## How a pass damages the file it cleans

A lint pass is an edit, and its defects are not random. Seven shapes came out of six files linted in
one session, each with an independent review. One shape appeared in three files and most appeared
once, so read the list as a catalogue rather than as frequencies. None is caught by a checker.

**1. What a split drops is disproportionately an obligation.** One pass produced four meaning
regressions and every one weakened a duty. Two of the four were a dropped consequence clause and a
measurement stripped of what its number answers. The other two were a "check that…" demoted to an assertion, and
an action that evidence licensed. Each looked like a plausible shortening.

The direction is not uniform, so do not screen for losses alone. The same rollout turned a plain
enumeration into "in this order", asserting a sequence nobody had argued. A split adds an obligation
as readily as it drops one.

**2. So diff the tokens, not your memory.** Take a full tokenize-and-frequency diff against the
pre-edit copy. **Diff the pair rather than the file** whenever the pass also moved content to a
sidecar. A file-only diff reads every moved sentence as a loss. Account for every non-zero
delta as a split, a move, a deliberate edit, or a defect.

A fixed word list is the fallback for a file too large to diff whole. Such a list must include
causal connectives — `because`, `since`, `so`. A lost causal link reads as two adjacent facts, and no
obligation word moves.

**3. That diff has one blind spot, and the check reads the defect as an improvement.** Splitting
`X and Y` into `X. Y.` turns a conjunct into a standalone claim, so the first sentence asserts a
sufficiency that was never true. Obligation words go **up**, not down, because the condition gained a
verb. Read every split of a sentence saying when something is finished, permitted or sufficient.

**4. Splitting a sentence also widens definitions.** Detaching a restrictive clause — a `because`, an
`only if` — leaves a definition covering cases it used to exclude. This shape appeared in three of
the six files, more than any other. The token diff cannot see it either, because the detached clause
survives as an adjacent sentence. Read every definition whose sentence you split.

**5. Check list structure, because `format:check` is green over a broken list.** Replacing a whole
line can dedent the continuations under it, which ends the list early and opens a fresh one at the
next numbered item. Prettier normalises the break as intentional, so the gate vouches for the break.
Count indented continuations and top-level list items before and after.

Counting `^ *1\. ` restarts is not enough on its own. A list that reopens at its next number leaves
that count unmoved, which is what the one measured break did.

**6. A reference is not restored until you confirm its anchor exists.** A token check verifies tokens,
not referents. A citation survives a pass that removes the label it points at, and the citation token
shows no delta at all. Note that `npm run reference-check` does not close this gap for doc prose. Its
citation matcher stops at a backtick, so the backticked form this repo writes never reaches it.

**7. A pass introduces findings as well as clearing them.** Splitting a sentence multiplies be-verb
sites, and two extra words push a bullet past `ProcedureLength`'s 20-word proxy. Compare residual
counts to a pre-edit baseline and name what the pass added, rather than reporting a self-inflicted
finding as a survivor.

**Measure the baseline before the first edit, on the pre-edit file, at an in-scope path.** A figure
recalled mid-pass has been wrong twice in this repo's history, both times reading low.

The incidents behind each of these are in `prose-linting.rationale.md`.

## Triaging a finding in a comment

Vale lints JSDoc blocks in `src/` and `scripts/`, and a finding there is **not** the same act as a
finding in an article. Four differences.

**1. The remedy is often placement, not prose.** In an article an over-long sentence gets split. In a
JSDoc it may mean the content does not belong in the interface at all. `doc-comments.md` rule 4 sends
implementation detail to `//`, and rule 7 sends overflow to a `<module>.md` sidecar.

**Splitting the sentence in place is the wrong fix that still clears the finding.** Ask which before
rewriting.

**2. `@example` fenced code is exempt automatically; `@param` and `@returns` prose is not.**

Measured:
a long sentence and a contraction inside a ` ```ts ` fence both go unflagged, because `ts = md` makes
Vale skip Markdown code fences. `@returns` is conventionally a noun phrase, so a `PassiveVoice`
finding there may want an exemption rather than a rewrite.

**3. A paragraph split costs hover height; a sentence split does not.** Splitting a sentence reflows
within the same rendered lines. Splitting a paragraph inserts a blank ` *` line, which spends one of
`doc-comments.md` rule 6's roughly fifteen. Markdown carries no such budget.

**4. Vale strips the comment markers before any rule sees the text.** `/**`, `*/` and every leading
`*` are gone, so a rule cannot tell `/**` from `/*`, and `scope: text.comment.block.<ext>` means
**multi-line**, not "documentation". Scope is also strictly per-extension: a `.ts` scope never reaches
a `.tsx` file.

**Who owns the rules.** `architect` alone authors or changes a rule in `vale-styles/JsDoc/`, the style
that lints JSDoc blocks in `src/` and `scripts/`. Every other role reads the output and reports
tensions to it, exactly as with `rules/*.yml`.

**The `STE` style is a different surface and is not `architect`'s alone.** That covers the module
sidecars too: no `JsDoc` rule reaches a `.md` file today, so a sidecar finding is an `STE` finding.

**Running the fixtures is one command, and it needs no `.vale/`:**

```bash
vale --config=vale-styles/fixtures/fixtures.vale.ini vale-styles/fixtures
```

Contract: the bad fixture reports at least one finding, of exactly its own rule and nothing else.
The good fixture reports nothing.

Check the silent half too. A good fixture is evidence only if it fires under the wrong rule. Loosen
the matcher in a scratch copy of the style, and confirm the fixture reports.

A near-miss that the shipped rule and the loosened one both ignore pins nothing. That is how one
fixture here shipped without pinning the anchor it named.

## What is scoped, and what is not

Vale runs over `.claude/agents/**/*.md`: every topic article, the house-rules articles, and the five
role files. It also runs over `CLAUDE.md`, and over `src/**/*.md`, the module sidecars beside the
source. Those three surfaces get the `STE` style.

**It runs over every `.ts` and `.tsx` file in the tree as well, under a different style.**
`[*.{ts,tsx}]` enables `JsDoc`, the tracked style in `vale-styles/JsDoc/`. Each of its rules carries
both block-comment scopes as a **list**, which Vale reads as OR. So it reaches block comments only,
in modules and components alike.

<!-- reference-check: allow text.comment.block.ts -- a Vale scope selector, not a path; the trailing
     segment is the extension the scope binds to -->

**A scope selector is strictly per extension, and that is the trap.** `text.comment.block.ts` never
reaches a `.tsx` file. A rule carrying only the `.ts` scope is handed every component and matches
nothing, which reports zero and reads exactly like a clean file. `[*.ts]` does not match a `.tsx` file
either — the suffix has to be named, hence the brace glob.

### Each rule declares its own extensions. That is per rule, never per style.

**Ruled by `architect` on 2026-09-10, and enforced again in the REVIEW pass that followed.** A blanket
"every rule carries both scopes" is the shape the ruling rejects. The question a new rule answers is
one question:

> Does this rule assume the block comment is an interface doc?

A rule that assumes it is a rule whose finding can **invert** on a comment that is not one. Vale's
scope cannot ask that question for you. `block` means multi-line, and no selector separates a JSDoc
hover from a JSX `{/* ... */}` block or a plain `/* ... */`. So the rule's author answers it, and
records the answer in the rule's own header.

**Carrying the premise is not on its own a reason to drop an extension.** The discriminator is
measured noise that no remedy can clear without moving correctly-placed prose. A premise-carrying rule
with no such finding keeps the extension, because the coverage then costs nothing. `MeasurementInDoc`
lost `.tsx` on three such findings and was never shipped. `ImplementationAltitude` carries the same
premise, measured zero, and keeps `.tsx`.

The four shipped rules, and the answer each one records:

| rule                     | `.ts` | `.tsx` | assumes a hover? | measured `.tsx` noise |
| ------------------------ | :---: | :----: | :--------------: | :-------------------- |
| `SelfReferentialOpener`  |   Y   |   Y    |        no        | 0                     |
| `DeadIndexical`          |   Y   |   Y    |        no        | 0                     |
| `ImplementationAltitude` |   Y   |   Y    |       yes        | 0                     |
| `BlockTagVocabulary`     |   Y   |   Y    |       yes        | 1, remediable         |

The design pass wrote that table under earlier names. `NoThisFunction` became
`SelfReferentialOpener`, `ThisSlice` became `DeadIndexical`, and `MeasurementInDoc` never shipped.
`BlockTagVocabulary` arrived after the ruling and was ruled separately, in the REVIEW pass.
`prose-linting.rationale.md` carries both cross-tabulations.

**A rule owes a fixture pair for every extension it claims**, `.bad.<ext>` and `.good.<ext>`. Nothing
checks this. The second pair is the narrower of the two. The first proves the rule discriminates. The
second proves the second scope is live at all. A rule claiming an extension with no pair there is
untested, and it fails silent.

**`.tsx` carries one comment shape `.ts` does not** — the JSX `{/* ... */}` block inside a component
body. It is in scope, and it is prose a reader writes loosely. It is also the shape a premise-carrying
rule inverts on. `BlockTagVocabulary` pins both halves of it, in the `.tsx` pair.

**Three sections exempt paths that only look like source**: `vale-styles/fixtures/*` (deliberate
bait), `.claude/worktrees/*` and `.stryker-tmp*/*` (other checkouts, which a bare `vale .` walks
into). They sit below `[*.{ts,tsx}]`, because sections stack and the later one takes the key. Vale has no
ignore mechanism other than a later section.

**Lint a module sidecar exactly like an article**, because whoever holds a call site reads it to act.
`migrate-architecture-depth` split that tier in two: `<module>.md` is in scope and
`<module>.rationale.md` is exempt, under the same last section that exempts an article's sidecar.

**The role files were out of scope until `lint-the-role-files`, and the reason is worth keeping.** Their
YAML front matter is parsed by a real YAML parser, and two `description:` scalars carried a literal `": "`
that reads as a nested mapping. That slice quoted those two scalars, which is the root-cause fix. The
value survives the parse byte-for-byte, and `agent-doc-check`'s line-anchored reader still finds it on the
`description:` line.

**One unparseable file silences every other file in the same invocation**, so those two were not merely
unlinted — they were suppressing the whole run. **A new role file with an unquoted `": "` in its front
matter would do it again.** The symptom is a confident zero rather than an error you notice. Quote any
front-matter scalar that contains a colon followed by a space.

**Quote it the way Prettier will leave it, which here means single quotes.** This repo sets
`singleQuote: true`. Measured: Prettier normalises a YAML scalar to **single** quotes, in both
standalone YAML and Markdown front matter. The earlier advice in this article said the opposite.

A scalar containing an apostrophe is the exception and keeps double quotes. That is why
`architect.md` has one.

**A `tokens:` entry in a rule file is single-quoted for a second, unrelated reason.** A YAML
double-quoted scalar processes `\b` as a backspace escape, so `"\bword\b"` is not the regex it looks
like. Prettier leaves a double-quoted scalar containing a backslash alone, so nothing catches it.

**`*.rationale.md` sidecars are exempt from every rule.** The last section of `.vale.ini` sets
`BasedOnStyles` to an empty value for them. Sidecars hold the dated-record register, which several of
these rules fight; see `doc-comments.rationale.md` for what that register looks like.

**An empty `BasedOnStyles` is not enough on its own, and this failed silently once.** An explicit
`STE.Rule = warning` in any earlier section that also matches **activates that rule by itself**, and it
survives into the sidecar section. `BasedOnStyles` replaces the style list, not the per-rule keys. So the sidecar section
must also switch each enabled rule off by name. Without that it leaks, and it leaks in
the direction that looks fine: the sidecars get linted and nothing says so.

**Write the exemption as an empty `BasedOnStyles`, never as `= Vale`.** The `Vale` style is not "no
style" — it enables the built-in rules, whose `Vale.Spelling` and `Vale.Repetition` fire at **error**
severity on exactly the technical prose a sidecar holds.

**Whenever you enable a rule, switch it off in the sidecar section in the same edit.** That pairing is
the whole exemption, and nothing checks it. The test is one command: `vale` on any `*.rationale.md` must
report zero.

**Enabling a rule is a seven-place edit, and glob overlap is the reason.** `.vale.ini` carries the
six-rule enable block three times: the agent-docs glob, `[CLAUDE.md]`, and `[src/**/*.md]`. No
section's per-rule key reaches a file that section's own glob does not match, so each of the three
needs its own copy.

Four later sections overlap those globs, and a key does carry into a later matching section. They
are the `*.rationale.md` exemption, plus the three that keep bait and other checkouts out of a
`vale .` walk. Each switches the rule off once by name, so a seventh `STE` rule goes in all seven
places.

**A `JsDoc` rule is a four-place edit** on the same reasoning: `[*.{ts,tsx}]` enables it, and the
three exemption sections below that one switch it off by name. `[**/*.rationale.md]` is not one of
them, because `[*.{ts,tsx}]` cannot match a `.md` file. **Nothing checks either count.**

<!-- reference-check: allow docs/sub/nested.md -- Vale's own documentation example for glob behaviour, quoted verbatim; not a path in this repo -->

**Vale's `*` crosses `/`.** Its own documentation gives `docs/*.md` matching `docs/sub/nested.md`. That
is ast-grep's behaviour, not `globSync`'s — the asymmetry CLAUDE.md documents under
`ast-grep-rule-check`. A glob written on the `globSync` intuition **fails open**: it silently lints
files nobody scoped it to.

So `.claude/agents/*.md` and `.claude/agents/**/*.md` reach the same files. `.vale.ini` writes the `**`
form deliberately, because it reads correctly to someone carrying that narrower intuition.

## The six enabled rules, and what to do with each

Three apply mechanically. Three are prompts to look. Know which you are holding.

| rule                  | treat it as | act on a finding?                       |
| --------------------- | ----------- | --------------------------------------- |
| `STE.SentenceLength`  | mechanical  | yes — split the sentence                |
| `STE.ParagraphLength` | mechanical  | yes — split the paragraph               |
| `STE.Contractions`    | mechanical  | yes, unless the text **names** the word |
| `STE.ProcedureLength` | a prompt    | only if the list item is a **step**     |
| `STE.OneInstruction`  | a prompt    | only if it chains two **actions**       |
| `STE.PassiveVoice`    | a prompt    | only if a **rule** hides its actor      |

**What puts a rule in one column or the other is whether its trigger _is_ the defect.** A sentence over
25 words is exactly the thing `SentenceLength` claims to find, and a contraction is exactly what
`Contractions` matches. The three prompts all fire on a **proxy**. A list item is not a procedure. A
`, then` is not always two actions. A be-verb plus a participle is not always a rule hiding its actor.

Counting is not what separates the columns. `ProcedureLength` counts too, and is still a prompt, because
the unit it counts is a stand-in.

**"Mechanical" means no judgement per finding. It does not mean sweepable in one pass.** Two of the three
interact, so a batch application still needs the order and the re-run described below.

### Triage the prompts one at a time. A sweep cannot clear them.

**Bulk reading is not triage, and the finding count cannot tell you which you did.** A sweep clears the
three mechanical rules. It cannot clear the three prompts, because each needs a judgement per finding.
Both look identical afterwards: a number.

So when you report a file as linted, say which half you did. "Zero on the mechanical rules" is a
different claim from "I read every finding".

**Read each prompt finding against its own exempt classes below, and record the disposition.** Name the
count in each class and name any finding you left in as arguable. A residual you cannot place is not
exempt by default.

**The prompt rules are not noise, and this is measured rather than reassuring.** `ast-grep-rules.md`
passed the mechanical bar, then a finding-by-finding pass over its 16 prompt findings turned up **two
real defects**. Both had survived a bulk read of the same list one slice earlier.

### `STE.SentenceLength` — act on every finding

25-word cap on a sentence. Split it. This is the one rule here a sweep can follow without judgement.

### `STE.Contractions` — act on every finding the text uses rather than names

Expand it. At the head of an instruction, "Do not" also carries more weight than "Don't". So this rule
tends to improve a heading rather than merely conform it.

**One exempt class, and it is the use/mention distinction: a contraction that is quoted or discussed
rather than used.** A contraction inside quoted prose belongs to the file you are quoting, and expanding
it misquotes that file. A contraction named as an example — "'Do not' carries more weight than 'Don't'"
— is the subject of the sentence, not its voice.

**Quotation marks are not the test, and reading them as the test is how this class gets over-applied.**
A contraction inside invented internal speech is a use, so expand it. Ask whether the sentence quotes
another file or names the word itself. Nothing else earns the exemption.

This article is the live example. Its `Contractions` findings stand unfixed on purpose: **some naming
the word itself, some demonstrating the possessive false positive below.** It also carries
`OneInstruction` findings for the same reason. The sentence ordering the two length rules is
false-positive class 1: a specified order, not two actions.

**A quotation is exempt only while it stays faithful, and this file lost its own live instance to that.**
The concurrency prohibition quoted under `OneInstruction` below once quoted `engineering.md`'s
`Don't run …`. `split-engineering-article` then linted that file, so the quotation below now matches
the linted wording. Re-read a quoted contraction whenever a slice works the file it quotes.

**An article about a rule will trip that rule, and this holds for every rule here rather than for this one
alone.** A guidance article quotes the defect it governs, so its findings are dominated by mentions rather
than uses. Every prompt finding on this file triages as exempt, most of them the article quoting its own
examples. The dated count and its per-class breakdown are in `prose-linting.rationale.md`.
**Expect that shape when you lint guidance prose, and do not read a high count as a dirty file.**

**A second exempt class, and it is a rule false positive rather than a judgement.** A **bare**
possessive fires only when punctuation follows it, because the rule's possessive token ends `(?!\s)`.
So "the cleaner's, architect's, and hardener's gates" yields two findings from three possessives.
Nothing is wrong with the prose; the comma is doing it.

**Backticking the noun suppresses the finding too, and that is a second, independent mechanism.**
Measured on vale 3.20.0 over six probe sentences. A possessive on a backticked noun fired in none of
them, before a comma, a period or a space. A bare one fired before the comma and the period alone.
Reading the rule's own regex cannot tell you this, because the regex never sees what the Markdown
scoper removed first. The account of a refutation that made exactly that error is in
`prose-linting.rationale.md`.

**Never put `that's` through a mechanical sweep.** It expands to _that is_ or _that has_ by context,
and only the sentence tells you which. An automated sweep wrote "that is already been done" into a
role file. In another file four of five instances were _that is_ and the fifth was _that has_, which
is exactly why a sweep looks safe. Expand this one by hand and read each site.

### `STE.ParagraphLength` — act on every finding

Six sentences per paragraph. Split it. Purely structural — it counts sentence terminators and consults
no part-of-speech tagger.

### `STE.ProcedureLength` — act only on genuine steps

20-word cap, applied to list items. **The rule's own header concedes that Vale cannot tell procedural
from descriptive text.** It uses list items as a proxy, and over-counts a multi-sentence item.

Ask of each finding: **is this bullet a step, or a statement?**

- **A step** — a numbered procedure, an ordered instruction. Act: state one instruction per item and
  move the reasoning to prose below the list.
- **A statement** — a definition, a ruling, a hazard, a role's disposition. Leave it. Forcing a ruling
  under 20 words drops the qualifiers that carry it, which is worse prose bought with a cleaner number.

**On a rules article the answer is usually "statement" for every finding at once, and knowing that in
advance is worth a lot.** This repo writes a rule as a bullet carrying its own reason, so the rule fires
on the house style rather than on a defect. Measured on `engineering.md`: **56 findings, 56 statements,
none acted on** — rule-with-rationale bullets, the four test-layer definitions, the per-role command
substitutions, and the standing verification obligations. **Classify the article's bullet convention first.** If it uses
bullets for rules rather than for procedures, say so once and record the count. Do not reach the same
verdict 56 times.

**A role file is where this rule and landed practice disagree, and the disagreement is open.** Five
role files were linted. Two of them left genuine steps unacted on purpose, because the remedy
separates a step's reasoning from the step it qualifies. Record the classification and the count in
your commit if you do the same. Do not settle the tension inside one file: the ruling belongs at
article level, and a silent unilateral divergence is the worst option.

### `STE.OneInstruction` — act only on genuine chains

Fires on `and then`, `, then`, `after that/which`, `while …ing`, `at the same time`, in list items.

Three false-positive classes, and the second is dangerous rather than noisy:

1. **A specified order, not two actions.** "Write JSDoc, then `// prettier-ignore`, then the
   declaration" is one instruction whose content **is** the ordering. Splitting it destroys the rule.
   Where it fires like this, reach for the other rule — state the sequence as a numbered list.
2. **A prohibition on concurrency.** "Do not run `npm run test:mutation` and `npx playwright test` at the
   same time" trips the token, and this rule's advice would turn one prohibition into two instructions,
   **inverting it**. Following the tool here is worse than ignoring it.
3. **Descriptive prose in a bullet.** The rule's scope is list items, not instructions, so a `while
…ing` gerund describing how something works is flagged though it instructs nobody.

### `STE.PassiveVoice` — act only when a rule hides its actor

The noisiest rule enabled. **The test: if the sentence tells a reader what to do, say who does it. If it
tells them how something behaves, leave it.**

**Act on this class:** a rule or instruction written passively, where naming the actor makes it
actionable. "The between-position is sanctioned" becomes "Use the between-position freely."

**One construction accounts for every act-on finding so far, and it is greppable.** A permission stated
as `is sanctioned`, `is permitted` or `is allowed` names no one who may act. Rewrite it as `you may …`.
Three instances have been found this way, in three different articles. Search for the phrase before
reading the findings one by one:

```bash
grep -rn "is sanctioned\|is permitted\|is allowed" .claude/agents/articles/
```

That grep is a shortcut into the act-on class, not a replacement for the pass. It finds the construction
already seen; the pass is what finds the next one.

**Five exempt classes — do not "fix" these:**

1. **A dated past-tense record.** "Four `@see` forms were measured and rejected."
   `engineering.md`'s claim discipline **requires** this construction as the escape hatch that stops a
   claim rotting, and the actor sits in the sidecar by design. The house rule wins.
2. **Descriptive prose where the actor is irrelevant.** "How it is computed." STE only _prefers_ active
   in descriptive text; it _requires_ it in procedures. This class is not a defect by the standard's own
   terms.
3. **A predicate adjective the tagger read as a past participle.** "The between form is broken."
4. **A passive that already names its agent.** "Staleness is not bounded _by your own session's edits_"
   is reported with the message "name the agent", which the sentence does.
5. **A deliberate aphorism, usually a heading.** "Writing is verified by reading."

**A residual that fits none of the five is not automatically exempt.** Four such cases were left in
`doc-comments.md` deliberately, as genuinely arguable. If you hit one, either act on it or say in the
commit why you did not — do not widen a class to cover it.

**A verbatim quotation creates a finding that belongs to another file, and it is easy to create one by
accident.** Splitting a long sentence
can isolate a quoted section title, or a quoted line from another file. The matcher then reads it as
your own prose. Check whether a new `PassiveVoice` finding sits inside quotation marks before triaging
it as yours.

## `SentenceLength` and `ParagraphLength` trade against each other

Both are mechanical, so the article tells you to act on every finding of either. Acting on one can create
the other, and the trade runs in a predictable direction:

- **Splitting a sentence adds a sentence to its paragraph**, which can push the paragraph past six.
- **Merging sentences to clear a paragraph re-creates the long sentence** you just split.

**Resolve it by splitting the paragraph, never by rejoining the sentences.** The paragraph break is
almost always the better edit anyway. A paragraph that has grown past six sentences is usually two
paragraphs that were never separated. Rejoining sentences trades a real improvement for a formatting
number.

**So there is an order.** Settle `SentenceLength` first, then `ParagraphLength`, and treat a paragraph
break or moving content out as the only legal moves for the second. Moving content out is the section
below.

**And re-run after acting.** One pass is not enough, because a fix can create a finding the same pass
already scanned past.

This is not hypothetical. It happened while writing this very section: a 35-word sentence was split into
short ones, and the paragraph came back at seven.

## Acting on a finding removes content. Decide where it goes.

Every mechanical rule here is satisfied by making prose shorter, and shorter prose is reached by moving
something out. **Name its destination before you cut.** There are three, and only one of them is a
deletion:

- **A rule, a caveat, a closed decision** — stays in the article. It constrains an action, which is the
  test CLAUDE.md's routing branch 5 states.
- **An illustration, a measurement, a probe method, a worked example** — goes to the article's
  `.rationale.md` sidecar. It is evidence, and evidence has a home.
- **A restatement of something said better nearby** — delete it. This is the only legitimate deletion,
  and it is rarer than it feels mid-edit.

**This is written down because it went wrong, measurably.** Six shortening passes over
`doc-comments.md` dropped fifteen illustrations and pointers **out of the pair entirely**, rather than
moving them to the sidecar. Among them: React's `useState` as the model for the sidecar tier, what
`documentSymbol` actually returns, and the signature behind an identity guarantee. No rule was lost. The
examples that made the rules legible were. `doc-comments.rationale.md` records them, five under a heading of their own and four folded back into
the sections they belong to.

**Nothing catches this.** `reference-check` and `agent-doc-check` both stay green, because every
filename still resolves — what changed is that prose went missing, and no checker reads for absence. So
audit the pair by hand after a shortening pass, comparing against the article as it stood before.

## Read a big number as unworked, not as broken

Measured 2026-09-09, after `lint-the-role-files` widened the scope: `vale .claude/agents/` reports over a
thousand findings, and most of those files have never been worked. A file is worked when a slice edits it
and runs mandate 6; every other one carries its findings untriaged.

**The role files are the whole of the newly-scoped surface, and none of them has been worked.** Expect
their share of that total to be large, and to mean nothing until a slice touches each one.

So a large count over the whole directory says nothing about the corpus and nothing about the rules. It
says twelve articles have not been read yet. **Lint the file you are editing**, not the directory,
until a rollout has been through the rest.

## The six rules that are off

All twelve rules in the style have been tried or ruled on. Six are off, and each has a reason in
`prose-linting.rationale.md` rather than an omission:

| rule           | why it is off                                                                    |
| -------------- | -------------------------------------------------------------------------------- |
| `Dictionary`   | not ASD's approved-word list; it substitutes plain-language advice               |
| `Modals`       | blind-swaps may/should/might and would flatten this repo's obligation vocabulary |
| `Ambiguity`    | its slash token flags compound technical terms and a GitHub org path             |
| `NounClusters` | fails to fire on the example in its own header while flagging non-clusters       |
| `Articles`     | its verb list is aerospace-specific; every finding here was the JavaScript `Set` |
| `Gerunds`      | ~941 corpus-wide, almost all idiomatic prepositional gerunds                     |

**Three of the six were rejected because a part-of-speech tagger drove them.** `NounClusters`,
`Gerunds` and `Articles` all depend on tagging, and two of those rules say so in their own headers:
imperative-heavy technical prose is outside the tagger's training data. Treat a POS-driven rule as
guilty until measured on this corpus.

## Enabling, disabling or re-levelling a rule

**Disable by name, never by omission.** Every rule the style ships is listed in `.vale.ini` with an
explicit value. Adding a rule to the package is then a deliberate edit here, not a silent change in what
gates.

**A rule earns its place by a measured precision count on a real file, not by sounding useful.** Record
the count and the date in `prose-linting.rationale.md`. Three rules have been rejected on measurement;
one of them, `STE.Modals`, would have done real damage.

**Never enable `STE.Dictionary`.** It is not ASD-STE100's approved-word list, which is copyrighted and
which no open tool ships. It substitutes plain-language advice, which fights this corpus's necessary
jargon.

**Do not tune a rule until it stops producing arguable findings.** A rule with no arguable cases has
been tuned until it agrees with its author, which makes it a mirror rather than a check.
