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
  it('returns feature-level scenarios in document order', () => {
    const { doc } = parseFeature('Feature: F\n  Scenario: A\n    Given a\n  Scenario: B\n    Given b\n')
    expect(listScenarios(doc).map((s) => s.name)).toEqual(['A', 'B'])
  })

  it('skips a Background, which carries no Scenario of its own', () => {
    const { doc } = parseFeature('Feature: F\n  Background:\n    Given setup\n  Scenario: A\n    Given a\n')
    expect(listScenarios(doc).map((s) => s.name)).toEqual(['A'])
  })

  it('recurses into a Rule to find scenarios nested inside it', () => {
    const { doc } = parseFeature(
      'Feature: F\n  Rule: R\n    Scenario: Nested\n      Given a\n  Scenario: TopLevel\n    Given b\n',
    )
    expect(listScenarios(doc).map((s) => s.name)).toEqual(['Nested', 'TopLevel'])
  })

  it('returns an empty list for a feature with no scenarios at all', () => {
    const { doc } = parseFeature('Feature: F\n')
    expect(listScenarios(doc)).toEqual([])
  })
})
