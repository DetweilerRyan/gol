// SCREENPLAY: the Tasks -- a goal a user has, composed out of Interactions.
// Each one is several acts that only make sense together, and each leaves the
// app back in a state the next step can reason about: the three cell tasks all
// put the camera back where they found it, which is what keeps every
// default-camera pixel formula in features/ valid after they run.
//
// Tasks may read a locator's own count (withCellInView asks whether the cell is
// mounted at all) but ask no Questions: what the app SAYS about the outcome is
// the caller's business, not the task's.
import { focusedCellElement, rovingGridCell } from './elements.ts'
import {
  choosePatternFromLibrary,
  clickGridAt,
  dragPan,
  hoverGridAt,
  moveFocus,
  openPatternModal,
  pressKey,
  resetView,
} from './interactions.ts'
import {
  CENTER,
  DEFAULT_CELL_SIZE_PX,
  DEFAULT_OFFSET_X,
  DEFAULT_OFFSET_Y,
  defaultViewCellCenterPx,
  isCellInDefaultView,
  PAN_TARGET_PX,
} from './viewport.ts'
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
  const SPOT = PAN_TARGET_PX
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
  await clickGridAt(page, pannedCellCenterPx(worldX, worldY, worldX, worldY))
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
  if (isCellInDefaultView(worldX, worldY)) return body()
  await panCellIntoView(page, worldX, worldY)
  try {
    return await body()
  } finally {
    await resetView(page)
  }
}

// AFTER panCellIntoView(anchorX, anchorY), the anchor's top-left sits exactly
// at PAN_TARGET_PX, so every other cell's pixel follows from its offset from
// the anchor. One derivation, from the same constant that did the panning --
// the alternative is each call site restating the pan's arithmetic.
function pannedCellCenterPx(anchorX: number, anchorY: number, x: number, y: number): { x: number; y: number } {
  return {
    x: PAN_TARGET_PX.x + (x - anchorX + 0.5) * DEFAULT_CELL_SIZE_PX,
    y: PAN_TARGET_PX.y + (y - anchorY + 0.5) * DEFAULT_CELL_SIZE_PX,
  }
}

// Clicks a group of cells, paying at most one pan for the whole group: the
// first cell is the anchor, and the rest are clicked at their offsets from it.
// Replaces the withCellInView + per-cell .click() pair every seeding step used,
// which reached each cell through its own element and therefore needed that
// element to exist even when the cell was dead.
//
// The group is required to be reachable TOGETHER, and says so by name if it is
// not. That is not defensiveness: a group whose anchor is on screen but whose
// tail is not would previously have clicked an element Playwright scrolled to,
// and would now click a pixel outside the viewport -- silently doing nothing.
export async function clickCells(page: Page, cells: ReadonlyArray<readonly [number, number]>) {
  if (cells.length === 0) return
  const [anchorX, anchorY] = cells[0]

  if (isCellInDefaultView(anchorX, anchorY)) {
    const unreachable = cells.filter(([x, y]) => !isCellInDefaultView(x, y))
    if (unreachable.length > 0)
      throw new Error(
        `Cell ${anchorX}, ${anchorY} is on screen but ${unreachable.map(([x, y]) => `(${x}, ${y})`).join(', ')} ${unreachable.length === 1 ? 'is' : 'are'} not, so this group cannot be clicked without moving the camera between clicks`,
      )
    for (const [x, y] of cells) await clickGridAt(page, defaultViewCellCenterPx(x, y))
    return
  }

  await panCellIntoView(page, anchorX, anchorY)
  try {
    for (const [x, y] of cells) await clickGridAt(page, pannedCellCenterPx(anchorX, anchorY, x, y))
  } finally {
    await resetView(page)
  }
}

// MOVES THE KEYBOARD CURSOR WITHOUT CHANGING THE BOARD, by clicking one cell
// twice: the pointer route sets the cursor on every tap, and two taps on one
// cell leave its aliveness exactly as they found it.
//
// It exists because the seeding route has a side effect the scenarios do not
// ask for. Clicking a cell to bring it to life also parks the cursor there, and
// the cursor's own cell stays mounted even when it is out of range -- that is
// what keeps the grid tabbable from off-screen. A step that then asserts the
// seeded cell has NO element is asserting against the one cell guaranteed to
// have one. Parking the cursor somewhere the step says nothing about restores
// the assertion to what it reads as.
//
// The keyboard route cannot do this job: reaching a distant cell by arrow keys
// costs one press per cell AND scrolls the view to follow, so it would move the
// camera the caller is about to make claims about.
export async function parkKeyboardCursorAt(page: Page, x: number, y: number) {
  await clickCell(page, x, y)
  await clickCell(page, x, y)
}

