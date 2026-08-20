import { test, expect } from '@playwright/test'
import { blurFocus, cellLocator, CENTER, elementAtPoint, openPatternModal, selectPattern } from './e2e-helpers'

// No matching .feature file (see CLAUDE.md's black-box e2e section for when a
// spec is unpaired): the behaviors here -- full-window grid + HUD panel layout,
// the Enter-key shortcut, and Enter's suppression while the pattern library is
// open or a pattern is armed -- are DOM/layout/App-wiring concerns built
// directly in App.tsx/Grid.tsx with no pure-logic layer to specify in Gherkin.
// This spec is that verification, made permanent instead of one-off.
//
// QA outline this spec records:
//   - The grid fills the window edge to edge, with the HUD panel top-left
//     showing the title, Next Generation button, and generation counter.
//   - Next Generation, and Enter with nothing focused, both advance the real
//     app's state; Enter on a focused cell advances once and also toggles that
//     cell; Enter on the focused button advances exactly once.
//   - Enter does nothing while the pattern library modal is open or while a
//     pattern is armed, and works again once a stamp ends placing mode -- and
//     that stamp really does bring the pattern's cells to life.

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

test('Enter advances the generation when nothing is focused', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect(cellLocator(page, 0, -1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
})

test('Enter on a focused grid cell fires both the cell toggle and the global generation advance', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click() // leaves (1,0) focused

  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cell 1, 0')

  await page.keyboard.press('Enter')

  // Exactly one generation advance (proves the global listener fired once,
  // not zero or twice): the horizontal blinker (-1,0),(0,0),(1,0) becomes
  // vertical (0,-1),(0,0),(0,1), which alone would leave (1,0) dead. The
  // button's own native Enter-activation then ALSO fires its click handler,
  // toggling (1,0) a second time on top of that -- verified empirically
  // against real Chromium event ordering (keydown bubbles to the window
  // listener before the button's default-action click fires), so the final
  // state is generation-then-toggle: dead, then toggled back alive.
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
})

test('Enter on the focused Next Generation button does not double-fire', async ({ page }) => {
  await cellLocator(page, -1, 0).click()
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()

  await page.locator('#next-generation-button').click()
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('next-generation-button')

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 2')
})

test('Enter does not advance the generation while the pattern modal is open', async ({ page }) => {
  await openPatternModal(page)
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
})

test('Enter does not advance the generation while placing a pattern', async ({ page }) => {
  await selectPattern(page, 'Block')
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
})

test('Enter resumes advancing the generation once placing mode ends via a stamp', async ({ page }) => {
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

  await blurFocus(page)
  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
})
