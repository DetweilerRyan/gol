import { describe, expect, it } from 'vitest'
import { baselineFeatureFileName, mutantFeatureFileName, specFileName } from './mutant-tree.ts'

describe('mutantFeatureFileName', () => {
  it('names the first mutant with the target base name and ordinal 0', () => {
    expect(mutantFeatureFileName('infinite-grid.feature', 0)).toBe('infinite-grid.mutant-0.feature')
  })

  it('names a later mutant with its own ordinal', () => {
    expect(mutantFeatureFileName('infinite-grid.feature', 12)).toBe('infinite-grid.mutant-12.feature')
  })

  // The load-bearing property: names for different targets never collide,
  // even at the same ordinal, because every mutant for every target lands
  // in one shared temp `features/` directory (the batched design).
  it('stays distinct across different targets at the same ordinal', () => {
    expect(mutantFeatureFileName('infinite-grid.feature', 0)).not.toBe(
      mutantFeatureFileName('camera-pan-and-zoom.feature', 0),
    )
  })

  it('leaves a flat (non-nested) target path unchanged, other than appending the ordinal', () => {
    expect(mutantFeatureFileName('infinite-grid.feature', 3)).toBe('infinite-grid.mutant-3.feature')
  })
})

describe('baselineFeatureFileName', () => {
  it('names the baseline with the target base name', () => {
    expect(baselineFeatureFileName('infinite-grid.feature')).toBe('infinite-grid.baseline.feature')
  })

  it('stays distinct across different targets', () => {
    expect(baselineFeatureFileName('infinite-grid.feature')).not.toBe(
      baselineFeatureFileName('camera-pan-and-zoom.feature'),
    )
  })

  it('stays distinct from any mutant filename for the same target', () => {
    expect(baselineFeatureFileName('infinite-grid.feature')).not.toBe(mutantFeatureFileName('infinite-grid.feature', 0))
  })
})

// Both mutantFeatureFileName and baselineFeatureFileName funnel through the
// same private baseName() validation in mutant-tree.ts, so its three
// behaviors -- non-.feature rejection, nested-path flattening, and
// underscore rejection -- are each one behavior tested twice (once per
// public function) rather than duplicated as near-identical `it`s per
// function. One shared deriver table, reused across all three, so the
// duplication doesn't just move into the table itself.
const derivers = [
  { name: 'mutantFeatureFileName', derive: (f: string) => mutantFeatureFileName(f, 0), flattenedSuffix: 'mutant-0' },
  { name: 'baselineFeatureFileName', derive: baselineFeatureFileName, flattenedSuffix: 'baseline' },
]

describe('shared baseName validation', () => {
  it.each(derivers)('$name rejects a filename that does not end in .feature', ({ derive }) => {
    expect(() => derive('infinite-grid.steps.test.ts')).toThrow(/infinite-grid\.steps\.test\.ts/)
  })

  // A nested target's path is flattened into a single flat filename -- '/'
  // becomes '__' -- so it can be written straight into the one shared temp
  // `features/` directory, which has no subdirectories of its own.
  it.each(derivers)('$name flattens a nested target path into a flat filename', ({ derive, flattenedSuffix }) => {
    expect(derive('cell-life/cell-life.feature')).toBe(`cell-life__cell-life.${flattenedSuffix}.feature`)
  })

  it.each(derivers)('$name throws naming the path when a nested target path contains an underscore', ({ derive }) => {
    expect(() => derive('cell_life/cell-life.feature')).toThrow(/cell_life\/cell-life\.feature/)
  })
})

describe('specFileName', () => {
  // Pinned against a real bddgen run (playwright-bdd 9.2.0) with
  // featuresRoot/outputDir overridden the same way
  // playwright.acceptance-mutation.config.ts overrides them: flat, one spec
  // per feature file, named by appending .spec.js.
  it('appends .spec.js to a mutant feature filename', () => {
    expect(specFileName('infinite-grid.mutant-0.feature')).toBe('infinite-grid.mutant-0.feature.spec.js')
  })

  it('appends .spec.js to a baseline feature filename', () => {
    expect(specFileName('infinite-grid.baseline.feature')).toBe('infinite-grid.baseline.feature.spec.js')
  })

  it('round-trips through mutantFeatureFileName for an arbitrary target and ordinal', () => {
    const featureFileName = mutantFeatureFileName('camera-pan-and-zoom.feature', 7)
    expect(specFileName(featureFileName)).toBe('camera-pan-and-zoom.mutant-7.feature.spec.js')
  })
})
