// Step definitions for grid-scrollbars.feature, driving the real application
// in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/.
//
// "a camera centered on the origin at the default zoom" and "the zoom level
// should be unchanged" are shared with camera-pan-and-zoom.feature and are
// defined once, in camera-pan-and-zoom.ts.
//
// THE 800 BY 600 VIEWPORT IS REAL HERE. "When the scrollbars are drawn for an
// 800 by 600 pixel viewport" resizes the browser viewport to exactly that,
// rather than being a no-op the way it would be if this layer simply ignored
// the number. What it does NOT do is re-centre the camera for the new size:
// the app centres once, on its first measurement, so the camera stays centred
// for the 1280x900 boot viewport the preceding Given asserted it against. No
// clause in this feature discriminates the two -- checked per scenario -- but
// it is the one place this layer and the pure-module layer set up differently.
//
// HOW EACH THUMB CLAUSE IS OBSERVED, and every one of them is now read off
// something the app announces:
//   "sits at the start / end of its track" -> aria-valuenow, the accessible
//     value the scrollbar announces (0 at the start, 100 at the end).
//   "fills its track" / "is shorter than its track" / "covers a quarter of its
//     track" -> the integer percentage the thumb's accessible description
//     announces, via visibleProportionPercent. That serves all three clauses
//     EXACTLY -- 100, under 100, 25 -- where the thumb-versus-track pixel
//     measurement it replaced needed a tolerance at both ends to absorb
//     sub-pixel layout rounding.
//
// WHAT THIS CHANNEL CANNOT FALSIFY IS PIXEL CONTAINMENT: both aria-valuenow
// and the announced proportion derive from computeScrollbarMetrics, which
// never sees trackLengthPx, so no clause defined here can see a thumb painted
// past the end of its track -- measured rather than inferred, since all 73
// e2e tests passed both before and after a change that moved every rendered
// thumb by 10px. The test that does falsify it is
// features/grid-scrollbars.e2e.spec.ts's "the rendered thumb stays inside its
// own track on both axes, at rest and panned far past all content", whose own
// THE SOLE CHANNEL comment points back at this layer.
import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
import {
  aliveCellCount,
  CENTER,
  cellScreenPosition,
  clickCell,
  DEFAULT_CELL_SIZE_PX,
  dragPan,
  dragScrollbarThumb,
  openGrid,
  thumbPositionPercent,
  visibleProportionPercent,
  type ScrollbarOrientation,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// A thumb fills its track exactly when the scrollbar announces that all of the
// grid is in view, so this is an exact 100 rather than a threshold: thumbRatio
// is clamped to 1, and the closest any genuinely-short thumb in this feature
// comes to it is the quarter-track one, at 25.
const ALL_IN_VIEW_PERCENT = 100

async function expectThumbFillsTrack(page: Page, orientation: ScrollbarOrientation, fills: boolean) {
  const assertion = expect.poll(() => visibleProportionPercent(page, orientation))
  if (fills) await assertion.toBe(ALL_IN_VIEW_PERCENT)
  else await assertion.toBeLessThan(ALL_IN_VIEW_PERCENT)
}

Given('a grid with no live cells', async ({ page }) => {
  await openGrid(page)
  expect(await aliveCellCount(page)).toBe(0)
})

Given('a grid with a single live cell at \\({int}, {int}\\)', async ({ page }, x, y) => {
  await openGrid(page)
  await clickCell(page, x, y)
})

// Built from the corners of the rectangle the prose describes rather than by
// filling it in: content bounds are a bounding box, so the three boundary
// cells produce exactly the box `across` by `down` cells of live content
// produces, at three clicks instead of hundreds.
Given('a grid with live cells spanning {int} cells across and {int} cells down', async ({ page }, across, down) => {
  await openGrid(page)
  await clickCell(page, 0, 0)
  if (down > 1) await clickCell(page, 0, down - 1)
  if (across > 1) await clickCell(page, across - 1, 0)
})

Given('a camera panned {int} cells right of the origin at the default zoom', async ({ page }, cells) => {
  await dragPan(page, CENTER.x, CENTER.y, -cells * DEFAULT_CELL_SIZE_PX, 0, 50)
})

When('the scrollbars are drawn for an {int} by {int} pixel viewport', async ({ page }, width, height) => {
  await page.setViewportSize({ width, height })
})

When(
  'I drag the vertical scrollbar thumb down by {int} pixels while it fills its track',
  async ({ page }, pixels: number) => {
    await expectThumbFillsTrack(page, 'vertical', true)
    await dragScrollbarThumb(page, 'vertical', pixels)
  },
)

// The quarter-track thumb is engineered here, in the When, because the
// scenario's Given never establishes any content -- and a thumb only shrinks
// when there is content wider than the view. Content bounds of -224..1 cells
// against a 1280px viewport put exactly a quarter of the grid in view, which
// the step then asserts before dragging rather than assuming.
When(
  'I drag the horizontal scrollbar thumb right by {int} pixels while it covers a quarter of its track',
  async ({ page }, pixels: number) => {
    await clickCell(page, -224, 0)
    await clickCell(page, 0, 0)
    await expect.poll(() => visibleProportionPercent(page, 'horizontal')).toBe(25)
    await dragScrollbarThumb(page, 'horizontal', pixels)
  },
)

// The four "fill / be shorter than" Thens differ only by orientation and
// polarity -- collapsed into one regex-pattern step rather than four
// cucumber-expression ones, since StepPattern accepts a RegExp (playwright-bdd
// is built on @cucumber/cucumber-expressions, same as cucumber-js). This
// changes no .feature text: each of the four sentences the Examples tables
// use still matches, and bddgen's all-or-nothing "every step resolves" check
// (playwright.config.ts) is what proves it.
Then(
  /^the (horizontal|vertical) thumb should (fill|be shorter than) its track$/,
  async ({ page }, orientation, verb) => {
    await expectThumbFillsTrack(page, orientation as ScrollbarOrientation, verb === 'fill')
  },
)

Then(
  /^the (horizontal|vertical) thumb should sit at the (start|end) of its track$/,
  async ({ page }, orientation, position) => {
    await expect
      .poll(() => thumbPositionPercent(page, orientation as ScrollbarOrientation))
      .toBe(position === 'start' ? 0 : 100)
  },
)

// Dragging the thumb down pans the camera DOWN the grid, which on screen is
// the content -- and so the origin -- moving up by the same distance.
Then('the camera should have moved {int} pixels down the grid', async ({ page }, pixels) => {
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual({ x: CENTER.x, y: CENTER.y - pixels })
})

Then('the camera should have moved {int} pixels right across the grid', async ({ page }, pixels) => {
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual({ x: CENTER.x - pixels, y: CENTER.y })
})
