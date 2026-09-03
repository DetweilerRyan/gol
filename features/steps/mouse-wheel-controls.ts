// Step definitions for mouse-wheel-controls.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/.
//
// BORROWED, defined once in camera-pan-and-zoom.ts -- the step registry is
// global across features/steps/, so defining any of these again here would be
// an ambiguous-step error rather than an override:
//   Given a camera centered on the origin at the default zoom
//   Then  the zoom level should be unchanged
//   Then  the zoom percentage should be <n>
//
// That last one is borrowed deliberately rather than restated locally. It
// asserts the RESTING zoom -- it waits for the readout to stop changing before
// reading it -- which is what makes "should be 125" mean 125 rather than
// "125 was passed through on the way somewhere else". A wheel zoom is
// instantaneous today, so the wait costs nothing; borrowing it is what keeps
// this feature honest if that ever stops being true. It replaced this module's
// own "should be above/below 100" pair, which were strictly weaker and are now
// gone: every scenario here names the exact percentage it comes to rest on.
//
// This is the one feature whose steps use the REAL wheel: page.mouse.wheel
// dispatches a native wheel event, which is the only way to exercise the
// non-passive listener useWheelInput installs and the modifier branches inside
// it. The pure-module layer states the same clauses against applyWheelInput
// directly.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { CENTER, originDisplacement, pinchWheel, recall, remember, shiftWheel } from '../e2e-helpers'

const { When, Then } = createBdd()

// ONE NOTCH OF A MOUSE WHEEL, in the pixels a browser reports for it.
//
// A detented wheel reports its clicks in whole notches and a browser turns one
// notch into a wheel event of this size, so "notches" is what the contract
// counts and this is the only place the pixel figure appears. The contract
// never names it, which is the point: a scenario says "up 2 notches" and means
// the gesture, not the number.
//
// The contract pins one notch to 125% and two to 156% -- the same two rungs
// camera-pan-and-zoom.feature already pins for one and two toolbar zoom-in
// clicks. That agreement is a promise in its own right (the same gesture size
// lands on the same rung whichever control makes it) and it is what fixes the
// scale a rolled distance is read on.
const WHEEL_NOTCH_PX = 100

// The contract's whole vocabulary for which way a wheel is rolled. Rolling up
// zooms in, which is a NEGATIVE delta -- the sign convention lives here and
// nowhere in the .feature.
//
// The throw is load-bearing rather than defensive. This value arrives from an
// Examples cell, and npm run acceptance-mutation perturbs those cells: a
// mutated "up" must make the scenario FAIL, and it does so here, loudly and by
// name. Falling back to a default direction would absorb the mutant silently,
// which is precisely the weakness that runner exists to find.
const WHEEL_DIRECTIONS: Record<string, number> = { up: -1, down: 1 }

function notchDeltaY(direction: string, notches: number): number {
  const sign = WHEEL_DIRECTIONS[direction]
  if (sign === undefined) {
    throw new Error(`Unknown wheel direction "${direction}" -- the contract rolls the wheel "up" or "down".`)
  }
  return sign * notches * WHEEL_NOTCH_PX
}

When(
  'I scroll the wheel {int} pixels sideways and {int} pixels down without holding shift',
  async ({ page }, sideways, down) => {
    remember(page, 'wheelSideways', sideways)
    remember(page, 'wheelDown', down)
    await page.mouse.move(CENTER.x, CENTER.y)
    await page.mouse.wheel(sideways, down)
  },
)

// The two singular-notch steps are spelled out rather than folded into the
// outline below, because a Scenario Outline substitutes into fixed step text
// and "1 notches" is not a sentence. They carry the contract's most important
// pair of numbers -- the familiar single-notch rungs, unchanged by this slice.
When('I scroll the wheel up one notch while holding shift', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY('up', 1))
})

When('I scroll the wheel down one notch while holding shift', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY('down', 1))
})

// The direction is QUOTED in the .feature, which is a mutation-survivability
// decision rather than a stylistic one. acceptance-mutation perturbs the cell,
// and a bare {word} placeholder would let a perturbation containing a space
// stop the step MATCHING at all -- and a step that matches nothing is a bddgen
// generation failure, which is all-or-nothing across every feature in the
// batch, so one such mutant would take down the entire mutant phase rather
// than scoring as a kill. Inside quotes any perturbation still matches, and
// notchDeltaY above is what turns it into a named failure.
When('I scroll the wheel {string} {int} notches while holding shift', async ({ page }, direction, notches) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY(direction, notches))
})

// Two gestures in one step because the claim is about the PAIR: a roll and its
// reverse compose back to where they started. Split across two When steps it
// would not be one claim, and the feature's only-one-when rule forbids it
// anyway.
When(
  'I scroll the wheel up {int} notches and then back down {int} notches while holding shift',
  async ({ page }, up, down) => {
    await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY('up', up))
    await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY('down', down))
  },
)

// PINCHING. See pinchWheel in features/screenplay/interactions.ts for what a
// pinch actually is at the browser boundary and for the measurement behind it.
//
// Each pinch is centred on CENTER, which is where the centered-origin Given
// has just asserted the world origin sits. That is deliberate: it makes the
// pinch's own anchor point and the origin the same pixel, so a zoom that holds
// the pinch point fixed holds the origin fixed too. The contract does not
// state that -- it is pixel geometry, and it belongs to the paired e2e spec --
// but the scenarios are set up so that spec can state it without moving.
//
// The pinch distances are the same notch-sized deltas the wheel steps use, so
// "apart" lands on the same 125% a single notch does and "twice as far" on the
// same 156% two notches do. One scale, two input channels.
When('I pinch the grid apart', async ({ page }) => {
  await pinchWheel(page, CENTER.x, CENTER.y, notchDeltaY('up', 1))
})

When('I pinch the grid together', async ({ page }) => {
  await pinchWheel(page, CENTER.x, CENTER.y, notchDeltaY('down', 1))
})

When('I pinch the grid apart twice as far', async ({ page }) => {
  await pinchWheel(page, CENTER.x, CENTER.y, notchDeltaY('up', 2))
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
