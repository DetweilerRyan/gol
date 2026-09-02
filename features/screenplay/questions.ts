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
import { ORIGIN_RULER_X, ORIGIN_RULER_Y, recall } from './notepad.ts'
import {
  aliveCells,
  cellLocator,
  focusedCellElement,
  rovingGridCell,
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

// WHICH ELEMENT THE BROWSER'S HIT-TEST RETURNS AT A PIXEL -- a STACKING
// question, and NOT how this app resolves a click.
//
// Reach for this only to ask "what is on top here". A real click never goes
// through document.elementFromPoint: useGridPointerGestures takes pointer
// capture on #grid-content, so the click retargets to the container and
// Grid's onTap resolves the cell arithmetically through screenToWorld. The
// two disagree, and by a measured amount -- elementFromPoint is loose by
// ~0.9px, favouring the later-in-DOM sibling, at every zoom level and every
// device pixel ratio, while a real click is exact (click != rect was 0 of 41
// in every configuration measured). A hit-test defect filed against this app
// was traced to exactly that looseness in this function and retired as a
// harness artifact.
//
// So this is sound for a stacking or occlusion question -- is the thumb on
// top of the cell here (grid-scrollbars.e2e.spec.ts) -- and for a
// boundary-insensitive one: "some cell is here" rather than which
// (hud-layout-and-shortcuts.e2e.spec.ts), or a before/after comparison of
// this function against itself (mouse-wheel-controls.e2e.spec.ts).
//
// It is the WRONG instrument for "where does a cell render", and asking it
// that way is worse than the ~0.9px suggests: the answer is cell-granular, so
// a sample point taken at a cell's own corner -- which CENTER is -- passes
// from ~0.9px before that corner to a full cell past it. Use
// cellScreenPosition below, which reads the box origin and compares exactly.
// camera-pan-and-zoom.e2e.spec.ts's header records that swap and the
// measurement behind it.
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
//
// DEAD HAS TWO SHAPES, AND BOTH ARE CORRECT ANSWERS. Once only live cells are
// rendered, most dead cells have no element at all, so absence IS the answer
// rather than a failure to find one -- but not every dead cell is absent: the
// focus cursor stays mounted wherever the keyboard is, alive or not, which is
// exactly what the space-bar scenario asserts against. A reader who expects one
// shape and finds the other has not found a bug.
//
// ABSENCE IS ONLY SOUND BECAUSE THE CALLERS ANCHOR IT. On its own "no element"
// is equally satisfied by the wrong camera, a renamed label and a crashed app,
// so every step that reads a dead cell either runs inside withCellInView (which
// establishes the camera) or sits in a scenario whose other clauses read a live
// cell through the same selector.
export async function cellState(page: Page, x: number, y: number): Promise<'alive' | 'dead'> {
  const cell = cellLocator(page, x, y)
  if ((await cell.count()) === 0) return 'dead'
  const value = await cell.getAttribute(CELL_ALIVE_ATTR)
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

// The label every cell announces itself by, as a pattern rather than as a
// format this layer could build: it is read off whatever currently has focus
// and never reconstructed from an expected coordinate, so a focus that landed
// one cell away is a mismatch rather than a match against itself.
const FOCUSED_CELL_LABEL = /^Cell (-?\d+), (-?\d+)$/

// WHICH CELL THE KEYBOARD IS ON, or null if the focus is not in the grid at
// all. The null case is the whole of "no cell should be focused" -- the claim
// that the grid is a SINGLE stop in the tab order rather than one stop per
// mounted cell -- so it is a real answer here and not an error.
export async function focusedCell(page: Page): Promise<[number, number] | null> {
  const element = focusedCellElement(page)
  if ((await element.count()) === 0) return null
  const match = FOCUSED_CELL_LABEL.exec((await element.getAttribute('aria-label')) ?? '')
  return match ? [Number(match[1]), Number(match[2])] : null
}

// WHICH CELL THE GRID WOULD RESUME AT -- the roving cursor, read from the one
// cell carrying the grid's tab stop, whether or not the document's focus is
// currently inside the grid at all.
//
// Distinct from focusedCell above, and the difference is the whole reason this
// exists: focusedCell reads :focus, which is where the keyboard is NOW, while
// this reads where the grid REMEMBERS being. They coincide whenever the grid
// holds focus, and only this one still answers after focus has moved away --
// which is exactly the state an absence assertion has to rule out, since the
// cursor's cell stays mounted even when it is out of range.
export async function rovingCell(page: Page): Promise<[number, number] | null> {
  const element = rovingGridCell(page)
  if ((await element.count()) === 0) return null
  const match = FOCUSED_CELL_LABEL.exec((await element.getAttribute('aria-label')) ?? '')
  return match ? [Number(match[1]), Number(match[2])] : null
}

// Where the focus cursor is painted. Used only for the two clauses about the
// EDGE of the view -- how far a Home/End jump goes, and that arrowing off the
// edge brings the cursor back -- which are relations between two rendered
// boxes and have no coordinate form.
export async function focusedCellBox(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await focusedCellElement(page).boundingBox()
  if (!box) throw new Error('No cell has keyboard focus, so there is no focus cursor to measure')
  return box
}

// The grid's own viewport, so an edge clause compares against what is actually
// on screen rather than against playwright.config.ts's 1280x900 restated here.
export async function viewportBox(page: Page): Promise<{ width: number; height: number }> {
  const size = page.viewportSize()
  if (!size) throw new Error('The page reports no viewport, so nothing can be said about what is in view')
  return size
}

// WHETHER THE CELL UNDER THE FOCUS IS ALIVE, in the domain's own word, read
// from the accessible description the focus cursor points at with
// aria-describedby -- the same channel, and the same by-id resolution, that
// visibleProportionPercent already reads a scrollbar's proportion through.
//
// NOT aria-pressed. That attribute is the right ARIA state for a toggle and
// stays exactly where it is, but what it makes a screen reader say is
// "pressed" / "not pressed", which says nothing about a cell being alive. With
// dead cells no longer rendered, this description is the entire channel a
// keyboard-only player has for reading the board, so it has to carry the
// domain word.
//
// THE DESCRIPTION CARRIES THE STATE AND NOT THE COORDINATE, deliberately, and
// this is the one thing to preserve if it is ever rewritten. The coordinate is
// already the focus cursor's accessible NAME, which a screen reader announces
// on landing; repeating it here would produce "Cell 1, 0, button, not pressed,
// Cell 1, 0 dead" -- the same double announcement a live region was rejected
// for, one channel over. The scenario that reads this asks focusedCell above
// for the coordinate and this function for the state, so both halves are still
// READ off the page and neither is reconstructed from what was expected.
//
// Returned whole rather than parsed: the caller checks the state word is in it
// and pins no other wording.
export async function focusedCellAnnouncement(page: Page): Promise<string> {
  const describedBy = (await focusedCellElement(page).getAttribute('aria-describedby')) ?? ''
  const ids = describedBy.split(/\s+/).filter(Boolean)
  if (ids.length !== 1)
    throw new Error(
      `The focused cell's aria-describedby names ${ids.length} ids ("${describedBy}"), not one, so it announces no single description`,
    )
  return (await page.locator(`[id="${ids[0]}"]`).textContent()) ?? ''
}

// WHERE ONE COORDINATE'S RULER LABEL SITS ON SCREEN, along its own axis.
//
// This is the origin-tracking instrument for every step that says how far the
// camera moved, and it replaced reading a DEAD cell's box for it. A cell at the
// origin is not available once only live cells render -- a step would have to
// seed one, and the step that would have to do the seeding is shared with
// grid-scrollbars' empty-grid scenario, which would stop being about an empty
// grid. The ruler needs nothing seeded: it is drawn from the camera alone, it is
// always on screen while the coordinate is in view, and it is reached through
// the same role="group" axis affordance axisLabelValues already reads.
//
// USE IT AS A DIFFERENCE, NEVER AS AN ABSOLUTE. RulerLabel offsets each label
// from its coordinate's own pixel by a small constant so the digits clear the
// gridline they mark, and this suite deliberately does not know that constant --
// encoding it here would be a copy of a styling decision that could drift. Every
// caller compares two readings of the same label, where the offset cancels
// exactly; the absolute pixel is the one thing this function's answer does NOT
// give you.
export async function axisLabelPx(page: Page, axis: 'x' | 'y', coordinate: number): Promise<number> {
  const box = await rulerGroup(page, axis).getByText(String(coordinate), { exact: true }).boundingBox()
  if (!box) throw new Error(`The ${axis} ruler shows no label for ${coordinate}, so its position cannot be read`)
  return axis === 'x' ? box.x : box.y
}

// Both axes at once, which is what a camera displacement is measured in.
export async function originRulerPx(page: Page): Promise<{ x: number; y: number }> {
  return { x: await axisLabelPx(page, 'x', 0), y: await axisLabelPx(page, 'y', 0) }
}

// HOW FAR THE ORIGIN HAS MOVED ON SCREEN since the centered-origin Given
// recorded where it started -- which is what every "the camera should have
// moved ..." step in three different features is actually asserting.
//
// The subtraction is the point: it is a difference of two readings of the same
// ruler label, so RulerLabel's own offset from the coordinate cancels and this
// suite never has to know it. Reading the baseline off the notepad rather than
// re-deriving it is forced by when these steps run -- the camera has already
// moved by then, and where it started is no longer observable.
export async function originDisplacement(page: Page): Promise<{ x: number; y: number }> {
  const now = await originRulerPx(page)
  return { x: now.x - recall(page, ORIGIN_RULER_X), y: now.y - recall(page, ORIGIN_RULER_Y) }
}
