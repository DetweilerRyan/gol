import { describe, expect, it } from 'vitest'
import { listMutationSites, renderMutantText } from './mutation-sites.ts'
import { buildMutantRecords, type TargetPlan } from './mutant-plan.ts'
import { mutateValue } from './mutation-rules.ts'

const FEATURE = `Feature: Sample
  Scenario Outline: A row survives
    Given a cell at <x>,<y>
    Then it is <state>

    Examples:
      | x | y | state |
      | 1 | 2 | alive |
      | 3 | 4 | dead  |
`

function planFor(feature: string, featureText = FEATURE): TargetPlan {
  return { target: { feature }, featureText, sites: listMutationSites(featureText, feature) }
}

describe('buildMutantRecords', () => {
  it('produces one record per mutation site of every plan', () => {
    const plan = planFor('sample.feature')
    expect(buildMutantRecords([plan])).toHaveLength(plan.sites.length)
  })

  it('returns nothing for no plans', () => {
    expect(buildMutantRecords([])).toEqual([])
  })

  // The invariant this module exists to gate, in both directions.
  // Classification looks a mutant's result up BY ITS FILENAME (run.ts ->
  // specFileName -> summary.bySpecFile), so if a record's filename, its
  // stored `site` and its mutated text were ever derived from different
  // sites the run would misattribute a kill or a survivor with nothing in
  // the output to notice it by.
  it('derives each record mutated text from the site it reports', () => {
    const plan = planFor('sample.feature')
    for (const record of buildMutantRecords([plan])) {
      // renderMutantText is the module's own collaborator, deliberately:
      // what is under test here is the CORRESPONDENCE between record.site
      // and record.text, not the renderer's own formatting (that's
      // examples-cell-sites.test.ts's job). Feeding it record.site
      // reproduces record.text only if buildMutantRecords used that same
      // site for both.
      expect(record.text).toBe(renderMutantText(plan.featureText, record.site, record.mutatedValue))
      expect(record.text).not.toBe(plan.featureText)
    }
  })

  it('derives each record filename from the ordinal of the site it reports', () => {
    const plan = planFor('sample.feature')
    buildMutantRecords([plan]).forEach((record, index) => {
      expect(record.site).toBe(plan.sites[index])
      expect(record.fileName).toBe(`sample.mutant-${index}.feature`)
    })
  })

  it('mutates the value the site actually holds, seeded by that site address', () => {
    const plan = planFor('sample.feature')
    for (const record of buildMutantRecords([plan])) {
      expect(record.mutatedValue).toBe(mutateValue(record.site.value, record.site.seedKey))
      expect(record.mutatedValue).not.toBe(record.site.value)
    }
  })

  it('numbers each target from 0 but prefixes the filename with the target, so two targets cannot collide', () => {
    const records = buildMutantRecords([planFor('alpha.feature'), planFor('beta.feature')])
    const names = records.map((r) => r.fileName)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toContain('alpha.mutant-0.feature')
    expect(names).toContain('beta.mutant-0.feature')
  })

  it('carries each record back with the target it came from', () => {
    const records = buildMutantRecords([planFor('alpha.feature'), planFor('beta.feature')])
    expect(new Set(records.map((r) => r.target.feature))).toEqual(new Set(['alpha.feature', 'beta.feature']))
  })

  it('is deterministic: the same plans produce byte-identical records', () => {
    const first = buildMutantRecords([planFor('sample.feature')])
    const second = buildMutantRecords([planFor('sample.feature')])
    expect(second).toEqual(first)
  })

  it('contributes nothing for a plan whose feature carries no Examples table', () => {
    const noTable = 'Feature: Bare\n  Scenario: Nothing\n    Given nothing\n'
    expect(buildMutantRecords([planFor('bare.feature', noTable)])).toEqual([])
  })

  it('gives two sites in the same row different seed keys, addressed by feature, row and column', () => {
    const plan = planFor('sample.feature')
    const keys = plan.sites.map((s) => s.seedKey)
    expect(new Set(keys).size).toBe(plan.sites.length)
    expect(plan.sites[0].seedKey).toBe('sample.feature:0:x')
  })
})
