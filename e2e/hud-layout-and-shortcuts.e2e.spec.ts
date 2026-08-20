import { test, expect } from '@playwright/test'
import { blurFocus, cellLocator, CENTER, elementAtPoint, selectPattern } from './e2e-helpers'

// No matching .feature file (see CLAUDE.md's black-box e2e section for when a
// spec is unpaired): the behaviors here -- full-window grid + HUD panel layout,
// the Next Generation button's own native Enter activation, and App.tsx's
// pattern-stamp wiring -- are DOM/layout/App-wiring concerns built directly in
// App.tsx/Grid.tsx with no pure-logic layer to specify in Gherkin. This spec
// is that verification, made permanent instead of one-off.
//
// QA outline this spec records (remove-enter-shortcut slice):
//   - The grid fills the window edge to edge, with the HUD panel top-left
//     showing the title, Next Generation button, and generation counter.
//   - The Next Generation button advances the real app's generation counter
//     and live-cell state on click.
//   - The Next Generation button, when it has keyboard focus, advances the
//     generation exactly once on Enter -- this is the button's own native
//     activation, not a global shortcut. Pressing it twice in a row must not
//     double-advance.
//   - Pressing Enter with nothing focused does not advance the generation
//     (there is no global Enter shortcut any more).
//   - Pressing Enter while a grid cell button is focused toggles that cell
//     (native button activation) and does not advance the generation. This is
//     the regression scenario for the bug the slice fixed: a focused, alive
//     cell must flip to dead on Enter, unrelated cells are unaffected, and the
//     generation counter stays at 0.
//   - Arming a pattern from the library and stamping it onto the grid with a
//     click brings that pattern's cells to life in the real app state.

const ALIVE_CLASS = /bg-gray-900/
const DEAD_CLASS = /bg-white/

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the grid fills the entire viewport, edge to edge', async ({ page }) => {
  // Points just inside the viewport edges but clear of the HUD panel
  // (top-left), zoom toolbar (top-right), and the two 10px scrollbar
  // strips (bottom edge, right edge) -- those are legitimate UI chrome,
  // not grid cells, so this checks the grid reaches right up to them
  // rather than leaving the old boxed-widget's margin.
  await expect.poll(() => elementAtPoint(page, 5, 850)).toMatch(/^Cell /)
  await expect.poll(() => elementAtPoint(page, 1260, 400)).toMatch(/^Cell /)
})

test('the HUD panel renders the title, next-generation button, and generation counter, top-left', async ({ page }) => {
  await expect(page.getByRole('heading', { name: "Conway's Game of Life" })).toBeVisible()
  await expect(page.locator('#next-generation-button')).toHaveText('Next Generation')
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')

  const panelBox = await page.getByRole('heading', { name: "Conway's Game of Life" }).locator('..').boundingBox()
  expect(panelBox!.x).toBeLessThan(30)
  expect(panelBox!.y).toBeLessThan(30)
})

test('the Next Generation button advances state through the real app wiring', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()

  await page.locator('#next-generation-button').click()

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect(cellLocator(page, 0, -1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, -1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
})

test('Enter does not advance the generation when nothing is focused', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
})

test('Enter on a focused grid cell toggles that cell and does not advance the generation', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click() // leaves (1,0) focused and alive

  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cell 1, 0')

  await page.keyboard.press('Enter')

  // Regression scenario for the bug this slice fixed: Enter on a focused
  // cell button is native button activation only -- it toggles that cell
  // and nothing else. There is no global listener left to also advance the
  // generation, so (1,0) alone flips dead, (-1,0)/(0,0) are untouched, and
  // the generation counter stays at 0.
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, -1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
})

test('Enter on the focused Next Generation button advances exactly once and does not double-fire', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()

  await page.locator('#next-generation-button').click()
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('next-generation-button')

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 2')
})

test('stamping a pattern from the library brings its cells to life in the real app state', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.mouse.click(CENTER.x, CENTER.y)

  // Block's own cells are (0,0),(1,0),(0,1),(1,1) and CENTER is world cell
  // (0, 0) under the default camera (see e2e-helpers.ts), so this is the one
  // place the real App.tsx Immer stamp wiring is verified to produce live
  // cells end to end -- not just to leave placing mode.
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
})
