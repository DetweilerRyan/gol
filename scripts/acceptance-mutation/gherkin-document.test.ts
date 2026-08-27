import { describe, expect, it } from 'vitest'
import { CompositeParserException, listScenarios, parseFeature } from './gherkin-document.ts'

const SAMPLE = `Feature: Sample
  Scenario Outline: A rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
      | 3     | six    |
`

describe('parseFeature', () => {
  it('returns the original text, its lines, and the parsed AST', () => {
    const doc = parseFeature(SAMPLE)
    expect(doc.text).toBe(SAMPLE)
    expect(doc.lines).toEqual(SAMPLE.split('\n'))
    expect(doc.doc.feature?.name).toBe('Sample')
  })

  it('reports 1-based AST locations against the same lines array (0-based index = location.line - 1)', () => {
    const { doc, lines } = parseFeature(SAMPLE)
    const [scenario] = listScenarios(doc)
    const [table] = scenario.examples
    expect(lines[table.tableHeader!.location.line - 1].trim()).toBe('| input | output |')
    expect(lines[table.tableBody[0].location.line - 1].trim()).toBe('| 2     | four   |')
  })

  it('throws a CompositeParserException on malformed Gherkin rather than returning a partial document', () => {
    const twoFeatureHeadings = `${SAMPLE}\nFeature: Second\n  Scenario: S\n    Given a thing\n`
    expect(() => parseFeature(twoFeatureHeadings)).toThrow(CompositeParserException)
  })
})

describe('listScenarios', () => {
  it.each([
    [
      'returns feature-level scenarios in document order',
      'Feature: F\n  Scenario: A\n    Given a\n  Scenario: B\n    Given b\n',
      ['A', 'B'],
    ],
    [
      'skips a Background, which carries no Scenario of its own',
      'Feature: F\n  Background:\n    Given setup\n  Scenario: A\n    Given a\n',
      ['A'],
    ],
    [
      'recurses into a Rule to find scenarios nested inside it',
      'Feature: F\n  Rule: R\n    Scenario: Nested\n      Given a\n  Scenario: TopLevel\n    Given b\n',
      ['Nested', 'TopLevel'],
    ],
    [
      'skips a Background nested inside a Rule too, which carries no Scenario of its own either',
      'Feature: F\n  Rule: R\n    Background:\n      Given setup\n    Scenario: Nested\n      Given a\n',
      ['Nested'],
    ],
  ])('%s', (_name, source, expectedNames) => {
    const { doc } = parseFeature(source)
    expect(listScenarios(doc).map((s) => s.name)).toEqual(expectedNames)
  })

  it('returns an empty list for a feature with no scenarios at all', () => {
    const { doc } = parseFeature('Feature: F\n')
    expect(listScenarios(doc)).toEqual([])
  })

  it('returns an empty list for a document with no Feature at all (e.g. comments-only text)', () => {
    // @cucumber/gherkin parses this without throwing, but doc.feature comes
    // back undefined rather than a Feature node -- the reason
    // listScenarios's own `doc.feature?.children ?? []` needs both the
    // optional chain and the fallback, not just one or the other.
    const { doc } = parseFeature('# just a comment\n')
    expect(doc.feature).toBeUndefined()
    expect(listScenarios(doc)).toEqual([])
  })
})
