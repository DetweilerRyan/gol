// Step definitions for keyboard-grid-navigation.feature, driving the real
// application in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers.
// Nothing from src/, and no selector of its own: everything this module needs
// to reach or read is a Question, an Interaction or a Task re-exported by the
// barrel.
//
// SHARED STEPS THIS MODULE BORROWS AND DOES NOT DEFINE. The step registry is
// global across features/steps/, so these four are written with the exact
// text cell-life-and-death.ts already registers, and defining any of them
// again here would be an ambiguous-step error rather than an override:
//
//   Given an empty grid
//   Given a live cell at (<x>, <y>)
//   Then  the cell at (<x>, <y>) should be alive
//   Then  the cell at (<x>, <y>) should be dead
//
// That reuse is the point of the Enter/space-bar scenarios: what a key press
// does to a cell is stated in the same words the pointer route already uses,
// so the two routes cannot drift into two different vocabularies for one fact.
//
// WHAT "THE FOCUSED CELL" IS OBSERVED THROUGH. Only live cells have an element
// of their own once this slice lands, so the focus cursor -- not a per-cell
// button -- is what carries the coordinate and the aliveness of wherever the
// keyboard currently is. Every question below reads it through the accessible
// tree: its accessible name for the coordinate, its accessible description for
// what the grid announces on landing. No paint class, and no hit test.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import {
  DEFAULT_CELL_SIZE_PX,
  focusedCell,
  focusedCellAnnouncement,
  focusedCellBox,
  focusGridCell,
  focusEdgeCellInView,
  moveFocus,
  openGrid,
  pressKey,
  recall,
  remember,
  tabForward,
  tabAwayAndBack,
  viewportBox,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

const FOCUS_ROW = 'row the focus started on'

Given('the grid has keyboard focus', async ({ page }) => {
  await openGrid(page)
  await tabForward(page)
  expect(await focusedCell(page)).not.toBeNull()
})

Given('the cell at \\({int}, {int}\\) has keyboard focus', async ({ page }, x, y) => {
  await openGrid(page)
  await focusGridCell(page, x, y)
  remember(page, FOCUS_ROW, y)
  expect(await focusedCell(page)).toEqual([x, y])
})

Given('the cell at the left edge of the view has keyboard focus', async ({ page }) => {
  await openGrid(page)
  const [, y] = await focusEdgeCellInView(page, 'left')
  remember(page, FOCUS_ROW, y)
})

When('I tab forward onto the grid', async ({ page }) => {
  await tabForward(page)
})

When('I tab forward once more', async ({ page }) => {
  await tabForward(page)
})

When('I tab away from the grid and back', async ({ page }) => {
  await tabAwayAndBack(page)
})

// The direction is the domain word; which physical key carries it is the
// Interaction's business. An Examples cell the mutation runner has broken
// names no direction at all, and moveFocus throws by name rather than
// silently pressing nothing.
When('I move the focus {word}', async ({ page }, direction: string) => {
  await moveFocus(page, direction)
})

When('I press {word}', async ({ page }, key: string) => {
  await pressKey(page, key)
})

When('I press the space bar', async ({ page }) => {
  await pressKey(page, 'Space')
})

Then('the focused cell should be \\({int}, {int}\\)', async ({ page }, x, y) => {
  await expect.poll(() => focusedCell(page)).toEqual([x, y])
})

Then('no cell should be focused', async ({ page }) => {
  await expect.poll(() => focusedCell(page)).toBeNull()
})

// Two independent clauses, and both are load-bearing. The row pins that the
// jump stayed on the row it started on -- a Home that also went to the top
// would satisfy the edge clause alone. The edge clause pins that it went as
// far as the view goes and no further: the focused cell's own leading edge
// sits within one cell of the corresponding edge of the viewport.
Then(
  'the focused cell should be the furthest cell in view to the {word} on the same row',
  async ({ page }, direction: string) => {
    const focused = await focusedCell(page)
    expect(focused, 'no cell is focused, so nothing jumped to an edge').not.toBeNull()
    expect(focused![1]).toBe(recall(page, FOCUS_ROW))

    const box = await focusedCellBox(page)
    const viewport = await viewportBox(page)
    if (direction === 'left') {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x).toBeLessThan(DEFAULT_CELL_SIZE_PX)
    } else if (direction === 'right') {
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(box.x + box.width).toBeGreaterThan(viewport.width - DEFAULT_CELL_SIZE_PX)
    } else {
      throw new Error(`"${direction}" names no edge of the view`)
    }
  },
)

Then('the focused cell should be in view', async ({ page }) => {
  const box = await focusedCellBox(page)
  const viewport = await viewportBox(page)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
})

// Both halves are read off ONE announced string, and neither is reconstructed
// by this module: a mutated <x>, <y> or <state> cell fails on the half it
// touched. Containment rather than equality, so the announcement may carry
// ordinary connecting prose without this step pinning its wording.
Then('the grid should announce the cell at \\({int}, {int}\\) as {word}', async ({ page }, x, y, state: string) => {
  const announcement = await focusedCellAnnouncement(page)
  expect(announcement).toContain(`Cell ${x}, ${y}`)
  expect(announcement).toContain(state)
})
