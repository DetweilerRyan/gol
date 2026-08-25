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
// thumbTrackFraction's `..`). Those are reading mechanics inseparable from the
// algorithm around them -- hoisting them here would split a query from the only
// logic that gives it meaning, and this file would start holding fragments
// nobody can name.
//
// SCOPE OF THAT CLAIM, MEASURED RATHER THAN ASSERTED. No module under
// features/steps/ builds a locator at all -- it cannot, its import allowlist
// forbids it -- so for the generated step layer this file really is the only
// place a selector is named. The eight hand-written *.e2e.spec.ts files still
// build their own, grep-counted at 35 `page.locator`/`page.getBy` sites, and
// were deliberately left untouched by the decomposition. They are not in scope
// here, and a header claiming "every locator in features/" would be false.
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
import { ALIVE_CELL_SELECTOR, cellSelector } from '../../src/test-support/cellQuery.ts'
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
export function rulerGroup(page: Page, axis: 'x' | 'y'): Locator {
  return page.getByRole('group', { name: rulerGroupLabel(axis) })
}

export type ScrollbarOrientation = 'horizontal' | 'vertical'

// Not a barrel export, deliberately: questions.ts's thumbTrackFraction and
// thumbPositionPercent and interactions.ts's dragScrollbarThumb are what a
// caller wants -- the locator itself only ever exists to be measured or
// dragged. It was file-private before the split and is module-exported only
// because those three readers now live in two sibling modules.
export function scrollbarThumb(page: Page, orientation: ScrollbarOrientation): Locator {
  return page.locator(`[role="scrollbar"][aria-orientation="${orientation}"]`)
}
