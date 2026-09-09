// Step definitions for pattern-library.feature, driving the real application
// in a real browser through Playwright-BDD.
//
// IMPORT ALLOWLIST -- playwright-bdd, @playwright/test, and ../e2e-helpers,
// checked by rules/no-domain-imports-in-bdd-steps.yml. Nothing from src/:
// this feature's Examples table is the ONLY place the exact cell geometry of
// all eight patterns is written down (the unit and property tests check
// names, categories and the anchor convention, never the shapes), so a step
// that read the shape back out of src/patternLibrary would be checking the
// table against the array it was copied from. Every shape here is read off
// the screen instead.
//
// SHARED STEPS ARE NOT REDEFINED HERE. The step registry is global across
// features/steps/, so a step text may be defined exactly once and a second
// definition is an ambiguous-step error rather than an override. This feature
// borrows five from cell-life-and-death.ts -- "an empty grid", "a live cell
// at (<x>, <y>)", "I toggle the cell at (<x>, <y>)", "the cell at (<x>, <y>)
// should be alive" and "the cell at (<x>, <y>) should be dead" -- which it
// gets by writing the same text, and by defining nothing. (It read "three"
// and named the first, second and fourth of those until this slice counted
// them; the toggle and the dead clause had been borrowed since the scenarios
// about what the NEXT click does were written.)
//
// HOW A SHAPE IS OBSERVED. Arming a pattern and moving the pointer over a
// cell paints a preview of exactly the cells a stamp would bring to life,
// each labelled with its own world coordinate and none of them clipped away
// (PatternPreview.tsx). Reading those labels and subtracting the cell under
// the pointer gives the pattern's cells relative to its own bounding-box
// top-left, which is what the Examples table states -- and it states it
// against a preview the user can see, not against a return value.
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import {
  choosePatternFromLibrary,
  clickCell,
  hoverCell,
  openGrid,
  openPatternModal,
  patternCategoryInLibrary,
  patternLibraryModal,
  patternsButton,
  previewCellAt,
  previewCellPositions,
  previewCells,
  recallText,
  rememberText,
  selectPattern,
} from '../e2e-helpers'

const { Given, When, Then } = createBdd()

// The cell the pointer rests on while a pattern's shape is read. Its own
// coordinate is subtracted back out, so it is arbitrary as far as the
// contract goes -- the origin is simply always on screen, and the largest
// pattern (Pulsar, 13x13 = 260px at the default zoom) fits comfortably in the
// 1280x900 viewport from there.
const SHAPE_ANCHOR = { x: 0, y: 0 }

// Parses a Gherkin cell list like "(1, 0), (2, 1), (0, 2)" into coordinate
// pairs. Empty is rejected rather than passed through, so a mutation that
// left nothing parseable fails loudly here rather than asserting nothing
// against an empty expectation.
function parseCellList(cellList: string): Array<[number, number]> {
  const pairs = Array.from(
    cellList.matchAll(/\((-?\d+),\s*(-?\d+)\)/g),
    (match) => [Number(match[1]), Number(match[2])] as [number, number],
  )
  // THAT REGEX IS MIRRORED, BY HAND, IN TWO PLACES, AND THIS IS THE ONLY
  // POINTER TO THEM. scripts/acceptance-mutation/tuple-list.test.ts and
  // tuple-list.property.test.ts each declare a `PAIR` constant that is a
  // byte-identical copy of it, and each says so; the tether ran one way only
  // until this comment, so an editor of the regex above had nothing telling
  // them two copies existed. Change it here and change it in both of those.
  //
  // The copies are deliberate rather than lazy. They are the ORACLE those
  // properties check the tuple-list mutator against, and an oracle has to be
  // independent of the thing under test IN THE DIRECTION THAT MATTERS: the
  // acceptance suite reads a pattern's shape through THIS regex, so mirroring
  // this file is what makes those properties say something about the contract
  // rather than about tuple-list.ts agreeing with itself. Importing across the
  // gap would defeat that, and cannot be done anyway -- parseCellList is not
  // exported, importing this module executes createBdd() registration, and it
  // would couple features/ to scripts/ in both directions.
  //
  // Nothing checks the agreement mechanically. That was ruled on rather than
  // deferred: ast-grep matches within a single file and cannot express
  // cross-file regex equality. This comment and its two counterparts are the
  // whole guard, which is the argument for keeping all three exact.
  if (pairs.length === 0) throw new Error(`"${cellList}" names no cells`)
  return pairs
}

