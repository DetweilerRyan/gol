// Step definitions for mouse-wheel-controls.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/.
//
// "a camera centered on the origin at the default zoom" and "the zoom level
// should be unchanged" are shared with camera-pan-and-zoom.feature and are
// defined once, in camera-pan-and-zoom.ts -- the step registry is global
// across features/steps/, so defining either again here would be an
// ambiguous-step error rather than an override.
//
// This is the one feature whose steps use the REAL wheel: page.mouse.wheel
// dispatches a native wheel event, which is the only way to exercise the
// non-passive listener useWheelInput installs and the shift-modifier branch
// inside it. The pure-module layer states the same three clauses against
// applyWheelInput directly.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { CENTER, originDisplacement, recall, remember, shiftWheel, zoomPercent } from '../e2e-helpers'

const { When, Then } = createBdd()

// The wheel magnitude never reaches the camera for a zoom -- applyWheelInput
// reads only the sign of the delta and steps by the application's own zoom
// factor -- so one arbitrary non-zero roll stands for "up" and its negation
// for "down".
const WHEEL_ROLL_PX = 100

When(
  'I scroll the wheel {int} pixels sideways and {int} pixels down without holding shift',
  async ({ page }, sideways, down) => {
    remember(page, 'wheelSideways', sideways)
    remember(page, 'wheelDown', down)
    await page.mouse.move(CENTER.x, CENTER.y)
    await page.mouse.wheel(sideways, down)
  },
)

When('I scroll the wheel up while holding shift', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, -WHEEL_ROLL_PX)
})

When('I scroll the wheel down while holding shift', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, WHEEL_ROLL_PX)
})

// A wheel-pan follows the document-scroll convention: rolling the content
// down and to the right moves the CAMERA down and right into the grid, which
// on screen is the origin moving up and to the left. Pinned to the exact
// distance rolled, not only to its direction.
Then('the camera should have moved down and right into the grid', async ({ page }) => {
  const moved = await originDisplacement(page)
  expect(moved.x).toBeLessThan(0)
  expect(moved.y).toBeLessThan(0)
  expect(moved).toEqual({ x: -recall(page, 'wheelSideways'), y: -recall(page, 'wheelDown') })
})

Then('the zoom percentage should be above {int}', async ({ page }, percentage) => {
  await expect.poll(() => zoomPercent(page)).toBeGreaterThan(percentage)
})

Then('the zoom percentage should be below {int}', async ({ page }, percentage) => {
  await expect.poll(() => zoomPercent(page)).toBeLessThan(percentage)
})
