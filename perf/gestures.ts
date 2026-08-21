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
import type { Page } from '@playwright/test'

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
