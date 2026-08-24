// BLACK-BOX step definitions: every step drives the real application through
// ARIA -- clicking cell toggle buttons and the Next Generation button, and
// reading aliveness off aria-pressed -- rather than calling gameOfLife.ts
// directly the way this file did before the black-box-acceptance-pilot slice.
//
// The ONLY route to the app is this feature's own harness module under
// features/harness/ (which sits on the shared core, features/harness/board.tsx).
// This file imports that harness, @amiceli/vitest-cucumber and vitest, and nothing else:
// no src/ import belongs here, not even cellLabel, because a steps file that
// quietly reaches back into src/ when the DOM route is awkward turns this
// layer back into the white-box one it replaced without changing a filename.
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { mountBoard, type Board } from './harness/board'

// ACCEPTANCE_MUTATION_FEATURE_FILE lets the acceptance-mutation runner point
// this suite at a mutated copy of the feature file (see
// scripts/acceptance-mutation/) without ever touching the real one.
const feature = await loadFeature(process.env.ACCEPTANCE_MUTATION_FEATURE_FILE ?? './cell-life-and-death.feature')

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  Scenario('Toggling a dead cell brings it to life', ({ Given, When, Then }) => {
    let board: Board

    Given('an empty grid', () => {
      board = mountBoard()
      expect(board.liveCount()).toBe(0)
    })
    When('I toggle the cell at (2, 3)', () => {
      board.toggle(2, 3)
    })
    Then('the cell at (2, 3) should be alive', () => {
      expect(board.stateAt(2, 3)).toBe('alive')
    })
  })

  Scenario('Toggling a live cell kills it', ({ Given, When, Then }) => {
    let board: Board

    Given('a live cell at (2, 3)', () => {
      // The precondition is established the only way a user can establish it
      // -- by clicking -- and then confirmed, so a scenario that starts from
      // a grid the click never reached fails in the Given rather than
      // misreporting the When.
      board = mountBoard()
      board.toggle(2, 3)
      expect(board.stateAt(2, 3)).toBe('alive')
    })
    When('I toggle the cell at (2, 3)', () => {
      board.toggle(2, 3)
    })
    Then('the cell at (2, 3) should be dead', () => {
      expect(board.stateAt(2, 3)).toBe('dead')
    })
  })

  ScenarioOutline("A cell's fate depends on its live neighbor count", ({ Given, And, When, Then }, variables) => {
    let board: Board
    let generationBefore: number

    Given('a cell that is <state>', () => {
      // Guard against a mutated <state> value silently falling into the
      // "dead" branch (anything that isn't the literal string 'alive' does)
      // -- that would make a mutation of "dead" itself, or a typo of "alive",
      // indistinguishable from a correctly-parsed example.
      if (variables.state !== 'alive' && variables.state !== 'dead') {
        throw new Error(`Unexpected cell state: ${variables.state}`)
      }
      board = mountBoard()
      if (variables.state === 'alive') board.toggle(0, 0)
    })
    And('it has <neighbors> live neighbors', () => {
      const neighborCount = Number(variables.neighbors)
      // Guard against a mutated <neighbors> value landing outside 0-8, where
      // Array.prototype.slice's negative-index/overflow semantics can
      // silently reproduce the original neighbor count (e.g. slice(0, -7) on
      // an 8-element array behaves like slice(0, 1)).
      if (!Number.isInteger(neighborCount) || neighborCount < 0 || neighborCount > NEIGHBOR_OFFSETS.length) {
        throw new Error(`Unexpected neighbor count: ${variables.neighbors}`)
      }
      for (const [dx, dy] of NEIGHBOR_OFFSETS.slice(0, neighborCount)) {
        board.toggle(dx, dy)
      }
    })
    When('the next generation is computed', () => {
      generationBefore = board.generation()
      board.advance()
      // A generation that didn't actually happen would leave every "should
      // end up dead" row green off the untouched starting state. Reading the
      // counter is how this layer tells "the rule says dead" apart from
      // "nothing ran".
      expect(board.generation()).toBe(generationBefore + 1)
    })
    Then('the cell should end up <next state>', () => {
      // Compare the observed outcome to the expected string directly (rather
      // than reducing "expected" to a boolean via `=== 'alive'`) so a
      // mutated <next state> value is always detected, not just mutations
      // that happen to land on the string "alive".
      expect(board.stateAt(0, 0)).toBe(variables['next state'])
    })
  })

  ScenarioOutline(
    'A horizontal blinker becomes vertical after one generation',
    ({ Given, When, Then, And }, variables) => {
      let board: Board
      let centerX: number
      let centerY: number
      let generationBefore: number

      Given('a horizontal blinker centered at (<x>, <y>)', () => {
        centerX = Number(variables.x)
        centerY = Number(variables.y)
        board = mountBoard()
        board.toggle(centerX - 1, centerY)
        board.toggle(centerX, centerY)
        board.toggle(centerX + 1, centerY)
      })
      When('the next generation is computed', () => {
        generationBefore = board.generation()
        board.advance()
        expect(board.generation()).toBe(generationBefore + 1)
      })
      Then('the blinker should be vertical', () => {
        expect(board.stateAt(centerX, centerY - 1)).toBe('alive')
        expect(board.stateAt(centerX, centerY)).toBe('alive')
        expect(board.stateAt(centerX, centerY + 1)).toBe('alive')
        expect(board.stateAt(centerX - 1, centerY)).toBe('dead')
        expect(board.stateAt(centerX + 1, centerY)).toBe('dead')
      })
      And('the blinker should be centered at the literal coordinate (<expected center x>, <expected center y>)', () => {
        // Unlike the relative assertions above (derived from
        // centerX/centerY, which move in lockstep with a mutated <x>/<y>),
        // this reads independent literal columns pinned in the Examples
        // table -- so it still catches a mutated <x> or <y> even though the
        // shape assertion above can't.
        const expectedCenterX = Number(variables['expected center x'])
        const expectedCenterY = Number(variables['expected center y'])
        expect(board.stateAt(expectedCenterX, expectedCenterY - 1)).toBe('alive')
        expect(board.stateAt(expectedCenterX, expectedCenterY)).toBe('alive')
        expect(board.stateAt(expectedCenterX, expectedCenterY + 1)).toBe('alive')
      })
    },
  )

  Scenario('A vertical blinker becomes horizontal after one generation', ({ Given, When, Then }) => {
    let board: Board
    let generationBefore: number

    Given('a vertical blinker centered at (1, 1)', () => {
      board = mountBoard()
      board.toggle(1, 0)
      board.toggle(1, 1)
      board.toggle(1, 2)
    })
    When('the next generation is computed', () => {
      generationBefore = board.generation()
      board.advance()
      expect(board.generation()).toBe(generationBefore + 1)
    })
    Then('the blinker should be horizontal', () => {
      expect(board.stateAt(0, 1)).toBe('alive')
      expect(board.stateAt(1, 1)).toBe('alive')
      expect(board.stateAt(2, 1)).toBe('alive')
      expect(board.stateAt(1, 0)).toBe('dead')
      expect(board.stateAt(1, 2)).toBe('dead')
    })
  })

  Scenario('A 2x2 block never changes', ({ Given, When, Then }) => {
    let board: Board
    let generationBefore: number

    Given('a 2x2 block of live cells with its top-left corner at (0, 0)', () => {
      board = mountBoard()
      board.toggle(0, 0)
      board.toggle(1, 0)
      board.toggle(0, 1)
      board.toggle(1, 1)
    })
    When('the next generation is computed', () => {
      generationBefore = board.generation()
      board.advance()
      expect(board.generation()).toBe(generationBefore + 1)
    })
    Then('the block should be unchanged', () => {
      // The black-box form of the old `expect(cells).toEqual(before)`: the
      // four cells are still alive AND nothing else came to life. liveCount
      // counts mounted cells only, which is sound here because every cell
      // that could possibly be born is adjacent to a block at the origin and
      // therefore inside the mounted window.
      expect(board.stateAt(0, 0)).toBe('alive')
      expect(board.stateAt(1, 0)).toBe('alive')
      expect(board.stateAt(0, 1)).toBe('alive')
      expect(board.stateAt(1, 1)).toBe('alive')
      expect(board.liveCount()).toBe(4)
    })
  })
})
