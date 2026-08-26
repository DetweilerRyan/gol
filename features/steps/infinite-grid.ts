// Step definitions for infinite-grid.feature, driving the real application in
// a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/.
//
// This module defines only the steps unique to this feature. The ones it
// shares are defined once elsewhere, because the step registry is global
// across features/steps/ and a duplicate text is an ambiguous-step error:
// "an empty grid", "a horizontal blinker centered at (<x>, <y>)", "the next
// generation is computed" and "the cell at (<x>, <y>) should be alive" all
// live in cell-life-and-death.ts.
//
// WHAT MAKES THE SECOND SCENARIO BROWSER-TESTABLE AT ALL. The grid is
// infinite, but only a bounded window of it is ever mounted -- so a cell at
// (100, -100) has no DOM node until the camera is moved there. The shared cell
// steps go through withCellInView, which pans to an unmounted cell, does the
// work, and puts the camera back. That is what lets "the blinker at
// (100, -100) should be vertical" be asserted through the real UI, and it is a
// claim about that scenario's coordinates only.
//
// WHY THE FIRST SCENARIO NO LONGER RESTS ON THE SAME ACCIDENT. Its promise is
// that live-cell state is not a rendering artifact of where the viewport
// happens to be, and until this step existed that promise was covered only
// incidentally: (100, 0) HAPPENS to be off-screen at 1280x900, so
// withCellInView HAPPENED to pan a hundred cells away and back before the
// Thens ran. Move the viewport, move the coordinate, or change
// withCellInView's already-mounted shortcut and the guard evaporates with the
// scenario still green -- the same shape `ruler-label-axis-affordance` was
// written to document. `triage-paired-specs` deleted the hand-written spec
// that stated it outright (features/infinite-grid.e2e.spec.ts, "cells placed
// far from the origin ... persist after scrolling away and back") on the
// strength of that accident; the pan is now an explicit step in the contract
// instead, and the step asserts it really did unmount both cells rather than
// assuming it.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { CENTER, cellLocator, clickCell, dragPan, expectBlinker, recall, remember, resetView } from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// A step's arguments are only its own placeholders, so the pan step below
// cannot see which cells "both cells" names -- it reads them off the notepad.
// Carried rather than restated as two literals here, which would re-couple the
// guard to coordinates a future edit to the .feature could change out from
// under it.
const FIRST_X = 'first toggled cell x'
const FIRST_Y = 'first toggled cell y'
const SECOND_X = 'second toggled cell x'
const SECOND_Y = 'second toggled cell y'

Given(
  'I toggle the cells at \\({int}, {int}\\) and \\({int}, {int}\\)',
  async ({ page }, firstX, firstY, secondX, secondY) => {
    await clickCell(page, firstX, firstY)
    await clickCell(page, secondX, secondY)
    remember(page, FIRST_X, firstX)
    remember(page, FIRST_Y, firstY)
    remember(page, SECOND_X, secondX)
    remember(page, SECOND_Y, secondY)
  },
)

// offsetX' = -32 + 10640/20 = 500, so the mounted window ends up at world x
// 500..564 plus the visible-range buffer and one tile of eviction lag --
// hundreds of cells clear of anything this feature toggles, in the one
// direction that needs no assumption about which cells those were. One axis is
// enough: a cell is mounted only if both of its coordinates are in range.
const PAN_AWAY_PX = -10640

When('I pan far away from both cells and back', async ({ page }) => {
  await dragPan(page, CENTER.x, CENTER.y, PAN_AWAY_PX, 0, 50)

  // THE LOAD-BEARING HALF. "Panned away" is a real claim only once neither
  // cell has a DOM node at all; without this the step would keep passing while
  // asserting nothing the moment the viewport, the coordinates or the mounting
  // policy moved, which is exactly the vacuously-true form this step exists to
  // replace. Measured 2026-08-26 rather than assumed: with PAN_AWAY_PX set to
  // 0 the scenario fails here, on the first of the two counts.
  await expect(cellLocator(page, recall(page, FIRST_X), recall(page, FIRST_Y))).toHaveCount(0)
  await expect(cellLocator(page, recall(page, SECOND_X), recall(page, SECOND_Y))).toHaveCount(0)

  await resetView(page)
})

Then('the blinker at \\({int}, {int}\\) should be vertical', async ({ page }, x, y) => {
  await expectBlinker(page, x, y, 'vertical')
})
