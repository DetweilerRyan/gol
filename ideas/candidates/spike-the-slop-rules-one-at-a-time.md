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

47 findings total. `Metaphor` alone is over half.

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

A spike in three tiers, because the corpus forces three different questions. **The user rules on each
rule, one at a time; nothing is adopted by default and nothing is rejected by volume.**

**Pilot: `.claude/agents/articles/testing-layers.md`.** Chosen for reasons that survive stating:
it is a large topic article (29,812 bytes) with the full register mix — read triggers, measured
facts, procedures, closed decisions; it has a `.rationale.md` sidecar, so the pilot also exercises
the exemption the leak above threatens; and it is one of the three files at the three-rule ceiling.

**`prose-linting.md` is explicitly disqualified as pilot**, on its own text: an article about a rule
trips that rule, and its findings are dominated by mentions rather than uses.

### Tier A — the three rules the pilot exercises

`EmDash` (L41), `Ceremony` (L67, "Note that"), `Metaphor` (L121, "stands in for").

For each, in isolation: re-level to `warning`, run on the pilot only, show the user **the finding,
the sentence, and the proposed rewrite**. The user rules adopt / reject / adopt-with-exemptions.
Record the ruling and the reason before moving to the next rule. One rule per review, so a verdict
on one cannot be contaminated by fatigue from another.

### Tier B — rules that fire elsewhere but not on the pilot

`EmptyQualifiers` (6), `NegativeParallelism` (4), `Overused` (2), `Anthropomorphism` (2),
`Headers` (1).

Same protocol, but the sample comes from whichever files carry the findings. The pilot cannot serve
here, and pretending otherwise would be the claim-scope error this repo already documents.

### Tier C — the eight that fire nowhere

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

- **Is `Metaphor` adoptable at all at 25 findings?** It is over half the total, and a rule that
  demands rewriting a quarter of the corpus's figurative prose may be right in principle and wrong in
  practice. Worth ruling on first, since a rejection there halves the follow-up.
- **Do role files need their own pilot?** They are a different register — imperative instruction
  rather than explanation — and `architect.md` and `coder.md` each fire two rules. A confirmation
  pass on one role file may be cheaper than assuming the article verdict transfers.
- **Does `CLAUDE.md` differ?** It is now linted and is a routing index, which is a third register
  again. Not measured here.
- **Should any adopted rule gate?** Every STE rule is `warning`, so none moves an exit code. `Slop`'s
  `Assistant` ships at `error`, and adopting it as shipped would be the first prose rule in this repo
  that can fail a run.
