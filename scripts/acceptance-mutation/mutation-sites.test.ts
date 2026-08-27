import { describe, expect, it } from 'vitest'
import { listMutationSites, renderMutantText } from './mutation-sites.ts'
import { CompositeParserException } from './gherkin-document.ts'

const SAMPLE = `Feature: Sample
  Scenario Outline: A rule
    Given a value of <input>
    Then the result is <output>

    Examples:
      | input | output |
      | 2     | four   |
      | 3     | six    |
`

describe('listMutationSites', () => {
  it('parses the feature text and dispatches to every registered kind, tagging seedKeys with the given feature name', () => {
    const sites = listMutationSites(SAMPLE, 'sample.feature')
    expect(sites).toHaveLength(4)
    expect(sites.every((s) => s.kind === 'examples-cell')).toBe(true)
    expect(sites[0].seedKey).toBe('sample.feature:0:input')
  })

  it('returns nothing for a feature with no mutable sites of any registered kind', () => {
    expect(listMutationSites('Feature: Bare\n  Scenario: Nothing\n    Given nothing\n', 'bare.feature')).toEqual([])
  })

  // listMutationSites parses internally now (the old call site handed
  // listMutableCells a raw string too) -- a parse failure has to keep
  // surfacing as a real exception so run.ts's own try/catch around
  // loadTargetPlans still has something to catch and attach the target name
  // to.
  it('throws on malformed Gherkin rather than silently returning no sites', () => {
    const malformed = `${SAMPLE}\nFeature: Second\n  Scenario: S\n    Given a thing\n`
    expect(() => listMutationSites(malformed, 'sample.feature')).toThrow(CompositeParserException)
  })
})

describe('renderMutantText', () => {
  it('dispatches to the renderer registered for the site kind', () => {
    const [site] = listMutationSites(SAMPLE, 'sample.feature')
    const mutated = renderMutantText(SAMPLE, site, '999')
    const [after] = listMutationSites(mutated, 'sample.feature')
    expect(after.value).toBe('999')
  })
})
