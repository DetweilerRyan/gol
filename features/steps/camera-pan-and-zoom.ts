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
  aliveCellCount,
  CENTER,
  clickGridAt,
  originDisplacement,
  originRulerPx,
  parkKeyboardCursorAt,
  rovingCell,
  ORIGIN_RULER_X,
  ORIGIN_RULER_Y,
  cellScreenPosition,
  axisLabelValues,
  dragPan,
  openGrid,
  preferReducedMotion,
  recall,
  remember,
  resetView,
  waitForZoomToSettle,
  watchZoomReadout,
  zoomIn,
  zoomInThenResetView,
  zoomInTwiceQuickly,
  zoomOut,
  zoomPercent,
  zoomReadoutTrail,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// THE RESTING ZOOM, WHICH IS THE ONLY ZOOM THIS CONTRACT EVER SPEAKS OF.
//
// Every "the zoom percentage should be <n>" in the .feature is a statement
// about where the view COMES TO REST, never about what the badge happens to
// read at the instant a step looks at it.
//
// The difference is not stylistic and it is why these exist rather than the
// expect.poll(...).toBe(n) these steps used before. A poll succeeds on the
// first matching reading, so it PASSES ON A VALUE THE VIEW IS MERELY MOVING
// THROUGH: an implementation gliding on past 125 to 156 satisfies "should be
// 125" the moment it crosses it. Once zooming takes time, the resting form is
// the only one that means what the sentence says.
//
// The waiting itself is e2e-helpers' waitForZoomToSettle, which used to be a
// private loop here until VERIFY found the two hand-written specs that also
// drive the zoom had no equivalent and were both wrong without it. No
// duration is named on either side of that move: rest is "the readout stopped
// changing", which is true of an instantaneous zoom too.
async function zoomAtRest(page: Page): Promise<number> {
  await waitForZoomToSettle(page)
  return zoomPercent(page)
}

// A RUNG'S RESTING ZOOM, for the one caller that clicks in a loop -- the same
// wait, told what the reading was BEFORE the click so it cannot accept a rest
// that is really a glide which has not started yet.
//
// The distinction matters here and nowhere else. A Then step asserting a
// number fails loudly on a stale reading and names the right quantity
// ("expected 125, received 100"), which is the safe direction. The ladder
// below compares a rung against the previous rung, where a stale reading is
// indistinguishable from a clamp -- two in a row and it reports a clamp it
// never reached, defeating the very guard its own comment describes, because
// systematic staleness hits both readings alike.
//
// The rung this protects most is the zoom-out ladder's last real one, 41% to
// 40%: a single one-point transition, with no second change to fall back on.
async function zoomAtRestAfterClick(page: Page, before: number): Promise<number> {
  await waitForZoomToSettle(page, before)
  return zoomPercent(page)
}

// The readings the badge took strictly between where it started and where it
// came to rest -- the glide itself, with both endpoints dropped. Direction
// falls out of the two endpoints rather than being passed in, so one function
// reads a zoom in and a zoom out.
//
// PERCENTAGES, NOT LEVELS, and the word matters enough to have been changed
// after review. A LEVEL in this feature is a rung -- what "the zoom level
// should be unchanged" means one scenario away -- and there are no rungs
// between 100 and 125 to pass through: the zoom is a plain continuous
// quantity, and the rungs are only where clicking lands it. What a glide
// passes through is intermediate PERCENTAGES, which is what the badge shows
// and what the sentence now says.
function intermediatePercentages(trail: readonly number[]): readonly number[] {
  const start = trail[0]
  const resting = trail[trail.length - 1]
  const low = Math.min(start, resting)
  const high = Math.max(start, resting)
  return trail.slice(1, -1).filter((level) => level > low && level < high)
}