const describeCell = ([x, y]: readonly [number, number]) => `(${x}, ${y})`

Given('the {string} pattern', async ({ page }, name: string) => {
  await openGrid(page)
  rememberText(page, 'pattern', name)
  // Left open for the category step below, which reads the library's own
  // layout; the shape step arms from this same open modal.
  await openPatternModal(page)
})

Then('it should be listed under the {string} category', async ({ page }, category: string) => {
  expect(await patternCategoryInLibrary(page, recallText(page, 'pattern'))).toBe(category)
})

// A regular expression rather than a Cucumber expression because the value is
// an unquoted list containing commas, spaces and parentheses -- there is no
// Cucumber parameter type that spans it, and `(` is optional-text syntax
// there rather than a literal.
//
// THE THREE ASSERTIONS ARE THE POINT OF THIS STEP, and they are three because
// no one of them notices every mutation acceptance-mutation makes to this
// column. WHICH ONE FIRES HAS CHANGED AGAIN, so read this against the current
// runner rather than against the classes earlier versions of this comment
// described.
//
// This column is now routed by VALUE_RULES to the tuple rule
// (scripts/acceptance-mutation/tuple-list.ts), which parses it as a list of
// fixed-arity numeric tuples ahead of the flat comma-list rule. It offers two
// mutation classes, and each is caught by a DIFFERENT one of the inclusions
// below:
//
//   component-change -- one component of one tuple gets a new value, e.g.
//   "(2, 2)" -> "(2, 10)". The pattern on screen never grows that cell, so
//   the FIRST inclusion fails: the table names a cell that is not shown.
//
//   swap-x-y -- one tuple's two components are transposed, e.g. Pulsar's
//   "(12, 9)" -> "(9, 12)". This is the class the REVERSE inclusion exists
//   for. When the transposed coordinate is itself already a true cell of the
//   same pattern -- reachable on 7 of the 8 patterns in this table, and the
//   Pulsar case above is exactly it, since (9, 12) is a real Pulsar cell --
//   the mutated table names a strictly SMALLER set than the pattern really
//   has, every member of which is on screen. "Every named cell is shown"
//   then passes VACUOUSLY, and only "and nothing else is" reports it. On the
//   remaining rows the transposed value lands off the shape and the first
//   inclusion catches it too; do not read that as the reverse inclusion being
//   redundant, it is the sole killer whenever the swap lands on the shape.
//
// THE COUNT NO LONGER CATCHES EITHER CLASS BY ITSELF -- both are same-length
// by construction (a splice, never an insertion or a deletion), so it passes
// against both. Keep it anyway, for two reasons that outlive today's rules:
// it is the auto-wait its own note below describes, and it is what reports a
// SHORTENED expected list if this column's shape ever stops satisfying the
// tuple grammar.
//
// That last case is not hypothetical, it is merely not this column's today.
// isTupleList is anchored and total: anything not WHOLLY a fixed-arity list
// of parenthesised integers falls through to mutateCommaList, which splits on
// ',' and can corrupt punctuation rather than a coordinate -- "(0, 2)" ->
// "(0, )2", a pair the regex above can no longer see, so the EXPECTED list
// silently gets shorter while the pattern on screen does not. A coordinate
// column can land outside that grammar while still looking exactly like
// coordinates: measured this pass over 40 seed keys, a half-cell world
// coordinate of the shape "(-32, -22.5)" -- the app's own default camera
// offset -- is rejected by isTupleList and shortens a pair-regex's view of it
// on 30 of 40 mutants. So the old class is history for THIS column and live
// for the next one. See tuple-list.ts's header and acceptance-mutation.md's
// honest-residual section, which state the same boundary from the runner's side.
//
// Keep all three regardless of which currently detects what.
Then(
  /^its live cells relative to the top-left corner of its bounding box should be (.+)$/,
  async ({ page }, cellList: string) => {
    const expected = parseCellList(cellList)

    await choosePatternFromLibrary(page, recallText(page, 'pattern'))
    await hoverCell(page, SHAPE_ANCHOR.x, SHAPE_ANCHOR.y)

    // Auto-waits for the preview React renders in response to the hover, so
    // the reads below are never racing a frame.
    await expect(previewCells(page)).toHaveCount(expected.length)

    const actual = (await previewCellPositions(page)).map(
      ([x, y]) => [x - SHAPE_ANCHOR.x, y - SHAPE_ANCHOR.y] as [number, number],
    )
    const shown = new Set(actual.map(describeCell))
    const named = new Set(expected.map(describeCell))

    expect([...named].filter((cell) => !shown.has(cell))).toEqual([]) // every cell the table names is on screen
    expect([...shown].filter((cell) => !named.has(cell))).toEqual([]) // and nothing else is
    expect(actual.length).toBe(expected.length) // and there are exactly that many
  },
)

