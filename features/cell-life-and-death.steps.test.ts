import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { cellKey, createEmptyLiveCells, getNextGeneration, isCellAlive, toggleCell, type LiveCells } from '../src/gameOfLife'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './cell-life-and-death.feature')

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('Toggling a dead cell brings it to life', ({ Given, When, Then }) => {
    let cells: LiveCells

    Given('an empty grid', () => {
      cells = createEmptyLiveCells()
    })
    When('I toggle the cell at (2, 3)', () => {
      toggleCell(cells, 2, 3)
    })
    Then('the cell at (2, 3) should be alive', () => {
      expect(isCellAlive(cells, 2, 3)).toBe(true)
    })
  })

  Scenario('Toggling a live cell kills it', ({ Given, When, Then }) => {
    let cells: LiveCells

    Given('a live cell at (2, 3)', () => {
      cells = makeLiveCells([[2, 3]])
    })
    When('I toggle the cell at (2, 3)', () => {
      toggleCell(cells, 2, 3)
    })
    Then('the cell at (2, 3) should be dead', () => {
      expect(isCellAlive(cells, 2, 3)).toBe(false)
    })
  })

  ScenarioOutline("A cell's fate depends on its live neighbor count", ({ Given, And, When, Then }, variables) => {
    let cells: LiveCells

    Given('a cell that is <state>', () => {
      cells = variables.state === 'alive' ? makeLiveCells([[0, 0]]) : createEmptyLiveCells()
    })
    And('it has <neighbors> live neighbors', () => {
      const neighborCount = Number(variables.neighbors)
      for (const [dx, dy] of NEIGHBOR_OFFSETS.slice(0, neighborCount)) {
        toggleCell(cells, dx, dy)
      }
    })
    When('the next generation is computed', () => {
      cells = getNextGeneration(cells)
    })
    Then('the cell should end up <next state>', () => {
      // Compare the observed outcome to the expected string directly (rather
      // than reducing "expected" to a boolean via `=== 'alive'`) so a
      // mutated <next state> value is always detected, not just mutations
      // that happen to land on the string "alive".
      const actual = isCellAlive(cells, 0, 0) ? 'alive' : 'dead'
      expect(actual).toBe(variables['next state'])
    })
  })

  ScenarioOutline('A horizontal blinker becomes vertical after one generation', ({ Given, When, Then }, variables) => {
    let cells: LiveCells
    let centerX: number
    let centerY: number

    Given('a horizontal blinker centered at (<x>, <y>)', () => {
      centerX = Number(variables.x)
      centerY = Number(variables.y)
      cells = makeLiveCells([
        [centerX - 1, centerY],
        [centerX, centerY],
        [centerX + 1, centerY],
      ])
    })
    When('the next generation is computed', () => {
      cells = getNextGeneration(cells)
    })
    Then('the blinker should be vertical', () => {
      expect(isCellAlive(cells, centerX, centerY - 1)).toBe(true)
      expect(isCellAlive(cells, centerX, centerY)).toBe(true)
      expect(isCellAlive(cells, centerX, centerY + 1)).toBe(true)
      expect(isCellAlive(cells, centerX - 1, centerY)).toBe(false)
      expect(isCellAlive(cells, centerX + 1, centerY)).toBe(false)
    })
  })

  Scenario('A vertical blinker becomes horizontal after one generation', ({ Given, When, Then }) => {
    let cells: LiveCells

    Given('a vertical blinker centered at (1, 1)', () => {
      cells = makeLiveCells([
        [1, 0],
        [1, 1],
        [1, 2],
      ])
    })
    When('the next generation is computed', () => {
      cells = getNextGeneration(cells)
    })
    Then('the blinker should be horizontal', () => {
      expect(isCellAlive(cells, 0, 1)).toBe(true)
      expect(isCellAlive(cells, 1, 1)).toBe(true)
      expect(isCellAlive(cells, 2, 1)).toBe(true)
      expect(isCellAlive(cells, 1, 0)).toBe(false)
      expect(isCellAlive(cells, 1, 2)).toBe(false)
    })
  })

  Scenario('A 2x2 block never changes', ({ Given, When, Then }) => {
    let cells: LiveCells
    let before: LiveCells

    Given('a 2x2 block of live cells with its top-left corner at (0, 0)', () => {
      cells = makeLiveCells([
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ])
      before = new Set(cells)
    })
    When('the next generation is computed', () => {
      cells = getNextGeneration(cells)
    })
    Then('the block should be unchanged', () => {
      expect(cells).toEqual(before)
    })
  })
})
