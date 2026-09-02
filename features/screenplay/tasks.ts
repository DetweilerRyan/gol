// SCREENPLAY: the Tasks -- a goal a user has, composed out of Interactions.
// Each one is several acts that only make sense together, and each leaves the
// app back in a state the next step can reason about: the three cell tasks all
// put the camera back where they found it, which is what keeps every
// default-camera pixel formula in features/ valid after they run.
//
// Tasks may read a locator's own count (withCellInView asks whether the cell is
// mounted at all) but ask no Questions: what the app SAYS about the outcome is
// the caller's business, not the task's.
import { cellLocator, focusedCellElement } from './elements.ts'
import {
  blurFocus,
  choosePatternFromLibrary,
  dragPan,
  moveFocus,
  openPatternModal,
  pressKey,
  resetView,
  tabForward,
} from './interactions.ts'
import { CENTER, DEFAULT_CELL_SIZE_PX, DEFAULT_OFFSET_X, DEFAULT_OFFSET_Y } from './viewport.ts'
import { type Page } from '@playwright/test'

export async function selectPattern(page: Page, name: string) {
  await openPatternModal(page)
  await choosePatternFromLibrary(page, name)
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
// default-camera pixel formulas stay valid for the common case; only an
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

// The label the focus cursor announces itself by. Parsed here as well as in
// questions.ts's focusedCell, and deliberately not shared between them: the
// layering under the barrel runs tasks -> elements/interactions/viewport and
// has no tasks -> questions edge (see this file's header), so importing the
// Question would put a cycle-shaped edge on the graph for one regex. If a
// third reader ever appears, the shared home is elements.ts, not an import
// across this line.
const FOCUSED_CELL_LABEL = /^Cell (-?\d+), (-?\d+)$/

async function focusedCellCoordinate(page: Page): Promise<[number, number] | null> {
  const element = focusedCellElement(page)
  if ((await element.count()) === 0) return null
  const match = FOCUSED_CELL_LABEL.exec((await element.getAttribute('aria-label')) ?? '')
  return match ? [Number(match[1]), Number(match[2])] : null
}

// Puts the keyboard focus on one named cell, by the route a keyboard player
// actually takes: tab onto the grid, then step there with the arrow keys.
//
// It STEERS rather than assumes -- it reads where the tab landed and walks the
// difference -- so it works whether or not the grid remembers a previous
// position, and whether or not a pointer click moves the cursor. Both of those
// are behaviours the scenarios above state in their own right; a task that
// baked either one in would make them assert themselves.
export async function focusGridCell(page: Page, x: number, y: number) {
  await blurFocus(page)
  await tabForward(page)
  const landed = await focusedCellCoordinate(page)
  if (!landed) throw new Error('Tab did not put the keyboard focus on a grid cell')

  const [fromX, fromY] = landed
  for (let step = 0; step < Math.abs(x - fromX); step++) await moveFocus(page, x > fromX ? 'right' : 'left')
  for (let step = 0; step < Math.abs(y - fromY); step++) await moveFocus(page, y > fromY ? 'down' : 'up')
}

// Focus on the cell at one edge of the view along whatever row the grid is
// entered on, and reports which cell that turned out to be -- a coordinate no
// scenario can name, because it depends on where the camera is.
export async function focusEdgeCellInView(page: Page, edge: 'left' | 'right'): Promise<[number, number]> {
  await blurFocus(page)
  await tabForward(page)
  await pressKey(page, edge === 'left' ? 'Home' : 'End')
  const landed = await focusedCellCoordinate(page)
  if (!landed) throw new Error(`Nothing is focused after jumping to the ${edge} edge of the view`)
  return landed
}