When(
  'I place the {string} pattern with its top-left corner at \\({int}, {int}\\)',
  async ({ page }, name: string, x: number, y: number) => {
    await selectPattern(page, name)
    // Grid resolves the stamp's anchor from the tap's own pixels, so clicking
    // the cell IS aiming the pattern at it.
    await clickCell(page, x, y)
  },
)

// Arms a pattern and leaves it armed, with no cell chosen yet -- the "I place
// the ... pattern" step above both arms AND aims in one act, which cannot
// express a stamp aimed by the keyboard instead of by the pointer.
Given('I have armed the {string} pattern', async ({ page }, name: string) => {
  await openGrid(page)
  await selectPattern(page, name)
})

// ARMING A SECOND PATTERN, AND WHY THE ROUTE IS TWO PRESSES RATHER THAN ONE.
// Stamping is single-shot, so a pattern can only be replaced from the library
// -- and the Patterns button is a toggle whose first press while a pattern is
// armed CANCELS rather than opens. That is the app's own route and the only
// one a user has, which is why the two presses live here rather than in the
// Gherkin: the scenario states "instead", not how many times a button is
// clicked.
//
// THE toHaveCount(0) BETWEEN THE PRESSES IS AN ASSERTION, NOT A WAIT, and an
// earlier version of this comment claimed the opposite in both directions.
// Measured by architect with two probes, both reverted: the same assertion
// inserted BEFORE the first press also passes, and changing this one to
// toHaveCount(1) fails with Received: 0. The modal never opens on this press
// at all -- patternPlacement.ts's toggleLibrary returns INITIAL_PLACEMENT from
// `placing`, never `browsing` -- so there is no 0 -> 1 -> 0 transition to
// await, and the line settles on its first evaluation whether or not the
// cancel has landed. It cannot be what sequences the two presses.
//
// NOTHING SEQUENCES THEM AND NOTHING NEEDS TO. The race is real and resolves
// LOUDLY: a second press arriving before the first had landed would cancel
// again rather than open, and openPatternModal's own toHaveCount(1) is what
// reports that.
//
// THE CLAIM IT LOOKS LIKE IT HOLDS IS HELD ELSEWHERE, AND THAT ELSEWHERE HAS
// MOVED. It used to be hud-layout-and-shortcuts.e2e.spec.ts's "clicking
// Patterns again while a pattern is armed cancels placement instead of
// reopening the library"; `re-audit-hand-written-e2e-residue` found that claim
// was not residue in any of the four senses -- it is a stated product rule
// about toggleLibrary, expressible as a scenario -- and restated it as this
// feature's PAIR of cancel scenarios: "Clicking Patterns while a pattern is
// armed does not reopen the library" pins the library staying shut and the
// preview going away, and "Cancelling with the Patterns control leaves the
// next click a plain single-cell toggle" pins what the grid does afterwards.
// Two scenarios rather than one because an observation has to sit between
// the press and the click; the feature file's own comment records the
// measurement. So this line is still not the coverage of toggleLibrary's
// cancel-from-placing branch and must not be read as it; that pair is.
//
// IT IS KEPT FOR FAILURE LOCALIZATION. An implementation that opened the
// library from `placing` instead reds here, naming the press whose branch is
// wrong. Without it the same defect surfaces one line later and less legibly:
// openPatternModal clicks a Patterns button the open modal has made inert
// (choosePatternFromLibrary's own comment describes that inertness), so the
// step fails on an actionability timeout that says nothing about which press
// went the wrong way. One line for a legible failure.
//
// Contrast the wait in "I am aiming it at the cell at" below, which IS
// load-bearing synchronization rather than a guard: there the state genuinely
// transitions, and removing it lets the scenario pass against a preview that
// never rendered.
Given('I have armed the {string} pattern instead', async ({ page }, name: string) => {
  await patternsButton(page).click()
  await expect(patternLibraryModal(page)).toHaveCount(0) // guard, not a wait -- see above
  await openPatternModal(page)
  await choosePatternFromLibrary(page, name)
})

