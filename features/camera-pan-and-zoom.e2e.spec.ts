import { test, expect } from '@playwright/test'
import { CENTER, dragPan, elementAtPoint, resetView, zoomPercent } from './e2e-helpers'
import { ALIVE_CELL_SELECTOR } from '../src/test-support/cellQuery.ts'

// Re-homed from camera-pan-and-zoom.feature by the feature-prose-honesty slice,
// under the acceptance-contract-rulings ruling that a geometric promise moved to
// the paired spec survives in features/** only if this header records it. Two
// promises live here and nowhere else in the contract:
//
//   1. Zooming in keeps the point it is anchored on fixed. The Gherkin clause
//      said "the point under the cursor should not move", which cannot be
//      stated without pixel vocabulary and cannot be observed at all from
//      jsdom. The toolbar's own anchor is the viewport center, so the spec
//      below asserts the world origin still renders at CENTER after a
//      zoom-in click.
//   2. Resetting the view puts the origin back at the exact center of the
//      viewport. The feature now states reset through the ruler instead --
//      the coordinate labels come back balanced around the origin -- which is
//      true but only to the ruler's 10-cell resolution. The pixel-exact form
//      is the last test in this file.
//
// Both are asserted below through the real UI. Neither may be deleted here
// without restating it in features/**.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('panning moves the viewport without changing the zoom level', async ({ page }) => {
  await dragPan(page, CENTER.x, CENTER.y, 40, 20)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  // offsetX'=-34, offsetY'=-23.5 -> world (0,0) now renders at (680, 470).
  await expect.poll(() => elementAtPoint(page, 680, 470)).toBe('Cell 0, 0')
})

test('zooming in via the toolbar keeps the world origin fixed at the viewport center', async ({ page }) => {
  await page.locator('button[aria-label="Zoom in"]').click()

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => elementAtPoint(page, CENTER.x, CENTER.y)).toBe('Cell 0, 0')
})

test('zoom clamps to the maximum after enough zoom-in clicks', async ({ page }) => {
  const zoomIn = page.locator('button[aria-label="Zoom in"]')
  for (let i = 0; i < 10; i++) {
    await zoomIn.click()
  }
  await expect.poll(() => zoomPercent(page)).toBe(300)
})

test('zoom clamps to the minimum after enough zoom-out clicks', async ({ page }) => {
  const zoomOut = page.locator('button[aria-label="Zoom out"]')
  for (let i = 0; i < 10; i++) {
    await zoomOut.click()
  }
  await expect.poll(() => zoomPercent(page)).toBe(40)
})

test('toolbar buttons never toggle whatever cell happens to be positioned underneath them', async ({ page }) => {
  // Regression test: the toolbar previously only stopped propagation on
  // pointerdown, not pointerup, so releasing a click over the toolbar could
  // bubble through to the grid's own handlePointerUp and toggle the cell
  // rendered underneath the button.
  await page.locator('button[aria-label="Zoom in"]').click()
  await page.locator('button[aria-label="Zoom out"]').click()
  await page.locator('button[aria-label="Reset view"]').click()

  await expect(page.locator(ALIVE_CELL_SELECTOR)).toHaveCount(0)
})

test('resetting the view returns to the default centered zoom regardless of prior pan/zoom', async ({ page }) => {
  await dragPan(page, 300, 300, 500, 500, 20)
  await page.locator('button[aria-label="Zoom in"]').click()
  await page.locator('button[aria-label="Zoom in"]').click()

  await resetView(page)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  await expect.poll(() => elementAtPoint(page, CENTER.x, CENTER.y)).toBe('Cell 0, 0')
})
