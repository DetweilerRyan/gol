import { test, expect } from '@playwright/test'
import { clickGridAt, expectCellState } from './e2e-helpers'

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
// never in its scope. (That second file is gone: all three of its tests turned
// out to be statable after all, and `convert-modal-inertness-to-scenarios`
// restated them as while-the-pattern-library-is-open.feature. This file is now
// the only unpaired spec, which makes the drift below its alone to avoid.) The
// header this replaces licensed its tests as
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
// when the audit started and two are now.
//
// SEVEN CLAIMS LEFT THIS FILE, and none was dropped -- each is now stated in
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
//   - The armed pattern's preview MOVING WITH THE AIM rather than staying
//     where it was first shown is pattern-library.feature's "Aiming at a
//     different cell moves the preview there rather than leaving it behind",
//     written by `preview-follows-pointer-may-be-statable`. This one left the
//     file last and is the only claim here that was ever converted rather than
//     found already stated: it read as pixel geometry -- two measured bounding
//     boxes at two pointer positions -- until someone asked what the boxes were
//     standing in for, and the answer was a set of world coordinates the
//     preview announces for itself. Making movePreviewTo LATCH, so it ignores a
//     move once a preview is up, reds 2 of 128 in the whole Playwright run: the
//     scenario at its retrying anchor (`Pattern preview cell 12, 12` resolved
//     to 0 elements over 14 retries) and the test this file no longer has, at
//     its first not.toBe (`Expected: not 720`). Nothing else in the suite aims
//     twice, which that run confirms rather than assumes. Measured by
//     `architect` on the slice tip -- `product` cannot take it, the probe being
//     an edit to src/, the same routing the cancel-branch figure above records.
//
// THE LESSON THAT GENERALISES PAST THIS FILE, since it is what shrank the list
// twice: "no scenario may name a pixel" is a rule about the ASSERTION, not
// about the claim underneath it. Ask what a measured box is a proxy for before
// filing a test as category 3. Two boxes differing is a proxy for "the preview
// is somewhere else now", and "somewhere" was nameable all along. What did NOT
// convert -- the panel within 30px of the corner, the grid reaching the
// viewport edge -- is where the pixel IS the claim, with nothing behind it to
// name. That is the question to put to the next candidate.
//
// WHAT REMAINS, and the claim each test uniquely holds -- stated per test
// below as well, since a file-level list is not what licenses a test to exist,
// which is the whole lesson above.
//
// RE-AUDITED AGAIN by `preview-follows-pointer-may-be-statable`, which was
// asked to find out whether this file can empty. The answer is no, and the
// three tests come out of it differently, so read each one's own note:
//
//   1. The viewport-fill test STAYS, and the reason is sharper than "it is
//      pixel geometry". Its Then would have to name the corner cell, and the
//      corner cell IS the camera's own offset -- (-32, 20) is arithmetically
//      DEFAULT_OFFSET_X and a function of the viewport height, which
//      .gherkin-lintrc bans from the contract as `\boffset ?[xy]\b`. A
//      clause naming it would pass the linter while laundering the exact
//      quantity the linter exists to keep out, and it would be FALSE at any
//      other viewport while the product was right. See the test's own note for
//      why the coordinate-free form is worse rather than better.
//   2. The HUD panel test STAYS, but its licence is NARROWER than the note
//      under it used to claim -- corrected in place. Only the measured box is
//      uniquely held; all three content assertions are held elsewhere, and the
//      note now says where. Restating them in Gherkin would manufacture the
//      duplication `triage-paired-specs` deletes, and would not retire the
//      test anyway, because the box would remain.
//   3. The preview test CONVERTED AND IS GONE, deleted by `architect` in the
//      same slice once the probe `product` could not take came back matching
//      its predicted signature exactly -- 2 failed of 128, at the two clauses
//      predicted, with no third failure and none missing. Its claim is the
//      seventh bullet above; the standing order was restate, probe, then
//      delete, and all three steps are now taken.

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
  // WHY THIS IS NOT A SCENARIO, measured rather than asserted. Any Then that
  // names the corner cell names the camera: solve worldToScreen for screen
  // x = 0 and the answer is x = offsetX, so the -32 below is arithmetically
  // DEFAULT_OFFSET_X, and the 20 is the same function of the viewport height
  // and offsetY. .gherkin-lintrc bans `\boffset ?[xy]\b` from the contract;
  // a clause naming these two would pass that linter and carry the banned
  // quantity through anyway, spelled as a coordinate. It would also be FALSE
  // at any viewport other than playwright.config.ts's 1280x900 while the
  // product was entirely correct, which is the test for whether a clause is
  // contract or harness geometry.
  //
  // THE COORDINATE-FREE FORM IS WORSE, NOT BETTER, and it is the obvious next
  // idea so it is written down. "When I toggle the cell in the corner of the
  // window / Then that cell should be alive" states no pixel -- but the step
  // still computes the cell from the same two constants, so the geometry has
  // moved out of sight rather than out of the claim, and what is left on the
  // page reads as a restatement of cell-life-and-death.feature's central
  // scenario. A reader cannot see what makes it different, which is how a
  // load-bearing test gets deleted as a duplicate by the next audit.
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

// CATEGORY 3, AND ONLY IN ITS LAST TWO LINES. The claim only this test holds
// is the measured box: the panel drawn within 30px of the viewport's top-left
// corner. There is no scenario about where a control sits on screen at any
// altitude the contract permits, and "within 30px" is not a thing a
// stakeholder-readable clause can say.
//
// THE THREE CONTENT ASSERTIONS ARE NOT UNIQUELY HELD, and this note claimed
// they were until `preview-follows-pointer-may-be-statable` checked. Each is
// already guarded, so none of them licenses this test and none of them is
// worth restating in Gherkin -- doing so would manufacture exactly the
// duplication `triage-paired-specs` deletes:
//
//   - the heading, by role and name, in src/components/GenerationHud.test.tsx.
//   - the button's accessible name, by every bdd scenario that presses it:
//     features/screenplay/elements.ts's nextGenerationControl reaches it as
//     getByRole('button', { name: 'Next Generation' }), so a renamed control
//     reds the generation-control and cell-life-and-death scenarios outright.
//   - the counter's format AND its boot value, by generation-control.feature's
//     "the game should still be on its first generation" -- questions.ts's
//     generationCount parses "Generation: " out of that same text, so a
//     reworded counter yields NaN there.
//
// THEY STAY ANYWAY, AS THE ANCHOR RATHER THAN AS THE CLAIM. The box below is
// read off the heading's parent, so the heading has to be resolved before
// there is a box to measure; boundingBox() on an unresolved locator returns
// null and the non-null assertions would throw somewhere less legible. Same
// distinction the new preview step draws between its anchor and its
// assertions -- keep them, and do not read them as what this test is for.
test('the HUD panel renders the title, next-generation button, and generation counter, top-left', async ({ page }) => {
  await expect(page.getByRole('heading', { name: "Conway's Game of Life" })).toBeVisible()
  await expect(page.locator('#next-generation-button')).toHaveText('Next Generation')
  await expect(page.getByText(/^Generation: \d+$/)).toHaveText('Generation: 0')

  const panelBox = await page.getByRole('heading', { name: "Conway's Game of Life" }).locator('..').boundingBox()
  expect(panelBox!.x).toBeLessThan(30)
  expect(panelBox!.y).toBeLessThan(30)
})
