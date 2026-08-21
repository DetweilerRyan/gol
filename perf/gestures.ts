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
import type { Locator, Page } from '@playwright/test'

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
