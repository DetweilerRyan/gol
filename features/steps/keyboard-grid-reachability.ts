// Step definitions for keyboard-grid-reachability.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/, and no selector of its own.
//
// SHARED STEPS THIS MODULE BORROWS AND DOES NOT DEFINE. The step registry is
// global across features/steps/, so each of these is written in this feature
// with the exact text another module already registers, and defining any of
// them again here would be an ambiguous-step error rather than an override:
//
//   Given an empty grid                                    cell-life-and-death.ts
//   Given a live cell at (<x>, <y>)                        cell-life-and-death.ts
//   Given the cell at (<x>, <y>) has keyboard focus        keyboard-grid-navigation.ts
//   When  I tab away from the grid and back                keyboard-grid-navigation.ts
//   When  I move the focus <direction>                     keyboard-grid-navigation.ts
//   Then  the focused cell should be (<x>, <y>)            keyboard-grid-navigation.ts
//   Then  the grid should announce the cell at (<x>, <y>) as <state>
//                                                          keyboard-grid-navigation.ts
//
// That reuse is deliberate and is most of what makes this feature cheap: the
// only thing it adds to the ubiquitous language is the separation itself, so
// everything either side of the pan is said in the words the keyboard feature
// already uses.
//
// THIS MODULE DEFINES TWO STEPS AND LENDS OUT NEITHER. Both are about the gap
// between where the view is and where the keyboard is, which is what this
// feature is about and nothing else currently needs.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { axisLabelValues, dragPan, focusedCell, focusedCellBox, viewportBox } from '../e2e-helpers'

const { Given, Then } = createBdd()

// Far enough that no plausible mounting policy still keeps the cursor's cell
// in range: 10640px at the default 20px cells is 532 columns, against a
// viewport 64 columns wide plus its buffer and one tile of eviction lag.
// The same distance and the same reasoning as infinite-grid.ts's own pan-away
// step; a shorter one would leave the scenarios passing for the wrong reason.
const PAN_AWAY_PX = -10640

// THE DRAG STARTS ON THE FOCUSED CELL ITSELF, and that is the load-bearing
// detail rather than an arbitrary origin. A pointer press on any OTHER part of
// the grid blurs whatever held focus, and Chromium then resumes sequential
// navigation from the pressed element -- so the scenario would be entering the
// grid from an unstated starting point instead of leaving a grid it was
// already in. Pressing on the button that already has focus cannot blur it,
// and the drag latches past the pan threshold so no tap fires and the cursor
// is not moved by the gesture. The scenarios that follow therefore begin from
// exactly the state their Given describes: focus inside the grid, view
// elsewhere.
//
// WHY THE PRECONDITION IS READ OFF THE RULER AND NOT OFF THE CELL. "Panned
// away" has to be asserted or the scenarios pass vacuously the moment the
// viewport, the coordinates or the pan distance move -- infinite-grid.ts's
// step records the same lesson. But the obvious instrument, measuring the
// cell's own box, requires the cell to still be MOUNTED, which is precisely
// the guarantee these scenarios exist to test: an implementation that stopped
// mounting the off-screen cursor would fail HERE, in the setup, rather than at
// the Then that is supposed to detect it. Every coordinate the ruler is
// showing lying past the cell's own column says the cell is off screen without
// asking whether anything is rendered for it.
Given('the view has been panned away from the focused cell', async ({ page }) => {
  const focused = await focusedCell(page)
  expect(focused, 'no cell has keyboard focus, so there is nothing for the view to be panned away from').not.toBeNull()
  const [focusX] = focused!

  const box = await focusedCellBox(page)
  await dragPan(page, box.x + box.width / 2, box.y + box.height / 2, PAN_AWAY_PX, 0, 50)

  const columns = await axisLabelValues(page, 'x')
  expect(
    columns.length,
    'the ruler is showing no coordinates at all, so nothing can be said about what is in view',
  ).toBeGreaterThan(0)
  expect(
    Math.min(...columns),
    `the view still reaches column ${focusX}, so it has not panned away from it`,
  ).toBeGreaterThan(focusX)
})

// Fully inside the grid's own viewport, on both axes -- the same containment
// the keyboard feature's reveal-pan clause states, asked here of a cursor that
// started hundreds of columns outside it.
Then('the focused cell should be in view', async ({ page }) => {
  const box = await focusedCellBox(page)
  const viewport = await viewportBox(page)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
})
