// SCREENPLAY: the Questions -- each one reads what the app is currently
// showing and returns it, stating nothing about whether that is right.
//
// That non-assertion is the contract, and it is what makes a Question usable
// inside `expect.poll(...)`, as grid-reference-lines.e2e.spec.ts and
// camera-pan-and-zoom.e2e.spec.ts both do: the caller picks the matcher and
// owns the retry window. A Question that asserted internally would take both
// decisions away. rules/no-expect-in-screenplay-questions.yml holds this
// module to it by banning the `expect` import outright, which is why an
// assertion over one of these belongs in expectations.ts.
//
// Questions ask elements.ts for the identities it owns, and build only the
// queries elements.ts's header licenses: a `page.getByText` read by exactly one
// function here (the zoom badge, the generation counter), sub-queries chained
// off a locator elements.ts handed over, and the by-id lookup of an element
// another element's aria-describedby names (visibleProportionPercent), where
// the id is read off the page rather than written down anywhere. That header
// states the line; it is not "no locators at all", which this file would not
// satisfy.
//
// CELL_ALIVE_ATTR and its two values come from src/test-support/cellQuery.ts
// directly rather than through elements.ts, and parseVisibleProportionText
// comes from src/test-support/scrollbarQuery.ts under the same licence. They
// say how to READ what a control announces, not how to reach it, so they fall
// outside that module's charter -- ruled in the screenplay-e2e-decomposition
// review, so not drift to tidy back.
import { type Page } from '@playwright/test'
import { CELL_ALIVE_ATTR, CELL_ALIVE_VALUE, CELL_DEAD_VALUE } from '../../src/test-support/cellQuery.ts'
import { parseVisibleProportionText } from '../../src/test-support/scrollbarQuery.ts'
import {
  aliveCells,
  cellLocator,
  patternLibraryModal,
  previewCells,
  rulerGroup,
  scrollbarThumb,
  type ScrollbarOrientation,
} from './elements.ts'

// Module-private: generationCount below is the only reader. The raw text is
// this file's business, the number is what a step or a spec asks for.
async function generationText(page: Page) {
  return page.getByText(/^Generation: \d+$/).textContent()
}

export async function zoomPercent(page: Page): Promise<number> {
  const text = await page.getByText(/^\d+%$/).textContent()
  return Number(text!.replace('%', ''))
}

export async function elementAtPoint(page: Page, x: number, y: number): Promise<string | null> {
  return page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.getAttribute('aria-label') ?? null, [
    x,
    y,
  ] as const)
}

// WHICH CATEGORY THE LIBRARY LISTS A PATTERN UNDER, established by reading
// order and nothing else.
//
// The modal renders one section per category: a heading, then that category's
// pattern buttons (PatternLibraryModal.tsx). Membership is expressed exactly
// the way a sighted reader takes it -- the heading a name appears beneath --
// and there is no attribute, id or aria-labelledby tying the two together.
// That absence is deliberate and was ruled on: an affordance added so a test
// could read it more conveniently would be a test hook wearing an
// affordance's name, and it would also stop this function checking the thing
// a user actually relies on. So the reading order IS the contract, and this
// is the one place features/ encodes it.
//
// h3 rather than getByRole('heading'): the two node kinds have to be
// collected in a SINGLE document-ordered query for the interleaving to mean
// anything, and no by-role locator spans two roles. The dialog's own title is
// an h2, so it cannot be mistaken for a category, and the only buttons inside
// the dialog are the pattern buttons themselves.
export async function patternCategoryInLibrary(page: Page, patternName: string): Promise<string> {
  const entries = await patternLibraryModal(page)
    .locator('h3, button')
    .evaluateAll((nodes) => nodes.map((node) => ({ heading: node.tagName === 'H3', text: node.textContent?.trim() })))

  let heading: string | undefined
  for (const entry of entries) {
    if (entry.heading) heading = entry.text
    else if (entry.text === patternName) {
      if (heading === undefined) throw new Error(`"${patternName}" is listed before any category heading`)
      return heading
    }
  }
  throw new Error(
    `The pattern library lists no "${patternName}". It lists: ${entries.map((entry) => entry.text).join(', ')}`,
  )
}

const PREVIEW_CELL_LABEL = /^Pattern preview cell (-?\d+), (-?\d+)$/

