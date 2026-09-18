---
name: procedure-length-clears-by-relocation
title: Learn whether a continuation paragraph is a legitimate shape or an escape hatch for ProcedureLength
created: 2026-09-18
---

## Situation

`vale-styles/Procedure/ProcedureLength.yml` measures a numbered step's marker line — the
line carrying the ordinal. Measured 2026-09-18 while `coach` drafted the spec for
`split-the-merge-protocol-reasoning-into-its-sidecar`: moving instruction words off that
marker line into an indented continuation paragraph under the same ordinal clears the
finding while deleting nothing and shortening nothing.

Three steps in `.claude/references/merge-protocol.md` sit at 50, 39 and 30 words after that
slice's register split, all over the 20-word cap. All three clear by relocation alone.

## Complication

The relocation is not only a trick. A 71-word numbered step is a genuine defect, and a
short marker line over an indented body is a shape the corpus already uses well.

It is also available to any numbered step anywhere in the corpus, whether or not moving the
words improves a reader's lot. Adopting it in one slice sets a precedent a later slice can
apply mechanically, and prose that degrades this way degrades invisibly — the gate reads
clean the whole time. Nobody has measured how much of the corpus that reaches.

The rule's own header records that its scope choices are load-bearing and measured, so a
change to it is not a preference edit. `architect` is the only role that authors Vale
styles, and `npm run vale-fixture-check` binds any new or changed rule to a fixture pair
per extension it claims.

## Question

Is the continuation paragraph a legitimate shape `ProcedureLength` should keep accepting,
an escape hatch the rule should close, or a shape that stays honest only with a companion
rule bounding the body?

## No-gos

- The spike authors no rule and lands no rule change. Its output is a recorded answer in
  `findings.md`, and an `enabler-technical` candidate only if the answer needs one.
- No edit to the corpus's prose. A step rewritten to fit a rule under investigation
  contaminates the measurement.

## Open questions

- How many numbered steps across the linted corpus would clear by relocation alone? That
  is the exposure, and it is unmeasured.
- Can `ProcedureLength` be made mechanically complete — measuring a step including its
  continuation paragraphs — with no judgment left to the reader? Its header names the
  offset and scope hazards that make a naive change silently wrong.
- If the marker-line measure is deliberate rather than incidental, what companion rule
  bounds the continuation body, and does `STE.ParagraphLength` already reach it?
- Does the answer land as a rule change, or as a ruling recorded in `prose.md` with no code
  at all?
- Who executes: `architect` owns the styles, and this question is about one of them.
