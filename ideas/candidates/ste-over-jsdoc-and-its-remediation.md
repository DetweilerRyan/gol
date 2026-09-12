---
name: ste-over-jsdoc-and-its-remediation
title: Run the STE style over JSDoc blocks, and remediate what it finds in the same slice
created: 2026-09-10
---

> Carried out of `lint-jsdoc-with-vale`'s design before that candidate was deleted. That slice shipped
> the plumbing and the four repo-authored `JsDoc` rules; this is the half it deliberately descoped.
> **The design pass ratified the split and the ordering**, so this is not a fresh proposal — read
> `.claude/agents/articles/prose.md` and its rationale sidecar first, which carry every
> measurement that survived.

## Context

`.vale.ini` runs the `STE` style over `.claude/**`, `CLAUDE.md` and `src/**/*.md`. It does **not** run
it over `.ts` or `.tsx`. So a JSDoc hover is linted by the four `JsDoc` rules and by nothing else: no
sentence-length cap, no contraction check, no paragraph-length cap, on prose a reader hovers as often
as any article.

The design pass measured the yield and then refused to land the section alone, because the section
alone is a backlog nobody has triaged — the constraint now written into `prose.md` under
"Enabling, disabling or re-levelling a rule". That is what makes this a slice rather than a config
line.

## Sketch

One config section and its remediation, as one commit sequence, never apart.

- A section enabling `STE` over the comment surface, scoped so it reaches JSDoc blocks.
- Remediation of every finding, in the same slice.

**The remedy is often placement rather than prose**, and that is what makes this different from an
article lint pass. An over-long sentence in an article gets split. In a hover it may mean the content
does not belong in the interface at all: `doc-comments.md` rule 4 sends implementation detail to `//`
and rule 7 sends overflow to a sidecar. Splitting in place clears the finding and leaves the defect.

Three measured facts that shape the work, all in `prose.rationale.md`:

- `ProcedureLength` and `OneInstruction` reach a Markdown list inside a hover and reach a `@param` or
  `@returns` tag line not at all.
- `ParagraphLength` remediation costs hover height where `SentenceLength` remediation does not — a
  paragraph split inserts a blank ` *` line, which spends one of `doc-comments.md` rule 6's budget.
- `block` scope never sees a single-line `/** ... */`, so this surface has the same blind spot the
  `JsDoc` rules have.

## Touches

`.vale.ini` (one section), and comment-only edits across `src/` and `scripts/`. Possibly
`prose.md` for a `@returns` exempt class. No `src/` logic.

## Open questions

- **Does the intersection caveat between `prose.md` and `doc-comments.md` hold?** Still open,
  inherited from the design pass rather than raised here. The do-not-merge ruling stands and nothing
  has been found against it: the two articles govern different dimensions, so the design wanted a
  cross-link rather than a merge. Recovered during the sweep that deleted the design pass's own file,
  which is the only reason it survived.
- **Does `@returns` need an exempt class of its own?** A `@returns` noun phrase reads as passive
  ("The value that is returned by the caller") and is conventional rather than wrong. The finding is
  measured; the remedy is not.
- **What does the corpus actually yield today?** Every figure the design pass took came from a corpus
  defined by a command that no longer describes this tree, and is superseded rather than carried
  forward. Re-derive before scoping, and record the command with the number.
- **Does `STE.SentenceLength` need a comment scope, and can it have one?** This is the trap:
  `extends:` with an added scope destroys the parent's `scope: sentence` and the counter silently
  starts measuring whole blocks. Measured, and recorded in `prose.rationale.md`.
- **Is the `.test.ts` register a problem here?** Closed for the `JsDoc` rules, open for this one —
  those rules yielded too few findings for the question to bite.
- **Does the volume want its own orchestration answer?** Comment-only edits at this scale look closer
  to the role-file lint passes than to a feature slice.
