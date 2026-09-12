---
name: mechanise-prose-soundness-with-a-style-package
title: Survey Std, Google and Microsoft style packages, and mechanise what prose currently only asks for
created: 2026-09-10
---

## Situation

`prose.md` and `doc-comments.md` state a large number of rules about how agent-facing prose
is written. Six Vale rules enforce a fraction of them. Everything else relies on an agent reading the
instruction and following it.

That is the gap this candidate is about. **A rule written in prose is enforced by whoever remembers
it. A rule in a style package is enforced by a command.** The repo already applies that reasoning to
architecture, where `ast-grep` rules exist precisely because "prose someone has to remember is not a
substitute". Prose itself is the one surface where the argument has not been applied to its own
rules.

Three published rule sets are candidates for the mechanical half: Vale's own `Std`, and the `Google`
and `Microsoft` style packages in the same registry.

## The question changed on 2026-09-12: soundness before adoption

**Directed by the user**, before any rule is applied in bulk: be confident the rules we have are
solid. That reorders this entry. Surveying `Std`, `Google` and `Microsoft` adds rules; **this entry
now begins by auditing the rules already enabled.**

### What the corpus actually reports

Measured 2026-09-12 over 435 tracked files.

| Rule                              | Findings | Class                   |
| --------------------------------- | -------- | ----------------------- |
| `STE.PassiveVoice`                | 490      | prompt, needs judgement |
| `STE.ProcedureLength`             | 367      | prompt, needs judgement |
| `Instruction.ParagraphSentences`  | 270      | ours                    |
| `Instruction.HistoricalNarration` | 254      | ours                    |
| `Instruction.ListItemSentences`   | 155      | ours                    |
| `STE.SentenceLength`              | 64       | mechanical              |
| `STE.Contractions`                | 34       | mechanical              |
| `STE.OneInstruction`              | 11       | prompt                  |
| `STE.ParagraphLength`             | 2        | mechanical              |
| `JsDoc.*` (three rules)           | 7        | ours                    |

**Two `STE` rules are 88 percent of the `STE` total, and both need judgement.** So the corpus is
dominated by findings nobody can act on mechanically. Any mass application runs into that first.

**Our own three `Instruction` rules report 679 across the corpus.** The `.vale.ini` opt-out currently
scopes them to the five role files and `architect/`, where they report zero — so that zero is a
statement about scope, not about the rules.

### The finding that matters: a rule's precision does not travel

`Instruction.HistoricalNarration` was measured at **8 of 8** on `hardener.md` when it was written. On
`src/`, a surface it was never tuned against, three sampled hits gave **one true positive and two
false**:

- `// That sentence used to cite ~180-200ms at min zoom` — narration. **True positive.**
- `// screenToWorld (used to resolve taps and hover back to a world cell)` — "used to" meaning
  _employed to_. **False positive**, and a different sense of the phrase entirely.
- `// the iterator is no longer stable` — a live invariant about runtime state. **False positive**,
  the same arguable class the rule's own header documents.

**A rule verified on one surface is verified for that surface.** Every precision figure this repo
holds was taken where the rule was authored, and `.claude/agents/articles/claim-discipline.md` already
states the general form: the scope of a claim is the scope of the command that produced it. The rules
were measured honestly and then read wider than the measurement.

### The overlap measured, 2026-09-12 — and the two rules answer differently

**The user asked to explore moving duplicate rules from `STE` to `Std`, excluding `Contractions`.**
`Std` was synced into a scratch tree and both pairs measured over the same 435 files. These counts are
**unexempted** — the probe config carries none of `.vale.ini`'s section exemptions — so they compare to
each other, not to `npm run prose-lint`'s output.

`Std` ships 14 rules and exactly three overlap the enabled six: `Grammar/Contractions` (excluded by
the user, and it inverts the house rule), `Grammar/PassiveVoice`, and `Readability/SentenceLength`.

**`SentenceLength` — `Std` is a strict superset, and the case for moving is strong.**

|                 | Findings |
| --------------- | -------- |
| Flagged by both | 1,118    |
| `STE` only      | **2**    |
| `Std` only      | 149      |

Both cap at **25 words**, so the gap is not policy — it is sentence segmentation. `Std` finds 149
sentences `STE`'s segmenter does not end where `Std` does. Two `STE`-only findings is close enough to
zero that moving loses almost nothing, and the question becomes whether those 149 are real.

