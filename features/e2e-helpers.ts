import { expect, type Page } from '@playwright/test'
import { CELL_ALIVE_ATTR, CELL_ALIVE_VALUE, CELL_DEAD_VALUE } from '../src/test-support/cellQuery.ts'

import { CENTER, DEFAULT_CELL_SIZE_PX, DEFAULT_OFFSET_X, DEFAULT_OFFSET_Y } from './screenplay/viewport.ts'
import {
  cellLocator,
  patternLibraryModal,
  patternsButton,
  scrollbarThumb,
  type ScrollbarOrientation,
} from './screenplay/elements.ts'

export { CENTER, DEFAULT_CELL_SIZE_PX } from './screenplay/viewport.ts'
export { cellLocator, patternsButton, patternLibraryModal, previewCells, rulerGroup } from './screenplay/elements.ts'
export type { ScrollbarOrientation } from './screenplay/elements.ts'
export {
  zoomPercent,
  elementAtPoint,
  patternCategoryInLibrary,
  previewCellPositions,
  cellScreenPosition,
  cellState,
  aliveCellCount,
  generationCount,
  axisLabelValues,
  thumbTrackFraction,
  thumbPositionPercent,
} from './screenplay/questions.ts'

// The one way this suite asserts aliveness. It reads aria-pressed -- the
// accessible state a screen reader announces -- and not the bg-gray-900 /
// bg-white paint, which is a styling decision a black-box layer has no
// business knowing (rules/no-aliveness-by-paint-class.yml). The visual half
// of that contract lives in src/components/Cell.test.tsx's 'Cell paint'
// block, so nothing is lost by asserting only the accessible half here.
//
// Note this is STRICTER than the toHaveClass(/bg-white/) it replaced:
// toHaveAttribute compares the whole value, where the class regex matched a
// substring of a long className. Returns the assertion's promise rather than
// awaiting it, so a caller that forgets to await gets an unhandled rejection
// rather than a silent pass.
export function expectCellState(page: Page, x: number, y: number, state: 'alive' | 'dead'): Promise<void> {
  return expect(cellLocator(page, x, y)).toHaveAttribute(
    CELL_ALIVE_ATTR,
    state === 'alive' ? CELL_ALIVE_VALUE : CELL_DEAD_VALUE,
  )
}

export async function nextGeneration(page: Page) {
  await page.locator('#next-generation-button').click()
}

export async function resetView(page: Page) {
  await page.locator('button[aria-label="Reset view"]').click()
}

// useGridPointerGestures reports panByPixels per pointermove with the
// incremental delta (drag.lastX/lastY), so the net camera shift always equals
// the requested (dx, dy) regardless of step count.
export async function dragPan(page: Page, fromX: number, fromY: number, dx: number, dy: number, steps = 10) {
  await page.mouse.move(fromX, fromY)
  await page.mouse.down()
  await page.mouse.move(fromX + dx, fromY + dy, { steps })
  await page.mouse.up()
}

// Opens the library AND waits for it to be there. The wait is the load-bearing
// half: every toHaveCount(0) this file asserts about the modal is satisfied
// vacuously by a locator that resolves to nothing, so "the library closed" only
// means anything once "the library was open" has been asserted through the same
// locator. Positively asserting it here covers both negative sites, since every
// path to either one opens the modal through this function first.
//
// It also removes a latent race: patternCategoryInLibrary's evaluateAll does
// not auto-wait, so it would read an empty list off a dialog React had not
// mounted yet.
export async function openPatternModal(page: Page) {
  await patternsButton(page).click()
  await expect(patternLibraryModal(page)).toHaveCount(1)
}

// Arms a pattern from an ALREADY-OPEN library. Split out of selectPattern
// below because pattern-library.feature reads the library's contents before
// it arms anything: its category step needs the modal open, and its shape
// step then arms from that same open modal. Re-opening in between is not
// available -- the modal makes the rest of the page inert, so the Patterns
// button cannot be reached while it is up.
export async function choosePatternFromLibrary(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click()

  // Headless UI's Dialog stays mounted through its ~100ms leave transition,
  // still covering the click point during that window -- waiting for it to
  // fully unmount here (rather than at each call site) keeps the subsequent
  // mouse.move/click in every caller from landing on the closing dialog
  // instead of the grid underneath.
  await expect(patternLibraryModal(page)).toHaveCount(0)
}

export async function selectPattern(page: Page, name: string) {
  await openPatternModal(page)
  await choosePatternFromLibrary(page, name)
}

// Puts the pointer over a world cell, which is what arms the preview: Grid's
// trackHover reports the cell under the pointer, and nothing is previewed
// until it has.
export async function hoverCell(page: Page, x: number, y: number) {
  await cellLocator(page, x, y).hover()
}

// Playwright keeps keyboard focus on the button that was last clicked.
// "Enter with nothing focused" scenarios need an explicit blur first --
// otherwise Enter would trigger that button's own native click instead of
// exercising the no-op case they're meant to check.
export async function blurFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

export async function shiftWheel(page: Page, atX: number, atY: number, deltaX: number, deltaY: number) {
  await page.mouse.move(atX, atY)
  await page.keyboard.down('Shift')
  await page.mouse.wheel(deltaX, deltaY)
  await page.keyboard.up('Shift')
}

