import * as fc from 'fast-check'

// Shared between vite.config.ts's `property` vitest project and
// vitest.scripts.config.ts (see both files' setupFiles) -- a fast-check
// seed pin that fixes a correctness bug rather than a wall-clock one.
//
// @fast-check/vitest interpolates the seed it draws into the test *title*
// (`${label} (with seed=${seed})` -- see
// node_modules/@fast-check/vitest/lib/vitest-fast-check.js's
// buildTestWithPropRunner). @stryker-mutator/vitest-runner filters each
// mutant run with a testNamePattern built from the *dry run's* titles. Left
// unpinned, the seed is `Date.now() ^ Math.random() * 4294967296` -- drawn
// fresh at test-declaration time in every process -- so the dry run's title
// and the mutant run's title (two different process invocations) never
// match, the pattern excludes the test, and the property body never
// executes against any mutant. It reads as "covered but always survives,"
// which looks like an equivalent mutant and isn't one.
//
// Pinning the seed only when running under Stryker fixes this without
// touching npm run test:property, which stays exploratory (a fixed seed
// there would delete that layer's whole value -- finding new
// counterexamples across runs).
//
// isRunningUnderStryker's `'__stryker__' in globalThis` check is the
// existing house idiom (see .claude/agents/articles/engineering.md and
// src/hooks/useLiveCell.test.ts / src/components/Grid.test.tsx for prior
// use). It reads true in BOTH phases this pin needs to agree across, and
// crucially, *before* this module's own setupFiles side effect below even
// runs -- not just before some later test body executes. Verified against
// @stryker-mutator/vitest-runner@10.0.0's own source rather than assumed:
// its VitestTestRunner#init (vitest-test-runner.js) prepends its own
// `stryker-setup.js` to *every* vitest project's `setupFiles` array
// (`project.config.setupFiles = [this.localSetupFile, ...project.config.setupFiles]`,
// looped over `this.ctx.projects.forEach`), so it always loads before any
// setupFiles this repo's own configs list -- including this file. And
// stryker-setup.js creates the namespace unconditionally at its own module
// top (`globalThis[globalNamespace] || (globalThis[globalNamespace] = {})`),
// before branching on dry-run vs. mutant mode, so it's present by the time
// this file's own top-level pinFastCheckSeedUnderStryker() call runs in
// *both* phases -- which is exactly the property the pin depends on: a
// title baked in during the dry run has to still match during a mutant
// run, in a different process.
export function isRunningUnderStryker(): boolean {
  return '__stryker__' in globalThis
}

// The value itself carries no meaning -- only that it never changes between
// one Stryker-invoked vitest process and the next, which is the entire
// property this pin exists to guarantee.
export const STRYKER_PINNED_SEED = 424242

// Pure: what the global fast-check config should look like once pinning has
// already been decided on. Spreads the existing config rather than
// replacing it outright -- fc.configureGlobal *replaces* global config, it
// doesn't merge, so a bare `{ seed }` here would silently drop any other
// global parameter something else in this repo (or a future slice) sets.
// Kept separate from the isRunningUnderStryker() decision and the
// fc.configureGlobal side effect below so this merge behavior is testable
// on its own, without touching fast-check's actual global state.
export function withStrykerPinnedSeed(currentGlobalParameters: fc.GlobalParameters): fc.GlobalParameters {
  return { ...currentGlobalParameters, seed: STRYKER_PINNED_SEED }
}

// The side effect a setupFiles entry actually needs. Deliberately a no-op
// -- doesn't call fc.configureGlobal at all -- when not running under
// Stryker, so npm run test:property (and every other non-Stryker run)
// never touches fast-check's global config here.
export function pinFastCheckSeedUnderStryker(): void {
  if (!isRunningUnderStryker()) return
  fc.configureGlobal(withStrykerPinnedSeed(fc.readConfigureGlobal()))
}

// The trade this accepts, and it's real: pinning fixes one arbitrary draw
// per property, for the whole run. A property that only *sometimes* catches
// a given mutant (across the many draws an unpinned run would eventually
// try) becomes deterministic about a mutant it may not catch with this
// particular draw -- so a mutant surviving under the pin is not proof
// nothing here can kill it, only that this one draw doesn't. That's strictly
// better than the status quo (never running against any mutant at all), and
// it's why a deterministic `it.each` twin beside a property -- see
// scripts/gherkin-dry-checker/analyze.property.test.ts and its sibling --
// remains the right tool for a specific survivor rather than something to
// feel bad about reaching for: a twin states which inputs matter, where a
// pinned seed just freezes a draw.

// Runs once per worker at setupFiles load time, exactly like
// src/test-setup.ts's own top-level afterEach registration -- a setupFiles
// module's job is to perform its effect at import time, not to be called by
// something else.
pinFastCheckSeedUnderStryker()
