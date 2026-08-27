import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CompositeParserException } from './gherkin-document.ts'
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
    // Two concatenated `Feature:` headings is not valid Gherkin (a feature
    // file has exactly one Feature) -- re-expressed as the thing this test
    // actually means: one Feature with two Scenario Outlines, each with its
    // own Examples table.
    const twoOutlines = `Feature: Sample
  Scenario Outline: A rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
      | 3     | six    |

  Scenario Outline: A second rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
      | 3     | six    |
`
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

  it('finds the table under a *titled* Examples: heading too', () => {
    // The old line-scanner matched only a bare `Examples:` line and skipped
    // a titled `Examples: named` heading entirely, silently excluding its
    // table from mutation -- a latent bug the AST walk fixes, since a title
    // has no bearing on whether the Examples node carries a table.
    const titled = 'Feature: F\n  Scenario Outline: S\n    Examples: named\n      | a |\n      | 1 |\n'
    const [table] = findExamplesTables(titled)
    expect(table.header).toEqual(['a'])
    expect(table.rows).toHaveLength(1)
  })

  it('skips whitespace-only lines between the heading and the table', () => {
    const spaced = 'Feature: F\n  Scenario Outline: S\n    Examples:\n   \n\n      | a |\n      | 1 |\n'
    const [table] = findExamplesTables(spaced)
    expect(table.header).toEqual(['a'])
    expect(table.rows).toHaveLength(1)
  })

  it('rejects a line that trails with a pipe but does not start with one, as malformed Gherkin', () => {
    // The old line-scanner silently stopped reading rows once a line didn't
    // *start* with `|`, treating a trailing-pipe line as harmless prose
    // outside the table. It isn't -- a line here has to be a recognized
    // keyword (Scenario/Examples/Rule/...), a comment, blank, or EOF, and
    // "not a row |" is none of those, so real Gherkin parsing rejects the
    // whole file rather than silently ignoring the stray line.
    const trailingPipe = 'Feature: F\n  Scenario Outline: S\n    Examples:\n      | a |\n      | 1 |\n    not a row |\n'
    expect(() => findExamplesTables(trailingPipe)).toThrow(CompositeParserException)
  })

  it('handles a table whose last row is the last line, with no trailing newline', () => {
    const noTrailingNewline = 'Feature: F\n  Scenario Outline: S\n    Examples:\n      | a |\n      | 1 |'
    const [table] = findExamplesTables(noTrailingNewline)
    expect(table.rows).toHaveLength(1)
    expect(table.rows[0].cells).toEqual(['1'])
  })

  it('finds a table inside a Scenario Outline nested under a Rule', () => {
    // The old line-scanner never looked for the Rule: keyword at all, so it
    // was "Rule-proof" only by accident -- it would have scanned straight
    // through one. A naive `feature.children[].scenario` walk over the real
    // AST is not accident-proof the same way: a Rule's own children live at
    // `child.rule.children`, one level deeper, and have to be recursed into
    // on purpose (see gherkin-document.ts's listScenarios).
    const withRule = `Feature: F
  Rule: R
    Scenario Outline: S
      Given a value of <input>

      Examples:
        | input |
        | 1     |
`
    const [table] = findExamplesTables(withRule)
    expect(table.header).toEqual(['input'])
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
  // Exactly three of the seven .feature files carry an Examples table today
  // -- cell-life-and-death (two outlines), grid-reference-lines, and
  // pattern-library. infinite-grid and camera-pan-and-zoom both had one at
  // some point and lost it: prune-gherkin-to-domain-language removed
  // infinite-grid's, and camera-pan-and-zoom's two outlines (zoom
  // factor/resulting cell size, factor/expected size) were since converted
  // to plain Scenarios. This test used to pin the stale shape of both and
  // went undetected for several slices because scripts/** sits outside
  // `npm test` (see hardener.md's stage 3) -- asserting the absence
  // explicitly is the point, not an afterthought, since a target with zero
  // mutable cells is exactly the case run.ts's zero-mutant reporting path
  // exists to handle instead of silently losing.
  it('finds the expected Examples tables in each feature with an outline, and none in the two that lost theirs', () => {
    const cellLifeAndDeath = readFileSync(`${FEATURES_DIR}/cell-life-and-death.feature`, 'utf8')
    const gridReferenceLines = readFileSync(`${FEATURES_DIR}/grid-reference-lines.feature`, 'utf8')
    const patternLibrary = readFileSync(`${FEATURES_DIR}/pattern-library.feature`, 'utf8')
    const infiniteGrid = readFileSync(`${FEATURES_DIR}/infinite-grid.feature`, 'utf8')
    const cameraPanAndZoom = readFileSync(`${FEATURES_DIR}/camera-pan-and-zoom.feature`, 'utf8')

    expect(findExamplesTables(cellLifeAndDeath)[0].header).toEqual(['state', 'neighbors', 'next state'])
    expect(findExamplesTables(cellLifeAndDeath)[0].rows).toHaveLength(8)
    expect(findExamplesTables(cellLifeAndDeath)[1].header).toEqual(['x', 'y', 'expected center x', 'expected center y'])
    expect(findExamplesTables(cellLifeAndDeath)[1].rows).toHaveLength(1)

    expect(findExamplesTables(gridReferenceLines)[0].header).toEqual(['coordinate'])
    expect(findExamplesTables(gridReferenceLines)[0].rows).toHaveLength(3)

    expect(findExamplesTables(patternLibrary)[0].header).toEqual(['pattern', 'category', 'cells'])
    expect(findExamplesTables(patternLibrary)[0].rows).toHaveLength(8)

    expect(findExamplesTables(infiniteGrid)).toEqual([])
    expect(findExamplesTables(cameraPanAndZoom)).toEqual([])
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
