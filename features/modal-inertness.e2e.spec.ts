import { test, expect } from '@playwright/test'
import {
  CENTER,
  cellLocator,
  clickGridAt,
  dragPan,
  expectCellState,
  openPatternModal,
  waitForZoomToSettle,
} from './e2e-helpers'

// No matching .feature file (see CLAUDE.md's black-box e2e section for when a
// spec is unpaired): there's no pure-logic layer here at all. What's under test
// is hit-testing and stacking order in a real browser -- jsdom has neither, so
// these three cases can only be checked here.
//
// They protect the assumptions behind two comments in
// src/components/LifeBoard.tsx: the overlay-order comment on the overlay slot
// (every overlay -- ruler, zoom%, scrollbars, toolbar, modal -- sits above
// #grid-content as a sibling rather than a descendant, a containment
// src/components/Grid.tsx's #grid-content div owns and documents, so overlay
// pointer events never bubble into the pan/toggle handlers, and no
// stopPropagation or open-state guard is needed on either side), and the
// dialog-inertness comment on the PatternLibraryModal wiring (Headless UI's
// Dialog makes the rest of the page inert while the library is open, so
// GridToolbar's onPatterns handler can't fire in the browsing state).
//
// Precisely: what these assert is that with the library open, a pointer aimed
// at the grid or toolbar lands on an intercepting overlay instead -- the
// dialog's backdrop/panel physically covers the click point. That's the real
// guarantee those comments depend on; it isn't a DOM-level `inert` assertion.
//
// QA outline this spec records: with the pattern library open, clicking a grid
// cell behind it doesn't toggle that cell, clicking a toolbar button behind it
// doesn't act, and dragging across it doesn't pan the grid underneath.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('clicking a grid cell behind the open modal does not toggle it', async ({ page }) => {
  await openPatternModal(page)

  await page.mouse.click(CENTER.x + 10, CENTER.y + 10)
  await page.keyboard.press('Escape')

  await expectCellState(page, 0, 0, 'dead')
})

test('clicking a toolbar button behind the open modal has no effect', async ({ page }) => {
  const zoomInBox = (await page.locator('button[aria-label="Zoom in"]').boundingBox())!

  await openPatternModal(page)
  await page.mouse.click(zoomInBox.x + zoomInBox.width / 2, zoomInBox.y + zoomInBox.height / 2)

  // SETTLE FIRST, THEN ASSERT -- since smooth-zoom-transitions this assertion
  // is about a zoom that would take 200ms to arrive rather than one that would
  // already be here. A retrying toHaveText passes on the FIRST reading that
  // matches, and the first frame of a glide still reads 100%, so on a fast
  // enough machine this could have matched the very transition it exists to
  // prove never started. Measured today it still catches one -- a probe that
  // let the click through failed 5 times out of 5, reporting 125% -- so this
  // is a margin being replaced by a guarantee, not a defect being repaired.
  await waitForZoomToSettle(page)
  await expect(page.getByText(/^\d+%$/)).toHaveText('100%')
})

test('dragging over the open modal does not pan the grid underneath', async ({ page }) => {
  // The origin needs an element for its position to be readable, and once only
  // live cells render, bringing it to life is the only way it gets one. Clicked
  // at CENTER, the pixel the default camera puts the origin at, before anything
  // moves the camera -- so the seeding itself asserts nothing and the claim
  // below is unchanged.
  await clickGridAt(page, CENTER)

  const before = (await cellLocator(page, 0, 0).boundingBox())!

  await openPatternModal(page)
  await dragPan(page, CENTER.x, CENTER.y, 60, 40)

  const after = (await cellLocator(page, 0, 0).boundingBox())!
  expect(after.x).toBe(before.x)
  expect(after.y).toBe(before.y)
})
