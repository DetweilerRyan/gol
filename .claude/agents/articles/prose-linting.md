# Article: Prose Linting — running Vale over the agent docs, and what to do with a finding

**Audience:** any role or session that edits `.claude/agents/articles/**`

**Read when:**

- before acting on a Vale finding, so you know which ones to act on
- before enabling, disabling or re-levelling a rule in `.vale.ini`
- when a Vale run reports zero and you want to know whether that is real

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

## Vale is report-only here

Nothing gates on Vale's exit code, and `engineering.md`'s convention for a report-only checker applies:
read the output, not `$?`.

**The exit code is not a findings count.** It is 1 when a rule matched, and 1 when a file failed to
parse. So `$?` alone cannot tell "linted, found things" from "never linted anything".

## Three ways a run reports a confident zero

Check each before you believe one.

1. **The rule's level is below `MinAlertLevel`.** `MinAlertLevel` is `warning`. A rule shipped at
   `suggestion` reports nothing at all until you re-level it in `.vale.ini`. `STE.ProcedureLength` is
   the live example: it ships at `suggestion` and is re-levelled here to `warning`.
2. **A file failed to parse and aborted the run.** Vale parses YAML front matter with a real YAML
   parser, and one unparseable file aborts the whole invocation rather than skipping that file.
3. **Vale is not installed.** See Setup.

## What is scoped, and what is not

Vale runs over `.claude/agents/articles/**/*.md` only.

**It is deliberately not pointed at `.claude/agents/*.md`.** The role files carry YAML front matter, and
`architect.md` and `coder.md` both fail Vale's parser — a literal `": "` in their `description:` reads
as a nested mapping. Because one unparseable file aborts the whole run, widening this glob makes Vale
report nothing at all. Do not widen it without solving that first.

**`*.rationale.md` sidecars are exempt from every rule.** The last section of `.vale.ini` sets
`BasedOnStyles` to an empty value for them. Sidecars hold the dated-record register, which several of
these rules fight; see `doc-comments.rationale.md` for what that register looks like.

**An empty `BasedOnStyles` is not enough on its own, and this failed silently once.** An explicit
`STE.Rule = warning` in the section above **activates that rule by itself**, and it survives into the
sidecar section. `BasedOnStyles` replaces the style list, not the per-rule keys. So the sidecar section
must also switch each enabled rule off by name. Without that it leaks, and it leaks in
the direction that looks fine: the sidecars get linted and nothing says so.

**Write the exemption as an empty `BasedOnStyles`, never as `= Vale`.** The `Vale` style is not "no
style" — it enables the built-in rules, whose `Vale.Spelling` and `Vale.Repetition` fire at **error**
severity on exactly the technical prose a sidecar holds.

**Whenever you enable a rule, switch it off in the sidecar section in the same edit.** That pairing is
the whole exemption, and nothing checks it. The test is one command: `vale` on any `*.rationale.md` must
report zero.

**Vale's `*` crosses `/`.** Its own documentation gives `docs/*.md` matching `docs/sub/nested.md`. That
is ast-grep's behaviour, not `globSync`'s — the asymmetry CLAUDE.md documents under
`ast-grep-rule-check`. A glob written on the `globSync` intuition **fails open**: it silently lints
files nobody scoped it to.

## The four enabled rules, and what to do with each

Two of these apply mechanically. Two are prompts to look. Know which you are holding.

| rule                  | treat it as | act on a finding?                       |
| --------------------- | ----------- | --------------------------------------- |
| `STE.SentenceLength`  | mechanical  | yes — split the sentence                |
| `STE.Contractions`    | mechanical  | yes, unless the text is a **quotation** |
| `STE.ProcedureLength` | a prompt    | only if the list item is a **step**     |
| `STE.OneInstruction`  | a prompt    | only if it chains two **actions**       |
| `STE.PassiveVoice`    | a prompt    | only if a **rule** hides its actor      |

### `STE.SentenceLength` — act on every finding

25-word cap on a sentence. Split it. This is the one rule here a sweep can follow without judgement.

### `STE.Contractions` — act on every finding except a quotation

Expand it. "Do not" also carries more weight than "Don't" at the head of an instruction, so this rule
tends to improve a heading rather than merely conform it.

**One exempt class, and it is the use/mention distinction: a contraction that is quoted or discussed
rather than used.** A contraction inside quoted prose belongs to the file you are quoting, and expanding
it misquotes that file. A contraction named as an example — "'Do not' carries more weight than 'Don't'"
— is the subject of the sentence, not its voice.

This article is the live example, and carries three such findings that stand unfixed on purpose: two
quoting `engineering.md`, one naming the word itself. **An article about a rule will trip that rule**, so
expect this wherever prose-linting guidance discusses the token it governs.

### `STE.ProcedureLength` — act only on genuine steps

20-word cap, applied to list items. **The rule's own header concedes that Vale cannot tell procedural
from descriptive text.** It uses list items as a proxy, and over-counts a multi-sentence item.

Ask of each finding: **is this bullet a step, or a statement?**

- **A step** — a numbered procedure, an ordered instruction. Act: state one instruction per item and
  move the reasoning to prose below the list.
- **A statement** — a definition, a ruling, a hazard, a role's disposition. Leave it. Forcing a ruling
  under 20 words drops the qualifiers that carry it, which is worse prose bought with a cleaner number.

### `STE.OneInstruction` — act only on genuine chains

Fires on `and then`, `, then`, `after that/which`, `while …ing`, `at the same time`, in list items.

Three false-positive classes, and the second is dangerous rather than noisy:

1. **A specified order, not two actions.** "Write JSDoc, then `// prettier-ignore`, then the
   declaration" is one instruction whose content **is** the ordering. Splitting it destroys the rule.
   Where it fires like this, reach for the other rule — state the sequence as a numbered list.
2. **A prohibition on concurrency.** "Don't run `test:mutation` and `npx playwright test` at the same
   time" trips the token, and this rule's advice would turn one prohibition into two instructions,
   **inverting it**. Following the tool here is worse than ignoring it.
3. **Descriptive prose in a bullet.** The rule's scope is list items, not instructions, so a `while
…ing` gerund describing how something works is flagged though it instructs nobody.

### `STE.PassiveVoice` — act only when a rule hides its actor

The noisiest rule enabled. **The test: if the sentence tells a reader what to do, say who does it. If it
tells them how something behaves, leave it.**

**Act on this class:** a rule or instruction written passively, where naming the actor makes it
actionable. "The between-position is sanctioned" becomes "Use the between-position freely."

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
