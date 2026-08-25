import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { isMajorGridline } from '../src/gridGeometry'

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
})
