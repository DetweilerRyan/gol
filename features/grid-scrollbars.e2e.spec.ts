import { test, expect, type Page } from '@playwright/test'
import {
  CENTER,
  cellLocator,
  dragPan,
  dragScrollbarThumb,
  elementAtPoint,
  thumbPositionPercent,
  toggleFarCell,
  visibleProportionPercent,
} from './e2e-helpers'
import { ALIVE_CELL_SELECTOR } from '../src/test-support/cellQuery.ts'

function horizontalThumb(page: Page) {
  return page.locator('[role="scrollbar"][aria-orientation="horizontal"]')
}
function verticalThumb(page: Page) {
  return page.locator('[role="scrollbar"][aria-orientation="vertical"]')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

// THE LAST RENDERED-THUMB-LENGTH CHECK IN THE REPO, and the reason this one
// test survived the `triage-paired-specs` cut while seven siblings around it
// did not. grid-scrollbars.feature makes the same claim, but since
// `scrollbar-visible-proportion-affordance` its steps read an ANNOUNCED
// INTEGER (aria-describedby's visible-proportion text) and measure no box at
// all -- so nothing else anywhere asks whether the number the app announces
// matches the pixels it actually paints. Deleting this leaves the whole
// affordance free to drift away from the thumb it describes.
//
// KNOWING LOSS, ratified in the same triage and recorded here because nothing
// else will say it: the far-pan test deleted alongside these was the only
// assertion that the RENDERED thumb stays inside its track
// (`hBox.x + hBox.width > 1275` at maximum offset). The generated layer's
// "should sit at the end of its track" reads aria-valuenow, an integer, and
// cannot see a thumb painted past the track's end. If that overflow is ever
// worth guarding again, it belongs here, next to this measurement.
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

test('dragging a scrollbar thumb never toggles whatever cell happens to be positioned underneath it', async ({
  page,
}) => {
  // Regression test: the scrollbar track previously only stopped
  // propagation on pointerdown, not pointerup/pointermove, so releasing a
  // drag over the track could bubble through to the grid's own
  // handlePointerUp and toggle the cell rendered underneath the thumb.
  await dragScrollbarThumb(page, 'horizontal', 50)
  await dragScrollbarThumb(page, 'vertical', 50)

  await expect(page.locator(ALIVE_CELL_SELECTOR)).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// THE VISIBLE-PROPORTION AFFORDANCE, READ OUT OF THE ACCESSIBILITY TREE.
//
// The bdd layer reads this affordance by resolving aria-describedby by hand
// (features/screenplay/questions.ts's visibleProportionPercent) -- an
// attribute-and-textContent read, which proves the markup is present but not
// that a browser's accname/accdescription computation actually delivers it as
// a DESCRIPTION. These three tests are that second half, and they are the
// only place in the repo it is checked: the RTL tests next to Scrollbar.tsx
// run in jsdom, whose accessible-name/description support is a
// reimplementation rather than the browser's own, which is exactly why the
// design was ruled on in a real browser in the first place.
//
// The wording is deliberately NOT restated here. Each test asks
// visibleProportionPercent for the number the app announces and then checks
// that the description a browser computes carries the SAME number -- two
// independent routes to one node. Writing the sentence out would make this a
// third encoding of a string that already has exactly two
// (src/test-support/scrollbarQuery.ts's builder and its parser).
test('the visible proportion is announced as a description, and the accessible name is untouched', async ({ page }) => {
  for (const [orientation, accessibleName] of [
    ['horizontal', 'Horizontal scroll'],
    ['vertical', 'Vertical scroll'],
  ] as const) {
    const thumb = orientation === 'horizontal' ? horizontalThumb(page) : verticalThumb(page)

    // Name asserted BEFORE the description is read, deliberately: reading it
    // goes through visibleProportionPercent, which throws by name when
    // aria-describedby is missing, and that throw would otherwise pre-empt the
    // name check on exactly the mutation this line exists to catch.
    // Name unchanged: identity, not state. If the visually-hidden span were
    // folded into the name -- which is what a role whose name comes from its
    // contents would do, and what aria-labelledby would do here -- this is
    // what catches it.
    await expect(thumb).toHaveAccessibleName(accessibleName)

    const percent = await visibleProportionPercent(page, orientation)
    await expect(thumb).toHaveAccessibleDescription(new RegExp(`\\b${percent}\\b`))
  }
})

// ADDITIVE, NOT SUPERSEDING. aria-valuetext was rejected for this affordance
// precisely because it supersedes aria-valuenow, and the two quantities are
// different things: where the thumb sits versus how much of the grid is in
// view. This pins them apart at a moment when they are different NUMBERS --
// panned far past all content, the thumb is at the very end of its track
// (position 100) while only a sliver of the grid is in view. A design that
// let proportion overwrite position would collapse the two and fail here.
test('position and proportion are announced as separate quantities on the same thumb', async ({ page }) => {
  await cellLocator(page, 0, 0).click()
  // Same pan as the far-pan test above: offsetX' = -32 + 582 = 550.
  await dragPan(page, CENTER.x, CENTER.y, -11640, 0, 50)

  await expect.poll(() => thumbPositionPercent(page, 'horizontal')).toBe(100)
  const percent = await visibleProportionPercent(page, 'horizontal')
  expect(percent).toBeLessThan(100)
  await expect(horizontalThumb(page)).toHaveAccessibleDescription(new RegExp(`\\b${percent}\\b`))
  await expect(horizontalThumb(page)).toHaveAccessibleName('Horizontal scroll')
})

// THE SPAN IS SPEECH ONLY, AND MUST NOT BECOME A HIT TARGET. It is a real
// child element of the thumb, so a paint or layout regression in the sr-only
// utility class (Tailwind clips it to a 1x1 rect) would put a live element at
// the thumb's own top-left corner -- where the span's static position places
// it -- and every pointer interaction with the scrollbar starts by hitting
// the thumb. elementAtPoint reports the aria-label of whatever is topmost, so
// the span winning would read back as null rather than as the scrollbar.
// Probed at the corner as well as the centre because the centre alone cannot
// see this.
test('the visually-hidden description does not become a hit target on either thumb', async ({ page }) => {
  for (const [orientation, accessibleName] of [
    ['horizontal', 'Horizontal scroll'],
    ['vertical', 'Vertical scroll'],
  ] as const) {
    const thumb = orientation === 'horizontal' ? horizontalThumb(page) : verticalThumb(page)
    const box = (await thumb.boundingBox())!

    expect(await elementAtPoint(page, box.x + box.width / 2, box.y + box.height / 2)).toBe(accessibleName)
    expect(await elementAtPoint(page, box.x + 0.5, box.y + 0.5)).toBe(accessibleName)
  }
})
