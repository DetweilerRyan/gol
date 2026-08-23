import { test } from '@playwright/test'
import { cellLocator, dragPan, expectCellState, resetView, CENTER } from './e2e-helpers'

// Adaptation: the Gherkin scenario (infinite-grid.feature) toggles cells at
// (-500, -500) and (1000000, -1000000) -- reachable instantly via
// toggleCell() directly, but not via any real UI action (there's no
// coordinate-jump input, and dragging a million world-units isn't a real
// user gesture). These specs test the same underlying claim -- the grid has
// no boundaries, negative coordinates work, and cells persist arbitrarily
// far from the origin, not just within whatever's currently rendered -- at
// a scale that's actually reachable via realistic panning.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('cells placed far from the origin, including negative coordinates, persist after scrolling away and back', async ({
  page,
}) => {
  await cellLocator(page, -20, -15).click()
  await expectCellState(page, -20, -15, 'alive')

  // dx=-2000 -> offsetX' = -32 + 2000/20 = 68, visible range x: 66..134.
  await dragPan(page, CENTER.x, CENTER.y, -2000, 0, 20)
  await cellLocator(page, 100, 0).click()
  await expectCellState(page, 100, 0, 'alive')

  await resetView(page)

  // The first cell was scrolled entirely out of the rendered window and
  // back -- its state must have persisted independent of rendering, proving
  // the sparse Set<CellKey> model isn't a viewport-local rendering trick.
  await expectCellState(page, -20, -15, 'alive')
})

const BLINKER_ROWS = [
  { label: 'at the origin', x: 0, y: 0 },
  { label: 'at negative coordinates, visible by default', x: -20, y: -15 },
] as const

for (const { label, x, y } of BLINKER_ROWS) {
  test(`a horizontal blinker becomes vertical ${label}`, async ({ page }) => {
    await cellLocator(page, x - 1, y).click()
    await cellLocator(page, x, y).click()
    await cellLocator(page, x + 1, y).click()

    await page.locator('#next-generation-button').click()

    await expectCellState(page, x, y - 1, 'alive')
    await expectCellState(page, x, y, 'alive')
    await expectCellState(page, x, y + 1, 'alive')
    await expectCellState(page, x - 1, y, 'dead')
    await expectCellState(page, x + 1, y, 'dead')
  })
}

test('a horizontal blinker becomes vertical after being reached by real panning', async ({ page }) => {
  // dx=-2000 -> offsetX' = -32 + 100 = 68, visible range x: 66..134.
  await dragPan(page, CENTER.x, CENTER.y, -2000, 0, 20)

  await cellLocator(page, 99, 0).click()
  await cellLocator(page, 100, 0).click()
  await cellLocator(page, 101, 0).click()

  await page.locator('#next-generation-button').click()

  await expectCellState(page, 100, -1, 'alive')
  await expectCellState(page, 100, 0, 'alive')
  await expectCellState(page, 100, 1, 'alive')
  await expectCellState(page, 99, 0, 'dead')
  await expectCellState(page, 101, 0, 'dead')
})
