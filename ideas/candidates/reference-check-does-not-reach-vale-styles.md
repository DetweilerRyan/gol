---
name: reference-check-does-not-reach-vale-styles
title: Bring vale-styles/ into reference-check's scan scope
created: 2026-09-10
---

## Context

`lint-jsdoc-with-vale` added `vale-styles/`, a tracked directory holding four rule files, sixteen
fixtures and a README. Its comments are unusually citation-dense, because a Vale rule's header is
where the rule records the doc-comments rule it enforces, the corpus it was measured over, and the
fixture that pins it. Measured on the slice branch: **15 distinct filename tokens** across the
directory, naming `doc-comments.md`, `prose-linting.md`, `GridToolbar.tsx`, `useAppearance.ts`,
`is-strict-equal.ts`, and each fixture by name.

None of them is checked. `scripts/reference-check/scan-scope.ts` sets

```
SOURCE_INCLUDED_PREFIXES = ['src/', 'scripts/', 'features/', 'perf/', 'rules/', 'rule-tests/']
```

and its doc surface is `CLAUDE.md`, `README.md` and `.claude/**/*.md`. `vale-styles/` is in neither
list, so a rename anywhere it cites goes unreported.

Found by `hardener` at the slice's gate, and ruled out of remit there for a good reason: widening a
gating checker's scan scope is a behaviour change that needs its own tests, not a remediation.

**This is the one property the new directory lacks that `rules/` has.** The comparison is exact and
is what makes the gap worth closing rather than tolerating. `rules/` and `rule-tests/` are both in
scope, and they exist for the same reason `vale-styles/` does: a rule file whose header cites the
thing it enforces. The two directories were given different treatment by accident of ordering, not
by a decision.

## Sketch

Adding `'vale-styles/'` to the prefix list is one line, and it is not the work. The work is what the
scan then finds, and whether the checker's existing rules fit a surface it has never seen.

Points to settle before the one-line change:

- The fixtures are **deliberate bait**. They carry prose written to trip a Vale rule, and
  `SelfReferentialOpener.good.ts` in particular contains sentences that exist only to be near-misses.
  Whether any of that reads as a filename-shaped token or a `<file>'s <symbol>` citation is unknown
  until the scan runs.
- The scan reads `.ts`/`.tsx`/`.yml`/`.yaml` comment lines. The fixtures are `.ts`/`.tsx` files that
  are _entirely_ comment plus a stub declaration, which is a shape no other scanned directory has.
- `vale-styles/JsDoc/README.md` is a `.md` file outside `.claude/**`, so it needs a deliberate choice:
  the doc surface is currently an explicit three-entry list, not a pattern.

## Touches

- `scripts/reference-check/scan-scope.ts` and its tests — gating checker, CRAP <= 6
- Possibly `vale-styles/**` comment text, if the scan reports real findings
- CLAUDE.md's `reference-check` entry, which enumerates the scanned prefixes

`scripts/**` is on the mutation-invariance `absent` list, so this slice re-arms the full mutation run
by construction.

## Open questions

- **Does the fixture bait produce false positives?** Run the widened scan before deciding the shape.
  If it does, the choice is between an exemption for `vale-styles/fixtures/` and rewriting bait that
  was written to be bait.
- **Should the doc surface become a pattern rather than a list?** `vale-styles/JsDoc/README.md` is
  the first `.md` outside `.claude/**` that anyone has wanted checked. A second one will follow.
- **Is there a general rule here?** Both `rules/` and `vale-styles/` are "a directory of rule files
  whose headers cite what they enforce". A checker that discovered such directories rather than
  listing them would not have this gap. That may be over-engineering for two instances.

## Related

`hardener` also found `.claude/agents/articles/quality-tooling.md:72` calling `.gherkin-lintrc` "a
ninth checker". Under the nine-program census the consistent value is eleventh. That is pre-existing,
predates this slice, and belongs to `architect`; it is noted here only so it is not lost.