// The world coordinates the preview is currently showing. Pairs with
// elements.ts's previewCells: that one is for counting and waiting, this one
// for reading the shape out.
export async function previewCellPositions(page: Page): Promise<Array<[number, number]>> {
  const labels = await previewCells(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')))
  return labels.map((label) => {
    const match = PREVIEW_CELL_LABEL.exec(label ?? '')
    if (!match) throw new Error(`A preview cell announces "${label}", which names no coordinate`)
    return [Number(match[1]), Number(match[2])]
  })
}

// Where a world cell's top-left corner currently sits on screen -- i.e. the
// pixel worldToScreen puts it at. Comparing this against CENTER (where the
// origin sits under the default camera) is how a step states which way the
// camera moved without ever naming a camera field.
export async function cellScreenPosition(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = await cellLocator(page, x, y).boundingBox()
  if (!box) throw new Error(`Cell ${x}, ${y} is not mounted, so it has no screen position`)
  return { x: box.x, y: box.y }
}

// Aliveness as the domain word rather than as the attribute value, so a step
// can compare an observed outcome against a Gherkin Examples cell directly.
export async function cellState(page: Page, x: number, y: number): Promise<'alive' | 'dead'> {
  const value = await cellLocator(page, x, y).getAttribute(CELL_ALIVE_ATTR)
  if (value === CELL_ALIVE_VALUE) return 'alive'
  if (value === CELL_DEAD_VALUE) return 'dead'
  throw new Error(`Cell ${x}, ${y} announces ${CELL_ALIVE_ATTR}="${value}", which is neither alive nor dead`)
}

// Counts only MOUNTED live cells -- the grid is infinite, so there is no such
// thing as counting all of them. Sound wherever every cell that could change
// is inside the mounted window.
export function aliveCellCount(page: Page): Promise<number> {
  return aliveCells(page).count()
}

export async function generationCount(page: Page): Promise<number> {
  const text = await generationText(page)
  return Number(text!.replace('Generation: ', ''))
}

// The coordinate numbers currently on show along one edge of the viewport --
// what a player reads off the ruler. Read per label rather than by splitting
// the group's own text: an empty ruler (pan far enough and no major gridline
// is in view) yields an empty list here, where ''.split('\n').map(Number)
// would yield [NaN]. No other on-screen text inside a ruler group could match
// the pattern -- the zoom badge and generation counter are outside it.
export async function axisLabelValues(page: Page, axis: 'x' | 'y'): Promise<number[]> {
  const texts = await rulerGroup(page, axis)
    .getByText(/^-?\d+$/)
    .allTextContents()
  return texts.map(Number)
}

// How much of the grid the scrollbar says is currently IN VIEW along one
// axis, as the integer percentage it announces: 100 means all of the content
// fits. Read from the accessible description the thumb points at with
// aria-describedby -- what a screen-reader user is actually told -- rather
// than from the thumb's rendered length, which is paint and is separately
// clamped to a minimum, so the two legitimately disagree at extreme spans.
//
// This replaced thumbTrackFraction, which measured the thumb's box against
// its parent track's because the app announced its proportion nowhere. That
// was features/'s last ARIA reach-around, and the
// scrollbar-visible-proportion-affordance slice paid it off: an announced
// integer also serves "fills its track" (100) and "covers a quarter" (25)
// exactly, so the tolerances the pixel read needed are gone with it.
//
// Resolving aria-describedby by hand rather than with
// toHaveAccessibleDescription is forced rather than a workaround: that
// matcher is an assertion, and this module may not import expect
// (rules/no-expect-in-screenplay-questions.yml). Both throws mirror
// cellState's -- a description that cannot be resolved fails by name instead
// of returning a silent NaN, which a caller would compare against 100 and
// read a pass or a failure out of for the wrong reason. A single id matching
// several elements is caught for free by Playwright's strict mode.
export async function visibleProportionPercent(page: Page, orientation: ScrollbarOrientation): Promise<number> {
  const describedBy = (await scrollbarThumb(page, orientation).getAttribute('aria-describedby')) ?? ''
  const ids = describedBy.split(/\s+/).filter(Boolean)
  if (ids.length !== 1)
    throw new Error(
      `The ${orientation} scrollbar's aria-describedby names ${ids.length} ids ("${describedBy}"), not one, so it describes no single visible proportion`,
    )
  const text = (await page.locator(`[id="${ids[0]}"]`).textContent()) ?? ''
  const percent = parseVisibleProportionText(text)
  if (percent === null)
    throw new Error(`The ${orientation} scrollbar describes itself as "${text}", which names no visible proportion`)
  return percent
}

// Where along its track the thumb sits, 0 (start) to 100 (end), read from the
// accessible value the scrollbar announces rather than measured in pixels.
export async function thumbPositionPercent(page: Page, orientation: ScrollbarOrientation): Promise<number> {
  const value = await scrollbarThumb(page, orientation).getAttribute('aria-valuenow')
  return Number(value)
}
