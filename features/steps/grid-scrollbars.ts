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
// HOW EACH THUMB CLAUSE IS OBSERVED:
//   "sits at the start / end of its track" -> aria-valuenow, the accessible
//     value the scrollbar announces (0 at the start, 100 at the end).
//   "fills its track" / "is shorter than its track" -> thumb geometry against
//     the track's own box. REACH-AROUND: there is no accessible expression of
//     how much of the content is visible -- aria-valuemin/max are fixed 0 and
//     100 and say only where the thumb sits, never how long it is. See
//     thumbTrackFraction in features/screenplay/questions.ts, reached through
//     ../e2e-helpers.
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
  thumbTrackFraction,
  type ScrollbarOrientation,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// A thumb covering this much of its track is reported as filling it. The
// exact value is 1 -- computeThumbGeometry clamps the length to the track --
// so the tolerance absorbs sub-pixel layout rounding only, not a genuinely
// shrunken thumb: the shortest thumb any scenario here produces covers 0.25
// of its track, and the longest genuinely-short one 0.17.
const FILLS_TRACK = 0.99

async function expectThumbFillsTrack(page: Page, orientation: ScrollbarOrientation, fills: boolean) {
  const assertion = expect.poll(() => thumbTrackFraction(page, orientation))
  if (fills) await assertion.toBeGreaterThan(FILLS_TRACK)
  else await assertion.toBeLessThan(FILLS_TRACK)
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
// against a 1280px viewport give a thumb ratio of exactly 0.25, which the
// step then asserts before dragging rather than assuming.
When(
  'I drag the horizontal scrollbar thumb right by {int} pixels while it covers a quarter of its track',
  async ({ page }, pixels: number) => {
    await clickCell(page, -224, 0)
    await clickCell(page, 0, 0)
    await expect.poll(() => thumbTrackFraction(page, 'horizontal')).toBeCloseTo(0.25, 2)
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
