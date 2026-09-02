import { test, expect } from '@playwright/test'
import { ALIVE_CELL_SELECTOR } from '../src/test-support/cellQuery.ts'
import {
  CENTER,
  clickGridAt,
  DEFAULT_CELL_SIZE_PX,
  defaultViewCellCenterPx,
  expectCellState,
  hoverGridAt,
  hoverIndicatorBox,
  originRulerPx,
  cellScreenPosition,
  resetView,
  waitForZoomToSettle,
  zoomIn,
  zoomOut,
  zoomPercent,
} from './e2e-helpers'

// ACCEPTED OUTLINE -- slice `collapse-dead-cell-layer` (product, SPECIFY),
// ratified by architect CONTRACT as category-3 residue (rendered pixel
// geometry). No matching .feature file, and that is a ruling rather than a gap:
// the whole content of this claim lives in a sub-pixel band at a cell boundary,
// which cannot be stated without pixel vocabulary .gherkin-lintrc bans, and a
// scenario placed mid-cell would have been green throughout the defect's entire
// life.
//
//   The pointer resolver has exactly one answer, and the highlight and the
//   click both read it. Sample points INSIDE the ~0.9px band left of and above
//   a cell boundary, at 40%, 100% and 300% zoom. The click side is observed by
//   real state change; the hover side by measuring the indicator's own box
//   against the expected cell's own box. NEVER document.elementFromPoint -- that
//   is the loose hit-test path that produced the earlier investigation's false
//   positive, and it is the very channel this slice moved hover OFF. Sample
//   points come from the boundary, never the cell middle.
//
// THE CRITERION THIS SLICE INHERITED: the hover indicator and the click must
// resolve to the same cell at every point. Before the slice they did not. CSS
// :hover went through the browser's own hit test; the click did not, because
// useGridPointerGestures takes pointer capture on #grid-content, so the click
// retargets to the container and Grid's onTap resolves the cell arithmetically
// through screenToWorld. In a band left of and above every boundary the user
// saw cell N highlighted while clicking toggled cell N-1.
//
// THIS SPEC IS SHOWN TO DISCRIMINATE, and the measurement is on THIS build
// rather than on a remembered one -- with two adjacent live cells either side of
// a boundary at x = 640, document.elementFromPoint (the old hover channel) flips
// to the right-hand cell at 639.1, an offset of -0.90px, while the indicator
// flips at 640.00, an offset of 0.00. So every sample point below sits where the
// two channels USED to disagree: the assertions here would have failed on the
// old behaviour and pass now. That measurement is an investigation, not an
// assertion -- elementFromPoint appears nowhere in this file.
//
// The indicator is reached by its paint class. See features/screenplay/
// elements.ts's hoverIndicator for why that is a missing test handle rather
// than an ARIA reach-around, and for the deletion trigger it carries.

// Half a pixel inside the band, on both axes at once: at (boundary - 0.5) the
// arithmetic resolves the LOWER cell on that axis, and the browser hit test
// used to resolve the higher one.
const INTO_BAND_PX = 0.5

