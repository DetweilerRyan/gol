---
name: split-engineering-by-audience
title: Split engineering.md, because every role is told to read all of it and most of it binds three
created: 2026-09-11
---

## Situation

Every role file opens by telling the role to read `engineering.md`, `workflow.md` and `handoffs.md`
unconditionally. `engineering.md` is **43,742 bytes across fourteen sections**.

**Measured 2026-09-11, prompted by the user asking whether `product` should read it at all.** Of the
fourteen sections, four plausibly bind `product`: "Which test layer a test belongs in", "Verification
before handoff", and the two claim-discipline sections. The other ten address work `product` does not
do — it writes no `src/`, no `scripts/`, no property tests and no module boundaries, and it runs
neither `ast-grep` nor the CRAP and DRY gates.

Section sizes, for whoever does the split:

| Section                                             | Lines   |
| --------------------------------------------------- | ------- |
| A comment may state why…                            | 51      |
| Writing a property test                             | 32      |
| Working inside `scripts/`                           | 31      |
| Which test layer a test belongs in                  | 27      |
| Where guidance and file names live                  | 20      |
| The scope of a claim…                               | 14      |
| A conclusion from a plausible mechanism…            | 14      |
| Design and testability, Verification before handoff | 10 each |
| Structural rules (ast-grep)                         | 9       |
| Scoping a gate, Ask whether a gate still encodes…   | 7 each  |
| Acceptance pipeline, Guardrails                     | 4 each  |

## Complication

**This is the same defect as an article nobody is told to read, inverted.** There, the fact is
invisible because no trigger reaches it. Here, everyone is told to read all of it, so **nobody knows
which part binds them** — and a role that skims is skimming the sections that do.

**The blanket read line is the mechanism, and it is in all five role files.** "Read
`.claude/agents/articles/` (engineering, workflow, handoffs) for the house rules shared by every role
before starting." That sentence is why the article grew: anything addressed to more than one role
lands there, and nothing ever asks whether the set of readers is really all five.

**Claim discipline is the clearest mis-sort.** "The scope of a claim is the scope of the command that
produced it" and "A conclusion from a plausible mechanism outlives a measurement" are not engineering
rules. They bind every role, the orchestrating session, and this session's own prose — `orchestration.md`
already names them as the two sections that seat most needs. They sit in an article whose title says
they are about building software.

## Question

Which sections bind which readers, and what is the smallest split that makes each role's unconditional
read actually unconditional?

## Answer — split by audience

**Ruled by the user on 2026-09-11 as the direction**, over the cheaper alternative of naming the
relevant sections per role. That alternative was rejected because it puts five copies of a routing
decision into five role files, which is rule 6's defect one level up.

Candidate shape, not ratified:

- **Claim discipline** — its own article, read by all five roles _and_ by the orchestrating session,
  which is already true and already stated in `orchestration.md`. Roughly 28 lines plus the comment
  section's assertion rules.
- **What stays in `engineering.md`** — the `src/`-facing work: design and testability, property
  tests, test-layer placement, structural rules, `scripts/`, gate scoping. Read by `coder`, `cleaner`,
  `architect`, `hardener`.
- **What `product` reads instead** — test-layer placement is the one section it genuinely needs and
  already cites by name. Decide whether it moves, is duplicated by pointer, or stays where it is with
  `product` reading a smaller `engineering.md`.

## Sequencing — Wave 1 of the effective-prose epic

**The user placed this in Wave 1 on 2026-09-11.** It belongs there for the same reason the other Wave 1
rows do: every later wave writes rules and remediates against whatever the articles say at that moment,
and an article whose audience is wrong multiplies that error by the volume of work done under it.

**Do it after the five role-file strips**, not before. Three strips have landed
(`coder`, `cleaner`, `product`) and two remain. The strips are what reveal which sections a role
actually cites — `product.md`'s single citation of "Which test layer a test belongs in" is how its
four-of-fourteen figure was found. Splitting first would be guessing at the audience the strips
measure.

## Touches

`.claude/agents/articles/engineering.md` and its sidecar, a new article, all five role files' read
lines, `CLAUDE.md`'s routing index and its three-article claim in the Documentation map, and
`orchestration.md`, which names the two claim-discipline sections by article.

`npm run agent-doc-check` reads `.claude/**` and `npm run reference-check` scans every `.md` there, so
both move. No `src/` or `scripts/` change, so the mutation gate does not.

## Open questions

- **Does the three-article set survive?** `CLAUDE.md` says "Three articles are house rules every role
  reads unconditionally." A fourth changes that sentence and the claim it makes. Decide whether the
  house-rules set grows or whether one of the three shrinks to compensate.
- **Is `workflow.md` or `handoffs.md` mis-sorted the same way?** Nobody has measured them. The same
  question — which sections bind which roles — has never been asked of either.
- **Does `architect.md`'s size have the same cause?** It is 4,934 words with four modes, and the
  earlier Vale spike found its length is scope rather than loose prose. If both files are routing
  problems rather than prose problems, that is one question with two instances.
