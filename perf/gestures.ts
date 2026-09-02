// Gesture drivers, every one rAF-paced.
//
// page.mouse.move(x, y, { steps }) floods Input.dispatchMouseEvent as fast
// as CDP allows; Chromium then coalesces the resulting pointermoves, and the
// rAF deltas a scenario measures end up describing CDP throughput, not
// render cost. Driving one move per animation frame (await a
// requestAnimationFrame round-trip between each page.mouse.move) is what
// makes the measured frame lands correspond to real paint work instead.
//
// Deliberately no un-paced sibling helper "for convenience" -- if one
// existed here, some future scenario would reach for it, and the resulting
// number would look entirely plausible while measuring the wrong thing.
import { expect, type Locator, type Page } from '@playwright/test'
import { DRAG_THRESHOLD_PX } from '../src/dragGesture.ts'

export interface Point {
  x: number
  y: number
}

// Returns the number of pointermoves actually dispatched (== `moves`, but a
// scenario records the return value rather than the intent it passed in, so
// a future change to this function's dispatch strategy can't silently
// desync moveEventCount from what was truly sent).
export async function panPaced(page: Page, from: Point, delta: Point, moves: number): Promise<number> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= moves; i++) {
    await page.mouse.move(from.x + (delta.x * i) / moves, from.y + (delta.y * i) / moves)
    await waitForNextFrame(page)
  }
  await page.mouse.up()
  return moves
}

// A pointer drag that OSCILLATES between two x positions one animation frame
// apart, instead of interpolating monotonically the way panPaced does.
//
// This exists because panPaced structurally cannot produce the gesture
// cellTiles.ts's eviction-hysteresis comment describes as its known
// weakness. panPaced walks from `from` to `from + delta` and never turns
// around, so along either axis the camera's world offset is monotone for the
// whole gesture -- and a monotone offset crosses each tile boundary at most
// once. The failure mode being measured needs the offset to cross the SAME
// pair of boundaries repeatedly in alternating directions, which no
// monotone drag can express at any speed or length. Same reasoning as
// zoomWheelPaced's alternating direction above (a one-directional zoom
// clamps within ~5 ticks and then measures nothing): the non-monotone
// driver is not a convenience, it is the only shape that reaches the
// geometry.
//
// Two preconditions, both checked rather than commented, because either one
// silently produces a plausible number rather than a failure:
//
//   - amplitudePx must exceed dragGesture.ts's DRAG_THRESHOLD_PX. The
//     comparison there is strictly greater-than, and until the gesture
//     crosses it advanceDrag reports zero pan deltas -- so a wobble at or
//     under the threshold dispatches every pointermove and pans the camera
//     not at all, reporting a full set of rAF frame intervals for a camera
//     that never moved.
//   - `moves` must be even. The pan delta is incremental (clientX -
//     lastX), so an even number of alternating moves ends the drag back at
//     `from` and nets exactly zero camera pan. That is what lets a
//     scenario run repeated reps against one fixed tile-boundary phase: an
//     odd count leaves the camera one amplitude away, and every subsequent
//     rep measures a different phase than the one its precondition was
//     asserted against.
export async function panWobblePaced(page: Page, from: Point, amplitudePx: number, moves: number): Promise<number> {
  if (amplitudePx <= DRAG_THRESHOLD_PX) {
    throw new Error(
      `panWobblePaced: amplitudePx must exceed DRAG_THRESHOLD_PX (${DRAG_THRESHOLD_PX}) or the drag never becomes a pan, got ${amplitudePx}`,
    )
  }
  if (moves % 2 !== 0) {
    throw new Error(`panWobblePaced: moves must be even so the gesture nets zero pan, got ${moves}`)
  }

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= moves; i++) {
    await page.mouse.move(from.x + (i % 2 === 1 ? amplitudePx : 0), from.y)
    await waitForNextFrame(page)
  }
  await page.mouse.up()
  return moves
}

async function waitForNextFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
}