// Clicks a single, possibly off-screen, cell.
export async function clickCell(page: Page, x: number, y: number) {
  await clickCells(page, [[x, y]])
}

// Puts the pointer over a possibly off-screen cell, leaving it there -- the
// hover half of clickCell, for the pattern preview. Unlike clickCells it cannot
// restore the camera afterwards, because the whole point is that the pointer
// stays where it was put; every caller today hovers a cell in the default view.
export async function hoverCell(page: Page, x: number, y: number) {
  if (!isCellInDefaultView(x, y))
    throw new Error(`Cell ${x}, ${y} is off screen under the default camera, so the pointer cannot be put over it`)
  await hoverGridAt(page, defaultViewCellCenterPx(x, y))
}

// The label the focus cursor announces itself by. Parsed here as well as in
// questions.ts's focusedCell, and deliberately not shared between them: the
// layering under the barrel runs tasks -> elements/interactions/viewport and
// has no tasks -> questions edge (see this file's header), so importing the
// Question would put a cycle-shaped edge on the graph for one regex.
//
// THE RATIFIED HOME FOR THE SHARED FORM IS src/test-support/cellQuery.ts -- a
// parseCellLabel beside the cellLabel it inverts, on the scrollbarQuery.ts
// precedent where a parser lives next to its builder precisely so the two
// encodings cannot drift. That file is outside product's write boundary, so
// both copies here stay until the slice that adds it; do not consolidate them
// into elements.ts instead, which an earlier draft of this comment suggested
// before the ruling.
const FOCUSED_CELL_LABEL = /^Cell (-?\d+), (-?\d+)$/

async function focusedCellCoordinate(page: Page): Promise<[number, number] | null> {
  const element = focusedCellElement(page)
  if ((await element.count()) === 0) return null
  const match = FOCUSED_CELL_LABEL.exec((await element.getAttribute('aria-label')) ?? '')
  return match ? [Number(match[1]), Number(match[2])] : null
}

// Puts the keyboard focus on one named cell: enter the grid at its single tab
// stop, then step to the cell with the arrow keys.
//
// IT DOES NOT PRESS TAB TO GET IN, AND THAT IS A CORRECTION RATHER THAN A
// SHORTCUT. It used to blur and then Tab, which assumed blur() resets where
// sequential navigation resumes from. It does not: a scenario that has just
// closed the pattern library holds focus on the Patterns button, which sits
// AFTER the grid in tab order, so a forward Tab from there correctly walks away
// from the grid rather than into it -- and no amount of blur-side surgery can
// change that, because a reattached node routes the next Tab to itself. Going
// to the roving cell directly is what the tab stop means, and this is a Given
// establishing a position, never an assertion about tab order. The three
// scenarios that drive real Tab presses are where that is actually claimed.
//
// IT STEERS RATHER THAN ASSUMES -- it reads where the tab actually landed and
// walks the difference -- and that is a PRESERVATION CONSTRAINT, not an
// implementation detail to simplify away. Two accepted decisions are reachable
// only because this function assumes neither of them: the grid remembers the
// cell that last had focus, and a pointer click makes the clicked cell the one
// the keyboard is on. A "cheaper" rewrite that hardcoded a landing cell of
// (0, 0) would silently TAKE both decisions as premises, and the two scenarios
// that state them would then be asserting themselves.
export async function focusGridCell(page: Page, x: number, y: number) {
  await rovingGridCell(page).focus()
  const landed = await focusedCellCoordinate(page)
  if (!landed) throw new Error('Entering the grid did not put the keyboard focus on a cell')

  const [fromX, fromY] = landed
  for (let step = 0; step < Math.abs(x - fromX); step++) await moveFocus(page, x > fromX ? 'right' : 'left')
  for (let step = 0; step < Math.abs(y - fromY); step++) await moveFocus(page, y > fromY ? 'down' : 'up')
}

// Focus on the cell at one edge of the view along whatever row the grid is
// entered on, and reports which cell that turned out to be -- a coordinate no
// scenario can name, because it depends on where the camera is.
export async function focusEdgeCellInView(page: Page, edge: 'left' | 'right'): Promise<[number, number]> {
  await rovingGridCell(page).focus()
  await pressKey(page, edge === 'left' ? 'Home' : 'End')
  const landed = await focusedCellCoordinate(page)
  if (!landed) throw new Error(`Nothing is focused after jumping to the ${edge} edge of the view`)
  return landed
}
