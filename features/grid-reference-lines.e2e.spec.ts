import { test, expect, type Page } from '@playwright/test'
import { CENTER, cellLocator, dragPan } from './e2e-helpers'

// Ruler labels are <span> elements whose text is just the coordinate number
// (RulerLabel in Grid.tsx), bucketed by axis via the class it's pinned to
// (top-0.5 for the x-axis strip, left-0.5 for the y-axis strip). No other
// on-screen text matches a bare "-?\d+" pattern (the zoom badge has a "%"
// suffix, the generation counter has a "Generation: " prefix).
function xAxisLabels(page: Page) {
  return page.locator('span[class*="top-0.5"]')
}
function yAxisLabels(page: Page) {
  return page.locator('span[class*="left-0.5"]')
}

async function labelSet(locator: ReturnType<typeof xAxisLabels>): Promise<Set<number>> {
  const texts = await locator.allTextContents()
  return new Set(texts.map(Number))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

const GRIDLINE_ROWS = [
  { coordinate: 0, isMajor: true },
  { coordinate: 10, isMajor: true },
  { coordinate: -10, isMajor: true },
  { coordinate: 5, isMajor: false },
  { coordinate: 11, isMajor: false },
  { coordinate: -3, isMajor: false },
] as const

for (const { coordinate, isMajor } of GRIDLINE_ROWS) {
  test(`coordinate ${coordinate} ${isMajor ? 'is' : 'is not'} a major gridline`, async ({ page }) => {
    const label = xAxisLabels(page).filter({ hasText: new RegExp(`^${coordinate}$`) })
    await expect(label).toHaveCount(isMajor ? 1 : 0)

    const cellClass = await cellLocator(page, coordinate, 0).getAttribute('class')
    expect(cellClass?.includes('border-l-2 border-l-gray-400')).toBe(isMajor)
  })
}

test('the default camera shows major gridlines exactly at the multiples of 10 in its visible range', async ({
  page,
}) => {
  await expect.poll(() => labelSet(xAxisLabels(page))).toEqual(new Set([-30, -20, -10, 0, 10, 20, 30]))
  await expect.poll(() => labelSet(yAxisLabels(page))).toEqual(new Set([-20, -10, 0, 10, 20]))
})

test('gridlines recompute correctly after panning to an all-positive range', async ({ page }) => {
  // dx=-1000 -> offsetX' = -32 + 50 = 18, visible range x: 16..84.
  await dragPan(page, CENTER.x, CENTER.y, -1000, 0, 20)

  await expect.poll(() => labelSet(xAxisLabels(page))).toEqual(new Set([20, 30, 40, 50, 60, 70, 80]))
  await expect.poll(() => labelSet(yAxisLabels(page))).toEqual(new Set([-20, -10, 0, 10, 20]))
})
