---
name: spike-the-slop-rules-one-at-a-time
title: Spike each Vale Slop rule on a pilot article, with the user ruling on each, to decide which to enable
created: 2026-09-10
---

## Situation

`.vale.ini` enables the `STE` style and disables `Slop` by name. The comment says why: nothing in
`Slop` has been tried or ruled on, and adopting any of it is a decision with its own measurement
rather than a default.

The package ships **sixteen** rules. Measured 2026-09-10 against the linted corpus
(`.claude/agents/**`, sidecars correctly exempt):

| rule                  | findings | shipped level |
| --------------------- | -------: | ------------- |
| `Metaphor`            |       25 | warning       |
| `EmptyQualifiers`     |        6 | warning       |
| `NegativeParallelism` |        4 | warning       |
| `EmDash`              |        4 | suggestion    |
| `Ceremony`            |        3 | suggestion    |
| `Overused`            |        2 | suggestion    |
| `Anthropomorphism`    |        2 | suggestion    |
| `Headers`             |        1 | suggestion    |
| **eight others**      |    **0** | mixed         |

47 findings total across `.claude/agents/**`. Adding `CLAUDE.md`, which is now linted too, takes
`Metaphor` from 25 to **30** and the total to 53. `Metaphor` alone is over half either way.

## Complication

**No single file can carry this spike, and that is measured rather than assumed.** The widest spread
in the corpus is **three of sixteen rules** in one file — `testing-layers.md`, `prose-linting.md` and
`acceptance-mutation.md` each hit that ceiling. A pilot article can inform a judgement on three
rules. It says nothing about the other thirteen.

**Eight rules fire nowhere.** `Assistant`, `SelfPraise`, `Transitions`, `Tricolon`, `VagueReasons`,
`Vocabulary`, `Hedging` and `RestatesCode` produce no finding on any linted file. For those the
question is not "are these findings good" — there are none — but "do we want a ratchet against future
drift". That is a different question and needs no pilot.

**Nine of sixteen ship at `suggestion`, and `MinAlertLevel = warning` silences them completely.** A
spike that enables a rule without re-levelling it measures nothing and reports a confident zero. This
is failure mode 1 in `prose-linting.md`'s own list.

**Enabling `Slop` at all requires closing a leak, and the leak is real rather than theoretical.**
Measured during this candidate's own preparation: adding `Slop` to the agent-docs section leaked it
into the exempt `*.rationale.md` sidecars, because that exemption section disables the six **STE**
rules by name and knows nothing about Slop. Findings read **105** with the leak and **47** with it
closed — so more than half of what a naive enable reports comes from files that are supposed to be
exempt. Closing it costs one `= NO` line per adopted rule.

**And the edit is four-place.** `.vale.ini` carries three enable sections — the agent-docs glob,
`[CLAUDE.md]`, `[src/**/*.md]` — because Vale does not inherit per-rule keys across a later
`BasedOnStyles`. Every adopted rule is three enables plus one disable.

## Question

Which `Slop` rules earn a place, judged on this repo's own prose rather than on the package author's
intent?

## Answer

A spike in four steps, because the corpus forces different questions at different scopes, and
because the largest of them is not pilot-sized. **The user rules on each
rule, one at a time; nothing is adopted by default and nothing is rejected by volume.**

**Pilot: `.claude/agents/articles/testing-layers.md`.** Chosen for reasons that survive stating:
it is a large topic article (29,812 bytes) with the full register mix — read triggers, measured
facts, procedures, closed decisions; it has a `.rationale.md` sidecar, so the pilot also exercises
the exemption the leak above threatens; and it is one of the three files at the three-rule ceiling.

**`prose-linting.md` is explicitly disqualified as pilot**, on its own text: an article about a rule
trips that rule, and its findings are dominated by mentions rather than uses.

### Step 1 — `Metaphor`, first and corpus-wide, because it is not a pilot-sized question

`Metaphor` is **30 findings across 14 files** including `CLAUDE.md` — more than the other seven
firing rules combined. The pilot carries exactly one of them, so a pilot-scoped sample would decide
the largest question in the spike from a single instance.

**It also is not thirty judgements. It is five.** Every finding is one of five phrases:

