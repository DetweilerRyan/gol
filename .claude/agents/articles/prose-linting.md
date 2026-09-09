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

## The six enabled rules, and what to do with each

Three apply mechanically. Three are prompts to look. Know which you are holding.

| rule                  | treat it as | act on a finding?                           |
| --------------------- | ----------- | ------------------------------------------- |
| `STE.SentenceLength`  | mechanical  | yes — split the sentence                    |
| `STE.ParagraphLength` | mechanical  | yes — split the paragraph                   |
| `STE.Contractions`    | mechanical  | yes, unless the text is **quoted or named** |
| `STE.ProcedureLength` | a prompt    | only if the list item is a **step**         |
| `STE.OneInstruction`  | a prompt    | only if it chains two **actions**           |
| `STE.PassiveVoice`    | a prompt    | only if a **rule** hides its actor          |

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

### `STE.Contractions` — act on every finding except a quotation

Expand it. At the head of an instruction, "Do not" also carries more weight than "Don't". So this rule
tends to improve a heading rather than merely conform it.

**One exempt class, and it is the use/mention distinction: a contraction that is quoted or discussed
rather than used.** A contraction inside quoted prose belongs to the file you are quoting, and expanding
it misquotes that file. A contraction named as an example — "'Do not' carries more weight than 'Don't'"
— is the subject of the sentence, not its voice.

This article is the live example, and carries three such findings that stand unfixed on purpose: **two
naming the word itself, one quoting `engineering.md`.** It also carries one `OneInstruction` finding for
the same reason. The sentence ordering the two length rules is false-positive class 1: a specified order,
not two actions.

**An article about a rule will trip that rule, and this holds for every rule here rather than for this one
alone.** A guidance article quotes the defect it governs, so its findings are dominated by mentions rather
than uses. Measured on this file: 46 prompt findings, every one exempt, and most of them the article
quoting its own examples. **Expect that shape when you lint guidance prose, and do not read a high count as
a dirty file.**

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

### `STE.OneInstruction` — act only on genuine chains

Fires on `and then`, `, then`, `after that/which`, `while …ing`, `at the same time`, in list items.

Three false-positive classes, and the second is dangerous rather than noisy:

1. **A specified order, not two actions.** "Write JSDoc, then `// prettier-ignore`, then the
   declaration" is one instruction whose content **is** the ordering. Splitting it destroys the rule.
   Where it fires like this, reach for the other rule — state the sequence as a numbered list.
2. **A prohibition on concurrency.** "Don't run `npm run test:mutation` and `npx playwright test` at the same
   time" trips the token, and this rule's advice would turn one prohibition into two instructions,
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

Measured 2026-09-08: `vale .claude/agents/articles/` reports roughly 1,700 findings across 16 files, and
**only two of those files have been worked** — `doc-comments.md` and this one. Every other article
carries its findings untriaged.

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
