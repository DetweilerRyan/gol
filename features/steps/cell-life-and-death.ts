// Step definitions for cell-life-and-death.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/: a step that reached into src/gameOfLife would be
// asserting the rules against themselves, which is the white-box layer this
// programme retires, not an acceptance test.
//
// SHARED STEPS LIVE HERE. The step registry is global across features/steps/,
// so a step text may be defined exactly once. These four are also used by
// infinite-grid.feature, and are defined in this module because the life
// rules are what they are about:
//
//   Given an empty grid
//   Given a horizontal blinker centered at (<x>, <y>)
//   When  the next generation is computed
//   Then  the cell at (<x>, <y>) should be alive / should be dead
//
// TWO MORE BORROWERS ARRIVED WITH THE CHROME-PROPAGATION RULING.
// camera-pan-and-zoom.feature now opens its own "Pressing a zoom control
// brings no cell to life underneath it" with "an empty grid" before its
// camera Given, and "Then no cell should be alive" -- defined below -- is
// borrowed by that scenario and by grid-scrollbars.feature's vertical-thumb
// drag. Both are about whether the board is still empty, which is this
// module's subject and not the camera's or the scrollbar's, so the definition
// lives here and neither borrower imports anything to say so.
//
// REACHING A CELL. Only a bounded window of the infinite grid is mounted, so
// every cell interaction goes through withCellInView: a mounted cell is
// clicked or read where it is, and an off-screen one is panned into view and
// the camera put back. That is what lets infinite-grid.feature reuse the
// blinker Given at (100, -100).
import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
import {
  aliveCellCount,
  cellState,
  clickCells,
  expectBlinker,
  expectCellState,
  generationCount,
  nextGeneration,
  openGrid,
  recall,
  remember,
  withCellInView,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// The order neighbors are switched on in. Any order works -- the rules count
// neighbors, they don't rank them -- but a fixed one keeps the <neighbors>
// column reproducible.
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

// The cell whose fate the neighbor-count outline is about. The rules are
// translation-invariant, so the coordinate is arbitrary; the origin is simply
// always on screen.
const SUBJECT = { x: 0, y: 0 }

// Batched through ONE withCellInView so a group of cells costs at most one
// pan: they are always within a cell or two of each other, so bringing the
// first into view brings the rest.
async function toggleCells(page: Page, cells: ReadonlyArray<readonly [number, number]>) {
  await clickCells(page, cells)
}

async function expectCells(page: Page, cells: ReadonlyArray<readonly [number, number, 'alive' | 'dead']>) {
  if (cells.length === 0) return
  const [firstX, firstY] = cells[0]
  await withCellInView(page, firstX, firstY, async () => {
    for (const [x, y, state] of cells) {
      await expectCellState(page, x, y, state)
    }
  })
}

function blinker(centerX: number, centerY: number, orientation: 'horizontal' | 'vertical') {
  const step = orientation === 'horizontal' ? ([1, 0] as const) : ([0, 1] as const)
  return [-1, 0, 1].map((offset) => [centerX + offset * step[0], centerY + offset * step[1]] as const)
}

Given('an empty grid', async ({ page }) => {
  await openGrid(page)
  expect(await aliveCellCount(page)).toBe(0)
})

Given('a live cell at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await openGrid(page)
  await toggleCells(page, [[x, y]])
  await expectCells(page, [[x, y, 'alive']])
})

Given('a cell that is {word}', async ({ page }, state: string) => {
  await openGrid(page)
  if (state === 'alive') await toggleCells(page, [[SUBJECT.x, SUBJECT.y]])
  expect(await cellState(page, SUBJECT.x, SUBJECT.y)).toBe(state)
})

Given('it has {int} live neighbors', async ({ page }, neighbors: number) => {
  const subjectWasAlive = (await cellState(page, SUBJECT.x, SUBJECT.y)) === 'alive'
  await toggleCells(
    page,
    NEIGHBOR_OFFSETS.slice(0, neighbors).map(([dx, dy]) => [SUBJECT.x + dx, SUBJECT.y + dy]),
  )
  // Exactly as many cells are alive as the two Givens asked for -- so a
  // <neighbors> value the offsets table cannot supply fails here rather than
  // silently under-populating the board.
  expect(await aliveCellCount(page)).toBe(neighbors + (subjectWasAlive ? 1 : 0))
})

Given('a horizontal blinker centered at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await openGrid(page)
  remember(page, 'blinkerX', x)
  remember(page, 'blinkerY', y)
  await toggleCells(page, blinker(x, y, 'horizontal'))
})

Given('a vertical blinker centered at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await openGrid(page)
  remember(page, 'blinkerX', x)
  remember(page, 'blinkerY', y)
  await toggleCells(page, blinker(x, y, 'vertical'))
})

Given('a 2x2 block of live cells with its top-left corner at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await openGrid(page)
  remember(page, 'blockX', x)
  remember(page, 'blockY', y)
  await toggleCells(page, [
    [x, y],
    [x + 1, y],
    [x, y + 1],
    [x + 1, y + 1],
  ])
})

