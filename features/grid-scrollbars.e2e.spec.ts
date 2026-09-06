import { test, expect, type Page } from '@playwright/test'
import {
  CENTER,
  clickCell,
  dragPan,
  elementAtPoint,
  thumbPositionPercent,
  toggleFarCell,
  visibleProportionPercent,
  type ScrollbarOrientation,
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

// ---------------------------------------------------------------------------
// A TEST LEFT THIS FILE BY CONVERSION, NOT BY SUBSUMPTION. "dragging a
// scrollbar thumb never toggles whatever cell happens to be positioned
// underneath it" asserted that no cell was alive after two thumb drags, and
// its own note had already reported the claim as sayable at domain altitude
// and as `architect`'s to rule on. It ruled, in
// `rule-on-chrome-propagation-guards`: the claim is contract-eligible, and it
// is now the "And no cell should be alive" clause on
// grid-scrollbars.feature's "Dragging the vertical scrollbar thumb down
// reveals content further down" -- folded into that scenario rather than
// given its own, since a dedicated one would repeat its Given, When and first
// Then word for word.
//
// TWO MEASURED FACTS ABOUT WHAT LEFT, so nobody re-derives them from the
// title. First, the test was near-unreachable: the thumb takes pointer
// capture and a 50px drag resolves as a PAN rather than a tap, so it stayed
// green under the layering fault on its own and went red only in conjunction
// with a raised drag threshold. Second, the mechanism its own comment
// described -- a track that stopped propagation on pointerdown but not on
// pointerup -- is not current code and has not been for some time: there is
// no stopPropagation anywhere in src/ at all, and the only two mentions of
// the word are comments saying it is not needed. That story is recorded in
// the commit that removed the test and deliberately does not appear in the
// contract, which states the promise and not the bug it once guarded.
// ---------------------------------------------------------------------------

// THE LAST RENDERED-THUMB-LENGTH CHECK IN THE REPO, and the reason this one
// test survived the `triage-paired-specs` cut while seven siblings around it
// did not. grid-scrollbars.feature makes the same claim, but since
// `scrollbar-visible-proportion-affordance` its steps read an ANNOUNCED
// INTEGER (aria-describedby's visible-proportion text) and measure no box at
// all -- so nothing else anywhere asks whether the number the app announces
// matches the pixels it actually paints. Deleting this leaves the whole
// affordance free to drift away from the thumb it describes.
//
// (c) WHAT WOULD MAKE THAT CHANNEL CARRY IT: a step measuring a rendered thumb
// box again, which is what those steps did before
// `scrollbar-visible-proportion-affordance` moved them onto the announced
// integer. Should one ever go back, the announced-versus-painted comparison
// exists in the contract and this test is redundant. Read the step module, not
// the feature file, to check -- the Gherkin clause reads the same either way,
// which is precisely how this went unnoticed once already.
test('content wider than the viewport shrinks only the horizontal thumb', async ({ page }) => {
  await toggleFarCell(page, 199, 0)
  await clickCell(page, 0, 0)

  // contentBounds {minX:0,maxX:200,minY:0,maxY:1} -> extentWidth=4640,
  // thumbRatio = 1280/4640 ~= 0.276. The thumb is drawn against the TRACK,
  // which the containment test below measures at 1280 - 10 = 1270 (the
  // vertical bar's own thickness, inset by `right-2.5`): 0.276 x 1270 ~= 350px,
  // at the track's left edge (thumbOffsetRatio=0). Windowed at 330..380 rather
  // than pinned, so it holds across the 353.09 -> 350.34 shift the track-length
  // correction makes -- the window is here to catch a thumb of the wrong ORDER,
  // not to re-assert the arithmetic scrollbars.ts's own tests already pin.
  const hBox = (await horizontalThumb(page).boundingBox())!
  expect(hBox.width).toBeGreaterThan(330)
  expect(hBox.width).toBeLessThan(380)
  expect(hBox.x).toBeLessThan(5)

  // The vertical axis is unconstrained by this content, so its thumb still
  // fills its track. The track is 890 tall (900 less the horizontal bar's own
  // thickness, inset by `bottom-2.5`), so the literal below is deliberately
  // NOT the track length -- 900 * 0.95 = 855 is a floor both the pre- and
  // post-correction heights (900, then 890) clear, and changing it flips no
  // outcome. Containment is the other test's job, not this one's.
  const vBox = (await verticalThumb(page).boundingBox())!
  expect(vBox.height).toBeGreaterThan(900 * 0.95)
})

// THE SOLE CHANNEL. Nothing else anywhere can see a thumb painted past the end
// of its track, and that blindness was MEASURED rather than inferred: all 73
// e2e tests passed both BEFORE and AFTER a change that moves every rendered
// thumb by 10px. The whole generated bdd layer is invariant under the defect
// AND under its correction, because every scrollbar clause reads aria-valuenow
// or the announced visible proportion, and both of those derive from
// computeScrollbarMetrics -- which never sees trackLengthPx at all. jsdom is
// blind for a different reason: with no stylesheet and no layout,
// Scrollbar.test.tsx pins the subtraction arithmetic but never the Tailwind
// inset that makes the subtraction necessary. (That jsdom is the live `dom`
// vitest project, not the deleted features/ one -- this argument is about a
// layer that still exists.) ARITHMETIC MEETING PAINT IS OBSERVABLE ONLY IN A
// REAL BROWSER, which is what this test is for.
//
// (c) WHAT WOULD MAKE THAT BLINDNESS FALSE: computeScrollbarMetrics taking the
// track length as an input, so the announced value derives from the same
// quantity the paint does. Then a clause reading aria-valuenow or the
// announced proportion could see an overflow and this test would be a second
// phrasing of it. As long as those two announcements are computed without ever
// seeing trackLengthPx, nothing else in the repo can fail on this defect.
//
// It is the reinstatement the KNOWING LOSS comment deleted from above this
// predicted -- "if that overflow is ever worth guarding again, it belongs here,
// next to this measurement" -- and it is deliberately WIDER than the assertion
// that was lost. `hBox.x + hBox.width > 1275` was only accidentally true: an
// overflowing thumb satisfies a greater-than test HARDER than a correct one, so
// it ran the wrong way for the defect that actually exists. This runs the right
// way, on both axes, at rest as well as panned.
//
// AT REST IS THE SURPRISE, and the reason this test does not open with a pan:
// the defect needs no content and no gesture. `goto('/')` alone paints a 1280px
// horizontal thumb in a 1270px track and a 900px vertical thumb in an 890px
// one. The far pan is kept as the second sample only because it is the
// territory the deleted far-pan test used to occupy.
//
// PIXELS ONLY. No visibleProportionPercent, no thumbPositionPercent, not even
// as a settle-wait after the drag: an announced value CANNOT falsify this
// claim, and quoting one here would make the test look like it had two
// channels when it has exactly one.
//
// THE PARENT-AXIS TRAVERSAL IS DELIBERATE AND STAYS IN THIS FILE. The track div
// carries no role, no accessible name and no test id, so `thumb.locator('..')`
// is the only way to reach it. Keeping the helper local rather than promoting
// it to features/e2e-helpers.ts is what keeps it scoped to this one check --
// exported, it would be a traversal every spec could reach for.
// The only other parent-axis traversal in the repo is
// hud-layout-and-shortcuts.e2e.spec.ts's "the HUD panel renders the title,
// next-generation button, and generation counter, top-left", on its own
// separate justification. Cited by test name rather than by line number: this
// note said ":72" until `correct-hand-written-spec-headers` found nothing of
// the sort there, that file having been cut to two tests since. A line number
// is the most rot-prone citation form there is, and it rots silently.
//
// TOLERANCE 0.5px, sitting between two MEASURED figures: the defect is 10px,
// and the tightest correct margin is a trailing edge of 1269.9972 against a
// track ending at 1270 -- 0.003px of float noise. So 0.5 is 20x BELOW the
// defect it must catch and ~160x ABOVE the noise it must not trip on. Anything
// wide enough to admit the 1.0079 track fraction this defect produces would be
// the un-falsifiable shape this whole slice exists to remove.
const TRACK_OVERFLOW_TOLERANCE_PX = 0.5

// expect.soft, so ONE red run records all four sample points. Under hard
// assertions the run stops at the horizontal-at-rest failure and the vertical
// figures never appear in any output at all -- and those measurements are the
// deliverable of a deliberately-red commit. Post-fix it behaves identically.
async function expectThumbInsideTrack(page: Page, orientation: ScrollbarOrientation, moment: string) {
  const thumb = orientation === 'horizontal' ? horizontalThumb(page) : verticalThumb(page)
  const thumbBox = (await thumb.boundingBox())!
  const trackBox = (await thumb.locator('..').boundingBox())!

  const [thumbStart, thumbLength, trackStart, trackLength] =
    orientation === 'horizontal'
      ? [thumbBox.x, thumbBox.width, trackBox.x, trackBox.width]
      : [thumbBox.y, thumbBox.height, trackBox.y, trackBox.height]

  expect
    .soft(thumbStart + thumbLength, `${orientation} thumb trailing edge, ${moment}`)
    .toBeLessThanOrEqual(trackStart + trackLength + TRACK_OVERFLOW_TOLERANCE_PX)
  expect
    .soft(thumbStart, `${orientation} thumb leading edge, ${moment}`)
    .toBeGreaterThanOrEqual(trackStart - TRACK_OVERFLOW_TOLERANCE_PX)
}

test('the rendered thumb stays inside its own track on both axes, at rest and panned far past all content', async ({
  page,
}) => {
  await expectThumbInsideTrack(page, 'horizontal', 'at rest')
  await expectThumbInsideTrack(page, 'vertical', 'at rest')

  await clickCell(page, 0, 0)
  // The same far pan the position-and-proportion test below uses:
  // offsetX' = -32 + 582 = 550, far right of the single live cell, which puts
  // the horizontal thumb hard against the end of its track.
  await dragPan(page, CENTER.x, CENTER.y, -11640, 0, 50)

  await expectThumbInsideTrack(page, 'horizontal', 'panned far past all content')
  await expectThumbInsideTrack(page, 'vertical', 'panned far past all content')
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
// run in jsdom -- the live `dom` vitest project, not the deleted features/ one
// -- whose accessible-name/description support is a reimplementation rather
// than the browser's own, which is exactly why the design was ruled on in a
// real browser in the first place.
//
// (c) WHAT WOULD MAKE THAT CHANNEL CARRY IT: questions.ts's
// visibleProportionPercent reading toHaveAccessibleDescription instead of
// resolving aria-describedby and fetching the node's text by hand. That one
// change moves the contract onto the browser's own computation and makes both
// description reads below redundant -- though not the accessible-NAME halves,
// which are a separate claim about what the description must NOT be folded
// into.
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
// view. This reads them at a moment when they are different NUMBERS -- panned
// far past all content, the thumb is at the very end of its track (position
// 100) while only a sliver of the grid is in view.
//
// (a) BUT THE APARTNESS IS NOT WHAT THIS TEST UNIQUELY HOLDS, and this note
//     claimed it was until `correct-hand-written-spec-headers` checked.
//     grid-scrollbars.feature's "Panning far past all content still leaves the
//     thumb inside its track" already asserts both quantities in one scenario
//     at that same moment -- "should sit at the end of its track" reads
//     aria-valuenow, "should be shorter than its track" reads the announced
//     proportion -- so a design collapsing the two reds there too. What is left
//     to this test is the last two lines: that a BROWSER computes that number
//     as the thumb's accessible DESCRIPTION, and that computing it leaves the
//     accessible NAME alone.
//
// (b) THE CHANNEL THAT DOES NOT CARRY IT: the contract reaches the proportion
//     by resolving aria-describedby by hand and reading the referenced node's
//     text, which proves the markup is present and proves nothing about what
//     accdescription delivers -- and it never reads the name here at all, so
//     folding the visually-hidden span into the name would leave that scenario
//     green.
//
// (c) WHAT WOULD MAKE (b) FALSE: visibleProportionPercent moving onto
//     toHaveAccessibleDescription, plus any clause asserting the name is
//     unchanged. Both halves have to move before this test is redundant.
test('position and proportion are announced as separate quantities on the same thumb', async ({ page }) => {
  await clickCell(page, 0, 0)
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
//
// (b) THE CHANNEL THAT DOES NOT CARRY IT: nothing the app announces says which
// of two overlapping elements a pointer reaches. Every drag clause in
// grid-scrollbars.feature goes through interactions.ts's dragScrollbarThumb,
// which measures the thumb's box and aims page.mouse at its geometric CENTRE --
// and the span is a 1x1 rect at the thumb's top-left CORNER, which that centre
// never touches. So the span could own the corner outright and every one of
// those scenarios would still pass. Which element occupies a given point is the
// claim itself here, with nothing behind it to name.
//
// (c) WHAT WOULD MAKE (b) FALSE: the description moving out of the thumb's own
// box -- rendered as a sibling, or through an attribute rather than a child
// element -- at which point there is no overlap left to arbitrate and this
// test asserts nothing. Re-check it if Scrollbar.tsx stops rendering the span
// inside the thumb.
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
