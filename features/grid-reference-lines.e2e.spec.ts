import { test, expect, type Page } from '@playwright/test'
import { axisLabelValues, CENTER, cellLocator, dragPan, rulerGroup } from './e2e-helpers'

// rulerGroup lives in features/screenplay/elements.ts -- reached from here
// through ./e2e-helpers, the Screenplay layer's single entry point -- because
// features/steps/grid-reference-lines.ts reads the same ruler, and how a ruler
// is reached belongs in one place. It
// resolves the axis through the accessible tree -- role="group" plus the name
// GridRuler gives it -- so an assertion below says the label is on the COLUMN
// ruler, not merely that some element carrying the top strip's Tailwind class
// has that text.
async function labelSet(page: Page, axis: 'x' | 'y'): Promise<Set<number>> {
  return new Set(await axisLabelValues(page, axis))
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
    const label = rulerGroup(page, 'x').getByText(new RegExp(`^${coordinate}$`))
    await expect(label).toHaveCount(isMajor ? 1 : 0)

    const cellClass = await cellLocator(page, coordinate, 0).getAttribute('class')
    expect(cellClass?.includes('border-l-2 border-l-gray-400')).toBe(isMajor)
  })
}

test('the default camera shows major gridlines exactly at the multiples of 10 in its visible range', async ({
  page,
}) => {
  await expect.poll(() => labelSet(page, 'x')).toEqual(new Set([-30, -20, -10, 0, 10, 20, 30]))
  await expect.poll(() => labelSet(page, 'y')).toEqual(new Set([-20, -10, 0, 10, 20]))
})

test('gridlines recompute correctly after panning to an all-positive range', async ({ page }) => {
  // dx=-1000 -> offsetX' = -32 + 50 = 18, visible range x: 16..84.
  await dragPan(page, CENTER.x, CENTER.y, -1000, 0, 20)

  await expect.poll(() => labelSet(page, 'x')).toEqual(new Set([20, 30, 40, 50, 60, 70, 80]))
  await expect.poll(() => labelSet(page, 'y')).toEqual(new Set([-20, -10, 0, 10, 20]))
})
