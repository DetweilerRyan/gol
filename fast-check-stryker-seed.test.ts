import { it as fcIt } from '@fast-check/vitest'
import * as fc from 'fast-check'
import { afterEach, describe, expect, it } from 'vitest'
import {
  isRunningUnderStryker,
  pinFastCheckSeedUnderStryker,
  STRYKER_PINNED_SEED,
  withStrykerPinnedSeed,
} from './fast-check-stryker-seed.ts'

// Captured once, at module load, before anything below observes or mutates
// globalThis.__stryker__ itself. This file is never actually collected by
// Stryker today -- it imports nothing from src/ or scripts/, so
// coverageAnalysis: "perTest"'s related-file filtering never selects it for
// any mutant run (see @stryker-mutator/vitest-runner's own `vitest.related`
// handling) -- but every test below is written as though it might be,
// because a related-file filter is exactly the kind of thing that silently
// stops applying with nothing failing loudly (see CLAUDE.md's own
// catalogue of globs that match nothing without a warning). If __stryker__
// is already present when this module loads, it's the real namespace
// Stryker's own prepended setup file created for this test run (see
// fast-check-stryker-seed.ts's header comment on `isRunningUnderStryker`)
// -- every branch below leaves that object alone rather than overwriting or
// deleting it, and skips the assertions that can only hold in a genuinely
// unpinned process.
const underStryker = isRunningUnderStryker()

// Every test here restores whatever global fast-check config it observed on
// entry -- this file deliberately mutates it, and a leaked pin would
// silently destabilize every *.property.test.ts file collected in the same
// worker. Never touches globalThis.__stryker__ itself when underStryker is
// true, for the reason above.
function withRestoredGlobalState(run: () => void) {
  const priorGlobalParameters = fc.readConfigureGlobal()
  try {
    run()
  } finally {
    fc.configureGlobal(priorGlobalParameters)
    if (!underStryker) delete (globalThis as Record<string, unknown>).__stryker__
  }
}

describe('isRunningUnderStryker', () => {
  afterEach(() => {
    // Only ever clean up a namespace this describe block created itself --
    // never the real one, if this file is somehow running under actual
    // Stryker.
    if (!underStryker) delete (globalThis as Record<string, unknown>).__stryker__
  })

  it.skipIf(underStryker)('is false when globalThis carries no __stryker__ namespace', () => {
    expect('__stryker__' in globalThis).toBe(false)
    expect(isRunningUnderStryker()).toBe(false)
  })

  it('is true once the instrumented bootstrap has created __stryker__', () => {
    if (!underStryker) (globalThis as Record<string, unknown>).__stryker__ = {}
    expect(isRunningUnderStryker()).toBe(true)
  })
})

describe('withStrykerPinnedSeed', () => {
  it('sets seed to the fixed constant', () => {
    expect(withStrykerPinnedSeed({}).seed).toBe(STRYKER_PINNED_SEED)
  })

  it('preserves every other already-configured global parameter -- configureGlobal replaces rather than merges, so dropping this would silently undo whatever else set global config', () => {
    const withOtherSettings: fc.GlobalParameters = { numRuns: 50, verbose: 2, seed: 1 }
    const result = withStrykerPinnedSeed(withOtherSettings)
    expect(result.numRuns).toBe(50)
    expect(result.verbose).toBe(2)
    expect(result.seed).toBe(STRYKER_PINNED_SEED)
  })

  it('is pure -- does not mutate the parameters object it was handed', () => {
    const original: fc.GlobalParameters = { numRuns: 10 }
    withStrykerPinnedSeed(original)
    expect(original).toEqual({ numRuns: 10 })
  })
})

describe('pinFastCheckSeedUnderStryker', () => {
  // Only meaningful when this process is genuinely unpinned -- there's no
  // way to fake "not under Stryker" while the real namespace is present
  // without deleting it, which this file never does (see underStryker
  // above).
  it.skipIf(underStryker)('does not touch global fast-check config when not running under Stryker', () => {
    withRestoredGlobalState(() => {
      fc.configureGlobal({ numRuns: 7 })
      pinFastCheckSeedUnderStryker()
      expect(fc.readConfigureGlobal()).toEqual({ numRuns: 7 })
    })
  })

  it('pins the global seed to the fixed constant when running under Stryker', () => {
    withRestoredGlobalState(() => {
      if (!underStryker) (globalThis as Record<string, unknown>).__stryker__ = {}
      fc.configureGlobal({ numRuns: 7 })
      pinFastCheckSeedUnderStryker()
      expect(fc.readConfigureGlobal()).toEqual({ numRuns: 7, seed: STRYKER_PINNED_SEED })
    })
  })
})