// WHY SEVERAL RATHER THAN ONE. A single intermediate reading is one extra
// frame, not a transition anybody would call smooth, and an implementation
// that produced exactly one would satisfy a >= 1 check while looking to a
// player almost exactly like the jump this slice exists to remove. Three is
// the smallest count that cannot be reached by rounding noise around a single
// extra frame, and it stays a statement about the MOTION rather than about
// its duration -- any glide long enough to be seen clears it with room to
// spare, and no easing curve or frame rate is implied by it.
//
// The count lives here rather than in the .feature deliberately: it is the
// RESOLUTION of the observation, not a promise a player could perceive, and
// a sentence naming it would be the over-specificity that turns this layer
// into a slow duplicate of a unit test.
const GLIDE_PERCENTAGES = 3

// Clicks the zoom button one step at a time until the clamp saturates -- the
// same ladder a player climbs by clicking the toolbar button repeatedly,
// which is what makes "until the zoom stops changing" a statement about the
// application rather than about some particular number of clicks. Requires
// two consecutive unchanged readings, so a single stale read of the badge
// cannot end the loop early and report a clamp that was never reached.
//
// Each rung is read AT REST for a second reason on top of that one: mid-glide
// readings differ from each other whether or not the clamp has been reached,
// so a ladder built on raw readings would describe how fast the machine is
// rather than where the zoom stops. And at rest AFTER A CHANGE, per
// zoomAtRestAfterClick above, without which the guard this comment describes
// is defeated by a glide that has not started yet.
async function zoomUntilSettled(page: Page, direction: 'in' | 'out') {
  let previous = await zoomAtRest(page)
  let unchanged = 0
  for (let click = 0; click < 25 && unchanged < 2; click++) {
    await (direction === 'in' ? zoomIn(page) : zoomOut(page))
    const current = await zoomAtRestAfterClick(page, previous)
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

// SEED, MEASURE, UNSEED -- and the unseed is the load-bearing third act.
//
// The exact-pixel check needs an element at the origin, and once only live cells
// render the only way to get one is to bring the origin to life. This Given is
// shared with grid-scrollbars' "An empty grid's scrollbar thumbs fill the entire
// track", though, so a cell left behind would quietly make that scenario stop
// being about an empty grid -- the emptiest possible content is the whole point
// of it. Toggling the origin back off restores exactly the board this step was
// handed, and the count comparison is what proves it did.
//
// The click goes to CENTER, the pixel the default camera puts the origin at, so
// the cell that comes alive being (0, 0) is itself part of the assertion: under
// any other camera a different cell would.
//
// It also records where the origin's ruler label sits, which is the baseline
// every "the camera should have moved ..." Then measures against. Recorded here
// rather than read fresh in those steps because by the time they run the camera
// has already moved -- there is no second chance to see where it started.
Given('a camera centered on the origin at the default zoom', async ({ page }) => {
  await openGrid(page)
  await expect.poll(() => zoomPercent(page)).toBe(100)

  // THE COUNT ROUND-TRIP BELOW IS ONLY STABLE IF THE CURSOR DOES NOT MOVE
  // ACROSS IT, so the cursor is put where this step is about to click before
  // the first reading is taken.
  //
  // The mounted set is not a window: it is the live cells in range PLUS the
  // cursor's own cell, wherever that is, which is what keeps the grid reachable
  // by Tab after a pan carries the cursor off screen. A preceding Given that
  // seeded an off-screen cell last -- grid-scrollbars' 200-cells-across one
  // does exactly that -- leaves the cursor out there on a LIVE cell, so it is
  // mounted and counted. The first click below would then move the cursor, that
  // cell would silently leave the DOM, and the closing count would be short by
  // one through no fault of the two clicks it is checking.
  //
  // Parking is two clicks on one cell, which the pointer route makes net-zero
  // on the board while still moving the cursor. Asserted rather than assumed:
  // if the park ever stops landing, the count guard must not be the thing that
  // reports it, because it would report it as a failure of something else.
  await parkKeyboardCursorAt(page, 0, 0)
  expect(await rovingCell(page)).toEqual([0, 0])

  const liveBefore = await aliveCellCount(page)
  await clickGridAt(page, CENTER)
  await expect.poll(() => cellScreenPosition(page, 0, 0)).toEqual(CENTER)
  const baseline = await originRulerPx(page)
  remember(page, ORIGIN_RULER_X, baseline.x)
  remember(page, ORIGIN_RULER_Y, baseline.y)
  await clickGridAt(page, CENTER)
  await expect.poll(() => aliveCellCount(page)).toBe(liveBefore)

  // Recording starts here, at the last moment before any scenario acts, so a
  // Then can ask what the readout DID rather than only what it now says.
  // Installed in the shared Given rather than in the zoom interactions
  // themselves: a scenario that clicks twice needs one trail across both
  // clicks, and nothing between this line and a scenario's When ever moves
  // the zoom. Harmless for the features that borrow this Given and never ask.
  await watchZoomReadout(page)
})

Given('I prefer reduced motion', async ({ page }) => {
  await preferReducedMotion(page)
})

// Past the maximum, not merely up to it: the extra clicks are the point. An
// implementation that accumulated each click as another step to travel would
// bank them here invisibly -- the badge reads 300 either way -- and only give
// them back later, as clicks of the OPPOSITE button that appear to do
// nothing. The scenario's When is the first of those.
Given('I have gone on clicking zoom in past the maximum zoom', async ({ page }) => {
  await zoomUntilSettled(page, 'in')
  for (let extra = 0; extra < 3; extra++) await zoomIn(page)
  expect(await zoomAtRest(page)).toBe(300)
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

// Immediacy, not duration. The contract refuses to name how long a glide
// takes; it does not refuse to say that one thing follows another at once,
// which is an ordinary thing for a player to do and is already how the
// two-quick-clicks scenario is written.
When('I zoom in and immediately reset the view', async ({ page }) => {
  await zoomInThenResetView(page)
})

When('I zoom in twice in quick succession', async ({ page }) => {
  await zoomInTwiceQuickly(page)
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
  const moved = await originDisplacement(page)
  expect(moved.x).toBeGreaterThan(0)
  expect(moved.y).toBeGreaterThan(0)
  expect(moved).toEqual({ x: recall(page, 'panRight'), y: recall(page, 'panDown') })
})

Then('the zoom level should be unchanged', async ({ page }) => {
  await expect.poll(() => zoomPercent(page)).toBe(100)
})

Then('the zoom percentage should be {int}', async ({ page }, percentage) => {
  expect(await zoomAtRest(page)).toBe(percentage)
})

// The three steps below read the recording rather than the badge, and each
// waits for rest first so it can be written in any order after the When
// instead of depending on the resting Then having run before it.
Then('the zoom percentage should have passed through the percentages in between', async ({ page }) => {
  await zoomAtRest(page)
  const trail = await zoomReadoutTrail(page)
  expect(intermediatePercentages(trail).length).toBeGreaterThanOrEqual(GLIDE_PERCENTAGES)
})

Then('the zoom percentage should not have passed through any percentages in between', async ({ page }) => {
  await zoomAtRest(page)
  expect(intermediatePercentages(await zoomReadoutTrail(page))).toEqual([])
})

// No overshoot, in whichever direction the zoom was travelling: a glide that
// sails past its level and springs back is a bounce, and a grid that bounces
// shows cells that were never asked for. Stated against the level the view
// rests on, so one step reads both directions.
Then('the zoom percentage should never have gone past {int}', async ({ page }, resting) => {
  await zoomAtRest(page)
  const trail = await zoomReadoutTrail(page)
  const zoomingIn = resting > trail[0]
  expect(trail.filter((level) => (zoomingIn ? level > resting : level < resting))).toEqual([])
})

// Polled: the preceding step resizes the viewport, and the ruler re-renders
// off a ResizeObserver measurement that lands a frame or two after the resize
// call returns.
Then('the coordinate labels in view should be balanced around the origin', async ({ page }) => {
  await expect.poll(() => balancedAxes(page)).toEqual({ x: true, y: true })
})
