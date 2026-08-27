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
// column. Which one fires has CHANGED, so read this against the current
// runner rather than the shapes this comment used to cite.
//
// acceptance-mutation's mutateCommaList splits the cell on ',' and corrupts
// one part in place (scripts/acceptance-mutation/mutation-rules.ts). It never
// removes an item, but what it does to the one it picks moved with the
// comma-list-mutants-are-all-syntax-breaking slice: stripParenAffixes now
// exposes the digits inside a "(x, y)" fragment as the integers they are, so
// every mutant of this column is a SAME-LENGTH coordinate change. Measured
// over the current table, all 8 rows mutate to a well-formed list of exactly
// as many pairs, carrying one coordinate the table never named -- "(1, 1)"
// -> "(4, 1)" for Block. The count passes against that; the first inclusion
// below is what fails, and before that slice it was exercised by nothing.
//
// The other class is the one this comment used to describe as the only one:
// "(0, 2)" becoming "(0, )2", a pair the regex above can no longer see, so
// the EXPECTED list silently gets shorter while the pattern on screen does
// not -- and "each expected cell is present" passes against a shortened list.
// The count is what reports it, with the reverse inclusion catching it if the
// count is removed. It is closed only for the bracket shape written here:
// stripParenAffixes strips parens and nothing else, so an "[x, y]" or
// "{a, b}" column would fragment unbalanced exactly as before. Measured at
// unit level -- 40 seeds per shape, paren 40/40 same-length, square bracket
// 0/40.
//
// So keep all three regardless of which currently detects what, and keep the
// count in particular for the auto-wait its own note below describes.
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
