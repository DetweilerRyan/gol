import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { computeMajorGridlines, isMajorGridline, type MajorGridlines, type VisibleRange } from '../src/viewport'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './grid-reference-lines.feature')

describeFeature(feature, ({ ScenarioOutline }) => {
  ScenarioOutline('A coordinate is a major gridline exactly every 10 cells', ({ Given, Then }, variables) => {
    let coordinate: number

    Given('a coordinate of <coordinate>', () => {
      coordinate = Number(variables.coordinate)
    })
    Then('it should <be_or_not> a major gridline', () => {
      // Compare the observed outcome to the expected string directly (rather
      // than reducing "expected" to a boolean via `=== 'be'`) so a mutated
      // <be_or_not> value is always detected, not just mutations that happen
      // to land on the string "be". Same fix as cell-life-and-death's
      // <next state> assertion.
      const actual = isMajorGridline(coordinate) ? 'be' : 'not be'
      expect(actual).toBe(variables.be_or_not)
    })
  })

  ScenarioOutline('The major gridlines within a viewport are the multiples of 10 in range', ({ Given, When, Then, And }, variables) => {
    let range: VisibleRange
    let gridlines: MajorGridlines

    Given('a visible range from x <minX> to <maxX> and y <minY> to <maxY>', () => {
      range = {
        minX: Number(variables.minX),
        maxX: Number(variables.maxX),
        minY: Number(variables.minY),
        maxY: Number(variables.maxY),
      }
    })
    When('the major gridlines are computed', () => {
      gridlines = computeMajorGridlines(range)
    })
    Then('the major x gridlines should be <x gridlines>', () => {
      expect(gridlines.x).toEqual(parseNumberList(variables['x gridlines']))
    })
    And('the major y gridlines should be <y gridlines>', () => {
      expect(gridlines.y).toEqual(parseNumberList(variables['y gridlines']))
    })
  })
})

function parseNumberList(commaSeparated: string): number[] {
  const trimmed = commaSeparated.trim()
  return trimmed === '' ? [] : trimmed.split(',').map((value) => Number(value.trim()))
}
