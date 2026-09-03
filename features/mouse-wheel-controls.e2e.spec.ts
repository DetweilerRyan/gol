import { test, expect } from '@playwright/test'
import { CENTER, cellScreenPosition, clickGridAt, DEFAULT_CELL_SIZE_PX, shiftWheel, zoomPercent } from './e2e-helpers'

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

// -------------------------------------------------------------------------
// OUTLINE FOR THIS SLICE'S VERIFY PASS -- wheel-zoom-ignores-magnitude-and-pinch.
//
// Written at SPECIFY, before any implementation, so the accepted behaviour is
// on record rather than reconstructed later from whatever got built. Two
// claims belong here and in no .feature, both of them residue in the
// established sense -- rendered pixel geometry, which no Gherkin scenario may
// name:
//
//   1. A PINCH HOLDS THE POINT BETWEEN THE FINGERS FIXED, exactly as a
//      shift-held wheel zoom holds the point under the cursor fixed (the first
//      test below). Same shape as that test: seed a cell whose corner is a
//      known pixel, pinch centred on that pixel, re-measure the corner. The
//      Gherkin pinch scenarios are deliberately centred on the world origin so
//      this one can be written without any of them moving.
//   2. THE PINCH AND THE WHEEL SHARE ONE SCALE -- a pinch of a given size and
//      a shift-wheel roll of the same size land on the same rung. Stated in
//      the contract as two scenarios that happen to both read 125, which is an
//      agreement a reader has to notice; asserted here as one equality.
//
// AND ONE NUMBER IN THIS FILE GOES STALE WHEN THE SLICE LANDS. The second
// test's comment records "80 instead of 125" for a flipped axis ternary. That
// was measured against the sign-only implementation, where the wrong axis
// still stepped by the whole zoom factor. Once the factor follows the delta's
// magnitude, deltaX = 50 gives ~89, not 80. The test still discriminates --
// anything other than 125 fails it -- but the comment must be re-measured at
// VERIFY rather than copied forward.
// -------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('scrolling with shift held zooms instead of panning, keeping the cursor point fixed', async ({ page }) => {
  // (700, 310) is clear of the HUD panel, zoom toolbar and scrollbars, and is
  // EXACTLY the top-left corner of world cell (3, -7) under the default camera.
  // Rolling the wheel over a cell corner is what makes the claim checkable as an
  // equality rather than as a tolerance: zoom-at-point holds the world point
  // under the cursor fixed, so that corner must still be that same pixel.
  //
  // This replaced a before/after comparison of elementAtPoint against itself.
  // That was a hit test standing in for a geometric claim, and on an EMPTY grid
  // it degenerates to null === null the moment a dead cell has no element to
  // return -- passing while observing nothing. Seeding the cell and measuring
  // its box states the same claim positively and exactly.
  const CORNER = { x: 700, y: 310 }
  await clickGridAt(page, { x: CORNER.x + DEFAULT_CELL_SIZE_PX / 2, y: CORNER.y + DEFAULT_CELL_SIZE_PX / 2 })
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)

  await shiftWheel(page, CORNER.x, CORNER.y, 0, -100)

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)
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
