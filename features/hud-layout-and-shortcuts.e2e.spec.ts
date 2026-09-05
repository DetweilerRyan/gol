import { test, expect } from '@playwright/test'
import {
  blurFocus,
  CENTER,
  clickCell,
  clickGridAt,
  expectCellState,
  patternLibraryModal,
  patternsButton,
  previewCells,
  selectPattern,
} from './e2e-helpers'

// No matching .feature file, and since `re-audit-hand-written-e2e-residue`
// that is a narrower statement than it used to be. What is left here is
// residue in the four established senses (see CLAUDE.md's black-box e2e
// section): hit-testing and stacking, the computed accessibility tree,
// rendered pixel geometry, and native-event delivery.
//
// WHY THIS FILE NEEDED RE-AUDITING AT ALL, recorded because the same drift can
// recur. `triage-paired-specs` cut the hand-written layer to residue only, but
// it worked file by file through the specs that SHARE A NAME with a .feature
// -- so this file and modal-inertness.e2e.spec.ts, the two unpaired ones, were
// never in its scope. The header this replaces licensed its tests as
// "DOM/layout/App-wiring concerns with no pure-logic layer to specify in
// Gherkin", which was true when the Gherkin layer ran in vitest against pure
// modules and stopped being true the day playwright-bdd landed: a step module
// now drives this same app in this same browser through these same screenplay
// helpers, so "App wiring" is precisely what the generated layer does. App
// wiring is not one of the four categories and never was.
//
// FOUR CLAIMS LEFT THIS FILE IN THAT AUDIT, and none was dropped -- each is
// now stated in features/**, which is the standing condition on deleting a
// test here:
//
// Each figure below is a WHOLE-SUITE run on the LANDED tree -- one probe
// applied at a time to an otherwise clean src/, reverted after. A count taken
// under a --grep is a count of the subset, which is how the first draft of
// this list under-reported one of them and over-reported another.
//
//   - The Next Generation button advancing the real app's state is
//     cell-life-and-death.feature's blinker scenarios. Its "the next
//     generation is computed" step clicks this very button and asserts the
//     counter moved. No-oping the store's advance reds 7 bdd scenarios and no
//     e2e test: four neighbour-count rows, both blinkers, and infinite-grid's
//     far-from-the-origin blinker.
//   - Stamping a pattern from the library bringing its cells to life is
//     pattern-library.feature's "Placing a pattern anchors its top-left corner
//     at the target cell". No-oping the store's place reds 6 bdd scenarios and
//     no e2e test.
//   - Stamping being single-shot is pattern-library.feature's "A stamped
//     pattern is used up, so the next click toggles a single cell", written by
//     that audit. Removing stampArmedPattern's disarm reds EXACTLY ONE test in
//     the whole suite -- that scenario. Which is the point: before it was
//     written, the one thing that caught this was the hand-written test this
//     file no longer has.
//   - Enter on a focused cell toggling it WITHOUT advancing the generation is
//     keyboard-grid-navigation.feature's "Pressing Enter brings the focused
//     cell to life", whose second Then was written by that audit. Reinstating
//     a global Enter listener in GenerationHud reds 3 tests: that new clause
//     and the two Enter tests still in this file.
//
// WHAT REMAINS, and the claim each test uniquely holds -- stated per test
// below as well, since a file-level list is not what licenses a test to exist.
// Two of them (the two Enter tests) are the honest residual of that audit
// rather than clean category members: they are negative and positive claims
// about which listener answers a keystroke, they ARE expressible as scenarios,
// and they survive only because nothing else in the repo reds when the
// behaviour they name breaks. See this slice's handoff, which proposes them as
// scenarios for `architect` to rule on.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the grid fills the entire viewport, edge to edge', async ({ page }) => {
  // Points just inside the viewport edges but clear of the HUD panel
  // (top-left), zoom toolbar (top-right), and the two 10px scrollbar
  // strips (bottom edge, right edge) -- those are legitimate UI chrome,
  // not grid cells, so this checks the grid reaches right up to them
  // rather than leaving the old boxed-widget's margin.
  //
  // ASKED BY CLICKING, NOT BY A HIT TEST. This used to read
  // elementAtPoint(...) and match /^Cell /, which is document.elementFromPoint
  // -- a stacking question standing in for "does the grid receive input here",
  // and one that answers nothing at all once a dead cell has no element to
  // return. Clicking the pixel and naming the cell that must come alive is a
  // positive anchor: it drives the resolver the app actually uses
  // (pointer capture -> screenToWorld), it cannot pass vacuously, and it says
  // WHICH cell the corner belongs to rather than merely that some cell is
  // there. The two coordinates are worked out from the default camera, the
  // same coordinate -> pixel direction everything else in this suite uses.
  await clickGridAt(page, { x: 5, y: 850 })
  await expectCellState(page, -32, 20, 'alive')

  await clickGridAt(page, { x: 1260, y: 400 })
  await expectCellState(page, 31, -3, 'alive')
})

