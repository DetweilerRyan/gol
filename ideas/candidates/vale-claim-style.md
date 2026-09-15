---
name: vale-claim-style
title: Author a Claim style — phrase rules for the lintable minority of claim-discipline's forms
created: 2026-09-15
---

## Context

`claim-discipline.md` binds every prose surface, and its forms are mostly unmechanised by
construction — a roster in free prose is not a syntactic pattern. Mostly is not entirely. A few
of the forms leave phrase-level fingerprints a Vale rule can match: an audience roster tends to
open "The audience is"; a wording-identity attribution says "own words" or "own phrase"; a
sentence-initial "Most" often fronts an unmeasured census.

Measured 2026-09-15: all three fingerprints appeared in `definition-of-ready.md`'s violations,
found by a hand audit after every mechanical gate was green. A phrase rule would have flagged
those instances at authoring time. Sibling candidate: `claim-audit-skill.md` covers the
unmechanisable majority with a judged pass; this covers the minority with a deterministic one.

## Sketch

A tracked `vale-styles/Claim/` style, `architect`-authored like `JsDoc` and `Board`, scoped to
the instruction surfaces (`.claude/agents/**`, `.claude/skills/**`, `.claude/references/**`,
CLAUDE.md). One rule per fingerprint, each with a `.bad`/`.good` fixture pair whose `.good`
carries a discriminating near-miss.

The gate to clear before any rule lands is `prose.md`'s rule-authoring discipline: a measured
precision count on the real corpus, recorded with a date; the rule and the remediation of its
findings as one piece of work; no landed state leaving an untriaged backlog; and no tuning past
the point of arguable findings.

## Touches

- `vale-styles/Claim/` (new), `vale-styles/fixtures/`, `.vale.ini` (`architect`)
- `.claude/agents/articles/prose.md`, `prose.meta.md` (orchestrating session)

## Open questions

- Which fingerprints survive the precision measurement? "Most" at sentence start is the shakiest
  — it needs a corpus run before it is worth a fixture.
- Does this overlap the standing style-package and slop-rule candidates enough to fold in, or is
  a claim-shaped style its own surface?
- Does the census-count question already filed in `apply-the-census-count-rule-everywhere.md`
  absorb the count fingerprint, leaving this style two rules rather than three?
