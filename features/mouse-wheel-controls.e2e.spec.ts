import { test, expect } from '@playwright/test'
import { CENTER, elementAtPoint, shiftWheel, zoomPercent } from './e2e-helpers'

// Re-homed from mouse-wheel-controls.feature by the feature-prose-honesty
// slice, under the acceptance-contract-rulings ruling that a geometric promise
// moved to the paired spec survives in features/** only if this header records
// it: a shift-held wheel zoom keeps the point under the cursor fixed. The
// Gherkin clause saying so was unstateable without pixel vocabulary and
// unobservable from jsdom; the feature now states only that scrolling up zooms
// in and scrolling down zooms out. The invariance itself is asserted in a real
// browser by the second test below, which re-reads the element under the very
// pixel the wheel was rolled over. It may not be deleted here without being
// restated in features/**.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('scrolling without a modifier pans instead of zooming', async ({ page }) => {
  await page.mouse.move(CENTER.x, CENTER.y)
  await page.mouse.wheel(40, 100)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  // panCamera(camera,-40,-100) -> offsetX'=-30, offsetY'=-17.5 -> world
  // (0,0) now renders at (600, 350).
  await expect.poll(() => elementAtPoint(page, 600, 350)).toBe('Cell 0, 0')
})

test('scrolling with shift held zooms instead of panning, keeping the cursor point fixed', async ({ page }) => {
  // (700, 300): clear of the HUD panel, zoom toolbar, and scrollbars.
  const before = await elementAtPoint(page, 700, 300)
  await shiftWheel(page, 700, 300, 0, -100)

  await expect.poll(() => zoomPercent(page)).toBe(125)
  await expect.poll(() => elementAtPoint(page, 700, 300)).toBe(before)
})

const AXIS_ROWS = [
  { label: 'deltaY only', deltaX: 0, deltaY: -100 },
  { label: 'both axes, deltaY dominant', deltaX: 50, deltaY: -100 },
] as const

for (const { label, deltaX, deltaY } of AXIS_ROWS) {
  test(`shift-held zoom resolves direction from deltaY (${label})`, async ({ page }) => {
    await shiftWheel(page, CENTER.x, CENTER.y, deltaX, deltaY)
    await expect.poll(() => zoomPercent(page)).toBe(125)
  })
}

test('zoom percentage reflects the current cell size at reachable checkpoints', async ({ page }) => {
  await expect.poll(() => zoomPercent(page)).toBe(100)

  const zoomIn = page.locator('button[aria-label="Zoom in"]')
  for (let i = 0; i < 10; i++) {
    await zoomIn.click()
  }
  await expect.poll(() => zoomPercent(page)).toBe(300)

  const zoomOut = page.locator('button[aria-label="Zoom out"]')
  for (let i = 0; i < 20; i++) {
    await zoomOut.click()
  }
  await expect.poll(() => zoomPercent(page)).toBe(40)
})
