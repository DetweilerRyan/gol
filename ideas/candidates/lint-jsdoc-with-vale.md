---
name: lint-jsdoc-with-vale
title: Lint JSDoc with Vale — the STE pass, and repo-authored rules enforcing doc-comments.md
created: 2026-09-10
---

## Situation

Vale lints comments in source code natively, using tree-sitter grammars. It needs one config entry
this repo does not have:

```ini
[formats]
ts = md
tsx = md
```

Without it, four of the six enabled rules silently do nothing while `Contractions` still fires.
Measured over `src/` and `scripts/` production files: **181 findings without the mapping, 1,511 with
it.** A run without the mapping therefore looks alive and is not.

**Scoping to JSDoc only is possible and cheap.** A rule carrying
`scope: sentence.text.comment.block.ts` fires on a `/** */` block and never on a `//` line. The
dotted form is AND; the list form is OR, and getting that backwards silently lints everything.

Measured yield, `src/` + `scripts/`, 102 production files:

| rule              | all comments | **JSDoc only** |
| ----------------- | -----------: | -------------: |
| `SentenceLength`  |          856 |        **218** |
| `PassiveVoice`    |          418 |        **111** |
| `Contractions`    |          212 |         **58** |
| `ProcedureLength` |           16 |              0 |
| `ParagraphLength` |            9 |              0 |
| **total**         |        1,511 |        **387** |
| **mechanical**    |        1,077 |        **276** |

The three zeros are real rather than inert: a bait JSDoc with a seven-sentence paragraph and an
"and then" chain fires `ParagraphLength` and `OneInstruction` under the compound scope.
`ProcedureLength` is unverified — the bait list item was under its 20-word cap.

For scale, `CLAUDE.md` was 153 mechanical findings.

## Complication

**Triaging a Vale finding in a JSDoc is not the same act as triaging one in a Markdown file, and
nothing says so.** Four differences, three measured:

**1. The remedy is often placement rather than prose.** In an article, an over-long sentence gets
split. In a JSDoc it may instead mean the content does not belong in the interface at all —
`doc-comments.md` rule 4 sends implementation detail to `//`, and rule 7 sends overflow to a
`<module>.md` sidecar. A `SentenceLength` finding on a hover is frequently a **placement signal**,
and splitting the sentence in place is the wrong fix that still clears the finding.

**2. A fifth way to report a confident zero, specific to code.** `prose-linting.md` lists four. The
missing `[formats]` mapping is a fifth and the worst-shaped: the run reports findings, so it does not
look silent, while two thirds of the rule set is inert.

**3. New exempt classes, and one new hazard.** Measured: prose inside an `@example` fenced block is
**exempt automatically**, because `ts = md` makes Vale skip Markdown code fences — a long sentence
and a contraction inside a fence both went unflagged. But `@param` and `@returns` descriptions **are**
linted, and `@returns` is conventionally a noun phrase, so `PassiveVoice` on it may need an exempt
class of its own rather than a rewrite.

**4. `ParagraphLength` remediation costs hover height, and `SentenceLength` does not.** Splitting a
sentence reflows within the same rendered lines. Splitting a paragraph inserts a blank ` *` line,
which spends one of `doc-comments.md` rule 6's ~15 rendered lines. Markdown has no such budget. This
is reasoned from the two rules rather than measured, and should be checked during the slice.

## Question

How does an agent lint the JSDoc it just wrote, and act on a finding correctly?

## Answer

Two halves with different shapes and different risks. **Part A** is remediation — 276 mechanical STE
findings against prose nothing has checked. **Part B** is a ratchet — four repo-authored rules that
enforce `doc-comments.md` and currently find one violation. They share a config and nothing else.

## Part A — scope STE to JSDoc, and record how its triage differs

Three parts. The second is the reason this is not just a config change.

**1. The config.** `[formats]` mapping, plus a second style directory — call it `STEDoc` — that is
STE with `.text.comment.block.ts` and `.text.comment.block.tsx` appended to each rule's scope. Six
rules, one mechanical edit each, applied only in the `[*.ts]` section so the Markdown side keeps
stock STE. Vale's `scope` lives in the rule file and `.vale.ini` cannot override it, which is why a
second directory is needed rather than a section key.

**2. A `Triaging a finding in a comment` section in `prose-linting.md`**, carrying the four
differences above. The first matters most: **check whether the fix is a rewrite or a move**, and
`doc-comments.md` decides which. That is the cross-link, and it is one direction only — the placement
rules stay where they are.

**3. Two small edits closing the audience gap.** `prose-linting.md`'s audience line reads _"any role
or session that edits `.claude/agents/**`"_, which this slice makes **false** — `coder`, `cleaner`
and `architect` would all be running Vale over code. Widen it, add a read trigger for "you ran Vale
over a comment you wrote", and add one pointer from `doc-comments.md` at the point a comment is
written.

**Do not merge the two articles.** They are 28,267 and 28,902 bytes, and they govern different
dimensions: every `doc-comments.md` rule is about placement, sufficiency or assertion, and every
Vale rule is a word-count, contraction or be-verb matcher. Vale cannot express a single
`doc-comments.md` rule, and the hover budget is measured in rendered lines while `SentenceLength`
counts words per sentence — not even the same unit. A merge makes a 57KB article, larger than
`engineering.md`, that both audiences must carry in full.

**Remediating the 276 is a separate slice.** This one establishes the config, the triage rules and
the cross-link. Landing a lint that reports 276 findings nobody has triaged would be the worst of
both.

