import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import {
  cellKey,
  createEmptyLiveCells,
  getNextGeneration,
  isCellAlive,
  toggleCell,
  type LiveCells,
} from '../src/gameOfLife'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './infinite-grid.feature')

function addHorizontalBlinker(cells: LiveCells, centerX: number, centerY: number): void {
  cells.add(cellKey(centerX - 1, centerY))
  cells.add(cellKey(centerX, centerY))
  cells.add(cellKey(centerX + 1, centerY))
}

function expectVerticalBlinker(cells: LiveCells, centerX: number, centerY: number): void {
  expect(isCellAlive(cells, centerX, centerY - 1)).toBe(true)
  expect(isCellAlive(cells, centerX, centerY)).toBe(true)
  expect(isCellAlive(cells, centerX, centerY + 1)).toBe(true)
  expect(isCellAlive(cells, centerX - 1, centerY)).toBe(false)
  expect(isCellAlive(cells, centerX + 1, centerY)).toBe(false)
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('Cells can be placed far from the origin in any direction', ({ Given, When, Then, And }) => {
    let cells: LiveCells

    Given('an empty grid', () => {
      cells = createEmptyLiveCells()
    })
    When('I toggle the cells at (-500, -500) and (1000000, -1000000)', () => {
      toggleCell(cells, -500, -500)
      toggleCell(cells, 1000000, -1000000)
    })
    Then('the cell at (-500, -500) should be alive', () => {
      expect(isCellAlive(cells, -500, -500)).toBe(true)
    })
    And('the cell at (1000000, -1000000) should be alive', () => {
      expect(isCellAlive(cells, 1000000, -1000000)).toBe(true)
    })
  })

  // Both blinkers share one grid rather than one grid each: they are far
  // enough apart that neither can influence the other, and a single
  // generation over both is what makes "evolves exactly as one at the origin"
  // a statement about the same computation rather than two separate ones.
  Scenario('A pattern far from the origin evolves exactly as one at the origin', ({ Given, And, When, Then }) => {
    let cells: LiveCells

    Given('a horizontal blinker centered at (0, 0)', () => {
      cells = createEmptyLiveCells()
      addHorizontalBlinker(cells, 0, 0)
    })
    And('a horizontal blinker centered at (250000, -250000)', () => {
      addHorizontalBlinker(cells, 250000, -250000)
    })
    When('the next generation is computed', () => {
      cells = getNextGeneration(cells)
    })
    Then('the blinker at (0, 0) should be vertical', () => {
      expectVerticalBlinker(cells, 0, 0)
    })
    And('the blinker at (250000, -250000) should be vertical', () => {
      expectVerticalBlinker(cells, 250000, -250000)
    })
  })
})
