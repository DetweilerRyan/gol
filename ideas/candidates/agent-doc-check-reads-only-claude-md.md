---
name: agent-doc-check-reads-only-claude-md
title: Let check 5 read the ast-grep article, so the rule index is not maintained in two places
created: 2026-09-06
---

## Context

`split-claude-md` moved the twenty-eight-rule prose enumeration out of
`CLAUDE.md` into `.claude/agents/articles/ast-grep-rules.md`, and could not
move the rule **ids** with it. `scripts/agent-doc-check/run.ts`'s
`gatherCheckInput` passes `claudeMdText` as a field separate from `docFiles`,
and `checks.ts`'s `checkRulesNamedInClaudeMd` reads only that one field — so a
rule named in an article and not in `CLAUDE.md` reds the gate.

The slice therefore left a one-row-per-rule index in `CLAUDE.md` and put every
rule's argument in the article. That is two places naming the same twenty-eight
ids, which is exactly the shape this repo distrusts: the enumerated
`halstead4ts` file list and the two hardcoded `.feature` lists both went stale
silently before being replaced by a resolved glob.

**It is not urgent, because this one fails safe.** A rule missing from the
index reds the gate rather than passing silently — measured during that slice:
deleting the `no-dom-surgery-in-components` row gave exit 1 naming the rule. So
the cost is maintenance friction, never a false clean.

## Sketch

Widen check 5's input from `claudeMdText` to the doc corpus it already
assembles. `listDocFiles` returns `CLAUDE.md` plus every `.md` under
`.claude/**`, so the forward direction becomes "is this rule id named anywhere
in the docs" with no new I/O. The reverse direction (a `rules/<id>.yml` path
naming a file that no longer exists) should widen with it, or it goes blind to
a stale path written in an article.

Then decide what `CLAUDE.md` keeps. The index's **scope column** is genuinely
routing information — it is how a reader decides whether a rule is relevant
without opening the article — so the honest outcome may be keeping the index
and merely removing the gate's dependence on it, rather than deleting it.

## Touches

`scripts/agent-doc-check/run.ts` (`gatherCheckInput`, and the `CheckInput`
type), `checks.ts` (`checkRulesNamedInClaudeMd`, whose name would no longer be
accurate), `checks.test.ts`, `run.test.ts`, and `decide.test.ts`. Possibly
`CLAUDE.md`'s index and `.claude/agents/architect.md`, which carries a standing
reminder that check 5 reads `CLAUDE.md` alone.

**This is a `scripts/` slice, and that is the whole reason it was deferred.**
`split-claude-md` stayed inside `.claude/**` + `CLAUDE.md` and so kept the
merge protocol's mutation-invariant exemption; touching `scripts/` voids it and
pulls in `test:scripts`, `crap4ts:scripts`, `dry4ts:scripts` and
`test:mutation:scripts` as well as the full `src/` mutation run.

## Open questions

- **Does widening the check weaken it?** Today's check enforces a real
  invariant beyond "the id is written down somewhere": that `CLAUDE.md`, the
  only auto-loaded file, names every rule. Widening deletes that guarantee. If
  the scope column is worth keeping for routing anyway, the widening buys less
  than it looks — measure what the two-place maintenance actually costs over a
  few slices before spending a `scripts/` slice on it.
- **Which file should the reverse direction read?** A stale `rules/<id>.yml`
  path is likelier in the article, where paths are written in argument prose,
  than in a generated-looking index table.
- Should `checkRulesNamedInClaudeMd` be renamed, given the checker's own module
  comments explain at length why it reads `CLAUDE.md` specifically? Those
  comments are the justification for the current design and would need
  rewriting, not just the identifier.
