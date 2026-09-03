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
// THE FAULT BATTERY THIS CONTRACT WAS SHOWN CATCHING. Every scenario here is
// GREEN on the tree it was written against -- the guarantee was already
// delivered and only unstated -- so passing is no evidence that any of them
// discriminates. Each was therefore demonstrated the other way, by breaking the
// code deliberately and running the whole Playwright suite (108 tests) to see
// what noticed. Recorded because a scenario admitted on the strength of "it
// passes" is exactly the incidental coverage this repo has been burned by, and
// because each row below also says which scenario is the SOLE detector of what
// it breaks:
//
//   1. liveCellWindow.ts -- cull the focus cursor to the mounted range
//      (`if (!alreadyIncluded && cellInRange(focus.x, focus.y, range))`).
//      3 failed / 105 passed: exactly this feature's three scenarios, each at
//      its Then, each reporting a focused cell of `null` -- no tab stop at all.
//      105 is the whole suite as it stood before this feature, so NOTHING ELSE
//      in features/ catches it. The blunter fault -- deleting the focus +1
//      outright -- reds half the suite and would have proved only that the +1
//      matters, not that these scenarios add anything.
//
//   2. liveCellWindow.ts -- `isAlive: cells.has(focusKey)` -> `isAlive: false`.
//      1 failed / 107 passed: scenario two alone, "Expected substring: alive /
//      Received string: dead". A live focus cell that is IN range never reaches
//      that branch (the live loop already included it), so an out-of-range live
//      cursor is the only input that distinguishes the two -- which is why the
//      live scenario earns its place by this measurement rather than by
//      symmetry with the dead one.
//
//   3. gridFocus.ts -- clamp panToRevealPx to one cellSize per axis.
//      1 failed / 107 passed: scenario three's in-view clause alone, with the
//      cursor painted at x = -9960. This is the subsumption answer for
//      keyboard-grid-navigation's "Moving the focus past the edge of the view
//      brings that cell into view", which needs exactly one cell of pan and
//      stays GREEN under the cap. It also rules out the one way that clause
//      could have passed for the wrong reason: Chromium does not scroll the
//      off-screen cursor into view when focus lands on it, so the containment
//      is observing this application's own reveal-pan and nothing else.
//
// THE PRECONDITION WAS SHOWN TO FIRE, which is a separate obligation from the
// battery above: a setup assertion that can never fail protects nothing. With
// PAN_AWAY_PX set to 0 all three scenarios fail IN THE GIVEN, each naming the
// column it still reaches ("the view still reaches column 0/0/2, so it has not
// panned away from it") -- measured, not assumed, the same way
// infinite-grid.ts records the same probe for its own pan-away step.
//
// WHY THERE IS NO EXAMPLES TABLE, and the reason is narrower than "a table is
// impossible here" -- that framing is false and would have been recorded as
// permanent. Two of the three scenarios genuinely admit no discriminating
// table: their coordinate appears in the Given AND in the Then, so a mutated
// cell moves both together and the scenario still passes. Scenario three is
// NOT of that shape -- its Given cell and its Then cell differ by the move, so
// they decouple. Measured, by tabling it as | x | y | moved x | and running
// npm run acceptance-mutation -- --feature keyboard-grid-reachability against
// the probe: `x` 0->4 KILLED, `moved x` 1->2 KILLED, `y` 0->1 SURVIVED
// (66.7%). So the table is possible; it is simply not worth having. Its two
// lethal mutants re-measure the arrow arithmetic that
// keyboard-grid-navigation's own "An arrow key moves the focus one cell in its
// own direction" outline already covers in all four directions, while its
// third column is a move-together survivor -- one new survivor bought with two
// redundant kills. The absence stands on that cost, not on impossibility.
//
// THE POINTER IS NOT THE ONLY ROUTE INTO THIS STATE, which is what the
// .feature's own comment now says and is measured rather than argued. Probe,
// no pointer used anywhere in it: tab onto the grid, press Home to park the
// cursor on the left-edge cell (-32, 0) with its box at x = 0, press Tab ONCE
// -- which lands on Zoom in -- then Enter eight times. Zoom goes 100% -> 300%
// and that cell's box goes to x = -1280, a full viewport clear of the screen,
// while it stays mounted (count 1), still reports as the roving cursor, and a
// single Shift+Tab returns focus to it. So the guarantee holds on a route no
// scenario here drives, and the pan these three use is a convenience rather
// than the only way in. Not converted into a fourth scenario: it would assert
// the same three claims through a longer setup, and a scenario whose only
// novelty is how the state was reached is the duplication triage-paired-specs
// deleted 35 tests over.
//
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { axisLabelValues, dragPan, focusedCell, focusedCellBox, viewportBox } from '../e2e-helpers'

const { Given, Then } = createBdd()

// Far enough that no plausible mounting policy still keeps the cursor's cell
// in range: 10640px at the default 20px cells is 532 columns, against a
// viewport 64 columns wide plus its buffer and one tile of eviction lag.
// The same distance and the same reasoning as infinite-grid.ts's own pan-away
// step; a shorter one would leave the scenarios passing for the wrong reason.
// Setting this to 0 is the probe that shows the ruler assertion below really
// bites -- see the header.
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