// One shift+wheel zoom tick per animation frame -- see camera.ts's
// applyWheelInput for why shiftKey is what selects zoom over pan. Same
// coalescing hazard as panPaced's header comment: page.mouse.wheel floods
// input as fast as CDP will take it, so pacing one tick per rAF round-trip
// is what keeps the measured frame lands describing real relayout work
// (every button's width/height changes on a zoom, unlike a pan) rather than
// input-dispatch throughput.
//
// Alternates zoom-in/zoom-out every tick (deltaYMagnitude is a magnitude,
// sign chosen internally) rather than zooming one direction for the whole
// run: ZOOM_FACTOR and 1/ZOOM_FACTOR are exact inverses (camera.ts), so this
// oscillates cellSize between two neighboring levels and guarantees every
// tick performs real relayout work. A caller driving one direction for
// `ticks` calls would clamp at MIN_CELL_SIZE/MAX_CELL_SIZE within about 5
// ticks (20 * 1.25^-5 ~= 6.55, already clamped) and every tick after that
// would be a no-op wheel event against an already-clamped camera --
// plausible-looking zero-cost ticks that measure nothing.
export async function zoomWheelPaced(page: Page, at: Point, deltaYMagnitude: number, ticks: number): Promise<number> {
  await page.mouse.move(at.x, at.y)
  for (let i = 0; i < ticks; i++) {
    const deltaY = i % 2 === 0 ? -deltaYMagnitude : deltaYMagnitude
    await page.keyboard.down('Shift')
    await page.mouse.wheel(0, deltaY)
    await page.keyboard.up('Shift')
    await waitForNextFrame(page)
  }
  return ticks
}

// One click per animation frame, against an already-resolved Locator rather
// than a selector string, since both the zoom-toolbar and
// next-generation-button callers already have one on hand and re-resolving
// per click would add a query the pacing itself doesn't need.
export async function clickPaced(page: Page, locator: Locator, times: number): Promise<number> {
  for (let i = 0; i < times; i++) {
    await locator.click()
    await waitForNextFrame(page)
  }
  return times
}

// Reads the on-screen zoom-percentage badge until it reports the SAME text
// on several consecutive polls, and only then returns -- the perf-harness
// form of the identical first-match-versus-rest distinction
// features/steps/camera-pan-and-zoom.ts's zoomAtRest already solves on the
// contract side (reimplemented locally here rather than imported, per this
// file's own header comment on perf/ staying self-contained).
//
// Once the toolbar's zoom-in/zoom-out buttons GLIDE (src/zoomGlide.ts)
// rather than snap, a bare `getByText(wantedPercent).toBeVisible()` is a
// FIRST-MATCH wait: it resolves the instant the badge's ROUNDED text
// happens to equal the wanted string, which is satisfied for a whole
// stretch of frames strictly before the glide actually settles there. A
// geometry read taken the instant that first match resolves can land well
// outside any tolerance a caller then checks it against -- the
// tile-boundary thrash scenario's 41% rung is the sharpest case: the
// "rounds to 41%" band spans roughly 8.10-8.30px of cellSize, comfortably
// wide enough to leave a still-gliding cellSize outside a two-decimal-place
// toBeCloseTo(8.192, 2) (tolerance 0.005) while the badge already reads
// "41%".
//
// REST_CONFIRMATIONS and the poll intervals mirror
// camera-pan-and-zoom.ts's zoomAtRest exactly, for the same reason it gives:
// two consecutive UNCHANGED readings (three consecutive equal ones counting
// the first sighting) is long enough to clear any glide duration this app
// ships (GLIDE_DURATION_MS=200 today) without hardcoding that number here,
// so this helper keeps working if the duration or easing curve ever changes.
const REST_CONFIRMATIONS = 2

export async function waitForZoomAtRest(page: Page): Promise<string> {
  const badge = page.getByText(/^\d+%$/)
  let previous: string | null = null
  let repeats = 0
  await expect
    .poll(
      async () => {
        const current = await badge.textContent()
        repeats = current === previous ? repeats + 1 : 0
        previous = current
        return repeats >= REST_CONFIRMATIONS
      },
      { intervals: [50, 50, 50, 100, 100, 250, 500] },
    )
    .toBe(true)
  // Non-null: the poll only resolves true once `previous` has been assigned
  // a real reading (repeats can't reach REST_CONFIRMATIONS on the initial
  // null), but TS's control-flow narrowing can't see that through the
  // closure passed to expect.poll.
  return previous!
}
