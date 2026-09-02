import { test, expect } from '@playwright/test'
import {
  clickGridAt,
  DEFAULT_CELL_SIZE_PX,
  defaultViewCellCenterPx,
  expectCellState,
  hoverGridAt,
  hoverIndicatorBox,
  cellScreenPosition,
  resetView,
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

async function zoomTo(page: import('@playwright/test').Page, percent: number) {
  const step = percent > 100 ? zoomIn : zoomOut
  for (let click = 0; click < 8; click++) {
    if ((await zoomPercent(page)) === percent) return
    await step(page)
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
