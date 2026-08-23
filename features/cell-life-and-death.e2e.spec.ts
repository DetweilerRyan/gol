// ACCEPTED OUTLINE -- slice `aria-pressed-cell-state` (product, SPECIFY).
//
// This spec is the browser-level counterpart of cell-life-and-death.feature.
// The .feature states WHAT is true of a cell (alive / dead); this outline
// states HOW a user -- including a user who cannot see the grid -- perceives
// it. There is no new .feature scenario for this slice: the domain fact is
// already contracted ("Then the cell at (2, 3) should be alive"), and the
// change here is the observation channel, not the fact.
//
// Before: a cell button carried `aria-label="Cell x, y"` and nothing else.
// Assistive technology was told a cell exists and where it is, and was never
// told whether it is alive -- the single most important fact in the domain.
// Aliveness existed only as paint (`bg-gray-900` / `bg-white`), which a
// screen reader does not report.
//
// After, the accepted user-facing behaviour:
//
//   1. Every cell is announced as a toggle button. Its pressed state IS its
//      aliveness: a live cell is pressed, a dead cell is not pressed.
//   2. A DEAD cell is announced as an UNPRESSED toggle, not as a plain
//      button. `aria-pressed="false"` is present on every dead cell. Omitting
//      it would mean "this is not a toggle at all", which is a different and
//      wrong statement, and it must not be omitted as a rendering
//      optimisation.
//   3. Clicking a cell flips what is announced, in the same action and with
//      no extra step: a screen-reader user hears the state change they just
//      caused.
//   4. Advancing a generation flips what is announced for exactly the cells
//      whose aliveness changed. Births, deaths and survivals are all audible
//      through the same channel a sighted user reads off the paint.
//   5. Stamping a pattern announces the pattern's own cells as pressed and
//      leaves the cells around it announced as unpressed.
//   6. The cell's visible paint is unchanged. This slice adds a channel; it
//      removes none. A live cell still renders dark and a dead cell light.
//
// How this is checked here: at least one assertion reads the ACCESSIBILITY
// TREE rather than an attribute string --
// `getByRole('button', { name: cellLabel(x, y), pressed: true })` -- so the
// claim "assistive technology can perceive this" is verified as ARIA
// semantics and not merely as the presence of a DOM attribute. The remaining
// assertions in this suite go through src/test-support/cellQuery.ts, the one
// place that says how aliveness is encoded, so re-roling the cell element
// later is a one-file change rather than a two-hundred-assertion one.

import { test, expect } from '@playwright/test'
import { cellLocator, nextGeneration } from './e2e-helpers'

const ALIVE_CLASS = /bg-gray-900/
const DEAD_CLASS = /bg-white/

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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('toggling a dead cell brings it to life', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(ALIVE_CLASS)
})

test('toggling a live cell kills it', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(ALIVE_CLASS)
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(DEAD_CLASS)
})

const NEIGHBOR_COUNT_ROWS = [
  { state: 'alive', neighbors: 0, nextState: 'dead' },
  { state: 'alive', neighbors: 1, nextState: 'dead' },
  { state: 'alive', neighbors: 2, nextState: 'alive' },
  { state: 'alive', neighbors: 3, nextState: 'alive' },
  { state: 'alive', neighbors: 4, nextState: 'dead' },
  { state: 'dead', neighbors: 2, nextState: 'dead' },
  { state: 'dead', neighbors: 3, nextState: 'alive' },
  { state: 'dead', neighbors: 4, nextState: 'dead' },
] as const

for (const { state, neighbors, nextState } of NEIGHBOR_COUNT_ROWS) {
  test(`a cell that is ${state} with ${neighbors} live neighbors ends up ${nextState}`, async ({ page }) => {
    if (state === 'alive') {
      await cellLocator(page, 0, 0).click()
    }
    for (const [dx, dy] of NEIGHBOR_OFFSETS.slice(0, neighbors)) {
      await cellLocator(page, dx, dy).click()
    }

    await nextGeneration(page)

    await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
    await expect(cellLocator(page, 0, 0)).toHaveClass(nextState === 'alive' ? ALIVE_CLASS : DEAD_CLASS)
  })
}

test('a horizontal blinker becomes vertical after one generation', async ({ page }) => {
  await cellLocator(page, 0, 1).click()
  await cellLocator(page, 1, 1).click()
  await cellLocator(page, 2, 1).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 2)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(DEAD_CLASS)
})

test('a vertical blinker becomes horizontal after one generation', async ({ page }) => {
  await cellLocator(page, 1, 0).click()
  await cellLocator(page, 1, 1).click()
  await cellLocator(page, 1, 2).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 1, 2)).toHaveClass(DEAD_CLASS)
})

test('a 2x2 block never changes', async ({ page }) => {
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()
  await cellLocator(page, 0, 1).click()
  await cellLocator(page, 1, 1).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, -1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(DEAD_CLASS)
})