export async function dragScrollbarThumb(page: Page, orientation: ScrollbarOrientation, deltaPx: number) {
  const box = (await scrollbarThumb(page, orientation).boundingBox())!
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

// Pans an off-screen world cell to a spot clear of the toolbar/scrollbars/HUD,
// leaving the camera there. Callers are responsible for getting back to the
// default view -- toggleFarCell and withCellInView below both do.
// Module-private: it leaves the camera moved, which is a trap for a caller
// that does not put it back. toggleFarCell and withCellInView below are the
// two supported ways to use it, and both restore the default camera.
async function panCellIntoView(page: Page, worldX: number, worldY: number) {
  const SPOT = { x: 200, y: 200 }
  const desiredOffsetX = worldX - SPOT.x / DEFAULT_CELL_SIZE_PX
  const desiredOffsetY = worldY - SPOT.y / DEFAULT_CELL_SIZE_PX
  const dx = -(desiredOffsetX - DEFAULT_OFFSET_X) * DEFAULT_CELL_SIZE_PX
  const dy = -(desiredOffsetY - DEFAULT_OFFSET_Y) * DEFAULT_CELL_SIZE_PX
  await dragPan(page, CENTER.x, CENTER.y, dx, dy, 20)
}

// Brings an off-screen world cell into view at a spot clear of the
// toolbar/scrollbars/HUD, toggles it, then resets back to the default
// camera so later pixel-math assertions can keep using the default
// (offsetX=-32, offsetY=-22.5) formulas.
export async function toggleFarCell(page: Page, worldX: number, worldY: number) {
  await panCellIntoView(page, worldX, worldY)
  await cellLocator(page, worldX, worldY).click()
  await resetView(page)
}

// Runs `body` with the given world cell guaranteed to have a DOM node.
//
// Only a bounded window of the infinite grid is mounted at a time, so a cell
// far from the camera has no element at all -- a click or an aria-pressed read
// on it fails with "no such element" rather than with anything about the
// game. A cell that is ALREADY mounted is left exactly where it is, so the
// default-camera pixel formulas above stay valid for the common case; only an
// off-screen one costs a pan, and the camera is put back afterwards even if
// `body` throws.
export async function withCellInView<T>(page: Page, worldX: number, worldY: number, body: () => Promise<T>) {
  if ((await cellLocator(page, worldX, worldY).count()) > 0) return body()
  await panCellIntoView(page, worldX, worldY)
  try {
    return await body()
  } finally {
    await resetView(page)
  }
}

// Clicks a single, possibly off-screen, cell -- the withCellInView + click
// pair every step that toggles one cell (rather than a batch) needs.
export async function clickCell(page: Page, x: number, y: number) {
  await withCellInView(page, x, y, () => cellLocator(page, x, y).click())
}

// ---------------------------------------------------------------------------
// Below this line: helpers added for the generated Playwright-BDD step modules
// under features/steps/. They are shared with the hand-written specs above --
// same layer, same rules -- but a step module's import allowlist is only
// playwright-bdd, @playwright/test and this file, so anything a step needs
// that it cannot reach through here has to be ADDED here rather than imported
// around.
// ---------------------------------------------------------------------------

// Every scenario starts on a freshly loaded grid, but the step that opens it
// is a scenario's FIRST step in one feature and a LATER one in another:
// "a camera centered on the origin at the default zoom" opens every
// camera-pan-and-zoom scenario and follows a live-cell step in
// grid-scrollbars'. Navigating unconditionally would wipe the cells the
// earlier step just placed, so this navigates only from the blank page
// Playwright hands each test.
export async function openGrid(page: Page) {
  if (page.url().startsWith('http')) return
  await page.goto('/')
}

export async function zoomIn(page: Page) {
  await page.locator('button[aria-label="Zoom in"]').click()
}

export async function zoomOut(page: Page) {
  await page.locator('button[aria-label="Zoom out"]').click()
}

// The five cells that describe a blinker's shape, wherever it is centered:
// its three live cells along the blinker's own axis, and the two neighbors
// along the OTHER axis that prove it hasn't smeared sideways. Shared by
// cell-life-and-death.ts (a remembered center) and infinite-grid.ts (a
// literal one) -- the step registry is global, so this is the one place the
// shape itself is stated rather than restated per caller.
export async function expectBlinker(
  page: Page,
  centerX: number,
  centerY: number,
  orientation: 'horizontal' | 'vertical',
): Promise<void> {
  const [ax, ay] = orientation === 'horizontal' ? ([1, 0] as const) : ([0, 1] as const)
  const [dx, dy] = orientation === 'horizontal' ? ([0, 1] as const) : ([1, 0] as const)
  await withCellInView(page, centerX, centerY, async () => {
    await expectCellState(page, centerX - ax, centerY - ay, 'alive')
    await expectCellState(page, centerX, centerY, 'alive')
    await expectCellState(page, centerX + ax, centerY + ay, 'alive')
    await expectCellState(page, centerX - dx, centerY - dy, 'dead')
    await expectCellState(page, centerX + dx, centerY + dy, 'dead')
  })
}

export { remember, recall, rememberText, recallText } from './screenplay/notepad.ts'
