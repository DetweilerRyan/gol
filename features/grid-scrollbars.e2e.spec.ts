import { test, expect, type Page } from '@playwright/test'
import {
  CENTER,
  cellLocator,
  dragPan,
  dragScrollbarThumb,
  elementAtPoint,
  toggleFarCell,
  zoomPercent,
} from './e2e-helpers'

function horizontalThumb(page: Page) {
  return page.locator('[role="scrollbar"][aria-orientation="horizontal"]')
}
function verticalThumb(page: Page) {
  return page.locator('[role="scrollbar"][aria-orientation="vertical"]')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('an empty grid fills both scrollbar tracks entirely', async ({ page }) => {
  const hBox = (await horizontalThumb(page).boundingBox())!
  const vBox = (await verticalThumb(page).boundingBox())!

  expect(hBox.width).toBeGreaterThan(1280 * 0.95)
  expect(hBox.x).toBeLessThan(5)
  expect(vBox.height).toBeGreaterThan(900 * 0.95)
  expect(vBox.y).toBeLessThan(5)
})

test('content smaller than the viewport still fills both tracks', async ({ page }) => {
  await cellLocator(page, 5, 5).click()

  const hBox = (await horizontalThumb(page).boundingBox())!
  const vBox = (await verticalThumb(page).boundingBox())!

  expect(hBox.width).toBeGreaterThan(1280 * 0.95)
  expect(vBox.height).toBeGreaterThan(900 * 0.95)
})

test('content wider than the viewport shrinks only the horizontal thumb', async ({ page }) => {
  await toggleFarCell(page, 199, 0)
  await cellLocator(page, 0, 0).click()

  // contentBounds {minX:0,maxX:200,minY:0,maxY:1} -> extentWidth=4640,
  // thumbRatio = 1280/4640 ~= 0.276 -> thumb width ~= 353px, at the track's
  // left edge (thumbOffsetRatio=0).
  const hBox = (await horizontalThumb(page).boundingBox())!
  expect(hBox.width).toBeGreaterThan(330)
  expect(hBox.width).toBeLessThan(380)
  expect(hBox.x).toBeLessThan(5)

  const vBox = (await verticalThumb(page).boundingBox())!
  expect(vBox.height).toBeGreaterThan(900 * 0.95)
})

test('content taller than the viewport shrinks only the vertical thumb', async ({ page }) => {
  await toggleFarCell(page, 0, 199)
  await cellLocator(page, 0, 0).click()

  // contentBounds {minX:0,maxX:1,minY:0,maxY:200} -> extentHeight=4450,
  // thumbRatio = 900/4450 ~= 0.202 -> thumb height ~= 182px.
  const vBox = (await verticalThumb(page).boundingBox())!
  expect(vBox.height).toBeGreaterThan(165)
  expect(vBox.height).toBeLessThan(200)

  const hBox = (await horizontalThumb(page).boundingBox())!
  expect(hBox.width).toBeGreaterThan(1280 * 0.95)
})

test('panning far away from all content maxes out the scrollbar offset without breaking it', async ({ page }) => {
  await cellLocator(page, 0, 0).click()
  // dx=-11640 -> offsetX' = -32 + 582 = 550, far right of the single live cell.
  await dragPan(page, CENTER.x, CENTER.y, -11640, 0, 50)

  const hBox = (await horizontalThumb(page).boundingBox())!
  expect(hBox.width).toBeLessThan(1280 * 0.15)
  expect(hBox.x + hBox.width).toBeGreaterThan(1275)
})

test('dragging a scrollbar thumb never toggles whatever cell happens to be positioned underneath it', async ({
  page,
}) => {
  // Regression test: the scrollbar track previously only stopped
  // propagation on pointerdown, not pointerup/pointermove, so releasing a
  // drag over the track could bubble through to the grid's own
  // handlePointerUp and toggle the cell rendered underneath the thumb.
  await dragScrollbarThumb(page, 'horizontal', 50)
  await dragScrollbarThumb(page, 'vertical', 50)

  await expect(page.locator('button[aria-label^="Cell "].bg-gray-900')).toHaveCount(0)
})

test('dragging the vertical scrollbar thumb down pans the camera to reveal further content', async ({ page }) => {
  await dragScrollbarThumb(page, 'vertical', 50)

  await expect.poll(() => zoomPercent(page)).toBe(100)
  // deltaOffset = 50/1/20 = 2.5 -> offsetY'=-20 -> world (0,0) now at y=400.
  await expect.poll(() => elementAtPoint(page, CENTER.x, 400)).toBe('Cell 0, 0')
})

test('dragging the horizontal thumb at the default (full) thumb ratio pans by the expected amount', async ({
  page,
}) => {
  await dragScrollbarThumb(page, 'horizontal', 50)
  // deltaOffset = 50/1/20 = 2.5 -> offsetX'=-29.5 -> world (0,0) now at x=590.
  await expect.poll(() => elementAtPoint(page, 590, CENTER.y)).toBe('Cell 0, 0')
})

test('a smaller thumb ratio makes the same drag distance pan the camera further', async ({ page }) => {
  // Engineer content bounds {minX:-96,maxX:1} -> extentWidth=2560 -> thumbRatio=0.5 exactly.
  await toggleFarCell(page, -96, 0)
  await cellLocator(page, 0, 0).click()

  await dragScrollbarThumb(page, 'horizontal', 50)
  // deltaOffset = 50/0.5/20 = 5 -> offsetX'=-27 -> world (0,0) now at x=540.
  await expect.poll(() => elementAtPoint(page, 540, CENTER.y)).toBe('Cell 0, 0')
})

test('an even smaller thumb ratio pans the camera further still for the same drag distance', async ({ page }) => {
  // Engineer content bounds {minX:-224,maxX:1} -> extentWidth=5120 -> thumbRatio=0.25 exactly.
  await toggleFarCell(page, -224, 0)
  await cellLocator(page, 0, 0).click()

  await dragScrollbarThumb(page, 'horizontal', 50)
  // deltaOffset = 50/0.25/20 = 10 -> offsetX'=-22 -> world (0,0) now at x=440.
  await expect.poll(() => elementAtPoint(page, 440, CENTER.y)).toBe('Cell 0, 0')
})
