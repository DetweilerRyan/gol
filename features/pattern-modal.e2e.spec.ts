import { test, expect, type Page } from '@playwright/test'
import { CENTER, cellLocator, dragPan, elementAtPoint } from './e2e-helpers'

// No matching .feature file for this slice: features/pattern-library.feature
// already covers the domain logic (PATTERNS, getPatternByName, placePattern)
// in gameOfLife.ts. The toolbar button, modal, placing-mode preview, and the
// drag-vs-click/pointer-capture wiring exercised here are pure UI/interaction
// behavior with no independently testable pure-function logic, so per this
// project's convention (see hud-layout-and-shortcuts.e2e.spec.ts) they're
// verified directly via Playwright instead of a Gherkin/unit pair.

const ALIVE_CLASS = /bg-gray-900/
const DEAD_CLASS = /bg-white/

const patternsButton = (page: Page) => page.locator('button[aria-label="Open pattern library"]')
const modal = (page: Page) => page.getByRole('dialog', { name: 'Pattern library' })
const previewCells = (page: Page) => page.locator('[aria-label^="Pattern preview cell"]')

async function openPatternModal(page: Page) {
  await patternsButton(page).click()
}

async function selectPattern(page: Page, name: string) {
  await openPatternModal(page)
  await page.getByRole('button', { name, exact: true }).click()

  // Headless UI's Dialog stays mounted through its ~100ms leave transition,
  // still covering the click point during that window -- waiting for it to
  // fully unmount here (rather than at each call site) keeps the subsequent
  // mouse.move/click in every caller from landing on the closing dialog
  // instead of the grid underneath.
  await expect(modal(page)).toHaveCount(0)
}

// Playwright keeps keyboard focus on the button that was last clicked, and
// Enter on a focused <button> triggers its own native click too (after the
// global window keydown listener runs, per the ordering documented in
// hud-layout-and-shortcuts.e2e.spec.ts) -- blurring first isolates the
// Enter-suppression assertions from that unrelated double-activation.
async function blurFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the toolbar has a fourth "Patterns" button after Reset, matching its style', async ({ page }) => {
  const toolbar = page.locator('button[aria-label="Reset view"]').locator('..')
  const buttons = toolbar.locator('button')
  await expect(buttons).toHaveText(['+', '−', 'Reset', 'Patterns'])
  await expect(patternsButton(page)).toHaveClass(/bg-gray-900/)
})

test('clicking the Patterns button opens the pattern library modal', async ({ page }) => {
  await expect(modal(page)).toHaveCount(0)

  await openPatternModal(page)

  // Catalyst's Dialog root has no in-flow content of its own (its backdrop
  // and panel wrapper are both `fixed`), so it collapses to a 0-height box
  // that renders correctly but reads as hidden to toBeVisible()'s
  // bounding-box check -- toBeAttached() plus asserting the heading is
  // visible covers both "the dialog mounted" and "it's actually on screen".
  await expect(modal(page)).toBeAttached()
  await expect(modal(page)).toHaveAttribute('aria-modal', 'true')
  await expect(page.getByRole('heading', { name: 'Pattern Library' })).toBeVisible()
})

test('the modal lists three category sections, in order, each with its patterns in declaration order', async ({
  page,
}) => {
  await openPatternModal(page)

  await expect(modal(page).locator('h3')).toHaveText(['Still Life', 'Oscillators', 'Spaceships'])
  await expect(modal(page).locator('button')).toHaveText([
    'Block',
    'Beehive',
    'Blinker',
    'Toad',
    'Beacon',
    'Pulsar',
    'Glider',
    'LWSS (Lightweight Spaceship)',
  ])
})

test('clicking a grid cell behind the open modal does not toggle it', async ({ page }) => {
  await openPatternModal(page)

  await page.mouse.click(CENTER.x + 10, CENTER.y + 10)
  await page.keyboard.press('Escape')

  await expect(cellLocator(page, 0, 0)).toHaveClass(DEAD_CLASS)
})

test('clicking a toolbar button behind the open modal has no effect', async ({ page }) => {
  const zoomInBox = (await page.locator('button[aria-label="Zoom in"]').boundingBox())!

  await openPatternModal(page)
  await page.mouse.click(zoomInBox.x + zoomInBox.width / 2, zoomInBox.y + zoomInBox.height / 2)

  await expect(page.getByText(/^\d+%$/)).toHaveText('100%')
})

test('dragging over the open modal does not pan the grid underneath', async ({ page }) => {
  const before = (await cellLocator(page, 0, 0).boundingBox())!

  await openPatternModal(page)
  await dragPan(page, CENTER.x, CENTER.y, 60, 40)

  const after = (await cellLocator(page, 0, 0).boundingBox())!
  expect(after.x).toBe(before.x)
  expect(after.y).toBe(before.y)
})

