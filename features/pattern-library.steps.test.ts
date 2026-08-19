import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import {
  cellKey,
  createEmptyLiveCells,
  getPatternByName,
  isCellAlive,
  placePattern,
  toggleCell,
  type LiveCells,
  type Pattern,
} from '../src/gameOfLife'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './pattern-library.feature')

// Parses a Gherkin cell list like "(1, 0), (2, 1), (0, 2)" into coordinate pairs.
function parseCellList(cellList: string): Array<[number, number]> {
  const matches = cellList.matchAll(/\((-?\d+),\s*(-?\d+)\)/g)
  return Array.from(matches, (match) => [Number(match[1]), Number(match[2])])
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  ScenarioOutline(
    'Each pattern in the library has a category and a defined shape',
    ({ Given, Then, And }, variables) => {
      let pattern: Pattern | undefined

      Given('the "<pattern>" pattern', () => {
        pattern = getPatternByName(variables.pattern)
      })
      Then('it should be listed under the "<category>" category', () => {
        expect(pattern).toBeDefined()
        expect(pattern?.category).toBe(variables.category)
      })
      And('its live cells relative to the top-left corner of its bounding box should be <cells>', () => {
        const expectedCells = parseCellList(variables.cells)
        const actualCells = pattern?.cells.map(([x, y]) => [x, y]) ?? []
        expect(new Set(actualCells.map(([x, y]) => cellKey(x, y)))).toEqual(
          new Set(expectedCells.map(([x, y]) => cellKey(x, y))),
        )
      })
    },
  )

  Scenario('Placing a pattern anchors its top-left corner at the target cell', ({ Given, When, Then, And }) => {
    let cells: LiveCells

    Given('an empty grid', () => {
      cells = createEmptyLiveCells()
    })
    When('I place the "Block" pattern with its top-left corner at (5, 5)', () => {
      const pattern = getPatternByName('Block')
      if (!pattern) throw new Error('Block pattern not found')
      placePattern(cells, pattern, 5, 5)
    })
    Then('the cell at (5, 5) should be alive', () => {
      expect(isCellAlive(cells, 5, 5)).toBe(true)
    })
    And('the cell at (6, 5) should be alive', () => {
      expect(isCellAlive(cells, 6, 5)).toBe(true)
    })
    And('the cell at (5, 6) should be alive', () => {
      expect(isCellAlive(cells, 5, 6)).toBe(true)
    })
    And('the cell at (6, 6) should be alive', () => {
      expect(isCellAlive(cells, 6, 6)).toBe(true)
    })
  })

  Scenario(
    'Placing a pattern merges with existing live cells rather than replacing them',
    ({ Given, When, Then, And }) => {
      let cells: LiveCells

      Given('a live cell at (20, 20)', () => {
        cells = createEmptyLiveCells()
        toggleCell(cells, 20, 20)
      })
      When('I place the "Block" pattern with its top-left corner at (5, 5)', () => {
        const pattern = getPatternByName('Block')
        if (!pattern) throw new Error('Block pattern not found')
        placePattern(cells, pattern, 5, 5)
      })
      Then('the cell at (20, 20) should be alive', () => {
        expect(isCellAlive(cells, 20, 20)).toBe(true)
      })
      And('the cell at (5, 5) should be alive', () => {
        expect(isCellAlive(cells, 5, 5)).toBe(true)
      })
    },
  )

  Scenario(
    'Placing a pattern over an already-live cell keeps it alive rather than toggling it off',
    ({ Given, When, Then, And }) => {
      let cells: LiveCells

      Given('a live cell at (5, 5)', () => {
        cells = createEmptyLiveCells()
        toggleCell(cells, 5, 5)
      })
      When('I place the "Block" pattern with its top-left corner at (5, 5)', () => {
        const pattern = getPatternByName('Block')
        if (!pattern) throw new Error('Block pattern not found')
        placePattern(cells, pattern, 5, 5)
      })
      Then('the cell at (5, 5) should be alive', () => {
        expect(isCellAlive(cells, 5, 5)).toBe(true)
      })
      And('the cell at (6, 5) should be alive', () => {
        expect(isCellAlive(cells, 6, 5)).toBe(true)
      })
      And('the cell at (5, 6) should be alive', () => {
        expect(isCellAlive(cells, 5, 6)).toBe(true)
      })
      And('the cell at (6, 6) should be alive', () => {
        expect(isCellAlive(cells, 6, 6)).toBe(true)
      })
    },
  )
})