// AIMS AN ALREADY-ARMED PATTERN AND STAMPS IT, which the "I place the ...
// pattern with its top-left corner at" step above cannot express: that one
// arms AND aims in one act, so it would discard whatever the scenario had
// already armed and the switch would go unmeasured. The tail phrasing is
// copied from it deliberately, so both stamps name their anchor the same way.
When(
  'I stamp the armed pattern with its top-left corner at \\({int}, {int}\\)',
  async ({ page }, x: number, y: number) => {
    await clickCell(page, x, y)
  },
)

// PUTS THE POINTER OVER A CELL AND WAITS FOR THE PREVIEW TO ACTUALLY APPEAR.
// That wait is load-bearing rather than defensive, and for two distinct
// reasons across the scenarios that use it. Where the Then is "no pattern
// preview should be shown", the absence passes VACUOUSLY against a preview
// that never rendered at all, so establishing the preview exists here is what
// makes the later absence mean a cancel happened. Where the Then is about the
// cell the next click toggles, the aim is what makes the press under test
// cancel a LIVE placement rather than an idle one.
Given('I am aiming it at the cell at \\({int}, {int}\\)', async ({ page }, x: number, y: number) => {
  await hoverCell(page, x, y)
  await expect(previewCells(page)).not.toHaveCount(0)
})

Then('no pattern preview should be shown', async ({ page }) => {
  await expect(previewCells(page)).toHaveCount(0)
})

// MOVES A LIVE AIM, which is the whole act "the preview follows the aim" is
// about, and deliberately NOT the "I am aiming it at the cell at" Given above
// even though the two do the same thing to the browser. playwright-bdd matches
// a step by its text and never by its keyword, so reusing that text here would
// put a state-setting phrase in the one position where it is the act under
// test -- and a reader of the feature file could no longer tell which of the
// two aims the scenario is about. "instead" follows the arming step's own
// convention for the same distinction.
//
// NO WAIT HERE. The one that matters belongs to the Then below, which is where
// the transition can actually be named: waiting for "a preview exists" would
// settle instantly against the preview the Given already established.
When('I aim it at the cell at \\({int}, {int}\\) instead', async ({ page }, x: number, y: number) => {
  await hoverCell(page, x, y)
})

