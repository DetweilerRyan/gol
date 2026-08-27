---
name: pin-stryker-seed-to-unblind-the-mutation-gate
title: Pin fast-check's seed under Stryker so property tests can kill mutants at all
created: 2026-08-27
---

## Context

Proven during `scripts-mutation-survivors-untriaged`, and it is a correctness problem rather than
the performance one CLAUDE.md had reserved a slice for.

**A property test can kill a mutant in the suite and be structurally incapable of killing it in the
gate.** `@fast-check/vitest` interpolates the run's seed into the test _title_;
`@stryker-mutator/vitest-runner`'s `mutantRun` filters each run with a `testNamePattern` built from
the **dry run's** titles. The seeds differ, the title never matches, and the property never executes
against any mutant.

Three independent measurements, escalating in directness:

- **A/B on one mutant**, scoped alone, same config both arms: seed free → **Survived (50%)**; seed
  pinned → **Killed (100%)**.
- **Forced inside Stryker's own sandbox**, the property fails there — ruling out a collection gap.
- **Execution trace in the property body**: 100 executions at `activeMutant=undefined` (the dry run)
  and **zero against any mutant**, while a sibling unit test runs against every one.

The apparent fourth arm — `coverageAnalysis: off` also surviving — was chased down and is **not** a
second cause: `off` is inert with this runner, since `vitest-test-runner.js`'s `dryRun` calls
`readMutantCoverage()` unconditionally and core's `hasCoverage` is just `!!staticCoverage`, so
`planMutant` always filters by `coveredBy`. One mechanism explains every arm.

**This falsified a written CLAUDE.md claim** — "no reported score has ever been wrong because of
it" — which is now corrected. The cache reasoning that clause sat in is untouched and still right;
false survivors are a _second, independent_ consequence of the same seed instability.

**The two errors point in opposite directions, which is the subtle part.** A false survivor
_understates_ the score — so the gate has been pessimistic while individual equivalence rulings
made on top of it were optimistic. Nobody has been shipping a falsely-clean number; people have
been ruling mutants equivalent that a property test would have killed.

## Sketch

Pin the seed **only under Stryker**, guarded on `'__stryker__' in globalThis` (the house skip
idiom), leaving `npm run test:property` exploratory. CLAUDE.md already named this as the one
variant that isn't self-defeating; what changed is the reason for doing it.

**What it must demonstrate is a changed survivor set, not a faster run.** The ~10% incremental-cache
floor comes back as a side effect, not the purpose — leading with the speed number would restate
exactly the framing this finding overturned.

**This slice's own demonstration is the `src/` audit; there is no separate audit slice.** Pin the
seed, run `npm run test:mutation:full`, diff the survivor set — anything that flips to Killed was
false. Population to expect: 17 `src/` survivors across 14 property files, of which only those whose
_sole_ plausible killer is a property test are suspect.

**Two caveats to carry into it, both real:**

- That diff is a **lower bound**. A pinned seed freezes one arbitrary draw, so a property that only
  _sometimes_ catches a mutant becomes deterministic about a mutant it may not catch.
- Which is why the **deterministic twin** (an `it.each` with stable titles beside the property) is
  the right interim tool and not an embarrassment: _a twin says which inputs matter; a pinned seed
  just freezes a draw._

## Touches

`vite.config.ts` or a test-setup module for the guarded pin, `stryker.config.json` /
`stryker.scripts.config.json` if the guard needs a hook, and every `*.property.test.ts` if the pin
has to be per-file rather than global. Then a full `test:mutation:full` on both scopes, and CLAUDE.md's
`@fast-check/vitest` paragraph, which currently describes the finding but not its fix.

**Expect the score to move up**, and expect that to need explaining under merge-protocol step 8 in
the unusual direction: mutants that were never being tested now are.

## Open questions

- **Per-file, global, or in `test-setup`?** A global pin is one line but reaches files that don't
  need it; per-file is honest but touches 14+ files and can drift.
- **Does a pinned seed under Stryker weaken the property layer's own value?** It shouldn't —
  `npm run test:property` stays exploratory and is where new counterexamples are meant to surface —
  but that split needs stating in the file, or someone will later pin it everywhere for consistency.
- **Is the `it.each` twin pattern worth generalising** to every property whose sole subject is a
  mutable module, or is it per-survivor remediation? Two exist now (`analyze.property.test.ts`'s and
  its `it.each` sibling); a third would suggest a convention.
