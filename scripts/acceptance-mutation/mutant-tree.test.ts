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

  it('throws naming the offending filename when it does not end in .feature', () => {
    expect(() => mutantFeatureFileName('infinite-grid.steps.test.ts', 0)).toThrow(/infinite-grid\.steps\.test\.ts/)
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

  it('throws naming the offending filename when it does not end in .feature', () => {
    expect(() => baselineFeatureFileName('infinite-grid')).toThrow(/infinite-grid/)
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
