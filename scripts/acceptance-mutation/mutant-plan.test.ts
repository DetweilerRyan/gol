import { describe, expect, it } from 'vitest'
import { applyMutation, listMutableCells } from './gherkin-examples.ts'
import { buildMutantRecords, mutantSeedKey, type TargetPlan } from './mutant-plan.ts'
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
  return { target: { feature }, featureText, cells: listMutableCells(featureText) }
}

describe('mutantSeedKey', () => {
  it('addresses a cell by feature, row and column so a mutant value is reproducible across runs', () => {
    const [cell] = listMutableCells(FEATURE)
    expect(mutantSeedKey('sample.feature', cell)).toBe(`sample.feature:${cell.rowIndex}:${cell.columnName}`)
  })

  it('gives two cells in the same row different keys', () => {
    const cells = listMutableCells(FEATURE)
    const keys = cells.map((cell) => mutantSeedKey('sample.feature', cell))
    expect(new Set(keys).size).toBe(cells.length)
  })
})

describe('buildMutantRecords', () => {
  it('produces one record per mutable cell of every plan', () => {
    const plan = planFor('sample.feature')
    expect(buildMutantRecords([plan])).toHaveLength(plan.cells.length)
  })

  it('returns nothing for no plans', () => {
    expect(buildMutantRecords([])).toEqual([])
  })

  // The invariant this module exists to gate, in both directions. Classification
  // looks a mutant's result up BY ITS FILENAME (run.ts -> specFileName ->
  // summary.bySpecFile), so if a record's filename, its stored `cell` and its
  // mutated text were ever derived from different cells the run would
  // misattribute a kill or a survivor with nothing in the output to notice it by.
  it('derives each record mutated text from the cell it reports', () => {
    const plan = planFor('sample.feature')
    for (const record of buildMutantRecords([plan])) {
      // applyMutation is the module's own collaborator, deliberately: what is
      // under test here is the CORRESPONDENCE between record.cell and
      // record.text, not applyMutation's formatting (gherkin-examples.test.ts
      // owns that). Feeding it record.cell reproduces record.text only if
      // buildMutantRecords used that same cell for both.
      expect(record.text).toBe(applyMutation(plan.featureText, record.cell, record.mutatedValue))
      expect(record.text).not.toBe(plan.featureText)
    }
  })

  it('derives each record filename from the ordinal of the cell it reports', () => {
    const plan = planFor('sample.feature')
    buildMutantRecords([plan]).forEach((record, index) => {
      expect(record.cell).toBe(plan.cells[index])
      expect(record.fileName).toBe(`sample.mutant-${index}.feature`)
    })
  })

  it('mutates the value the cell actually holds, seeded by that cell address', () => {
    const plan = planFor('sample.feature')
    for (const record of buildMutantRecords([plan])) {
      expect(record.mutatedValue).toBe(mutateValue(record.cell.value, mutantSeedKey('sample.feature', record.cell)))
      expect(record.mutatedValue).not.toBe(record.cell.value)
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
})
