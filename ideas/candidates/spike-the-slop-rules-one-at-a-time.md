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
`Metaphor` from 25 to **30** and the total to **57** — `CLAUDE.md` contributes ten findings across six
rules, not the five `Metaphor` hits alone. `Metaphor` is 30 of 57, still over half either way.

Shipped levels across the sixteen: **one `error`** (`Assistant`), **seven `warning`**
(`EmptyQualifiers`, `Metaphor`, `NegativeParallelism`, `RestatesCode`, `SelfPraise`, `VagueReasons`,
`Vocabulary`), **eight `suggestion`** (the rest).

## Complication

**No single file can carry this spike, and that is measured rather than assumed.** The widest spread
among the **articles and role files** is **three of sixteen rules** — `testing-layers.md`,
`prose-linting.md` and `acceptance-mutation.md` each hit that ceiling. `CLAUDE.md` is the outlier at
**six of sixteen**, twice any article, and is the widest-spread file in the corpus. Six is still not
sixteen, so the conclusion holds either way: a single-file pilot can inform a judgement on at most
six rules, and says nothing about the other ten.

**Seven rules fire nowhere.** `Assistant`, `SelfPraise`, `Transitions`, `Tricolon`, `VagueReasons`,
`Vocabulary` and `Hedging` produce no finding on any linted file. (`RestatesCode` is **not** one of
them — it fires once, on `CLAUDE.md`, so it belongs to step 3.) For those the
question is not "are these findings good" — there are none — but "do we want a ratchet against future
drift". That is a different question and needs no pilot.

**Eight of sixteen ship at `suggestion`, and `MinAlertLevel = warning` silences them completely** —
including **five of the nine rules that actually fire** (`EmDash`, `Ceremony`, `Anthropomorphism`,
`Overused`, `Headers`). A
spike that enables a rule without re-levelling it measures nothing and reports a confident zero. This
is failure mode 1 in `prose-linting.md`'s own list.

**Enabling `Slop` at all requires closing a leak, and the leak is real rather than theoretical.**
Measured during this candidate's own preparation: adding `Slop` to the agent-docs section leaked it
into the exempt `*.rationale.md` sidecars, because that exemption section disables the six **STE**
rules by name and knows nothing about Slop. Findings read **105** with the leak and **47** with it
closed — so more than half of what a naive enable reports comes from files that are supposed to be
exempt. The 58-finding difference is **entirely** the nine `.rationale.md` sidecars; the delta on
non-exempt files is exactly zero. Closing it costs one `= NO` line per adopted rule.

**And the edit is four-place.** `.vale.ini` carries three enable sections — the agent-docs glob,
`[CLAUDE.md]`, `[src/**/*.md]` — because Vale does not inherit per-rule keys across a later
`BasedOnStyles`. Every adopted rule is three enables plus one disable. Note `[src/**/*.md]` reaches
**no live file today** — the only `.md` files under `src/` are three `.rationale.md`, all exempted by
the later section — so it is three live places plus one precautionary.

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

**`prose-linting.md` is disqualified as pilot**, but not for the reason first written here. Its four
`Slop` findings were checked one at a time, and **all four are uses, none is a mention** — the
self-reference effect is not present today. The real reasons are two. It is the spike's own
deliverable (see Touches), so remediating it during the pilot conflates the sample with the output.
And it is the file that _will_ accumulate mentions once each adopted rule is documented there with a
quoted example, which makes it a bad long-term instrument rather than a bad one now.

### Step 1 — `Metaphor`, first and corpus-wide, because it is not a pilot-sized question

`Metaphor` is **30 findings across 14 files** including `CLAUDE.md` — more than the other seven
firing rules combined. The pilot carries exactly one of them, so a pilot-scoped sample would decide
the largest question in the spike from a single instance.

**It also is not thirty judgements. It is five.** Every finding is one of five phrases:

| phrase                           | count | where                                               |
| -------------------------------- | ----: | --------------------------------------------------- |
| `load-bearing`                   |    14 | 8 files, including `CLAUDE.md` and two role files   |
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

