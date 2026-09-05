// SCREENPLAY: the PageElements -- how each thing this suite talks to is
// REACHED, and nothing about what it currently says.
//
// WHAT MUST LIVE HERE, and it is a floor rather than a fence. A selector
// string or an accessible name belongs in this file if it is reached from more
// than one module, if the barrel publishes it, or if it would otherwise be
// built from a raw constant imported out of src/test-support. aliveCells is
// that last case and is why it exists: questions.ts's aliveCellCount built its
// own Locator from ALIVE_CELL_SELECTOR, which put a selector constant in a
// module whose job is reading. Anything meeting one of those is one edit in
// one file when the app changes how it announces something, rather than a grep
// across the directory.
//
// WHAT MAY STAY WITH ITS CALLER, and does. A `page.*` query used by exactly one
// function in the module that owns the act it belongs to (interactions.ts's
// four toolbar buttons; questions.ts's zoom badge and generation counter), and
// any sub-query chained off a locator this file handed over
// (patternCategoryInLibrary's `h3, button`, axisLabelValues' label pattern,
// visibleProportionPercent's by-id lookup of the description an
// aria-describedby names). Those are reading mechanics inseparable from the
// algorithm around them -- hoisting them here would split a query from the only
// logic that gives it meaning, and this file would start holding fragments
// nobody can name.
//
// SCOPE OF THAT CLAIM, MEASURED RATHER THAN ASSERTED. No module under
// features/steps/ builds a locator at all -- it cannot, its import allowlist
// forbids it -- so for the generated step layer this file really is the only
// place a selector is named. The seven hand-written *.e2e.spec.ts files still
// build their own, grep-counted at 28 `page.locator`/`page.getBy` sites. They
// are not in scope here, and a header claiming "every locator in features/"
// would be false.
//
// Both figures moved in `triage-paired-specs` and neither moved because a
// locator was hoisted: that triage deleted 35 duplicated tests and one whole
// spec file (infinite-grid, whose claims its .feature now makes), taking their
// locators with them. Recount with
// `grep -c "page\.locator\|page\.getBy" features/*.e2e.spec.ts` rather than
// adjusting these by subtraction -- the per-file drop is not uniform, and two
// of the seven (grid-reference-lines, mouse-wheel-controls) now build no
// locator of their own at all and reach everything through the barrel.
//
// NOT HERE: CELL_ALIVE_ATTR / CELL_ALIVE_VALUE / CELL_DEAD_VALUE. Those say how
// to READ what a cell announces, not how to reach it, so questions.ts and
// expectations.ts import them from src/test-support/cellQuery.ts directly
// rather than through this file. Ruled in the screenplay-e2e-decomposition
// review rather than left as drift: routing them through would make this
// module a general test-support pass-through and have it re-export values it
// never uses.
//
// Questions read these and Interactions drive them, and neither asks the other.
// That is what keeps `interactions -> questions` off the dependency graph: an
// interaction that needed a thumb's box measures the element directly rather
// than asking a Question for it.
import { type Locator, type Page } from '@playwright/test'
import { ALIVE_CELL_SELECTOR, CELL_SELECTOR, cellSelector } from '../../src/test-support/cellQuery.ts'
import { rulerGroupLabel } from '../../src/test-support/rulerQuery.ts'

export function cellLocator(page: Page, x: number, y: number): Locator {
  return page.locator(cellSelector(x, y))
}

// Every MOUNTED live cell, regardless of which one. questions.ts's
// aliveCellCount is the only reader -- it only ever counts these, never
// reaches inside one, so there is no reason for it to hold a Locator itself.
export function aliveCells(page: Page): Locator {
  return page.locator(ALIVE_CELL_SELECTOR)
}

export function patternsButton(page: Page): Locator {
  return page.locator('button[aria-label="Open pattern library"]')
}

// The library dialog, by the name it actually announces. That name comes from
// PatternLibraryModal's <DialogTitle>, which Headless UI registers as the
// dialog's aria-labelledby -- there is no aria-label to read, and the one that
// used to sit on the Dialog was superseded by the title and never named
// anything (deleted in the `mutate-accessible-names` slice).
//
// exact: true is deliberate. getByRole's default name matching is
// case-insensitive AND substring, which is exactly what let this locator carry
// 'Pattern library' -- wrong case, and written against the deleted attribute --
// while still passing. The accessible name is this repo's black-box contract,
// so it is matched as the whole string a screen reader would announce.
export function patternLibraryModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Pattern Library', exact: true })
}

// The armed pattern's preview cells. PatternPreview.tsx renders one per cell
// the pattern WOULD occupy if stamped at the cell under the pointer, each
// labelled with its own world coordinate, and it applies no clipping -- so
// this is every cell of the armed pattern, not just the on-screen ones.
export function previewCells(page: Page): Locator {
  return page.locator('[aria-label^="Pattern preview cell"]')
}

