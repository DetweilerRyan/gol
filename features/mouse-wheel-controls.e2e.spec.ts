import { test, expect } from '@playwright/test'
import { CENTER, elementAtPoint, shiftWheel, zoomPercent } from './e2e-helpers'

// Re-homed from mouse-wheel-controls.feature by the feature-prose-honesty
// slice, under the acceptance-contract-rulings ruling that a geometric promise
// moved to the paired spec survives in features/** only if this header records
// it: a shift-held wheel zoom keeps the point under the cursor fixed. The
// Gherkin clause saying so was unstateable without pixel vocabulary and
// unobservable from jsdom; the feature now states only that scrolling up zooms
// in and scrolling down zooms out. The invariance itself is asserted in a real
// browser by the first test below, which re-reads the element under the very
// pixel the wheel was rolled over. It may not be deleted here without being
// restated in features/**.
//
// `triage-paired-specs` cut this file from five tests to two. The
// no-modifier pan test, the deltaY-only axis row and the zoom-percentage
// checkpoint walk all went: the feature states each claim and its generated
// spec drives it through the same browser. The two survivors are the two the
// generated layer structurally cannot reach -- one needs pixel vocabulary,
// the other needs a wheel event with both axes populated, which no step
// sends.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('scrolling with shift held zooms instead of panning, keeping the cursor point fixed', async ({ page }) => {
  // (700, 300): clear of the HUD panel, zoom toolbar, and scrollbars.
  const before = await elementAtPoint(page, 700, 300)
  await shiftWheel(page, 700, 300, 0, -100)

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => elementAtPoint(page, 700, 300)).toBe(before)
})

// THE ONE PLACE A SHIFT-WHEEL AXIS-PRIORITY INVERSION IS OBSERVABLE, and the
// whole reason this row outlived the deltaY-only row beside it.
//
// applyWheelInput recovers the zoom magnitude from whichever axis the browser
// populated -- `deltaY !== 0 ? deltaY : deltaX` -- a workaround for
// Firefox/Windows converting a shift-held vertical wheel into a horizontal
// scroll event. Every generated shift-wheel step sends deltaX = 0, so on that
// input the ternary's two arms are the same expression and the bdd layer is
// blind to their order BY CONSTRUCTION. Measured 2026-08-26 with the ternary
// flipped to `deltaX !== 0 ? deltaX : deltaY`: the full bdd project is 46/46
// GREEN, and the full e2e project is 61 passed / 1 failed -- this test, the
// only failure in either. Deleting it would drop the axis-priority contract
// out of the repo entirely, and no .feature can take it back without naming
// wheel-event fields no user can observe.
//
// It sends both axes with deltaY dominant AND opposite in sign, so an
// inversion does not merely change the magnitude -- it zooms the wrong way,
// 80 instead of 125.
test('shift-held zoom resolves direction from deltaY when both axes are populated', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 50, -100)
  await expect.poll(() => zoomPercent(page)).toBe(125)
})
