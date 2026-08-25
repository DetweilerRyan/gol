// Step definitions for grid-reference-lines.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/, and -- read this before adding an assertion here -- NO
// CSS SELECTOR OF ITS OWN.
//
// THE REACH-AROUND, AND WHY IT IS NOT IN THIS FILE. "It should be a major
// gridline" has no accessible affordance at all: a ruler label is a <span>
// whose only axis attribution is the Tailwind class pinning it to the top or
// left strip. The only way to observe this feature through the browser is to
// select on that class. That selector lives in features/e2e-helpers.ts
// (xAxisLabels/yAxisLabels, with the deletion trigger recorded next to it) so
// it appears exactly once in features/ and the `ruler-label-axis-affordance`
// slice can replace it with a single edit. This module reads the coordinate
// numbers through axisLabelValues and never names a class.
//
// WHAT "A MAJOR GRIDLINE" MEANS TO A PLAYER: the coordinate is one of the
// numbers written along the edge of the viewport. The pure-module layer
// states the same clause as isMajorGridline(n), which is arithmetic; this is
// the same fact as the thing on screen that the arithmetic exists to produce.
import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
import { axisLabelValues, openGrid, recall, remember, withCellInView } from '../e2e-helpers'

const { Given, Then } = createBdd()

// A label is only on screen if its coordinate is in view, so the coordinate
// is panned into view before the ruler is read -- otherwise the clause would
// be false for a coordinate that IS a major gridline and merely off-screen,
// which is a fact about the camera rather than about gridlines. A coordinate
// already in view costs no pan.
async function labelIsOnShow(page: Page, coordinate: number): Promise<boolean> {
  return withCellInView(page, coordinate, 0, async () => (await axisLabelValues(page, 'x')).includes(coordinate))
}

Given('a coordinate of {int}', async ({ page }, coordinate) => {
  await openGrid(page)
  remember(page, 'coordinate', coordinate)
})

Then('it should be a major gridline', async ({ page }) => {
  const coordinate = recall(page, 'coordinate')
  expect(await labelIsOnShow(page, coordinate)).toBe(true)
})

Then('it should not be a major gridline', async ({ page }) => {
  const coordinate = recall(page, 'coordinate')
  expect(await labelIsOnShow(page, coordinate)).toBe(false)
})
