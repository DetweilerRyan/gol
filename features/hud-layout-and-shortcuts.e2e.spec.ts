import { test, expect } from '@playwright/test'
import { CENTER, clickGridAt, expectCellState, previewCells, selectPattern } from './e2e-helpers'

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
// THE GENERAL FORM OF THAT DRIFT, which is worth more than this file's own
// history: the licence was a FILE-LEVEL header, written once and true once,
// and it went on licensing tests long after the thing that made it true had
// been replaced. A test is licensed by its CLAIM'S CHANNEL, never by a header
// -- so audit by claim, not by pairing and not by file. Nine tests were here
// when the audit started and three are now.
//
// SIX CLAIMS LEFT THIS FILE, and none was dropped -- each is now stated in
// features/**, which is the standing condition on deleting a test here. Every
// figure below is a WHOLE-SUITE run with one probe applied at a time to an
// otherwise clean src/, reverted after. A count taken under a --grep is a
// count of the subset, which is how the first draft of this list
// under-reported one of them and over-reported another.
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
//     cell to life", whose second Then was written by that audit.
//   - Enter reaching NOTHING while the keyboard is on nothing, and Enter on
//     the focused control advancing the game EXACTLY ONCE, are
//     generation-control.feature's two scenarios. Those two were the audit's
//     honest residual for one commit -- kept only because nothing else redded
//     when they broke -- and `architect` then ruled them contract rather than
//     residue: no global Enter shortcut is a stated product decision, and a
//     decision whose only guard is a hand-written spec is a contract gap.
//     Reinstating a global Enter listener in GenerationHud reds 5 tests, of
//     which those two scenarios and the clause above are the three that remain.
//   - The Patterns control cancelling an armed pattern rather than reopening
//     the library is pattern-library.feature's PAIR of cancel scenarios,
//     "Clicking Patterns while a pattern is armed does not reopen the library"
//     and "Cancelling with the Patterns control leaves the next click a plain
//     single-cell toggle". Removing toggleLibrary's cancel-from-placing branch
//     reds 3 tests IN THE PLAYWRIGHT RUN: the first scenario at its library
//     clause, the second at its alive clause, and "Arming a second pattern
//     replaces the first" at the guard features/steps/pattern-library.ts keeps
//     for exactly that localization. Measured by `architect` on this shape --
//     `product` cannot take it, the probe being an edit to src/ -- and
//     re-measured by `hardener` on the slice tip, which is the only tree the
//     figure is claimed about: 3 failed of 127, at those three clauses, the
//     third landing on pattern-library.ts's guard rather than on any Then.
//
//     THE COUNTING UNIVERSE IS NAMED BECAUSE THIS FIGURE HAS GONE STALE TWICE
//     INSIDE ONE SLICE. It read 3 against the tree it was written on, fell to
//     2 when the hand-written cancel test was deleted without re-measuring,
//     and is 3 again only because the scenario pair replaced the single
//     scenario in the same commit that states it. Vitest is deliberately
//     outside the count -- src/components/LifeBoard.test.tsx covers this path
//     too, so an unnamed universe is what let the figure drift.
//
// WHAT REMAINS, and the claim each test uniquely holds -- stated per test
// below as well, since a file-level list is not what licenses a test to exist,
// which is the whole lesson above. All three are clean category members now:
// two rendered-pixel-geometry claims and one that is geometry plus a computed
// accessible name. The honest residual is gone.

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

// CATEGORY 3, AND NOW ONLY CATEGORY 3. The claim is that the armed pattern's
// preview MOVES WITH THE POINTER, asserted as two measured boxes at two pointer
// positions -- rendered pixel geometry, which no scenario may name.
//
// THE CANCEL HALF THIS TEST USED TO CARRY IS GONE, restated as
// pattern-library.feature's PAIR of cancel scenarios -- "Clicking Patterns
// while a pattern is armed does not reopen the library" and "Cancelling with
// the Patterns control leaves the next click a plain single-cell toggle". It
// was never residue: that the Patterns control disarms rather than reopening
// is a stated product rule (src/patternPlacement.ts's toggleLibrary), and a
// rule is contract. The comment in features/steps/pattern-library.ts that used
// to designate this test the sole holder of that claim was repointed in the
// same commit that wrote the scenario, and repointed again at the pair.
//
// AN OPEN QUESTION THIS PASS DID NOT ACT ON, filed in the handoff rather than
// resolved here. Preview cells announce their own world coordinates -- that is
// how features/steps/pattern-library.ts reads all eight pattern shapes -- so
// "the preview follows the pointer" may well be statable through the accessible
// tree as a scenario about which cells the preview covers after the aim moves,
// which would retire this test entirely. `architect` ruled it category 3 for
// this slice; converting it is a contract question for a slice of its own, not
// a deletion to take while auditing.
test('the armed pattern preview follows the pointer across the grid', async ({ page }) => {
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
})
