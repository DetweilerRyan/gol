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
      //
      // Acceptance mutation still leaves the three "not be" rows alive, and
      // that is expected: gridlines are spaced every 10 while the mutator's
      // integer jitter is capped at magnitude 9 (nonzeroDelta(rand, 9)), so a
      // mid-decade coordinate stays mid-decade for 16 of its 18 possible
      // mutations -- the mutated row remains a *true* statement about real
      // behavior, i.e. a genuinely equivalent mutant, not a weak assertion.
      // (The five exact-multiple-of-10 rows are the opposite: any jitter of
      // magnitude <= 9 breaks divisibility, so they are killed 100% of the
      // time.) Closing the gap would mean either deriving the expectation from
      // the same mutated coordinate -- the anti-pattern hardener removed
      // elsewhere -- or reimplementing `% 10` in this file, which would test
      // the implementation detail instead of gridline behavior. Left as
      // documented equivalents, in the style of 41573c5's Stryker equivalent.
      const actual = isMajorGridline(coordinate) ? 'be' : 'not be'
      expect(actual).toBe(variables.be_or_not)
    })
  })

  ScenarioOutline(
    'The major gridlines within a viewport are the multiples of 10 in range',
    ({ Given, When, Then, And }, variables) => {
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
      // Same jitter-ceiling-vs-interval mismatch as the scenario above: a
      // mutated range bound only changes the answer when it crosses a decade
      // boundary, and jitter capped at 9 cannot be guaranteed to cross one.
      // Even a bound sitting exactly on a multiple of 10 is only killed in one
      // direction -- for a min bound, `Math.ceil(min / 10)` is unchanged across
      // the whole decade below it, and symmetrically for a max bound -- so no
      // choice of Examples value exceeds ~50% here, and which half survives is
      // purely a function of the mutator's seed. The surviving range-bound
      // mutants are therefore equivalent (the mutated range genuinely does
      // produce the listed gridlines); the values are left as the specifier
      // wrote them rather than reshuffled to chase the seed.
      When('the major gridlines are computed', () => {
        gridlines = computeMajorGridlines(range)
      })
      Then('the major x gridlines should be <x gridlines>', () => {
        expect(gridlines.x).toEqual(parseNumberList(variables['x gridlines']))
      })
      And('the major y gridlines should be <y gridlines>', () => {
        expect(gridlines.y).toEqual(parseNumberList(variables['y gridlines']))
      })
    },
  )
})

function parseNumberList(commaSeparated: string): number[] {
  const trimmed = commaSeparated.trim()
  return trimmed === '' ? [] : trimmed.split(',').map((value) => Number(value.trim()))
}