**A phrase-level rejection is not a rule-level rejection, and it needs no patched style.** Fifteen of
the sixteen `Slop` rules are `existence` matchers over a regex list, so a term is separable from its
rule. (`EmDash` is the exception: `occurrence`, `scope: paragraph`, one token and `max: 2`. There is
no phrase to reject there, only a threshold to tune.)

**Vale's own `TokenIgnores` does this from `.vale.ini`, with no vendoring and no patch.** Measured
2026-09-10 against the closed config over `.claude/agents/**`: adding the five phrases as
`TokenIgnores` patterns took `Slop` from 47 findings to 23, while `STE` stayed at 785 — zero
collateral on today's corpus. Two limits, both measured. It matches **raw source**, so `the _shape_
of the` survives the pattern `(the shape of the)`, and that one finding is the 25th of 25. And it is
a per-format-section key, so it repeats in the same three live sections the `= NO` lines do.

### Step 2 — the two other rules the pilot exercises

`EmDash` (L41) and `Ceremony` (L67, "Note that"). `Metaphor`'s pilot finding (L121, "stands in
for") is folded into step 1.

Corpus-wide each of these is four sites rather than one: `EmDash` in `testing-layers.md` (1),
`mutation-testing.md` (2) and `coder.md` (1); `Ceremony` in `testing-layers.md`, `prose-linting.md`,
`doc-comments.md` and `CLAUDE.md` (1 each).

For each, in isolation: re-level to `warning`, run on the pilot only, show the user **the finding,
the sentence, and the proposed rewrite**. The user rules adopt / reject / adopt-with-exemptions.
Record the ruling and the reason before moving to the next rule. One rule per review, so a verdict
on one cannot be contaminated by fatigue from another.

### Step 3 — rules that fire elsewhere but not on the pilot

`EmptyQualifiers` (7), `NegativeParallelism` (5), `Anthropomorphism` (3), `Overused` (2),
`Headers` (1), `RestatesCode` (1). Counts include `CLAUDE.md`.

Same protocol, but the sample comes from whichever files carry the findings. The pilot cannot serve
here, and pretending otherwise would be the claim-scope error this repo already documents.

### Step 4 — the seven that fire nowhere

No findings to review, so the judgement is different and should be put to the user as such: **is this
a ratchet worth having against prose that has not drifted yet?** Cost is one `= NO` line and three
enables per rule; benefit is catching a shape before it lands. Put each rule's token list, or a
synthetic line that trips it, in front of the user — with no findings there is nothing else to rule
on. `Assistant` is the interesting one: it ships at `error`, it is the only rule in the set that
does, and "assistant voice in committed prose" is exactly the drift an agent-authored corpus is
prone to.

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

- **How should a phrase-level rejection be expressed?** `TokenIgnores` in `.vale.ini` is measured to
  work (see step 1) and is the cheap answer. The alternative — vendoring or patching the style
  package — is the only route to a _narrower_ edit, such as extending `Metaphor`'s existing
  `provenance` lookbehind (which already exempts `SLSA`, `build`, `data`, `artifact`, `image`,
  `package`, `chain`, `file`) to cover `argument` and `rule`. The crap4ts precedent does **not**
  transfer: `patch-package` runs on `node_modules` from `npm postinstall`, and `.vale/` is gitignored
  and populated by a hand-run `vale sync`, which that mechanism never reaches.
- **Do role files need their own pilot?** They are a different register — imperative instruction
  rather than explanation — and `architect.md` (`NegativeParallelism` 3, `Metaphor` 1) and `coder.md`
  (`EmptyQualifiers` 2, `EmDash` 1) each fire two rules. The sites are already enumerated, so a
  confirmation pass is cheap.
- **`CLAUDE.md` is measured now, and it is the widest-spread file in the corpus**: six rules, ten
  findings. It is a routing index rather than an article, it has no `.rationale.md` sidecar, and it
  is auto-loaded into every session. It cannot be _the_ pilot, since it cannot exercise the sidecar
  exemption, but it should be sampled alongside one.
- **Should any adopted rule gate?** Every STE rule is `warning`, so none moves an exit code. `Slop`'s
  `Assistant` ships at `error`, and adopting it as shipped would be the first prose rule in this repo
  that can fail a run.