// SETTLES AFTER EVERY CLICK, and that is not belt-and-braces -- without it
// this helper is wrong rather than merely slow. Since smooth-zoom-transitions
// a toolbar click GLIDES, so a percentage read straight after one is a value
// the view is still moving through: the loop misses its target on every rung,
// clicks the full eight times, and then asserts on a mid-glide reading.
// Measured before the wait was added, two consecutive full runs of this
// project at --workers=1: "Expected: 40, Received: 41", and 300 arriving as
// 297 and 299. It passed under the default parallel workers, where contention
// slowed each click round trip past the 200ms glide -- so the failure got
// LESS likely the busier the machine was, which is the wrong way round and is
// why it survived two green full runs before a single-worker one found it.
async function zoomTo(page: import('@playwright/test').Page, percent: number) {
  const step = percent > 100 ? zoomIn : zoomOut
  for (let click = 0; click < 8; click++) {
    if ((await zoomPercent(page)) === percent) return
    await step(page)
    await waitForZoomToSettle(page)
  }
  expect(await zoomPercent(page)).toBe(percent)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

for (const percent of [40, 100, 300]) {
  test(`at ${percent}% zoom the highlight and the click resolve the same cell inside the boundary band`, async ({
    page,
  }) => {
    // Seeded before zooming, at the pixel the default camera puts the origin
    // at, so the cell whose corner defines the boundary is one this suite can
    // measure -- a dead cell has no box to read.
    await clickGridAt(page, defaultViewCellCenterPx(0, 0))
    await expectCellState(page, 0, 0, 'alive')
    await zoomTo(page, percent)

    const origin = await cellScreenPosition(page, 0, 0)
    const sample = { x: origin.x - INTO_BAND_PX, y: origin.y - INTO_BAND_PX }

    // The cell the arithmetic puts under that pixel is the one diagonally
    // before the origin, and the old hit test would have said the origin.
    await hoverGridAt(page, sample)
    const highlighted = await hoverIndicatorBox(page)
    expect(highlighted, 'nothing is highlighted, so there is no agreement to check').not.toBeNull()

    await clickGridAt(page, sample)
    await expectCellState(page, -1, -1, 'alive')
    await expectCellState(page, 0, 0, 'alive') // the neighbour across the band is untouched

    // ONE resolver: the highlight sat exactly on the cell the click brought to
    // life. Compared against that cell's own measured box rather than against a
    // recomputed pixel, so this states agreement between two things on screen.
    const clicked = await cellScreenPosition(page, -1, -1)
    expect(highlighted!.x).toBeCloseTo(clicked.x, 1)
    expect(highlighted!.y).toBeCloseTo(clicked.y, 1)
  })
}

test('the highlight follows the pointer across a boundary rather than lagging it', async ({ page }) => {
  await clickGridAt(page, defaultViewCellCenterPx(0, 0))
  const origin = await cellScreenPosition(page, 0, 0)

  // Just inside the origin's own cell, then half a pixel back across its left
  // edge. The indicator must move by exactly one cell, which is the same
  // statement as "the band is gone" made as a difference rather than a position.
  await hoverGridAt(page, { x: origin.x + 4, y: origin.y + 4 })
  const inside = (await hoverIndicatorBox(page))!

  await hoverGridAt(page, { x: origin.x - INTO_BAND_PX, y: origin.y + 4 })
  const across = (await hoverIndicatorBox(page))!

  // The default camera's own cell size. Read from the constant rather than by
  // measuring a neighbour, because a neighbour is dead and a dead cell has no
  // box to measure -- which is the whole point of the slice this spec closes.
  expect(inside.x - across.x).toBeCloseTo(DEFAULT_CELL_SIZE_PX, 1)
  expect(inside.y).toBeCloseTo(across.y, 1)
})

test('resetting the view leaves the highlight on the cell actually under the pointer', async ({ page }) => {
  await clickGridAt(page, defaultViewCellCenterPx(0, 0))
  await zoomTo(page, 300)
  await resetView(page)

  const origin = await cellScreenPosition(page, 0, 0)
  await hoverGridAt(page, { x: origin.x - INTO_BAND_PX, y: origin.y - INTO_BAND_PX })

  await clickGridAt(page, { x: origin.x - INTO_BAND_PX, y: origin.y - INTO_BAND_PX })
  await expectCellState(page, -1, -1, 'alive')
  const clicked = await cellScreenPosition(page, -1, -1)
  const highlighted = (await hoverIndicatorBox(page))!
  expect(highlighted.x).toBeCloseTo(clicked.x, 1)
  expect(highlighted.y).toBeCloseTo(clicked.y, 1)
})

// THE SAME AGREEMENT, ASKED AFTER THE CAMERA MOVES RATHER THAN AFTER THE
// POINTER DOES -- the half this spec did not cover when it first landed, and
// the half a real defect was hiding in.
//
// The band tests above move the pointer and hold the camera still. These hold
// the POINTER still and move the camera underneath it, which is the case a
// resolver that caches a world cell gets wrong: the cached cell keeps its
// coordinate while the pixel under the cursor becomes a different cell. Found
// with a mouse wheel rather than by a gate, measured at 120px -- six cells --
// and adjudicated a regression, since Chromium re-runs hit-testing after a
// transform commits and the cache did not.
//
// Every route below is one camera move with a stationary pointer. They are
// separate tests rather than one loop because they enter Grid by three
// different doors -- a wheel event, a pointer drag, and a keyboard reveal-pan --
// and only the shared exit is meant to be common.
async function expectHighlightAgreesWithPointerAt(
  page: import('@playwright/test').Page,
  at: { x: number; y: number },
  rulerBefore: { x: number; y: number },
) {
  // THE ANTI-VACUITY ANCHOR. Every assertion below is trivially true if the
  // camera never moved -- a stationary camera cannot desynchronise anything --
  // so the camera is shown to have travelled at least a cell first, read off the
  // ruler rather than off any internal. Measured travel is 6.5 cells for the
  // wheel, 13 by 9 for the coarse drag and 9 for the arrows, which is the
  // distance a stale resolver would have been wrong by.
  const rulerAfter = await originRulerPx(page)
  const travelled = Math.hypot(rulerAfter.x - rulerBefore.x, rulerAfter.y - rulerBefore.y)
  expect(travelled, 'the camera did not move, so this proves nothing').toBeGreaterThan(DEFAULT_CELL_SIZE_PX)

  const highlighted = await hoverIndicatorBox(page)
  expect(highlighted, 'nothing is highlighted, so there is no agreement to check').not.toBeNull()

  // The user-visible half: the highlight is drawn under the pointer, not
  // somewhere the pointer used to be.
  expect(at.x).toBeGreaterThanOrEqual(highlighted!.x)
  expect(at.y).toBeGreaterThanOrEqual(highlighted!.y)

  // The agreement half: it is the very cell a click resolves. Read back off the
  // one cell that came alive rather than computed, so nothing here reconstructs
  // what it is checking.
  await clickGridAt(page, at)
  const label = await page.locator(ALIVE_CELL_SELECTOR).getAttribute('aria-label')
  const [, cx, cy] = /Cell (-?\d+), (-?\d+)/.exec(label ?? '')!
  const clicked = await cellScreenPosition(page, Number(cx), Number(cy))
  expect(highlighted!.x).toBeCloseTo(clicked.x, 1)
  expect(highlighted!.y).toBeCloseTo(clicked.y, 1)
}

test('a wheel-pan under a stationary pointer leaves the highlight on the cell a click resolves', async ({ page }) => {
  const at = { x: CENTER.x + 200, y: CENTER.y + 100 }
  await hoverGridAt(page, at)
  const rulerBefore = await originRulerPx(page)
  await page.mouse.wheel(0, 130)

  await expectHighlightAgreesWithPointerAt(page, at, rulerBefore)
})

// THE COARSE DRAG, AND THE GRANULARITY IS THE WHOLE TEST. A stepped drag
// delivers many small pointermoves, each re-resolving against a camera that has
// barely moved, so a stale resolver lands within the same cell and the case
// passes BY LUCK -- measured at 1 / 8 / 40 pointermoves as errors of the whole
// drag / one cell / exact. Delivering the entire distance in ONE pointermove is
// what makes the error a whole drag rather than a rounding difference, so this
// test states the invariant at the granularity that can actually see it. Do not
// "stabilise" it by adding steps.
test('a coarse one-move drag-pan leaves the highlight on the cell a click resolves', async ({ page }) => {
  const from = { x: CENTER.x + 200, y: CENTER.y + 100 }
  const to = { x: from.x + 260, y: from.y + 180 }

  await hoverGridAt(page, from)
  const rulerBefore = await originRulerPx(page)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y) // one pointermove, no `steps`
  await page.mouse.up()

  await expectHighlightAgreesWithPointerAt(page, to, rulerBefore)
})

// The keyboard reveal-pan: arrowing the focus cursor past the edge of the view
// scrolls the grid under a pointer that never moved. Covered compositionally by
// the wheel case -- the effect that re-resolves is keyed on the camera and does
// not branch on what moved it -- but this is the one route no test had ever
// driven end to end, and a composition argument is exactly the kind of claim
// this slice kept finding to be true for the wrong reason.
test('an arrow-key reveal-pan leaves the highlight on the cell a click resolves', async ({ page }) => {
  const at = { x: CENTER.x - 120, y: CENTER.y - 60 }
  await hoverGridAt(page, at)
  const rulerBefore = await originRulerPx(page)

  await page.locator('#grid-content button[tabindex="0"]').focus()
  for (let press = 0; press < 40; press++) await page.keyboard.press('ArrowRight')

  await expectHighlightAgreesWithPointerAt(page, at, rulerBefore)
})
