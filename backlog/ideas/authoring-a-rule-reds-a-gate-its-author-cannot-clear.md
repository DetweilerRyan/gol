---
name: authoring-a-rule-reds-a-gate-its-author-cannot-clear
title: Let the role that owns a structural rule clear the gate that documents it
created: 2026-09-23
---

## Situation

CLAUDE.md's no-role-edits rule carves out two surfaces as `architect`'s own — `rules/*.yml` and
`vale-styles/**` — and then states that authoring a rule never carries an edit to the prose that documents it.

`npm run agent-doc-check`'s check 5 requires every `rules/*.yml` to be named in
`.claude/agents/articles/ast-grep-rules.md`. The convention beside it is that the rule's scope, what it
matches, and how it was verified go in the sidecar `ast-grep-rules.meta.md`, which no gate checks.

Measured 2026-09-23, on the `make-the-mutation-gate-type-aware` branch: `architect`'s design pass authored
`rules/stryker-config-declares-typescript-checker.yml` with a passing fixture, and `agent-doc-check` went red
on one finding — 33 rule files on disk, 32 named in the article — with no path for the authoring role to clear
it.

## Complication

The boundary and the gate disagree. The boundary says the documenting prose is not the rule author's to write;
the gate says the rule is not done until that prose exists. Between those two, a red gate sits on the branch
until a process-pipeline cycle runs — `coach` SPEC, a user signature, `writer`, two `editor` passes and a
`coach` REVIEW — to add one identifier to a comma-separated list.

The edit that clears it is not conduct. It is a file-list fact the checker already computes, and the sidecar
entry beside it is knowledge only the rule's author holds. Meanwhile the surrounding article does carry
conduct — how to read a finding, how to author a rule that is not silently inert — which is why a blanket
grant over the file would be the wrong shape.

## Question

Should the role that owns a structural rule also own the enumeration entry and sidecar account that the gate
requires of it — and if so, how is that boundary drawn so it reaches the list without reaching the conduct
around it?

## Answer

Shaped, not specified. A grant narrow enough to name what it covers: the rule enumeration and the sidecar's
per-rule account, not the article. The test is whether a reader can tell, from the boundary's own words, which
paragraphs a rule author may touch.

## No-gos

Does not change who authors rules or Vale styles. That stays `architect`'s.

Does not propose relaxing check 5. The gate is doing its job, and the friction is the boundary's.

Does not resolve the 2026-09-23 instance, which is already routed to
`a-survivor-no-input-can-distinguish-has-no-ruling`'s spec.

## Open questions

- Does `vale-styles/**` carry the same gap? `architect` owns those too, `prose.md` documents them, and
  `npm run vale-fixture-check` gates the styles rather than the prose — so the forcing may be convention there
  rather than mechanical.
- The article opens its list with a written-out count, "Thirty-two", which nothing verifies. Does a grant over
  the enumeration reach that number, and should the count be there at all when the article itself says to
  re-derive the list against `rules/`?
- Is a paragraph-scoped write boundary expressible in a role file in a way a role will actually honour, or does
  it need a mechanical check to mean anything?
- Does the same argument reach any other role that owns a surface a gate documents, or is `architect` the only
  one?
- Would moving the enumeration out of the article — into a generated or checker-owned list — dissolve the
  question instead of answering it?
