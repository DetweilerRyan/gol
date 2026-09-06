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
// WHY THESE TWO AND NOT THE ELEVEN THAT WERE HERE. Everything `triage-paired-
// specs` deleted asserted a domain fact -- a neighbour-count outcome, a
// blinker, a block -- that cell-life-and-death.feature now states and its
// generated Playwright spec now drives through the same browser. Measured
// before deleting: each of the eight neighbour-count rows has exactly one
// Examples row that reddens when that row's own rule is inverted, and the three
// pattern tests all redden when the birth rule is changed from 3 to 2. What is
// left is the part the generated layer cannot reach -- it reads aria-pressed as
// an ATTRIBUTE through a CSS selector, and both toggle tests below read it as
// ACCESSIBILITY-TREE state through getByRole. That is category 2, the computed
// accessibility tree, and it is the whole of this file's licence.
//
// A THIRD TEST WAS HERE AND IS NOT, deleted by
// `re-audit-hand-written-e2e-residue` on a DEMONSTRATION rather than on
// subsumption. "every mounted cell is announced as a toggle button, alive or
// dead" summed two CSS-selector counts over the mounted set and asserted they
// reached the total -- category 2 in substance, since its subject was the
// omission of aria-pressed on a dead cell, but read through the ATTRIBUTE
// channel rather than the computed tree, and channel is what the enumeration
// turns on. So "keep it as it is" was never an available answer.
//
// `architect` measured the replacement rather than deriving it. Probe:
// `aria-pressed={isAlive ? true : undefined}` in Cell.tsx, whole suite --
// 13 failed / 113 passed of 126, of which TEN are contract scenarios across
// four features (cell-life-and-death 6, infinite-grid, keyboard-grid-
// navigation, pattern-library) plus two other hand-written specs, every one of
// them reporting through questions.ts's named throw. The omission claim is held
// robustly by the contract, not marginally. Its one distinctive assertion --
// the whole-set sum -- quantified over exactly TWO cells on the current tree
// (one alive, one the parked keyboard cursor), both of which the contract reads
// individually elsewhere, and it bounded the mounted set in neither direction,
// so it was not a mounting-policy guard either.
//
// ONE INCIDENTAL FINDING FROM THAT PROBE, recorded because it looks like a
// defect and is not: another claim reds on it too, through
// expectCellState(0, 0, 'dead'). That is an unrelated check genuinely depending
// on the attribute being present, which is what the contract says it should be.
// It was modal-inertness.e2e.spec.ts's first test when the probe was run;
// `convert-modal-inertness-to-scenarios` restated that claim as
// while-the-pattern-library-is-open.feature's first scenario and deleted the
// spec, so the same reading is now taken by the generated layer.
//
// WHICH ACTIVATION ROUTE THIS SPEC EXERCISES (recorded in the
// black-box-acceptance-pilot slice's VERIFY pass, because it is easy to
// assume the wrong thing here). Every cell activation below is a Playwright
// .click(), which is the POINTER route: pointer capture on #grid-content
// retargets the native click to the container, so Cell's own onClick never
// runs and Grid's onTap resolves the cell from pointerup pixels instead.
// This spec therefore covers hit-testing, and nothing here would notice a
// bug confined to Cell.onClick -- measured: swapping Cell's onActivate(x, y)
// to (y, x) leaves every test in this file green.
//
// WHERE THE KEYBOARD ROUTE IS COVERED HAS MOVED, and this pointer has now been
// repointed twice in one slice -- which is itself the lesson this file's other
// header states, that a cross-reference decays silently while everything stays
// green. It originally named hud-layout-and-shortcuts.e2e.spec.ts's "Enter on a
// focused grid cell toggles that cell"; `re-audit-hand-written-e2e-residue`
// deleted that test once the contract stated both its halves, and then deleted
// the two Enter tests the replacement text referred to.
//
// THE ROUTE IS NOW HELD ENTIRELY BY THE CONTRACT, which is the right home for
// it -- keep it that way rather than adding a duplicate keyboard test here.
// Measured on the pre-deletion tree by swapping Cell's onActivate(x, y) to
// (y, x) and running the whole suite: EXACTLY TWO tests red, both in the
// generated bdd layer -- keyboard-grid-navigation.feature's "Pressing Enter
// brings the focused cell to life" and "Pressing the space bar kills the
// focused live cell".
//
// THE TWO ENTER TESTS THAT USED TO SIT ALONGSIDE THEM DID NOT RED ON IT, which
// was the whole point of naming them and survives their deletion: they were
// about which LISTENER answers a keystroke, never about which cell a cell
// activates, so they were never this route's coverage even while an earlier
// version of this pointer said they were. Their claims are now
// generation-control.feature's two scenarios, and the same argument transfers
// unchanged -- neither of those focuses a cell at all, so an onActivate swap
// cannot reach either.

import { test, expect } from '@playwright/test'
import { clickCell, expectCellState } from './e2e-helpers'
import { cellLabel } from '../src/test-support/cellQuery.ts'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('a cell brought to life is announced as a pressed toggle button', async ({ page }) => {
  await clickCell(page, 2, 3)
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
  await clickCell(page, 2, 3)
  await expectCellState(page, 2, 3, 'alive')
  await clickCell(page, 2, 3)
  await expectCellState(page, 2, 3, 'dead')

  // The unpressed half of the same accessibility-tree read. A dead cell must
  // still resolve as a TOGGLE button that is not pressed (outline point 2) --
  // this query would find nothing at all if aria-pressed were dropped when
  // false, which is exactly the rendering optimisation the outline forbids.
  await expect(page.getByRole('button', { name: cellLabel(2, 3), pressed: false, exact: true })).toBeVisible()
})
