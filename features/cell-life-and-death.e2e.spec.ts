import { test, expect } from '@playwright/test'
import { cellLocator, nextGeneration } from './e2e-helpers'

const ALIVE_CLASS = /bg-gray-900/
const DEAD_CLASS = /bg-white/

const NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('toggling a dead cell brings it to life', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(ALIVE_CLASS)
})

test('toggling a live cell kills it', async ({ page }) => {
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(ALIVE_CLASS)
  await cellLocator(page, 2, 3).click()
  await expect(cellLocator(page, 2, 3)).toHaveClass(DEAD_CLASS)
})

const NEIGHBOR_COUNT_ROWS = [
  { state: 'alive', neighbors: 0, nextState: 'dead' },
  { state: 'alive', neighbors: 1, nextState: 'dead' },
  { state: 'alive', neighbors: 2, nextState: 'alive' },
  { state: 'alive', neighbors: 3, nextState: 'alive' },
  { state: 'alive', neighbors: 4, nextState: 'dead' },
  { state: 'dead', neighbors: 2, nextState: 'dead' },
  { state: 'dead', neighbors: 3, nextState: 'alive' },
  { state: 'dead', neighbors: 4, nextState: 'dead' },
] as const

for (const { state, neighbors, nextState } of NEIGHBOR_COUNT_ROWS) {
  test(`a cell that is ${state} with ${neighbors} live neighbors ends up ${nextState}`, async ({ page }) => {
    if (state === 'alive') {
      await cellLocator(page, 0, 0).click()
    }
    for (const [dx, dy] of NEIGHBOR_OFFSETS.slice(0, neighbors)) {
      await cellLocator(page, dx, dy).click()
    }

    await nextGeneration(page)

    await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
    await expect(cellLocator(page, 0, 0)).toHaveClass(nextState === 'alive' ? ALIVE_CLASS : DEAD_CLASS)
  })
}

test('a horizontal blinker becomes vertical after one generation', async ({ page }) => {
  await cellLocator(page, 0, 1).click()
  await cellLocator(page, 1, 1).click()
  await cellLocator(page, 2, 1).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 2)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(DEAD_CLASS)
})

test('a vertical blinker becomes horizontal after one generation', async ({ page }) => {
  await cellLocator(page, 1, 0).click()
  await cellLocator(page, 1, 1).click()
  await cellLocator(page, 1, 2).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 1, 2)).toHaveClass(DEAD_CLASS)
})

test('a 2x2 block never changes', async ({ page }) => {
  await cellLocator(page, 0, 0).click()
  await cellLocator(page, 1, 0).click()
  await cellLocator(page, 0, 1).click()
  await cellLocator(page, 1, 1).click()

  await nextGeneration(page)

  await expect(cellLocator(page, 0, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 0)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 0, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, 1, 1)).toHaveClass(ALIVE_CLASS)
  await expect(cellLocator(page, -1, 0)).toHaveClass(DEAD_CLASS)
  await expect(cellLocator(page, 2, 1)).toHaveClass(DEAD_CLASS)
})
