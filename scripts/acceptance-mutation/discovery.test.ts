import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeFile } from '../test-support.ts'
import { discoverTargets, filterTargets, parseArgs } from './discovery.ts'

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

  it('derives one target per .feature file, without requiring a steps file to exist', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'alpha.feature', 'Feature: Alpha\n')
    expect(discoverTargets(featuresDir)).toEqual([{ feature: 'alpha.feature' }])
  })

  it('sorts every .feature file and ignores unrelated files, including a steps file', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'beta.feature', 'Feature: Beta\n')
    writeFile(featuresDir, 'alpha.feature', 'Feature: Alpha\n')
    writeFile(featuresDir, 'alpha.steps.test.ts', '')
    writeFile(featuresDir, 'README.md', 'notes')
    expect(discoverTargets(featuresDir)).toEqual([{ feature: 'alpha.feature' }, { feature: 'beta.feature' }])
  })

  it('fails loudly when the directory has no .feature files at all', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'notes.txt', 'nothing here')
    expect(() => discoverTargets(featuresDir)).toThrow(/no \.feature files/i)
  })

  // The whole reason this slice exists: a target nested one directory deep
  // is discovered, and its `feature` carries the path relative to
  // featuresDir -- not just the basename -- so downstream readers (run.ts's
  // loadTargetPlans) can path.join it straight back onto featuresDir.
  it('derives a target from a nested .feature file, carrying the relative path', () => {
    const featuresDir = tempFeaturesDir()
    writeFile(featuresDir, 'cell-life/cell-life.feature', 'Feature: Cell life\n')
    expect(discoverTargets(featuresDir)).toEqual([{ feature: 'cell-life/cell-life.feature' }])
  })
})

describe('filterTargets', () => {
  const targets = [{ feature: 'alpha.feature' }, { feature: 'beta.feature' }]

  it('returns every target when no filter is given', () => {
    expect(filterTargets(targets, undefined)).toBe(targets)
  })

  it('narrows to the one matching feature, accepting the bare name', () => {
    expect(filterTargets(targets, 'beta')).toEqual([{ feature: 'beta.feature' }])
  })

  it('narrows to the one matching feature, accepting the .feature suffix', () => {
    expect(filterTargets(targets, 'beta.feature')).toEqual([{ feature: 'beta.feature' }])
  })

  it('throws loudly on an unknown feature name rather than matching nothing silently', () => {
    expect(() => filterTargets(targets, 'nonexistent')).toThrow(/nonexistent/)
  })

  // Measured broken before this slice: a nested target's `feature` is a
  // relative path ('cell-life/cell-life.feature'), but --feature is given
  // as the bare slice name -- normalizing that to 'cell-life.feature' never
  // equalled the full path, so a nested target could not be selected by
  // name at all.
  it('narrows to a nested target by its bare basename', () => {
    const nested = [{ feature: 'cell-life/cell-life.feature' }, { feature: 'beta.feature' }]
    expect(filterTargets(nested, 'cell-life')).toEqual([{ feature: 'cell-life/cell-life.feature' }])
  })

  it('narrows to a nested target by its full relative path', () => {
    const nested = [{ feature: 'cell-life/cell-life.feature' }, { feature: 'beta.feature' }]
    expect(filterTargets(nested, 'cell-life/cell-life.feature')).toEqual([{ feature: 'cell-life/cell-life.feature' }])
  })

  it('throws naming every candidate when a basename is ambiguous across two nested targets', () => {
    const ambiguous = [{ feature: 'a/dup.feature' }, { feature: 'b/dup.feature' }]
    expect(() => filterTargets(ambiguous, 'dup')).toThrow(/(?=.*a\/dup\.feature)(?=.*b\/dup\.feature)/)
  })

  // Pins the join separator itself, not just that both candidates appear:
  // without it, 'a/dup.feature' and 'b/dup.feature' concatenated with no
  // separator ('a/dup.featureb/dup.feature') would still satisfy the
  // lookahead assertion above.
  it('separates candidate names with a comma when naming an ambiguous match', () => {
    const ambiguous = [{ feature: 'a/dup.feature' }, { feature: 'b/dup.feature' }]
    expect(() => filterTargets(ambiguous, 'dup')).toThrow('a/dup.feature, b/dup.feature')
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

  it('captures the value from the --feature=<name> form', () => {
    expect(parseArgs(['--feature=infinite-grid'])).toEqual({ feature: 'infinite-grid' })
  })

  // Message text past the offending-argument/--feature pairing is node:util's
  // own, not ours -- assert that pairing (it's the contract we restored:
  // name what was wrong *and* what's valid) rather than pinning Node's exact
  // wording, which would make the suite brittle against a runtime upgrade
  // for no benefit.
  it('throws when --feature is the last argument with no value, naming --feature and the accepted form', () => {
    expect(() => parseArgs(['--feature'])).toThrow(/(?=.*--feature)(?=.*--feature <name>)/)
  })

  // The hazard this closes: `npm run acceptance-mutation -- infinite-grid` was
  // silently ignoring the positional argument and running the full,
  // unscoped suite while printing output indistinguishable from a genuinely
  // scoped run. Throwing here matches filterTargets' existing philosophy of
  // failing loudly rather than doing something other than what was asked.
  it('throws naming a bare positional argument and the accepted form, rather than silently ignoring it', () => {
    expect(() => parseArgs(['infinite-grid'])).toThrow(/(?=.*infinite-grid)(?=.*--feature <name>)/)
  })

  it('throws naming an unrecognized flag and the accepted form, rather than silently ignoring it', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/(?=.*--nope)(?=.*--feature <name>)/)
  })

  it('throws naming the first unrecognized argument, not a later one, alongside the accepted form', () => {
    expect(() => parseArgs(['--other', 'x', '--feature', 'infinite-grid'])).toThrow(
      /(?=.*--other)(?=.*--feature <name>)/,
    )
  })
})
