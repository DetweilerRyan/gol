import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseFeature } from './gherkin-document.ts'
import { findExamplesCellSites, renderExamplesCellSite } from './examples-cell-sites.ts'

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

function sitesOf(source: string, featureFileName = 'sample.feature') {
  const { doc, lines } = parseFeature(source)
  return findExamplesCellSites(doc, lines, featureFileName)
}

describe('findExamplesCellSites', () => {
  it('enumerates every cell across every row with its seedKey and value', () => {
    const sites = sitesOf(SAMPLE)
    expect(sites).toHaveLength(4)
    expect(sites[0]).toMatchObject({ kind: 'examples-cell', seedKey: 'sample.feature:0:input', value: '2' })
    expect(sites[3]).toMatchObject({ kind: 'examples-cell', seedKey: 'sample.feature:1:output', value: 'six' })
  })

  it('returns nothing when there is no Examples section', () => {
    expect(sitesOf('Feature: No outline\n  Scenario: Plain\n    Given a thing\n')).toEqual([])
  })

  it('finds multiple Examples tables in one file, each restarting rowIndex at 0', () => {
    const twoOutlines = `Feature: Sample
  Scenario Outline: A rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |

  Scenario Outline: A second rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 3     | six    |
`
    const sites = sitesOf(twoOutlines)
    expect(sites.map((s) => s.seedKey)).toEqual([
      'sample.feature:0:input',
      'sample.feature:0:output',
      'sample.feature:0:input',
      'sample.feature:0:output',
    ])
    expect(sites.map((s) => s.value)).toEqual(['2', 'four', '3', 'six'])
  })

  it('ignores an Examples: heading with no table following it', () => {
    const noTable = 'Feature: Odd\n  Scenario Outline: Broken\n    Given a thing\n\n    Examples:\n'
    expect(sitesOf(noTable)).toEqual([])
  })

  it('ignores an Examples: heading at the end of the file', () => {
    const trailing = 'Feature: Odd\n  Scenario Outline: Broken\n    Given a thing\n\n    Examples:'
    expect(sitesOf(trailing)).toEqual([])
  })

  it('ignores an Examples: heading followed by something that is not a table', () => {
    const notATable = 'Feature: Odd\n  Scenario Outline: Broken\n    Examples:\n    just some prose\n'
    expect(sitesOf(notATable)).toEqual([])
  })

  // A titled `Examples: named` heading has no bearing on whether the
  // Examples node carries a table -- and a run of whitespace-only lines
  // between the heading and the table doesn't stop the parser finding it
  // either.
  it.each([
    ['finds the table under a *titled* Examples: heading too', 'Examples: named'],
    ['skips whitespace-only lines between the heading and the table', 'Examples:\n   \n'],
  ])('%s', (_name, examplesHeading) => {
    const source = `Feature: F\n  Scenario Outline: S\n    ${examplesHeading}\n      | a |\n      | 1 |\n`
    const sites = sitesOf(source, 'f.feature')
    expect(sites).toHaveLength(1)
    expect(sites[0]).toMatchObject({ seedKey: 'f.feature:0:a', value: '1' })
  })

  it('handles a table whose last row is the last line, with no trailing newline', () => {
    const noTrailingNewline = 'Feature: F\n  Scenario Outline: S\n    Examples:\n      | a |\n      | 1 |'
    const sites = sitesOf(noTrailingNewline, 'f.feature')
    expect(sites).toHaveLength(1)
    expect(sites[0].value).toBe('1')
  })

  it('finds a table inside a Scenario Outline nested under a Rule', () => {
    const withRule = `Feature: F
  Rule: R
    Scenario Outline: S
      Given a value of <input>

      Examples:
        | input |
        | 1     |
`
    const sites = sitesOf(withRule, 'f.feature')
    expect(sites).toHaveLength(1)
    expect(sites[0]).toMatchObject({ seedKey: 'f.feature:0:input', value: '1' })
  })

  describe('against the real feature files', () => {
    // Exactly three of the seven .feature files carry an Examples table
    // today -- cell-life-and-death (two outlines), grid-reference-lines, and
    // pattern-library. infinite-grid and camera-pan-and-zoom both had one at
    // some point and lost it (see gherkin-examples.test.ts's history, before
    // this file replaced it) -- asserting the absence explicitly is the
    // point, since a target with zero mutable sites is exactly the case
    // run.ts's zero-mutant reporting path exists to handle instead of
    // silently losing.
    it('finds the expected sites in each feature with an outline, and none in the two that lost theirs', () => {
      const load = (name: string) => readFileSync(`${FEATURES_DIR}/${name}`, 'utf8')

      const cellLifeAndDeath = sitesOf(load('cell-life-and-death.feature'), 'cell-life-and-death.feature')
      expect(cellLifeAndDeath.filter((s) => s.seedKey.includes(':state')).map((s) => s.value)).toHaveLength(8)
      expect(cellLifeAndDeath.filter((s) => s.seedKey.includes(':x'))).toHaveLength(1)

      const gridReferenceLines = sitesOf(load('grid-reference-lines.feature'), 'grid-reference-lines.feature')
      expect(gridReferenceLines.filter((s) => s.seedKey.includes(':coordinate'))).toHaveLength(3)

      const patternLibrary = sitesOf(load('pattern-library.feature'), 'pattern-library.feature')
      expect(patternLibrary.filter((s) => s.seedKey.includes(':pattern'))).toHaveLength(8)

      expect(sitesOf(load('infinite-grid.feature'), 'infinite-grid.feature')).toEqual([])
      expect(sitesOf(load('camera-pan-and-zoom.feature'), 'camera-pan-and-zoom.feature')).toEqual([])
    })

    it('round-trips a mutation on the real cell-life-and-death.feature without corrupting the rest of the file', () => {
      const original = readFileSync(`${FEATURES_DIR}/cell-life-and-death.feature`, 'utf8')
      const [site] = sitesOf(original, 'cell-life-and-death.feature')
      const mutated = renderExamplesCellSite(original, site, 'MUTATED')
      expect(mutated).not.toBe(original)
      expect(mutated.split('\n')).toHaveLength(original.split('\n').length)
      expect(mutated).toContain("Scenario Outline: A cell's fate depends on its live neighbor count")
    })
  })
})

// The row-rewrite renderer is deliberately temporary (see the module
// comment in examples-cell-sites.ts) -- these tests exist to pin its
// byte-for-byte parity with the pre-refactor applyMutation until step 4
// replaces it with a splice, at which point this describe block is deleted
// along with the code it covers.
describe('renderExamplesCellSite (temporary row-rewrite)', () => {
  it('changes only the targeted cell, leaving every other cell and line untouched', () => {
    const [site] = sitesOf(SAMPLE)
    const mutated = renderExamplesCellSite(SAMPLE, site, '999')
    const [after] = sitesOf(mutated)
    expect(after.value).toBe('999')

    const mutatedLines = mutated.split('\n')
    const originalLines = SAMPLE.split('\n')
    const changedLines = mutatedLines.filter((line, i) => line !== originalLines[i])
    expect(changedLines).toHaveLength(1)
  })

  it('preserves the header row exactly', () => {
    const [site] = sitesOf(SAMPLE)
    const mutated = renderExamplesCellSite(SAMPLE, site, '999')
    expect(mutated.split('\n')[6]).toBe(SAMPLE.split('\n')[6])
  })
})
