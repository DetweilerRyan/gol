import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeFile } from '../test-support.ts'
import { discoverTargets, filterTargets, pairTargets, parseArgs } from './discovery.ts'

describe('pairTargets', () => {
  it('pairs each feature with its .steps.test.ts file', () => {
    const targets = pairTargets(
      ['alpha.feature', 'beta.feature'],
      ['alpha.feature', 'alpha.steps.test.ts', 'beta.feature', 'beta.steps.test.ts'],
    )
    expect(targets).toEqual([
      { feature: 'alpha.feature', steps: 'alpha.steps.test.ts' },
      { feature: 'beta.feature', steps: 'beta.steps.test.ts' },
    ])
  })

  it('accepts a .steps.test.tsx pairing, the RTL-migration form', () => {
    const targets = pairTargets(['alpha.feature'], ['alpha.feature', 'alpha.steps.test.tsx'])
    expect(targets).toEqual([{ feature: 'alpha.feature', steps: 'alpha.steps.test.tsx' }])
  })

  it('throws naming the feature when no steps file matches it', () => {
    expect(() => pairTargets(['alpha.feature'], ['alpha.feature'])).toThrow(/alpha\.feature/)
  })

  it('throws naming both matches, comma-separated, when a feature matches both a .ts and a .tsx steps file', () => {
    expect(() =>
      pairTargets(['alpha.feature'], ['alpha.feature', 'alpha.steps.test.ts', 'alpha.steps.test.tsx']),
    ).toThrow(/alpha\.steps\.test\.ts, alpha\.steps\.test\.tsx/)
  })

  it('throws naming both orphans, comma-separated, when more than one steps file has no matching feature', () => {
    expect(() =>
      pairTargets(
        ['alpha.feature'],
        ['alpha.feature', 'alpha.steps.test.ts', 'orphan-one.steps.test.ts', 'orphan-two.steps.test.ts'],
      ),
    ).toThrow(/orphan-one\.steps\.test\.ts, orphan-two\.steps\.test\.ts/)
  })

  it('ignores files that are neither a .feature nor a .steps.test file', () => {
    const targets = pairTargets(['alpha.feature'], ['alpha.feature', 'alpha.steps.test.ts', 'README.md', 'helper.ts'])
    expect(targets).toEqual([{ feature: 'alpha.feature', steps: 'alpha.steps.test.ts' }])
  })

  // Pins the trailing `$` in STEPS_SUFFIX: without it, a file merely
  // *starting with* `.steps.test.ts` -- not just ending with it -- would
  // enter stepsFiles, fail the exact-equality pairing check against any
  // feature, and surface as a spurious orphan even though it should be
  // ignored exactly like README.md/helper.ts above.
  it('ignores a file with extra trailing characters after .steps.test.ts, same as any other unrelated file', () => {
    const targets = pairTargets(['alpha.feature'], ['alpha.feature', 'alpha.steps.test.ts', 'alpha.steps.test.ts.bak'])
    expect(targets).toEqual([{ feature: 'alpha.feature', steps: 'alpha.steps.test.ts' }])
  })
})

describe('discoverTargets', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  function tempFeaturesDir(): string {
    dir = mkdtempSync(path.join(os.tmpdir(), 'acceptance-mutation-discovery-'))
    return dir
  }

  it('reads the real directory rather than a hardcoded list', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'alpha.feature', 'Feature: Alpha\n')
    writeFile(featuresDir, 'alpha.steps.test.ts', '')
    expect(discoverTargets(featuresDir)).toEqual([{ feature: 'alpha.feature', steps: 'alpha.steps.test.ts' }])
  })

  it('fails loudly when the directory has no .feature files at all', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'notes.txt', 'nothing here')
    expect(() => discoverTargets(featuresDir)).toThrow(/no \.feature files/i)
  })
})

describe('filterTargets', () => {
  const targets = [
    { feature: 'alpha.feature', steps: 'alpha.steps.test.ts' },
    { feature: 'beta.feature', steps: 'beta.steps.test.ts' },
  ]

  it('returns every target when no filter is given', () => {
    expect(filterTargets(targets, undefined)).toBe(targets)
  })

  it('narrows to the one matching feature, accepting the bare name', () => {
    expect(filterTargets(targets, 'beta')).toEqual([{ feature: 'beta.feature', steps: 'beta.steps.test.ts' }])
  })

  it('narrows to the one matching feature, accepting the .feature suffix', () => {
    expect(filterTargets(targets, 'beta.feature')).toEqual([{ feature: 'beta.feature', steps: 'beta.steps.test.ts' }])
  })

  it('throws loudly on an unknown feature name rather than matching nothing silently', () => {
    expect(() => filterTargets(targets, 'nonexistent')).toThrow(/nonexistent/)
  })
})

describe('parseArgs', () => {
  it('returns no feature filter when --feature is absent', () => {
    // toStrictEqual, not toEqual: the ternary in parseArgs returns `{}` in this
    // branch specifically so the key is absent, not merely `undefined` --
    // toEqual treats `{ feature: undefined }` and `{}` as equal and would miss
    // a mutant that collapsed the ternary to always return `{ feature }`.
    expect(parseArgs([])).toStrictEqual({})
  })

  it('captures the value following --feature', () => {
    expect(parseArgs(['--feature', 'camera-pan-and-zoom'])).toEqual({ feature: 'camera-pan-and-zoom' })
  })

  it('throws when --feature is the last argument with no value', () => {
    expect(() => parseArgs(['--feature'])).toThrow(/--feature requires a value/)
  })

  // The hazard this closes: `npm run acceptance-mutation -- infinite-grid` was
  // silently ignoring the positional argument and running the full,
  // unscoped suite while printing output indistinguishable from a genuinely
  // scoped run. Throwing here matches filterTargets' existing philosophy of
  // failing loudly rather than doing something other than what was asked.
  it('throws naming a bare positional argument rather than silently ignoring it', () => {
    expect(() => parseArgs(['infinite-grid'])).toThrow(/infinite-grid/)
  })

  it('throws naming an unrecognized flag rather than silently ignoring it', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/--nope/)
  })

  it('throws naming the first unrecognized argument, stating the accepted form', () => {
    expect(() => parseArgs(['--other', 'x', '--feature', 'infinite-grid'])).toThrow(/--other.*--feature <name>/)
  })
})
