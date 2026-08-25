// Step definitions for infinite-grid.feature, driving the real application in
// a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/.
//
// This module defines only the steps unique to this feature. The ones it
// shares are defined once elsewhere, because the step registry is global
// across features/steps/ and a duplicate text is an ambiguous-step error:
// "an empty grid", "a horizontal blinker centered at (<x>, <y>)", "the next
// generation is computed" and "the cell at (<x>, <y>) should be alive" all
// live in cell-life-and-death.ts.
//
// WHAT MAKES THIS FEATURE BROWSER-TESTABLE AT ALL. The grid is infinite, but
// only a bounded window of it is ever mounted -- so a cell at (100, -100) has
// no DOM node until the camera is moved there. withCellInView pans to it,
// does the work, and puts the camera back, which is exactly the claim this
// feature makes: state at a far coordinate is not a rendering artifact of
// wherever the viewport happens to be. Every assertion below at (100, -100)
// is made after the cell has been scrolled away from and back.
import { createBdd } from 'playwright-bdd'
import { clickCell, expectBlinker } from '../e2e-helpers'

const { When, Then } = createBdd()

When(
  'I toggle the cells at \\({int}, {int}\\) and \\({int}, {int}\\)',
  async ({ page }, firstX, firstY, secondX, secondY) => {
    await clickCell(page, firstX, firstY)
    await clickCell(page, secondX, secondY)
  },
)

Then('the blinker at \\({int}, {int}\\) should be vertical', async ({ page }, x, y) => {
  await expectBlinker(page, x, y, 'vertical')
})
