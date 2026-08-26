import { test, expect, type Page } from '@playwright/test'
import { axisLabelValues, CENTER, dragPan } from './e2e-helpers'

// The browser-level counterpart of grid-reference-lines.feature, cut to two
// tests by `triage-paired-specs`. The feature asks whether ONE coordinate
// carries a major gridline; these two ask what the WHOLE set of them is for a
// given camera, which no per-coordinate scenario can state and which is where
// an off-by-one in the range walk would show.
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
