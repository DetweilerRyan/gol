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

describe('listMutationSites duplicate seedKey detection', () => {
  // Two Examples tables in one feature that share a column name produce the
  // same seedKey (`${featureFileName}:${rowIndex}:${columnName}`, rowIndex
  // restarting at 0 per table) -- the exact collision assertUniqueSeedKeys
  // exists to catch. The message must name both duplicated keys and, for
  // each, every 1-based line the collision spans -- the key alone can't
  // distinguish the two cells (that's the defect), so a message carrying
  // only the key would be unactionable.
  const TWO_TABLES_SHARED_COLUMN = `Feature: Duplicate columns
  Scenario Outline: First
    Given a value of <input>

    Examples:
      | input |
      | 2     |

  Scenario Outline: Second
    Given another value of <input>

    Examples:
      | input |
      | 3     |
`

  it('throws once, naming every duplicated seedKey and the 1-based line each colliding site is on', () => {
    expect(() => listMutationSites(TWO_TABLES_SHARED_COLUMN, 'dup.feature')).toThrow(
      /dup\.feature:0:input.*lines 7, 14/,
    )
  })

  // A single duplicated key can't tell "collect every duplicate and throw
  // once" apart from "throw on the first duplicate found" -- one colliding
  // pair is indistinguishable between the two, and the join between
  // duplicate-key groups in the message is exercised by none of it (a
  // one-element array joins to itself). Two tables sharing *two* column
  // names forces two distinct duplicate-key groups into one thrown error,
  // which is what actually pins "collect all, throw once" and the '; '
  // separator between groups.
  const TWO_TABLES_TWO_SHARED_COLUMNS = `Feature: Two duplicated columns
  Scenario Outline: First
    Given a value of <a> and <b>

    Examples:
      | a | b |
      | 1 | 2 |

  Scenario Outline: Second
    Given a value of <a> and <b>

    Examples:
      | a | b |
      | 3 | 4 |
`

  it('collects every duplicated key into one thrown error rather than stopping at the first', () => {
    expect(() => listMutationSites(TWO_TABLES_TWO_SHARED_COLUMNS, 'two.feature')).toThrow(
      /two\.feature:0:a" at lines 7, 14; .*two\.feature:0:b" at lines 7, 14/,
    )
  })

  it('does not throw when two tables use distinct column names', () => {
    const distinctColumns = `Feature: Distinct columns
  Scenario Outline: First
    Given a value of <first>

    Examples:
      | first |
      | 2     |

  Scenario Outline: Second
    Given another value of <second>

    Examples:
      | second |
      | 3      |
`
    expect(() => listMutationSites(distinctColumns, 'ok.feature')).not.toThrow()
  })

  // Two identical rows in one table are the case that looks like it should
  // collide and doesn't: rowIndex still differs between them, so the
  // seedKey stays unique even though the cell *values* are byte-identical.
  // This is the fact that sank the content-addressed alternative -- a hash
  // of the row's own content would have collapsed these two distinct sites
  // into one mutant, reintroducing the exact collision this function exists
  // to catch (see seedKeyFor's comment in examples-cell-sites.ts for the
  // full accounting of why positional beat content-addressed).
  it('does not throw on two identical rows, and assigns them distinct seedKeys', () => {
    const identicalRows = `Feature: Identical rows
  Scenario Outline: A rule
    Given a value of <input>

    Examples:
      | input |
      | 2     |
      | 2     |
`
    const sites = listMutationSites(identicalRows, 'rows.feature')
    expect(sites).toHaveLength(2)
    expect(sites[0].value).toBe('2')
    expect(sites[1].value).toBe('2')
    expect(sites[0].seedKey).not.toBe(sites[1].seedKey)
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
