---
name: reference-check-cannot-see-a-dot-path
title: Narrow reference-check's leading-dot discard so citations under a dot directory become checkable
created: 2026-09-10
---

## Situation

`scripts/reference-check/references.ts`'s `isDiscardedToken` drops **any** token beginning with `.`.
The intent is to skip dotted-relative noise such as `./name.md` and `../other.ts`. The effect is
wider: every citation of a path under a dot **directory** is discarded too.

Measured by probe during the `lint-pass-regressions` review: a planted citation of
`.vale/STE/ZzzNoSuchRuleFile.yml` produced no finding, while `src/ZzzAlsoMissing.ts` was caught.

## Complication

**A citation that reads as verified and is not is the exact defect this checker exists to catch.**
The discard covers `.vale/`, `.claude/`, `.features-gen/`, `.stryker-tmp*` and `.github/` — and
`.claude/**` is where every article, role file and sidecar lives.

**It also swallows the reference form the docs mandate.** `doc-comments.md` rule 7 requires
`@see {@link ./useZoomGlide.rationale.md}`, and CLAUDE.md branch 4 already records that this form is
unverified for exactly this reason. So the general fact is documented; what is not written down is
that the same discard hides an entire directory class, and that the fix is one predicate.

**The safe direction is not obvious.** Loosening a discard makes a gate stricter, and a checker that
starts failing on previously-green prose is a landmine for whatever slice lands next.

## Question

Can the discard be narrowed to bare-extension relative tokens, without turning every dot-directory
citation into a finding at once?

## Answer

Narrow the predicate from "starts with `.`" to "starts with `./` or `../`", so a leading dot followed
by a **name segment** stays checkable.

Do it in two steps, because step 1 tells you the size of step 2.

1. **Measure first.** Apply the narrowed predicate in a scratch run and count new findings, by
   directory. If `.claude/**` citations all resolve, the change is nearly free. If they do not, the
   findings are real staleness this checker was built to catch, and they are the point.
2. **Then decide the landing shape.** A large finding count may want its own remediation slice ahead
   of the predicate change, so the gate never lands red.

The `{@link ./name.md}` form stays discarded either way — it is genuinely relative, and hover
rendering requires it. That gap is CLAUDE.md branch 4's, and closing it is a different problem.

## Touches

- `scripts/reference-check/references.ts` — one predicate
- `scripts/reference-check/references.test.ts` — cases for `./x.ts` (discarded) against `.vale/x.yml`
  (checked)
- whatever prose the measurement finds stale
- CLAUDE.md branch 4 and `reference-check`'s entry, only if the claim there needs narrowing

`scripts/` work, so it owes CRAP ≤ 6, `npm run test:scripts`, `dry4ts:scripts` and
`test:mutation:scripts`.

## Open questions

- **Does anything cite a dot path that is legitimately absent?** A fresh worktree has no `.vale/`
  until `vale sync` runs, so a citation of `.vale/STE/Contractions.yml` may resolve or not depending
  on machine state. That would make the gate's result depend on setup, which is worse than the
  present silence and may argue for an explicit exclusion rather than a narrowed predicate.
- **Is basename matching enough?** This checker matches by basename everywhere, so a narrowed
  predicate still would not catch a dot-directory file moved to another dot directory.