test('clicking a pattern in the library closes the modal and enters placing mode', async ({ page }) => {
  await selectPattern(page, 'Block')

  await page.mouse.move(CENTER.x, CENTER.y)
  await expect(page.locator('[aria-label="Pattern preview cell 0, 0"]')).toBeVisible()
})

test('the preview renders the pattern anchored top-left at the cursor cell', async ({ page }) => {
  await selectPattern(page, 'Block')

  await page.mouse.move(CENTER.x, CENTER.y)

  // Block's own cells are (0,0),(1,0),(0,1),(1,1); CENTER is world cell
  // (0, 0) under the default camera (see e2e-helpers.ts), so the preview
  // should sit at exactly those world coordinates.
  await expect(page.locator('[aria-label="Pattern preview cell 0, 0"]')).toBeVisible()
  await expect(page.locator('[aria-label="Pattern preview cell 1, 0"]')).toBeVisible()
  await expect(page.locator('[aria-label="Pattern preview cell 0, 1"]')).toBeVisible()
  await expect(page.locator('[aria-label="Pattern preview cell 1, 1"]')).toBeVisible()
  await expect(previewCells(page)).toHaveCount(4)
})

test('the preview moves to a different anchor cell as the pointer moves, without mutating live cells', async ({
  page,
}) => {
  await selectPattern(page, 'Block')

  // One cell right and one down from CENTER's (0, 0): world cell (1, 1).
  await page.mouse.move(CENTER.x + 20, CENTER.y + 20)

  await expect(page.locator('[aria-label="Pattern preview cell 1, 1"]')).toBeVisible()
  await expect(page.locator('[aria-label="Pattern preview cell 2, 2"]')).toBeVisible()
  await expect(page.locator('button[aria-label^="Cell "].bg-gray-900')).toHaveCount(0)
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
})

test('a plain click while placing stamps the pattern once and returns to normal click-to-toggle', async ({ page }) => {
  await selectPattern(page, 'Block')

  await page.mouse.click(CENTER.x, CENTER.y)

  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
  await expect(previewCells(page)).toHaveCount(0)

  // Back to normal click-to-toggle, single-shot rather than repeat-stamp:
  // clicking elsewhere toggles just that one cell instead of stamping
  // another Block.
  await cellLocator(page, 5, 5).click()
  await expect(cellLocator(page, 5, 5)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 6, 5)).toHaveClass(DEAD_CLASS)
})

test('placing a pattern merges with existing live cells rather than replacing them', async ({ page }) => {
  await cellLocator(page, 20, 20).click()

  await selectPattern(page, 'Block')
  await page.mouse.click(CENTER.x, CENTER.y)

  await expect(cellLocator(page, 20, 20)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
})

test('a drag exceeding the threshold while placing pans the camera instead of stamping', async ({ page }) => {
  await selectPattern(page, 'Block')

  await dragPan(page, CENTER.x, CENTER.y, 50, 30)

  // offsetX'=-34.5, offsetY'=-24 -> world (0,0) now renders at (690, 480),
  // same pan convention verified in camera-pan-and-zoom.e2e.spec.ts.
  await expect.poll(() => elementAtPoint(page, 695, 485)).toBe('Cell 0, 0')
  await expect(cellLocator(page, 0, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
})

test('the preview keeps tracking the pointer as the camera pans mid-drag', async ({ page }) => {
  await selectPattern(page, 'Block')

  await dragPan(page, CENTER.x, CENTER.y, 50, 30)

  // The drag ends with world (0, 0) back under the cursor (previous test),
  // so the preview should still be anchored there despite the camera having
  // moved underneath it during the drag.
  await expect(page.locator('[aria-label="Pattern preview cell 0, 0"]')).toBeVisible()
  await expect(page.locator('[aria-label="Pattern preview cell 1, 1"]')).toBeVisible()
})

test('Escape while placing cancels placing mode without stamping', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.mouse.move(CENTER.x, CENTER.y)
  await expect(previewCells(page)).toHaveCount(4)

  await page.keyboard.press('Escape')

  await expect(previewCells(page)).toHaveCount(0)
  await page.mouse.click(CENTER.x, CENTER.y)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
})

test('clicking the Patterns toolbar button while placing cancels placing mode without stamping', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.mouse.move(CENTER.x, CENTER.y)

  await patternsButton(page).click()

  await expect(previewCells(page)).toHaveCount(0)
  await expect(modal(page)).toHaveCount(0)
  await page.mouse.click(CENTER.x, CENTER.y)
  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
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

test('Enter resumes advancing the generation once the modal is closed', async ({ page }) => {
  await openPatternModal(page)
  await page.keyboard.press('Escape')
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
})

test('Enter resumes advancing the generation once placing mode ends via a stamp', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.mouse.click(CENTER.x, CENTER.y)
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
})

test('Enter resumes advancing the generation once placing mode ends via cancel', async ({ page }) => {
  await selectPattern(page, 'Block')
  await page.keyboard.press('Escape')
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
})
