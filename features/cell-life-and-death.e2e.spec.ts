// ACCEPTED OUTLINE -- slice `aria-pressed-cell-state` (product, SPECIFY),
// narrowed by `triage-paired-specs` to the three tests that survive it.
//
// This spec is the browser-level counterpart of cell-life-and-death.feature.
// The .feature states WHAT is true of a cell (alive / dead); this outline
// states HOW a user -- including a user who cannot see the grid -- perceives
// it. The domain fact is already contracted there ("Then the cell at (2, 3)
// should be alive"), so what is left here is the observation channel, not the
// fact.
//
// Before: a cell button carried `aria-label="Cell x, y"` and nothing else.
// Assistive technology was told a cell exists and where it is, and was never
// told whether it is alive -- the single most important fact in the domain.
// Aliveness existed only as paint (`bg-gray-900` / `bg-white`), which a
// screen reader does not report.
//
// The accepted behaviour this file checks:
//
//   1. Every cell is announced as a toggle button. Its pressed state IS its
//      aliveness: a live cell is pressed, a dead cell is not pressed.
//   2. A DEAD cell is announced as an UNPRESSED toggle, not as a plain
//      button. `aria-pressed="false"` is present on every dead cell. Omitting
//      it would mean "this is not a toggle at all", which is a different and
//      wrong statement, and it must not be omitted as a rendering
//      optimisation.
//   3. Clicking a cell flips what is announced, in the same action and with
//      no extra step: a screen-reader user hears the state change they just
//      caused.
//
// The rest of that outline is accepted behaviour still, and is checked
// elsewhere rather than dropped: the original point 4 (a generation tick
// flips what is announced for exactly the cells that changed) is
// cell-life-and-death.feature's own generation scenarios, point 5 (stamping
// announces the pattern's cells as pressed) is pattern-library.feature, and
// point 6 (the visible paint is unchanged) is src/components/Cell.test.tsx's
// alive/dead pair -- which is where it has to live, since
// rules/no-aliveness-by-paint-class forbids reading paint from features/ at
// all.
//
// WHY THESE THREE AND NOT THE ELEVEN THAT WERE HERE. Everything deleted
// asserted a domain fact -- a neighbour-count outcome, a blinker, a block --
// that cell-life-and-death.feature now states and its generated Playwright
// spec now drives through the same browser. Measured before deleting: each of
// the eight neighbour-count rows has exactly one Examples row that reddens
// when that row's own rule is inverted, and the three pattern tests all
// redden when the birth rule is changed from 3 to 2. What is left is the part
// the generated layer cannot reach -- it reads aria-pressed as an ATTRIBUTE
// through a CSS selector, and the two toggle tests below read it as
// ACCESSIBILITY-TREE state through getByRole.
//
// WHICH ACTIVATION ROUTE THIS SPEC EXERCISES (recorded in the
// black-box-acceptance-pilot slice's VERIFY pass, because it is easy to
// assume the wrong thing here). Every cell activation below is a Playwright
// .click(), which is the POINTER route: pointer capture on #grid-content
// retargets the native click to the container, so Cell's own onClick never
// runs and Grid's onTap resolves the cell from pointerup pixels instead.
// This spec therefore covers hit-testing, and nothing here would notice a
// bug confined to Cell.onClick -- measured: swapping Cell's onActivate(x, y)
// to (y, x) leaves every test in this file green. The keyboard route
// (Enter on a focused cell button, which IS Cell.onClick) is covered by
// hud-layout-and-shortcuts.e2e.spec.ts, where that same swap fails. Both
// routes are covered by the e2e layer; keep it that way rather than adding a
// duplicate keyboard test here.

import { test, expect } from '@playwright/test'
import { cellLocator, expectCellState } from './e2e-helpers'
import { CELL_SELECTOR, ALIVE_CELL_SELECTOR, DEAD_CELL_SELECTOR, cellLabel } from '../src/test-support/cellQuery.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('a cell brought to life is announced as a pressed toggle button', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expectCellState(page, 2, 3, 'alive')

  // Outline point 3, read through the ACCESSIBILITY TREE rather than the
  // attribute string: getByRole resolves `pressed` as ARIA semantics, so this
  // is what an assistive technology would perceive, not merely what the DOM
  // holds. `exact: true` because Playwright's accessible-name match is a
  // case-insensitive SUBSTRING by default -- 'Cell 2, 3' would otherwise also
  // match 'Cell 2, 30' and violate strict mode.
  await expect(page.getByRole('button', { name: cellLabel(2, 3), pressed: true, exact: true })).toBeVisible()
})

test('a cell that is killed is announced as an unpressed toggle button, not a plain button', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expectCellState(page, 2, 3, 'alive')
  await cellLocator(page, 2, 3).click()
  await expectCellState(page, 2, 3, 'dead')

  // The unpressed half of the same accessibility-tree read. A dead cell must
  // still resolve as a TOGGLE button that is not pressed (outline point 2) --
  // this query would find nothing at all if aria-pressed were dropped when
  // false, which is exactly the rendering optimisation the outline forbids.
  await expect(page.getByRole('button', { name: cellLabel(2, 3), pressed: false, exact: true })).toBeVisible()
})

test('every mounted cell is announced as a toggle button, alive or dead', async ({ page }) => {
  await cellLocator(page, 2, 3).click()

  // Outline points 1 and 2 across the whole mounted set, which the jsdom
  // component test cannot state -- it renders one cell at a time. If
  // aria-pressed were omitted on dead cells as a rendering optimisation, the
  // two partial counts would no longer sum to the total.
  const total = await page.locator(CELL_SELECTOR).count()
  expect(total).toBeGreaterThan(0)

  await expect(page.locator(ALIVE_CELL_SELECTOR)).toHaveCount(1)
  await expect(page.locator(DEAD_CELL_SELECTOR)).toHaveCount(total - 1)
})