| phrase                           | count | where                                               |
| -------------------------------- | ----: | --------------------------------------------------- |
| `load-bearing`                   |    14 | 8 files, including `CLAUDE.md` and four role files  |
| `reads as a` / `read as a`       |     8 | 5 files, including `CLAUDE.md`                      |
| `provenance`                     |     4 | `architecture.md`, `engineering.md`, `CLAUDE.md`    |
| `stands in for` / `stand in for` |     3 | `engineering.md`, `cleaner.md`, `testing-layers.md` |
| `the shape of the`               |     1 | `engineering.md`                                    |

So the ruling is a **house-vocabulary decision on five terms**, taken once, and the remediation
follows mechanically from it. Present each phrase with every site it occurs at and a proposed
replacement, and take the ruling per phrase rather than per finding.

Two things worth putting in front of the user rather than deciding for them. `load-bearing` is
alone nearly half the rule's output and reads as settled house idiom here rather than as slop — a
rejection of that one term drops `Metaphor` from 30 findings to 16. And `provenance` is not a
metaphor in this corpus at all: `architecture.md`'s rule is literally about **an argument's
provenance**, which is the word's ordinary sense.

**A phrase-level rejection is not a rule-level rejection.** `Slop` rules are `existence` matchers
over a token list, so a term can be removed from the rule's own list rather than the rule being
dropped. Whether this repo should carry a patched `Slop` style is its own question, and it belongs to
the user, not to the spike.

### Step 2 — the two other rules the pilot exercises

`EmDash` (L41) and `Ceremony` (L67, "Note that"). `Metaphor`'s pilot finding (L121, "stands in
for") is folded into step 1.

For each, in isolation: re-level to `warning`, run on the pilot only, show the user **the finding,
the sentence, and the proposed rewrite**. The user rules adopt / reject / adopt-with-exemptions.
Record the ruling and the reason before moving to the next rule. One rule per review, so a verdict
on one cannot be contaminated by fatigue from another.

### Step 3 — rules that fire elsewhere but not on the pilot

`EmptyQualifiers` (6), `NegativeParallelism` (4), `Overused` (2), `Anthropomorphism` (2),
`Headers` (1).

Same protocol, but the sample comes from whichever files carry the findings. The pilot cannot serve
here, and pretending otherwise would be the claim-scope error this repo already documents.

### Step 4 — the eight that fire nowhere

No findings to review, so the judgement is different and should be put to the user as such: **is this
a ratchet worth having against prose that has not drifted yet?** Cost is one `= NO` line and three
enables per rule; benefit is catching a shape before it lands. `Assistant` is the interesting one —
it ships at `error`, it is the only rule in the set that does, and "assistant voice in committed
prose" is exactly the drift an agent-authored corpus is prone to.

### Output

A ruling per rule with its reason, and the `.vale.ini` edit for the adopted set — enables in three
sections, `= NO` in the exemption section. **Remediating the findings is not this spike's job**; that
is the follow-up, and its size is knowable only once the set is chosen.

## Touches

- `.vale.ini` — the adopted set, four places per rule
- `.claude/agents/articles/prose-linting.md` — each adopted rule needs its mechanical-or-prompt
  classification and its exempt classes, in the form the six STE rules already have
- `prose-linting.rationale.md` — the rulings and the rejected set, per branch 5
- No `src/`, no `scripts/`. Documentation-only.

## Open questions

- **Should this repo carry a patched `Slop` style?** Step 1 may reject a phrase without rejecting
  its rule, and `Slop` rules are `existence` matchers over token lists, so a term can be dropped from
  the list. That means vendoring or patching a style package, which the repo does elsewhere for
  crap4ts and which `quality-tooling.rationale.md` records the mechanism for. It is a real cost and
  a real precedent, and it is the user's call rather than the spike's.
- **Do role files need their own pilot?** They are a different register — imperative instruction
  rather than explanation — and `architect.md` and `coder.md` each fire two rules. A confirmation
  pass on one role file may be cheaper than assuming the article verdict transfers.
- **Does `CLAUDE.md` differ?** It is now linted and is a routing index, which is a third register
  again. Not measured here.
- **Should any adopted rule gate?** Every STE rule is `warning`, so none moves an exit code. `Slop`'s
  `Assistant` ships at `error`, and adopting it as shipped would be the first prose rule in this repo
  that can fail a run.
