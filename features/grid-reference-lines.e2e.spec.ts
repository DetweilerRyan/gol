import { test, expect, type Page } from '@playwright/test'
import { axisLabelValues, CENTER, dragPan } from './e2e-helpers'

// RESIDUE of grid-reference-lines.feature -- NOT its browser-level
// counterpart, which since playwright-bdd is that feature's own generated
// spec. Cut to two tests by `triage-paired-specs`.
//
// (a) THE CLAIM BOTH TESTS HOLD: for a given camera, the coordinates the two
//     rulers announce are exactly the multiples of 10 the view covers, per
//     axis -- the whole SET, where the feature asks only whether ONE
//     coordinate carries a major gridline. An off-by-one in the range walk
//     shows here and nowhere else.
//
// (b) THE CHANNEL THAT DOES NOT CARRY IT: a ruler label announces its own
//     number and nothing more, so a per-coordinate clause ("the ruler should
//     show 10") reads identically on either strip and is blind to an axis
//     swap. What discriminates is the two axes' sets DIFFERING -- seven
//     multiples of 10 across, five down -- and that asymmetry is a fact about
//     playwright.config.ts's 1280x900 viewport rather than a promise to a
//     player, so a scenario stating it would be false at another viewport
//     while the product was entirely correct. That is what makes it residue.
//
// (c) WHAT WOULD MAKE (b) FALSE: a square viewport. Equal axes make the two
//     sets coincide, the axis-swap guard measured below evaporates, and what
//     is left is range arithmetic src/gridGeometry.test.ts already pins. This
//     is a condition to RE-CHECK the day the viewport changes, not a deletion
//     trigger -- while the viewport is 1280x900 these two are the only guard.
function labelSet(page: Page, axis: 'x' | 'y'): Promise<Set<number>> {
  return axisLabelValues(page, axis).then((values) => new Set(values))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

// KEEP EVIDENCE FOR BOTH TESTS BELOW, and the reason neither may be deleted
// as "arithmetic the unit tests already cover" -- which is exactly the
// mistake `ruler-label-axis-affordance` was written to document.
//
// These two are the sole axis-swap guard anywhere, measured 2026-08-26:
// 46/46 bdd green under a `Column ruler`/`Row ruler` swap, 60/62 e2e green,
// these two the only failures. (62 was the e2e project's size before this
// triage cut it to 27; the two failures are these.)
//
// Each asserts an exact SET per axis, and the two axes' sets differ -- x
// spans seven multiples of 10, y spans five, because the viewport is 1280 by
// 900. That difference is the whole guard: swap which axis a label is
// announced under and the x assertion sees y's five and the y assertion sees
// x's seven. A per-coordinate check cannot see it, because a bare `10` reads
// the same on either ruler; src/gridGeometry.test.ts cannot see it either,
// because it never renders one. The axis is resolved through the accessible
// tree -- axisLabelValues goes through the role="group" GridRuler names each
// ruler with -- so what is pinned here is what an assistive technology would
// announce, not a Tailwind class on the top strip.
test('the default camera shows major gridlines exactly at the multiples of 10 in its visible range', async ({
  page,
}) => {
  await expect.poll(() => labelSet(page, 'x')).toEqual(new Set([-30, -20, -10, 0, 10, 20, 30]))
  await expect.poll(() => labelSet(page, 'y')).toEqual(new Set([-20, -10, 0, 10, 20]))
})

test('gridlines recompute correctly after panning to an all-positive range', async ({ page }) => {
  // dx=-1000 -> offsetX' = -32 + 50 = 18, visible range x: 16..84.
  await dragPan(page, CENTER.x, CENTER.y, -1000, 0, 20)

  await expect.poll(() => labelSet(page, 'x')).toEqual(new Set([20, 30, 40, 50, 60, 70, 80]))
  await expect.poll(() => labelSet(page, 'y')).toEqual(new Set([-20, -10, 0, 10, 20]))
})
