---
name: reference-check-reach
title: Close reference-check's three reach gaps in one slice, because two of them are one predicate
created: 2026-09-10
---

## Situation

`reference-check` is the gate that stops a comment or a doc line naming a file that no longer exists.
Three separate changes to it were filed as three ideas. Two of them edit the **same predicate**, so
they cannot run as concurrent slices, and the second to land would rewrite what the first did.

This file is the bundle. It was promoted from `reference-check-does-not-reach-vale-styles`, and folds
in `no-md-reference-is-checked-anywhere` (Wave 1) and `reference-check-cannot-see-a-dot-path`
(Wave 3). The user ruled the bundle on 2026-09-11, accepting that it pulls one entry forward a wave.

**Gap 1 — `vale-styles/` is outside the scan set.** `lint-jsdoc-with-vale` added a tracked directory
holding four rule files, sixteen fixtures and a README. Its comments are unusually citation-dense,
because a Vale rule's header is where the rule records the doc-comments rule it enforces, the corpus
it was measured over, and the fixture that pins it. Measured on the slice branch: **15 distinct
filename tokens**, naming `doc-comments.md`, `prose-linting.md`, `GridToolbar.tsx`,
`useAppearance.ts`, `is-strict-equal.ts`, and each fixture by name. None is checked.
`scan-scope.ts`'s `SOURCE_INCLUDED_PREFIXES` names `src/`, `scripts/`, `features/`, `perf/`, `rules/`
and `rule-tests/`; its doc surface is `CLAUDE.md`, `README.md` and `.claude/**/*.md`. `vale-styles/`
is in neither.

**This is the one property the new directory lacks that `rules/` has**, and the comparison is exact.
Both exist for the same reason: a rule file whose header cites the thing it enforces. They were given
different treatment by accident of ordering, not by a decision.

**Gap 2 — every leading-dot token is discarded, so the mandated sidecar pointer is unverified.**
`references.ts`'s `isDiscardedToken` drops any token starting with `.` as dotted-relative noise. That
is also the exact shape of `@see {@link ./cache.rationale.md}`, the form `doc-comments.md` rule 7
mandates because hover mangles every alternative. Measured by fault injection: breaking that link to
a name resolving to nothing left the gate green with the reference count unmoved. Probing
`extractFileTokens` agrees — `./cache.rationale.md` and `../scrollbars.rationale.md` both yield `[]`,
while `src/cache.rationale.md` yields the token. `src/**/*.md` is outside the scan set too: a made-up
`.ts` token appended to `src/scrollbars.rationale.md` left the gate green at an unchanged 401 files,
while the same line inside `state-flow.md` fails it.

**Gap 3 — the same discard hides every dot directory.** The intent is to skip `./name.md` and
`../other.ts`. The effect is wider: `.vale/`, `.claude/`, `.features-gen/`, `.stryker-tmp*` and
`.github/` are all invisible. Measured by probe during the `lint-pass-regressions` review: a planted
citation of `.vale/STE/ZzzNoSuchRuleFile.yml` produced no finding, while `src/ZzzAlsoMissing.ts` was
caught. **`.claude/**` is where every article, role file and sidecar lives.**

## Complication

**The two folded ideas disagree with each other, and the bundle exists to settle that.**
`no-md-reference-is-checked-anywhere` asks to **resolve** a leading-dot token against the citing
file's own directory. `reference-check-cannot-see-a-dot-path` says the `{@link ./name.md}` form
**stays discarded either way** — it is genuinely relative, hover rendering requires it, and closing
that gap is a different problem. One predicate cannot satisfy both readings, and whichever landed
second would silently overwrite the first. That disagreement is the slice's central question, not a
detail to reconcile at the end.

**Loosening a discard makes a gate stricter**, and a checker that starts failing on previously-green
prose is a landmine for whatever slice lands next. The finding count is unknown until it is measured,
and the triage is likely to be the bulk of the work rather than the predicate.

**Gap 1 has its own unknown: the fixtures are deliberate bait.** They carry prose written to trip a
Vale rule, and `SelfReferentialOpener.good.ts` contains sentences that exist only to be near-misses.
Whether any of that reads as a filename-shaped token or a `<file>'s <symbol>` citation is unknown
until the scan runs. The fixtures are also `.ts`/`.tsx` files that are _entirely_ comment plus a stub
declaration, a shape no other scanned directory has.

