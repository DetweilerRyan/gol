---
name: json-citations-are-unchecked-and-need-two-predicates
title: Adding json to reference-check needs the dotfile predicate moved with it, and a generated-artifact policy first
created: 2026-09-11
---

## Situation

`reference-check-reach` widened `references.ts`'s `EXTENSION_ALTERNATION` from `tsx|ts|yaml|yml|md`
to add `sh`, and deliberately left `json` off. Every `package.json`, `stryker.config.json`,
`mutation-invariance.config.json` and `tsconfig.*.json` citation across `CLAUDE.md` and the articles
is therefore still unchecked — real tracked files that a rename would strand.

**This entry exists because the evidence was about to be lost.** It lived only in
`ideas/todo/reference-check-reach.md`, which that slice correctly deleted as part of its own work.
Recoverable at `git show b1508ab:ideas/todo/reference-check-reach.md`, and the substance is below so
nobody has to.

## Complication

**Measured 2026-09-11 during that slice's design pass: adding `json` yields 30 findings, and all 30
are generated or vendored artifacts.** `coverage/coverage-final.json` at 7 sites,
`reports/stryker-incremental*.json` at 5, `reports/gherkin-dry/report.json` at 4,
`reports/perf/latest.json` at 4, plus `dist/` and `node_modules/oxlint/configuration_schema.json`
at 2.

So this is not a reach gap in the way the other four were. **It is a generated-artifact policy
question**, and at roughly 33 sites across about 15 files it wants a mechanism rather than
hand-written markers. The class is already unified and already visible at small scale: `.vale/STE/Contractions.yml`
and `reports/perf/latest.md` are the same problem seen at one and two sites, and both carry markers
today. One site is a marker; thirty-three sites are a mechanism.

**There is an interaction, and it is the reason this cannot be a one-token edit.** The same slice
changed `isDiscardedToken` to discard any token whose **basename** starts with `.`. The only tracked
files whose basename begins with a dot are `.oxlintrc.json`, `.dry4tsrc.json` and `.prettierrc.json`
— all three `.json`. So the moment `json` joins the alternation, those three are extracted and then
**silently discarded** by the dot predicate. Adding `json` alone would produce a checker that claims
to check `.json` citations and quietly exempts exactly the dotfile configs most likely to be renamed.

**The two predicates have to move together.** That is the fact this entry exists to preserve.

## Question

What distinguishes a citation of a generated artifact from a citation of a tracked config, and can a
predicate tell them apart without a marker per site?

## Sketch

Settle the policy before touching the alternation. Candidate shapes, none endorsed:

- **A generated-path exclusion list** in `scan-scope.ts`, mirroring the existing excluded-dir
  mechanism. Cheap, and it fails safe — an unlisted generated path just produces a finding.
- **Resolve against the tracked set only**, which is already what `file-reference-resolves` does. The
  30 findings exist precisely because those artifacts are _not_ tracked, so the honest reading is
  that a citation of an untracked generated file is a different category rather than a stale
  reference. That argues for a category, not an exclusion.
- **Leave `json` off and say so in `references.ts`'s comment**, which is the status quo made explicit.
  A measured refutation closes the question permanently and is a legitimate outcome.

Whichever is chosen, the dotfile interaction above must be handled in the same change, with a test
that pins `.oxlintrc.json` as **checked** rather than discarded.

## Touches

- `scripts/reference-check/references.ts` and `scan-scope.ts`, plus tests — a gating checker, CRAP <= 6
- Whatever prose the widened scan finds stale
- `CLAUDE.md`'s `reference-check` entry

`scripts/**` is on the mutation-invariance **absent** list, so this re-arms the full mutation run by
construction.

## Open questions

- **Is the alternation the right shape at all?** It has now rotted twice — `md` was added late, `sh`
  later still, and `json` is outstanding. A shape-based grammar (a token carrying a `/`, or a
  known-extension suffix) may under-report less than a list nobody remembers to extend. Probe before
  choosing.
- **Does `yaml|yml` have the same generated-artifact exposure?** Nobody has looked.