**`PassiveVoice` — the two disagree in both directions, and moving is not indicated.**

|                 | Findings  |
| --------------- | --------- |
| Flagged by both | 1,576     |
| `STE` only      | **367**   |
| `Std` only      | **1,348** |

They use different mechanisms rather than different thresholds. `STE` is `extends: sequence` over a
part-of-speech tag (`VBN`), so it asks a tagger whether the word is a past participle. `Std` is
`extends: existence` over a hardcoded list plus `[\w]+ed`, so it matches any `-ed` word after a
be-verb.

Three sampled `Std`-only hits are all **adjectives, not passives**: "if that **is impractical**", "the
block-tag table **is closed**", "**is owned** by `product`". That is the failure mode a hardcoded
`-ed` list has and a tagger does not.

**So the honest answer to the user's question is per rule, not per package.** `SentenceLength` is a
candidate for moving. `PassiveVoice` is not, and the reason is a real quality difference rather than
inertia — which is the opposite of the conclusion "they duplicate, so consolidate" would have reached.

**The 149 were sampled on 2026-09-12, and the answer is neither of the two expected.**

They are not segmentation artifacts and they are not sentences `STE` misses. **Every one is 26 to 29
words against a cap of 25** — 100 at exactly 26, 33 at 27, 12 at 28, 2 at 29. Not one is far over.

The cause is the **tokenizer**, not the segmenter. `STE` counts `[\w''’-]+`, so a hyphen and an
apostrophe sit inside a word. `Std` counts `\b(\w+)\b`, so `call-site` is two tokens and `child's` is
two. Confirmed rather than inferred: **104 of the 149 contain a hyphenated word or a possessive.**

So the two rules apply the same 25-word policy to a different count of the same sentence, and every
disagreement is a sentence within four words of the line. **Neither is wrong; they answer different
questions.** `STE` asks how many words a reader parses. `Std` asks how many `\w+` runs there are.

**That makes the move a judgement about this corpus rather than about rule quality**, and this corpus
is unusually hyphen-dense: `call-site`, `report-only`, `fail-open`, `changed-files`, `role-file`.
Compound modifiers are how its prose names its own concepts. Counting each as two words measures
something that is not sentence difficulty here.

**Recommendation: do not move `SentenceLength` either.** The entry opened expecting `Std` to be a
strict improvement on this pair and the measurement does not support it. What `Std` buys is 149
findings on sentences a reader would call 26 words and `STE` calls 25, on a corpus whose vocabulary is
built from compounds.

**One alternative explanation was raised and refuted, and it is worth keeping because it would have
inverted the recommendation.** The user asked whether the corpus is hyphen-dense _because_ hyphenating
was an easy way to shorten sentences past `STE.SentenceLength` — the rule manufacturing the compounds
it then under-counts. If true, `STE`'s tokenizer would be rewarding an evasion and `Std`'s would be
the honest count.

Measured 2026-09-12 against the commit before Vale landed (`01d9ac0`, 2026-09-08), as compound hyphens
per 1,000 words:

| File                | Pre-Vale | Today |
| ------------------- | -------- | ----- |
| `CLAUDE.md`         | 47.4     | 46.1  |
| `engineering.md`    | 38.0     | 32.0  |
| `testing-layers.md` | 64.7     | 46.0  |
| `architecture.md`   | 46.3     | 42.6  |

**Density is flat or down in all four, never up.** And `CLAUDE.md` was densest at its birth — 59.8 on
2026-08-18, three weeks before Vale existed — falling to 47.4 by the time the rule was enabled and
46.1 today. `src/`'s comments and code sit at 26.7 for scale.

So the compounds predate the rule and have declined under it. The style is how this repo names its
concepts, not an artifact of gaming a word count.

### The forcing-function question, asked 2026-09-12, and the honest answer is split

**The user's question is not whether `Std` counts correctly. It is whether adopting it would force
prose that is necessary and sufficient** — for humans and agents both. A rule that is technically
wrong about word counts can still be right about outcomes, and that has to be answered on its own
evidence.