// The generation counter moving is part of the step, not decoration: several
// scenarios expect the subject cell to end up DEAD, which is also its state
// if nothing ran at all. Reading the counter is how this layer tells "the
// rule says dead" apart from "the button did nothing".
When('the next generation is computed', async ({ page }) => {
  const before = await generationCount(page)
  await nextGeneration(page)
  await expect.poll(() => generationCount(page)).toBe(before + 1)
})

// THE NEGATIVE HALF OF THE STEP ABOVE, reading the same counter, and defined
// here rather than beside its caller because the generation is this module's
// vocabulary -- keyboard-grid-navigation.feature borrows it by writing the
// same text, the way it already borrows "an empty grid".
//
// ABSOLUTE RATHER THAN A REMEMBERED DELTA, deliberately. A delta form would
// need a Given to have recorded a baseline, and the step would then pass
// vacuously in any scenario that forgot to. Every scenario reaching this one
// opens a fresh grid, so "its first generation" is a state that can be named
// outright -- and naming it is what makes the step fail when a stray Enter
// listener advances the game behind the scenario's back.
Then('the game should still be on its first generation', async ({ page }) => {
  expect(await generationCount(page)).toBe(0)
})

// THE POSITIVE TWIN OF THE STEP ABOVE, reading the same counter and defined
// beside it so one module owns the generation. Borrowed by
// generation-control.feature, whose whole subject is which act advances the
// game and by how much.
//
// ABSOLUTE FOR THE SAME REASON, and here the reason bites harder: this step's
// entire job is to fail when a keystroke advances the game TWICE, and a
// remembered-delta form would have to be told what "twice" was measured
// against. Every scenario reaching it opens a fresh grid and advances once, so
// "its second generation" is a state that can simply be named.
//
// POLLED RATHER THAN READ ONCE, unlike its sibling. A negative claim is safe
// to read immediately -- a counter that has not moved cannot move late -- but a
// positive one is racing React's render of the new count, exactly as the
// "next generation is computed" step above is.
Then('the game should be on its second generation', async ({ page }) => {
  await expect.poll(() => generationCount(page)).toBe(1)
})

When('I toggle the cell at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await toggleCells(page, [[x, y]])
})

Then('the cell at \\({int}, {int}\\) should be alive', async ({ page }, x, y) => {
  await expectCells(page, [[x, y, 'alive']])
})

Then('the cell at \\({int}, {int}\\) should be dead', async ({ page }, x, y) => {
  await expectCells(page, [[x, y, 'dead']])
})

// THE WHOLE-BOARD FORM OF THE CLAUSE ABOVE, and the one clause that can say a
// press or a drag aimed at the app's own chrome edited nothing. Naming a
// coordinate would be worse than useless here: the cell a control happens to
// cover is a different cell at every viewport, so the claim is about the board
// rather than about any cell in it.
//
// POLLED, unlike "the game should still be on its first generation" further
// up, which reads its counter once because a counter that has not moved cannot
// move late. That argument does not carry over. A cell brought to life by a
// leaked pointer event arrives with React's next render, so an immediate read
// can pass in the window before the mount this step exists to catch -- the
// poll is waiting for a defect to appear, not for a value to settle.
Then('no cell should be alive', async ({ page }) => {
  await expect.poll(() => aliveCellCount(page)).toBe(0)
})

// Compared against the expected word directly, rather than reduced to a
// boolean via `=== 'alive'`, so a mutated <next state> value is always
// detected and not only the mutations that happen to land on "alive".
Then('the cell should end up {word}', async ({ page }, expected: string) => {
  expect(await cellState(page, SUBJECT.x, SUBJECT.y)).toBe(expected)
})

Then('the blinker should be vertical', async ({ page }) => {
  await expectBlinker(page, recall(page, 'blinkerX'), recall(page, 'blinkerY'), 'vertical')
})

Then('the blinker should be horizontal', async ({ page }) => {
  await expectBlinker(page, recall(page, 'blinkerX'), recall(page, 'blinkerY'), 'horizontal')
})

// Unlike the shape assertion above -- derived from the remembered center,
// which moves in lockstep with a mutated <x>/<y> -- this reads independent
// literal columns pinned in the Examples table, so it still catches a mutated
// <x> or <y> that the shape assertion cannot.
Then(
  'the blinker should be centered at the literal coordinate \\({int}, {int}\\)',
  async ({ page }, centerX, centerY) => {
    await expectCells(page, [
      [centerX, centerY - 1, 'alive'],
      [centerX, centerY, 'alive'],
      [centerX, centerY + 1, 'alive'],
    ])
  },
)

// The four cells are still alive AND nothing else came to life. aliveCellCount
// counts mounted cells only, which is sound here because every cell that
// could possibly be born is adjacent to the block and therefore inside the
// mounted window.
Then('the block should be unchanged', async ({ page }) => {
  const x = recall(page, 'blockX')
  const y = recall(page, 'blockY')
  await expectCells(page, [
    [x, y, 'alive'],
    [x + 1, y, 'alive'],
    [x, y + 1, 'alive'],
    [x + 1, y + 1, 'alive'],
  ])
  expect(await aliveCellCount(page)).toBe(4)
})
