import { expect, type Locator, type Page } from '@playwright/test'

// Derived from centeredCamera(1280, 900) in src/camera.ts: default camera
// is { offsetX: -32, offsetY: -22.5, cellSize: 20 }, so world (0,0) renders
// at screen (640, 450) -- the exact viewport center under playwright.config.ts's
// fixed 1280x900 viewport. Every pixel-math assertion in this suite is
// derived from this.
export const CENTER = { x: 640, y: 450 }

export function cellLocator(page: Page, x: number, y: number): Locator {
  return page.locator(`button[aria-label="Cell ${x}, ${y}"]`)
}

export async function isAlive(locator: Locator): Promise<boolean> {
  return ((await locator.getAttribute('class')) ?? '').includes('bg-gray-900')
}

export async function nextGeneration(page: Page) {
  await page.locator('#next-generation-button').click()
}

export async function generationText(page: Page) {
  return page.getByText(/^Generation: \d+$/).textContent()
}

export async function zoomPercent(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+%$/).textContent()
  return Number(text!.replace('%', ''))
}

export async function resetView(page: Page) {
  await page.locator('button[aria-label="Reset view"]').click()
}

export async function elementAtPoint(page: Page, x: number, y: number): Promise<string | null> {
  return page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.getAttribute('aria-label') ?? null, [
    x,
    y,
  ] as const)
}

// Grid.tsx applies panByPixels per pointermove with the incremental delta
// (drag.lastX/lastY), so the net camera shift always equals the requested
// (dx, dy) regardless of step count.
export async function dragPan(page: Page, fromX: number, fromY: number, dx: number, dy: number, steps = 10) {
  await page.mouse.move(fromX, fromY)
  await page.mouse.down()
  await page.mouse.move(fromX + dx, fromY + dy, { steps })
  await page.mouse.up()
}

export function patternsButton(page: Page): Locator {
  return page.locator('button[aria-label="Open pattern library"]')
}

export function patternLibraryModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Pattern library' })
}

export async function openPatternModal(page: Page) {
  await patternsButton(page).click()
}

export async function selectPattern(page: Page, name: string) {
  await openPatternModal(page)
  await page.getByRole('button', { name, exact: true }).click()

  // Headless UI's Dialog stays mounted through its ~100ms leave transition,
  // still covering the click point during that window -- waiting for it to
  // fully unmount here (rather than at each call site) keeps the subsequent
  // mouse.move/click in every caller from landing on the closing dialog
  // instead of the grid underneath.
  await expect(patternLibraryModal(page)).toHaveCount(0)
}

// Playwright keeps keyboard focus on the button that was last clicked, and
// Enter on a focused <button> triggers its own native click too (after the
// global window keydown listener runs, per the ordering documented in
// hud-layout-and-shortcuts.e2e.spec.ts) -- blurring first isolates the
// Enter-suppression assertions from that unrelated double-activation.
export async function blurFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

export async function shiftWheel(page: Page, atX: number, atY: number, deltaX: number, deltaY: number) {
  await page.mouse.move(atX, atY)
  await page.keyboard.down('Shift')
  await page.mouse.wheel(deltaX, deltaY)
  await page.keyboard.up('Shift')
}

export async function dragScrollbarThumb(page: Page, orientation: 'horizontal' | 'vertical', deltaPx: number) {
  const thumb = page.locator(`[role="scrollbar"][aria-orientation="${orientation}"]`)
  const box = (await thumb.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  if (orientation === 'horizontal') {
    await page.mouse.move(x + deltaPx, y, { steps: 10 })
  } else {
    await page.mouse.move(x, y + deltaPx, { steps: 10 })
  }
  await page.mouse.up()
}

// Brings an off-screen world cell into view at a spot clear of the
// toolbar/scrollbars/HUD, toggles it, then resets back to the default
// camera so later pixel-math assertions can keep using the default
// (offsetX=-32, offsetY=-22.5) formulas.
export async function toggleFarCell(page: Page, worldX: number, worldY: number) {
  const SPOT = { x: 200, y: 200 }
  const CELL_SIZE = 20
  const DEFAULT_OFFSET_X = -32
  const DEFAULT_OFFSET_Y = -22.5
  const desiredOffsetX = worldX - SPOT.x / CELL_SIZE
  const desiredOffsetY = worldY - SPOT.y / CELL_SIZE
  const dx = -(desiredOffsetX - DEFAULT_OFFSET_X) * CELL_SIZE
  const dy = -(desiredOffsetY - DEFAULT_OFFSET_Y) * CELL_SIZE
  await dragPan(page, CENTER.x, CENTER.y, dx, dy, 20)
  await cellLocator(page, worldX, worldY).click()
  await resetView(page)
}
