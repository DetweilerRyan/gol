---
name: the-articles-carry-an-untriaged-instruction-backlog
title: The Instruction guard is off for the articles, and the 329 findings it suppresses have never been read
created: 2026-09-11
---

## Situation

`slice/strip-role-files-to-instruction` and its successors stripped all five role files and enabled
the `Instruction` Vale style over `.claude/agents/**/*.md`. That glob reaches the articles, because
Vale's `*` crosses `/`.

**The articles are switched off by name**, in a `[.claude/agents/articles/**]` section below the
glob. Measured 2026-09-11 with the opt-out removed in a scratch config:

| Rule                  | Findings across the articles |
| --------------------- | ---------------------------- |
| `ParagraphSentences`  | 186                          |
| `HistoricalNarration` | 74                           |
| `ListItemSentences`   | 69                           |
| **total**             | **329**                      |

The `.rationale.md` sidecars are exempt by a separate section and are outside that count.

## Complication

**The opt-out is correct and is not the finding.** `prose.md`'s landing constraint forbids
shipping an enabled rule whose findings nobody has triaged, and 329 is well past what a strip slice
could clear. Switching it off by name is what that constraint requires.

**What is unexamined is whether the rules even apply here.** An article is a different register from a
role file. A role file is instruction to follow; an article carries rules **and the conditions under
which they hold**, which is why every role reads three of them unconditionally. `ParagraphSentences`
at max 4 was derived from a stripped `coder.md`, not from an article, and 186 of the 329 come from
that one rule.

So the possible outcomes are not one:

- The rules apply and the articles want the same treatment the role files got.
- The rules apply with different thresholds, and the article tier needs its own numbers.
- The rules do not apply, and the opt-out becomes permanent with an argument rather than a backlog.

**Nobody has read a sample.** The count is the only thing measured.

## Question

Do the `Instruction` rules bind an article, and at what thresholds?

## Sketch

**Read a sample before deciding anything.** Take twenty findings spread across the three rules and
classify each: exposition that would leave under the role-file standard, a rule with its conditions
attached, or a false positive of the register.

That sample answers the threshold question as a side effect. If most `ParagraphSentences` hits are
rules-with-conditions rather than accounts, the max is wrong for this tier rather than the prose being
wrong.

**Sequence after `split-engineering-by-audience`.** That slice may move whole sections between
articles or into a new one, which changes both the corpus and its audience. Triaging first would
triage prose that is about to move.

## Touches

`.claude/agents/articles/**`, `.vale.ini`'s opt-out section, and `prose.md` if the tier gets
its own thresholds.

## Open questions

- **Is `HistoricalNarration` right for an article at all?** 74 hits. An article is where a dated record
  legitimately lives — `engineering.md`'s claim-discipline sections are largely about how to write
  one. The rule may be inverted for this tier rather than merely loose.
- **Do the sidecars stay exempt?** They are exempt today by the `**/*.rationale.md` section, which
  predates this style. That exemption was argued for `STE`, not for `Instruction`, and nobody has
  re-derived it.
