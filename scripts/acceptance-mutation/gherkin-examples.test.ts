import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { applyMutation, findExamplesTables, listMutableCells } from './gherkin-examples.ts'

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../features')

const SAMPLE = `Feature: Sample
  Scenario Outline: A rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
      | 3     | six    |
`

describe('findExamplesTables', () => {
  it('locates the header and every data row', () => {
    const [table] = findExamplesTables(SAMPLE)
    expect(table.header).toEqual(['input', 'output'])
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0].cells).toEqual(['2', 'four'])
    expect(table.rows[1].cells).toEqual(['3', 'six'])
  })

  it('returns no tables when there is no Examples section', () => {
    expect(findExamplesTables('Feature: No outline\n  Scenario: Plain\n    Given a thing\n')).toEqual([])
  })

  it('finds multiple Examples tables in one file', () => {
    const twoOutlines = SAMPLE + '\n' + SAMPLE.replace('Sample', 'Second')
    expect(findExamplesTables(twoOutlines)).toHaveLength(2)
  })

  it('ignores an Examples: heading with no table following it', () => {
    const noTable = 'Feature: Odd\n  Scenario Outline: Broken\n    Given a thing\n\n    Examples:\n'
    expect(findExamplesTables(noTable)).toEqual([])
  })

  it('ignores an Examples: heading at the end of the file', () => {
    const trailing = 'Feature: Odd\n  Scenario Outline: Broken\n    Given a thing\n\n    Examples:'
    expect(findExamplesTables(trailing)).toEqual([])
  })

  it('ignores an Examples: heading followed by something that is not a table', () => {
    const notATable = 'Feature: Odd\n  Scenario Outline: Broken\n    Examples:\n    just some prose\n'
    expect(findExamplesTables(notATable)).toEqual([])
  })

  it('ignores a line that only mentions Examples: as part of a longer line', () => {
    const mention = 'Feature: F\n  Scenario: S\n    Given a step about Examples:\n      | a |\n      | 1 |\n'
    expect(findExamplesTables(mention)).toEqual([])
  })

  it('ignores an Examples: heading with a title after it', () => {
    const titled = 'Feature: F\n  Scenario Outline: S\n    Examples: named\n      | a |\n      | 1 |\n'
    expect(findExamplesTables(titled)).toEqual([])
  })

  it('skips whitespace-only lines between the heading and the table', () => {
    const spaced = 'Feature: F\n  Scenario Outline: S\n    Examples:\n   \n\n      | a |\n      | 1 |\n'
    const [table] = findExamplesTables(spaced)
    expect(table.header).toEqual(['a'])
    expect(table.rows).toHaveLength(1)
  })

  it('requires a row to start with a pipe, not merely end with one', () => {
    const trailingPipe = 'Feature: F\n  Scenario Outline: S\n    Examples:\n      | a |\n      | 1 |\n    not a row |\n'
    const [table] = findExamplesTables(trailingPipe)
    expect(table.rows).toHaveLength(1)
  })

  it('handles a table whose last row is the last line, with no trailing newline', () => {
    const noTrailingNewline = 'Feature: F\n  Scenario Outline: S\n    Examples:\n      | a |\n      | 1 |'
    const [table] = findExamplesTables(noTrailingNewline)
    expect(table.rows).toHaveLength(1)
    expect(table.rows[0].cells).toEqual(['1'])
  })
})

describe('listMutableCells', () => {
  it('enumerates every cell across every row with its position', () => {
    const cells = listMutableCells(SAMPLE)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toMatchObject({ rowIndex: 0, columnIndex: 0, columnName: 'input', value: '2' })
    expect(cells[3]).toMatchObject({ rowIndex: 1, columnIndex: 1, columnName: 'output', value: 'six' })
  })
})

describe('applyMutation', () => {
  it('changes only the targeted cell, leaving every other cell and line untouched', () => {
    const [cell] = listMutableCells(SAMPLE)
    const mutated = applyMutation(SAMPLE, cell, '999')
    const [table] = findExamplesTables(mutated)
    expect(table.rows[0].cells).toEqual(['999', 'four'])
    expect(table.rows[1].cells).toEqual(['3', 'six'])

    const mutatedLines = mutated.split('\n')
    const originalLines = SAMPLE.split('\n')
    const changedLines = mutatedLines.filter((line, i) => line !== originalLines[i])
    expect(changedLines).toHaveLength(1)
  })

  it('preserves the header row exactly', () => {
    const [cell] = listMutableCells(SAMPLE)
    const mutated = applyMutation(SAMPLE, cell, '999')
    const [table] = findExamplesTables(mutated)
    expect(table.header).toEqual(['input', 'output'])
  })
})

describe('against the real feature files', () => {
  it('finds the expected Examples tables in each feature with an outline', () => {
    const cellLifeAndDeath = readFileSync(`${FEATURES_DIR}/cell-life-and-death.feature`, 'utf8')
    const infiniteGrid = readFileSync(`${FEATURES_DIR}/infinite-grid.feature`, 'utf8')
    const cameraPanAndZoom = readFileSync(`${FEATURES_DIR}/camera-pan-and-zoom.feature`, 'utf8')

    expect(findExamplesTables(cellLifeAndDeath)[0].header).toEqual(['state', 'neighbors', 'next state'])
    expect(findExamplesTables(cellLifeAndDeath)[0].rows).toHaveLength(8)

    expect(findExamplesTables(infiniteGrid)[0].header).toEqual(['x', 'y', 'expected center x', 'expected center y'])
    expect(findExamplesTables(infiniteGrid)[0].rows).toHaveLength(3)

    // camera-pan-and-zoom.feature carries two outlines, so it also covers the
    // multi-table case against a real file rather than the SAMPLE fixture.
    expect(findExamplesTables(cameraPanAndZoom)).toHaveLength(2)
    expect(findExamplesTables(cameraPanAndZoom)[0].header).toEqual(['zoom factor', 'resulting cell size'])
    expect(findExamplesTables(cameraPanAndZoom)[0].rows).toHaveLength(2)
    expect(findExamplesTables(cameraPanAndZoom)[1].header).toEqual(['factor', 'expected size'])
    expect(findExamplesTables(cameraPanAndZoom)[1].rows).toHaveLength(2)
  })

  it('round-trips a mutation on the real cell-life-and-death.feature without corrupting the rest of the file', () => {
    const original = readFileSync(`${FEATURES_DIR}/cell-life-and-death.feature`, 'utf8')
    const [cell] = listMutableCells(original)
    const mutated = applyMutation(original, cell, 'MUTATED')
    expect(mutated).not.toBe(original)
    expect(mutated.split('\n')).toHaveLength(original.split('\n').length)
    expect(mutated).toContain("Scenario Outline: A cell's fate depends on its live neighbor count")
  })
})
