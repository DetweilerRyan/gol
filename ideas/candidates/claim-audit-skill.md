---
name: claim-audit-skill
title: Flag claim-discipline violations — architect's Vale rules where deterministic, /claim-audit for the rest
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

The forms split by mechanisability, and the remedy splits the same way. Some violations leave
phrase-level fingerprints a deterministic rule can match — an audience roster tends to open "The
audience is"; a wording-identity attribution says "own words" or "own phrase"; an unmeasured
census often fronts a sentence with "Most". Measured 2026-09-15: all three fingerprints appeared
in the audited file. The rest — rosters in free prose, restatements, undated claims — need a
judged pass.

## Sketch

Two halves, one landing intent: deterministic where possible, judged where not.

**Half 1 — `architect` authors a tracked `Claim` Vale style.** One rule per fingerprint that
survives measurement, scoped to the instruction surfaces (`.claude/agents/**`,
`.claude/skills/**`, `.claude/references/**`, CLAUDE.md), each with a `.bad`/`.good` fixture pair
whose `.good` carries a discriminating near-miss. The gate to clear first is `prose.md`'s
rule-authoring discipline: a measured precision count on the real corpus, dated; the rule and the
remediation of its findings as one piece of work; no landed backlog; no tuning past arguable
findings.

**Half 2 — a `/claim-audit` skill for the unmechanisable remainder.** On the `/idea-assess`
shape: fork context, no Write in `allowed-tools`, `disable-model-invocation` off so the seat can
self-invoke before landing prose. It reads **both rulebooks** — `claim-discipline.md` and
`prose.md`'s instruction-versus-explanation split — then the target file, and returns findings
with the offending line quoted. A judged pass, so the same non-reproducibility caveat as the
readiness judge.

The both-rulebooks requirement is measured, not preferred. Evidence 2026-09-15: the
claim-discipline audit of `definition-of-ready.md` repaired two censuses by introducing two
sidecar pointers — the first shape on `prose.md`'s banned list. A one-article judge fixes
violations of its own rulebook by violating the other.

## Touches

- `.claude/skills/claim-audit/` (new)
- `vale-styles/Claim/` (new), `vale-styles/fixtures/`, `.vale.ini` (`architect`)
- `.claude/agents/articles/prose.md`, `prose.meta.md` (orchestrating session)
- Possibly one CLAUDE.md sentence naming when the seat runs the skill

## Open questions

- Which fingerprints survive the precision measurement? Sentence-initial "Most" is the shakiest —
  it needs a corpus run before it is worth a fixture.
- Do the two halves land as one slice or two? The Vale half has its own landing constraint and
  could trail the skill.
- Which surfaces does the skill take by default — instruction files only, or every doc the
  landing touches?
- Should `/idea-promote` name a clean claim-audit as a precondition for the files a promotion
  edits, or does that begin to gate the board?
- Does the census-count question in `apply-the-census-count-rule-everywhere.md` absorb the count
  fingerprint, leaving the style two rules rather than three?