// One axis's ruler, reached through the accessible tree: GridRuler wraps each
// axis's labels in a role="group" named by rulerGroupLabel(axis), so a column
// number and a row number -- which render as the same bare digit -- are told
// apart by the name an AT would announce, not by the Tailwind class each label
// is pinned to. That class selector is what used to live here; the
// `ruler-label-axis-affordance` slice replaced it, and the promise recorded
// next to it held -- this was the only edit features/ needed.
// Not a barrel export, for scrollbarThumb's reason below: axisLabelValues is
// what a caller wants -- the numbers written along an axis -- and the locator
// only ever exists to be read off. It WAS barrel-exported, for
// grid-reference-lines.e2e.spec.ts's per-coordinate rows, and
// `triage-paired-specs` deleted those; the one reader left is a sibling
// module, which is exactly the condition that keeps scrollbarThumb off the
// barrel too.
// Hoisted out of questions.ts by smooth-zoom-transitions' VERIFY pass, under
// this file's own rule: it is now reached from two modules -- questions.ts
// reads the percentage off it, interactions.ts waits for it to stop changing
// -- and a selector reached from more than one module belongs here.
export function zoomBadge(page: Page) {
  return page.getByText(/^\d+%$/)
}

export function rulerGroup(page: Page, axis: 'x' | 'y'): Locator {
  return page.getByRole('group', { name: rulerGroupLabel(axis) })
}

export type ScrollbarOrientation = 'horizontal' | 'vertical'

// Not a barrel export, deliberately: questions.ts's visibleProportionPercent
// and thumbPositionPercent and interactions.ts's dragScrollbarThumb are what a
// caller wants -- the locator itself only ever exists to be read off or
// dragged. It was file-private before the split and is module-exported only
// because those three readers now live in two sibling modules.
export function scrollbarThumb(page: Page, orientation: ScrollbarOrientation): Locator {
  return page.locator(`[role="scrollbar"][aria-orientation="${orientation}"]`)
}

// WHEREVER THE KEYBOARD CURRENTLY IS, reached as the browser's own :focus.
//
// Once only live cells have elements of their own, there is no per-coordinate
// button to ask "are you focused" -- the grid carries ONE focus cursor and
// this is it. `:focus` rather than a class or an id because focus is a state
// the browser owns and an assistive technology reads; anything else would be a
// second, drifting copy of it.
//
// Read off by questions.ts (its coordinate, its box, what it announces) and by
// tasks.ts (focusGridCell steers by it). Not a barrel export: like
// scrollbarThumb above, the locator itself only ever exists to be read.
export function focusedCellElement(page: Page): Locator {
  return page.locator(':focus')
}

// THE GRID'S SINGLE TAB STOP -- the one cell carrying tabindex="0" under the
// roving-tabindex model, which is where sequential navigation enters the grid.
//
// Reached through tabindex, and that is NOT a reach-around: a reach-around
// stands in for a perception the accessible tree does not offer, and roving
// tabindex IS that perception -- the APG-published expression of "this whole
// composite is one tab stop", which is exactly the claim the grid makes. So it
// owes no deletion trigger and no affordance idea.
//
// It is used only to ESTABLISH a focus position in a Given, never to assert
// one. What the tab order actually does is asserted by the three scenarios that
// drive real Tab presses, so routing setup through this erodes no coverage.
// Built on CELL_SELECTOR so "this is a cell" stays encoded in one place.
export function rovingGridCell(page: Page): Locator {
  return page.locator(`${CELL_SELECTOR}[tabindex="0"]`)
}

// THE HOVER INDICATOR -- the single cursor-following affordance that replaced
// ~19,680 per-cell `hover:` rules.
//
// Reached by its own id, on exactly the #grid-content precedent: an id declared
// in the component (HoverIndicator.tsx's HOVER_INDICATOR_ID, asserted by its own
// unit test) and written here as a literal, which is how every other id crosses
// into this layer -- perf/ declares its own '#grid-content' the same way. The
// alternative, importing the constant, would pull a React component into
// Playwright's module graph for one string.
//
// It is deliberately aria-hidden and that is correct, not a gap: this is
// decoration, pointer-only, and a screen-reader user's equivalent is the focus
// cursor. So no accessible name is owed here and none should be added -- one
// would be a test hook wearing an affordance's name, which this repo has ruled
// out twice. An id is the right handle for a thing with no accessible identity,
// which is exactly why #grid-content has one too.
export function hoverIndicator(page: Page): Locator {
  return page.locator('#hover-indicator')
}

// THE APPEARANCE CONTROL -- how a player says whether they want a light
// screen, a dark one, or whatever their system is currently asking for.
//
// Drafted as a PROPOSAL, when nothing in src/ answered to it and every
// scenario in appearance-preference.feature was red -- the ordinary state of a
// contract written before its implementation. Architect's CONTRACT pass
// ratified it unchanged and coder built it, so this is now a description of
// what the app ships: a single control whose accessible name is `Appearance`
// and whose three options are named `Light`, `Dark` and `Follow system` --
// sentence case with no role word, the convention every name this app ships
// already follows. It is a native <select> in src/components/GridToolbar.tsx,
// which is what getByRole('combobox') resolves here.
//
// What survives of the proposal is the seam it argued for, and it is still
// true: the affordance is named in this one function and driven and read in
// exactly two more (interactions.ts's chooseAppearance, questions.ts's
// appearancePreference). Swapping the select for a radio group or a cycling
// button is a change to those three, and no .feature line moves.
export function appearanceControl(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Appearance', exact: true })
}

// What a player wants: a fixed appearance, or whichever one the system is
// asking for at the time.
export type AppearancePreference = 'light' | 'dark' | 'system'

// What is actually on screen once that preference has been resolved against
// the system. There is no 'system' here on purpose -- following the system
// still puts exactly one of these two in front of the player.
export type Appearance = 'light' | 'dark'

// The option labels the control announces, in one place, so a step reads and
// drives the same strings.
export const APPEARANCE_OPTION_LABEL: Record<AppearancePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Follow system',
}