**What the compounds are, measured.** 1,384 distinct compounds across `.claude/**` and `CLAUDE.md`.
Only 41 are literal filename stems, so "they are all identifiers" is false. But the most-used ones are
overwhelmingly names the repo cannot shorten — `ast-grep` 136, `acceptance-mutation` 93,
`reference-check` 76, `doc-comments` 57 — and the non-identifier tail is domain vocabulary rather than
padding: `acceptance-spike`, `framework-free`, `hand-written`, `fail-open`.

**So the rule would fall unevenly.** A sentence naming three commands pays three extra words for
nothing a rewrite can recover. A sentence joining two clauses pays for something a rewrite can.

**Of the 149, 53 contain a splittable clause boundary** — `, and`, `, but`, `, so`, `, which`,
`, rather than`. Those are the ones where the rule would do the work the user is asking about. Two
read in full:

> Do not reach for `extends:`. A child's key replaces the parent's rather than merging, **and** a
> parent that is not on the search path aborts the whole run at E201.

That is two independent traps in one sentence, and splitting it is a real improvement — a reader
scanning for the second trap currently has to finish the first.

**The other 96 have no such boundary.** They are single clauses that happen to name two or three
hyphenated things. Splitting them means inventing a break, and the likely outcome is worse prose, not
shorter prose.

**So the answer is: it would force better prose in roughly a third of the cases it flags, and
arbitrary edits in the rest.** That ratio is the finding, and it is what a decision should rest on
rather than on whether `\b(\w+)\b` is the right tokenizer.

**A cheaper instrument gets the same benefit without the noise.** The 53 splittable sentences are
findable directly — a rule matching a clause boundary inside an over-long sentence is more precise
than a rule matching every sentence of 26 words. That is a bespoke rule this repo could author, in the
`Instruction` style, and it targets the forcing function the user actually wants rather than
approximating it with a word count. **File it as the successor question if the split ratio holds on a
second sample.**

**The residual question is worth one line rather than a slice.** If `STE`'s tokenizer is the right one,
`STE`'s own cap of 25 may be slightly generous for this corpus — but that is a threshold question about
a rule we already have, not an adoption question about one we do not.

**One configuration fact either way.** `Std`'s rules ship at `suggestion` against this repo's
`MinAlertLevel = warning`, so an adopted rule must be re-levelled by name or it is **silent and looks
enabled** — the confident-zero shape, arriving through configuration.

### What to do before adopting anything new

1. **Re-measure each enabled rule on each surface it reaches**, not once. Five surfaces exist —
   role files, articles, `CLAUDE.md`, module sidecars, and JSDoc in `src/` and `scripts/` — and
   `.vale.ini` already sections by them, so the measurement is per section.
2. **Sample precision per surface, and record the sample.** A rule at 8/8 on one surface and 1/3 on
   another is two different rules wearing one name. The remedy may be a narrower scope rather than a
   better matcher.
3. **Only then survey the packages.** A new rule inherits the same problem, and adding rules before the
   existing ones have per-surface figures compounds it.

**A measured refutation closes a rule permanently**, and that is an acceptable outcome for any of the
ten. `Instruction.HistoricalNarration` on `src/` may be one.

### One method note, because it cost four errors today

Every measurement error in the 2026-09-11 and 2026-09-12 sessions produced a **false negative** — a
confident "nothing here". `grep -c` on prettier-wrapped prose, `grep -vc` counting non-matching lines,
and `xargs -a` which BSD `xargs` does not accept, with the error hidden by `2>/dev/null`. That last
one reported zero findings for all seven of our rules across the whole corpus, when the true figure is 686.

**So every count in this entry must be taken with the error stream visible and a sentinel in the
run.** A rule audit that under-reports is worse than no audit: it licenses mass application on the
strength of a number that was never measured.

## Complication

**`Std` was measured and declined for slice 1. The user re-opened that evaluation on 2026-09-10, so
`Std` is fully in scope here.** What re-opens is the _ruling_, not the measurements under it. The
three findings below are facts about the package and should be treated as inputs to a fresh
evaluation rather than as reasons it is settled:

1. Nothing in `Std` speaks to this style's premise — its 14 rules are general English style, and this
   repo's rules encode `doc-comments.md` invariants, so there is no parent worth inheriting from.
2. Its `Contractions` rule **inverts the house rule**, swapping `are not` to `aren't`. A wholesale
   `BasedOnStyles = Std` enables it.
