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

// ONE NOTCH OF A MOUSE WHEEL, CALIBRATED FOR THE BROWSER THIS SUITE RUNS IN.
//
// A detented wheel reports its clicks in whole notches, and this is the pixel
// figure Chromium reports for one of them here. It is NOT a universal
// constant: the same physical notch is reported at a different size by other
// browser and OS combinations, and lands on a different rung of the zoom
// scale there.
//
// That divide is why the number lives in this module and nowhere in the
// contract. The promise a .feature makes -- roll further, zoom further -- is
// browser-independent and belongs there; the pixels-per-notch that turns a
// gesture into a number is a calibration of one browser and belongs here. So
// "notches" is what the contract counts, this is the only place the pixel
// figure appears, and a scenario saying "up 2 notches" means the gesture
// rather than the number.
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

// THE SUB-NOTCH ROLL, WHICH IS THE ONLY STEP THAT OBSERVES THIS FEATURE'S OWN
// PROMISE OF "as little as I mean to".
//
// Every other scenario here rolls a WHOLE number of notches, and an
// implementation that still rounds a rolled distance to the nearest notch
// satisfies all of them -- so without this step the contract is silent about
// the half of the narrative the slice exists for. Measured by architect
// against three implementations: today's sign-only one fails 7 of the 11
// other clauses, but a quantize-to-notches implementation and a genuinely
// continuous one BOTH land every percentage the other scenarios name. Those
// two are what this clause separates, and quantizing is the one that has to
// be excluded by name -- it is the answer that keeps the notch as the unit
// and so still discards exactly the sub-notch magnitude this slice is for.
// It reads 125 here, as sign-only does; only a mapping that keeps the
// fraction reads 112.
//
// 112 is a resting percentage rather than a chosen one, and it is comfortably
// clear of a rounding edge: half a notch in is a quarter-step of zoom, which
// puts the readout at 111.8, and the badge rounds. It sits 0.3 away from the
// boundary at 111.5, so no float noise reaches it.
//
// Spelled out rather than added as a fifth Examples row, for two reasons on
// top of the "1 notches is not a sentence" one above. The outline's
// placeholder is an integer and would not match half a notch at all. And a
// fractional Examples cell is live territory for npm run acceptance-mutation
// -- CLAUDE.md's tuple-grammar section records that its coordinate grammar
// takes integer components only -- so a decimal in that table would be
// changing what the mutation runner is exercising as a side effect of adding
// a scenario. A named step costs neither.
When('I scroll the wheel up half a notch while holding shift', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 0, notchDeltaY('up', 0.5))
})

// The direction is quoted in the .feature. This comment used to argue that
// the quotes were what kept a mutated direction scoring as a kill, on the
// grounds that a bare {word} placeholder would let a perturbation containing
// a space stop the step matching at all. That argument is REFUTED, by reading
// the mutator rather than reasoning about it: mutation-rules.ts draws every
// substituted character from an alphabet of lowercase letters, and its other
// strategies only ever delete, swap or re-case the value's own characters --
// so a mutant of "up" or "down" is always letters-only. The whitespace-bearing
// mutant the old argument defended against is unreachable, and {word} would
// match every mutant that is reachable.
//
// The mechanism it invoked is real and stays written down, because it is what
// would make such a mutant expensive rather than merely wrong: a step that
// matches nothing is a bddgen generation failure, and bddgen is all-or-nothing
// across every feature in the batch, so one such mutant would take down the
// entire mutant phase instead of scoring as a kill.
//
// What actually turns a mutated direction into a named failure is notchDeltaY's
// throw, above. The quotes are kept because they cost nothing and would become
// load-bearing if that alphabet ever widened -- not because they do anything
// today.
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
