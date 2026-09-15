---
name: claim-audit-skill
title: Add /claim-audit — the judged pass over claim-discipline's six forms, as a named procedure
created: 2026-09-15
---

## Context

Instruction prose is authored against the mechanical gates, and the claim rules are unmechanised
by design — `claim-discipline.md` says a roster in free prose is not a syntactic pattern, and to
apply the rules while writing rather than sweeping afterwards. Nothing makes that application a
procedure, so it depends on the author's recall under a green-gates halo.

Measured 2026-09-15: an audit of `definition-of-ready.md` against `claim-discipline.md` found ten
violations — an audience roster, two censuses, an undated harness-capability claim, restatements
of cited sections, wording-identity attributions — in a file whose every mechanical gate was
green at authoring. The authoring seat had not read `claim-discipline.md` in full, although it is
an unconditional read. The seat also has no prose reviewer, which
`orchestrator-prose-has-no-reviewer.md` already records.

## Sketch

A `/claim-audit` skill on the `/idea-assess` shape: fork context, no Write in `allowed-tools`,
`disable-model-invocation` off so the seat can self-invoke before landing prose. It reads
`claim-discipline.md` in full, then the target file, and returns findings per form with the
offending line quoted — a judged pass, so the same non-reproducibility caveat as the readiness
judge, with the article as the only constraint.

## Touches

- `.claude/skills/claim-audit/` (new)
- Possibly one CLAUDE.md sentence naming when the seat runs it

## Open questions

- Should it also check `prose.md`'s instruction-versus-explanation split, or stay one article
  deep? A two-article judge risks vaguer findings. **Evidence arrived 2026-09-15, same day:** the
  claim-discipline audit of `definition-of-ready.md` repaired two censuses by introducing two
  sidecar pointers — the first shape on `prose.md`'s banned list. A one-article judge fixes
  violations of its own rulebook by violating the other.
- Which surfaces by default — instruction files only, or every doc the landing touches?
- Should `/idea-promote` name a clean claim-audit as a precondition for the files a promotion
  edits, or does that begin to gate the board?
