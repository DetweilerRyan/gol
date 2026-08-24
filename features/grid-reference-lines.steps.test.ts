import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { computeMajorGridlines, isMajorGridline, type MajorGridlines, type VisibleRange } from '../src/gridGeometry'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './grid-reference-lines.feature')

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // The only Examples table left in this feature, and deliberately multiples of
  // 10 only. The mutator's integer jitter is capped at magnitude 9
  // (nonzeroDelta(rand, 9)), so any mutation of an exact multiple breaks
  // divisibility and is killed, whereas a mid-decade coordinate stays
  // mid-decade for most of its mutations -- a mutated row that remains a *true*
  // statement about real behavior. The non-multiple case is stated as a plain
  // scenario below for exactly that reason: it costs no mutant it could not
  // kill.
  ScenarioOutline('A coordinate every 10 cells carries a major gridline', ({ Given, Then }, variables) => {
    let coordinate: number

    Given('a coordinate of <coordinate>', () => {
      coordinate = Number(variables.coordinate)
    })
    Then('it should be a major gridline', () => {
      expect(isMajorGridline(coordinate)).toBe(true)
    })
  })

  Scenario('A coordinate between the tens carries no major gridline', ({ Given, Then }) => {
    let coordinate: number

    Given('a coordinate of 5', () => {
      coordinate = 5
    })
    Then('it should not be a major gridline', () => {
      expect(isMajorGridline(coordinate)).toBe(false)
    })
  })

  Scenario('The major gridlines in view are the multiples of 10 it spans', ({ Given, When, Then, And }) => {
    let range: VisibleRange
    let gridlines: MajorGridlines

    Given('a view spanning x from -23 to 17 and y from -5 to 26', () => {
      range = { minX: -23, maxX: 17, minY: -5, maxY: 26 }
    })
    When('the major gridlines are computed', () => {
      gridlines = computeMajorGridlines(range)
    })
    Then('the major x gridlines should be -20, -10, 0, 10', () => {
      expect(gridlines.x).toEqual([-20, -10, 0, 10])
    })
    And('the major y gridlines should be 0, 10, 20', () => {
      expect(gridlines.y).toEqual([0, 10, 20])
    })
  })

  Scenario('A view narrower than the gridline spacing shows no major gridlines', ({ Given, When, Then }) => {
    let range: VisibleRange
    let gridlines: MajorGridlines

    Given('a view spanning x from 1 to 9 and y from 1 to 9', () => {
      range = { minX: 1, maxX: 9, minY: 1, maxY: 9 }
    })
    When('the major gridlines are computed', () => {
      gridlines = computeMajorGridlines(range)
    })
    Then('there should be no major gridlines at all', () => {
      expect(gridlines.x).toEqual([])
      expect(gridlines.y).toEqual([])
    })
  })
})
