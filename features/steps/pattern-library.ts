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
// borrows three from cell-life-and-death.ts -- "an empty grid", "a live cell
// at (<x>, <y>)" and "the cell at (<x>, <y>) should be alive" -- which it
// gets by writing the same text, and by defining nothing.
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
// for the next one. See tuple-list.ts's header and CLAUDE.md's residual
// paragraph, which state the same boundary from the runner's side.
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
