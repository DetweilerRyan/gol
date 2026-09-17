---
name: prose-md-has-drifted-from-vale-ini
title: Reconcile prose.md's Vale census with what .vale.ini actually enables
created: 2026-09-17
---

Captured from `coach` REVIEW's handoff on `slice/extract-the-merge-protocol`, its R5,
2026-09-17 — consolidating `editor` AUDIT's two census findings of the same day.

## Situation

`.claude/agents/articles/prose.md` describes which Vale rules run where. `.vale.ini` is
the live side. `coach` measured four divergences on 2026-09-17:

- The article says a reference pair "is scoped the same way" as a skill file — `STE`,
  `Procedure` and `Instruction`, no backlog. `.vale.ini`'s `[.claude/references/**/*.md]`
  section disables all three `Instruction` rules by name, recording a measured six-finding
  backlog as the reason.
- The article's "six enabled rules" census predates the `Claim`, `Instruction` and `Board`
  styles. Thirteen rules are enabled somewhere today.
- The article says the enable block appears "three times". It appears in five sections.
- The article says Vale runs over three surfaces and names "the five role files". There
  are eight role files, and two further surfaces.

## Complication

`prose.md` is the article every prose question routes to. A census that undercounts its
own styles teaches a reader the wrong reach for every rule it omits, and nothing checks
the article against the config.

## Question

Reconcile the article to the config — and decide whether any of its counts should survive
as bare numbers at all, given `claim-discipline.md`'s stance on undated counts.

## Open questions

- Is a mechanical census check worth an `agent-doc-check`-style binding, or is this a
  one-time reconciliation plus a no-bare-counts rewrite?
