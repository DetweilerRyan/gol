// Step definitions for camera-pan-and-zoom.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/. A step that reached into src/ would recreate the
// white-box acceptance layer this programme exists to retire, under a new
// filename. Anything a step needs that it cannot reach through e2e-helpers is
// a reason to widen e2e-helpers, never to import around it.
//
// SHARED STEPS LIVE HERE. Cucumber's step registry is global: every module
// under features/steps/ is loaded for every feature, and two modules defining
// the same step text is an ambiguous-step error, not an override. So the
// three camera steps that other features also use are defined once, in this
// module, because the camera is what they are about:
//
//   Given a camera centered on the origin at the default zoom
//         (also grid-scrollbars.feature, mouse-wheel-controls.feature)
//   Then  the zoom level should be unchanged
//         (also grid-scrollbars.feature, mouse-wheel-controls.feature)
//   Then  the zoom percentage should be <n>
//
// PIXEL BASELINE. Every scenario here starts from the application's own boot
// camera at the fixed 1280x900 viewport, which puts the world origin at
// CENTER. The centered-origin Given ASSERTS that rather than assuming it, so
// the later "the camera should have moved ..." steps can state a movement as
// a displacement from CENTER without carrying a recorded before-value across
// steps.
import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
import {
  CENTER,
  cellScreenPosition,
  axisLabelValues,
  dragPan,
  openGrid,
  recall,
  remember,
  resetView,
  zoomIn,
  zoomOut,
  zoomPercent,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// Clicks the zoom button one step at a time until the clamp saturates -- the
// same ladder a player climbs by clicking the toolbar button repeatedly,
// which is what makes "until the zoom stops changing" a statement about the
// application rather than about some particular number of clicks. Requires
// two consecutive unchanged readings, so a single stale read of the badge
// cannot end the loop early and report a clamp that was never reached.
async function zoomUntilSettled(page: Page, direction: 'in' | 'out') {
  let previous = await zoomPercent(page)
  let unchanged = 0
  for (let click = 0; click < 25 && unchanged < 2; click++) {
    await (direction === 'in' ? zoomIn(page) : zoomOut(page))
    const current = await zoomPercent(page)
    unchanged = current === previous ? unchanged + 1 : 0
    previous = current
  }
  if (unchanged < 2) throw new Error(`Zooming ${direction} never stopped changing`)
}

// On each axis, every coordinate label on show has its own negation on show
// too -- the ruler-visible form of "the origin is in the middle of the view".
// Reported per axis and never merged: a merged multiset passes for a camera
// far enough off-centre that the origin is nowhere on screen at all. An empty
// axis is FALSE rather than trivially balanced, which is what stops the
// clause passing for an axis showing no coordinates.
function isBalancedAroundOrigin(labels: readonly number[]): boolean {
  if (labels.length === 0) return false
  const ascending = (values: readonly number[]) => [...values].sort((a, b) => a - b).join(',')
  // `|| 0` normalizes the -0 that negating the origin's own label produces.
  return ascending(labels) === ascending(labels.map((label) => -label || 0))
}

async function balancedAxes(page: Page): Promise<{ x: boolean; y: boolean }> {
  return {
    x: isBalancedAroundOrigin(await axisLabelValues(page, 'x')),
    y: isBalancedAroundOrigin(await axisLabelValues(page, 'y')),
  }
}

Given('a camera centered on the origin at the default zoom', async ({ page }) => {
  await openGrid(page)
  await expect.poll(() => zoomPercent(page)).toBe(100)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
})

Given('I have panned and zoomed away from that view', async ({ page }) => {
  await dragPan(page, 300, 300, 500, 500, 20)
  await zoomUntilSettled(page, 'in')
})

When('I pan the camera by {int} pixels right and {int} pixels down', async ({ page }, right, down) => {
  remember(page, 'panRight', right)
  remember(page, 'panDown', down)
  await dragPan(page, CENTER.x, CENTER.y, right, down)
})

When('I zoom in once', async ({ page }) => {
  await zoomIn(page)
})

When('I zoom out once', async ({ page }) => {
  await zoomOut(page)
})

When('I zoom in repeatedly until the zoom stops changing', async ({ page }) => {
  await zoomUntilSettled(page, 'in')
})

When('I zoom out repeatedly until the zoom stops changing', async ({ page }) => {
  await zoomUntilSettled(page, 'out')
})

When('I reset the view for an {int} by {int} pixel viewport', async ({ page }, width, height) => {
  await page.setViewportSize({ width, height })
  await resetView(page)
})

// The grid moving RIGHT AND DOWN under a fixed viewport is the camera moving
// LEFT AND UP over the grid -- the same sign convention the pure module
// states as offsetX/offsetY decreasing. Stated as a displacement of the
// origin from where the centered-origin Given asserted it, and pinned to the
// exact distance the pan was asked for rather than only to its direction.
Then('the camera should have moved left and up over the grid', async ({ page }) => {
  const origin = await cellScreenPosition(page, 0, 0)
  expect(origin.x).toBeGreaterThan(CENTER.x)
  expect(origin.y).toBeGreaterThan(CENTER.y)
  expect(origin).toEqual({ x: CENTER.x + recall(page, 'panRight'), y: CENTER.y + recall(page, 'panDown') })
})

Then('the zoom level should be unchanged', async ({ page }) => {
  await expect.poll(() => zoomPercent(page)).toBe(100)
})

Then('the zoom percentage should be {int}', async ({ page }, percentage) => {
  await expect.poll(() => zoomPercent(page)).toBe(percentage)
})

// Polled: the preceding step resizes the viewport, and the ruler re-renders
// off a ResizeObserver measurement that lands a frame or two after the resize
// call returns.
Then('the coordinate labels in view should be balanced around the origin', async ({ page }) => {
  await expect.poll(() => balancedAxes(page)).toEqual({ x: true, y: true })
})
