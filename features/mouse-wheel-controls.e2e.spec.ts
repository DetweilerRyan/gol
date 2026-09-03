import { test, expect } from '@playwright/test'
import {
  CENTER,
  cellScreenPosition,
  clickGridAt,
  DEFAULT_CELL_SIZE_PX,
  pinchWheel,
  shiftWheel,
  zoomPercent,
} from './e2e-helpers'

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
// AND ONE NUMBER IN THIS FILE WENT STALE WHEN THE SLICE LANDED. The second
// test's comment recorded "80 instead of 125" for a flipped axis ternary,
// measured against the sign-only implementation, where the wrong axis still
// stepped by the whole zoom factor. Re-measured at VERIFY against the landed
// mapping and corrected to 89 -- see that comment for how, which is a real
// observation of the shipped app rather than an arithmetic derivation.
//
// Both claims above are now written, as the two tests at the foot of this
// file. The outline stays as the record of what was accepted before any of it
// existed.
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
// 89 instead of 125.
//
// 89 rather than the 80 this comment carried before the slice, and MEASURED
// rather than recomputed: with the magnitude now continuous, a flipped
// ternary reads deltaX = 50 as half a notch out instead of a whole one. It
// was observed without touching src/ by sending the deltaX-only wheel the
// flip would reduce this input to -- shiftWheel(CENTER, 50, 0), where the
// unflipped ternary already falls through to deltaX -- which rests at 89.
// The discrimination is unchanged and if anything wider: 89 is on the wrong
// side of 100, so the inversion still zooms out where the contract zooms in.
test('shift-held zoom resolves direction from deltaY when both axes are populated', async ({ page }) => {
  await shiftWheel(page, CENTER.x, CENTER.y, 50, -100)
  await expect.poll(() => zoomPercent(page)).toBe(125)
})

// OUTLINE CLAIM 1 -- A PINCH HOLDS THE POINT BETWEEN THE FINGERS FIXED.
//
// The claim only this file holds: it is rendered pixel geometry, which no
// Gherkin scenario may name, so the .feature's pinch scenarios state only the
// rung a pinch lands on and are deliberately centred on the world origin so
// this test can measure the anchor without any of them moving.
//
// Deliberately the same shape as the shift-wheel corner test above rather than
// a new idea, because the promise is the same promise arriving through a
// different input channel -- and a channel that reaches zoomCameraAtPoint with
// a wrong pixel would still land the right rung, so the readout alone cannot
// see it. Seeding the cell is what makes the claim an equality: (700, 310) is
// exactly the top-left corner of world cell (3, -7) under the default camera,
// and a zoom that holds the pinch point fixed must leave that corner on that
// same pixel.
test('pinching keeps the point between the fingers fixed', async ({ page }) => {
  const CORNER = { x: 700, y: 310 }
  await clickGridAt(page, { x: CORNER.x + DEFAULT_CELL_SIZE_PX / 2, y: CORNER.y + DEFAULT_CELL_SIZE_PX / 2 })
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)

  await pinchWheel(page, CORNER.x, CORNER.y, -100)

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)
})

// OUTLINE CLAIM 2 -- THE PINCH AND THE WHEEL SHARE ONE SCALE, AS AN EQUALITY.
//
// The contract states this only by coincidence: "Pinching apart" and
// "Scrolling up one notch" are two scenarios that both happen to read 125, an
// agreement a reader has to notice and that nothing would fail if it broke by
// less than the readout's rounding. Asserted here as one equality between the
// two routes driven with the same gesture size from the same anchor.
//
// THE PIXEL MEASUREMENT IS THE POINT, not belt-and-braces on the percentage,
// and the margin it buys was MEASURED rather than asserted. zoomPercent is
// rounded to a whole number, so a scale disagreement small enough to round
// the same way is invisible to it: driving the pinch route at -99 and -101
// against the wheel route's -100 reads 125 for all three, while the seeded
// cell's corner lands at x = 714.83, 715.17 and 715 respectively. So a pinch
// mapped through a notch anywhere in roughly 98-102px would pass a
// percentage-only version of this test while the scales genuinely differed.
// (A larger error does show up in the readout -- a 96px notch reads 124 --
// which is why the honest claim here is a narrow blind spot rather than a
// blind percentage.) The corner is not rounded, so the two routes agree at
// pixel resolution or not at all.
//
// The reload between the two halves is what makes them comparable: it returns
// the camera to the default and empties the grid, so the second gesture starts
// from exactly the state the first did rather than from the first's result.
test('a pinch and a shift-wheel roll of the same size land on the same scale', async ({ page }) => {
  const CORNER = { x: 700, y: 310 }
  const CELL_CENTER = { x: CORNER.x + DEFAULT_CELL_SIZE_PX / 2, y: CORNER.y + DEFAULT_CELL_SIZE_PX / 2 }

  await clickGridAt(page, CELL_CENTER)
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)
  await pinchWheel(page, CENTER.x, CENTER.y, -100)
  await expect.poll(() => zoomPercent(page)).toBe(125)
  const afterPinch = { zoom: await zoomPercent(page), corner: await cellScreenPosition(page, 3, -7) }

  await page.goto('/')
  await clickGridAt(page, CELL_CENTER)
  await expect.poll(() => cellScreenPosition(page, 3, -7)).toEqual(CORNER)
  await shiftWheel(page, CENTER.x, CENTER.y, 0, -100)
  await expect.poll(() => zoomPercent(page)).toBe(125)
  const afterWheel = { zoom: await zoomPercent(page), corner: await cellScreenPosition(page, 3, -7) }

  expect(afterPinch).toEqual(afterWheel)
})
