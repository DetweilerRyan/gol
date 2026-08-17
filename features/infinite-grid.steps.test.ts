import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { cellKey, createEmptyLiveCells, getNextGeneration, isCellAlive, toggleCell, type LiveCells } from '../src/gameOfLife'

const feature = await loadFeature('./infinite-grid.feature')

function makeLiveCells(coords: readonly (readonly [number, number])[]): LiveCells {
  return new Set(coords.map(([x, y]) => cellKey(x, y)))
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('Cells can be placed far from the origin in any direction', ({ Given, When, And, Then }) => {
    let cells: LiveCells

    Given('an empty grid', () => {
      cells = createEmptyLiveCells()
    })
    When('I toggle the cell at (-500, -500)', () => {
      toggleCell(cells, -500, -500)
    })
    And('I toggle the cell at (1000000, -1000000)', () => {
      toggleCell(cells, 1000000, -1000000)
    })
    Then('the cell at (-500, -500) should be alive', () => {
      expect(isCellAlive(cells, -500, -500)).toBe(true)
    })
    And('the cell at (1000000, -1000000) should be alive', () => {
      expect(isCellAlive(cells, 1000000, -1000000)).toBe(true)
    })
  })

  ScenarioOutline('A pattern evolves identically no matter where it sits on the grid', ({ Given, When, Then }, variables) => {
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
})
