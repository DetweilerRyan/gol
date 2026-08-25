import { test, expect } from '@playwright/test'
import {
  blurFocus,
  cellLocator,
  CENTER,
  elementAtPoint,
  expectCellState,
  patternLibraryModal,
  patternsButton,
  previewCells,
  selectPattern,
} from './e2e-helpers'

// No matching .feature file (see CLAUDE.md's black-box e2e section for when a
// spec is unpaired): the behaviors here -- full-window grid + HUD panel layout,
// the Next Generation button's own native Enter activation, and the
// pattern-stamp wiring (usePatternPlacement's stampArmedPattern, wired through
// LifeBoard.tsx) -- are DOM/layout/App-wiring concerns with no pure-logic
// layer to specify in Gherkin. This spec is that verification, made permanent
// instead of one-off.
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
//
// QA outline addendum (split-grid-render-props slice):
//   - Stamping is single-shot: after a pattern is stamped once, the armed
//     pattern is gone, so a second click on a clearly separate empty cell
//     toggles only that one cell -- no second copy of the pattern appears,
//     and the first stamp is unaffected.
//   - While a pattern is armed and its preview is following the pointer,
//     clicking the toolbar's Patterns button again cancels placement instead
//     of reopening the library: the modal stays closed, the preview
//     disappears and does not return on further pointer movement, and the
//     next click toggles a single cell rather than stamping -- proving the
//     armed pattern was genuinely cancelled, not just hidden.

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
  await expectCellState(page, 0, -1, 'alive')
  await expectCellState(page, 0, 0, 'alive')
  await expectCellState(page, 0, 1, 'alive')
  await expectCellState(page, -1, 0, 'dead')
  await expectCellState(page, 1, 0, 'dead')
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
  await expectCellState(page, 1, 0, 'dead')
  await expectCellState(page, -1, 0, 'alive')
  await expectCellState(page, 0, 0, 'alive')
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
  // (0, 0) under the default camera (CENTER, derived in
  // features/screenplay/viewport.ts), so this is the one place the real
  // App.tsx Immer stamp wiring is verified to produce live cells end to end
  // -- not just to leave placing mode.
  await expectCellState(page, 0, 0, 'alive')
  await expectCellState(page, 1, 0, 'alive')
  await expectCellState(page, 0, 1, 'alive')
  await expectCellState(page, 1, 1, 'alive')
})

test('stamping a pattern is single-shot -- a second click toggles only that one cell', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.mouse.click(CENTER.x, CENTER.y)

  await expectCellState(page, 0, 0, 'alive')
  await expectCellState(page, 1, 0, 'alive')
  await expectCellState(page, 0, 1, 'alive')
  await expectCellState(page, 1, 1, 'alive')

  // stampArmedPattern disarms in the same action as committing the pattern
  // (see usePatternPlacement.ts), so this second click at a clearly separate
  // empty cell must be an ordinary single-cell toggle, not a second stamp.
  await cellLocator(page, 5, 5).click()

  await expectCellState(page, 5, 5, 'alive')
  await expectCellState(page, 6, 5, 'dead')
  await expectCellState(page, 5, 6, 'dead')
  await expectCellState(page, 6, 6, 'dead')

  // The first stamp is unaffected by the second click.
  await expectCellState(page, 0, 0, 'alive')
  await expectCellState(page, 1, 0, 'alive')
  await expectCellState(page, 0, 1, 'alive')
  await expectCellState(page, 1, 1, 'alive')
})

test('clicking Patterns again while a pattern is armed cancels placement instead of reopening the library', async ({
  page,
}) => {
  await selectPattern(page, 'Glider')

  // Move the pointer over the grid so a preview follows it (Grid's
  // trackHover guard only computes/calls onHover once a pattern is armed).
  await page.mouse.move(CENTER.x + 60, CENTER.y + 60)
  const preview = previewCells(page)
  await expect(preview.first()).toBeVisible()
  await expect(preview).toHaveCount(5) // Glider has 5 live cells
  const boxAtFirstPosition = (await preview.first().boundingBox())!

  await page.mouse.move(CENTER.x + 120, CENTER.y + 120)
  const boxAtSecondPosition = (await preview.first().boundingBox())!
  expect(boxAtSecondPosition.x).not.toBe(boxAtFirstPosition.x)
  expect(boxAtSecondPosition.y).not.toBe(boxAtFirstPosition.y)

  await patternsButton(page).click()

  // toggleLibrary's rule: while a pattern is armed, Patterns disarms rather
  // than reopening the modal (there's no browsing case to reach here at all).
  await expect(patternLibraryModal(page)).toHaveCount(0)
  await expect(preview).toHaveCount(0)

  // Moving again must not resurrect a preview -- the pattern was genuinely
  // disarmed by cancelPlacing, not merely hidden.
  await page.mouse.move(CENTER.x - 60, CENTER.y - 60)
  await expect(preview).toHaveCount(0)

  await cellLocator(page, -3, -3).click()

  await expectCellState(page, -3, -3, 'alive')
  await expectCellState(page, -2, -3, 'dead')
  await expectCellState(page, -3, -2, 'dead')
  await expectCellState(page, -2, -2, 'dead')
})