// WHICH CELLS THE PREVIEW COVERS, IN WORLD COORDINATES -- the same channel the
// shape step above reads all eight patterns through, and the reason this claim
// is expressible in Gherkin at all. The preview announces its own coordinates,
// so "the preview moved" is statable as which cells it now covers instead of
// as two measured bounding boxes, which no scenario may name.
//
// A regular expression rather than a Cucumber expression for the shape step's
// reason: the value is an unquoted list of parenthesised pairs, and `(` is
// optional-text syntax in a Cucumber expression rather than a literal.
//
// THE FIRST LINE IS A WAIT AND THE REST ARE THE ASSERTION, which is the
// opposite arrangement to the shape step and worth reading before copying
// either. There the count IS the wait, because arming a pattern takes the
// preview from nothing to n cells. Here the aim moves between two positions of
// the SAME pattern, so the count is n before and after, a toHaveCount settles
// on its first evaluation, and previewCellPositions -- which does not retry --
// would be free to read the pre-move frame. Anchoring on a cell of the NEW aim
// is the only assertion here that genuinely transitions.
//
// THREE ASSERTIONS, matching the shape step's discipline and for the same
// reason: named-but-absent catches a preview that moved to the wrong place,
// shown-but-unnamed catches one that did not move at all (or moved and left a
// copy behind), and the count catches a list this step could no longer parse.
// A preview that stayed at the previous aim fails the first two together,
// because the two aims this scenario uses cover disjoint cells.
//
// WHAT THIS STEP WAS SHOWN CATCHING. The fault it exists for is a preview that
// LATCHES -- movePreviewTo ignoring a move once a preview is up. That probe is
// an edit to src/, which product may not take, so it was routed to `architect`
// and taken there: whole-suite, no --grep, it reds 2 of 128 -- this scenario at
// the anchor below (`Pattern preview cell 12, 12` resolved to 0 elements over
// 14 retries) and the hand-written test this scenario replaced, which the same
// pass then deleted. Nothing else in the suite aims twice, and that run is what
// says so rather than an argument about which flows hover.
//
// AND WHAT PRECEDED IT, kept because it is a different observation and because
// it is the one product could make for itself: rewriting this scenario's
// expected list to the FIRST aim's cells -- (5, 5), (6, 5), (5, 6), (6, 6) --
// reds exactly one test of 128, this scenario, at the same anchor. That is a
// surrogate and was labelled one: it proves the clause is live and reads the
// post-move frame, not that the app tracks the pointer. The latch probe is what
// proves the second thing, and the two together are why the pixel-measuring
// test could go.
//
// NOTE WHICH ASSERTION REPORTED IT -- the retrying anchor, not either
// inclusion. That is expected rather than a flaw: the anchor is the first
// clause to look at the new position, so a preview in the wrong place is
// always reported there and the inclusions only ever speak about a preview
// that reached the right anchor with the wrong shape around it. Do not read
// the anchor as a wait that happens to fail.
Then(/^the pattern preview should cover exactly (.+)$/, async ({ page }, cellList: string) => {
  const expected = parseCellList(cellList)
  const [anchorX, anchorY] = expected[0]

  await expect(previewCellAt(page, anchorX, anchorY)).toHaveCount(1)

  const actual = await previewCellPositions(page)
  const shown = new Set(actual.map(describeCell))
  const named = new Set(expected.map(describeCell))

  expect([...named].filter((cell) => !shown.has(cell))).toEqual([]) // every cell the scenario names is on screen
  expect([...shown].filter((cell) => !named.has(cell))).toEqual([]) // and nothing else is
  expect(actual.length).toBe(expected.length) // and there are exactly that many
})

// THE SAME PRESS THE "instead" STEP ABOVE MAKES ON ITS WAY BACK TO THE
// LIBRARY, and deliberately a step of its own rather than that one's first
// line. There the press is a means to an end and the scenario is about which
// pattern gets stamped; here the press IS the act under test, so it has to be
// visible in the Gherkin. Registered as a When and written in a Given position
// by its scenario, which playwright-bdd matches by text rather than by keyword
// -- the same borrowing "And I press Escape" already relies on.
When('I click the Patterns control again', async ({ page }) => {
  await patternsButton(page).click()
})

// The negative half of the cancel, and the half no other scenario states: the
// Escape route has no library to reopen, so only the Patterns route can get
// this wrong.
Then('the pattern library should not be open', async ({ page }) => {
  await expect(patternLibraryModal(page)).toHaveCount(0)
})

// THE LIBRARY MERELY OPEN, WITH NOTHING CHOSEN FROM IT. Every other route into
// the library in this module goes on to read it or arm from it; the feature
// that borrows this one is about the app BEHIND the library, so the library
// being up is the whole of its setup.
//
// Defined here rather than beside its borrower because the library is what it
// is about -- the same reason "an empty grid" lives in cell-life-and-death.ts
// and is borrowed by five features. openPatternModal's own toHaveCount(1) is
// what makes this a state and not merely a click.
Given('the pattern library is open', async ({ page }) => {
  await openPatternModal(page)
})