## Part B — repo-authored rules that mechanically enforce `doc-comments.md`

**Spiked 2026-09-10. It works.** Four rules were written against the article's own wording, scoped to
block comments, and run over the same 102 production files. Each fires on a deliberately bad JSDoc
and stays silent on a good one written to rule 3.

### The finding that decides how these get written: anchoring

| `NoThisFunction`                 | findings | true positives | precision |
| -------------------------------- | -------: | -------------: | --------: |
| unanchored — the phrase anywhere |       22 |              1 |  **4.5%** |
| anchored to a sentence opener    |    **1** |          **1** |  **100%** |

The 21 false positives were ordinary referring expressions — "this module stays free of DOM types",
"dragGesture.ts (which this hook wraps)". Rule 2 bans `This function…` as a **first-line opener**, and
a rule that ignores that distinction is unusable. **A naively written rule here is worse than none**,
because 22 findings read as a real backlog.

The working form, for the record:

```yaml
extends: existence
level: warning
nonword: true
tokens:
  - '(?:^|\. )This (?:function|method|hook|component|module|helper|utility) (?:is|does|will|returns|takes|handles|provides)'
  - '(?:^|\. )A (?:function|helper|utility) (?:that|which)'
scope:
  - text.comment.block.ts
  - text.comment.block.tsx
```

The other three are `ImplementationAltitude` (a vocabulary list — "under the hood", "loops over",
"recursively", "is implemented as"), `MeasurementInDoc` ("measured in/at/on", "benchmarked", per rule
4), and `ThisSlice` (`engineering.md`'s "name the slice, never 'this slice'").

### These are ratchets, not cleanup

**One real violation in 102 files.** The corpus already follows the article. That is a different
value proposition from Part A's 276 mechanical findings, and it should not be sold as remediation.
The value is preventing drift in prose nothing has ever checked.

### A second scope leak

`text.comment.block.tsx` includes JSX `{/* … */}` comments. All four `MeasurementInDoc` hits were in
JSX render commentary — implementation prose, the `//` equivalent — not JSDoc. Handle it or accept
the noise; do not read those as violations.

### What is expressible, and what is not

| mechanically expressible                 | not                                                   |
| ---------------------------------------- | ----------------------------------------------------- |
| rule 2's banned opener, anchored         | rule 3 — cannot detect the **absence** of a guarantee |
| rule 4's "measurements stay `//`"        | rule 6 — hover budget is **rendered lines**, not text |
| `engineering.md`'s "never _this slice_"  | rule 8 — needs an AST                                 |
| rule 1's altitude, via a vocabulary list | rule 2's "one sentence" first line — untested         |

**That division is the ownership story.** Vale takes vocabulary and phrasing; `ast-grep` takes
structure, and already owns `rules/no-dead-doc-on-annotated-return-literal.yml`, which is a rule 8
case. So **`architect` owns the JSDoc-scoped Vale rules on the `ast-grep` precedent** — the role that
authors `rules/*.yml` authors these, and every other role reads the output and reports tensions.

The precedent brings its sharpest clause with it: _a rule that matches nothing reports nothing and is
indistinguishable from a clean codebase._ Every rule ships with a fixture that fails without it,
which is why the spike tested a bad block **and** a good one.

## Touches

- `.vale.ini` — the `[formats]` mapping and a `[*.ts]`/`[*.tsx]` section
- `.vale/STEDoc/` — six scoped rules; note `.vale/` is gitignored, so this needs an answer for how it
  is reproduced (see open questions)
- a repo-authored style directory for Part B's rules, plus a fixture per rule
- `.claude/agents/architect.md` — ownership of the JSDoc-scoped rules, beside its `rules/*.yml` clause
- `.claude/agents/articles/prose-linting.md` — the new triage section, the audience line, the fifth
  confident-zero mode
- `.claude/agents/articles/doc-comments.md` — one pointer
- No `src/`, no `scripts/` in this slice. Documentation and configuration only.

## Open questions

- **How does a gitignored style directory carry a repo-authored style?** `.vale/` is populated by
  `vale sync` from the pinned package and is gitignored as a downloaded artifact. A hand-written
  `STEDoc` cannot live there without being wiped or untracked. Options: track it at a different path
  and point `StylesPath` at both, or vendor it. **This is the first real design question of the
  slice and should be settled before any rule is written.**
- **Is `ProcedureLength` reachable in a JSDoc at all?** Its zero is unverified. A `@param` list is a
  Markdown list under `ts = md`, so it may be reachable in a way this repo's JSDoc simply does not
  exercise.
- **Do `.test.ts` files get linted?** They are excluded from this measurement, and their comments are
  a different register again.
- **Does Part B need its own gate, or is `ast-grep`'s report-only convention right?** `ast-grep` rules
  are `severity: warning` and move no exit code, read rather than gated. Vale is report-only for the
  same reason. Consistent, but it means a repo-authored rule catches drift only when someone runs it —
  which is what `give-vale-an-owner-and-a-trigger` is about.
- **Can Part B land before Part A?** It is one violation and four rules, against Part A's 276
  findings. Landing B first gives the ratchet immediately and leaves remediation for later, which may
  be the better order — but both need the `[formats]` mapping and the style-directory answer, so
  neither is free-standing.
- **Does the caveat about intersection hold?** If most `SentenceLength` findings in a JSDoc turn out
  to want a _move_ rather than a _split_, the two articles intersect more than measured here, and
  the do-not-merge ruling should be revisited on that evidence.