3. All 14 ship at `suggestion` against this repo's `MinAlertLevel = warning`. Enabled as shipped they
   are **silent and look enabled**.

**None of those three is a reason not to look again, and two of them argue for a shape rather than
against adoption.** Reason 2 says do not enable wholesale; it says nothing about enabling a rule by
name. Reason 3 is a configuration fact with a known fix — re-levelling by name — which the ruling
priced at 14 lines and judged not worth paying. That is a cost judgement, and a cost judgement is
exactly the kind that changes when the thing it buys changes. Wave 1's standard now asks for
soundness enforced by tooling, which is a different purchase from the one that was declined.

Reason 1 is the substantive one and is the question to actually test: does a package aimed at general
English style have anything to say to a style encoding `doc-comments.md` invariants? Test it rather
than inherit the answer.

**Three questions, then, not two.**

- **`Std` itself, re-evaluated per rule** rather than as a package, against the current corpus and
  against Wave 1's standard rather than slice 1's landing constraint.
- **Two `Std` rules were declined on the landing constraint rather than on merit** — a
  Latin-abbreviation rule and two first-person usage rules. The rationale records them as "legitimate
  candidates for a slice that pairs the rule with its remediation". That pairing is exactly what this
  candidate would be.
- **`Google` and `Microsoft` have never been examined at all.** Reason 1 above was measured against
  `Std`'s 14 rules. Whether it holds for a larger, differently-aimed package is an open question, not
  a settled one. Both are documentation style guides rather than general English style, which is a
  closer aim to this repo's than `Std` has.

**The `Slop` precedent is the caution.** `vale-llm-slop` is already installed and its 16 rules are
deliberately off. A spike was declined after the first measurement: its largest rule read at roughly
zero precision. An unexamined package is not free, and the orienting measurement is what decides.

## Question

Which rules in these three packages enforce something this repo's prose already asks for, and would
they fire at acceptable precision on this corpus?

## Sketch

**Measure before designing.** Install each package, run it at `MinAlertLevel = suggestion` over the
current corpus, and produce one table per package: rule, findings, and a sampled precision judgement.
Then answer per rule, not per package.

Three properties decide adoption, and they are already established here:

- **Does it mechanise a rule the articles already state?** That is the whole point. A rule enforcing
  something the house does not ask for is a new house rule wearing a tool's clothes, and needs its own
  argument.
- **Does it contradict a house rule?** `Std.Contractions` is the worked example.
- **Can it land with its remediation in the same slice?** The no-untriaged-backlog constraint is in
  `prose.md`. A rule with 200 findings and no remediation budget does not land.

**Do not adopt a package wholesale.** The precedent from the `Std` pass is per-rule enablement with
explicit re-levelling, because a `suggestion`-level rule under `MinAlertLevel = warning` is inert and
looks enabled — a confident zero with a config-shaped cause.

**Re-derive every figure.** The `Std` pass's counts are superseded: they came from a corpus defined by
a command that no longer describes this tree. What survives from it is a ranking, which is a fact
about the rules rather than about the corpus.

## Touches

`.vale.ini` (a `Packages` line, per-rule enablement, and the three exemption sections each new rule
must be named in), `vale-styles/` if a house rule is better written than inherited, and whatever prose
the adopted rules find. `.vale/` is gitignored, so any package is a `vale sync` precondition — the
first entry on the confident-zero list.

## Open questions

- **Is the real deliverable a package, or the rules it teaches us to write?** Reason 1 of the `Std`
  ruling may hold for all three. If so the output is a survey plus some house rules modelled on what
  the packages do well, which is a legitimate and cheaper result than adoption.
- **How much of `prose.md` is mechanisable at all?** The honest prior is: not much. Its
  rules are about register and altitude, which Vale's scoping cannot express — a fact already recorded
  for the instruction-versus-explanation split. Name the mechanisable subset before promising it.
- **Does this belong inside Wave 1's gate or immediately after it?** It is filed in Wave 1 because
  "sound via tooling rather than via prose" is the gate's own standard. But it is a survey, and a
  survey can run in parallel with the fixes without blocking them.
- **What is the precision floor for adopting a rule?** `Slop`'s `Metaphor` was declined at roughly
  zero. Nobody has stated the number a rule has to clear, and the `Std` pass judged by inspection.