// CATEGORY 3, AND CATEGORY 2 IN ITS FIRST LINE. The claim only this test
// holds is that the panel is drawn where the layout says it is -- a measured
// box within 30px of the viewport's top-left corner -- and that the three
// things inside it are the title, the control and the count. The heading is
// reached BY ROLE, so what is pinned is the accessible heading a screen reader
// lands on rather than an h1 tag. No .feature states any of it: the panel's
// position is pixel geometry, and there is no scenario about where a control
// sits on screen at any altitude the contract permits.
test('the HUD panel renders the title, next-generation button, and generation counter, top-left', async ({ page }) => {
  await expect(page.getByRole('heading', { name: "Conway's Game of Life" })).toBeVisible()
  await expect(page.locator('#next-generation-button')).toHaveText('Next Generation')
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')

  const panelBox = await page.getByRole('heading', { name: "Conway's Game of Life" }).locator('..').boundingBox()
  expect(panelBox!.x).toBeLessThan(30)
  expect(panelBox!.y).toBeLessThan(30)
})

// THE NEGATIVE HALF OF THE ENTER-ROUTING CONTRACT, IN THE STATE NO SCENARIO
// SETS UP. keyboard-grid-navigation.feature now states that Enter on a focused
// CELL does not advance the game, so a listener that answers Enter everywhere
// is caught there. This test is the other state: nothing focused at all, which
// no .feature establishes today and which a defect could single out -- a
// listener guarded on "no cell has focus" reds here and passes every scenario.
//
// IT IS EXPRESSIBLE AS A SCENARIO and is kept only because nothing else reds
// when its behaviour breaks. Measured at this slice's audit over the whole
// suite by reinstating a global Enter listener in GenerationHud: exactly three
// tests red -- this one, the test below, and the new clause in
// keyboard-grid-navigation.feature, with nothing else. The scenario it
// wants -- a Given for "nothing has keyboard focus" -- is proposed in that
// audit's handoff rather than written here, because it is an altitude call
// about contract vocabulary and not one to take while deleting things.
test('Enter does not advance the generation when nothing is focused', async ({ page }) => {
  await clickCell(page, -1, 0)
  await clickCell(page, 0, 0)
  await clickCell(page, 1, 0)
  await blurFocus(page)

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')
})

// THE POSITIVE HALF, AND THE DOUBLE-FIRE CLAUSE IS WHAT MAKES IT ITS OWN
// TEST. That Enter on the focused control advances the game is native button
// activation; that it advances EXACTLY ONCE is the claim, and it is what a
// second listener stacked on top of the button's own would break -- reading 3
// where the contract says 2. No .feature states it, and it is expressible as
// one; kept on the same measured basis as the test above, and proposed as a
// scenario in the same handoff.
test('Enter on the focused Next Generation button advances exactly once and does not double-fire', async ({ page }) => {
  await clickCell(page, -1, 0)
  await clickCell(page, 0, 0)
  await clickCell(page, 1, 0)

  await page.locator('#next-generation-button').click()
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 1')
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('next-generation-button')

  await page.keyboard.press('Enter')

  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 2')
})

// TWO CLAIMS, ONE OF THEM CATEGORY 3 AND UNREACHABLE FROM THE CONTRACT: the
// preview MOVES WITH THE POINTER, asserted as two measured boxes at two
// pointer positions, which is rendered pixel geometry no scenario may name.
// The other -- that the Patterns button cancels a placement rather than
// reopening the library -- is expressible, and features/steps/pattern-library.ts
// designates this test its sole coverage in the comment on "I have armed the
// {string} pattern instead", which drives that same press for a different
// purpose and says at length that it does NOT hold this claim. Read those two
// comments together before touching either.
test('clicking Patterns again while a pattern is armed cancels placement instead of reopening the library', async ({
  page,
}) => {
  await selectPattern(page, 'Glider')

  // Move the pointer over the grid so a preview follows it (Grid's
  // trackHover guard only computes/calls onHover once a pattern is armed).
  await page.mouse.move(CENTER.x + 60, CENTER.y + 60)
  const preview = previewCells(page)
  await expect(preview.first()).toBeVisible()
  await expect(preview).toHaveCount(5) // Glider has 5 live cells
  const boxAtFirstPosition = (await preview.first().boundingBox())!

  await page.mouse.move(CENTER.x + 120, CENTER.y + 120)
  const boxAtSecondPosition = (await preview.first().boundingBox())!
  expect(boxAtSecondPosition.x).not.toBe(boxAtFirstPosition.x)
  expect(boxAtSecondPosition.y).not.toBe(boxAtFirstPosition.y)

  await patternsButton(page).click()

  // toggleLibrary's rule: while a pattern is armed, Patterns disarms rather
  // than reopening the modal (there's no browsing case to reach here at all).
  await expect(patternLibraryModal(page)).toHaveCount(0)
  await expect(preview).toHaveCount(0)

  // Moving again must not resurrect a preview -- the pattern was genuinely
  // disarmed by cancelPlacing, not merely hidden.
  await page.mouse.move(CENTER.x - 60, CENTER.y - 60)
  await expect(preview).toHaveCount(0)

  await clickCell(page, -3, -3)

  await expectCellState(page, -3, -3, 'alive')
  await expectCellState(page, -2, -3, 'dead')
  await expectCellState(page, -3, -2, 'dead')
  await expectCellState(page, -2, -2, 'dead')
})