**One hazard would make the gate depend on machine state.** A fresh worktree has no `.vale/` until
`vale sync` runs. So a citation of `.vale/STE/Contractions.yml` resolves or not depending on setup,
which is worse than the present silence. That may argue for an explicit exclusion rather than a
narrowed predicate, and it must be settled before Gap 3 lands.

## Question

Can all three gaps close in one slice without the gate ever landing red, and what does the leading-dot
predicate become when the two folded ideas want opposite things from it?

## Sketch

**Measure before editing, three times. Each measurement sizes the work that follows it.**

1. **Widen `scan-scope.ts` to `vale-styles/` in a scratch run and read what it finds.** If the
   fixture bait produces false positives, the choice is between an exemption for the fixture
   directory and rewriting bait that was written to be bait. `vale-styles/JsDoc/README.md` is a `.md`
   outside `.claude/**`, so the doc surface needs a deliberate choice: it is currently an explicit
   three-entry list, not a pattern.
2. **Narrow `isDiscardedToken` from "starts with `.`" to "starts with `./` or `../`" in a scratch
   run, and count new findings by directory.** If `.claude/**` citations all resolve, Gap 3 is nearly
   free. If they do not, the findings are real staleness this checker was built to catch, and they
   are the point. A large count may want its own remediation commit ahead of the predicate change, so
   the gate never lands red.
3. **Then settle the `./name.md` question**, which is the one the two folded ideas disagree on.
   Resolving it against the citing file's directory is a larger change than narrowing a discard, and
   it also wants `src/**/*.md` in the scan set. It may be a fourth step or a separate slice; decide
   with the finding counts in hand, not before.

Order matters: step 2 is a strictly narrower predicate change than step 3, so landing 2 first keeps
the gate green while step 3 is still a question.

## Touches

- `scripts/reference-check/scan-scope.ts` and `references.ts`, plus their tests — a gating checker,
  CRAP <= 6, and it owes `npm run test:scripts`, `dry4ts:scripts` and `test:mutation:scripts`
- Possibly `vale-styles/**` comment text, if the widened scan reports real findings
- Whatever prose the measurements find stale, across `src/`, `.claude/**` and the repo root
- `CLAUDE.md`'s `reference-check` entry, which enumerates the scanned prefixes, and branch 4's claim
  that the `{@link}` form is unverified — narrow that only if step 3 actually lands
- `doc-comments.md` rule 7's gap note, which enumerates four things the checker does not reach

`scripts/**` is on the mutation-invariance **absent** list, so this slice re-arms the full mutation
run by construction.

## Open questions

- **Does the fixture bait produce false positives?** Run the widened scan before deciding the shape.
- **Should the doc surface become a pattern rather than a list?** `vale-styles/JsDoc/README.md` is
  the first `.md` outside `.claude/**` that anyone has wanted checked. A second will follow.
- **Is there a general rule here?** Both `rules/` and `vale-styles/` are "a directory of rule files
  whose headers cite what they enforce". A checker that discovered such directories rather than
  listing them would not have this gap. That may be over-engineering for two instances.
- **Does anything cite a dot path that is legitimately absent?** The `.vale/` case above. An explicit
  exclusion may beat a narrowed predicate.
- **Does the basename-matching convention hold up for `.md`?** This checker matches by basename
  everywhere, which under-reports by design. Basename collisions are likelier among `.md` files, and
  this repo already has `perf/README.md` beside the root one.
- **Is `@see {@link ./name.md}` the form to check, or the bare token?** The braced form is mandated by
  `doc-comments.md` rule 7, so a checker could require it rather than merely resolve it. The two
  forms disagree in the tree today: `{@link}` carries `./`, and every `//`-comment pointer carries
  the repo-relative path, precisely so one of the two is checked.

## Related

`hardener` also found `.claude/agents/articles/quality-tooling.md` calling `.gherkin-lintrc` "a ninth
checker". Under the nine-program census the consistent value is eleventh. That is pre-existing,
predates `lint-jsdoc-with-vale`, and belongs to `architect`; it is noted here only so it is not lost.