// The demonstration this slice actually has to produce: not that the seed
// value is pinned (the suites above already show that), but that the
// *generated test title* -- the exact string @fast-check/vitest's
// testNamePattern has to match between a dry run and a mutant run -- stops
// varying once the pin is in effect, and still varies when it isn't.
//
// @fast-check/vitest computes and bakes the seed into the title at
// test-declaration time (inside buildTestWithPropRunner, called
// synchronously when `it.prop([...])(...)` runs during collection) -- so
// the __stryker__ flag and the pin have to be set *before* each `it.prop`
// call below, not inside its body. Each test body then records its own
// final title via expect.getState().currentTestName so a later assertion
// can compare them once all four have actually run.
// Titles carry each test's own declared label ("pinned property A" vs.
// "pinned property B") ahead of the seed marker, so the comparison this
// slice actually needs to make is over the seed each title carries, not
// over the whole string -- two titles with different labels always differ,
// pinned or not, which would make the "still varies without the guard"
// half of the demonstration trivially true for the wrong reason.
function extractSeedMarker(title: string | undefined): string {
  const match = title?.match(/\(with seed=-?\d+\)$/)
  if (!match) throw new Error(`test title carried no seed marker: ${title}`)
  return match[0]
}

describe('fast-check-stryker-seed - generated title stability', () => {
  const observedTitles: Record<string, string | undefined> = {}

  // Unpinned: two independently-declared property tests each draw
  // `Date.now() ^ Math.random() * 4294967296` for their own seed, so their
  // titles diverge -- this is "still varies without the guard."
  fcIt.prop([fc.integer()])('unpinned property A', () => {
    observedTitles.unpinnedA = expect.getState().currentTestName
  })
  fcIt.prop([fc.integer()])('unpinned property B', () => {
    observedTitles.unpinnedB = expect.getState().currentTestName
  })

  // Simulate a Stryker-invoked process: set the namespace the instrumented
  // bootstrap creates (unless it's already real -- see underStryker above),
  // then pin -- exactly what this module's own setupFiles side effect does
  // at import time in a real run. Both `it.prop` calls below are declared
  // with the pin already in effect, so both compute the same fixed seed --
  // this is "no longer varies under the guard." Restored afterward exactly
  // as narrowly as it was changed: the fast-check config always (this
  // describe's own state), the namespace only if this describe created it.
  const priorGlobalParameters = fc.readConfigureGlobal()
  if (!underStryker) (globalThis as Record<string, unknown>).__stryker__ = {}
  pinFastCheckSeedUnderStryker()

  fcIt.prop([fc.integer()])('pinned property A', () => {
    observedTitles.pinnedA = expect.getState().currentTestName
  })
  fcIt.prop([fc.integer()])('pinned property B', () => {
    observedTitles.pinnedB = expect.getState().currentTestName
  })

  if (!underStryker) delete (globalThis as Record<string, unknown>).__stryker__
  fc.configureGlobal(priorGlobalParameters)

  // Only meaningful when this process is genuinely unpinned -- if
  // underStryker is true, the real setupFiles pin already fired before this
  // module loaded, so "unpinned property A/B" above were never actually
  // unpinned and this assertion would be false for a reason unrelated to
  // what it's checking.
  it.skipIf(underStryker)('carries a varying seed marker across two unpinned declarations', () => {
    expect(extractSeedMarker(observedTitles.unpinnedA)).not.toBe(extractSeedMarker(observedTitles.unpinnedB))
  })

  it('carries an identical, fixed seed marker across two pinned declarations', () => {
    const pinnedMarker = extractSeedMarker(observedTitles.pinnedA)
    expect(pinnedMarker).toBe(extractSeedMarker(observedTitles.pinnedB))
    expect(pinnedMarker).toBe(`(with seed=${STRYKER_PINNED_SEED})`)
  })
})
